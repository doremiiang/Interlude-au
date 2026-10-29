
/* =========================================================
   INTERLUDE AU — STATE.JS
   State utama, konfigurasi layar, dan navigasi
   ========================================================= */

export const DEMO_PIN = "1201";

export const VIEW_IDS = [
  "lockView",
  "passcodeView",
  "homeView",
  "chatView",
  "conversationView",
  "photosView",
  "notesView",
  "phoneView",
  "musicView",
  "settingsView"
];

export const $ = (selector, root = document) =>
  root.querySelector(selector);

export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

export const byId = (id) =>
  document.getElementById(id);

export const state = {
  currentView: null,
  pin: "",
  pinCheckTimer: null,
  activeContact: null,
  touchStartY: null,
  pointerStartY: null,
  lastUnlockGesture: 0,
  toastTimer: null,
  clockTimer: null
};

export function getViews() {
  return VIEW_IDS
    .map((id) => byId(id))
    .filter(Boolean);
}

export function showView(viewId) {
  const target = byId(viewId);

  if (!target || !VIEW_IDS.includes(viewId)) {
    return false;
  }

  getViews().forEach((view) => {
    const active = view === target;

    view.classList.toggle("active", active);
    view.setAttribute("aria-hidden", String(!active));
  });

  state.currentView = viewId;

  document.dispatchEvent(
    new CustomEvent("interlude:view-change", {
      detail: { viewId }
    })
  );

  return true;
}

