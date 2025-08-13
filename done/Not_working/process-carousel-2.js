// ==UserScript==
// @name         Carousel Auto-Clicker Inside Iframe (Continuous 20 Clicks)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Continuously clicks carousel right button 20 times when in view inside an iframe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Helper: Click button multiple times instantly
  function clickMultipleTimes(btn, times) {
    for (let i = 0; i < times; i++) {
      btn.click();
    }
  }

  // Check if element is visible in viewport
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function monitorCarousel(iframeDoc) {
    const carousel = iframeDoc.querySelector(".block-process-carousel");
    const nextBtn = iframeDoc.querySelector(".carousel-controls-next");

    if (!carousel || !nextBtn) return;

    // Keep checking every second
    setInterval(() => {
      if (isInViewport(carousel)) {
        clickMultipleTimes(nextBtn, 20);
      }
    }, 1000); // Runs every second while in view
  }

  function checkIframe() {
    const iframe = document.querySelector("iframe"); // Adjust selector if needed
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      monitorCarousel(iframeDoc);
    } catch (err) {
      console.error("Error accessing iframe:", err);
    }
  }

  // Wait until iframe exists
  const iframeCheckInterval = setInterval(() => {
    if (document.querySelector("iframe")) {
      clearInterval(iframeCheckInterval);
      checkIframe();
    }
  }, 1000);
})();
