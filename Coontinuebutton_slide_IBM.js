// ==UserScript==
// @name         Continuous Click All CONTINUE Buttons When Visible
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Continuously clicks CONTINUE buttons 15 times when visible, including special dialogue versions and iframe contents
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 300;
  const CLICKS_PER_RUN = 15;
  const CLICK_DELAY_MS = 50;

  const SELECTORS = [
    "button.scenario-block__text__continue",
    "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
  ];

  function isInView(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  function clickIfVisible(button) {
    if (button && isInView(button)) {
      console.log("✅ Clicking CONTINUE button 15 times...");
      for (let i = 0; i < CLICKS_PER_RUN; i++) {
        setTimeout(() => {
          button.click();
        }, i * CLICK_DELAY_MS);
      }
    }
  }

  function findAndClickInDocument(doc) {
    for (const selector of SELECTORS) {
      const button = doc.querySelector(selector);
      clickIfVisible(button);
    }
  }

  setInterval(() => {
    // Check main document
    findAndClickInDocument(document);

    // Check all iframes
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) findAndClickInDocument(iframeDoc);
      } catch (err) {
        console.warn("⚠️ Cannot access iframe due to CORS:", err);
      }
    }
  }, CHECK_INTERVAL_MS);
})();
