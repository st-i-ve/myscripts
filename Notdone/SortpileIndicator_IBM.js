// ==UserScript==
// @name         CONTINUE Clicker + Sorting Activity Dots (Improved Card Stacking)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Auto-click CONTINUE buttons + add sorting direction hint dots to cards (left/center/right) in both main page and iframe. Ensures card stacking order is top-down.
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 300;
  const CLICKS_PER_RUN = 15;
  const CLICK_DELAY_MS = 100;

  const continueSelectors = [
    "button.scenario-block__text__continue",
    "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
  ];

  const sortingConfig = {
    // Environmental Initiative (LEFT - Green)
    "A fishing fleet wants to develop nets that will capture and kill fewer dolphins":
      "left",
    "A company switches its delivery fleet to electric vehicles": "left",
    "A farm reduces chemical pesticide use": "left",

    // Governance Standard (RIGHT - Blue)
    "An online retailer wants to keep fraudulent merchandise off its website":
      "right",
    "A business adopts transparent auditing procedures": "right",
    "A company enforces anti-bribery compliance": "right",

    // Social Relationship (CENTER - Yellow)
    "A restaurant chain wants to provide surplus food supplies to homeless shelters":
      "center",
    "A tech company promotes inclusivity in its hiring": "center",
    "Employees start a volunteer mentoring group": "center",

    // Mindset examples
    "I’ll never get this right": "left",
    "I’m a failure": "left",
    "I don’t deserve success": "left",
    "I always get this wrong": "left",
    "I’ll never be able to do this": "left",
    "I’m not good enough": "left",
    "I’m always wrong": "left",
    "I don’t deserve something": "left",

    "I find this hard": "right",
    "I am frequently getting this wrong": "right",
    "I’m struggling": "right",
    "This is taking me a long time to do": "right",

    // Listening skills
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Leaning away": "right",

    // Environmental Initiative (LEFT)
    "Traffic congestion": "left",
    Pollution: "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Hunting license": "left",
    "Insect crop damage": "left",

    // Social Relationship (CENTER)
    "Skills training": "center",
    "Child adoption": "center",
    Education: "center",
    "Substance abuse": "center",

    // Governance Standard (RIGHT)
    "Antibiotic approval": "right",
    "Poison control": "right",
  };

  // ✅ Add custom styles
  GM_addStyle(`
    .hint-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      top: 6px;
      z-index: 10;
    }
    .dot-left { left: 6px; background-color: #00cc00; }   /* Green */
    .dot-center { left: 50%; transform: translateX(-50%); background-color: #ffcc00; } /* Yellow */
    .dot-right { right: 6px; background-color: #3399ff; } /* Blue */

    /* Optional: Force stacking layout for card piles */
    .sorting {
      display: block !important;
    }
    .playing-card {
      position: relative !important;
    }
  `);

  function isInView(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  function tryClickContinueButtons(doc) {
    continueSelectors.forEach((selector) => {
      const btn = doc.querySelector(selector);
      if (btn && isInView(btn)) {
        console.log("▶️ Clicking CONTINUE button 15x...");
        for (let i = 0; i < CLICKS_PER_RUN; i++) {
          setTimeout(() => btn.click(), i * CLICK_DELAY_MS);
        }
      }
    });
  }

  function applySortingDots(doc) {
    const sortingActivities = doc.querySelectorAll(".sorting");
    sortingActivities.forEach((activity) => {
      const cards = activity.querySelectorAll(".playing-card");

      // Force card stack order: top card appears on top
      cards.forEach((card, index) => {
        card.style.position = "relative";
        card.style.zIndex = cards.length - index; // Highest z-index on top card
      });

      cards.forEach((card) => {
        const titleEl = card.querySelector(".playing-card__title .fr-view");
        if (!titleEl) return;

        const cardText = titleEl.textContent.trim();
        const direction = sortingConfig[cardText];
        if (!direction || card.querySelector(".hint-dot")) return;

        const dot = document.createElement("div");
        dot.classList.add("hint-dot");
        if (direction === "left") dot.classList.add("dot-left");
        else if (direction === "right") dot.classList.add("dot-right");
        else if (direction === "center") dot.classList.add("dot-center");

        card.appendChild(dot);
      });
    });
  }

  function scanDocumentAndIframes() {
    tryClickContinueButtons(document);
    applySortingDots(document);

    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          tryClickContinueButtons(iframeDoc);
          applySortingDots(iframeDoc);
        }
      } catch (err) {
        console.warn("⚠️ CORS issue accessing iframe:", err);
      }
    }
  }

  setInterval(scanDocumentAndIframes, CHECK_INTERVAL_MS);
})();
