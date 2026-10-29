(() => {
  "use strict";

  if (window.__interludeWidgetHomeInitialized) return;
  window.__interludeWidgetHomeInitialized = true;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const days = [
    "Minggu", "Senin", "Selasa", "Rabu",
    "Kamis", "Jumat", "Sabtu"
  ];

  const months = [
    "Januari", "Februari", "Maret", "April",
    "Mei", "Juni", "Juli", "Agustus",
    "September", "Oktober", "November", "Desember"
  ];

  function renderWidgetHome() {
    const home = $("#homeView");
    if (!home || $(".claude-home", home)) return;

    const wallpaper = $(".home-wallpaper", home);
    const layout = document.createElement("div");

    layout.className = "claude-home";
    layout.innerHTML = `
      <div class="cl-home-status">
        <span id="clHomeTime">09.41</span>
        <span class="cl-home-status-icons" aria-label="Status perangkat">
          <span aria-hidden="true">▮▮▮</span>
          <span aria-hidden="true">⌁</span>
          <span aria-hidden="true">▰</span>
        </span>
      </div>

      <header class="cl-home-heading">
        <p class="cl-home-eyebrow">SHAQIL'S LITTLE UNIVERSE</p>
        <h2>Somewhere, <span>between us. ♡</span></h2>
      </header>

      <div class="cl-home-widgets">
        <section class="cl-widget cl-calendar" aria-label="Kalender">
          <p class="cl-widget-kicker">HARI INI</p>
          <p class="cl-day" id="clHomeDay">Rabu</p>
          <p class="cl-date" id="clHomeDate">28</p>
          <p class="cl-event">♡ A little time for us</p>
        </section>

        <section class="cl-widget cl-weather" aria-label="Widget cuaca">
          <p class="cl-widget-kicker">CUACA</p>
          <p class="cl-weather-city">Hari ini</p>
          <p class="cl-weather-temp">28°</p>
          <p class="cl-weather-desc">Berawan sebagian ☁</p>
          <p class="cl-weather-range">Pratinjau cuaca</p>
        </section>
      </div>

      <section class="cl-find" aria-label="Kartu lokasi fiksi">
        <div class="cl-find-map" aria-hidden="true">
          <span class="cl-find-pin"><span>♡</span></span>
        </div>
        <div class="cl-find-copy">
          <p class="cl-widget-kicker">A LITTLE REMINDER</p>
          <h3>Panji ♡</h3>
          <p>Somewhere out there, someone is waiting for you to come home.</p>
        </div>
      </section>

      <p class="cl-apps-title">Your applications</p>

      <div class="cl-app-grid" aria-label="Aplikasi">
        <button class="cl-app-item" type="button"
          data-open-view="chatView">
          <span class="cl-app-icon">✉</span>
          <span class="cl-app-label">Messages</span>
        </button>

        <button class="cl-app-item" type="button"
          data-open-view="photosView">
          <span class="cl-app-icon">▧</span>
          <span class="cl-app-label">Photos</span>
        </button>

        <button class="cl-app-item" type="button"
          data-open-view="notesView">
          <span class="cl-app-icon">▤</span>
          <span class="cl-app-label">Notes</span>
        </button>

        <button class="cl-app-item" type="button"
          data-open-view="phoneView">
          <span class="cl-app-icon">⌕</span>
          <span class="cl-app-label">Phone</span>
        </button>

        <button class="cl-app-item" type="button"
          data-open-view="musicView">
          <span class="cl-app-icon">♫</span>
          <span class="cl-app-label">Music</span>
        </button>

        <button class="cl-app-item" type="button"
          data-open-view="settingsView">
          <span class="cl-app-icon">⚙</span>
          <span class="cl-app-label">Settings</span>
        </button>
      </div>

      <nav class="cl-home-dock" aria-label="Aplikasi favorit">
        <button class="cl-dock-item" type="button"
          data-open-view="chatView" aria-label="Messages">✉</button>
        <button class="cl-dock-item" type="button"
          data-open-view="phoneView" aria-label="Phone">⌕</button>
        <button class="cl-dock-item" type="button"
          data-open-view="photosView" aria-label="Photos">▧</button>
        <button class="cl-dock-item" type="button"
          data-open-view="musicView" aria-label="Music">♫</button>
      </nav>
    `;

    if (wallpaper) {
      wallpaper.insertAdjacentElement("afterend", layout);
    } else {
      home.prepend(layout);
    }

    updateWidgetClock();
    window.setInterval(updateWidgetClock, 1000);
  }

  function updateWidgetClock() {
    const now = new Date();
    const time = $("#clHomeTime");
    const day = $("#clHomeDay");
    const date = $("#clHomeDate");

    if (time) {
      time.textContent =
        `${String(now.getHours()).padStart(2, "0")}.` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    }

    if (day) day.textContent = days[now.getDay()];
    if (date) date.textContent = now.getDate();

    const homeClock = $("#homeClock");
    const homeDate = $("#homeDate");

    if (homeClock) {
      homeClock.textContent =
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    }

    if (homeDate) {
      homeDate.textContent =
        `${days[now.getDay()]}, ${now.getDate()} ` +
        `${months[now.getMonth()]}`;
    }
  }

  function initialize() {
    renderWidgetHome();

    // Pakai handler navigasi Interlude AU yang sudah ada.
    // Fallback ini aktif hanya bila handler lama tidak mengubah view.
    document.addEventListener("click", event => {
      const button = event.target.closest(
        ".claude-home [data-open-view]"
      );

      if (!button) return;

      const viewId = button.dataset.openView;
      const view = document.getElementById(viewId);

      if (!view) return;

      window.setTimeout(() => {
        if (!view.classList.contains("active")) {
          document.dispatchEvent(new CustomEvent(
            "interlude:widget-navigation-request",
            { detail: { viewId } }
          ));
        }
      }, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
