// ==UserScript==
// @name         Flip All Flashcards Instantly
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically flip all flashcards at once with one button
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function flipAllFlashcards() {
    // Temporarily unhide all slides
    const allSlides = document.querySelectorAll(".carousel-slide");
    allSlides.forEach((slide) => {
      slide.removeAttribute("hidden");
      slide.removeAttribute("inert");
    });

    // Flip all visible flashcards
    const flipButtons = document.querySelectorAll(".flashcard-side-flip__btn");
    let flipped = 0;
    flipButtons.forEach((btn) => {
      if (btn.offsetParent !== null) {
        // visible in DOM
        btn.click();
        flipped++;
      }
    });

    console.log(`✅ Flipped ${flipped} flashcards.`);
    alert(`✅ Flipped ${flipped} flashcards.`);
  }

  function addFlipButton() {
    const btn = document.createElement("button");
    btn.textContent = "🔁 Flip All Cards";
    btn.style.position = "fixed";
    btn.style.top = "50%";
    btn.style.right = "20px";
    btn.style.transform = "translateY(-50%)";
    btn.style.zIndex = "9999";
    btn.style.padding = "12px 18px";
    btn.style.background = "#0d6efd";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.fontSize = "16px";
    btn.style.cursor = "pointer";
    btn.onclick = flipAllFlashcards;

    document.body.appendChild(btn);
  }

  window.addEventListener("load", () => {
    setTimeout(addFlipButton, 1500); // wait a bit for DOM to settle
  });
})();
