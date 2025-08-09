const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// IMPORTANT: Do NOT commit real keys to public repos. If you must use a key on the frontend, // rotate it and restrict by HTTP referrer in Google Cloud Console. const API_KEY = ""; // paste your key locally if needed; keep blank when committing

// Step containers const step1 = document.getElementById("step1"); const step2 = document.getElementById("step2"); const step3 = document.getElementById("step3"); const step4 = document.getElementById("step4");

// Step indicators const ind1 = document.getElementById("step1-indicator"); const ind2 = document.getElementById("step2-indicator"); const ind3 = document.getElementById("step3-indicator"); const ind4 = document.getElementById("step4-indicator");

// Inputs const firstNameInput = document.getElementById("firstName"); const domainInput = document.getElementById("domain");

// Loading UI const loadingText = document.getElementById("loadingText"); const loadingSteps = [ document.getElementById("loading1"), document.getElementById("loading2"), document.getElementById("loading3"), document.getElementById("loading4"), ];

// Results UI const clientNameEl = document.getElementById("clientName"); const clientDomainEl = document.getElementById("clientDomain");

const overallScoreEl = document.querySelector("#overallScore .score-number"); const overallLabelEl = document.querySelector("#overallScore .score-label");

const speedFill = document.getElementById("speedFill"); const accessibilityFill = document.getElementById("accessibilityFill"); const bestPracticesFill = document.getElementById("bestPracticesFill"); const seoFill = document.getElementById("seoFill");

const speedScoreEl = document.getElementById("speedScore"); const accessibilityScoreEl = document.getElementById("accessibilityScore"); const bestPracticesScoreEl = document.getElementById("bestPracticesScore"); const seoScoreEl = document.getElementById("seoScore");

const speedMeaningEl = document.getElementById("speedMeaning"); const accessibilityMeaningEl = document.getElementById("accessibilityMeaning"); const bestPracticesMeaningEl = document.getElementById("bestPracticesMeaning"); const seoMeaningEl = document.getElementById("seoMeaning");

const keyInsightsEl = document.getElementById("keyInsights"); const recommendationsEl = document.getElementById("recommendations");

// Email const emailScriptEl = document.getElementById("emailScript"); const copyNotification = document.getElementById("copyNotification");

// Error area const errorEl = document.getElementById("error");

function showStep(stepNumber) { [step1, step2, step3, step4].forEach(s => s.classList.add("hidden")); [ind1, ind2, ind3, ind4].forEach(i => i.classList.remove("active")); if (stepNumber === 1) { step1.classList.remove("hidden"); ind1.classList.add("active"); } if (stepNumber === 2) { step2.classList.remove("hidden"); ind1.classList.add("active"); ind2.classList.add("active"); } if (stepNumber === 3) { step3.classList.remove("hidden"); ind1.classList.add("active"); ind2.classList.add("active"); ind3.classList.add("active"); } if (stepNumber === 4) { step4.classList.remove("hidden"); [ind1, ind2, ind3, ind4].forEach(i => i.classList.add("active")); } }

function showError(msg) { errorEl.textContent = msg; errorEl.classList.remove("hidden"); } function hideError() { errorEl.textContent = ""; errorEl.classList.add("hidden"); }

function normalizeUrl(input) { let v = input.trim(); if (!/^https?:///i.test(v)) v = "https://" + v; try { return new URL(v).toString(); } catch { return null; } }

function grade(score) { if (score >= 90) return { label: "Excellent", cls: "good" }; if (score >= 50) return { label: "Needs improvement", cls: "average" }; return { label: "Poor", cls: "poor" }; }

function setBar(fillEl, score) { fillEl.style.width = ${score}%; fillEl.classList.remove("good","average","poor"); fillEl.classList.add(grade(score).cls); }

function percent(x) { return ${Math.round(x)}%; }

function setLoading(stageIndex, text) { if (stageIndex >= 0 && stageIndex < loadingSteps.length) { loadingSteps[stageIndex].classList.add("active"); } loadingText.textContent = text; }

async function fetchPSI(url, strategy = "mobile") { const params = new URLSearchParams({ url, strategy, category: "performance", }); // Add all categories explicitly ["accessibility", "best-practices", "seo"].forEach(c => params.append("category", c)); if (API_KEY) params.append("key", API_KEY);

const res = await fetch(${PSI_ENDPOINT}?${params.toString()}); if (!res.ok) { let text = ""; try { text = await res.text(); } catch {} if (res.status === 429) throw new Error("Rate limit reached. Please wait a minute and try again."); throw new Error(PageSpeed API error ${res.status}${text ? ": " + text : ""}); } return res.json(); }

// Public functions used by your HTML onclick handlers window.goToStep1 = function goToStep1() { showStep(1); }; window.goToStep2 = function goToStep2() { hideError(); if (!firstNameInput.value.trim() || !domainInput.value.trim()) { showError("Please enter the client's first name and website domain."); return; } showStep(2); }; window.goToStep3 = function goToStep3() { hideError(); showStep(3); startAnalysis(); }; window.startOver = function startOver() { // Reset inputs and UI firstNameInput.value = ""; domainInput.value = ""; document.querySelectorAll('input[name="needs"]').forEach(cb => cb.checked = false); keyInsightsEl.innerHTML = ""; recommendationsEl.innerHTML = ""; emailScriptEl.value = ""; copyNotification.classList.add("hidden"); loadingSteps.forEach(s => s.classList.remove("active")); overallScoreEl.textContent = "-"; overallLabelEl.textContent = "Loading..."; [speedFill, accessibilityFill, bestPracticesFill, seoFill].forEach(el => { el.style.width = "0%
