// ==UserScript==
// @name         AI Quiz Answer + Submit (iframe scoped)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-selects a quiz answer and submits if quiz is inside block-knowledge__wrapper iframe
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
        // Step 2: Find `.quiz-card__main` inside each wrapper
        const quizCard = wrapper.querySelector(".quiz-card__main");
        if (!quizCard) return;

        // Step 3: Check if any radio is selected already
        const alreadySelected = quizCard.querySelector(
          '[role="radio"][aria-checked="true"]'
        );
        if (alreadySelected) return; // already answered

        // Step 4: Get all answer options
        const options = quizCard.querySelectorAll(
          '[role="radio"][aria-checked="false"]'
        );
        if (options.length === 0) return;

        // Step 5: Randomly pick one and simulate a human click
        const randomIndex = Math.floor(Math.random() * options.length);
        const chosen = options[randomIndex];
        chosen.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );

        // Step 6: Wait a tiny bit, then click the submit button
        setTimeout(() => {
          const submitBtn = wrapper.querySelector(
            "button.quiz-card__button:not(.quiz-card__button--disabled)"
          );
          if (submitBtn) {
            console.log("🧠 Auto-answer selected. Clicking submit.");
            submitBtn.click();
          }
        }, 300); // 300ms after option selection to feel human-like
      });
    } catch (err) {
      // Handle inaccessible iframe (cross-origin or not ready)
      console.warn("⚠️ Cannot access iframe content.");
    }
  }, CHECK_INTERVAL_MS);
})();
