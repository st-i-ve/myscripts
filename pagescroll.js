// ==UserScript==
// @name         Auto Scroll Page Wrap to Bottom
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Scrolls #page-wrap div to bottom every 200ms
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  setInterval(() => {
    const el = document.querySelector("div.page-wrap#page-wrap");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, 200);
})();
