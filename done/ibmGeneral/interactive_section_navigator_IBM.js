// ==UserScript==
// @name         Interactive Section Navigator for iframe #page-wrap
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Navigate through noOutline sections, identify interactive elements, and highlight each with category info
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = false;
  let currentIndex = 0;
  let noOutlineElements = [];
  let currentHighlighted = null;
  let processingTimeout = null;
  let currentIframe = null;

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "▶️ Start Navigation";
  Object.assign(toggleBtn.style, {
    position: "fixed",
    bottom: "70px",
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

  // Create status display
  const statusDisplay = document.createElement("div");
  statusDisplay.textContent = "Ready to navigate";
  Object.assign(statusDisplay.style, {
    position: "fixed",
    bottom: "120px",
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
    maxWidth: "250px",
    textAlign: "center",
  });
  document.body.appendChild(statusDisplay);

  // function to categorize noOutline elements
  function categorizeElement(element) {
    // check for specific interactive classes
    if (element.querySelector('.blocks-tabs')) return 'tabs-open all tabs';
    if (element.querySelector('.block-flashcards')) return 'flip cards';
    if (element.querySelector('.blocks-accordion')) return 'open all accordions';
    if (element.querySelector('.block-labeled-graphic')) return 'open labels';
    if (element.querySelector('.continue-btn.brand--ui')) return 'click the continue button';
    
    // check for block-knowledge with subcategories
    const knowledgeElement = element.querySelector('.block-knowledge');
    if (knowledgeElement) {
      const ariaLabel = knowledgeElement.getAttribute('aria-label');
      if (ariaLabel) {
        if (ariaLabel.includes('Multiple choice')) return 'knowledge -answer with radio';
        if (ariaLabel.includes('Multiple response')) return 'knowledge -answer with checkbox';
      }
      return 'knowledge -general';
    }
    
    return 'general';
  }

  // function to highlight current element
  function highlightElement(element) {
    if (currentHighlighted) {
      unhighlightElement(currentHighlighted);
    }
    
    currentHighlighted = element;
    element.style.outline = "3px solid #ff6b35";
    element.style.backgroundColor = "rgba(255, 107, 53, 0.1)";
    element.style.transition = "all 0.3s ease";
  }

  // function to remove highlighting
  function unhighlightElement(element) {
    if (element) {
      element.style.outline = "";
      element.style.backgroundColor = "";
      element.style.transition = "";
    }
  }

  // function to scroll element into view
  function scrollToElement(element, container) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // calculate scroll position to center the element
    const scrollTop = container.scrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
    
    container.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    });
  }

  // function to update status display
  function updateStatus(category, index, total) {
    statusDisplay.textContent = `${index + 1}/${total}: ${category}`;
  }

  // function to process current element
  function processCurrentElement() {
    if (!enabled || currentIndex >= noOutlineElements.length) {
      stopNavigation();
      return;
    }

    const element = noOutlineElements[currentIndex];
    const category = categorizeElement(element);
    
    // highlight current element
    highlightElement(element);
    
    // scroll to element
    const pageWrap = currentIframe.contentDocument.querySelector("div.page-wrap#page-wrap");
    if (pageWrap) {
      scrollToElement(element, pageWrap);
    }
    
    // update status
    updateStatus(category, currentIndex, noOutlineElements.length);
    
    // schedule next element after 1 second
    processingTimeout = setTimeout(() => {
      currentIndex++;
      processCurrentElement();
    }, 1000);
  }

  // function to start navigation
  function startNavigation() {
    // find iframe and noOutline elements
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) continue;

        const pageWrap = iframeDoc.querySelector("div.page-wrap#page-wrap");
        if (pageWrap) {
          currentIframe = iframe;
          noOutlineElements = Array.from(iframeDoc.querySelectorAll('.noOutline[data-block-id]'));
          
          if (noOutlineElements.length > 0) {
            currentIndex = 0;
            enabled = true;
            toggleBtn.textContent = "⏸️ Stop Navigation";
            statusDisplay.textContent = "Starting navigation...";
            processCurrentElement();
            return;
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    // if we get here, no suitable iframe was found
    statusDisplay.textContent = "No suitable content found";
  }

  // function to stop navigation
  function stopNavigation() {
    enabled = false;
    currentIndex = 0;
    
    // clear timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      processingTimeout = null;
    }
    
    // remove highlighting
    if (currentHighlighted) {
      unhighlightElement(currentHighlighted);
      currentHighlighted = null;
    }
    
    // reset UI
    toggleBtn.textContent = "▶️ Start Navigation";
    statusDisplay.textContent = "Navigation stopped";
    
    // reset after 2 seconds
    setTimeout(() => {
      if (!enabled) {
        statusDisplay.textContent = "Ready to navigate";
      }
    }, 2000);
  }

  // toggle button event listener
  toggleBtn.addEventListener("click", () => {
    if (enabled) {
      stopNavigation();
    } else {
      startNavigation();
    }
  });

  // cleanup when page unloads
  window.addEventListener('beforeunload', () => {
    stopNavigation();
  });
})();