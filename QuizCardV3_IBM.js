// ==UserScript==
// @name         Auto Answer Inside Iframe
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds button to select a random radio/checkbox inside quiz iframe
// @author       OpenAI
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function createControlButton() {
    const btn = document.createElement("button");
    btn.textContent = "🎯 Answer Quiz";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "9999",
      background: "#007bff",
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
    // Customize this if there's more than one iframe
    return Array.from(document.getElementsByTagName("iframe")).find(
      (iframe) => {
        try {
          return iframe.contentDocument.querySelector(
            ".quiz-item__card--active"
          );
        } catch (e) {
          return false; // likely a cross-origin error
        }
      }
    );
  }

  function selectRandomAnswerInIframe(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const activeCard = doc.querySelector(".quiz-item__card--active");
      if (!activeCard) return alert("❌ No active quiz card found.");

      const inputs = activeCard.querySelectorAll(
        'input[type="radio"], input[type="checkbox"]'
      );
      if (inputs.length === 0) return alert("❌ No options to select.");

      const randomInput = inputs[Math.floor(Math.random() * inputs.length)];

      // Scroll and simulate user click
      randomInput.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        randomInput.click(); // triggers real click
      }, 200);
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
      selectRandomAnswerInIframe(iframe);
    });
  }

  // Wait for the DOM and iframe to be available
  window.addEventListener("load", () => {
    setTimeout(init, 2000); // Give iframe a moment to load
  });
})();
