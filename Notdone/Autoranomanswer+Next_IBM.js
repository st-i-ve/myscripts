// ==UserScript==
// @name         AI Quiz Answer + Submit + Debounced Next Button Clicker (iframe scoped)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Auto-selects answers, submits quiz, and clicks "Next" button 10x after debounce when in view — iframe-safe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  setInterval(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;
      if (!iframeDoc || !iframeWin) return;

      // === QUIZ LOGIC ===
      const wrappers = iframeDoc.querySelectorAll(".block-knowledge__wrapper");
      wrappers.forEach((wrapper) => {
        const quizCard = wrapper.querySelector(".quiz-card__main");
        if (!quizCard) return;

        // ---- Radio Button Logic ----
        const alreadySelected = quizCard.querySelector(
          '[role="radio"][aria-checked="true"]'
        );
        if (!alreadySelected) {
          const options = quizCard.querySelectorAll(
            '[role="radio"][aria-checked="false"]'
          );
          if (options.length > 0) {
            const randomIndex = Math.floor(Math.random() * options.length);
            const chosen = options[randomIndex];
            chosen.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
          }
        }

        // ---- Checkbox Logic ----
        const checkboxOptions = quizCard.querySelectorAll(
          '[role="checkbox"][aria-checked="false"]'
        );
        if (checkboxOptions.length > 0) {
          const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
          const pickCount = Math.min(2, shuffled.length); // pick 1–2
          const picked = shuffled.slice(0, pickCount);
          picked.forEach((checkbox) => {
            checkbox.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
          });
        }

        // ---- Submit Button ----
        setTimeout(() => {
          const submitBtn = wrapper.querySelector(
            "button.quiz-card__button:not(.quiz-card__button--disabled)"
          );
          if (submitBtn) {
            console.log("🧠 Auto-answer selected. Clicking submit.");
            submitBtn.click();
          }
        }, 300);
      });

      // === NEXT BUTTON LOGIC ===
      const nextButton = iframeDoc.querySelector(
        'button[data-testid="arrow-next"]:not([disabled])'
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
        console.log("✅ Next button found:", nextButton.className);

        if (nextClickTimeout) clearTimeout(nextClickTimeout);

        nextClickTimeout = setTimeout(() => {
          console.log(
            "➡️ 'Next' button is in view. Debounced click x10 begins."
          );
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              nextButton.click();
            }, i * 100);
          }

          nextClicked = true;

          // Reset to allow clicking again
          setTimeout(() => {
            nextClicked = false;
          }, 3000);
        }, 100); // debounce
      }
    } catch (err) {
      console.warn("⚠️ Cannot access iframe content:", err);
    }
  }, CHECK_INTERVAL_MS);
})();
