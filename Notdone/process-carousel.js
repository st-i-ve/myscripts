// ==UserScript==
// @name         Carousel Auto-Click Slide Buttons
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Click carousel start button, then click all slide buttons in order when in view
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let processing = false;

  // Function to start carousel and click all slide buttons
  function startAndClickSlides(carousel) {
    if (processing) return;
    processing = true;

    // Click the START button
    const startBtn = carousel.querySelector(".block-process-card__start-btn");
    if (startBtn) startBtn.click();

    // Wait a tiny bit for the carousel to initialize
    setTimeout(() => {
      const slideButtons = carousel.querySelectorAll(
        ".carousel-controls-items .carousel-controls-item-btn"
      );

      // Click each button in order
      slideButtons.forEach((btn, index) => {
        setTimeout(() => {
          btn.click();
        }, index * 100); // 100ms delay between clicks for stability
      });

      // Reset processing after done
      setTimeout(() => {
        processing = false;
      }, slideButtons.length * 100 + 500);
    }, 200); // 200ms initial delay for start button effect
  }

  // IntersectionObserver to detect carousel in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAndClickSlides(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  // Monitor all existing carousels
  function monitorCarousels() {
    const carousels = document.querySelectorAll(".block-process-carousel");
    carousels.forEach((carousel) => observer.observe(carousel));
  }

  monitorCarousels();

  // Watch for dynamically added carousels
  const mutationObserver = new MutationObserver(() => {
    monitorCarousels();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
})();
