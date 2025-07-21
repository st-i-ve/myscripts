// ==UserScript==
// @name         Auto Flip All Flashcards (Iframe-Aware)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatically flip all visible flashcards in main page and iframes
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function flipFlashcardsIn(doc) {
    if (!doc) return;

    // Unhide all slides
    const allSlides = doc.querySelectorAll(".carousel-slide");
    allSlides.forEach((slide) => {
      slide.removeAttribute("hidden");
      slide.removeAttribute("inert");
    });

    // Flip visible flashcards
    const flipButtons = doc.querySelectorAll(".flashcard-side-flip__btn");
    let flipped = 0;
    flipButtons.forEach((btn) => {
      if (btn.offsetParent !== null) {
        btn.click();
        flipped++;
      }
    });

    if (flipped > 0) {
      console.log(
        `✅ Flipped ${flipped} flashcards in`,
        doc === document ? "main page" : "iframe"
      );
    }
  }

  function handleIframe(iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      flipFlashcardsIn(iframeDoc);

      const observer = new MutationObserver(() => flipFlashcardsIn(iframeDoc));
      observer.observe(iframeDoc.body, { childList: true, subtree: true });
    } catch (err) {
      console.warn("❌ Cannot access iframe:", err);
    }
  }

  function processAll() {
    // Flip on main page
    flipFlashcardsIn(document);

    // Handle iframes
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      if (!iframe.dataset.flashHandled) {
        iframe.dataset.flashHandled = "true";
        iframe.addEventListener("load", () => handleIframe(iframe));
        if (iframe.contentDocument?.readyState === "complete") {
          handleIframe(iframe);
        }
      }
    });
  }

  // Observe page changes for dynamic flashcards or iframes
  const mainObserver = new MutationObserver(() => processAll());
  mainObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("load", () => {
    setTimeout(processAll, 1000);
  });
})();
