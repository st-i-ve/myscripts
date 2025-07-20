// ==UserScript==
// @name         Sorting Activity Hint Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Provides hints for sorting activities by highlighting the correct pile
// @author       YourName
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // Add custom CSS styles
  GM_addStyle(`
        .correct-pile {
            box-shadow: 0 0 15px 5px rgba(0, 255, 0, 0.5) !important;
            transition: box-shadow 0.3s ease;
        }
        .playing-card:hover {
            transform: scale(1.05) !important;
            z-index: 1000 !important;
            transition: transform 0.2s ease;
        }
    `);

  // Wait for the sorting activity to load
  const checkActivity = setInterval(function () {
    const sortingActivity = document.querySelector(".sorting");
    if (sortingActivity) {
      clearInterval(checkActivity);
      setupHints();
    }
  }, 500);

  function setupHints() {
    // Define which cards belong to which pile
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

    // Get all card elements
    const cards = document.querySelectorAll(".playing-card");
    const selfLimitingPile = document.querySelectorAll(".pile__wrap")[0];
    const notSelfLimitingPile = document.querySelectorAll(".pile__wrap")[1];

    cards.forEach((card) => {
      const cardText = card
        .querySelector(".playing-card__title")
        .textContent.trim();

      card.addEventListener("mouseenter", function () {
        if (selfLimitingBeliefs.includes(cardText)) {
          selfLimitingPile.classList.add("correct-pile");
        } else if (notSelfLimitingBeliefs.includes(cardText)) {
          notSelfLimitingPile.classList.add("correct-pile");
        }
      });

      card.addEventListener("mouseleave", function () {
        selfLimitingPile.classList.remove("correct-pile");
        notSelfLimitingPile.classList.remove("correct-pile");
      });
    });

    console.log("Sorting activity hint helper activated!");
  }
})();
