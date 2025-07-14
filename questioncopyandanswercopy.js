// ==UserScript==
// @name         Quiz Copy Tool – Question + Answer & Options (Iframe Only)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Copies question + answer or question + options from active quiz card inside iframe
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  // ✅ Only run inside an iframe
  if (window.top === window.self) return;

  // ✅ Prevent re-injection
  if (window.hasRunQuizTool) return;
  window.hasRunQuizTool = true;

  // ✅ UI Setup
  function createFloatingPanel() {
    if (document.getElementById("quizToolPanel")) return;

    const panel = document.createElement("div");
    panel.id = "quizToolPanel";
    Object.assign(panel.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      zIndex: "9999",
      backgroundColor: "#f4f4f4",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    });

    panel.appendChild(
      createButton("copyQandA", "📋 Copy Active Q&A", handleCopyActiveAnswer)
    );
    panel.appendChild(
      createButton(
        "copyQandOptions",
        "📋 Copy Question + Options",
        handleCopyActivePrompt
      )
    );

    document.body.appendChild(panel);
  }

  function createButton(id, text, handler) {
    const button = document.createElement("button");
    button.id = id;
    button.textContent = text;
    Object.assign(button.style, {
      width: "100%",
      padding: "8px 12px",
      marginTop: "6px",
      backgroundColor: "#0043ce",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    });
    button.addEventListener("click", handler);
    return button;
  }

  // ✅ Copy Question + Correct Answer(s)
  function handleCopyActiveAnswer() {
    const btn = document.getElementById("copyQandA");
    const activeCard = document.querySelector(
      ".quiz-item__card--active .quiz-card__main"
    );
    if (!activeCard) return showError(btn, "❌ No active question");

    const questionText =
      activeCard.querySelector(".quiz-card__title")?.innerText.trim() ||
      "[No Question]";
    const inputs = activeCard.querySelectorAll(
      'input[type="checkbox"], input[type="radio"]'
    );

    if (!inputs.length) return showError(btn, "❌ No options found");

    const correctAnswers = [];

    Array.from(inputs).forEach((input, i) => {
      const label = input.closest("label");
      const text = label
        ?.querySelector(
          ".quiz-multiple-choice-option__label, .quiz-multiple-response-option__text"
        )
        ?.innerText.trim();
      const letter = String.fromCharCode(65 + i);
      if (label?.classList.contains("is-correct") && text) {
        correctAnswers.push(`${letter}. ${text}`);
      }
    });

    if (!correctAnswers.length)
      return showError(btn, "❌ No correct answer found");

    const output = `Question:\n${questionText}\n\nAnswer:\n${correctAnswers.join(
      " and "
    )}`;
    GM_setClipboard(output);
    showSuccess(btn, "✅ Copied!");
  }

  // ✅ Copy Question + All Options (for prompting)
  function handleCopyActivePrompt() {
    const btn = document.getElementById("copyQandOptions");
    const activeCard = document.querySelector(
      ".quiz-item__card--active .quiz-card__main"
    );
    if (!activeCard) return showError(btn, "❌ No active question");

    const questionText =
      activeCard.querySelector(".quiz-card__title")?.innerText.trim() ||
      "[No Question]";
    const checkboxes = activeCard.querySelectorAll('input[type="checkbox"]');
    const radios = activeCard.querySelectorAll('input[type="radio"]');
    const isMulti = checkboxes.length > 0;
    const inputs = isMulti ? checkboxes : radios;

    if (!inputs.length) return showError(btn, "❌ No options found");

    const options = Array.from(inputs)
      .map((input, i) => {
        const label = input
          .closest("label")
          ?.querySelector(
            ".quiz-multiple-choice-option__label, .quiz-multiple-response-option__text"
          );
        const letter = String.fromCharCode(65 + i);
        return label ? `${letter}. ${label.innerText.trim()}` : null;
      })
      .filter(Boolean);

    const prompt = isMulti
      ? `\n\n🤖 AI PROMPT:\nPlease answer with the correct letter(s), e.g., A and C. Keep it short.`
      : `\n\n🤖 AI PROMPT:\nPlease answer with only the correct letter (A, B, C, etc). Keep it short.`;

    const output = `Question:\n${questionText}\n\nOptions:\n${options.join(
      "\n"
    )}${prompt}`;
    GM_setClipboard(output);
    showSuccess(btn, "✅ Copied!");
  }

  // ✅ UI Feedback
  function showSuccess(button, message) {
    const original = button.textContent;
    button.textContent = message;
    button.style.backgroundColor = "green";
    setTimeout(() => {
      button.textContent = original;
      button.style.backgroundColor = "#0043ce";
    }, 1500);
  }

  function showError(button, message) {
    const original = button.textContent;
    button.textContent = message;
    button.style.backgroundColor = "#a00";
    setTimeout(() => {
      button.textContent = original;
      button.style.backgroundColor = "#0043ce";
    }, 2000);
  }

  // ✅ Wait for DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (!document.getElementById("quizToolPanel")) {
        createFloatingPanel();
      }
    });
  } else {
    if (!document.getElementById("quizToolPanel")) {
      createFloatingPanel();
    }
  }
})();
