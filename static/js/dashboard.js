/* ==========================================================
   InVision — dashboard.js
   Tab switching, activity chart (fetches /dashboard/api/activity-chart),
   sidebar toggle on mobile, delete file helper
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initSidebarTabs();
  initActivityChart();
  initMobileSidebar();
});

/* ── Sidebar tab switching ───────────────────────────────── */
function initSidebarTabs() {
  const items = document.querySelectorAll(".sidebar-item[data-tab]");
  const tabs  = document.querySelectorAll(".dash-tab");

  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      switchTab(target);
    });
  });

  /* "View all" buttons inside tab content */
  document.querySelectorAll("[data-switch-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.switchTab));
  });
}

function switchTab(tabName) {
  /* Hide all tabs */
  document.querySelectorAll(".dash-tab").forEach((t) => t.classList.remove("active"));
  /* Deactivate all sidebar items */
  document.querySelectorAll(".sidebar-item[data-tab]").forEach((b) => b.classList.remove("active"));

  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) tab.classList.add("active");

  const btn = document.querySelector(`.sidebar-item[data-tab="${tabName}"]`);
  if (btn) btn.classList.add("active");
}

/* ── Activity chart ─────────────────────────────────────── */
async function initActivityChart() {
  const ctx = document.getElementById("activityChart");
  if (!ctx) return;

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gc = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tc = isDark ? "#606070" : "#999aaa";
  const lc = isDark ? "#a0a0b0" : "#555568";

  /* Fetch real data from Flask API */
  let labels  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let uploads = [0, 0, 0, 0, 0, 0, 0];
  let charts  = [0, 0, 0, 0, 0, 0, 0];

  try {
    const res  = await fetch("/dashboard/api/activity-chart");
    const data = await res.json();
    labels  = data.labels  || labels;
    uploads = data.uploads || uploads;
    charts  = data.charts  || charts;
  } catch (_) {
    /* Fallback to zeros — Flask may not be running in preview */
  }

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Uploads",
          data: uploads,
          borderColor: "#6c63ff",
          backgroundColor: "rgba(108,99,255,0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#6c63ff",
          pointRadius: 4,
        },
        {
          label: "Charts",
          data: charts,
          borderColor: "#00d4aa",
          backgroundColor: "rgba(0,212,170,0.06)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#00d4aa",
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: {
        legend: { labels: { color: lc, font: { family: "DM Sans" }, boxWidth: 10 } },
      },
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc } },
        y: { grid: { color: gc }, ticks: { color: tc, precision: 0 } },
      },
    },
  });

  window.addEventListener("themechange", (e) => {
    const dark = e.detail === "dark";
    const g = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const t = dark ? "#606070" : "#999aaa";
    const l = dark ? "#a0a0b0" : "#555568";
    chart.options.scales.x.grid.color = g;
    chart.options.scales.x.ticks.color = t;
    chart.options.scales.y.grid.color = g;
    chart.options.scales.y.ticks.color = t;
    chart.options.plugins.legend.labels.color = l;
    chart.update();
  });
}

/* ── Mobile sidebar toggle ──────────────────────────────── */
function initMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const ham     = document.getElementById("hamburger");
  if (!sidebar || !ham) return;

  ham.addEventListener("click", () => sidebar.classList.toggle("open"));

  /* Close on outside click */
  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      !ham.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
}

/* ── Delete file ────────────────────────────────────────── */
async function deleteFile(fileId) {
  if (!confirm("Delete this file? This cannot be undone.")) return;
  try {
    const res = await fetch(`/visualize/delete/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      showToast("File deleted", "success");
      /* Remove the table row */
      const row = document.querySelector(`[data-file-id="${fileId}"]`);
      if (row) row.remove();
      else location.reload();
    } else {
      showToast("Could not delete file", "error");
    }
  } catch (_) {
    showToast("Network error", "error");
  }
}
