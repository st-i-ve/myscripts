// ==UserScript==
// @name         AI Quiz - Correct Answer Selector + Submit + NEXT Clicker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Auto-selects correct answer, submits, and clicks NEXT inside iframe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // Define correct answers map (lowercased keys for safe matching)
  const correctAnswers = {
    "which is an example of whole brain emulation where a machine can think and make decisions on many subjects?":
      "General AI",
    "what are the mathematical instructions that tell the machine how to go about finding solutions to a problem?":
      "Algorithm",
    "what is artificial intelligence?":
      "Techniques that help machines and computers mimic human behavior",
    "which of these is the basis for all ai systems and allows algorithms to reveal patterns and trends?":
      "Data",
    "which ai application gives computers the ability to understand human language as it is spoken?":
      "Natural language processing",
    "what does sustainability typically focus on?":
      "the needs of current and future generations",
    "which of the following is a sustainability practice you can do at home?":
      "turning off lights and appliances not in use",
    "steel-framed windows have been falling from a newly built skyscraper in a large city. what advanced technology might help solve this problem?":
      "ai analysis of building photos to identify signs of metal fatigue",
    "complete the sentence. an example of an environmental initiative is __________.":
      "conservation of power use",
    "you're explaining esg initiatives to a friend. which of the following actions would you include in your discussion?":
      "using alternative power sources",
    "what does conservation typically focus on?":
      "the protection and preservation of what exists today",
    "you're the chief technical officer of a healthcare organization that has a problem to solve: keeping patient records confidential, while sharing life-saving new research data with other healthcare providers. which of the following technologies would help you accomplish both goals?":
      "hybrid cloud",
    "in the stillwater simulation, what was the result when you suggested selling the lumber in the forest and conserving the fish?":
      "the town had to find other resources",
    "a national chain of coffeehouses starts an initiative to only provide compostable straws for their beverages. Which of the following is a potential sustainability goal for a newly built steel mill?":
      "using renewable energy sources to power furnaces and other production equipment",
  };

  setInterval(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const activeCard = iframeDoc.querySelector(
        ".quiz__wrap .quiz-item__card--active"
      );
      if (!activeCard) return;

      const questionEl = activeCard.querySelector(".quiz-card__title");
      if (!questionEl) return;

      const questionText = questionEl.innerText.trim().toLowerCase();
      const correctAnswer = correctAnswers[questionText];
      if (!correctAnswer) {
        console.warn("⚠️ No correct answer found for question:", questionText);
        return;
      }

      const options = activeCard.querySelectorAll(
        '[role="radio"], [role="checkbox"]'
      );
      let selected = false;

      options.forEach((option) => {
        const labelId = option.getAttribute("aria-labelledby");
        const labelTextEl = iframeDoc.getElementById(labelId);
        const answerText = labelTextEl?.innerText.trim().toLowerCase();

        if (answerText && answerText === correctAnswer.toLowerCase()) {
          option.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          console.log(`✅ Selected correct answer: ${correctAnswer}`);
          selected = true;
        }
      });

      if (!selected) {
        console.warn("❌ Correct answer not found in options:", correctAnswer);
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
