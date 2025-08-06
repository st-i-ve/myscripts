// ==UserScript==
// @name          (Stacked Cards)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Auto-click CONTINUE buttons + add sorting direction hint dots stacked in deck layout
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
    "button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
  ];

  const sortingConfig = {
    // ✅ LEFT (Green) - Environmental / Sustainable
    "Bring reusable bags into stores.": "left",
    "Buy only enough food to meet your needs.": "left",
    "Buy energy-efficient electrical appliances.": "left",
    "Avoid single-use water bottles and straws.": "left",

    "Sustainable Behaviors when Shopping": "left",
    "A fishing fleet wants to develop nets that will capture and kill fewer dolphins":
      "left",
    "A company switches its delivery fleet to electric vehicles": "left",
    "A farm reduces chemical pesticide use": "left",
    Pollution: "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Insect crop damage": "left",
    "I’ll never get this right": "left",
    "I’m a failure": "left",
    "I don’t deserve success": "left",
    "I always get this wrong": "left",
    "I’ll never be able to do this": "left",
    "I’m not good enough": "left",
    "I’m always wrong": "left",
    "I don’t deserve something": "left",
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",

    // 🔵 RIGHT (Blue) - Governance / Institutional Integrity
    "An online retailer wants to keep fraudulent merchandise off its website":
      "right",
    "A business adopts transparent auditing procedures": "right",
    "A company enforces anti-bribery compliance": "right",
    "Antibiotic approval": "right",
    "Poison control": "right",
    "Traffic congestion": "right",
    "Hunting license": "right",
    "I find this hard": "right",
    "I am frequently getting this wrong": "right",
    "I’m struggling": "right",
    "This is taking me a long time to do": "right",
    "Leaning away": "right",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Walk or bicycle rather than drive.": "right",
    "Share rides, car-pool, and use public transportation.": "right",
    "Drive energy-efficient vehicles.": "right",
    "Take public transportation when possible.": "right",

    // 🟡 CENTER (Yellow) - Social Relationships / Community-Oriented
    "A restaurant chain wants to provide surplus food supplies to homeless shelters":
      "center",
    "A tech company promotes inclusivity in its hiring": "center",
    "Employees start a volunteer mentoring group": "center",
    "Skills training": "center",
    "Child adoption": "center",
    Education: "center",
    "Substance abuse": "center",
  };

  // ✅ Style overrides
  GM_addStyle(`
      .hint-dot {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        top: 6px;
        z-index: 10;
      }
      .dot-left { left: 6px; background-color: #00cc00; }     /* Green */
      .dot-center { left: 50%; transform: translateX(-50%); background-color: #ffcc00; } /* Yellow */
      .dot-right { right: 6px; background-color: #3399ff; }   /* Blue */
  
      /* ✅ Stack cards on top of each other (like a deck) */
      .deck__content {
        display: flex !important;
        flex-direction: column-reverse !important;
        align-items: center !important;
        gap: 0 !important;
      }
  
      .playing-card {
        margin: -30px 0 0 0 !important; /* slight overlap */
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

        card.style.position = "relative";
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
