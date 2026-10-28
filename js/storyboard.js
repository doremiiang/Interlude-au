
(() => {
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  const conversation = document.getElementById("conversationView");

  if (!input || !form || !conversation) return;

  const PRESET_KEYS = {
    s: "You're home yet?",
    a: "Almost. Why?",
    m: "miss me already? 😭",
    j: "Just text me when you're home, okay?"
  };

  const style = document.createElement("style");
  style.textContent = `
    .storyboard-keyboard {
      box-sizing: border-box;
      width: 100%;
      padding: 5px 4px 8px;
      background: #dcd9e4;
      border-top: 1px solid #c6c1d2;
      user-select: none;
      -webkit-user-select: none;
      flex-shrink: 0;
    }

    .storyboard-keyboard[hidden] { display: none !important; }

    .storyboard-keyboard .sb-hint {
      text-align: center;
      font-size: 9px;
      color: #655d73;
      margin: 0 0 4px;
      letter-spacing: .06em;
    }

    .storyboard-keyboard .sb-row {
      display: flex;
      justify-content: center;
      gap: 3px;
      margin: 4px 0;
      width: 100%;
    }

    .storyboard-keyboard button {
      box-sizing: border-box;
      flex: 1;
      min-width: 0;
      height: 31px;
      padding: 0;
      border: 0;
      border-radius: 5px;
      background: #faf9fc;
      color: #373142;
      font-family: inherit;
      font-size: 13px;
      box-shadow: 0 1px 0 #b6b0c3;
      touch-action: manipulation;
    }

    .storyboard-keyboard button:active {
      transform: translateY(1px);
      box-shadow: none;
      background: #c9b5ef;
    }

    .storyboard-keyboard .sb-special {
      background: #c9b5ef;
      font-size: 10px;
      flex: 1.5;
    }

    .storyboard-keyboard .sb-space { flex: 4; }
  `;

  document.head.append(style);

  const keyboard = document.createElement("div");
  keyboard.className = "storyboard-keyboard";
  keyboard.hidden = true;
  keyboard.innerHTML = `
    <p class="sb-hint">STORYBOARD KEYBOARD</p>
    <div class="sb-keys"></div>
  `;

  form.insertAdjacentElement("afterend", keyboard);

  const keyArea = keyboard.querySelector(".sb-keys");

  let isTyping = false;
  let shiftOn = false;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function addRow() {
    const row = document.createElement("div");
    row.className = "sb-row";
    keyArea.append(row);
    return row;
  }

  async function typeText(text) {
    if (isTyping) return;

    isTyping = true;
    input.readOnly = true;

    try {
      for (const char of text) {
        input.value += char;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(18);
      }
    } finally {
      isTyping = false;
    }
  }

  function addKey(row, label, action, special = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    if (special) button.classList.add("sb-special");
    if (label === "Space") button.classList.add("sb-space");

    button.addEventListener("pointerdown", event => event.preventDefault());
    button.addEventListener("click", action);
    row.append(button);

    return button;
  }

  function insertCharacter(char) {
    typeText(shiftOn ? char.toUpperCase() : char);
    if (shiftOn) {
      shiftOn = false;
      updateShift();
    }
  }

  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const letterButtons = [];

  rows.forEach((letters, index) => {
    const row = addRow();

    for (const letter of letters) {
      const button = addKey(row, letter, () => {
        const key = shiftOn ? letter.toUpperCase() : letter;
        const phrase = PRESET_KEYS[letter];

        if (phrase) {
          typeText(phrase);
          shiftOn = false;
          updateShift();
        } else {
          insertCharacter(key);
        }
      }, Boolean(PRESET_KEYS[letter]));

      letterButtons.push({ button, letter });
    }

    if (index === 1) {
      row.style.padding = "0 9px";
      row.style.boxSizing = "border-box";
    }
  });

  const bottom = addRow();

  const shiftButton = addKey(bottom, "⇧", () => {
    shiftOn = !shiftOn;
    updateShift();
  }, true);

  addKey(bottom, "⌫", () => {
    if (isTyping) return;
    input.value = input.value.slice(0, -1);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, true);

  addKey(bottom, "Space", () => typeText(" "));

  addKey(bottom, "Clear", () => {
    if (isTyping) return;
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, true);

  function updateShift() {
    shiftButton.style.background = shiftOn ? "#a88bdc" : "#c9b5ef";

    letterButtons.forEach(({ button, letter }) => {
      button.textContent = shiftOn ? letter.toUpperCase() : letter;
    });
  }

  function showKeyboard() {
    if (conversation.classList.contains("active")) {
      keyboard.hidden = false;
    }
  }

  function hideKeyboard() {
    keyboard.hidden = true;
    shiftOn = false;
    updateShift();
  }

  input.readOnly = true;
  input.setAttribute("inputmode", "none");
  input.addEventListener("focus", showKeyboard);
  input.addEventListener("click", showKeyboard);

  const observer = new MutationObserver(() => {
    if (!conversation.classList.contains("active")) hideKeyboard();
  });

  observer.observe(conversation, {
    attributes: true,
    attributeFilter: ["class"]
  });
})();
