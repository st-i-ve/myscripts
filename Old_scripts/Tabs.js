class="blocks-tabs"


// ==UserScript==
// @name         Auto Click Tabs
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Click all tabs in order inside the blocks-tabs element
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Wait for the tab container to appear
  function waitForTabs() {
    const tabContainer = document.querySelector(".blocks-tabs__header-wrap");
    if (!tabContainer) {
      setTimeout(waitForTabs, 500);
      return;
    }

    const tabButtons = tabContainer.querySelectorAll(
      ".blocks-tabs__header-item"
    );
    if (!tabButtons || tabButtons.length === 0) return;

    // Click each tab with a delay
    tabButtons.forEach((btn, index) => {
      setTimeout(() => {
        btn.click();
      }, index * 500); // 500ms between clicks
    });
  }

  waitForTabs();
})();
