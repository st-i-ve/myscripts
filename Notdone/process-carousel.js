// ==UserScript==
// @name         Carousel Auto-Clicker Inside Iframe (Instant 20 Clicks)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Always clicks carousel right button 20 times instantly when in view inside an iframe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Helper: Click button multiple times instantly
  function clickMultipleTimes(btn, times) {
    if (!btn) return;
    for (let i = 0; i < times; i++) {
      btn.click();
    }
  }

  // Wait for iframe to load
  function checkIframe() {
    const iframe = document.querySelector("iframe"); // adjust selector if needed
    if (!iframe) return;
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      // Observe carousel coming into view
      const carousel = iframeDoc.querySelector(".block-process-carousel");
      if (!carousel) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const nextBtn = iframeDoc.querySelector(
                ".carousel-controls-next"
              );
              if (nextBtn) {
                clickMultipleTimes(nextBtn, 20); // Always 20 clicks instantly
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(carousel);
    } catch (err) {
      console.error("Error accessing iframe:", err);
    }
  }

  // Keep checking for iframe until found
  setInterval(checkIframe, 1000);
})();
