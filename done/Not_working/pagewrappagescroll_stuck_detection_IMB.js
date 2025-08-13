// ==UserScript==
// @name         Auto Scroll Toggle with Stuck Detection for iframe #page-wrap
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Toggleable auto-scroll with stuck detection for #page-wrap inside iframe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = false;
  let stuckCount = 0;
  const iframeStates = new Map(); // track each iframe's scroll state
  const STUCK_THRESHOLD = 10; // consider stuck after 10 failed attempts (1 second)

  // create toggle button
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
    if (enabled) {
      // reset all tracking when enabling
      iframeStates.clear();
      stuckCount = 0;
      updateButtonText();
    } else {
      btn.textContent = "▶️ Enable Auto-Scroll";
      btn.style.backgroundColor = "#0043ce";
    }
  });

  function updateButtonText() {
    if (!enabled) {
      btn.textContent = "▶️ Enable Auto-Scroll";
      btn.style.backgroundColor = "#0043ce";
      return;
    }

    if (stuckCount > 0) {
      btn.textContent = `⚠️ Stuck (${stuckCount}) - Auto-Scroll ON`;
      btn.style.backgroundColor = "#ff6b35"; // orange for stuck
    } else {
      btn.textContent = "⏸️ Disable Auto-Scroll";
      btn.style.backgroundColor = "#28a745"; // green for working
    }
  }

  // interval to scroll and detect stuck state
  setInterval(() => {
    if (!enabled) return;

    const iframes = document.querySelectorAll("iframe");
    let totalStuck = 0;

    for (const iframe of iframes) {
      try {
        const el = iframe.contentDocument?.querySelector(
          "div.page-wrap#page-wrap"
        );
        if (!el) continue;

        const iframeId = iframe.src || iframe.outerHTML.substring(0, 100);
        const currentScrollTop = el.scrollTop;
        const maxScroll = el.scrollHeight - el.clientHeight;

        // initialize tracking for new iframes
        if (!iframeStates.has(iframeId)) {
          iframeStates.set(iframeId, {
            lastScrollTop: -1,
            stuckCounter: 0,
            isStuck: false
          });
        }

        const state = iframeStates.get(iframeId);

        // check if we're already at the bottom
        if (currentScrollTop >= maxScroll) {
          // at bottom, reset stuck counter
          state.stuckCounter = 0;
          state.isStuck = false;
        } else {
          // try to scroll to bottom
          el.scrollTop = el.scrollHeight;
          
          // check if scroll position changed
          if (currentScrollTop === state.lastScrollTop) {
            state.stuckCounter++;
            if (state.stuckCounter >= STUCK_THRESHOLD) {
              state.isStuck = true;
            }
          } else {
            // scroll position changed, reset counter
            state.stuckCounter = 0;
            state.isStuck = false;
          }
        }

        state.lastScrollTop = currentScrollTop;
        
        if (state.isStuck) {
          totalStuck++;
        }

      } catch (err) {
        // skip cross-origin iframes or ones that aren't ready yet
        continue;
      }
    }

    // update button based on stuck state
    stuckCount = totalStuck;
    updateButtonText();

  }, 100);
})();