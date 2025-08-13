// ==UserScript==
// @name         AI Quiz Answer + Submit (iframe scoped)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto-selects a quiz answer and submits if quiz is inside block-knowledge__wrapper iframe (radio + checkbox support)
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;

  setInterval(() => {
    const iframe = document.querySelector("iframe");

    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;

      if (!iframeDoc || !iframeWin) return;

      // Step 1: Find all `.block-knowledge__wrapper` containers
      const wrappers = iframeDoc.querySelectorAll(".block-knowledge__wrapper");

      wrappers.forEach((wrapper) => {
        const quizCard = wrapper.querySelector(".quiz-card__main");
        if (!quizCard) return;

        // ---------- Radio Logic (unchanged) ----------
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

        // ---------- NEW: Checkbox Logic ----------
        const checkboxOptions = quizCard.querySelectorAll(
          '[role="checkbox"][aria-checked="false"]'
        );

        if (checkboxOptions.length > 0) {
          // Select 1 to 2 checkboxes at random
          const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
          const pickCount = Math.min(2, shuffled.length); // pick 1–2 at most
          const picked = shuffled.slice(0, pickCount);

          picked.forEach((checkbox) => {
            checkbox.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
          });
        }

        // ---------- Submit (applies to both) ----------
        setTimeout(() => {
          const submitBtn = wrapper.querySelector(
            "button.quiz-card__button:not(.quiz-card__button--disabled)"
          );
          if (submitBtn) {
            console.log(
              "🧠 Auto-answer selected (radio or checkbox). Clicking submit."
            );
            submitBtn.click();
          }
        }, 300);
      });
    } catch (err) {
      console.warn("⚠️ Cannot access iframe content.");
    }
  }, CHECK_INTERVAL_MS);
})();
