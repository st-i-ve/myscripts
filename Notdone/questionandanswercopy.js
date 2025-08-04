// ==UserScript==
// @name         Copy Visible Quiz Question and Answer Text
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Copies visible quiz question and correct answer (text only, not letter)
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  function injectCopyButton() {
    if (document.getElementById("copyQuizBtn")) return;

    const button = document.createElement("button");
    button.id = "copyQuizBtn";
    button.textContent = "📋 Copy Visible Q&A";
    Object.assign(button.style, {
      position: "fixed",
      top: "60px",
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
      const cards = Array.from(document.querySelectorAll(".quiz-card__main"));
      const visibleCard = cards.find((card) => card.offsetParent !== null);

      if (!visibleCard) {
        button.textContent = "❌ No visible question";
        button.style.backgroundColor = "#a00";
        return;
      }

      const questionText =
        visibleCard.querySelector(".quiz-card__title")?.innerText.trim() ||
        "[No Question]";

      const inputs = visibleCard.querySelectorAll(
        'input[type="checkbox"], input[type="radio"]'
      );
      const correctAnswers = [];

      inputs.forEach((input) => {
        const label = input.closest("label");
        if (label?.classList.contains("is-correct")) {
          const answerText = label
            .querySelector(
              ".quiz-multiple-choice-option__label, .quiz-multiple-response-option__text"
            )
            ?.innerText.trim();
          if (answerText) correctAnswers.push(answerText);
        }
      });

      if (correctAnswers.length === 0) {
        button.textContent = "❌ No correct answer found";
        button.style.backgroundColor = "#a00";
        return;
      }

      const output = `Question:\n${questionText}\n\nAnswer:\n${correctAnswers.join(
        " and "
      )}`;
      GM_setClipboard(output);

      button.textContent = "✅ Copied!";
      button.style.backgroundColor = "green";
      setTimeout(() => {
        button.textContent = "📋 Copy Visible Q&A";
        button.style.backgroundColor = "#0043ce";
      }, 1500);
    });

    document.body.appendChild(button);
  }

  window.addEventListener("load", () => {
    setTimeout(injectCopyButton, 1500);
  });
})();
