// ---- Settings ----
const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const API_KEY = "AIzaSyCxgTk1lBlOa-uzuyEolsu6aqaiuSVoCM4"; // Optional but recommended. Restrict by HTTP referrer in GCP.

// ---- DOM ----
const steps = {
  1: document.getElementById("step1"),
  2: document.getElementById("step2"),
  3: document.getElementById("step3"),
  4: document.getElementById("step4"),
};

const indicators = {
  1: document.getElementById("step1-indicator"),
  2: document.getElementById("step2-indicator"),
  3: document.getElementById("step3-indicator"),
  4: document.getElementById("step4-indicator"),
};

const firstNameInput = document.getElementById("firstName");
const domainInput = document.getElementById("domain");
const errorEl = document.getElementById("error");

const clientNameEl = document.getElementById("clientName");
const clientDomainEl = document.getElementById("clientDomain");

const overallScoreEl = document.getElementById("overallScore");
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
const emailScriptEl = document.getElementById("emailScript");
const copyNotification = document.getElementById("copyNotification");

const loadingText = document.getElementById("loadingText");
const loadingSteps = [
  document.getElementById("loading1"),
  document.getElementById("loading2"),
  document.getElementById("loading3"),
  document.getElementById("loading4"),
];

// ---- Navigation ----
function showStep(n) {
  Object.values(steps).forEach(el => el.classList.add("hidden"));
  steps[n].classList.remove("hidden");
  Object.values(indicators).forEach(el => el.classList.remove("active"));
  for (let i = 1; i <= n; i++) indicators[i].classList.add("active");
}

function goToStep1() { showStep(1); }
function goToStep2() {
  if (!firstNameInput.value.trim() || !domainInput.value.trim()) {
    showError("Please enter the client's first name and website domain.");
    return;
  }
  hideError(); showStep(2);
}
function goToStep3() {
  hideError(); showStep(3);
  startAnalysis();
}
function goToStep4() { hideError(); showStep(4); }

// ---- Helpers ----
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
function hideError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function normalizeUrl(input) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try { return new URL(url).toString(); } catch { return null; }
}

function pct(n) { return `${Math.round(n)}%`; }
function grade(score) {
  if (score >= 90) return { label: "Good", class: "good" };
  if (score >= 50) return { label: "Needs improvement", class: "average" };
  return { label: "Poor", class: "poor" };
}

function setBar(fillEl, score) {
  fillEl.style.width = `${score}%`;
  fillEl.classList.remove("good","average","poor");
  fillEl.classList.add(grade(score).class);
}

function msToSec(ms) { return (ms / 1000).toFixed(2); }

// ---- Analysis ----
async function startAnalysis() {
  // Visual progression
  setLoading(0, "🔍 Checking website speed...");
  const url = normalizeUrl(domainInput.value);
  if (!url) { showError("Please enter a valid URL."); showStep(1); return; }

  clientNameEl.textContent = firstNameInput.value.trim();
  clientDomainEl.textContent = new URL(url).host;

  try {
    const data = await fetchPSI(url, "mobile");
    setLoading(1, "📊 Analyzing user experience...");
    populateResults(data);

    setLoading(2, "🎯 Evaluating SEO performance...");
    // Small pause for UX
    await sleep(250);

    setLoading(3, "✅ Generating recommendations...");
    buildInsightsAndRecommendations(data);

    setLoading(4, "Done");
    goToStep4();
  } catch (e) {
    console.error(e);
    showError(e.message || "Failed to analyze the site. Please try again.");
    showStep(1);
  }
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function setLoading(stageIndex, text) {
  if (stageIndex < loadingSteps.length) {
    loadingSteps[stageIndex].classList.add("active");
  }
  loadingText.textContent = text;
}

async function fetchPSI(url, strategy = "mobile") {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
    category: "accessibility",
    "category": "best-practices",
    "category": "seo",
  });
  if (API_KEY) params.append("key", API_KEY);

  const resp = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`PSI error ${resp.status}: ${text || resp.statusText}`);
  }
  return resp.json();
}

function populateResults(data) {
  const lr = data.lighthouseResult;

  const scores = {
    performance: Math.round((lr.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((lr.categories.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((lr.categories["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((lr.categories.seo?.score ?? 0) * 100),
  };

  // Bars + labels
  speedScoreEl.textContent = pct(scores.performance);
  accessibilityScoreEl.textContent = pct(scores.accessibility);
  bestPracticesScoreEl.textContent = pct(scores.bestPractices);
  seoScoreEl.textContent = pct(scores.seo);

  speedMeaningEl.textContent = grade(scores.performance).label;
  accessibilityMeaningEl.textContent = grade(scores.accessibility).label;
  bestPracticesMeaningEl.textContent = grade(scores.bestPractices).label;
  seoMeaningEl.textContent = grade(scores.seo).label;
