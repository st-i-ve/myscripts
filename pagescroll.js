// ==UserScript==
// @name         Auto Scroll Toggle with Fallback
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto-scroll #page-wrap div or whole page with enable/disable button
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = true;

  // Create toggle button
  const btn = document.createElement("button");
  btn.textContent = "⏸️ Disable Auto-Scroll";
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

  setInterval(() => {
    if (!enabled) return;

    const el = document.querySelector("div.page-wrap#page-wrap");

    if (el) {
      el.scrollTop = el.scrollHeight;
    } else {
      // Fallback: scroll the entire page
      window.scrollTo(
        0,
        document.body.scrollHeight || document.documentElement.scrollHeight
      );
    }
  }, 50);
})();
