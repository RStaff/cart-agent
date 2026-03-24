import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAdvisorRail } from "../../../staffordos/scorecards/advisorRailController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORECARD_PATH =
  process.env.SCORECARD_PATH ||
  path.resolve(__dirname, "..", "..", "..", "staffordos", "scorecards", "scorecards_output.json");

function readScorecard() {
  try {
    return JSON.parse(fs.readFileSync(SCORECARD_PATH, "utf8"));
  } catch {
    return null;
  }
}

function listScorecards(scorecardData) {
  if (!scorecardData || typeof scorecardData !== "object") {
    return [];
  }

  if (Array.isArray(scorecardData)) {
    return scorecardData;
  }

  if (Array.isArray(scorecardData.scorecards)) {
    return scorecardData.scorecards;
  }

  if (typeof scorecardData.store === "string") {
    return [scorecardData];
  }

  return [];
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function slugifyDomain(value) {
  const normalized = normalizeDomain(value);
  return normalized.replace(/\.myshopify\.com$/, "");
}

function findScorecard(matchValue) {
  const scorecardData = readScorecard();
  const scorecards = listScorecards(scorecardData);
  if (!scorecards.length) {
    return null;
  }

  const requested = normalizeDomain(matchValue);
  const requestedSlug = slugifyDomain(matchValue);

  for (const scorecard of scorecards) {
    const storeDomain = normalizeDomain(scorecard.domain || scorecard.store);
    const storeSlug = String(scorecard.slug || slugifyDomain(storeDomain));
    const publicSlug = slugifyDomain(scorecard.publicUrl || "");

    if (
      requested === storeDomain ||
      requested === storeSlug ||
      requestedSlug === storeSlug ||
      requestedSlug === publicSlug
    ) {
      return scorecard;
    }
  }

  return null;
}

function renderPage({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 28%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 48px 24px 72px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #1e293b;
      background: rgba(15, 23, 42, 0.78);
      color: #93c5fd;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #38bdf8;
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.55);
    }
    .hero {
      margin-top: 20px;
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
    }
    .panel {
      border: 1px solid #1e293b;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.88);
      box-shadow: 0 24px 90px rgba(2, 6, 23, 0.45);
      padding: 28px;
    }
    h1 {
      margin: 14px 0 10px;
      font-size: clamp(38px, 6vw, 64px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }
    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.65;
      max-width: 56ch;
    }
    .store {
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .metrics {
      margin-top: 26px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .metric {
      border: 1px solid #1e293b;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.65);
      padding: 18px;
    }
    .metric-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .metric-value {
      margin-top: 10px;
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .issue-card {
      margin-top: 18px;
      padding: 18px;
      border-radius: 18px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      background: linear-gradient(180deg, rgba(8, 47, 73, 0.42), rgba(15, 23, 42, 0.82));
    }
    .issue-label {
      color: #67e8f9;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .issue-value {
      margin-top: 8px;
      font-size: 18px;
      font-weight: 700;
      color: #e0f2fe;
    }
    .breakdown-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 12px;
    }
    .breakdown-item {
      border: 1px solid #1e293b;
      border-radius: 16px;
      background: rgba(2, 6, 23, 0.62);
      padding: 16px 18px;
    }
    .breakdown-title {
      color: #f8fafc;
      font-weight: 600;
      line-height: 1.5;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 20px;
      min-height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #38bdf8, #2563eb);
      color: #eff6ff;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.01em;
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
    }
    .meta {
      display: grid;
      gap: 14px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(30, 41, 59, 0.82);
    }
    .meta-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .meta-label {
      color: #94a3b8;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .meta-value {
      color: #f8fafc;
      text-align: right;
      font-weight: 700;
    }
    .footer {
      margin-top: 18px;
      color: #64748b;
      font-size: 13px;
    }
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
      .metrics { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    ${body}
  </main>
</body>
</html>`;
}

function renderNotFoundPage(requestedDomain) {
  const body = `
    <div class="brand"><span class="brand-dot"></span>Abando</div>
    <section class="panel" style="margin-top:20px; max-width: 760px;">
      <div class="store">${requestedDomain}</div>
      <h1>Scorecard unavailable</h1>
      <p class="subtitle">We could not find a public Abando scorecard for this store yet. Once a scorecard is generated, this route will show the benchmark view and installation path.</p>
    </section>
  `;

  return renderPage({
    title: "Abando Scorecard",
    body,
  });
}

function renderScorecardPage(scorecard, inviteId = "") {
  const domain = normalizeDomain(scorecard.domain || scorecard.store);
  const opportunity =
    scorecard.revenueOpportunityDisplay ||
    scorecard.estimated_revenue_leak ||
    "Estimated revenue opportunity pending";
  const conversion = scorecard.conversion || scorecard?.benchmark_comparison?.your_store_conversion || "Unavailable";
  const median = scorecard.shopifyMedian || scorecard?.benchmark_comparison?.shopify_median || "Unavailable";
  const fixPriority = Array.isArray(scorecard.topFindings)
    ? scorecard.topFindings
    : Array.isArray(scorecard.fix_priority)
      ? scorecard.fix_priority
      : [];
  const topIssue =
    fixPriority[0] ||
    scorecard.top_leak ||
    "Checkout friction detected";
  const installParams = new URLSearchParams();
  installParams.set("shop", domain);
  if (inviteId) {
    installParams.set("invite", inviteId);
  }
  const installUrl = (() => {
    if (!scorecard.installPath) {
      return `/install/shopify?${installParams.toString()}`;
    }

    const [basePath, rawQuery = ""] = String(scorecard.installPath).split("?");
    const mergedParams = new URLSearchParams(rawQuery);
    if (!mergedParams.get("shop")) {
      mergedParams.set("shop", domain);
    }
    if (inviteId && !mergedParams.get("invite")) {
      mergedParams.set("invite", inviteId);
    }
    return `${basePath}?${mergedParams.toString()}`;
  })();
  const advisorRail = buildAdvisorRail({
    ...scorecard,
    installPath: installUrl,
  });
  const advisorRailJson = JSON.stringify(advisorRail);
  const starterQuestionButtons = advisorRail.starterQuestions.map(
    (question) =>
      `<button class="ask-chip advisor-question-chip" type="button" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`,
  ).join("");

  const body = `
    <div class="brand"><span class="brand-dot"></span>Abando Scorecard</div>
    <section class="hero">
      <div class="panel">
        <div class="store">${domain}</div>
        <h1>Revenue opportunity found in your Shopify checkout.</h1>
        <p class="subtitle">Abando benchmarks your conversion performance, highlights the most likely leak, and gives you a direct install path to start storefront signal capture and recovery tracking.</p>
        <div class="metrics">
        <div class="metric">
            <div class="metric-label">Estimated Revenue Opportunity</div>
            <div class="metric-value">${opportunity}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Store Conversion</div>
            <div class="metric-value">${conversion}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Shopify Median</div>
            <div class="metric-value">${median}</div>
          </div>
        </div>
        <div class="issue-card">
          <div class="issue-label">Top issue</div>
          <div class="issue-value">${topIssue}</div>
        </div>
        <div class="footer">This public scorecard is benchmark-based. It does not represent live installed-store telemetry yet.</div>
      </div>
      <div class="panel">
        <div class="meta">
          <div class="meta-row">
            <div class="meta-label">Benchmark cue</div>
            <div class="meta-value">${scorecard.benchmarkSummary || scorecard.industry_benchmark || "Below Shopify median"}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">Checkout score</div>
            <div class="meta-value">${scorecard.checkoutScore ?? scorecard.checkout_score ?? "N/A"}</div>
          </div>
          <div class="meta-row">
            <div class="meta-label">Generated</div>
            <div class="meta-value">${scorecard.createdAt || scorecard.generated_at || "Unknown"}</div>
          </div>
        </div>
        <div style="margin-top:22px;">
          <div class="meta-label" style="margin-bottom:12px;">Opportunity breakdown</div>
          <ul class="breakdown-list">
            ${fixPriority.map((item) => `<li class="breakdown-item"><div class="breakdown-title">${item}</div></li>`).join("")}
          </ul>
        </div>
        <a class="cta" href="${installUrl}">Install Abando on your Shopify store</a>
        <div class="footer">After approval, Abando opens your merchant workspace and starts checkout signal capture for this store.</div>
      </div>
    </section>
    <section class="panel" style="margin-top:24px;">
      <div class="issue-label">Abando Advisor</div>
      <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap;">
        <div>
          <h2 style="margin:10px 0 12px; font-size:28px; letter-spacing:-0.03em;">${escapeHtml(advisorRail.title)}</h2>
          <p class="subtitle" style="font-size:16px; max-width:none;">A structured advisory rail that explains this scorecard, shows what matters first, and moves you into the right next step without pretending this is live telemetry.</p>
        </div>
        <div style="text-align:right;">
          <div id="advisorStateLabel" class="issue-label" style="margin-bottom:8px;">Initial insight</div>
          <div id="advisorRailProgress" class="metric-label">Step 1 of ${advisorRail.steps.length}</div>
          <div class="footer" style="margin-top:8px;">${escapeHtml(advisorRail.estimatedCompletionLabel)}</div>
        </div>
      </div>
      <div class="breakdown-item" style="margin-top:18px;">
        <div id="advisorRailTitle" class="issue-value" style="margin-top:2px;">${escapeHtml(advisorRail.steps[0]?.title || "")}</div>
        <div id="advisorRailBody" class="breakdown-title" style="margin-top:12px;">${escapeHtml(advisorRail.steps[0]?.body || "")}</div>
        <ul id="advisorRailPoints" class="breakdown-list" style="margin-top:14px;">
          ${(advisorRail.steps[0]?.supportingPoints || []).map((item) => `<li class="breakdown-item"><div class="breakdown-title">${escapeHtml(item)}</div></li>`).join("")}
        </ul>
      </div>
      <div class="ask-chip-row" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:18px;">
        ${starterQuestionButtons}
      </div>
      <form id="advisorAskForm" style="margin-top:18px; display:grid; gap:12px;">
        <input id="askAbandoInput" type="text" placeholder="Ask about this scorecard" aria-label="Ask Abando" style="width:100%; min-height:54px; border-radius:14px; border:1px solid #1e293b; background:rgba(2, 6, 23, 0.62); color:#f8fafc; padding:0 16px; font:inherit;" />
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button id="advisorBack" class="ask-chip" type="button" disabled>Back</button>
          <button id="advisorNext" class="ask-chip" type="button">Continue</button>
          <button id="advisorAskToggle" class="ghost" type="button">Ask Abando</button>
          <a id="advisorInstallInline" class="ghost" href="${escapeHtml(advisorRail.cta.installPath)}" style="display:none;">${escapeHtml(advisorRail.cta.installLabel)}</a>
          <button id="advisorAskReturn" class="ghost" type="button" style="display:none;">Back to Guided Audit</button>
        </div>
      </form>
      <div id="advisorAnswerPanel" class="breakdown-item" style="margin-top:16px; display:none;">
        <div class="metric-label">Ask Abando</div>
        <div id="askAbandoAnswerText" class="breakdown-title" style="margin-top:10px;">Ask a question above to see a scorecard-grounded answer.</div>
        <div id="askAbandoFollowUp" class="footer" style="margin-top:10px; display:none;"></div>
        <div id="askAbandoInstallPrompt" class="footer" style="margin-top:6px; display:none;"></div>
      </div>
      <div id="advisorFinalCta" style="display:none; margin-top:16px;">
        <a class="cta" href="${escapeHtml(advisorRail.cta.installPath)}">${escapeHtml(advisorRail.cta.installLabel)}</a>
      </div>
      <div class="footer">${escapeHtml(advisorRail.truthNote)}</div>
    </section>
    <script>
      (function () {
        var slug = ${JSON.stringify(advisorRail.slug)};
        var advisorRail = ${advisorRailJson};
        var form = document.getElementById('advisorAskForm');
        var input = document.getElementById('askAbandoInput');
        var answerText = document.getElementById('askAbandoAnswerText');
        var buttons = Array.prototype.slice.call(document.querySelectorAll('.advisor-question-chip'));
        var mode = 'guided';
        var behavioralState = advisorRail.defaultBehavioralState || 'INITIAL_INSIGHT';
        var currentStep = 0;
        var totalSteps = Array.isArray(advisorRail && advisorRail.steps) ? advisorRail.steps.length : 4;
        var lastQuestion = null;
        var installCtaVisible = false;
        var idleTimer = null;
        var progress = document.getElementById('advisorRailProgress');
        var stateLabel = document.getElementById('advisorStateLabel');
        var guidedTitle = document.getElementById('advisorRailTitle');
        var guidedBody = document.getElementById('advisorRailBody');
        var guidedPoints = document.getElementById('advisorRailPoints');
        var guidedBack = document.getElementById('advisorBack');
        var guidedNext = document.getElementById('advisorNext');
        var askToggle = document.getElementById('advisorAskToggle');
        var askReturn = document.getElementById('advisorAskReturn');
        var answerPanel = document.getElementById('advisorAnswerPanel');
        var finalCta = document.getElementById('advisorFinalCta');
        var installInline = document.getElementById('advisorInstallInline');
        var followUp = document.getElementById('askAbandoFollowUp');
        var installPrompt = document.getElementById('askAbandoInstallPrompt');
        var advisorPanel = document.getElementById('advisorRailTitle') && document.getElementById('advisorRailTitle').closest('.panel');

        function behaviorStateConfig(name) {
          return advisorRail && advisorRail.behavior ? advisorRail.behavior[name] || null : null;
        }

        function setAnswer(text) {
          answerText.textContent = text;
        }

        function setBehaviorState(name, overrideMessage) {
          var state = behaviorStateConfig(name);
          if (!state) return;
          behavioralState = name;
          if (stateLabel) stateLabel.textContent = state.label || name;
          if (overrideMessage && guidedBody) {
            guidedBody.textContent = overrideMessage;
          }
        }

        function restartIdleTimer() {
          if (idleTimer) {
            clearTimeout(idleTimer);
          }
          if (behavioralState === 'INITIAL_INSIGHT') {
            idleTimer = setTimeout(function () {
              if (mode === 'guided' && currentStep === 0) {
                applyBehaviorState('SKEPTICAL_PAUSE');
              }
            }, 6000);
          } else if (behavioralState === 'VALUE_REFRAME') {
            idleTimer = setTimeout(function () {
              if (mode === 'guided' && currentStep >= 1) {
                applyBehaviorState('CLOSE_READY');
              }
            }, 5000);
          }
        }

        function applyBehaviorState(name) {
          var state = behaviorStateConfig(name);
          if (!state) return;
          setBehaviorState(name, state.message || '');
          if (guidedPoints && Array.isArray(state.supportingPoints) && state.supportingPoints.length) {
            guidedPoints.innerHTML = state.supportingPoints.map(function (item) {
              return '<li class="breakdown-item"><div class="breakdown-title">' + String(item)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;') + '</div></li>';
            }).join('');
          }
          if (guidedTitle) {
            guidedTitle.textContent = (state.label || '').replace(/^./, function (char) { return char.toUpperCase(); });
          }
          if (name === 'CLOSE_READY') {
            if (finalCta) finalCta.style.display = '';
            if (installInline) installInline.style.display = '';
          }
          restartIdleTimer();
        }

        function renderGuidedAuditStep(index) {
          var steps = Array.isArray(advisorRail && advisorRail.steps) ? advisorRail.steps : [];
          var step = steps[index];
          if (!step) return;
          currentStep = index;
          mode = 'guided';
          if (progress) progress.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
          if (guidedTitle) guidedTitle.textContent = step.title || '';
          if (guidedBody) guidedBody.textContent = step.body || '';
          if (guidedPoints) {
            guidedPoints.innerHTML = (Array.isArray(step.supportingPoints) ? step.supportingPoints : []).map(function (item) {
              return '<li class="breakdown-item"><div class="breakdown-title">' + String(item)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;') + '</div></li>';
            }).join('');
          }

          var finalStep = index >= steps.length - 1;
          setBehaviorState(index === 0 ? 'INITIAL_INSIGHT' : finalStep ? 'CLOSE_READY' : index >= 1 ? 'VALUE_REFRAME' : 'INITIAL_INSIGHT');
          if (guidedBack) guidedBack.disabled = index === 0;
          if (guidedNext) {
            guidedNext.style.display = finalStep ? 'none' : '';
            guidedNext.textContent = finalStep ? 'Done' : 'Continue';
          }
          if (askToggle) askToggle.style.display = '';
          if (answerPanel) answerPanel.style.display = finalStep ? '' : 'none';
          if (askReturn) askReturn.style.display = 'none';
          if (finalCta) finalCta.style.display = finalStep ? '' : 'none';
          if (installInline) installInline.style.display = finalStep ? '' : 'none';
          if (finalStep && answerText && !answerText.textContent) {
            setAnswer('You can ask a scorecard question here before installing.');
          }
          if (followUp) followUp.style.display = 'none';
          if (installPrompt) installPrompt.style.display = 'none';
          restartIdleTimer();
        }

        async function ask(question) {
          if (!question) {
            setAnswer('Ask a question above to see a scorecard-grounded answer.');
            return;
          }

          mode = 'qa';
          lastQuestion = question;
          if (answerPanel) answerPanel.style.display = '';
          if (askReturn) askReturn.style.display = '';
          if (progress) progress.textContent = 'Question mode';
          setBehaviorState('QA_MODE');
          setAnswer('Thinking through this scorecard...');
          try {
            var params = new URLSearchParams();
            params.set('slug', slug);
            params.set('q', question);
            var response = await fetch('/api/ask-abando?' + params.toString(), {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            var body = await response.json();
            if (!body.ok) {
              setAnswer('We could not find a scorecard explanation for this store right now.');
              return;
            }
            setAnswer(body.answer || 'I can explain how this scorecard was estimated, what the main issue is, what to fix first, and what happens after install.');
            if (followUp) {
              followUp.textContent = body.followUpSuggestion ? 'Suggested next question: ' + body.followUpSuggestion : '';
              followUp.style.display = body.followUpSuggestion ? '' : 'none';
            }
            if (installPrompt) {
              installPrompt.textContent = body.installPrompt || '';
              installPrompt.style.display = body.installPrompt ? '' : 'none';
            }
            if (body.intent === 'IS_THIS_REAL' || body.intent === 'HOW_CALCULATED') {
              applyBehaviorState('DOUBT_RESPONSE');
            } else if (body.intent === 'WHAT_TO_FIX_FIRST') {
              applyBehaviorState('VALUE_REFRAME');
            } else if (body.intent === 'INSTALL_NEXT_STEP') {
              applyBehaviorState('CLOSE_READY');
            }
          } catch (_error) {
            setAnswer('Ask Abando is unavailable right now. The public scorecard still reflects generated benchmark inputs, and install is the next truthful step for real tracking.');
          }
        }

        buttons.forEach(function (button) {
          button.addEventListener('click', function () {
            var question = button.getAttribute('data-question') || '';
            if (input) input.value = question;
            ask(question);
          });
        });

        if (guidedBack) {
          guidedBack.addEventListener('click', function () {
            renderGuidedAuditStep(Math.max(0, currentStep - 1));
          });
        }

        if (guidedNext) {
          guidedNext.addEventListener('click', function () {
            var steps = Array.isArray(advisorRail && advisorRail.steps) ? advisorRail.steps : [];
            renderGuidedAuditStep(Math.min(steps.length - 1, currentStep + 1));
          });
        }

        if (askToggle) {
          askToggle.addEventListener('click', function () {
            if (input) {
              input.focus();
            }
            var askSection = document.getElementById('advisorAskForm');
            if (askSection && askSection.scrollIntoView) {
              askSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (answerPanel) {
              answerPanel.style.display = '';
            }
            if (askReturn) {
              askReturn.style.display = '';
            }
            if (progress) {
              progress.textContent = 'Question mode';
            }
          });
        }

        if (askReturn) {
          askReturn.addEventListener('click', function () {
            renderGuidedAuditStep(currentStep);
          });
        }

        if (installInline) {
          installInline.addEventListener('mouseenter', function () {
            setTimeout(function () {
              if (document.querySelector(':hover') === installInline || installInline.matches(':hover')) {
                installCtaVisible = true;
                applyBehaviorState('CLOSE_READY');
              }
            }, 1500);
          });
        }

        if (advisorPanel && typeof IntersectionObserver === 'function') {
          var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting && currentStep === 0 && behavioralState === 'INITIAL_INSIGHT') {
                restartIdleTimer();
              }
            });
          }, { threshold: 0.45 });
          observer.observe(advisorPanel);
        }

        document.addEventListener('scroll', function () {
          if (mode === 'guided' && currentStep === 0 && behavioralState === 'INITIAL_INSIGHT') {
            restartIdleTimer();
          }
        }, { passive: true });

        if (form) {
          form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (mode === 'qa' || (input && input.value.trim())) {
              ask(input ? input.value.trim() : '');
            }
          });
        }

        renderGuidedAuditStep(0);
      })();
    </script>
  `;

  return {
    html: renderPage({
      title: `Abando Scorecard — ${domain}`,
      body,
    }),
    installUrl,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function installScorecardRoute(app) {
  app.get("/scorecard/:domain", (req, res) => {
    const requestedDomain = String(req.params?.domain || "");
    const inviteId = typeof req.query?.invite === "string" ? req.query.invite.trim() : "";
    const scorecard = findScorecard(requestedDomain);

    if (!scorecard) {
      return res.status(404).type("html").send(renderNotFoundPage(requestedDomain));
    }

    const rendered = renderScorecardPage(scorecard, inviteId);
    return res.status(200).type("html").send(rendered.html);
  });
}
