/* ==========================================================
   InVision — home.js
   Hero chart animation + stat counters
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeroChart();
  animateCounter("stat1", 12847);
  animateCounter("stat2", 47293);
  animateCounter("stat3", 3241);
});

function initHeroChart() {
  const ctx = document.getElementById("heroChart");
  if (!ctx) return;

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#606070" : "#999aaa";
  const legendColor = isDark ? "#a0a0b0" : "#555568";

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "Datasets",
          data: [820, 1200, 950, 1400, 1100, 1600, 1300],
          backgroundColor: "rgba(108,99,255,0.75)",
          borderRadius: 6,
        },
        {
          label: "Charts",
          data: [1200, 1800, 1400, 2100, 1700, 2400, 2000],
          backgroundColor: "rgba(0,212,170,0.55)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200 },
      plugins: {
        legend: {
          labels: { color: legendColor, font: { family: "DM Sans" }, boxWidth: 12 },
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor } },
      },
    },
  });

  /* Re-render on theme change */
  window.addEventListener("themechange", (e) => {
    const dark = e.detail === "dark";
    const gc   = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const tc   = dark ? "#606070" : "#999aaa";
    const lc   = dark ? "#a0a0b0" : "#555568";
    chart.options.scales.x.grid.color = gc;
    chart.options.scales.x.ticks.color = tc;
    chart.options.scales.y.grid.color = gc;
    chart.options.scales.y.ticks.color = tc;
    chart.options.plugins.legend.labels.color = lc;
    chart.update();
  });
}
