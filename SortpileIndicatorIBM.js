// ==UserScript==
// @name         Sorting Activity Hint Helper with Card Dots
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Provides visual hint dots directly on cards based on category
// @author       YourName
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // Add custom CSS for hint dots
  GM_addStyle(`
      .hint-dot {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          z-index: 10;
          top: 6px;
      }
  
      .dot-left {
          left: 6px;
          background-color: #00cc00; /* Green for Self-Limiting */
      }
  
      .dot-right {
          right: 6px;
          background-color: #3399ff; /* Blue for Not Self-Limiting */
      }
    `);

  const checkActivity = setInterval(() => {
    const sortingActivity = document.querySelector(".sorting");
    if (sortingActivity) {
      clearInterval(checkActivity);
      setupCardDots();
    }
  }, 500);

  function setupCardDots() {
    const selfLimitingBeliefs = [
      "I’ll never get this right",
      "I’m a failure",
      "I don’t deserve success",
      "I always get this wrong",
    ];

    const notSelfLimitingBeliefs = [
      "I find this hard",
      "I am frequently getting this wrong",
    ];

    const cards = document.querySelectorAll(".playing-card");

    cards.forEach((card) => {
      const textEl = card.querySelector(".playing-card__title .fr-view");
      if (!textEl) return;
      const cardText = textEl.textContent.trim();

      // Avoid duplication
      if (card.querySelector(".hint-dot")) return;

      const dot = document.createElement("div");
      dot.classList.add("hint-dot");

      if (selfLimitingBeliefs.includes(cardText)) {
        dot.classList.add("dot-left");
      } else if (notSelfLimitingBeliefs.includes(cardText)) {
        dot.classList.add("dot-right");
      } else {
        return; // No match, no dot
      }

      card.style.position = "relative"; // Ensure positioning context
      card.appendChild(dot);
    });

    console.log("Card dots added based on belief category.");
  }
})();
