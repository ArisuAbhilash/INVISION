const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const columnSelection = document.getElementById("columnSelection");
const labelCol = document.getElementById("labelCol");
const valueCol = document.getElementById("valueCol");
const chartTypeSelect = document.getElementById("chartType");
const showLegend = document.getElementById("showLegend");
const generateBtn = document.getElementById("generateChart");
const downloadSection = document.getElementById("downloadSection");
const downloadBtn = document.getElementById("downloadChart");

let uploadedFile;
let myChart = null;

// When user uploads file, ask backend for columns
uploadForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!fileInput.files.length) {
    alert("Choose a file first.");
    return;
  }

  uploadedFile = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", uploadedFile);

  try {
    const resp = await fetch("/visualize", { method: "POST", body: formData });
    const result = await resp.json();

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.columns) {
      // populate selects
      labelCol.innerHTML = "";
      valueCol.innerHTML = "";
      result.columns.forEach(col => {
        labelCol.insertAdjacentHTML("beforeend", `<option value="${col}">${col}</option>`);
        valueCol.insertAdjacentHTML("beforeend", `<option value="${col}">${col}</option>`);
      });
      columnSelection.style.display = "block";

      // set multi/single depending on current chart type initially
      toggleValueSelectMode(chartTypeSelect.value);
    }
  } catch (err) {
    console.error(err);
    alert("Upload failed. Check console for details.");
  }
});

// Toggle multi-selection based on chart type
function toggleValueSelectMode(type) {
  // For pie/doughnut/radar/polarArea - single selection
  const singleTypes = ["pie", "doughnut", "radar", "polarArea"];
  if (singleTypes.includes(type)) {
    valueCol.multiple = false;
    // If more than one option selected, keep only the first selected
    const opts = Array.from(valueCol.options);
    const anySelected = opts.find(o => o.selected);
    // clear and re-select first option or previously selected one
    opts.forEach(o => o.selected = false);
    if (anySelected) anySelected.selected = true;
    else if (opts.length) opts[0].selected = true;
  } else {
    // allow multiple for line/bar
    valueCol.multiple = true;
  }
}

chartTypeSelect.addEventListener("change", (e) => {
  toggleValueSelectMode(e.target.value);
});

// Generate chart (when user has selected columns)
generateBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  if (!uploadedFile) {
    alert("Please upload a file first.");
    return;
  }

  const selectedLabel = labelCol.value;
  const selectedValues = Array.from(valueCol.selectedOptions).map(o => o.value);

  if (!selectedLabel) {
    alert("Please choose a label column.");
    return;
  }
  if (!selectedValues.length) {
    alert("Please choose at least one value column.");
    return;
  }

  // If pie/doughnut/radar/polarArea, ensure only one selected (enforce)
  const singleTypes = ["pie", "doughnut", "radar", "polarArea"];
  if (singleTypes.includes(chartTypeSelect.value) && selectedValues.length > 1) {
    alert("This chart type supports only one value column. Please select one.");
    return;
  }

  // Build form data: append file and repeated value_col fields
  const formData = new FormData();
  formData.append("file", uploadedFile);
  formData.append("label_col", selectedLabel);
  // append each value column as a separate field
  selectedValues.forEach(v => formData.append("value_col", v));

  try {
    const resp = await fetch("/visualize", { method: "POST", body: formData });
    const result = await resp.json();

    if (result.error) {
      alert(result.error);
      return;
    }

    // result should be { labels: [...], datasets: [{label, data}, ...] }
    const ctx = document.getElementById("myChart").getContext("2d");
    if (myChart) myChart.destroy();

    // map datasets from backend to Chart.js datasets
    const chartDatasets = result.datasets.map((ds, idx) => {
      if (chartTypeSelect.value === "line") {
        return {
          label: ds.label,
          data: ds.data,
          borderColor: `hsl(${(idx * 70) % 360} 70% 40%)`,
          backgroundColor: `hsl(${(idx * 70) % 360} 70% 60% / 0.3)`,
          tension: 0.2,
          fill: false,
        };
      } else if (chartTypeSelect.value === "bar") {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: `hsl(${(idx * 70) % 360} 70% 60% / 0.6)`,
          borderColor: `hsl(${(idx * 70) % 360} 70% 40% / 1)`,
          borderWidth: 1
        };
      } else {
        // pie/doughnut/radar/polarArea: single dataset handled by backend as one dataset
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.data.map((_, j) => `hsl(${(j * 40 + idx * 30) % 360} 70% 60% / 0.7)`),
          borderColor: ds.data.map((_, j) => `hsl(${(j * 40 + idx * 30) % 360} 70% 40% / 1)`),
          borderWidth: 1
        };
      }
    });

    myChart = new Chart(ctx, {
      type: chartTypeSelect.value,
      data: {
        labels: result.labels,
        datasets: chartDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend.checked },
          title: {
            display: true,
            text: `${chartTypeSelect.value.toUpperCase()} Chart`
          }
        },
        scales: (chartTypeSelect.value === "pie" || chartTypeSelect.value === "doughnut" ||
                 chartTypeSelect.value === "radar" || chartTypeSelect.value === "polarArea")
          ? {}
          : { y: { beginAtZero: true } }
      }
    });

    // show download button area
    downloadSection.style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Failed to generate chart. Check console for details.");
  }
});

// Download chart
downloadBtn.addEventListener("click", function () {
  if (!myChart) {
    alert("Generate a chart first.");
    return;
  }
  const link = document.createElement("a");
  link.href = myChart.toBase64Image();
  link.download = "chart.png";
  link.click();
});

// ensure toggle initial mode based on default chart type
toggleValueSelectMode(chartTypeSelect.value);

// Also force Chart resize when window size changes (fixes stuck-size)
window.addEventListener("resize", () => { if (myChart) myChart.resize(); });
