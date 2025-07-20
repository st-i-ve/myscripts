// ==UserScript==
// @name         Count .sorting Elements (Iframe Aware - Bottom Right)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Counts .sorting elements inside iframe or main page and shows result via floating button (bottom right corner)
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  function createButton() {
    if (document.getElementById("countSortingBtn")) return;

    const button = document.createElement("button");
    button.id = "countSortingBtn";
    button.textContent = "🔍 Count .sorting";

    Object.assign(button.style, {
      position: "fixed",
      bottom: "20px", // ⬅️ Lower part
      right: "20px", // ⬅️ Right side
      zIndex: "999999",
      padding: "12px 20px",
      backgroundColor: "red",
      color: "white",
      fontSize: "16px",
      border: "none",
      borderRadius: "50px",
      cursor: "pointer",
      boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    });

    button.addEventListener("click", () => {
      let context = document;
      let count = 0;

      const iframe = document.querySelector("iframe");

      if (iframe && iframe.contentDocument) {
        try {
          context = iframe.contentDocument;
          console.log("✅ Accessing iframe content");
        } catch (err) {
          console.warn("⚠️ Cross-origin iframe. Using main document.");
        }
      }

      const elements = context.querySelectorAll(".sorting");
      count = elements.length;

      button.textContent = `✅ Found ${count} .sorting`;
      button.style.backgroundColor = count > 0 ? "green" : "#a00";

      setTimeout(() => {
        button.textContent = "🔍 Count .sorting";
        button.style.backgroundColor = "red";
      }, 3000);
    });

    document.body.appendChild(button);
  }

  window.addEventListener("load", () => {
    setTimeout(createButton, 1500);
  });
})();
