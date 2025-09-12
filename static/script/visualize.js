const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const columnSelection = document.getElementById("columnSelection");
const labelCol = document.getElementById("labelCol");
const valueCol = document.getElementById("valueCol");
const chartTypeSelect = document.getElementById("chartType");
const showLegend = document.getElementById("showLegend");
const generateBtn = document.getElementById("generateChart");

let uploadedFile;
let myChart = null;

uploadForm.addEventListener("submit", async function(e) {
  e.preventDefault();
  let formData = new FormData();
  uploadedFile = fileInput.files[0];
  formData.append("file", uploadedFile);

  let response = await fetch("/visualize", { method: "POST", body: formData });
  let result = await response.json();

  if (result.error) {
    alert(result.error);
    return;
  }

  if (result.columns) {
    // Populate dropdowns
    labelCol.innerHTML = "";
    valueCol.innerHTML = "";
    result.columns.forEach(col => {
      labelCol.innerHTML += `<option value="${col}">${col}</option>`;
      valueCol.innerHTML += `<option value="${col}">${col}</option>`;
    });

    columnSelection.style.display = "block";
  }
});

generateBtn.addEventListener("click", async function() {
  let formData = new FormData();
  formData.append("file", uploadedFile);
  formData.append("label_col", labelCol.value);
  formData.append("value_col", valueCol.value);

  let response = await fetch("/visualize", { method: "POST", body: formData });
  let result = await response.json();

  if (result.error) {
    alert(result.error);
    return;
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  // Destroy old chart if exists
  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: chartTypeSelect.value,
    data: {
      labels: result.labels,
      datasets: [{
        label: valueCol.value,
        data: result.values,
        backgroundColor: [
          "rgba(75,192,192,0.6)",
          "rgba(255,99,132,0.6)",
          "rgba(255,206,86,0.6)",
          "rgba(54,162,235,0.6)",
          "rgba(153,102,255,0.6)"
        ],
        borderColor: "rgba(0,0,0,0.8)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: showLegend.checked },
        title: {
          display: true,
          text: `${chartTypeSelect.value.toUpperCase()} Chart of ${valueCol.value}`
        }
      },
      scales: chartTypeSelect.value === "pie" || chartTypeSelect.value === "doughnut"
        ? {} // Pie/Doughnut don’t need axes
        : { y: { beginAtZero: true } }
    }
  });
});
