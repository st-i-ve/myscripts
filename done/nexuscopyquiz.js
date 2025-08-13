// ==UserScript==
// @name         Copy Nexus Quiz
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds a button to copy the currently visible Nexus quiz question and choices to clipboard without alerts and with AI instruction.
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function copyQuestionAndChoices() {
    const questionSection = document.querySelector(
      ".question-section:not(.hidden)"
    );
    if (!questionSection) {
      console.log("No visible question section found!");
      return;
    }

    const questionContent = questionSection.querySelector(
      ".question-content p"
    );
    const questionText = questionContent
      ? questionContent.innerText.trim()
      : "";

    const choiceLabels = questionSection.querySelectorAll(
      ".question-choice label.label"
    );
    const choices = Array.from(choiceLabels).map((label) =>
      label.innerText.trim()
    );

    let textToCopy = `Question:\n${questionText}\n\nChoices:\n`;
    choices.forEach((choice, i) => {
      textToCopy += `${String.fromCharCode(97 + i)}. ${choice}\n`; // a, b, c, ...
    });

    textToCopy += `\nAnswer with either a, b, c, d, e, or f. No lengthy answers, just straight to the point.`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const btn = document.getElementById("copyNexusBtn");
        if (!btn) return;
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 1500);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }

  function addCopyButton() {
    if (document.getElementById("copyNexusBtn")) return;

    const btn = document.createElement("button");
    btn.id = "copyNexusBtn";
    btn.textContent = "Copy Nexus";
    btn.style.position = "fixed";
    btn.style.bottom = "70px";
    btn.style.right = "7px";
    btn.style.zIndex = 10000;
    btn.style.padding = "8px 14px";
    btn.style.backgroundColor = "#2196F3";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

    btn.addEventListener("click", copyQuestionAndChoices);

    document.body.appendChild(btn);
  }

  window.addEventListener("load", () => {
    setTimeout(addCopyButton, 1500);
  });
})();
