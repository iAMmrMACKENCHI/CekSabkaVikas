// ============================================================
// Physics with Vikas — script.js
// ============================================================

const APP_CONFIG = {
  APP_NAME: "Physics with Vikas",
  UPI_ID: "vikas@upi",           // REPLACE with real UPI ID
  COURSE_PRICE: "₹999",
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx40MEA-AEFiQu_pT-sMp3E_Su3CM4V-dLQ6hHDHyjCzNqHk_UFUqWveQJb2JJF5dkB/exec", // REPLACE
  DRIVE_LINK: "https://drive.google.com/drive/u/0/folders/1Z_jJbShQ0povcJNdSyAm05UocDx6sg_7",           // REPLACE
};

// ──────────────────────────────────────────
// SESSION HELPERS
// ──────────────────────────────────────────
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem("pvUser")) || null; } catch { return null; }
  },
  setUser(u) { localStorage.setItem("pvUser", JSON.stringify(u)); },
  logout() { localStorage.removeItem("pvUser"); window.location.href = "index.html"; },
  require() {
    if (!Auth.getUser()) { window.location.href = "login.html"; return false; }
    return true;
  }
};

// ──────────────────────────────────────────
// GOOGLE APPS SCRIPT CALLS
// ──────────────────────────────────────────
async function postToSheet(action, payload) {
  try {
    const res = await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (e) {
    console.error("Sheet POST error:", e);
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────
// MOCK REELS DATA (replace with sheet fetch)
// ──────────────────────────────────────────
const MOCK_REELS = [
  { id: "r1", topic: "Newton's First Law", class: "11", tags: ["mechanics","newton"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Easy" },
  { id: "r2", topic: "Projectile Motion", class: "11", tags: ["mechanics","kinematics"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Medium" },
  { id: "r3", topic: "Work-Energy Theorem", class: "11", tags: ["energy","work"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Medium" },
  { id: "r4", topic: "Coulomb's Law", class: "12", tags: ["electrostatics"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Easy" },
  { id: "r5", topic: "Ohm's Law", class: "12", tags: ["current","circuits"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Easy" },
  { id: "r6", topic: "Photoelectric Effect", class: "12", tags: ["modern physics"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Hard" },
  { id: "r7", topic: "Simple Harmonic Motion", class: "11", tags: ["oscillations"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Medium" },
  { id: "r8", topic: "Gauss's Law", class: "12", tags: ["electrostatics"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", difficulty: "Hard" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchReels(userClass) {
  // In production: fetch from Apps Script
  // const res = await fetch(APP_CONFIG.APPS_SCRIPT_URL + "?action=getReels");
  // const data = await res.json();
  let reels = MOCK_REELS;
  if (userClass) reels = reels.filter(r => r.class === userClass || r.class === "all");
  return shuffleArray(reels);
}

// ──────────────────────────────────────────
// UI HELPERS
// ──────────────────────────────────────────
function showToast(msg, type = "info") {
  const colors = { info: "bg-sky-600", success: "bg-green-600", error: "bg-red-600" };
  const t = document.createElement("div");
  t.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${colors[type]} transition-all duration-300`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2800);
}

function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.textContent;
    btn.textContent = "Please wait...";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.orig || btn.textContent;
    btn.disabled = false;
  }
}

// ──────────────────────────────────────────
// SECURITY (basic UX locks)
// ──────────────────────────────────────────
function applySecurityLocks() {
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("selectstart", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (e.key === "F12" || (e.ctrlKey && ["u","s","a"].includes(e.key.toLowerCase()))) e.preventDefault();
  });
}

// ──────────────────────────────────────────
// BOTTOM NAV HIGHLIGHT
// ──────────────────────────────────────────
function highlightNav() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.classList.toggle("text-sky-400", el.dataset.nav === page);
    el.classList.toggle("text-slate-400", el.dataset.nav !== page);
  });
}

// Init on every page
document.addEventListener("DOMContentLoaded", () => {
  applySecurityLocks();
  highlightNav();
});
