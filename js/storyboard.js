
(() => {
  "use strict";

  // Interlude AU — Storyboard Engine
  // Menggunakan elemen HTML yang sudah ada.
  // Tidak mengubah PIN, navigasi, atau isi dialog.

  if (window.__interludeStoryboardInitialized) return;
  window.__interludeStoryboardInitialized = true;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const state = {
    activeContact: null,
    messages: []
  };

  const elements = {};

  function collectElements() {
    elements.keyboard = $("#storyKeyboard");
    elements.chatForm = $("#chatForm");
    elements.chatInput = $("#chatInput");
    elements.messages = $("#messages");
    elements.conversationName = $("#conversationName");
  }

  // Keyboard visual: memakai tombol yang sudah ada di HTML.
  // Tidak membuat keyboard tambahan dan tidak mengirim dialog.
  function bindVisualKeyboard() {
    if (!elements.keyboard) return;

    elements.keyboard.addEventListener("click", (event) => {
      const key = event.target.closest("[data-key]");

      if (!key || !elements.keyboard.contains(key)) return;

      key.classList.add("key-pressed");

      window.setTimeout(() => {
        key.classList.remove("key-pressed");
      }, 120);

      elements.keyboard.dispatchEvent(
        new CustomEvent("interlude:keyboard-key", {
          bubbles: true,
          detail: {
            key: key.dataset.key
          }
        })
      );
    });
  }

  // Mencegah form demo mengirim atau me-refresh halaman.
  // Input tetap readonly untuk menjaga konsep scripted dialogue.
  function bindChatForm() {
    if (!elements.chatForm) return;

    elements.chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }

  // Dipanggil ketika app.js membuka percakapan.
  function bindConversationEvents() {
    document.addEventListener(
      "interlude:conversation-open",
      (event) => {
        const contactId = event.detail?.contactId;

        if (!contactId) return;

        state.activeContact = contactId;
        state.messages = [];

        document.dispatchEvent(
          new CustomEvent("interlude:storyboard-contact-change", {
            detail: { contactId }
          })
        );
      }
    );
  }

  // Menyediakan tempat untuk memasukkan dialog dari file data.
  // Tidak membuat atau mengarang dialog secara otomatis.
  function renderMessages(messages = []) {
    if (!elements.messages || !Array.isArray(messages)) return;

    const fragment = document.createDocumentFragment();

    messages.forEach((item) => {
      if (!item || typeof item.text !== "string") return;

      const bubble = document.createElement("div");
      bubble.className = "story-message";

      if (item.sender === "me") {
        bubble.classList.add("from-me");
      } else {
        bubble.classList.add("from-contact");
      }

      const text = document.createElement("p");
      text.className = "story-message-text";
      text.textContent = item.text;
      bubble.appendChild(text);

      if (typeof item.time === "string" && item.time) {
        const time = document.createElement("span");
        time.className = "story-message-time";
        time.textContent = item.time;
        bubble.appendChild(time);
      }

      fragment.appendChild(bubble);
    });

    elements.messages.replaceChildren(fragment);
    state.messages = messages.slice();

    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function initialize() {
    collectElements();

    bindVisualKeyboard();
    bindChatForm();
    bindConversationEvents();

    document.dispatchEvent(
      new CustomEvent("interlude:storyboard-ready")
    );
  }

  // API untuk menghubungkan data chapter nanti.
  window.InterludeStoryboard = {
    renderMessages,

    getActiveContact() {
      return state.activeContact;
    },

    getMessages() {
      return state.messages.slice();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
