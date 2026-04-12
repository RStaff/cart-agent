import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NodeStatus = "live" | "unknown" | "down";

interface Metric {
  label: string;
  value: string;
}

interface Action {
  label: string;
  kind: "open" | "copy";
  href?: string;
  value?: string;
}

function safeRead(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function safeExec(command: string, timeout = 5000) {
  try {
    return execSync(command, {
      timeout,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function safeJsonParse<T>(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function shortSha(value: string | null) {
  return value ? value.slice(0, 7) : "unknown";
}

function formatTimestamp(value: string | null) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeCount(value: string | null) {
  const numeric = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseHttpStatus(target: string) {
  const code = safeExec(`curl -s -o /dev/null -w '%{http_code}' --max-time 4 "${target}"`, 4500);
  const numeric = Number.parseInt(code ?? "", 10);

  if (!numeric) return { status: "down" as NodeStatus, code: "000" };
  if (numeric >= 200 && numeric < 400) return { status: "live" as NodeStatus, code: String(numeric) };
  return { status: "unknown" as NodeStatus, code: String(numeric) };
}

function worstStatus(...statuses: NodeStatus[]) {
  if (statuses.includes("down")) return "down";
  if (statuses.includes("unknown")) return "unknown";
  return "live";
}

function remoteToHttps(remote: string | null) {
  if (!remote) return null;
  if (remote.startsWith("https://")) return remote.replace(/\.git$/, "");

  const match = remote.match(/^git@github\.com:(.+)\.git$/);
  return match ? `https://github.com/${match[1]}` : null;
}

function buildActions(actions: Action[]) {
  return actions.filter((action) => action.href || action.value);
}

export async function GET() {
  const repoRoot = join(process.cwd(), "../../..");
  const leadsPath = join(process.cwd(), "../../products/shopifixer/outreach/shopifixer_outreach_queue.json");
  const heartbeatPath = join(process.cwd(), "../../data/shopifixer_heartbeat_state.json");

  const leads = safeRead(leadsPath);
  const heartbeat = safeRead(heartbeatPath);

  const leadList = Array.isArray(leads) ? leads : [];
  const sentCount = leadList.filter((lead: any) => lead?.status === "sent").length;
  const pendingCount = leadList.filter((lead: any) => lead?.status === "backlog").length;
  const withEmailCount = leadList.filter((lead: any) => Boolean(lead?.email)).length;
  const totalLeads = leadList.length;

  const gitMeta = safeExec(`git -C "${repoRoot}" log -1 --format='%H|%cI|%s'`, 3500);
  const [commitShaRaw, commitTimestamp, commitSubject] = gitMeta?.split("|") ?? [];
  const gitRemote = safeExec(`git -C "${repoRoot}" remote get-url origin`, 2500);
  const gitHubUrl = remoteToHttps(gitRemote);

  const towerRaw = safeExec(
    `ssh -o BatchMode=yes -o ConnectTimeout=4 ross@100.91.225.86 'printf "photos=%s\\n" "$(find ~/media/photos -type f | wc -l)"; printf "grace=%s\\n" "$(find ~/media/daughters/grace -type f | wc -l)"; printf "maya=%s\\n" "$(find ~/media/daughters/maya -type f | wc -l)"; printf "shared=%s\\n" "$(find ~/media/shared -type f | wc -l 2>/dev/null || echo 0)"; df -h ~/media | tail -1'`,
    9000,
  );

  const towerLines = towerRaw?.split("\n") ?? [];
  const towerStats = new Map(
    towerLines
      .filter((line) => line.includes("="))
      .map((line) => {
        const [key, value] = line.split("=");
        return [key.trim(), value.trim()] as const;
      }),
  );
  const diskLine = towerLines.find((line) => line.includes("%"));
  const diskParts = diskLine?.trim().split(/\s+/) ?? [];
  const diskUsage = diskParts.length >= 5 ? `${diskParts[2]}/${diskParts[1]} used (${diskParts[4]})` : "Unavailable";

  const photoCount = normalizeCount(towerStats.get("photos") ?? null);
  const graceCount = normalizeCount(towerStats.get("grace") ?? null);
  const mayaCount = normalizeCount(towerStats.get("maya") ?? null);
  const sharedCount = normalizeCount(towerStats.get("shared") ?? null);

  const kubectlRaw = safeExec(`kubectl get pods -n cart-agent -o json`, 5000);
  const kubectlJson = safeJsonParse<{ items?: any[] }>(kubectlRaw);
  const podItems = Array.isArray(kubectlJson?.items) ? kubectlJson.items : [];
  const podRestarts = podItems.reduce((total: number, pod: any) => {
    const statuses = Array.isArray(pod?.status?.containerStatuses) ? pod.status.containerStatuses : [];
    return total + statuses.reduce((sum: number, container: any) => sum + (container?.restartCount ?? 0), 0);
  }, 0);
  const runningPods = podItems.filter((pod: any) => pod?.status?.phase === "Running").length;
  const readyPods = podItems.filter((pod: any) => {
    const statuses = Array.isArray(pod?.status?.containerStatuses) ? pod.status.containerStatuses : [];
    return statuses.length > 0 && statuses.every((container: any) => container?.ready);
  }).length;
  const podNames = podItems.map((pod: any) => pod?.metadata?.name).filter(Boolean);
  const crashLoop = podItems.some((pod: any) => {
    const statuses = Array.isArray(pod?.status?.containerStatuses) ? pod.status.containerStatuses : [];
    return statuses.some((container: any) => {
      const reason = container?.state?.waiting?.reason;
      return reason && reason !== "ContainerCreating" && reason !== "PodInitializing";
    });
  });

  const towerStatus: NodeStatus = towerRaw ? "live" : "down";
  const kubectlStatus: NodeStatus =
    podItems.length === 0 ? "unknown" : crashLoop ? "down" : readyPods === podItems.length ? "live" : "unknown";

  const abandoHealth = parseHttpStatus("https://pay.abando.ai/healthz");
  const abandoSite = parseHttpStatus("https://abando.ai");
  const staffordOsCore = parseHttpStatus("http://127.0.0.1:4000");
  const staffordMedia = parseHttpStatus("https://staffordmedia.ai");
  const jellyfin = parseHttpStatus("http://100.91.225.86:8096");

  const heartbeatTimestamp =
    typeof heartbeat?.updatedAt === "string"
      ? heartbeat.updatedAt
      : typeof heartbeat?.timestamp === "string"
        ? heartbeat.timestamp
        : null;
  const heartbeatAgeMinutes = heartbeatTimestamp
    ? Math.max(0, Math.round((Date.now() - new Date(heartbeatTimestamp).getTime()) / 60000))
    : null;
  const llmStatus: NodeStatus =
    heartbeatAgeMinutes == null ? "unknown" : heartbeatAgeMinutes <= 30 ? "live" : heartbeatAgeMinutes <= 240 ? "unknown" : "down";

  const operatorStatus: NodeStatus = worstStatus(
    staffordOsCore.status,
    totalLeads > 0 ? "live" : "unknown",
    llmStatus,
  );

  const surfacesLive = [abandoSite.status, abandoHealth.status, staffordMedia.status].filter((status) => status === "live").length;
  const surfacesStatus: NodeStatus = surfacesLive === 3 ? "live" : surfacesLive === 0 ? "down" : "unknown";

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    nodes: {
      tower: {
        id: "tower",
        title: "Tower",
        subtitle: "k3s, ArgoCD, Docker",
        status: worstStatus(towerStatus, kubectlStatus),
        metric: { label: "cart-agent pods", value: `${readyPods}/${podItems.length || 0}` },
        metrics: [
          { label: "Pod status", value: `${runningPods}/${podItems.length || 0} running` },
          { label: "Ready pods", value: `${readyPods}/${podItems.length || 0} ready` },
          { label: "Restarts", value: String(podRestarts) },
          { label: "Tower disk", value: diskUsage },
        ] satisfies Metric[],
        recentActivity: [
          podNames.length ? `Namespace cart-agent currently exposes ${podNames.join(", ")}.` : "cart-agent namespace returned no pods.",
          towerRaw ? `Tower SSH responded successfully and reported ${photoCount.toLocaleString()} media files.` : "Tower SSH check did not return telemetry.",
          `Latest repo commit is ${shortSha(commitShaRaw)} at ${formatTimestamp(commitTimestamp)}.`,
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "kubectl logs -n cart-agent deploy/cart-agent --tail=200" },
          { label: "Run sync", kind: "copy", value: "argocd app sync cart-agent" },
          { label: "Open in browser", kind: "open", href: "http://127.0.0.1:4000/system-map" },
        ]),
      },
      github: {
        id: "github",
        title: "GitHub",
        subtitle: "CI/CD, repos",
        status: commitShaRaw ? "live" : "unknown",
        metric: { label: "latest commit", value: shortSha(commitShaRaw) },
        metrics: [
          { label: "Commit SHA", value: shortSha(commitShaRaw) },
          { label: "Committed", value: formatTimestamp(commitTimestamp) },
          { label: "Subject", value: commitSubject || "Unavailable" },
          { label: "Remote", value: gitHubUrl || gitRemote || "Unavailable" },
        ] satisfies Metric[],
        recentActivity: [
          commitSubject ? `cart-agent HEAD: ${commitSubject}.` : "Latest commit subject unavailable.",
          `Latest commit timestamp: ${formatTimestamp(commitTimestamp)}.`,
          gitHubUrl ? `Remote is connected at ${gitHubUrl}.` : "Remote URL could not be resolved into an HTTPS link.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "gh run list --repo RossStafford/cart-agent --limit 5" },
          { label: "Run sync", kind: "copy", value: "gh workflow run deploy.yml --repo RossStafford/cart-agent" },
          { label: "Open in browser", kind: "open", href: gitHubUrl || undefined },
        ]),
      },
      abando: {
        id: "abando",
        title: "Abando",
        subtitle: "cart recovery, Shopify app",
        status: worstStatus(abandoHealth.status, kubectlStatus),
        metric: { label: "health endpoint", value: abandoHealth.code },
        metrics: [
          { label: "pay.abando.ai /healthz", value: abandoHealth.code },
          { label: "Kubernetes pods", value: `${readyPods}/${podItems.length || 0} ready` },
          { label: "Backlog", value: `${pendingCount.toLocaleString()} queued leads` },
          { label: "With email", value: withEmailCount.toLocaleString() },
        ] satisfies Metric[],
        recentActivity: [
          abandoHealth.status === "live" ? "pay.abando.ai health probe returned a live response." : "pay.abando.ai health probe did not confirm a live response.",
          `Shopify recovery queue currently has ${pendingCount.toLocaleString()} backlog leads.`,
          podNames.length ? `Abando is riding on tower pod set ${podNames.join(", ")}.` : "No cart-agent pods were available to attribute to Abando.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "kubectl logs -n cart-agent deploy/cart-agent --tail=200" },
          { label: "Run sync", kind: "copy", value: "kubectl rollout restart -n cart-agent deploy/cart-agent" },
          { label: "Open in browser", kind: "open", href: "https://pay.abando.ai" },
        ]),
      },
      shopifixer: {
        id: "shopifixer",
        title: "ShopiFixer",
        subtitle: "audit engine, Stripe, lead pipeline",
        status: worstStatus(totalLeads > 0 ? "live" : "unknown", staffordMedia.status),
        metric: { label: "lead pipeline", value: totalLeads.toLocaleString() },
        metrics: [
          { label: "Total leads", value: totalLeads.toLocaleString() },
          { label: "Sent outreach", value: sentCount.toLocaleString() },
          { label: "Pending outreach", value: pendingCount.toLocaleString() },
          { label: "Leads with email", value: withEmailCount.toLocaleString() },
        ] satisfies Metric[],
        recentActivity: [
          `Outreach queue currently tracks ${totalLeads.toLocaleString()} leads.`,
          `${sentCount.toLocaleString()} leads have already been sent and ${pendingCount.toLocaleString()} remain in backlog.`,
          staffordMedia.status === "live" ? "staffordmedia.ai is reachable for the operator surface." : "staffordmedia.ai did not confirm a live response.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "node ../../outreach/run_audit_outreach.mjs --dry-run" },
          { label: "Run sync", kind: "copy", value: "node ../../outreach/build_send_queue.mjs" },
          { label: "Send outreach", kind: "copy", value: "node ../../outreach/run_send_queue_safe.mjs" },
          { label: "Open in browser", kind: "open", href: "https://staffordmedia.ai" },
        ]),
      },
      "staffordos-core": {
        id: "staffordos-core",
        title: "StaffordOS Core",
        subtitle: "port 4000, dashboards",
        status: staffordOsCore.status,
        metric: { label: "local console", value: `:${staffordOsCore.code === "000" ? "4000" : "4000"}` },
        metrics: [
          { label: "Port 4000", value: staffordOsCore.code },
          { label: "System map API", value: "Polling every 30 seconds" },
          { label: "Selected branch", value: "rescue/mixed-work-2026-04-09" },
          { label: "Repo commit", value: shortSha(commitShaRaw) },
        ] satisfies Metric[],
        recentActivity: [
          staffordOsCore.status === "live" ? "StaffordOS core responded on port 4000." : "StaffordOS core did not respond on port 4000.",
          `System map payload generated at ${formatTimestamp(new Date().toISOString())}.`,
          `This console is currently tracking branch rescue/mixed-work-2026-04-09.`,
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "npm run dev" },
          { label: "Run sync", kind: "copy", value: "curl -s http://127.0.0.1:4000/api/system-map" },
          { label: "Open in browser", kind: "open", href: "http://127.0.0.1:4000/system-map" },
        ]),
      },
      "ross-operator": {
        id: "ross-operator",
        title: "Ross Operator",
        subtitle: "advisory layer",
        status: operatorStatus,
        metric: { label: "pending advisories", value: pendingCount.toLocaleString() },
        metrics: [
          { label: "Pending outreach", value: pendingCount.toLocaleString() },
          { label: "Heartbeat file", value: heartbeatTimestamp ? formatTimestamp(heartbeatTimestamp) : "Unavailable" },
          { label: "LLM state", value: STATUS_LABELS[llmStatus] },
          { label: "Core console", value: STATUS_LABELS[staffordOsCore.status] },
        ] satisfies Metric[],
        recentActivity: [
          heartbeatTimestamp ? `Operator heartbeat last updated ${formatTimestamp(heartbeatTimestamp)}.` : "Operator heartbeat file is missing.",
          `There are ${pendingCount.toLocaleString()} queue items waiting for an operator decision.`,
          withEmailCount ? `${withEmailCount.toLocaleString()} leads are already enriched with email addresses.` : "No enriched leads were found.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "cat ../../data/shopifixer_heartbeat_state.json" },
          { label: "Run sync", kind: "copy", value: "node ../../outreach/generate_followup_sequence.mjs" },
          { label: "Send outreach", kind: "copy", value: "node ../../outreach/run_send_queue_safe.mjs" },
          { label: "Open in browser", kind: "open", href: "http://127.0.0.1:4000/operator/products" },
        ]),
      },
      "ross-llm": {
        id: "ross-llm",
        title: "Ross LLM",
        subtitle: "memory, chat",
        status: llmStatus,
        metric: { label: "memory heartbeat", value: heartbeatAgeMinutes == null ? "n/a" : `${heartbeatAgeMinutes}m` },
        metrics: [
          { label: "Heartbeat age", value: heartbeatAgeMinutes == null ? "Unavailable" : `${heartbeatAgeMinutes} minutes` },
          { label: "Last update", value: heartbeatTimestamp ? formatTimestamp(heartbeatTimestamp) : "Unavailable" },
          { label: "Memory source", value: heartbeat ? "shopifixer_heartbeat_state.json" : "Unavailable" },
          { label: "Core console", value: STATUS_LABELS[staffordOsCore.status] },
        ] satisfies Metric[],
        recentActivity: [
          heartbeatTimestamp ? `Memory state was last touched at ${formatTimestamp(heartbeatTimestamp)}.` : "No heartbeat timestamp was available for Ross LLM.",
          llmStatus === "live" ? "Ross LLM heartbeat is fresh enough to treat as live." : "Ross LLM heartbeat has gone stale, so the node is degraded.",
          "Chat and memory status is inferred from the operator heartbeat file.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "cat ../../data/shopifixer_heartbeat_state.json" },
          { label: "Run sync", kind: "copy", value: "node ../../outreach/generate_outreach_emails.mjs" },
          { label: "Open in browser", kind: "open", href: "http://127.0.0.1:4000" },
        ]),
      },
      "media-server": {
        id: "media-server",
        title: "Media Server",
        subtitle: "Jellyfin, photos, Grace, Maya",
        status: worstStatus(towerStatus, jellyfin.status),
        metric: { label: "photo library", value: photoCount.toLocaleString() },
        metrics: [
          { label: "Grace photos", value: graceCount.toLocaleString() },
          { label: "Maya photos", value: mayaCount.toLocaleString() },
          { label: "Shared folder", value: sharedCount.toLocaleString() },
          { label: "Jellyfin :8096", value: jellyfin.code },
        ] satisfies Metric[],
        recentActivity: [
          towerRaw ? `Tower media storage reports ${diskUsage}.` : "Tower media storage did not return a disk usage sample.",
          `Grace has ${graceCount.toLocaleString()} assets, Maya has ${mayaCount.toLocaleString()}, and shared has ${sharedCount.toLocaleString()}.`,
          jellyfin.status === "live" ? "Jellyfin responded on port 8096." : "Jellyfin did not return a live response on port 8096.",
        ],
        actions: buildActions([
          { label: "View logs", kind: "copy", value: "ssh ross@100.91.225.86 'journalctl -u jellyfin -n 120'" },
          { label: "Run sync", kind: "copy", value: "ssh ross@100.91.225.86 'find ~/media/photos -type f | wc -l'" },
          { label: "Open in browser", kind: "open", href: "http://100.91.225.86:8096" },
        ]),
      },
      surfaces: {
        id: "surfaces",
        title: "Surfaces",
        subtitle: "abando.ai, pay.abando.ai, staffordmedia.ai",
        status: surfacesStatus,
        metric: { label: "public surfaces", value: `${surfacesLive}/3` },
        metrics: [
          { label: "abando.ai", value: abandoSite.code },
          { label: "pay.abando.ai", value: abandoHealth.code },
          { label: "staffordmedia.ai", value: staffordMedia.code },
          { label: "Last deploy", value: formatTimestamp(commitTimestamp) },
        ] satisfies Metric[],
        recentActivity: [
          `${surfacesLive} of 3 public surfaces responded with a live HTTP status.`,
          abandoSite.status === "live" ? "abando.ai is reachable." : "abando.ai did not confirm a live response.",
          staffordMedia.status === "live" ? "staffordmedia.ai is reachable." : "staffordmedia.ai did not confirm a live response.",
        ],
        actions: buildActions([
          { label: "Open in browser", kind: "open", href: "https://abando.ai" },
          { label: "View logs", kind: "copy", value: "curl -I https://pay.abando.ai && curl -I https://staffordmedia.ai" },
          { label: "Run sync", kind: "copy", value: "argocd app sync cart-agent" },
        ]),
      },
    },
  });
}

const STATUS_LABELS: Record<NodeStatus, string> = {
  live: "Live",
  unknown: "Unknown",
  down: "Down",
};
