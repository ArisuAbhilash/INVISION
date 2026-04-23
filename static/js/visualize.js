/* ==========================================================
   InVision — visualize.js
   CSV/Excel upload → Flask API → Chart.js rendering
   ========================================================== */

/* State */
let parsedData   = [];
let columns      = [];
let chartType    = "bar";
let mainChart    = null;
let currentFileId = null;

document.addEventListener("DOMContentLoaded", () => {
  bindFileInput();
  bindControls();
  bindSampleButton();
  enableDragDrop("uploadZone", handleFile);
});

/* ── File input binding ─────────────────────────────────── */
function bindFileInput() {
  const input = document.getElementById("fileInput");
  if (input) input.addEventListener("change", () => handleFile(input.files[0]));

  document.getElementById("clearFileBtn")?.addEventListener("click", clearFile);
}

/* ── Handle file (upload to Flask) ─────────────────────────*/
async function handleFile(file) {
  if (!file) return;

  const allowed = ["text/csv", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
  const extOk = /\.(csv|xlsx|xls)$/i.test(file.name);
  if (!extOk) {
    showToast("Unsupported file type. Use CSV or Excel.", "error");
    return;
  }

  showLoader("Uploading and parsing file…");

  const fd = new FormData();
  fd.append("file", file);

  try {
    const res  = await fetch(UPLOAD_URL, { method: "POST", body: fd });
    const data = await res.json();
    hideLoader();

    if (data.error) { showToast(data.error, "error"); return; }

    /* Store state */
    parsedData    = data.preview;   /* array of row objects */
    columns       = data.columns;
    currentFileId = data.file_id;

    /* Update UI */
    document.getElementById("fileName").textContent  = data.filename;
    document.getElementById("fileStats").textContent =
      `${data.rows.toLocaleString()} rows · ${data.cols} columns · ${data.size_kb} KB`;
    showEl("fileInfoBar");
    hideEl("uploadZone");

    populateColumnSelects(columns);
    showEl("visControls");
    renderDataPreview(columns, parsedData.slice(0, 6));
    renderChart();

    showToast(`Loaded ${data.rows.toLocaleString()} rows`, "success");
  } catch (err) {
    hideLoader();
    showToast("Upload failed. Is the Flask server running?", "error");
    console.error(err);
  }
}

/* ── Sample data (no backend needed) ───────────────────────*/
function bindSampleButton() {
  document.getElementById("loadSampleBtn")?.addEventListener("click", () => {
    const sample = [
      { Month: "January",   Sales: 42000, Expenses: 28000, Profit: 14000 },
      { Month: "February",  Sales: 38500, Expenses: 25000, Profit: 13500 },
      { Month: "March",     Sales: 51000, Expenses: 32000, Profit: 19000 },
      { Month: "April",     Sales: 45000, Expenses: 29000, Profit: 16000 },
      { Month: "May",       Sales: 58000, Expenses: 35000, Profit: 23000 },
      { Month: "June",      Sales: 63000, Expenses: 38000, Profit: 25000 },
      { Month: "July",      Sales: 55000, Expenses: 33000, Profit: 22000 },
      { Month: "August",    Sales: 71000, Expenses: 42000, Profit: 29000 },
    ];
    parsedData    = sample;
    columns       = Object.keys(sample[0]);
    currentFileId = null;

    document.getElementById("fileName").textContent  = "sample_data.csv";
    document.getElementById("fileStats").textContent = `${sample.length} rows · ${columns.length} columns`;
    showEl("fileInfoBar");
    hideEl("uploadZone");

    populateColumnSelects(columns);
    showEl("visControls");
    renderDataPreview(columns, sample);
    renderChart();
    showToast("Sample data loaded", "success");
  });
}

/* ── Column selects ─────────────────────────────────────── */
function populateColumnSelects(cols) {
  const labelSel = document.getElementById("labelCol");
  const valueSel = document.getElementById("valueCol");
  if (!labelSel || !valueSel) return;

  const opts = cols.map(c => `<option value="${c}">${c}</option>`).join("");
  labelSel.innerHTML = opts;
  valueSel.innerHTML = opts;
  /* Default: first col for label, second for value */
  if (cols.length > 1) valueSel.value = cols[1];

  labelSel.addEventListener("change", renderChart);
  valueSel.addEventListener("change", renderChart);
}

/* ── Control bindings ───────────────────────────────────── */
function bindControls() {
  /* Chart type buttons */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".chart-type-btn");
    if (!btn) return;
    document.querySelectorAll(".chart-type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    chartType = btn.dataset.type;
    renderChart();
  });

  document.getElementById("generateBtn")?.addEventListener("click", renderChart);
  document.getElementById("showLegend")?.addEventListener("change", renderChart);
  document.getElementById("showGrid")?.addEventListener("change", renderChart);
  document.getElementById("downloadChartBtn")?.addEventListener("click", downloadChart);
  document.getElementById("saveChartBtn")?.addEventListener("click", saveChart);
}

/* ── Render chart ───────────────────────────────────────── */
function renderChart() {
  if (!parsedData.length) return;

  const labelCol  = document.getElementById("labelCol")?.value;
  const valueCol  = document.getElementById("valueCol")?.value;
  const showLeg   = document.getElementById("showLegend")?.checked ?? true;
  const showGrid  = document.getElementById("showGrid")?.checked ?? true;
  if (!labelCol || !valueCol) return;

  const labels = parsedData.map(r => String(r[labelCol] ?? ""));
  const values = parsedData.map(r => parseFloat(r[valueCol]) || 0);

  const palette = [
    "#6c63ff", "#00d4aa", "#f59e0b", "#f43f5e",
    "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  ];

  const isDark    = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#606070" : "#999aaa";
  const textColor = isDark ? "#a0a0b0" : "#555568";
  const isRadial  = ["pie", "doughnut", "radar", "polarArea"].includes(chartType);

  const bgColors = isRadial
    ? palette.slice(0, values.length)
    : palette.map(c => c + "cc");

  const canvas = document.getElementById("mainChart");
  if (!canvas) return;

  if (mainChart) mainChart.destroy();

  mainChart = new Chart(canvas, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: valueCol,
        data: values,
        backgroundColor: bgColors,
        borderColor: chartType === "line" ? "#6c63ff" : bgColors,
        borderWidth: chartType === "line" ? 2 : 0,
        borderRadius: chartType === "bar" ? 6 : 0,
        tension: 0.4,
        fill: chartType === "line"
          ? { target: "origin", above: "rgba(108,99,255,0.08)" }
          : false,
        pointBackgroundColor: "#6c63ff",
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: {
          display: showLeg,
          labels: { color: textColor, font: { family: "DM Sans" }, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: isDark ? "#1e1e28" : "#fff",
          titleColor: isDark ? "#f0f0f5" : "#0f0f1a",
          bodyColor: textColor,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderWidth: 1,
        },
      },
      scales: isRadial ? {} : {
        x: {
          grid: { color: showGrid ? gridColor : "transparent" },
          ticks: { color: tickColor },
        },
        y: {
          grid: { color: showGrid ? gridColor : "transparent" },
          ticks: { color: tickColor },
        },
      },
    },
  });

  showEl("chartArea");
  const lc = document.getElementById("labelCol").value;
  const vc = document.getElementById("valueCol").value;
  document.getElementById("chartTitle").textContent    = `${vc} by ${lc}`;
  document.getElementById("chartSubtitle").textContent =
    `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart · ${parsedData.length} rows`;
  showEl("downloadChartBtn");

  /* Re-apply theme on change */
  window.__currentChart = mainChart;
}

/* ── Download chart as PNG ──────────────────────────────── */
function downloadChart() {
  if (!mainChart) return;
  const a = document.createElement("a");
  a.download = "invision_chart.png";
  a.href = document.getElementById("mainChart").toDataURL("image/png");
  a.click();
  showToast("Chart downloaded!", "success");
}

/* ── Save chart to backend ──────────────────────────────── */
async function saveChart() {
  if (!mainChart) return;

  const labelCol = document.getElementById("labelCol").value;
  const valueCol = document.getElementById("valueCol").value;
  const title    = `${valueCol} by ${labelCol}`;
  const preview  = document.getElementById("mainChart").toDataURL("image/png");

  const payload = {
    file_id:    currentFileId,
    title,
    chart_type: chartType,
    label_col:  labelCol,
    value_col:  valueCol,
    preview_img: preview.substring(0, 200), /* truncated for DB */
  };

  try {
    const res  = await fetch(SAVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) showToast("Chart saved to your dashboard!", "success");
    else showToast("Could not save chart", "error");
  } catch (_) {
    showToast("Network error saving chart", "error");
  }
}

/* ── Data preview table ─────────────────────────────────── */
function renderDataPreview(cols, rows) {
  const wrap = document.getElementById("dataPreview");
  const tbl  = document.getElementById("previewTable");
  if (!wrap || !tbl) return;

  document.getElementById("rowCount").textContent =
    `${parsedData.length.toLocaleString()} rows`;

  const thead = `<thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r =>
    `<tr>${cols.map(c => `<td>${r[c] ?? "-"}</td>`).join("")}</tr>`
  ).join("")}</tbody>`;
  tbl.innerHTML = thead + tbody;
  showEl("dataPreview");
}

/* ── Clear file ─────────────────────────────────────────── */
function clearFile() {
  parsedData    = [];
  columns       = [];
  currentFileId = null;

  hideEl("fileInfoBar");
  hideEl("visControls");
  hideEl("chartArea");
  hideEl("dataPreview");
  hideEl("downloadChartBtn");
  showEl("uploadZone");

  document.getElementById("fileInput").value = "";
  if (mainChart) { mainChart.destroy(); mainChart = null; }
}

/* ── DOM helpers ────────────────────────────────────────── */
function showEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}
