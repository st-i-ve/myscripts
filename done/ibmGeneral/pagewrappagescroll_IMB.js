// ==UserScript==
// @name         Auto Scroll Toggle for iframe #page-wrap (Initially Disabled)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Toggleable auto-scroll for #page-wrap inside iframe only
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = false;

  // Create toggle button
  const btn = document.createElement("button");
  btn.textContent = "▶️ Enable Auto-Scroll";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    padding: "10px 15px",
    backgroundColor: "#0043ce",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    enabled = !enabled;
    btn.textContent = enabled
      ? "⏸️ Disable Auto-Scroll"
      : "▶️ Enable Auto-Scroll";
  });

  // Interval to scroll only the iframe's #page-wrap
  setInterval(() => {
    if (!enabled) return;

    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const el = iframe.contentDocument?.querySelector(
          "div.page-wrap#page-wrap"
        );
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      } catch (err) {
        // Skip cross-origin iframes or ones that aren't ready yet
        continue;
      }
    }
  }, 100); // Slightly slower to reduce load
})();
