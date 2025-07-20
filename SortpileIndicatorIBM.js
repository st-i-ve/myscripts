// ==UserScript==
// @name         Universal Sorting Hint Dots (Live + Scalable)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Continuously applies directional hint dots on sorting activity cards using a centralized config map for multiple rounds or exercises.
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // ✅ Config: Update this object to add more card texts
  const sortingConfig = {
    // Left (Self-Limiting Belief)
    "I’ll never get this right": "left",
    "I’m a failure": "left",
    "I don’t deserve success": "left",
    "I always get this wrong": "left",
    "I’ll never be able to do this": "left",
    "I’m not good enough": "left",
    "I’m always wrong": "left",
    "I don’t deserve something": "left",

    // Right (Not a Self-Limiting Belief)
    "I find this hard": "right",
    "I am frequently getting this wrong": "right",
    "I’m struggling": "right",
    "This is taking me a long time to do": "right",
  };

  // ✅ Styling for the dots
  GM_addStyle(`
      .hint-dot {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        top: 6px;
        z-index: 10;
      }
      .dot-left {
        left: 6px;
        background-color: #00cc00; /* Green for Left */
      }
      .dot-right {
        right: 6px;
        background-color: #3399ff; /* Blue for Right */
      }
    `);

  // ✅ Keep track of processed `.sorting` nodes
  const processed = new WeakSet();

  function applyDotsToActivity(activityRoot) {
    const cards = activityRoot.querySelectorAll(".playing-card");

    cards.forEach((card) => {
      const titleEl = card.querySelector(".playing-card__title .fr-view");
      if (!titleEl) return;
      const cardText = titleEl.textContent.trim();
      const direction = sortingConfig[cardText];

      if (!direction) return; // Not in config
      if (card.querySelector(".hint-dot")) return; // Already has a dot

      const dot = document.createElement("div");
      dot.className = `hint-dot ${
        direction === "left" ? "dot-left" : "dot-right"
      }`;
      card.style.position = "relative"; // Ensure container has context
      card.appendChild(dot);
    });
  }

  // ✅ Continuously scan for new activities every second
  setInterval(() => {
    const activities = document.querySelectorAll(".sorting");
    activities.forEach((activity) => {
      if (!processed.has(activity)) {
        applyDotsToActivity(activity);
        processed.add(activity);
      }
    });
  }, 1000);
})();
