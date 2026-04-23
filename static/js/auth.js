/* ==========================================================
   InVision — auth.js
   Client-side validation for login & signup forms
   ========================================================== */

/* ── Helpers ─────────────────────────────────────────────── */
function showErr(inputId, errId) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) input.classList.add("error");
  if (err)   err.classList.add("visible");
}

function clearErr(inputId, errId) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) input.classList.remove("error");
  if (err)   err.classList.remove("visible");
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

/* ── Login ───────────────────────────────────────────────── */
function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    let valid = true;

    const email = document.getElementById("email").value.trim();
    if (!isEmail(email)) { showErr("email", "emailErr"); valid = false; }
    else clearErr("email", "emailErr");

    const pwd = document.getElementById("password").value;
    if (!pwd) { showErr("password", "pwdErr"); valid = false; }
    else clearErr("password", "pwdErr");

    if (!valid) {
      e.preventDefault();
      return;
    }

    /* Show loader while Flask processes the POST */
    showLoader("Signing you in…");
  });

  /* Live validation */
  document.getElementById("email")?.addEventListener("blur", function () {
    if (!isEmail(this.value.trim())) showErr("email", "emailErr");
    else clearErr("email", "emailErr");
  });
  document.getElementById("password")?.addEventListener("blur", function () {
    if (!this.value) showErr("password", "pwdErr");
    else clearErr("password", "pwdErr");
  });
}

/* ── Signup ──────────────────────────────────────────────── */
function initSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    let valid = true;

    const name = document.getElementById("name").value.trim();
    if (!name) { showErr("name", "nameErr"); valid = false; }
    else clearErr("name", "nameErr");

    const email = document.getElementById("email").value.trim();
    if (!isEmail(email)) { showErr("email", "emailErr"); valid = false; }
    else clearErr("email", "emailErr");

    const pwd = document.getElementById("password").value;
    if (pwd.length < 8) { showErr("password", "pwdErr"); valid = false; }
    else clearErr("password", "pwdErr");

    const confirm = document.getElementById("confirm_password").value;
    if (confirm !== pwd) { showErr("confirm_password", "confirmErr"); valid = false; }
    else clearErr("confirm_password", "confirmErr");

    if (!valid) { e.preventDefault(); return; }
    showLoader("Creating your account…");
  });

  /* Live: strength meter */
  document.getElementById("password")?.addEventListener("input", function () {
    checkStrength(this.value);
    if (this.value.length >= 8) clearErr("password", "pwdErr");
  });

  /* Live: confirm match */
  document.getElementById("confirm_password")?.addEventListener("input", function () {
    const pwd = document.getElementById("password").value;
    if (this.value && this.value !== pwd) showErr("confirm_password", "confirmErr");
    else clearErr("confirm_password", "confirmErr");
  });

  /* Live: email */
  document.getElementById("email")?.addEventListener("blur", function () {
    if (!isEmail(this.value.trim())) showErr("email", "emailErr");
    else clearErr("email", "emailErr");
  });
}
