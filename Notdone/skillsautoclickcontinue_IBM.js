// ==UserScript==
// @name         Auto Click Submit Reflection in iframe (Repeat + Scroll-safe)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Repeatedly clicks 'SUBMIT REFLECTION' button inside iframe when it appears in view
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Check if element is visible in the iframe's viewport
  function isInViewport(el, iframeWindow) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (iframeWindow.innerHeight ||
          iframeWindow.document.documentElement.clientHeight) &&
      rect.right <=
        (iframeWindow.innerWidth ||
          iframeWindow.document.documentElement.clientWidth)
    );
  }

  // Repeatedly scan for the button in the iframe
  setInterval(() => {
    const iframe = document.querySelector("iframe");

    if (!iframe) return;

    try {
      const iframeWin = iframe.contentWindow;
      const iframeDoc = iframeWin.document;

      const btn = iframeDoc.querySelector("button.continue-btn.brand--ui");

      if (btn && isInViewport(btn, iframeWin)) {
        console.log("✅ Button in view, clicking...");
        btn.click();
      }
    } catch (err) {
      // Cross-origin or inaccessible iframe
      console.warn("⚠️ Cannot access iframe (cross-origin or not ready).");
    }
  }, 50); // Check every 500ms
})();
