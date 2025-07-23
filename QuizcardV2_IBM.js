// ==UserScript==
// @name         AI Quiz - Section-Based Answer Selector (Normalized)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Auto-selects correct answer, submits, and clicks NEXT based on section heading
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // ✅ Section-based answers (use exact section titles from .nav-sidebar-header__title)
  const sectionAnswers = {
    "what is artificial intelligence?": [
      "General AI",
      "Algorithm",
      "Techniques that help machines and computers mimic human behavior",
      "Data",
      "Natural language processing",
    ],
    "beyond conservation to sustainability": [
      "the needs of current and future generations",
      "turning off lights and appliances not in use",
      "ai analysis of building photos to identify signs of metal fatigue",
      "conservation of power use",
      "using alternative power sources",
      "the protection and preservation of what exists today",
      "hybrid cloud",
      "The town had to find other resources.", // ✅ with period
      "Environmental",
      "using renewable energy sources to power furnaces and other production equipment",
    ],
    resourcement: [
      "The town had to find other resources.", // Optional: if a different section uses it
    ],
  };

  // ✅ Helper: Normalize text for comparison (case + punctuation insensitive)
  const normalize = (str) =>
    str
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  setInterval(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headerEl = iframeDoc.querySelector(".nav-sidebar-header__title");
      const activeCard = iframeDoc.querySelector(
        ".quiz__wrap .quiz-item__card--active"
      );
      if (!headerEl || !activeCard) return;

      const sectionTitle = headerEl.innerText.trim().toLowerCase();
      const answerList = sectionAnswers[sectionTitle];
      if (!answerList || !Array.isArray(answerList)) {
        console.warn(`⚠️ No answers defined for section: "${sectionTitle}"`);
        return;
      }

      const options = activeCard.querySelectorAll(
        '[role="radio"], [role="checkbox"]'
      );
      let selected = false;

      options.forEach((option) => {
        const labelId = option.getAttribute("aria-labelledby");
        const labelEl = iframeDoc.getElementById(labelId);
        const answerText = labelEl?.innerText.trim();

        if (
          answerText &&
          answerList.some((ans) => normalize(ans) === normalize(answerText))
        ) {
          option.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          console.log(`✅ Selected correct answer: ${answerText}`);
          selected = true;
        }
      });

      if (!selected) {
        console.warn("❌ No matching answer found in options");
      }

      // === SUBMIT BUTTON ===
      setTimeout(() => {
        const submitBtn = activeCard.querySelector(
          "button.quiz-card__button:not(.quiz-card__button--disabled):not(.quiz-card__button--next)"
        );
        if (submitBtn) {
          console.log("🧠 Clicking submit");
          submitBtn.click();
        }
      }, 300);

      // === NEXT BUTTON ===
      const nextButton = activeCard.querySelector(
        "button.quiz-card__button--next:not([disabled])"
      );

      const isInView = (el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth
        );
      };

      if (
        nextButton &&
        nextButton.offsetParent !== null &&
        nextButton.getAttribute("aria-hidden") !== "true" &&
        isInView(nextButton) &&
        !nextClicked
      ) {
        if (nextClickTimeout) clearTimeout(nextClickTimeout);

        nextClickTimeout = setTimeout(() => {
          console.log("➡️ Debounced 'NEXT' button click x10");
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              nextButton.click();
            }, i * 100);
          }

          nextClicked = true;
          setTimeout(() => {
            nextClicked = false;
          }, 100);
        }, 100);
      }
    } catch (err) {
      console.warn("⚠️ Error accessing iframe content:", err);
    }
  }, CHECK_INTERVAL_MS);
})();
