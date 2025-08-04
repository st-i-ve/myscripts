// ==UserScript==
// @name         Section Counter Auto Scroll for iframe #page-wrap
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Slow auto-scroll with noOutline section counter for #page-wrap inside iframe
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = false;
  let noOutlineCount = 0;
  let seenBlockIds = new Set();

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "▶️ Enable Auto-Scroll";
  Object.assign(toggleBtn.style, {
    position: "fixed",
    bottom: "70px", // 70px from bottom as requested
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
  document.body.appendChild(toggleBtn);

  // Create counter display
  const counterDisplay = document.createElement("div");
  counterDisplay.textContent = "Sections: 0";
  Object.assign(counterDisplay.style, {
    position: "fixed",
    bottom: "120px", // positioned above the toggle button (70px + 50px spacing)
    right: "20px",
    zIndex: 9999,
    padding: "8px 12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(counterDisplay);

  toggleBtn.addEventListener("click", () => {
    enabled = !enabled;
    toggleBtn.textContent = enabled
      ? "⏸️ Disable Auto-Scroll"
      : "▶️ Enable Auto-Scroll";
  });

  // function to update counter display
  function updateCounter() {
    counterDisplay.textContent = `Sections: ${noOutlineCount}`;
  }

  // function to count noOutline elements in iframe
  function countNoOutlineElements(iframeDoc) {
    const noOutlineElements = iframeDoc.querySelectorAll('.noOutline[data-block-id]');
    let newCount = 0;
    
    noOutlineElements.forEach(element => {
      const blockId = element.getAttribute('data-block-id');
      if (blockId && !seenBlockIds.has(blockId)) {
        seenBlockIds.add(blockId);
        newCount++;
      }
    });
    
    if (newCount > 0) {
      noOutlineCount += newCount;
      updateCounter();
    }
  }

  // function to setup mutation observer for an iframe
  function setupMutationObserver(iframeDoc) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // check if the added node is a noOutline element
              if (node.classList && node.classList.contains('noOutline')) {
                const blockId = node.getAttribute('data-block-id');
                if (blockId && !seenBlockIds.has(blockId)) {
                  seenBlockIds.add(blockId);
                  noOutlineCount++;
                  updateCounter();
                }
              }
              // also check for noOutline elements within the added node
              const noOutlineElements = node.querySelectorAll && node.querySelectorAll('.noOutline[data-block-id]');
              if (noOutlineElements) {
                noOutlineElements.forEach(element => {
                  const blockId = element.getAttribute('data-block-id');
                  if (blockId && !seenBlockIds.has(blockId)) {
                    seenBlockIds.add(blockId);
                    noOutlineCount++;
                    updateCounter();
                  }
                });
              }
            }
          });
        }
      });
    });

    // observe the entire document for changes
    observer.observe(iframeDoc.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  let observers = new Map();

  // slow scroll interval - moves 2-3 pixels at a time for smooth scrolling
  setInterval(() => {
    if (!enabled) return;

    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) continue;

        const pageWrap = iframeDoc.querySelector("div.page-wrap#page-wrap");
        if (pageWrap) {
          // setup mutation observer if not already done for this iframe
          if (!observers.has(iframe)) {
            observers.set(iframe, setupMutationObserver(iframeDoc));
            // initial count of existing elements
            countNoOutlineElements(iframeDoc);
          }

          // slow scroll - move 3 pixels at a time
          const currentScroll = pageWrap.scrollTop;
          const maxScroll = pageWrap.scrollHeight - pageWrap.clientHeight;
          
          if (currentScroll < maxScroll) {
            pageWrap.scrollTop = currentScroll + 3;
          }
        }
      } catch (err) {
        // skip cross-origin iframes or ones that aren't ready yet
        continue;
      }
    }
  }, 50); // 50ms interval for smooth scrolling

  // cleanup observers when page unloads
  window.addEventListener('beforeunload', () => {
    observers.forEach(observer => observer.disconnect());
  });
})();