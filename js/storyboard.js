
(() => {
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  const conversation = document.getElementById("conversationView");

  if (!input || !form || !conversation) {
    console.warn("Storyboard keyboard: elemen chat tidak ditemukan.");
    return;
  }

  // Ganti teks ini sesuai skenario AU kamu.
  // Menekan huruf yang terdaftar akan mengetikkan satu frasa.
  const PRESET_KEYS = {
    s: "You're home yet?",
    a: "Almost. Why?",
    m: "miss me already? 😭",
    j: "Just text me when you're home, okay?"
  };

  const style = document.createElement("style");
  style.textContent = `
    .storyboard-keyboard {
      padding: 10px 6px 14px;
      background: #dcd9e4;
      border-top: 1px solid #c6c1d2;
      user-select: none;
      -webkit-user-select: none;
    }

    .storyboard-keyboard[hidden] { display: none; }

    .storyboard-keyboard .sb-hint {
      text-align: center;
      font-size: 10px;
      color: #655d73;
      margin: 0 0 8px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .storyboard-keyboard .sb-row {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin: 5px 0;
    }

    .storyboard-keyboard button {
      flex: 1;
      min-width: 0;
      height: 38px;
      border: 0;
      border-radius: 7px;
      background: #faf9fc;
      color: #373142;
      font: 500 14px inherit;
      box-shadow: 0 2px 0 #b6b0c3;
      touch-action: manipulation;
    }

    .storyboard-keyboard button:active {
      transform: translateY(2px);
      box-shadow: none;
      background: #c9b5ef;
    }

    .storyboard-keyboard .sb-special {
      background: #c9b5ef;
      font-size: 11px;
    }

    .storyboard-keyboard .sb-space { flex: 4; }
    .storyboard-keyboard .sb-wide { flex: 1.6; }
  `;
  document.head.append(style);

  const keyboard = document.createElement("div");
  keyboard.className = "storyboard-keyboard";
  keyboard.hidden = true;
  keyboard.innerHTML = `
    <p class="sb-hint">Storyboard keyboard · tap a key</p>
    <div class="sb-keys"></div>
  `;

  form.insertAdjacentElement("afterend", keyboard);

  const keyArea = keyboard.querySelector(".sb-keys");
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  let isTyping = false;

  function showKeyboard() {
    if (conversation.classList.contains("active")) {
      keyboard.hidden = false;
    }
  }

  function hideKeyboard() {
    keyboard.hidden = true;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function typeText(text) {
    if (isTyping) return;

    isTyping = true;
    input.readOnly = true;
    input.focus({ preventScroll: true });

    try {
      for (const character of text) {
        input.value += character;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(22);
      }
    } finally {
      isTyping = false;
    }
  }

  function addKey(label, action, special = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    if (special) button.classList.add("sb-special");
    if (label === "Space") button.classList.add("sb-space");
    if (label === "⌫" || label === "Clear") {
      button.classList.add("sb-wide");
    }

    // Supaya layar HP virtual tidak kehilangan fokus saat tombol ditekan.
    button.addEventListener("pointerdown", event => event.preventDefault());
    button.addEventListener("click", action);
    keyArea.lastElementChild.append(button);
  }

  function addRow() {
    const row = document.createElement("div");
    row.className = "sb-row";
    keyArea.append(row);
  }

  rows.forEach((letters, index) => {
    addRow();

    for (const letter of letters) {
      addKey(letter, () => {
        const phrase = PRESET_KEYS[letter];

        if (phrase) {
          typeText(phrase);
        } else {
          typeText(letter);
        }
      }, Boolean(PRESET_KEYS[letter]));
    }

    if (index === 1) {
      keyArea.lastElementChild.style.marginLeft = "12px";
      keyArea.lastElementChild.style.marginRight = "12px";
    }
  });

  addRow();
  addKey("⌫", () => {
    if (!isTyping) {
      input.value = input.value.slice(0, -1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, true);

  addKey("Space", () => {
    typeText(" ");
  });

  addKey("Clear", () => {
    if (!isTyping) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, true);

  input.readOnly = true;
  input.addEventListener("focus", showKeyboard);
  input.addEventListener("click", showKeyboard);

  // Keyboard hanya tampil saat chat terbuka.
  const observer = new MutationObserver(() => {
    if (!conversation.classList.contains("active")) {
      hideKeyboard();
    }
  });

  observer.observe(conversation, {
    attributes: true,
    attributeFilter: ["class"]
  });

  // Hindari keyboard Android asli jika kolom disentuh.
  input.setAttribute("inputmode", "none");
})();
