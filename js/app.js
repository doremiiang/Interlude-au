/* =========================================================
   INTERLUDE AU — APP.JS
   Bagian 1/3: Konfigurasi, utilitas, dan navigasi layar
   ========================================================= */

(() => {
  "use strict";

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
    activeContact: null,
    touchStartY: null,
    pointerStartY: null,
    lastUnlockGesture: 0,
    toastTimer: null,
    clockTimer: null
  };

  const CONTACTS = {
    shaq: {
      name: "Shaq",
      status: "",
      avatar: ""
    },
    kris: {
      name: "Kris",
      status: "",
      avatar: ""
    }
  };

  function getViews() {
    return VIEW_IDS
      .map((id) => byId(id))
      .filter(Boolean);
  }

  function showView(viewId) {
    const target = byId(viewId);
    if (!target) return false;

    getViews().forEach((view) => {
      const isActive = view === target;
      view.classList.toggle("active", isActive);
      view.setAttribute("aria-hidden", String(!isActive));
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
    toast.setAttribute("aria-live", "polite");

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }

    state.toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function goBack() {
    switch (state.currentView) {
      case "conversationView":
        showView("chatView");
        break;

      case "chatView":
      case "photosView":
      case "notesView":
      case "phoneView":
      case "musicView":
      case "settingsView":
        showView("homeView");
        break;

      case "passcodeView":
        resetPin();
        showView("lockView");
        break;

      case "homeView":
        showView("lockView");
        break;

      default:
        showView("homeView");
        break;
    }
  }

  function initializeViews() {
    const views = getViews();
    if (!views.length) return;

    const activeView = views.find((view) =>
      view.classList.contains("active")
    );

    const initialView = activeView || byId("lockView") || views[0];

    views.forEach((view) => {
      const isActive = view === initialView;
      view.classList.toggle("active", isActive);
      view.setAttribute("aria-hidden", String(!isActive));
    });

    state.currentView = initialView.id;
  }

  /* =========================================================
     Akhir Bagian 1/3
     Lanjutkan dengan Bagian 2/3 tepat di bawah kode ini.
     ========================================================= */
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

      for (let i = 0; i < DEMO_PIN.length; i += 1) {
        const dot = document.createElement("span");
        dot.className = "passcode-dot";
        container.appendChild(dot);
      }
    }

    updatePinDots();
  }

  function resetPin() {
    state.pin = "";
    updatePinDots();

    const error = byId("passcodeError");
    if (error) {
      error.textContent = "";
      error.classList.remove("visible", "show");
    }
  }

  function showPinError(message) {
    const error = byId("passcodeError");
    if (!error) return;

    error.textContent = message;
    error.classList.add("visible", "show");
  }

  function enterDigit(digit) {
    if (!/^\d$/.test(String(digit))) return;
    if (state.pin.length >= DEMO_PIN.length) return;

    const error = byId("passcodeError");
    if (error) {
      error.textContent = "";
      error.classList.remove("visible", "show");
    }

    state.pin += String(digit);
    updatePinDots();

    if (state.pin.length === DEMO_PIN.length) {
      window.setTimeout(checkPin, 120);
    }
  }

  function deletePinDigit() {
    state.pin = state.pin.slice(0, -1);
    updatePinDots();

    const error = byId("passcodeError");
    if (error) {
      error.textContent = "";
      error.classList.remove("visible", "show");
    }
  }

  function checkPin() {
    if (state.pin !== DEMO_PIN) {
      resetPin();
      showPinError("PIN salah. Coba lagi.");
      return;
    }

    resetPin();
    showView("homeView");
  }

  function openPasscode() {
    resetPin();
    showView("passcodeView");
  }

  function unlockFromGesture() {
    const now = Date.now();

    if (now - state.lastUnlockGesture < 700) return;
    if (state.currentView !== "lockView") return;

    state.lastUnlockGesture = now;
    openPasscode();
  }

  function bindLockscreen() {
    const unlockTrigger = byId("unlockTrigger");
    const lockView = byId("lockView");

    unlockTrigger?.addEventListener("click", openPasscode);

    byId("lockFlashlight")?.addEventListener("click", () => {
      showToast("Senter belum terhubung ke kontrol perangkat.");
    });

    byId("lockCamera")?.addEventListener("click", () => {
      showView("photosView");
    });

    if (!lockView) return;

    lockView.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
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

        if (distance > 55) unlockFromGesture();
      },
      { passive: true }
    );

    lockView.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      state.pointerStartY = event.clientY;
    });

    lockView.addEventListener("pointerup", (event) => {
      if (state.pointerStartY === null) return;

      const distance = state.pointerStartY - event.clientY;
      state.pointerStartY = null;

      if (distance > 55) unlockFromGesture();
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
      } else if (value === "clear") {
        deletePinDigit();
      } else if (value === "enter") {
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

        if (state.pin.length === DEMO_PIN.length) {
          checkPin();
        }
      } else if (event.key === "Escape") {
        resetPin();
        showView("lockView");
      }
    });
  }

  /* =========================================================
     Akhir Bagian 2/3
     Lanjutkan dengan Bagian 3/3 tepat di bawah kode ini.
     ========================================================= */

    /* =========================================================
     Bagian 3/3: Navigasi aplikasi, kontak, dan inisialisasi
     ========================================================= */

  function openConversation(contactId) {
    const contact = CONTACTS[contactId];
    const nameElement = byId("conversationName");
    const avatarElement = byId("conversationAvatar");
    const statusElement = byId("conversationStatus");

    state.activeContact = contactId;

    if (nameElement && contact) {
      nameElement.textContent = contact.name;
    }

    if (avatarElement && contact?.avatar) {
      avatarElement.textContent = contact.avatar;
    }

    if (statusElement && contact?.status) {
      statusElement.textContent = contact.status;
    }

    showView("conversationView");

    document.dispatchEvent(
      new CustomEvent("interlude:conversation-open", {
        detail: {
          contactId,
          contactName: contact?.name || contactId
        }
      })
    );
  }

  function bindContactList() {
    const list = byId("contactList");

    list?.addEventListener("click", (event) => {
      const item = event.target.closest("[data-open-conversation]");
      if (!item || !list.contains(item)) return;

      const contactId = item.dataset.openConversation;
      if (!contactId) return;

      openConversation(contactId);
    });

    const search = byId("contactSearch");

    search?.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase("id-ID");

      $$("[data-open-conversation]", list || document).forEach((item) => {
        const text = item.textContent.toLocaleLowerCase("id-ID");
        item.hidden = !text.includes(query);
      });
    });

    byId("backToContacts")?.addEventListener("click", () => {
      showView("chatView");
    });
  }

  function bindNavigation() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-open-view], [data-go-view], [data-go-home], [data-go-back]"
      );

      if (!target) return;

      if (target.matches("[data-open-conversation]")) return;

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

      const viewId =
        target.dataset.openView ||
        target.dataset.goView;

      if (viewId && byId(viewId)) {
        event.preventDefault();
        showView(viewId);
      }
    });

    byId("navHome")?.addEventListener("click", () => {
      if (state.currentView === "lockView") return;
      showView("homeView");
    });
  }

  function bindGlobalButtons() {
    byId("newMessageButton")?.addEventListener("click", () => {
      showView("chatView");
      byId("contactSearch")?.focus();
    });

    byId("profileButton")?.addEventListener("click", () => {
      showToast("Profil belum memiliki halaman khusus.");
    });
  }

  function initialize() {
    initializeViews();
    ensurePinDots();

    bindLockscreen();
    bindPinPad();
    bindKeyboardShortcuts();
    bindNavigation();
    bindContactList();
    bindGlobalButtons();

    updateClock();

    if (state.clockTimer) {
      clearInterval(state.clockTimer);
    }

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
