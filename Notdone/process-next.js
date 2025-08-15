// ==UserScript==
// @name         Auto Click Process Next 20x (Iframe)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Click Next inside iframe 20 times rapidly
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function clickInsideIframe() {
    const iframe = document.querySelector("iframe"); // adjust selector if needed
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const nextBtn = doc.querySelector(
        '.block-process button[data-arrow="next"]'
      );
      if (nextBtn) {
        console.log("Next button found inside iframe, clicking 20 times...");
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            nextBtn.click();
          }, i * 50);
        }
      }
    } catch (err) {
      console.warn("Can't access iframe (likely cross-origin)");
    }
  }

  // Run every second in case iframe loads late
  setInterval(clickInsideIframe, 1000);
})();
