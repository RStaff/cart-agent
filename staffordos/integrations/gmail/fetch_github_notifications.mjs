import tls from "node:tls";

const HOST = "imap.gmail.com";
const PORT = 993;
const CONNECT_TIMEOUT_MS = 10_000;
const INBOX_TIMEOUT_MS = 10_000;
const SEARCH_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_EMAILS = 25;
const ALLOWED_SUBJECT_TERMS = [
  "commented on",
  "replied",
  "mentioned you",
];
const BLOCKED_SUBJECT_TERMS = [
  "run failed",
  "run success",
  "workflow",
  "ci",
  "actions",
  "build",
  "deploy",
  "sync",
  "checks failed",
  "checks completed",
];
const BLOCKED_BODY_TERMS = [
  "view workflow run",
  "workflow run",
  "github actions",
  "logs for this run",
];

function normalizeLineBreaks(value = "") {
  return String(value || "").replaceAll("\r\n", "\n");
}

function encodeImapString(value = "") {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function withTimeout(promise, ms, stage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`GMAIL_IMAP_TIMEOUT: ${stage}`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function makeClient() {
  const socket = tls.connect(PORT, HOST, { servername: HOST });
  socket.setEncoding("utf8");

  let buffer = "";
  const waiters = [];

  socket.on("data", (chunk) => {
    buffer += chunk;
    while (waiters.length > 0) {
      const waiter = waiters[0];
      if (!waiter.predicate(buffer)) break;
      waiters.shift();
      const payload = buffer;
      buffer = "";
      waiter.resolve(payload);
    }
  });

  socket.on("error", (error) => {
    while (waiters.length > 0) {
      waiters.shift().reject(error);
    }
  });

  function waitFor(predicate) {
    return new Promise((resolve, reject) => {
      waiters.push({ predicate, resolve, reject });
    });
  }

  async function waitForGreeting() {
    return waitFor((data) => data.includes("\r\n") || data.startsWith("* OK"));
  }

  async function sendCommand(tag, command) {
    const taggedStatus = new RegExp(`(^|\\r?\\n)${tag} (OK|NO|BAD)`, "i");
    socket.write(`${tag} ${command}\r\n`);
    const response = await waitFor((data) => taggedStatus.test(data));
    if (!new RegExp(`(^|\\r?\\n)${tag} OK`, "i").test(response)) {
      throw new Error(`imap_command_failed:${command}`);
    }
    return response;
  }

  async function close() {
    try {
      socket.write("ZZ99 LOGOUT\r\n");
      socket.end();
    } catch {
      socket.destroy();
    }
  }

  return {
    waitForGreeting,
    sendCommand,
    close,
  };
}

function parseSearchIds(response = "") {
  const match = response.match(/\* SEARCH(.*)\r?\n/i);
  if (!match) return [];
  return String(match[1] || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function decodeHeaderValue(headerBlock = "", name = "") {
  const regex = new RegExp(`^${name}:\\s*(.+)$`, "im");
  return normalizeLineBreaks(headerBlock).match(regex)?.[1]?.trim() || "";
}

function extractLiteral(response = "", label = "") {
  const start = response.indexOf(label);
  if (start < 0) return "";
  const markerStart = response.indexOf("{", start);
  const markerEnd = response.indexOf("}", markerStart);
  if (markerStart < 0 || markerEnd < 0) return "";
  const length = Number(response.slice(markerStart + 1, markerEnd));
  if (!Number.isFinite(length)) return "";
  const contentStart = response.indexOf("\n", markerEnd) + 1;
  return response.slice(contentStart, contentStart + length);
}

function classifyGithubNotification(email) {
  const subject = String(email?.subject || "").toLowerCase();
  const from = String(email?.from || "").toLowerCase();
  const body = String(email?.body_text || "").toLowerCase();

  if (!from.includes("notifications@github.com")) {
    return { accepted: false, reason: "non_github_sender" };
  }

  if (BLOCKED_SUBJECT_TERMS.some((term) => subject.includes(term))) {
    return { accepted: false, reason: "subject_workflow" };
  }

  if (!ALLOWED_SUBJECT_TERMS.some((term) => subject.includes(term))) {
    return { accepted: false, reason: "subject_not_human" };
  }

  if (BLOCKED_BODY_TERMS.some((term) => body.includes(term))) {
    return { accepted: false, reason: "body_workflow" };
  }

  return { accepted: true, reason: "accepted" };
}

export async function fetchGithubNotifications() {
  const user = String(process.env.GMAIL_USER || "").trim();
  const password = String(process.env.GMAIL_APP_PASSWORD || "").trim();
  if (!user || !password) {
    throw new Error("gmail_credentials_missing");
  }

  const log = (message) => console.log(`[gmail-imap] ${message}`);
  const filterLog = (message) => console.log(`[gmail-filter] ${message}`);
  const client = makeClient();

  log("starting imap connect");
  await withTimeout(client.waitForGreeting(), CONNECT_TIMEOUT_MS, "connect");
  log("imap connected");

  try {
    await withTimeout(
      client.sendCommand("A001", `LOGIN ${encodeImapString(user)} ${encodeImapString(password)}`),
      CONNECT_TIMEOUT_MS,
      "login",
    );

    log("inbox opening");
    await withTimeout(client.sendCommand("A002", "SELECT INBOX"), INBOX_TIMEOUT_MS, "inbox_open");
    log("inbox opened");

    log("search starting");
    const searchResponse = await withTimeout(
      client.sendCommand("A003", 'SEARCH UNSEEN HEADER FROM "notifications@github.com"'),
      SEARCH_TIMEOUT_MS,
      "search",
    );
    const ids = parseSearchIds(searchResponse);
    log(`search completed with ${ids.length} ids`);

    const fetchIds = ids.length > MAX_EMAILS ? ids.slice(-MAX_EMAILS) : ids;
    log(`fetch limiting to ${fetchIds.length} ids (found ${ids.length})`);

    if (fetchIds.length === 0) {
      return {
        totalIdsFound: ids.length,
        fetchedIdsCount: 0,
        emailsFetched: 0,
        emailsAccepted: 0,
        emailsRejected: 0,
        emails: [],
      };
    }

    log("fetch starting");
    const emails = [];
    let emailsFetched = 0;
    let emailsAccepted = 0;
    let emailsRejected = 0;
    for (let index = 0; index < fetchIds.length; index += 1) {
      const id = fetchIds[index];
      const fetchTag = `A${String(index + 4).padStart(3, "0")}`;
      const fetchResponse = await withTimeout(
        client.sendCommand(fetchTag, `FETCH ${id} (BODY[HEADER.FIELDS (SUBJECT FROM DATE)] BODY[TEXT])`),
        FETCH_TIMEOUT_MS,
        "fetch",
      );

      const headerBlock = extractLiteral(fetchResponse, "BODY[HEADER.FIELDS (SUBJECT FROM DATE)]");
      const bodyText = extractLiteral(fetchResponse, "BODY[TEXT]");
      const email = {
        subject: decodeHeaderValue(headerBlock, "Subject"),
        from: decodeHeaderValue(headerBlock, "From"),
        date: decodeHeaderValue(headerBlock, "Date"),
        body_text: normalizeLineBreaks(bodyText).trim(),
      };
      emailsFetched += 1;

      const classification = classifyGithubNotification(email);
      if (!classification.accepted) {
        emailsRejected += 1;
        if (classification.reason === "subject_workflow") {
          filterLog(`subject rejected (workflow): ${email.subject}`);
        } else if (classification.reason === "body_workflow") {
          filterLog(`body rejected (workflow): ${email.subject}`);
        }
        continue;
      }

      emailsAccepted += 1;
      filterLog(`subject accepted: ${email.subject}`);
      emails.push(email);
      await withTimeout(
        client.sendCommand(`B${String(index + 4).padStart(3, "0")}`, `STORE ${id} +FLAGS (\\Seen)`),
        FETCH_TIMEOUT_MS,
        "fetch",
      );
    }
    log(`fetch completed with ${emails.length} messages`);

    return {
      totalIdsFound: ids.length,
      fetchedIdsCount: fetchIds.length,
      emailsFetched,
      emailsAccepted,
      emailsRejected,
      emails,
    };
  } finally {
    log("logout starting");
    await client.close();
    log("logout done");
  }
}
