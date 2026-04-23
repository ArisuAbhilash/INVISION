/* ==========================================================
   InVision — export.js
   Format selection, toggle options, submits to Flask export routes
   ========================================================== */

let selectedFormat = "csv";
let exportFileId   = null;

const previews = {
  csv: `Name, Sales, Region<br>North Region, 42000, North<br>South Region, 38500, South<br>East Region,  51000, East<br><span style="color:var(--text3)">... more rows</span>`,
  excel: `<span style="color:var(--text3)">Binary Excel format (.xlsx)<br><br>Will include: formatted headers,<br>auto-fit columns, number formatting.</span>`,
  pdf: `<span style="color:var(--text3)">[PDF Preview]<br>━━━━━━━━━━━━━━━━━━━━━<br>  InVision Data Report<br>  Generated: ${new Date().toLocaleDateString()}<br>━━━━━━━━━━━━━━━━━━━━━<br>  EXECUTIVE SUMMARY<br>  ...</span>`,
  json: `[\n  { "Name": "North Region", "Sales": 42000 },\n  { "Name": "South Region", "Sales": 38500 },\n  ...\n]`,
};

document.addEventListener("DOMContentLoaded", () => {
  bindFormatCards();
  bindToggles();
  bindFileInput();
  bindExportButton();
  enableDragDrop("exportUploadZone", handleExportFile);

  /* Existing file select */
  const sel = document.getElementById("existingFile");
  if (sel) {
    sel.addEventListener("change", () => {
      exportFileId = sel.value || null;
      if (exportFileId) showToast(`File #${exportFileId} selected`, "info");
    });
  }
});

/* ── Format cards ────────────────────────────────────────── */
function bindFormatCards() {
  document.querySelectorAll(".format-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".format-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedFormat = card.dataset.format;

      const label   = document.getElementById("exportFormatLabel");
      const preview = document.getElementById("exportPreview");
      if (label)   label.textContent    = selectedFormat.toUpperCase();
      if (preview) preview.innerHTML    = previews[selectedFormat] || "";
    });
  });
}

/* ── Toggle switches ─────────────────────────────────────── */
function bindToggles() {
  document.querySelectorAll(".toggle").forEach((t) => {
    t.addEventListener("click", () => t.classList.toggle("on"));
  });
}

/* ── File upload ─────────────────────────────────────────── */
function bindFileInput() {
  const input = document.getElementById("exportFileInput");
  if (input) input.addEventListener("change", () => handleExportFile(input.files[0]));
}

function handleExportFile(file) {
  if (!file) return;
  exportFileId = null; /* will upload fresh */
  const infoBar = document.getElementById("exportFileInfo");
  if (infoBar) {
    infoBar.innerHTML = `<i class="fas fa-file-csv" style="color:var(--green)"></i>
      <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>`;
    infoBar.classList.remove("hidden");
  }
  /* Store for submission */
  window.__exportFile = file;
  showToast("File ready for export", "success");
}

/* ── Export button ───────────────────────────────────────── */
function bindExportButton() {
  document.getElementById("exportBtn")?.addEventListener("click", handleExport);
}

async function handleExport() {
  const url = EXPORT_URLS[selectedFormat];
  if (!url) { showToast("Unknown format", "error"); return; }

  const hasFile   = window.__exportFile;
  const hasFileId = exportFileId;

  if (!hasFile && !hasFileId) {
    showToast("Please upload a file or select a previous upload first.", "error");
    return;
  }

  showLoader(`Generating ${selectedFormat.toUpperCase()}…`);

  const fd = new FormData();
  if (hasFile)   fd.append("file",    hasFile);
  if (hasFileId) fd.append("file_id", hasFileId);

  try {
    const res = await fetch(url, { method: "POST", body: fd });

    hideLoader();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Export failed", "error");
      return;
    }

    /* Trigger browser download from blob */
    const blob     = await res.blob();
    const filename = getFilename(res, selectedFormat);
    const objUrl   = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = objUrl;
    a.download     = filename;
    a.click();
    URL.revokeObjectURL(objUrl);

    showToast(`${selectedFormat.toUpperCase()} downloaded!`, "success");
  } catch (err) {
    hideLoader();
    showToast("Network error. Is Flask running?", "error");
    console.error(err);
  }
}

function getFilename(res, fmt) {
  const cd = res.headers.get("Content-Disposition") || "";
  const m  = cd.match(/filename="?([^"]+)"?/);
  if (m) return m[1];
  const exts = { csv: ".csv", excel: ".xlsx", pdf: ".pdf", json: ".json" };
  return `invision_export${exts[fmt] || ""}`;
}
