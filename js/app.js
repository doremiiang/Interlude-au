
(() => {
  "use strict";

  // Interlude AU — main app controller
  // PIN ini hanya untuk simulasi HP fiktif.
  const DEMO_PIN = "1201";

  // Cegah inisialisasi ganda.
  if (window.__interludeAppInitialized) return;
  window.__interludeAppInitialized = true;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

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

  const views = VIEW_IDS
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const lockView = $("#lockView");
  const passcodeView = $("#passcodeView");
  const homeView = $("#homeView");
  const conversationView = $("#conversationView");

  const passcodeDots = $("#passcodeDots");
  const passcodeError = $("#passcodeError");
  const passcodeCancel = $("#passcodeCancel");

  const conversationName = $("#conversationName");
  const conversationAvatar = $("#conversationAvatar");
  const conversationStatus = $("#conversationStatus");

  const contactSearch = $("#contactSearch");
  const contactList = $("#contactList");

  let enteredPin = "";
  let activeContact = null;
  let toastTimeout = null;
  let touchStartY = null;

  const CONTACTS = {
    shaq: {
      id: "shaq",
      name: "Shaq",
      status: "",
      avatar: ""
    },
    kris: {
      id: "kris",
      name: "Kris",
      status: "",
      avatar: ""
    }
  };

  function getView(viewId) {
    return document.getElementById(viewId);
  }

  function showView(viewId) {
    const target = getView(viewId);

    if (!target || !views.includes(target)) {
      return false;
    }

    views.forEach((view) => {
      const isActive = view === target;

      view.classList.toggle("active", isActive);
      view.setAttribute("aria-hidden", String(!isActive));
    });

    hideToast();
    return true;
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    toast.setAttribute("aria-hidden", "false");

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
      hideToast();
    }, 2200);
  }

  function hideToast() {
    const toast = $("#toast");
    if (!toast) return;

    toast.classList.remove("show");
    toast.setAttribute("aria-hidden", "true");

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  }

  function goHome() {
    if (showView("homeView")) return;
    showToast("Home belum tersedia.");
  }

  function goBack() {
    const currentView = views.find((view) =>
      view.classList.contains("active")
    );

    if (!currentView) {
      showView("homeView");
      return;
    }

    if (currentView.id === "conversationView") {
      showView("chatView");
      return;
    }

    if (currentView.id === "chatView") {
      goHome();
      return;
    }

    if (currentView.id === "passcodeView") {
      showView("lockView");
      resetPin();
      return;
    }

    if (currentView.id !== "lockView") {
      goHome();
    }
  }

  
  // ---------- PIN SCREEN ----------

  function ensurePinDots() {
    if (!passcodeDots) return;

    if (passcodeDots.children.length === 4) return;

    passcodeDots.replaceChildren();

    for (let i = 0; i < 4; i += 1) {
      const dot = document.createElement("span");
      dot.className = "passcode-dot";
      dot.setAttribute("aria-hidden", "true");
      passcodeDots.appendChild(dot);
    }
  }

  function updatePinDots() {
    if (!passcodeDots) return;

    Array.from(passcodeDots.children).forEach((dot, index) => {
      const filled = index < enteredPin.length;

      dot.classList.toggle("filled", filled);
      dot.setAttribute("aria-label", filled ? "Terisi" : "Kosong");
    });

    passcodeDots.setAttribute(
      "aria-label",
      `${enteredPin.length} dari 4 digit PIN`
    );
  }

  function resetPin() {
    enteredPin = "";
    updatePinDots();

    if (passcodeError) {
      passcodeError.textContent = "";
      passcodeError.classList.remove("show");
    }
  }

  function showPinError(message = "PIN salah. Coba lagi.") {
    if (passcodeError) {
      passcodeError.textContent = message;
      passcodeError.classList.add("show");
    }

    if (passcodeDots) {
      passcodeDots.classList.remove("pin-shake");

      // Memicu ulang animasi tanpa menambah listener.
      void passcodeDots.offsetWidth;
      passcodeDots.classList.add("pin-shake");
    }
  }

  function openPinScreen() {
    resetPin();

    if (!showView("passcodeView")) {
      showToast("Layar PIN belum tersedia.");
    }
  }

  function addPinDigit(digit) {
    if (!/^\d$/.test(digit)) return;
    if (!passcodeView?.classList.contains("active")) return;
    if (enteredPin.length >= 4) return;

    enteredPin += digit;
    updatePinDots();

    if (passcodeError) {
      passcodeError.textContent = "";
      passcodeError.classList.remove("show");
    }
  }

  function deletePinDigit() {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDots();

    if (passcodeError) {
      passcodeError.textContent = "";
      passcodeError.classList.remove("show");
    }
  }

  function submitPin() {
    if (enteredPin.length !== 4) {
      showPinError("Masukkan 4 digit PIN.");
      return;
    }

    if (enteredPin !== DEMO_PIN) {
      resetPin();
      showPinError("PIN salah. Coba lagi.");
      return;
    }

    resetPin();
    showView("homeView");
  }

  // ---------- LOCKSCREEN ----------

  function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const date = now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    const statusTime = $("#statusTime");
    const lockClock = $("#lockClock");
    const lockDate = $("#lockDate");

    if (statusTime) statusTime.textContent = time;
    if (lockClock) lockClock.textContent = time;
    if (lockDate) lockDate.textContent = date;
  }

  function bindLockscreen() {
    $("#unlockTrigger")?.addEventListener("click", openPinScreen);

    $("#lockFlashlight")?.addEventListener("click", () => {
      showToast("Senter simulasi.");
    });

    $("#lockCamera")?.addEventListener("click", () => {
      if (showView("photosView")) return;
      showToast("Kamera simulasi belum tersedia.");
    });

    if (!lockView) return;

    lockView.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartY = touch ? touch.clientY : null;
    }, { passive: true });

    lockView.addEventListener("touchend", (event) => {
      if (touchStartY === null) return;

      const touch = event.changedTouches[0];
      const endY = touch ? touch.clientY : touchStartY;
      const distance = touchStartY - endY;

      touchStartY = null;

      if (distance > 55) {
        openPinScreen();
      }
    }, { passive: true });

    // Dukungan swipe dengan mouse atau pointer.
    lockView.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      touchStartY = event.clientY;
    });

    lockView.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") return;
      if (touchStartY === null) return;

      const distance = touchStartY - event.clientY;
      touchStartY = null;

      if (distance > 55) {
        openPinScreen();
      }
    });
  }

  function bindPinPad() {
    ensurePinDots();
    updatePinDots();

    $("#passcodePad")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-passcode]");
      if (!button) return;

      const value = button.dataset.passcode;

      if (/^\d$/.test(value)) {
        addPinDigit(value);
      } else if (value === "clear") {
        deletePinDigit();
      } else if (value === "enter") {
        submitPin();
      }
    });

    passcodeCancel?.addEventListener("click", () => {
      resetPin();
      showView("lockView");
    });

    document.addEventListener("keydown", (event) => {
      if (!passcodeView?.classList.contains("active")) return;

      if (/^\d$/.test(event.key)) {
        addPinDigit(event.key);
      } else if (event.key === "Backspace") {
        deletePinDigit();
      } else if (event.key === "Enter") {
        submitPin();
      } else if (event.key === "Escape") {
        resetPin();
        showView("lockView");
      }
    });
  }

  
  // ---------- CONTACTS & CONVERSATIONS ----------

  function openConversation(contactId) {
    const contact = CONTACTS[contactId];
    if (!contact) {
      showToast("Kontak tidak ditemukan.");
      return;
    }

    activeContact = contact;

    if (conversationName) {
      conversationName.textContent = contact.name;
    }

    if (conversationAvatar && contact.avatar) {
      conversationAvatar.textContent = contact.avatar;
    }

    if (conversationStatus && contact.status) {
      conversationStatus.textContent = contact.status;
    }

    if (!showView("conversationView")) {
      showToast("Layar percakapan belum tersedia.");
      return;
    }

    // storyboard.js dapat membaca kontak aktif dari event ini.
    document.dispatchEvent(new CustomEvent(
      "interlude:conversation-open",
      {
        detail: {
          contactId: contact.id,
          contactName: contact.name
        }
      }
    ));
  }

  function bindContactList() {
    contactList?.addEventListener("click", (event) => {
      const item = event.target.closest("[data-open-conversation]");

      if (!item || !contactList.contains(item)) return;

      openConversation(item.dataset.openConversation);
    });

    contactSearch?.addEventListener("input", () => {
      const query = contactSearch.value.trim().toLowerCase();

      $$("[data-contact]", contactList || document).forEach((item) => {
        const name = item.textContent.toLowerCase();
        const id = (item.dataset.contact || "").toLowerCase();
        const matches = name.includes(query) || id.includes(query);

        item.hidden = !matches;
      });
    });

    $("#backToContacts")?.addEventListener("click", () => {
      showView("chatView");
    });
  }

  // ---------- GENERAL NAVIGATION ----------

  function bindNavigation() {
    document.addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-open-view]");
      const backButton = event.target.closest("[data-go-view]");

      if (openButton) {
        const viewId = openButton.dataset.openView;

        if (viewId === "conversationView") return;

        if (!showView(viewId)) {
          showToast("Halaman belum tersedia.");
        }

        return;
      }

      if (backButton) {
        const viewId = backButton.dataset.goView;

        if (!showView(viewId)) {
          showToast("Halaman tujuan belum tersedia.");
        }

        return;
      }
    });

    $("#navHome")?.addEventListener("click", goHome);

    // Tombol kembali generik, kecuali tombol yang sudah punya fungsi khusus.
    $$("[data-go-back]").forEach((button) => {
      button.addEventListener("click", goBack);
    });
  }

  // ---------- INITIALIZATION ----------

  function initializeViews() {
    const hasActiveView = views.some((view) =>
      view.classList.contains("active")
    );

    if (!hasActiveView) {
      showView("lockView");
      return;
    }

    // Pastikan hanya satu view yang aktif saat aplikasi dimulai.
    const firstActive = views.find((view) =>
      view.classList.contains("active")
    );

    views.forEach((view) => {
      const isActive = view === firstActive;
      view.classList.toggle("active", isActive);
      view.setAttribute("aria-hidden", String(!isActive));
    });
  }

  function init() {
    initializeViews();
    bindLockscreen();
    bindPinPad();
    bindContactList();
    bindNavigation();
    updateClock();

    // Jam diperbarui pada pergantian menit, tanpa interval tambahan.
    const delay = 60000 - (Date.now() % 60000);

    setTimeout(() => {
      updateClock();
      setInterval(updateClock, 60000);
    }, delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
