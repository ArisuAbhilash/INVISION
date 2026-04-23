/* ==========================================================
   InVision — base.js
   Shared utilities: theme, toast, loader, nav, drag-upload
   ========================================================== */

/* ── Theme ──────────────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem("iv-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
})();

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  if (icon) icon.className = theme === "dark" ? "fas fa-moon" : "fas fa-sun";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next    = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("iv-theme", next);
      updateThemeIcon(next);
      window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    });
  }

  /* ── Hamburger ── */
  const ham  = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  const cls  = document.getElementById("mobileClose");
  if (ham)  ham.addEventListener("click", () => menu.classList.add("open"));
  if (cls)  cls.addEventListener("click", () => menu.classList.remove("open"));

  /* ── Flash messages as toasts ── */
  if (window.__flashMessages) {
    window.__flashMessages.forEach(([cat, msg]) => {
      const type = cat === "error" ? "error" : cat === "warning" ? "error" : cat === "success" ? "success" : "info";
      showToast(msg, type);
    });
  }
});

/* ── Toast ──────────────────────────────────────────────── */
function showToast(msg, type = "info", duration = 3500) {
  const icons = { success: "fa-check", error: "fa-times", info: "fa-info" };
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
    <div class="toast-msg">${msg}</div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hiding");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Loader ─────────────────────────────────────────────── */
function showLoader(text = "Processing...") {
  const el = document.getElementById("loader");
  const tx = document.getElementById("loaderText");
  if (el) el.classList.add("active");
  if (tx) tx.textContent = text;
}
function hideLoader() {
  const el = document.getElementById("loader");
  if (el) el.classList.remove("active");
}

/* ── Generic drag-and-drop helper ───────────────────────── */
function enableDragDrop(zoneId, onDrop) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("drag");
    const file = e.dataTransfer.files[0];
    if (file) onDrop(file);
  });
}

/* ── Password toggle ────────────────────────────────────── */
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === "text";
  input.type = isText ? "password" : "text";
  const icon = btn.querySelector("i");
  if (icon) icon.className = `fas fa-eye${isText ? "" : "-slash"}`;
}

/* ── Password strength ──────────────────────────────────── */
function checkStrength(pwd) {
  const fill = document.getElementById("strengthFill");
  if (!fill) return;
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const widths  = ["0%", "25%", "50%", "75%", "100%"];
  const colors  = ["#f43f5e", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
  fill.style.width      = widths[score];
  fill.style.background = colors[score];
}

/* ── Animate counter ────────────────────────────────────── */
function animateCounter(id, target, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  let val = 0;
  const step = Math.ceil(target / 80);
  const timer = setInterval(() => {
    val += step;
    if (val >= target) { val = target; clearInterval(timer); }
    el.textContent = val.toLocaleString() + suffix;
  }, 20);
}

/* ── Expose globals ─────────────────────────────────────── */
window.showToast      = showToast;
window.showLoader     = showLoader;
window.hideLoader     = hideLoader;
window.togglePwd      = togglePwd;
window.checkStrength  = checkStrength;
window.animateCounter = animateCounter;
window.enableDragDrop = enableDragDrop;
