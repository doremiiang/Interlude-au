/* =========================================================
   INTERLUDE AU — APP.JS
   Bagian 1/3: Konfigurasi, utilitas, dan navigasi
   ========================================================= */

(() => {
  "use strict";

  // Mencegah inisialisasi dan pemasangan listener berulang.
  if (window.__interludeAppInitialized) return;
  window.__interludeAppInitialized = true;

  const DEMO_PIN = "1201";

  const VIEW_IDS = [
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

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const byId = (id) => document.getElementById(id);

  const state = {
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

  // Kontak ini mengikuti ID yang tersedia di HTML saat ini.
  const CONTACTS = {
    shaq: {
      name: "Shaq",
      status: "",
      avatar: "S"
    },
    kris: {
      name: "Kris",
      status: "",
      avatar: "K"
    }
  };

  function getViews() {
    return VIEW_IDS
      .map((id) => byId(id))
      .filter(Boolean);
  }

  function showView(viewId) {
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

  function showToast(message) {
    const toast = byId("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    if (state.toastTimer !== null) {
      clearTimeout(state.toastTimer);
    }

    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
      state.toastTimer = null;
    }, 2200);
  }

  
function initializeViews() {
  const views = getViews();
  const lockView = byId("lockView");

  if (!views.length || !lockView) return;

  // Setiap halaman baru harus dimulai dari lockscreen.
  views.forEach((view) => {
    const isLockscreen = view.id === "lockView";

    view.classList.toggle("active", isLockscreen);
    view.setAttribute("aria-hidden", String(!isLockscreen));
  });

  state.currentView = "lockView";
  state.pin = "";

  clearPinCheckTimer();
  updatePinDots();
  clearPinError();
}


  function goBack() {
    const destinations = {
      conversationView: "chatView",
      chatView: "homeView",
      photosView: "homeView",
      notesView: "homeView",
      phoneView: "homeView",
      musicView: "homeView",
      settingsView: "homeView",
      passcodeView: "lockView",
      homeView: "lockView"
    };

    const destination = destinations[state.currentView] || "homeView";

    if (state.currentView === "passcodeView") {
      resetPin();
    }

    showView(destination);
  }

  /* Akhir Bagian 1/3 */

    /* =========================================================
     Bagian 2/3: PIN, lockscreen, gesture, dan jam
     ========================================================= */

  function updatePinDots() {
    const container = byId("passcodeDots");
    if (!container) return;

    const dots = $$("span", container);

    dots.forEach((dot, index) => {
      const filled = index < state.pin.length;

      dot.classList.toggle("filled", filled);
      dot.setAttribute("aria-hidden", "true");
    });

    container.setAttribute(
      "aria-label",
      `${state.pin.length} dari ${DEMO_PIN.length} angka dimasukkan`
    );
  }

  function ensurePinDots() {
    const container = byId("passcodeDots");
    if (!container) return;

    if ($$("span", container).length !== DEMO_PIN.length) {
      container.replaceChildren();

      for (let index = 0; index < DEMO_PIN.length; index += 1) {
        const dot = document.createElement("span");
        dot.className = "passcode-dot";
        container.appendChild(dot);
      }
    }

    updatePinDots();
  }

  function clearPinCheckTimer() {
    if (state.pinCheckTimer !== null) {
      clearTimeout(state.pinCheckTimer);
      state.pinCheckTimer = null;
    }
  }

  function clearPinError() {
    const error = byId("passcodeError");
    if (!error) return;

    error.textContent = "";
    error.classList.remove("visible", "show");
  }

  function resetPin() {
    clearPinCheckTimer();

    state.pin = "";
    updatePinDots();
    clearPinError();
  }

  function showPinError(message) {
    const error = byId("passcodeError");
    if (!error) return;

    error.textContent = message;
    error.classList.add("visible", "show");
    error.setAttribute("role", "alert");
  }

  function checkPin() {
    clearPinCheckTimer();

    if (state.currentView !== "passcodeView") return;
    if (state.pin.length !== DEMO_PIN.length) return;

    if (state.pin !== DEMO_PIN) {
      state.pin = "";
      updatePinDots();
      showPinError("PIN salah. Coba lagi.");
      return;
    }

    resetPin();
    showView("homeView");
  }

  function enterDigit(digit) {
    if (state.currentView !== "passcodeView") return;
    if (!/^\d$/.test(String(digit))) return;
    if (state.pin.length >= DEMO_PIN.length) return;

    clearPinCheckTimer();
    clearPinError();

    state.pin += String(digit);
    updatePinDots();

    if (state.pin.length === DEMO_PIN.length) {
      state.pinCheckTimer = window.setTimeout(() => {
        state.pinCheckTimer = null;
        checkPin();
      }, 180);
    }
  }

  function deletePinDigit() {
    if (state.currentView !== "passcodeView") return;

    clearPinCheckTimer();

    state.pin = state.pin.slice(0, -1);
    updatePinDots();
    clearPinError();
  }

  function openPasscode() {
    if (state.currentView !== "lockView") return;

    resetPin();
    showView("passcodeView");
  }

  function unlockFromGesture() {
    const now = Date.now();

    if (now - state.lastUnlockGesture < 650) return;
    if (state.currentView !== "lockView") return;

    state.lastUnlockGesture = now;
    openPasscode();
  }

  function bindLockscreen() {
    const lockView = byId("lockView");

    byId("unlockTrigger")?.addEventListener("click", openPasscode);

    byId("lockFlashlight")?.addEventListener("click", () => {
      showToast("Kontrol senter perangkat belum tersedia.");
    });

    byId("lockCamera")?.addEventListener("click", () => {
      showView("photosView");
    });

    if (!lockView) return;

    lockView.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) {
          state.touchStartY = null;
          return;
        }

        state.touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    lockView.addEventListener(
      "touchend",
      (event) => {
        if (state.touchStartY === null) return;

        const endY = event.changedTouches[0]?.clientY;
        const distance = state.touchStartY - endY;

        state.touchStartY = null;

        if (Number.isFinite(distance) && distance > 55) {
          unlockFromGesture();
        }
      },
      { passive: true }
    );

    lockView.addEventListener(
      "touchcancel",
      () => {
        state.touchStartY = null;
      },
      { passive: true }
    );

    // Pointer hanya untuk mouse/pen. Sentuhan ditangani touch events.
    lockView.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      state.pointerStartY = event.clientY;
    });

    lockView.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") return;
      if (state.pointerStartY === null) return;

      const distance = state.pointerStartY - event.clientY;
      state.pointerStartY = null;

      if (distance > 55) {
        unlockFromGesture();
      }
    });

    lockView.addEventListener("pointercancel", () => {
      state.pointerStartY = null;
    });
  }

  function bindPinPad() {
    const pad = byId("passcodePad");
    if (!pad) return;

    pad.addEventListener("click", (event) => {
      const button = event.target.closest("[data-passcode]");
      if (!button || !pad.contains(button)) return;

      const value = button.dataset.passcode;

      if (/^\d$/.test(value)) {
        enterDigit(value);
        return;
      }

      if (value === "clear") {
        deletePinDigit();
        return;
      }

      if (value === "enter") {
        clearPinCheckTimer();

        if (state.pin.length === DEMO_PIN.length) {
          checkPin();
        } else {
          showPinError("Masukkan 4 angka PIN.");
        }
      }
    });

    byId("passcodeCancel")?.addEventListener("click", () => {
      resetPin();
      showView("lockView");
    });
  }

  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if (state.currentView !== "passcodeView") return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        enterDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        deletePinDigit();
      } else if (event.key === "Enter") {
        event.preventDefault();
        clearPinCheckTimer();

        if (state.pin.length === DEMO_PIN.length) {
          checkPin();
        } else {
          showPinError("Masukkan 4 angka PIN.");
        }
      } else if (event.key === "Escape") {
        resetPin();
        showView("lockView");
      }
    });
  }

  function updateClock() {
    const now = new Date();

    const time = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(now);

    const date = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(now);

    ["statusTime", "lockClock", "homeClock"].forEach((id) => {
      const element = byId(id);
      if (element) element.textContent = time;
    });

    ["lockDate", "homeDate"].forEach((id) => {
      const element = byId(id);
      if (element) element.textContent = date;
    });
  }

  /* Akhir Bagian 2/3 */

    /* =========================================================
     Bagian 3/3: Kontak, navigasi, dan inisialisasi
     ========================================================= */

  function openConversation(contactId) {
    const contact = CONTACTS[contactId];
    if (!contact) {
      showToast("Kontak belum terdaftar.");
      return;
    }

    state.activeContact = contactId;

    const nameElement = byId("conversationName");
    const avatarElement = byId("conversationAvatar");
    const statusElement = byId("conversationStatus");

    if (nameElement) {
      nameElement.textContent = contact.name;
    }

    if (avatarElement) {
      avatarElement.textContent = contact.avatar;
    }

    if (statusElement) {
      statusElement.textContent = contact.status;
    }

    if (!showView("conversationView")) return;

    document.dispatchEvent(
      new CustomEvent("interlude:conversation-open", {
        detail: {
          contactId,
          contactName: contact.name
        }
      })
    );
  }

  function bindContactList() {
    const list = byId("contactList");
    if (!list) return;

    list.addEventListener("click", (event) => {
      const item = event.target.closest("[data-open-conversation]");
      if (!item || !list.contains(item)) return;

      openConversation(item.dataset.openConversation);
    });

    const search = byId("contactSearch");
    if (!search) return;

    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase("id-ID");

      $$("[data-open-conversation]", list).forEach((item) => {
        const text = item.textContent.toLocaleLowerCase("id-ID");
        item.hidden = !text.includes(query);
      });
    });
  }

  function bindNavigation() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-open-view], [data-go-view], [data-go-home], [data-go-back]"
      );

      if (!target) return;

      // Navigasi kontak ditangani oleh bindContactList().
      if (target.hasAttribute("data-open-conversation")) return;

      if (target.hasAttribute("data-go-back")) {
        event.preventDefault();
        goBack();
        return;
      }

      if (target.hasAttribute("data-go-home")) {
        event.preventDefault();
        showView("homeView");
        return;
      }

      const destination =
        target.dataset.openView ||
        target.dataset.goView;

      if (destination && byId(destination)) {
        event.preventDefault();
        showView(destination);
      }
    });

    byId("navHome")?.addEventListener("click", () => {
      if (state.currentView !== "lockView") {
        showView("homeView");
      }
    });
  }

  function bindGlobalButtons() {
    byId("newMessageButton")?.addEventListener("click", () => {
      showView("chatView");
      byId("contactSearch")?.focus();
    });

    byId("profileButton")?.addEventListener("click", () => {
      showToast("Halaman profil belum diimplementasikan.");
    });
  }

  function initialize() {
    initializeViews();
    ensurePinDots();

    bindLockscreen();
    bindPinPad();
    bindKeyboardShortcuts();
    bindContactList();
    bindNavigation();
    bindGlobalButtons();

    updateClock();

    state.clockTimer = window.setInterval(updateClock, 15000);

    document.dispatchEvent(
      new CustomEvent("interlude:app-ready", {
        detail: {
          initialView: state.currentView
        }
      })
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
