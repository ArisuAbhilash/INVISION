/* ==========================================================
   InVision — contact.js
   Client-side validation + AJAX submission to /contact/send
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("contactBtn")?.addEventListener("click", handleContact);
});

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function fieldErr(inputId, errId, show) {
  const el  = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (el)  el.classList.toggle("error", show);
  if (err) err.classList.toggle("visible", show);
}

async function handleContact() {
  const name    = document.getElementById("cName")?.value.trim()    || "";
  const email   = document.getElementById("cEmail")?.value.trim()   || "";
  const subject = document.getElementById("cSubject")?.value.trim() || "";
  const msg     = document.getElementById("cMsg")?.value.trim()     || "";

  /* Client-side validation */
  let valid = true;

  fieldErr("cName",    "cNameErr",    !name);
  fieldErr("cEmail",   "cEmailErr",   !isEmail(email));
  fieldErr("cSubject", "cSubjectErr", !subject);
  fieldErr("cMsg",     "cMsgErr",     msg.length < 10);

  if (!name || !isEmail(email) || !subject || msg.length < 10) {
    valid = false;
  }
  if (!valid) return;

  /* Disable button during submission */
  const btn = document.getElementById("contactBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }

  try {
    const res  = await fetch(CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message: msg }),
    });
    const data = await res.json();

    if (data.success) {
      /* Show inline success banner */
      const banner = document.getElementById("contactSuccess");
      if (banner) banner.classList.remove("hidden");

      /* Clear fields */
      ["cName", "cEmail", "cSubject", "cMsg"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const counter = document.getElementById("charCount");
      if (counter) counter.textContent = "0/500";

      showToast("Message sent! We'll reply within 24 hours.", "success");
    } else {
      showToast(data.error || "Something went wrong. Please try again.", "error");
    }
  } catch (err) {
    showToast("Network error. Is the Flask server running?", "error");
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message'; }
  }
}
