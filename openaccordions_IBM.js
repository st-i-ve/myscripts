// ==UserScript==
// @name         Expand Accordions & Click Continue
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Expand all accordion sections and auto-click "I've checked it out!" button
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function expandAllAccordionsAndClickContinue() {
    // Expand all collapsed accordion sections
    const accordionButtons = document.querySelectorAll(
      ".blocks-accordion__header"
    );

    accordionButtons.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "false") {
        btn.click(); // simulate user click
      }
    });

    // Wait briefly to ensure content is fully expanded
    setTimeout(() => {
      const continueBtn = document.querySelector(
        "button.continue-btn[data-continue-btn]"
      );
      if (continueBtn) {
        continueBtn.click();
        console.log('✅ "I’ve checked it out!" button clicked.');
      } else {
        console.log('⚠️ "I’ve checked it out!" button not found.');
      }
    }, 1000); // 1 second delay after accordion expansion
  }

  function addExpandAllButton() {
    const btn = document.createElement("button");
    btn.textContent = "Expand & Continue";
    btn.style.position = "fixed";
    btn.style.top = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "9999";
    btn.style.padding = "10px 15px";
    btn.style.background = "#1e90ff";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    btn.onclick = expandAllAccordionsAndClickContinue;

    document.body.appendChild(btn);
  }

  window.addEventListener("load", () => {
    setTimeout(addExpandAllButton, 1000); // Wait 1s to ensure page is ready
  });
})();
