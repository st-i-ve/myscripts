// ==UserScript==
// @name         Sequential Section Navigator with Category Highlighting
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Navigate through noOutline sections sequentially with category identification and highlighting
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let enabled = false;
  let currentIndex = 0;
  let noOutlineElements = [];
  let currentHighlightedElement = null;
  let navigationTimeout = null;
  let currentIframe = null;

  // create toggle button
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

  // create category display
  const categoryDisplay = document.createElement("div");
  categoryDisplay.textContent = "Ready to navigate";
  Object.assign(categoryDisplay.style, {
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
    minWidth: "200px",
    textAlign: "center",
  });
  document.body.appendChild(categoryDisplay);

  // function to identify block type based on classes and attributes
  function identifyBlockType(element) {
    // check for specific interactive classes
    if (element.querySelector('.blocks-tabs')) {
      return "tabs - open all tabs";
    }
    if (element.querySelector('.block-flashcards')) {
      return "flashcards - flip cards";
    }
    if (element.querySelector('.blocks-accordion')) {
      return "accordion - open all accordions";
    }
    if (element.querySelector('.block-labeled-graphic')) {
      return "labeled graphic - open labels";
    }
    if (element.querySelector('.continue-btn.brand--ui')) {
      return "continue button - click";
    }
    
    // check for knowledge blocks with specific aria-labels
    const knowledgeBlock = element.querySelector('.block-knowledge');
    if (knowledgeBlock) {
      const ariaLabel = knowledgeBlock.getAttribute('aria-label') || '';
      if (ariaLabel.includes('Multiple choice')) {
        return "knowledge - answer with radio";
      }
      if (ariaLabel.includes('Multiple response')) {
        return "knowledge - answer with checkbox";
      }
      return "knowledge - general";
    }
    
    return "general";
  }

  // function to highlight element
  function highlightElement(element) {
    if (!element) return;
    
    // remove previous highlight
    removeHighlight();
    
    // add highlight styling
    element.style.border = "3px solid #ff6b35";
    element.style.backgroundColor = "rgba(255, 107, 53, 0.1)";
    element.style.boxShadow = "0 0 15px rgba(255, 107, 53, 0.5)";
    element.style.transition = "all 0.3s ease";
    
    currentHighlightedElement = element;
    
    // scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
  }

  // function to remove highlight
  function removeHighlight() {
    if (currentHighlightedElement) {
      currentHighlightedElement.style.border = "";
      currentHighlightedElement.style.backgroundColor = "";
      currentHighlightedElement.style.boxShadow = "";
      currentHighlightedElement.style.transition = "";
      currentHighlightedElement = null;
    }
  }

  // function to update category display
  function updateCategoryDisplay(category, index, total) {
    categoryDisplay.textContent = `${index + 1}/${total}: ${category}`;
  }

  // function to collect all noOutline elements from iframe
  function collectNoOutlineElements(iframeDoc) {
    return Array.from(iframeDoc.querySelectorAll('.noOutline[data-block-id]'));
  }

  // function to navigate to next section
  function navigateToNextSection() {
    if (!enabled || !noOutlineElements.length) return;
    
    if (currentIndex >= noOutlineElements.length) {
      // reached the end, reset or stop
      enabled = false;
      toggleBtn.textContent = "▶️ Start Navigation";
      categoryDisplay.textContent = "Navigation complete!";
      removeHighlight();
      currentIndex = 0;
      return;
    }
    
    const currentElement = noOutlineElements[currentIndex];
    if (currentElement) {
      const category = identifyBlockType(currentElement);
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length);
      highlightElement(currentElement);
      
      currentIndex++;
      
      // schedule next navigation after 1 second
      navigationTimeout = setTimeout(navigateToNextSection, 1000);
    }
  }

  // function to start navigation
  function startNavigation() {
    // find iframe with page-wrap
    const iframes = document.querySelectorAll("iframe");
    let targetIframe = null;
    
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) continue;
        
        const pageWrap = iframeDoc.querySelector("div.page-wrap#page-wrap");
        if (pageWrap) {
          targetIframe = iframe;
          currentIframe = iframe;
          break;
        }
      } catch (err) {
        // skip cross-origin iframes
        continue;
      }
    }
    
    if (!targetIframe) {
      categoryDisplay.textContent = "No iframe found!";
      return false;
    }
    
    // collect all noOutline elements
    noOutlineElements = collectNoOutlineElements(targetIframe.contentDocument);
    
    if (noOutlineElements.length === 0) {
      categoryDisplay.textContent = "No sections found!";
      return false;
    }
    
    currentIndex = 0;
    categoryDisplay.textContent = `Found ${noOutlineElements.length} sections`;
    
    // start navigation after a brief delay
    setTimeout(navigateToNextSection, 500);
    return true;
  }

  // function to stop navigation
  function stopNavigation() {
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
      navigationTimeout = null;
    }
    removeHighlight();
    currentIndex = 0;
    noOutlineElements = [];
    categoryDisplay.textContent = "Navigation stopped";
  }

  // toggle button event listener
  toggleBtn.addEventListener("click", () => {
    enabled = !enabled;
    
    if (enabled) {
      toggleBtn.textContent = "⏸️ Stop Navigation";
      if (!startNavigation()) {
        enabled = false;
        toggleBtn.textContent = "▶️ Start Navigation";
      }
    } else {
      toggleBtn.textContent = "▶️ Start Navigation";
      stopNavigation();
    }
  });

  // cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopNavigation();
  });

  // i added keyboard shortcut for quick toggle (Ctrl+Shift+N)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      toggleBtn.click();
    }
  });
})();