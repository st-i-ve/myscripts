// ==UserScript==
// @name         Smart Quiz Auto-Answer
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Selects correct answer from a known list inside an iframe quiz
// @author       OpenAI
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const answerPool = [
    "Surveys and questionnaires.",
    "Dispose of the data securely when it's no longer needed.",
    "Clearly define objectives and align data collection methods with the objectives.",
    "Check whether the tools used for collecting data give stable results over time.",
    "Commercial transaction records",
    "Surveys and questionnaires",
    "Web scraping technologies",
    "Use visualizations to show patterns, trends, and key insights.",
    "Check her information by comparing it with data from different methods or sources.",
    "Sensors and IoT devices",
  ];

  function createControlButton() {
    const btn = document.createElement("button");
    btn.textContent = "🎯 Answer Quiz";
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
        } catch (e) {
          return false;
        }
      }
    );
  }

  function normalizeText(text) {
    return text.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function selectCorrectAnswerInIframe(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const activeCard = doc.querySelector(".quiz-card--active");
      if (!activeCard) return alert("❌ No active quiz card found.");

      const options = activeCard.querySelectorAll(
        "label.quiz-multiple-choice-option"
      );
      if (options.length === 0) return alert("❌ No answer options found.");

      let selected = false;
      options.forEach((label) => {
        const input = label.querySelector("input");
        const optionTextEl = label.querySelector(
          ".quiz-multiple-choice-option__label"
        );
        const rawText = optionTextEl?.innerText || "";
        const normalizedText = normalizeText(rawText);

        const match = answerPool.find(
          (ans) => normalizeText(ans) === normalizedText
        );
        if (match && !selected) {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => input.click(), 200);
          selected = true;
          console.log("✅ Matched and selected answer:", match);
        }
      });

      if (!selected) {
        console.warn("⚠️ No matching answer found, selecting random...");
        const inputs = activeCard.querySelectorAll(
          'input[type="radio"], input[type="checkbox"]'
        );
        if (inputs.length === 0) return alert("❌ No options to select.");
        const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
        randomInput.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => randomInput.click(), 200);
      }
    } catch (err) {
      console.error("Error selecting answer in iframe:", err);
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
      selectCorrectAnswerInIframe(iframe);
    });
  }

  window.addEventListener("load", () => {
    setTimeout(init, 2000);
  });
})();
