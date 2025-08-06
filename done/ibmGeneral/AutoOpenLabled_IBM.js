// ==UserScript==
// @name         Auto-Open Labeled Graphic Markers in iframe
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically clicks all .labeled-graphic-marker buttons inside iframes to mark them as viewed/opened.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function clickAllMarkers(doc) {
    const markers = doc.querySelectorAll(
      "button.labeled-graphic-marker:not(.labeled-graphic-marker--complete):not(.labeled-graphic-marker--active)"
    );
    markers.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "false") {
        console.log("🔘 Clicking marker:", btn);
        btn.click();
      }
    });
  }

  function handleIframe(iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      // Initial click
      clickAllMarkers(iframeDoc);

      // Observe dynamically added markers
      const observer = new MutationObserver(() => clickAllMarkers(iframeDoc));
      observer.observe(iframeDoc.body, { childList: true, subtree: true });
    } catch (err) {
      console.warn("❌ Cannot access iframe:", err);
    }
  }

  // Monitor the main page for iframes
  const mainObserver = new MutationObserver(() => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      if (!iframe.dataset.markerHandled) {
        iframe.dataset.markerHandled = "true";
        iframe.addEventListener("load", () => handleIframe(iframe));
        // If already loaded
        if (iframe.contentDocument?.readyState === "complete") {
          handleIframe(iframe);
        }
      }
    });
  });

  mainObserver.observe(document.body, { childList: true, subtree: true });
})();
