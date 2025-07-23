// ==UserScript==
// @name         Smart Quiz Auto-Answer + Submit + Next (Fast Mode)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Super fast auto-answer, submit, and advance for iframe-based quizzes
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const answerPool = [
    "Check whether the tools used for collecting data give stable results over time.",
    "Commercial transaction records",
    "Surveys and questionnaires",
    "Web scraping technologies",
    "Use visualizations to show patterns, trends, and key insights.",
    "Check her information by comparing it with data from different methods or sources.",
    "Sensors and IoT devices",
  ];

  const normalizeText = (text) =>
    text.trim().replace(/\s+/g, " ").toLowerCase();

  function createControlButton() {
    const btn = document.createElement("button");
    btn.textContent = "⚡ Auto-Run Quiz (Fast)";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "9999",
      background: "#28a745",
      color: "#fff",
      padding: "10px 15px",
      border: "none",
      borderRadius: "5px",
      fontSize: "16px",
      cursor: "pointer",
    });
    document.body.appendChild(btn);
    return btn;
  }

  function getQuizIframe() {
    return Array.from(document.getElementsByTagName("iframe")).find(
      (iframe) => {
        try {
          return iframe.contentDocument.querySelector(".quiz-card--active");
        } catch {
          return false;
        }
      }
    );
  }

  function waitForNextButton(doc, callback) {
    const checkInterval = setInterval(() => {
      const nextBtn = doc.querySelector(
        'button.quiz-card__button--next:not([aria-disabled="true"])'
      );
      if (nextBtn && !nextBtn.classList.contains("visually-hidden-always")) {
        clearInterval(checkInterval);
        callback(nextBtn);
      }
    }, 50); // 🔁 Fast polling
  }

  function selectAnswersAndAdvance(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const activeCard = doc.querySelector(".quiz-card--active");
      if (!activeCard) return alert("❌ No active quiz card found.");

      const labels = activeCard.querySelectorAll(
        "label.quiz-multiple-choice-option, label.quiz-multiple-response-option"
      );
      if (labels.length === 0) return alert("❌ No answer options found.");

      let matchedAny = false;

      labels.forEach((label) => {
        const input = label.querySelector("input");
        const textEl = label.querySelector(
          ".quiz-multiple-choice-option__label, .quiz-multiple-response-option__text"
        );
        const rawText = textEl?.innerText || "";
        const normalized = normalizeText(rawText);

        const isMatch = answerPool.some(
          (ans) => normalizeText(ans) === normalized
        );
        if (isMatch) {
          matchedAny = true;
          input.click();
          console.log("✅ Selected answer:", rawText);
        }
      });

      if (!matchedAny) {
        console.warn("⚠️ No match found. Selecting random...");
        const inputs = activeCard.querySelectorAll(
          'input[type="radio"], input[type="checkbox"]'
        );
        if (inputs.length > 0) {
          inputs[Math.floor(Math.random() * inputs.length)].click();
        }
      }

      // Submit quickly
      setTimeout(() => {
        const submitButton = activeCard.querySelector(
          "button.quiz-card__button"
        );
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
          console.log("🚀 Submitted.");

          // Wait for feedback → next
          setTimeout(() => {
            waitForNextButton(doc, (nextBtn) => {
              nextBtn.click();
              console.log("➡️ Next card.");

              // Short delay before next cycle
              setTimeout(() => selectAnswersAndAdvance(iframe), 200); // 10× faster loop
            });
          }, 200); // Shorter wait for feedback
        } else {
          console.warn("⚠️ Submit button not found or disabled.");
        }
      }, 100); // Fast submit
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Could not access iframe content (possibly cross-origin).");
    }
  }

  function init() {
    const button = createControlButton();
    button.addEventListener("click", () => {
      const iframe = getQuizIframe();
      if (!iframe) {
        alert("❌ Quiz iframe not found or inaccessible.");
        return;
      }
      selectAnswersAndAdvance(iframe);
    });
  }

  window.addEventListener("load", () => setTimeout(init, 100)); // Faster boot
})();
