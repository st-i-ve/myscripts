// ==UserScript==
// @name         Auto Expand Accordions & Click Continue (Iframe-Aware)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Automatically expands all accordions and clicks the continue button inside iframes and the main page
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function expandAndContinue(doc) {
    if (!doc) return;

    // Expand accordions
    const accordions = doc.querySelectorAll(".blocks-accordion__header");
    accordions.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "false") {
        console.log("📂 Expanding accordion:", btn);
        btn.click();
      }
    });

    // Click continue button after delay
    setTimeout(() => {
      const continueBtn = doc.querySelector(
        "button.continue-btn[data-continue-btn]"
      );
      if (continueBtn) {
        console.log('✅ Clicking "I’ve checked it out!" button:', continueBtn);
        continueBtn.click();
      } else {
        console.log('⚠️ "I’ve checked it out!" button not found.');
      }
    }, 1000);
  }

  function handleIframe(iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      // Initial run
      expandAndContinue(iframeDoc);

      // Observe changes
      const observer = new MutationObserver(() => expandAndContinue(iframeDoc));
      observer.observe(iframeDoc.body, { childList: true, subtree: true });
    } catch (err) {
      console.warn("❌ Cannot access iframe:", err);
    }
  }

  function processPageAndIframes() {
    expandAndContinue(document); // Main page

    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      if (!iframe.dataset.accordionHandled) {
        iframe.dataset.accordionHandled = "true";
        iframe.addEventListener("load", () => handleIframe(iframe));
        if (iframe.contentDocument?.readyState === "complete") {
          handleIframe(iframe);
        }
      }
    });
  }

  // Observe page for new iframes or accordion content
  const mainObserver = new MutationObserver(() => processPageAndIframes());
  mainObserver.observe(document.body, { childList: true, subtree: true });

  // Initial run after load
  window.addEventListener("load", () => {
    setTimeout(processPageAndIframes, 1000);
  });
})();
