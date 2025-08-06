// ==UserScript==
// @name         Sequential Section Navigator V3 with Dynamic Content Detection
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Navigate through noOutline sections with dynamic content loading detection after continue clicks
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
  let mutationObserver = null;
  let seenBlockIds = new Set();
  let isWaitingForNewContent = false;
  let waitingTimeout = null;
  let recentlyContinueClicked = false;

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

  // function to check if element is visible in the iframe's viewport
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
    const elements = Array.from(iframeDoc.querySelectorAll('.noOutline[data-block-id]'));
    const newElements = [];
    
    elements.forEach(element => {
      const blockId = element.getAttribute('data-block-id');
      if (blockId && !seenBlockIds.has(blockId)) {
        seenBlockIds.add(blockId);
        newElements.push(element);
      }
    });
    
    return newElements;
  }

  // function to setup mutation observer for dynamic content
  function setupMutationObserver(iframeDoc) {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
    
    mutationObserver = new MutationObserver((mutations) => {
      let foundNewElements = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // check if the added node is a noOutline element
              if (node.classList && node.classList.contains('noOutline')) {
                const blockId = node.getAttribute('data-block-id');
                if (blockId && !seenBlockIds.has(blockId)) {
                  seenBlockIds.add(blockId);
                  noOutlineElements.push(node);
                  foundNewElements = true;
                  console.log("✅ New noOutline element detected:", blockId);
                }
              }
              // also check for noOutline elements within the added node
              const nestedElements = node.querySelectorAll && node.querySelectorAll('.noOutline[data-block-id]');
              if (nestedElements) {
                nestedElements.forEach(element => {
                  const blockId = element.getAttribute('data-block-id');
                  if (blockId && !seenBlockIds.has(blockId)) {
                    seenBlockIds.add(blockId);
                    noOutlineElements.push(element);
                    foundNewElements = true;
                    console.log("✅ New nested noOutline element detected:", blockId);
                  }
                });
              }
            }
          });
        }
      });
      
      // if we found new elements and we're waiting, resume navigation
      if (foundNewElements && isWaitingForNewContent) {
        console.log("🔄 New content found, resuming navigation");
        isWaitingForNewContent = false;
        if (waitingTimeout) {
          clearTimeout(waitingTimeout);
          waitingTimeout = null;
        }
        // resume navigation after a brief delay
        setTimeout(navigateToNextSection, 500);
      }
    });

    // observe the entire document for changes
    mutationObserver.observe(iframeDoc.body, {
      childList: true,
      subtree: true
    });
  }

  // function to wait for new content
  function waitForNewContent() {
    isWaitingForNewContent = true;
    categoryDisplay.textContent = "Waiting for new content...";
    
    // wait up to 8 seconds for new content
    waitingTimeout = setTimeout(() => {
      if (isWaitingForNewContent) {
        // no new content found, stop navigation
        console.log("⏹️ No new content found, stopping navigation");
        enabled = false;
        toggleBtn.textContent = "▶️ Start Navigation";
        categoryDisplay.textContent = "Navigation complete!";
        removeHighlight();
        isWaitingForNewContent = false;
        currentIndex = 0;
      }
    }, 8000);
  }

  // function to navigate to next section
  function navigateToNextSection() {
    if (!enabled) return;
    
    // if we're at the end of current elements, wait for new content
    if (currentIndex >= noOutlineElements.length) {
      if (!isWaitingForNewContent) {
        waitForNewContent();
      }
      return;
    }
    
    const currentElement = noOutlineElements[currentIndex];
    if (currentElement) {
      const category = identifyBlockType(currentElement);
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length);
      highlightElement(currentElement);
      
      // check if this is a continue button section and click it
      if (category === "continue button - click" && currentIframe) {
        try {
          const iframeDoc = currentIframe.contentDocument;
          const iframeWin = currentIframe.contentWindow;
          
          // i try to click the continue button within this section
          const continueBtn = currentElement.querySelector("button.continue-btn.brand--ui");
          if (continueBtn && isInViewport(continueBtn, iframeWin)) {
            console.log("✅ Clicking continue button in current section");
            continueBtn.click();
            categoryDisplay.textContent = `${currentIndex + 1}/${noOutlineElements.length}: ${category} - CLICKED!`;
            recentlyContinueClicked = true;
            
            // reset the flag after a delay
            setTimeout(() => {
              recentlyContinueClicked = false;
            }, 5000);
          }
        } catch (err) {
          console.warn("Could not click continue button:", err);
        }
      }
      
      currentIndex++;
      
      // schedule next navigation - longer delay if we just clicked continue
      const delay = recentlyContinueClicked ? 3000 : 1000;
      navigationTimeout = setTimeout(navigateToNextSection, delay);
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
    
    // reset tracking variables
    seenBlockIds.clear();
    noOutlineElements = [];
    currentIndex = 0;
    isWaitingForNewContent = false;
    recentlyContinueClicked = false;
    
    // collect initial noOutline elements
    const initialElements = collectNoOutlineElements(targetIframe.contentDocument);
    noOutlineElements.push(...initialElements);
    
    if (noOutlineElements.length === 0) {
      categoryDisplay.textContent = "No sections found!";
      return false;
    }
    
    // setup mutation observer for dynamic content
    setupMutationObserver(targetIframe.contentDocument);
    
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
    if (waitingTimeout) {
      clearTimeout(waitingTimeout);
      waitingTimeout = null;
    }
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    removeHighlight();
    currentIndex = 0;
    noOutlineElements = [];
    seenBlockIds.clear();
    isWaitingForNewContent = false;
    recentlyContinueClicked = false;
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