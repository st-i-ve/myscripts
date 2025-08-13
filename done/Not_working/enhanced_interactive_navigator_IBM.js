// ==UserScript==
// @name         Enhanced Interactive Section Navigator with Auto-Click
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Navigate through noOutline sections, auto-click continue/next buttons, and process knowledge blocks twice
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
  let isProcessingKnowledge = false;
  let knowledgeProcessCount = 0;

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "▶️ Start Enhanced Navigation";
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
  statusDisplay.textContent = "Ready to navigate with auto-click";
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
    maxWidth: "300px",
    textAlign: "center",
  });
  document.body.appendChild(statusDisplay);

  // Check if element is visible in the iframe's viewport
  function isInViewport(el, iframeWindow) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (iframeWindow.innerHeight ||
          iframeWindow.document.documentElement.clientHeight) &&
      rect.right <=
        (iframeWindow.innerWidth ||
          iframeWindow.document.documentElement.clientWidth)
    );
  }

  // function to click continue button if present
  function clickContinueButton() {
    if (!currentIframe) return false;
    
    try {
      const iframeWin = currentIframe.contentWindow;
      const iframeDoc = iframeWin.document;
      
      const continueBtn = iframeDoc.querySelector("button.continue-btn.brand--ui");
      
      if (continueBtn && isInViewport(continueBtn, iframeWin)) {
        console.log("✅ Continue button found and clicked");
        continueBtn.click();
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Cannot access iframe for continue button");
    }
    return false;
  }

  // function to click next button if present
  function clickNextButton() {
    if (!currentIframe) return false;
    
    try {
      const iframeDoc = currentIframe.contentDocument;
      
      // i look for various next button selectors
      const nextSelectors = [
        'button[class*="next"]',
        'button:contains("Next")',
        'button:contains("NEXT")',
        'button:contains("next")',
        '.next-btn',
        '[data-action*="next"]'
      ];
      
      for (const selector of nextSelectors) {
        let nextBtn;
        if (selector.includes(':contains')) {
          // i handle text-based selectors manually
          const buttons = iframeDoc.querySelectorAll('button');
          nextBtn = Array.from(buttons).find(btn => 
            btn.textContent.toLowerCase().includes('next')
          );
        } else {
          nextBtn = iframeDoc.querySelector(selector);
        }
        
        if (nextBtn && isInViewport(nextBtn, currentIframe.contentWindow)) {
          console.log("✅ Next button found and clicked");
          nextBtn.click();
          return true;
        }
      }
    } catch (err) {
      console.warn("⚠️ Cannot access iframe for next button");
    }
    return false;
  }

  // function to categorize noOutline elements
  function categorizeElement(element) {
    // i check for specific interactive classes
    if (element.querySelector('.blocks-tabs')) return 'tabs-open all tabs';
    if (element.querySelector('.block-flashcards')) return 'flip cards';
    if (element.querySelector('.blocks-accordion')) return 'open all accordions';
    if (element.querySelector('.block-labeled-graphic')) return 'open labels';
    if (element.querySelector('.continue-btn.brand--ui')) return 'click the continue button';
    
    // i check for block-knowledge with subcategories (will be processed twice)
    const knowledgeElement = element.querySelector('.block-knowledge');
    if (knowledgeElement) {
      const ariaLabel = knowledgeElement.getAttribute('aria-label');
      if (ariaLabel) {
        if (ariaLabel.includes('Multiple choice')) return 'knowledge -answer with radio (2x)';
        if (ariaLabel.includes('Multiple response')) return 'knowledge -answer with checkbox (2x)';
      }
      return 'knowledge -general (2x)';
    }
    
    return 'general';
  }

  // function to check if element contains knowledge block
  function isKnowledgeElement(element) {
    return element.querySelector('.block-knowledge') !== null;
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
    
    // i calculate scroll position to center the element
    const scrollTop = container.scrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
    
    container.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    });
  }

  // function to update status display
  function updateStatus(category, index, total, extraInfo = '') {
    const baseStatus = `${index + 1}/${total}: ${category}`;
    statusDisplay.textContent = extraInfo ? `${baseStatus} ${extraInfo}` : baseStatus;
  }

  // function to process current element
  function processCurrentElement() {
    if (!enabled || currentIndex >= noOutlineElements.length) {
      stopNavigation();
      return;
    }

    const element = noOutlineElements[currentIndex];
    const category = categorizeElement(element);
    const isKnowledge = isKnowledgeElement(element);
    
    // i highlight current element
    highlightElement(element);
    
    // i scroll to element
    const pageWrap = currentIframe.contentDocument.querySelector("div.page-wrap#page-wrap");
    if (pageWrap) {
      scrollToElement(element, pageWrap);
    }
    
    // i handle knowledge elements (process twice)
    if (isKnowledge && !isProcessingKnowledge) {
      isProcessingKnowledge = true;
      knowledgeProcessCount = 1;
      updateStatus(category, currentIndex, noOutlineElements.length, `(Pass ${knowledgeProcessCount}/2)`);
    } else if (isKnowledge && isProcessingKnowledge && knowledgeProcessCount < 2) {
      knowledgeProcessCount++;
      updateStatus(category, currentIndex, noOutlineElements.length, `(Pass ${knowledgeProcessCount}/2)`);
    } else {
      // i reset knowledge processing flags
      isProcessingKnowledge = false;
      knowledgeProcessCount = 0;
      updateStatus(category, currentIndex, noOutlineElements.length);
    }
    
    // i wait a bit then check for buttons
    setTimeout(() => {
      let buttonClicked = false;
      
      // i try to click continue button first
      if (clickContinueButton()) {
        buttonClicked = true;
        updateStatus(category, currentIndex, noOutlineElements.length, '✅ Continue clicked');
      }
      
      // i try to click next button if no continue button was found
      if (!buttonClicked && clickNextButton()) {
        buttonClicked = true;
        updateStatus(category, currentIndex, noOutlineElements.length, '✅ Next clicked');
      }
      
      // i schedule next processing
      const delay = isKnowledge ? 2000 : 1500; // i give more time for knowledge elements
      
      processingTimeout = setTimeout(() => {
        // i check if we need to process knowledge element again
        if (isKnowledge && knowledgeProcessCount < 2) {
          processCurrentElement(); // i process same element again
        } else {
          // i move to next element
          isProcessingKnowledge = false;
          knowledgeProcessCount = 0;
          currentIndex++;
          processCurrentElement();
        }
      }, delay);
      
    }, 500); // i wait 500ms before checking for buttons
  }

  // function to start navigation
  function startNavigation() {
    // i find iframe and noOutline elements
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
            isProcessingKnowledge = false;
            knowledgeProcessCount = 0;
            toggleBtn.textContent = "⏸️ Stop Enhanced Navigation";
            statusDisplay.textContent = "Starting enhanced navigation...";
            processCurrentElement();
            return;
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    // i show error if no suitable iframe was found
    statusDisplay.textContent = "No suitable content found";
  }

  // function to stop navigation
  function stopNavigation() {
    enabled = false;
    currentIndex = 0;
    isProcessingKnowledge = false;
    knowledgeProcessCount = 0;
    
    // i clear timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      processingTimeout = null;
    }
    
    // i remove highlighting
    if (currentHighlighted) {
      unhighlightElement(currentHighlighted);
      currentHighlighted = null;
    }
    
    // i reset UI
    toggleBtn.textContent = "▶️ Start Enhanced Navigation";
    statusDisplay.textContent = "Enhanced navigation stopped";
    
    // i reset after 2 seconds
    setTimeout(() => {
      if (!enabled) {
        statusDisplay.textContent = "Ready to navigate with auto-click";
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

  // i cleanup when page unloads
  window.addEventListener('beforeunload', () => {
    stopNavigation();
  });
})();