// ==UserScript==
// @name         Copy Active Quiz with Smart AI Prompt
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Extracts quiz question and choices, detects checkbox vs radio, and adds proper AI prompt.
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  function waitForActiveCard() {
    const activeCard = document.querySelector(
      ".quiz-item__card--active .quiz-card__main"
    );
    if (!activeCard) {
      setTimeout(waitForActiveCard, 1000);
    } else {
      injectCopyActiveButton(activeCard);
    }
  }

  function injectCopyActiveButton(activeCard) {
    if (document.getElementById("copyActiveQuizBtn")) return;

    const button = document.createElement("button");
    button.id = "copyActiveQuizBtn";
    button.textContent = "📋 Copy Active Question";
    Object.assign(button.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      zIndex: "9999",
      padding: "10px 15px",
      backgroundColor: "#0043ce",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    });

    button.addEventListener("click", () => {
      const questionText =
        activeCard.querySelector(".quiz-card__title")?.innerText.trim() ||
        "[No Question]";

      // Detect input type
      const checkboxInputs = activeCard.querySelectorAll(
        'input[type="checkbox"]'
      );
      const radioInputs = activeCard.querySelectorAll('input[type="radio"]');

      let inputElements;
      let isMultiAnswer = false;

      if (checkboxInputs.length > 0) {
        inputElements = checkboxInputs;
        isMultiAnswer = true;
      } else if (radioInputs.length > 0) {
        inputElements = radioInputs;
      } else {
        button.textContent = "❌ No inputs found";
        button.style.backgroundColor = "#a00";
        return;
      }

      const options = [];
      inputElements.forEach((input, i) => {
        const label = input
          .closest("label")
          ?.querySelector(
            ".quiz-multiple-choice-option__label, .quiz-multiple-response-option__text"
          );
        if (label) {
          const letter = String.fromCharCode(65 + i);
          const text = label.innerText.trim();
          options.push(`${letter}. ${text}`);
        }
      });

      const aiPrompt = isMultiAnswer
        ? `\n\n🤖 AI PROMPT:\nPlease answer with the correct letter(s) (e.g., A and D). Keep it short.`
        : `\n\n🤖 AI PROMPT:\nPlease answer with only the correct letter (A, B, C, or D). Keep it short.`;

      const output = `Question:\n${questionText}\n\nOptions:\n${options.join(
        "\n"
      )}${aiPrompt}`;

      GM_setClipboard(output);

      // Visual feedback
      button.textContent = "✅ Copied!";
      button.style.backgroundColor = "green";
      setTimeout(() => {
        button.textContent = "📋 Copy Active Question";
        button.style.backgroundColor = "#0043ce";
      }, 1500);
    });

    document.body.appendChild(button);
  }

  waitForActiveCard();
})();
