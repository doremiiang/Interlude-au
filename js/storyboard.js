
(() => {
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  const conversation = document.getElementById("conversationView");

  if (!input || !form || !conversation) return;

  // Satu huruf = satu dialog.
  // Ganti isi jawaban sesuai storyboard AU-mu nanti.
  const RESPONSES = {
    a: "Almost. Why?",
    b: "You're home yet?",
    i: "miss me already? 😭",
    l: "Just text me when you're home, okay?"
  };

  // Hapus keyboard lama yang mungkin sudah dibuat oleh script ini.
  document.getElementById("storyboardKeyboard")?.remove();
  document.getElementById("storyboardKeyboardStyle")?.remove();

  const style = document.createElement("style");
  style.id = "storyboardKeyboardStyle";
  style.textContent = `
    #storyboardKeyboard {
      box-sizing: border-box;
      width: 100%;
      flex-shrink: 0;
      padding: 7px 4px 9px;
      background: #d1d4dc;
      border-top: 1px solid #c3c6ce;
      user-select: none;
      -webkit-user-select: none;
    }

    #storyboardKeyboard[hidden] {
      display: none !important;
    }

    #storyboardKeyboard .sb-row {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin: 0 0 7px;
      width: 100%;
    }

    #storyboardKeyboard .sb-row:last-child {
      margin-bottom: 0;
    }

    #storyboardKeyboard button {
      box-sizing: border-box;
      min-width: 0;
      height: 34px;
      flex: 1;
      padding: 0;
      border: 0;
      border-radius: 5px;
      background: #fafafa;
      color: #25252b;
      font-family: Arial, sans-serif;
      font-size: 17px;
      font-weight: 400;
      box-shadow: 0 1px 0 #aeb0b8;
      touch-action: manipulation;
    }

    #storyboardKeyboard button:active {
      background: #e4e5e9;
      transform: translateY(1px);
      box-shadow: none;
    }

    #storyboardKeyboard .sb-special {
      background: #b9bec9;
      font-size: 12px;
    }

    #storyboardKeyboard .sb-special:active {
      background: #a8aebb;
    }

    #storyboardKeyboard .sb-space {
      flex: 4;
    }

    #storyboardKeyboard .sb-shift,
    #storyboardKeyboard .sb-delete {
      flex: 1.35;
    }

    #storyboardKeyboard .sb-send {
      flex: 1.35;
      background: #8ca9e8;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
    }

    #storyboardKeyboard .sb-send:active {
      background: #6e91dc;
    }

    #storyboardKeyboard .sb-number {
      flex: 1.2;
    }

    #storyboardKeyboard .sb-row-middle {
      padding: 0 12px;
      box-sizing: border-box;
    }

    #storyboardKeyboard .sb-row-bottom {
      align-items: center;
    }

    @media (max-height: 700px) {
      #storyboardKeyboard {
        padding: 4px 3px 6px;
      }

      #storyboardKeyboard .sb-row {
        gap: 3px;
        margin-bottom: 5px;
      }

      #storyboardKeyboard button {
        height: 29px;
        border-radius: 4px;
        font-size: 15px;
      }

      #storyboardKeyboard .sb-special,
      #storyboardKeyboard .sb-send {
        font-size: 11px;
      }
    }
  `;

  document.head.appendChild(style);

  const keyboard = document.createElement("div");
  keyboard.id = "storyboardKeyboard";
  keyboard.hidden = true;

  keyboard.innerHTML = `
    <div class="sb-row" data-row="1"></div>
    <div class="sb-row sb-row-middle" data-row="2"></div>
    <div class="sb-row" data-row="3"></div>
    <div class="sb-row sb-row-bottom" data-row="4"></div>
  `;

  form.insertAdjacentElement("afterend", keyboard);

  const row1 = keyboard.querySelector('[data-row="1"]');
  const row2 = keyboard.querySelector('[data-row="2"]');
  const row3 = keyboard.querySelector('[data-row="3"]');
  const row4 = keyboard.querySelector('[data-row="4"]');

  let shiftOn = false;
  let isTyping = false;
  let useNumbers = false;
  let typingToken = 0;

  function addKey(row, label, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    if (className) {
      className.split(" ").forEach(name => button.classList.add(name));
    }

    button.addEventListener("pointerdown", event => {
      event.preventDefault();
    });

    button.addEventListener("click", action);
    row.appendChild(button);

    return button;
  }

  function updateInput() {
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function updateShift() {
    shiftButton.textContent = shiftOn ? "⇧" : "⇧";

    letterButtons.forEach(({ button, letter }) => {
      button.textContent = shiftOn
        ? letter.toUpperCase()
        : letter;
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

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function typeResponse(text) {
    if (isTyping) return;

    isTyping = true;
    const token = ++typingToken;

    // Jawaban baru menggantikan teks sebelumnya.
    // Huruf pemicu tidak ikut dimasukkan.
    input.value = "";
    updateInput();

    try {
      for (const character of text) {
        if (token !== typingToken) return;

        input.value += character;
        updateInput();

        // Efek mengetik; tanpa perlu menekan huruf berulang kali.
        await wait(24);
      }
    } finally {
      if (token === typingToken) {
        isTyping = false;
      }
    }
  }

  function typeCharacter(character) {
    if (isTyping) return;

    const trigger = character.toLowerCase();

    if (RESPONSES[trigger]) {
      shiftOn = false;
      updateShift();
      typeResponse(RESPONSES[trigger]);
      return;
    }

    input.value += shiftOn
      ? character.toUpperCase()
      : character;

    shiftOn = false;
    updateShift();
    updateInput();
  }

  const letterButtons = [];

  function addLetterRow(row, letters) {
    for (const letter of letters) {
      const button = addKey(
        row,
        letter,
        () => typeCharacter(letter)
      );

      letterButtons.push({ button, letter });
    }
  }

  addLetterRow(row1, "qwertyuiop");
  addLetterRow(row2, "asdfghjkl");

  const shiftButton = addKey(
    row3,
    "⇧",
    () => {
      shiftOn = !shiftOn;
      updateShift();
    },
    "sb-special sb-shift"
  );

  addLetterRow(row3, "zxcvbnm");

  addKey(
    row3,
    "⌫",
    () => {
      if (isTyping) return;

      input.value = input.value.slice(0, -1);
      updateInput();
    },
    "sb-special sb-delete"
  );

  addKey(
    row4,
    "123",
    () => {
      useNumbers = !useNumbers;
      const numberRow = ["1","2","3","4","5","6","7","8","9","0"];

      if (useNumbers) {
        row1.querySelectorAll("button").forEach((button, i) => {
          button.textContent = numberRow[i];
        });
      } else {
        row1.querySelectorAll("button").forEach((button, i) => {
          button.textContent = "qwertyuiop"[i];
        });
      }

      updateShift();
    },
    "sb-special sb-number"
  );

  addKey(
    row4,
    "😊",
    () => typeCharacter("♡"),
    "sb-special"
  );

  addKey(
    row4,
    "Space",
    () => {
      if (isTyping) return;
      input.value += " ";
      updateInput();
    },
    "sb-special sb-space"
  );

  addKey(
    row4,
    ".",
    () => {
      if (isTyping) return;
      input.value += ".";
      updateInput();
    },
    "sb-special"
  );

  addKey(
    row4,
    "Kirim",
    () => {
      if (isTyping) return;
      if (input.value.trim()) form.requestSubmit();
    },
    "sb-send"
  );

  updateShift();

  input.readOnly = true;
  input.setAttribute("inputmode", "none");

  input.addEventListener("focus", showKeyboard);
  input.addEventListener("click", showKeyboard);

  const observer = new MutationObserver(() => {
    if (!conversation.classList.contains("active")) {
      hideKeyboard();
    }
  });

  observer.observe(conversation, {
    attributes: true,
    attributeFilter: ["class"]
  });
})();
