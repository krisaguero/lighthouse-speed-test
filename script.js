// PageSpeed Insights (Lighthouse) integration
const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
// IMPORTANT: Keep this blank in commits; if you test locally, restrict the key by HTTP referrer in GCP.
const API_KEY = "";

// State
const state = {
  firstName: "",
  url: "",
  host: "",
  needs: [],
  data: null,
};

// Steps
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");

// Step indicators
const ind1 = document.getElementById("step1-indicator");
const ind2 = document.getElementById("step2-indicator");
const ind3 = document.getElementById("step3-indicator");
const ind4 = document.getElementById("step4-indicator");

// Inputs
const firstNameInput = document.getElementById("firstName");
const domainInput = document.getElementById("domain");

// Loading (Step 3)
const loadingText = document.getElementById("loadingText");
const loadingSteps = [
  document.getElementById("loading1"),
  document.getElementById("loading2"),
  document.getElementById("loading3"),
  document.getElementById("loading4"),
];

// Results (Step 4)
const clientNameEl = document.getElementById("clientName");
const clientDomainEl = document.getElementById("clientDomain");

const overallScoreNumberEl = document.querySelector("#overallScore .score-number");
const overallScoreLabelEl = document.querySelector("#overallScore .score-label");

const speedFill = document.getElementById("speedFill");
const accessibilityFill = document.getElementById("accessibilityFill");
const bestPracticesFill = document.getElementById("bestPracticesFill");
const seoFill = document.getElementById("seoFill");

const speedScoreEl = document.getElementById("speedScore");
const accessibilityScoreEl = document.getElementById("accessibilityScore");
const bestPracticesScoreEl = document.getElementById("bestPracticesScore");
const seoScoreEl = document.getElementById("seoScore");

const speedMeaningEl = document.getElementById("speedMeaning");
const accessibilityMeaningEl = document.getElementById("accessibilityMeaning");
const bestPracticesMeaningEl = document.getElementById("bestPracticesMeaning");
const seoMeaningEl = document.getElementById("seoMeaning");

const keyInsightsEl = document.getElementById("keyInsights");
const recommendationsEl = document.getElementById("recommendations");

// Email
const emailScriptEl = document.getElementById("emailScript");
const copyNotification = document.getElementById("copyNotification");

// Error
const errorEl = document.getElementById("error");

// Navigation helpers
function showStep(n) {
  [step1, step2, step3, step4].forEach(s => s.classList.add("hidden"));
  [ind1, ind2, ind3, ind4].forEach(i => i.classList.remove("active"));
  if (n >= 1) { step1.classList.toggle("hidden", n !== 1); ind1.classList.add("active"); }
  if (n >= 2) { step2.classList.toggle("hidden", n !== 2); ind2.classList.add("active"); }
  if (n >= 3) { step3.classList.toggle("hidden", n !== 3); ind3.classList.add("active"); }
  if (n >= 4) { step4.classList.toggle("hidden", n !== 4); ind4.classList.add("active"); }
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
function hideError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

// Formatting helpers
function normalizeUrl(input) {
  let v = input.trim();
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try { return new URL(v).toString(); } catch { return null; }
}
function toPct(score0to1) {
  if (typeof score0to1 !== "number") return 0;
  return Math.round(score0to1 * 100);
}
function grade(scorePercent) {
  if (scorePercent >= 90) return { label: "Excellent", cls: "good" };
  if (scorePercent >= 50) return { label: "Needs improvement", cls: "average" };
  return { label: "Poor", cls: "poor" };
}
function setBar(fillEl, percent) {
  fillEl.style.width = `${percent}%`;
  fillEl.classList.remove("good", "average", "poor");
  fillEl.classList.add(grade(percent).cls);
}
function ms(v) {
  const n = Number(v);
  if (!isFinite(n)) return "-";
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}
function getScoreEmoji(p) {
  if (p >= 90) return "✅";
  if (p >= 50) return "⚠️";
  return "❗";
}

// Loading progress (Step 3)
function setLoading(stageIndex, text) {
  if (stageIndex >= 0 && stageIndex < loadingSteps.length) {
    loadingSteps[stageIndex].classList.add("active");
  }
  if (text) loadingText.textContent = text;
}

// PSI fetch
async function fetchPSI(url, strategy = "mobile") {
  const params = new URLSearchParams({ url, strategy });
  ["performance", "accessibility", "best-practices", "seo"].forEach(c => params.append("category", c));
  if (API_KEY) params.append("key", API_KEY);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a minute.");
    throw new Error(`PageSpeed API error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

// Step actions (wired to your HTML onclick handlers)
window.goToStep1 = function goToStep1() {
  showStep(1);
};

window.goToStep2 = function goToStep2() {
  hideError();
  const name = firstNameInput.value.trim();
  const domain = domainInput.value.trim();
  if (!name || !domain) {
    showError("Please enter the client's first name and website domain.");
    return;
  }
  showStep(2);
};

window.goToStep3 = async function goToStep3() {
  hideError();

  // Capture inputs
  const firstName = firstNameInput.value.trim();
  const normalized = normalizeUrl(domainInput.value);
  if (!normalized) {
    showError("Please enter a valid website domain (e.g., example.com or https://example.com).");
    showStep(1);
    return;
  }
  const needs = Array.from(document.querySelectorAll('input[name="needs"]:checked')).map(cb => cb.value);

  state.firstName = firstName || "there";
  state.url = normalized;
  state.host = new URL(normalized).host;
  state.needs = needs;

  // Move to loading
  showStep(3);
  loadingSteps.forEach(s => s.classList.remove("active"));
  setLoading(0, "🔍 Checking website speed...");

  try {
    const data = await fetchPSI(state.url, "mobile");
    state.data = data;

    setLoading(1, "📊 Analyzing user experience...");
    await sleep(250);
    setLoading(2, "🎯 Evaluating SEO performance...");
    await sleep(250);
    setLoading(3, "✅ Generating recommendations...");
    await sleep(300);

    populateResults();
    buildInsightsAndRecommendations();
    buildEmail();

    showStep(4);
  } catch (e) {
    console.error(e);
    showError(e.message || "Failed to analyze the site. Please try again.");
    showStep(1);
  }
};

window.startOver = function startOver() {
  // Reset inputs
  firstNameInput.value = "";
  domainInput.value = "";
  document.querySelectorAll('input[name="needs"]').forEach(cb => cb.checked = false);

  // Reset state/UI
  state.firstName = "";
  state.url = "";
  state.host = "";
  state.needs = [];
  state.data = null;

  overallScoreNumberEl.textContent = "-";
  overallScoreLabelEl.textContent = "Loading...";
  [speedFill, accessibilityFill, bestPracticesFill, seoFill].forEach(el =>
