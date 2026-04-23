/* ==========================================================
   InVision — report.js
   Document analysis: uploads to Flask /report/analyze,
   animates results into the UI
   ========================================================== */

let reportFile = null;

document.addEventListener("DOMContentLoaded", () => {
  bindReportInput();
  enableDragDrop("reportUploadZone", setReportFile);
  document.getElementById("analyzeBtn")?.addEventListener("click", runAnalysis);
  document.getElementById("clearReportBtn")?.addEventListener("click", clearReport);
});

/* ── File selection ─────────────────────────────────────── */
function bindReportInput() {
  const input = document.getElementById("reportFileInput");
  if (!input) return;
  input.addEventListener("change", () => {
    if (input.files[0]) setReportFile(input.files[0]);
  });
}

function setReportFile(file) {
  const allowed = /\.(pdf|docx|txt)$/i;
  if (!allowed.test(file.name)) {
    showToast("Unsupported type. Use PDF, DOCX, or TXT.", "error");
    return;
  }
  reportFile = file;
  document.getElementById("reportFileName").textContent = file.name;
  document.getElementById("reportFileInfo").classList.remove("hidden");
  document.getElementById("reportUploadZone").style.display = "none";
}

function clearReport() {
  reportFile = null;
  document.getElementById("reportFileInput").value = "";
  document.getElementById("reportFileInfo").classList.add("hidden");
  document.getElementById("reportUploadZone").style.display = "";
  document.getElementById("reportResults").classList.add("hidden");
  document.getElementById("reportError").classList.add("hidden");
}

/* ── Run analysis ───────────────────────────────────────── */
async function runAnalysis() {
  if (!reportFile) {
    showToast("Please select a document first.", "error");
    return;
  }

  showLoader("Analysing document…");
  hideError();

  /* Animate progress bar */
  const prog = document.getElementById("reportProgress");
  let pct = 0;
  const ticker = setInterval(() => {
    pct = Math.min(pct + Math.random() * 12, 90);
    if (prog) prog.style.width = pct + "%";
  }, 250);

  const fd = new FormData();
  fd.append("document", reportFile);

  try {
    const res  = await fetch(ANALYZE_URL, { method: "POST", body: fd });
    const data = await res.json();

    clearInterval(ticker);
    if (prog) prog.style.width = "100%";
    hideLoader();

    if (data.error) {
      showError(data.error);
      return;
    }

    renderResults(data);
    showToast("Analysis complete!", "success");
  } catch (err) {
    clearInterval(ticker);
    hideLoader();
    showError("Could not reach the server. Is Flask running?");
    console.error(err);
  }
}

/* ── Render results ─────────────────────────────────────── */
function renderResults({ metadata, analysis }) {
  const results = document.getElementById("reportResults");
  results.classList.remove("hidden");

  /* Summary */
  const summaryEl = document.getElementById("reportSummary");
  if (summaryEl) summaryEl.textContent = analysis.summary || "No summary available.";

  /* Sentiment */
  const s = analysis.sentiment;
  const badge = document.getElementById("sentimentBadge");
  if (badge) {
    badge.textContent  = s.label;
    badge.className    = `sentiment-pill ${s.label.toLowerCase()}`;
  }
  setTimeout(() => {
    const polBar = document.getElementById("polarityBar");
    const subBar = document.getElementById("subjectivityBar");
    if (polBar) polBar.style.width = Math.round(s.polarity * 100) + "%";
    if (subBar) subBar.style.width = Math.round(s.subjectivity * 100) + "%";
  }, 200);

  /* Keywords */
  const cloud = document.getElementById("wordCloud");
  if (cloud) {
    cloud.innerHTML = analysis.top_words.map((item, i) => {
      const sizeClass = i < 3 ? "large" : i < 6 ? "medium" : "";
      return `<span class="word-tag ${sizeClass}">${item.word} <small style="opacity:.6">${item.count}</small></span>`;
    }).join("");
  }

  /* Metadata table */
  const metaTbl = document.getElementById("metaTable");
  if (metaTbl) {
    metaTbl.innerHTML = Object.entries(metadata).map(([k, v]) =>
      `<tr><td>${k}</td><td>${v}</td></tr>`
    ).join("");
  }

  /* Insights */
  const icons = ["📈", "⚠️", "✅", "💡", "📊", "🔍"];
  const insights = [
    `Readability level: <strong>${analysis.readability}</strong>`,
    `Word count: <strong>${analysis.word_count.toLocaleString()}</strong> words across <strong>${analysis.sentences}</strong> sentences.`,
    `Sentiment: <strong>${s.label}</strong> (polarity ${s.polarity}, subjectivity ${s.subjectivity})`,
    `Top keyword: <strong>"${analysis.top_words[0]?.word || "—"}"</strong> appears ${analysis.top_words[0]?.count || 0} times.`,
  ];
  const insightList = document.getElementById("insightList");
  if (insightList) {
    insightList.innerHTML = insights.map((text, i) =>
      `<div class="insight-item"><span class="icon">${icons[i] || "📌"}</span><div>${text}</div></div>`
    ).join("");
  }

  /* Scroll into view */
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Error boundary ─────────────────────────────────────── */
function showError(msg) {
  const el = document.getElementById("reportError");
  const msgEl = document.getElementById("reportErrorMsg");
  if (el) el.classList.remove("hidden");
  if (msgEl) msgEl.textContent = msg;
}
function hideError() {
  document.getElementById("reportError")?.classList.add("hidden");
}
