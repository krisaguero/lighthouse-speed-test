// Lighthouse Client Report Builder
// Uses Google PageSpeed Insights (Lighthouse) API, no backend required.

// Configuration
const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Global state
const state = {
  name: "",
  url: "",
  host: "",
  strategy: "mobile",
  categories: ["performance", "accessibility", "best-practices", "seo"],
  apiKey: "",
  data: null,
  proposalItems: [],
};

// DOM helpers
const qs = (sel, p = document) => p.querySelector(sel);
const qsa = (sel, p = document) => Array.from(p.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

// Elements: navigation and pages
const pages = {
  1: byId("s-1"),
  2: byId("s-2"),
  3: byId("s-3"),
  4: byId("s-4"),
  5: byId("s-5"),
};
const navBtns = {
  1: byId("nav-1"),
  2: byId("nav-2"),
  3: byId("nav-3"),
  4: byId("nav-4"),
  5: byId("nav-5"),
};

// Elements: Step 1
const setupForm = byId("setupForm");
const clientNameInput = byId("clientName");
const siteUrlInput = byId("siteUrl");
const strategySelect = byId("strategy");
const apiKeyInput = byId("apiKey");
const rememberSettings = byId("rememberSettings");

// Elements: Step 2
const runUrlEl = byId("runUrl");
const runDeviceEl = byId("runDevice");
const runBtn = byId("runBtn");
const openPSIBtn = byId("openPSI");
const shareLinkEl = byId("shareLink");
const spinnerEl = byId("spinner");
const statusTextEl = byId("statusText");
const errorBoxEl = byId("errorBox");
const backToSetupBtn = byId("backToSetup");
const toFindingsBtn = byId("toFindings");

// Elements: Step 3
const scoreCardsEl = byId("scoreCards");
const metricsEl = byId("metrics");
const opportunitiesEl = byId("opportunities");
const finalScreenshotEl = byId("finalScreenshot");
const psiLinkEl = byId("psiLink");
const jsonDownloadEl = byId("jsonDownload");
const backToRunBtn = byId("backToRun");
const toProposalBtn = byId("toProposal");

// Elements: Step 4
const proposalItemsEl = byId("proposalItems");
const addCustomItemBtn = byId("addCustomItem");
const totalOneTimeEl = byId("totalOneTime");
const totalMonthlyEl = byId("totalMonthly");
const backToFindingsBtn = byId("backToFindings");
const toEmailBtn = byId("toEmail");

// Elements: Step 5
const emailBodyEl = byId("emailBody");
const copyEmailBtn = byId("copyEmail");
const openMailBtn = byId("openMail");
const copyNoticeEl = byId("copyNotice");
const restartBtn = byId("restart");

// Theme
const themeToggleBtn = byId("themeToggle");

// Utilities
function normalizeUrl(input) {
  let v = String(input || "").trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    return new URL(v).toString();
  } catch {
    return null;
  }
}
function pctFrom01(n) {
  return Math.round((Number(n) || 0) * 100);
}
function gradeClass(pct) {
  if (pct >= 90) return "good";
  if (pct >= 50) return "average";
  return "poor";
}
function fmtMs(ms) {
  if (ms == null || isNaN(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// Step/page routing
let currentStep = 1;
function setStep(n) {
  currentStep = n;
  Object.values(pages).forEach((p) => p.classList.add("hidden"));
  Object.values(navBtns).forEach((b) => b.classList.remove("active"));
  pages[n].classList.remove("hidden");
  navBtns[n].classList.add("active");
  // Enable nav up to current step
  for (let i = 1; i <= 5; i++) {
    navBtns[i].disabled = i > n;
  }
}
function enableStep(n, enabled) {
  navBtns[n].disabled = !enabled;
}

// Local storage
const LS_KEY = "crb.settings.v1";
function saveLocalSettings() {
  if (!rememberSettings.checked) return;
  const selectedCats = qsa('input[name="category"]:checked').map((cb) => cb.value);
  const payload = {
    name: clientNameInput.value.trim(),
    url: siteUrlInput.value.trim(),
    strategy: strategySelect.value,
    categories: selectedCats,
    apiKey: apiKeyInput.value || "",
    remember: rememberSettings.checked,
  };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}
function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.name) clientNameInput.value = s.name;
    if (s.url) siteUrlInput.value = s.url;
    if (s.strategy) strategySelect.value = s.strategy;
    if (Array.isArray(s.categories)) {
      qsa('input[name="category"]').forEach((cb) => (cb.checked = s.categories.includes(cb.value)));
    }
    if (s.apiKey) apiKeyInput.value = s.apiKey;
    rememberSettings.checked = !!s.remember;
  } catch {}
}

// URL params
function applyUrlParams() {
  const u = new URL(location.href);
  const url = u.searchParams.get("url");
  const strategy = u.searchParams.get("strategy");
  const name = u.searchParams.get("name");
  const cats = u.searchParams.get("cats");

  if (name) clientNameInput.value = name;
  if (url) siteUrlInput.value = url;
  if (strategy && (strategy === "mobile" || strategy === "desktop")) {
    strategySelect.value = strategy;
  }
  if (cats) {
    const chosen = cats.split(",").map((s) => s.trim()).filter(Boolean);
    qsa('input[name="category"]').forEach((cb) => (cb.checked = chosen.includes(cb.value)));
  }
}

// Share link
function buildShareLink() {
  const u = new URL(location.href);
  u.search = "";
  u.hash = "";
  const chosenCats = qsa('input[name="category"]:checked').map((cb) => cb.value).join(",");
  const url = siteUrlInput.value.trim();
  const params = new URLSearchParams({
    url,
    strategy: strategySelect.value,
    name: clientNameInput.value.trim(),
    cats: chosenCats,
  });
  const href = `${u.toString().replace(/\/$/, "")}?${params.toString()}`;
  shareLinkEl.href = href;
  return href;
}

// PSI fetch
async function fetchPSI(url, strategy, categories, apiKey) {
  const params = new URLSearchParams({ url, strategy });
  categories.forEach((c) => params.append("category", c));
  if (apiKey) params.append("key", apiKey);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    if (res.status === 429) throw new Error("Rate limit reached. Please retry in a minute.");
    throw new Error(`PageSpeed API error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

// Populate Step 2 summary
function fillRunSummary() {
  runUrlEl.textContent = state.url;
  runDeviceEl.textContent = state.strategy;
  buildShareLink();
  openPSIBtn.onclick = () => {
    const href = `https://pagespeed.web.dev/report?url=${encodeURIComponent(state.url)}&form_factor=${state.strategy === "mobile" ? "mobile" : "desktop"}`;
    window.open(href, "_blank", "noopener");
  };
}

// Status helpers
function setStatus(text, loading = false, isError = false) {
  statusTextEl.textContent = text;
  spinnerEl.hidden = !loading;
  errorBoxEl.classList.toggle("hidden", !isError);
  if (isError) {
    errorBoxEl.textContent = text;
  } else {
    errorBoxEl.textContent = "";
  }
}

// Findings builders
function renderScores(lr) {
  const cats = [
    { key: "performance", label: "Performance" },
    { key: "accessibility", label: "Accessibility" },
    { key: "best-practices", label: "Best Practices" },
    { key: "seo", label: "SEO" },
  ];
  scoreCardsEl.innerHTML = "";
  cats.forEach((c) => {
    if (!lr.categories[c.key]) return;
    const pct = pctFrom01(lr.categories[c.key].score);
    const div = document.createElement("div");
    div.className = `score-card ${gradeClass(pct)}`;
    div.innerHTML = `
      <div class="score-label">${c.label}</div>
      <div class="score-value">${pct}</div>
    `;
    scoreCardsEl.appendChild(div);
  });
}

function renderMetrics(audits) {
  const keys = [
    { id: "first-contentful-paint", label: "First Contentful Paint" },
    { id: "largest-contentful-paint", label: "Largest Contentful Paint" },
    { id: "total-blocking-time", label: "Total Blocking Time" },
    { id: "cumulative-layout-shift", label: "Cumulative Layout Shift" },
    { id: "speed-index", label: "Speed Index" },
    { id: "interactive", label: "Time to Interactive" },
  ];
  metricsEl.innerHTML = "";
  keys.forEach((k) => {
    const a = audits[k.id];
    if (!a) return;
    const row = document.createElement("div");
    row.className = "metric-row";
    row.innerHTML = `
      <div class="metric-name">${k.label}</div>
      <div class="metric-value">${escapeHtml(a.displayValue || "-")}</div>
    `;
    metricsEl.appendChild(row);
  });
}

function renderOpportunities(audits) {
  const list = [];
  Object.values(audits).forEach((a) => {
    if (a.details && a.details.type === "opportunity") {
      list.push({
        id: a.id,
        title: a.title,
        desc: a.description || "",
        savingsMs: a.details.overallSavingsMs || 0,
        displayValue: a.displayValue || "",
      });
    }
  });
  list.sort((a, b) => (b.savingsMs || 0) - (a.savingsMs || 0));
  const top
