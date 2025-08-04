// ==UserScript==
// @name         Sequential Section Navigator V8 - SkillsLine Only with Sorting Support
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  Navigate through noOutline sections on skillsline.com with manual sorting support
// @match        *://skillsline.com/*
// @match        *://*.skillsline.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // i check if we're on skillsline.com domain
  if (!window.location.hostname.includes('skillsline.com')) {
    console.log("🚫 Script only works on skillsline.com");
    return;
  }

  let enabled = false;
  let currentIndex = 0;
  let noOutlineElements = [];
  let currentHighlightedElement = null;
  let navigationTimeout = null;
  let currentIframe = null;
  let mutationObserver = null;
  let seenBlockIds = new Set();
  let executedBlocks = new Set();
  let isWaitingForNewContent = false;
  let isWaitingForNextButton = false;
  let waitingTimeout = null;
  let nextButtonTimeout = null;
  let recentlyContinueClicked = false;

  // i add sorting activity styles from SortpileIndicator_IBM.js
  GM_addStyle(`
    .hint-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      top: 6px;
      z-index: 10;
    }
    .dot-left { left: 6px; background-color: #00cc00; }   /* Green */
    .dot-center { left: 50%; transform: translateX(-50%); background-color: #ffcc00; } /* Yellow */
    .dot-right { right: 6px; background-color: #3399ff; } /* Blue */

    /* Force stacking layout for card piles */
    .sorting {
      display: block !important;
    }
    .playing-card {
      position: relative !important;
    }
  `);

  // sorting configuration from SortpileIndicator_IBM.js
  const sortingConfig = {
    // Environmental Initiative (LEFT - Green)
    "A fishing fleet wants to develop nets that will capture and kill fewer dolphins": "left",
    "A company switches its delivery fleet to electric vehicles": "left",
    "A farm reduces chemical pesticide use": "left",

    // Governance Standard (RIGHT - Blue)
    "An online retailer wants to keep fraudulent merchandise off its website": "right",
    "A business adopts transparent auditing procedures": "right",
    "A company enforces anti-bribery compliance": "right",

    // Social Relationship (CENTER - Yellow)
    "A restaurant chain wants to provide surplus food supplies to homeless shelters": "center",
    "A tech company promotes inclusivity in its hiring": "center",
    "Employees start a volunteer mentoring group": "center",

    // Mindset examples
    "I'll never get this right": "left",
    "I'm a failure": "left",
    "I don't deserve success": "left",
    "I always get this wrong": "left",
    "I'll never be able to do this": "left",
    "I'm not good enough": "left",
    "I'm always wrong": "left",
    "I don't deserve something": "left",

    "I find this hard": "right",
    "I am frequently getting this wrong": "right",
    "I'm struggling": "right",
    "This is taking me a long time to do": "right",

    // Listening skills
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Leaning away": "right",

    // Environmental Initiative (LEFT)
    "Traffic congestion": "left",
    "Pollution": "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Hunting license": "left",
    "Insect crop damage": "left",

    // Social Relationship (CENTER)
    "Skills training": "center",
    "Child adoption": "center",
    "Education": "center",
    "Substance abuse": "center",

    // Governance Standard (RIGHT)
    "Antibiotic approval": "right",
    "Poison control": "right",
  };

  // create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "▶️ Start Execution";
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
  categoryDisplay.textContent = "Ready to execute (SkillsLine Only)";
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
    // check for sorting activity
    if (element.querySelector('.block-sorting-activity')) {
      return "sorting activity - manual sorting";
    }
    
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

  // function to check if block type is interactive
  function isInteractiveBlock(category) {
    const interactiveTypes = [
      "sorting activity - manual sorting",
      "flashcards - flip cards",
      "accordion - open all accordions", 
      "labeled graphic - open labels",
      "continue button - click",
      "knowledge - answer with radio",
      "knowledge - answer with checkbox",
      "knowledge - general"
    ];
    return interactiveTypes.includes(category);
  }

  // function to check if block type is knowledge-related
  function isKnowledgeBlock(category) {
    return category.startsWith("knowledge -");
  }

  // function to check if block type requires manual completion
  function isManualBlock(category) {
    return category === "sorting activity - manual sorting";
  }

  // execution function for sorting activities
  function executeSortingActivity(element, iframeDoc) {
    console.log("🎯 Executing sorting activity logic - applying hint dots");
    
    const sortingActivities = element.querySelectorAll(".sorting, .block-sorting-activity");
    let processed = 0;
    
    sortingActivities.forEach((activity) => {
      const cards = activity.querySelectorAll(".playing-card");

      // i force card stack order: top card appears on top
      cards.forEach((card, index) => {
        card.style.position = "relative";
        card.style.zIndex = cards.length - index; // highest z-index on top card
      });

      cards.forEach((card) => {
        const titleEl = card.querySelector(".playing-card__title .fr-view");
        if (!titleEl) return;

        const cardText = titleEl.textContent.trim();
        const direction = sortingConfig[cardText];
        if (!direction || card.querySelector(".hint-dot")) return;

        const dot = document.createElement("div");
        dot.classList.add("hint-dot");
        if (direction === "left") dot.classList.add("dot-left");
        else if (direction === "right") dot.classList.add("dot-right");
        else if (direction === "center") dot.classList.add("dot-center");

        card.appendChild(dot);
        console.log(`🎯 Added ${direction} hint dot to: ${cardText}`);
      });

      processed++;
    });

    console.log(`✅ Applied hint dots to ${processed} sorting activities`);
    return processed > 0;
  }

  // execution function for flashcards
  function executeFlashcards(element, iframeDoc) {
    console.log("🃏 Executing flashcards logic");
    
    // unhide all slides
    const allSlides = element.querySelectorAll(".carousel-slide");
    allSlides.forEach((slide) => {
      slide.removeAttribute("hidden");
      slide.removeAttribute("inert");
    });

    // flip visible flashcards
    const flipButtons = element.querySelectorAll(".flashcard-side-flip__btn");
    let flipped = 0;
    flipButtons.forEach((btn) => {
      if (btn.offsetParent !== null) {
        btn.click();
        flipped++;
      }
    });

    console.log(`✅ Flipped ${flipped} flashcards`);
    return flipped > 0;
  }

  // execution function for accordions
  function executeAccordion(element, iframeDoc) {
    console.log("📂 Executing accordion logic");
    
    // expand accordions
    const accordions = element.querySelectorAll(".blocks-accordion__header");
    let expanded = 0;
    accordions.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "false") {
        console.log("📂 Expanding accordion:", btn);
        btn.click();
        expanded++;
      }
    });

    console.log(`✅ Expanded ${expanded} accordions`);
    return expanded > 0;
  }

  // execution function for labeled graphics
  function executeLabeledGraphic(element, iframeDoc) {
    console.log("🔘 Executing labeled graphic logic");
    
    const markers = element.querySelectorAll(
      "button.labeled-graphic-marker:not(.labeled-graphic-marker--complete):not(.labeled-graphic-marker--active)"
    );
    let clicked = 0;
    markers.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "false") {
        console.log("🔘 Clicking marker:", btn);
        btn.click();
        clicked++;
      }
    });

    console.log(`✅ Clicked ${clicked} markers`);
    return clicked > 0;
  }

  // execution function for continue button
  function executeContinueButton(element, iframeDoc, iframeWin) {
    console.log("⏭️ Executing continue button logic");
    
    const continueBtn = element.querySelector("button.continue-btn.brand--ui");
    if (continueBtn && isInViewport(continueBtn, iframeWin)) {
      console.log("✅ Clicking continue button");
      continueBtn.click();
      return true;
    }
    return false;
  }

  // execution function for knowledge blocks (quiz logic)
  function executeKnowledge(element, iframeDoc, iframeWin, executionNumber = 1) {
    console.log(`🧠 Executing knowledge block logic (${executionNumber}${executionNumber === 1 ? 'st' : 'nd'} time)`);
    
    const wrappers = element.querySelectorAll(".block-knowledge__wrapper");
    let processed = 0;
    
    wrappers.forEach((wrapper) => {
      const quizCard = wrapper.querySelector(".quiz-card__main");
      if (!quizCard) return;

      // radio button logic
      const alreadySelected = quizCard.querySelector(
        '[role="radio"][aria-checked="true"]'
      );
      if (!alreadySelected) {
        const options = quizCard.querySelectorAll(
          '[role="radio"][aria-checked="false"]'
        );
        if (options.length > 0) {
          const randomIndex = Math.floor(Math.random() * options.length);
          const chosen = options[randomIndex];
          chosen.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          console.log(`🔘 Selected radio option (execution ${executionNumber})`);
        }
      }

      // checkbox logic
      const checkboxOptions = quizCard.querySelectorAll(
        '[role="checkbox"][aria-checked="false"]'
      );
      if (checkboxOptions.length > 0) {
        const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
        const pickCount = Math.min(2, shuffled.length);
        const picked = shuffled.slice(0, pickCount);
        picked.forEach((checkbox) => {
          checkbox.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
        });
        console.log(`☑️ Selected ${picked.length} checkbox options (execution ${executionNumber})`);
      }

      // submit button with delay
      setTimeout(() => {
        const submitBtn = wrapper.querySelector(
          "button.quiz-card__button:not(.quiz-card__button--disabled)"
        );
        if (submitBtn) {
          console.log(`📤 Clicking submit button (execution ${executionNumber})`);
          submitBtn.click();
        }
      }, 300);

      processed++;
    });

    console.log(`✅ Processed ${processed} knowledge blocks (execution ${executionNumber})`);
    return processed > 0;
  }

  // function to scroll element into view and wait
  function scrollIntoViewAndWait(element) {
    return new Promise((resolve) => {
      // i scroll the element into view smoothly
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // i wait a bit for the scroll to complete
      setTimeout(resolve, 300);
    });
  }

  // function to wait for next button after manual activities
  function waitForNextButton(element, category) {
    return new Promise((resolve) => {
      console.log("⏳ Waiting for next button to appear after manual activity");
      isWaitingForNextButton = true;
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length, false, "MANUAL SORTING REQUIRED - Waiting for next button");
      
      const checkForNextButton = () => {
        if (!isWaitingForNextButton || !currentIframe) {
          resolve(false);
          return;
        }
        
        try {
          const iframeDoc = currentIframe.contentDocument;
          
          // i look for various next button patterns
          const nextButtonSelectors = [
            'button[data-testid="arrow-next"]',
            'button.next-btn',
            'button[aria-label*="next"]',
            'button[aria-label*="Next"]',
            'button.continue-btn',
            'button[class*="next"]'
          ];
          
          let nextButton = null;
          for (const selector of nextButtonSelectors) {
            nextButton = iframeDoc.querySelector(selector);
            if (nextButton && nextButton.offsetParent !== null) {
              break;
            }
          }
          
          if (nextButton) {
            console.log("✅ Next button found, user completed manual sorting");
            isWaitingForNextButton = false;
            if (nextButtonTimeout) {
              clearTimeout(nextButtonTimeout);
              nextButtonTimeout = null;
            }
            resolve(true);
          } else {
            // i keep checking every 500ms
            nextButtonTimeout = setTimeout(checkForNextButton, 500);
          }
        } catch (err) {
          console.warn("❌ Error checking for next button:", err);
          nextButtonTimeout = setTimeout(checkForNextButton, 500);
        }
      };
      
      // i start checking immediately
      checkForNextButton();
      
      // i set a maximum wait time of 60 seconds
      setTimeout(() => {
        if (isWaitingForNextButton) {
          console.log("⏰ Timeout waiting for next button, proceeding anyway");
          isWaitingForNextButton = false;
          if (nextButtonTimeout) {
            clearTimeout(nextButtonTimeout);
            nextButtonTimeout = null;
          }
          resolve(false);
        }
      }, 60000);
    });
  }

  // function to execute block function based on type
  async function executeBlockFunction(element, category) {
    if (!element || !currentIframe) return false;
    
    const blockId = element.getAttribute('data-block-id');
    if (executedBlocks.has(blockId)) {
      console.log(`⏭️ Block ${blockId} already executed, skipping`);
      return false;
    }

    try {
      const iframeDoc = currentIframe.contentDocument;
      const iframeWin = currentIframe.contentWindow;
      
      // i scroll interactive elements into view first and wait
      if (isInteractiveBlock(category)) {
        await scrollIntoViewAndWait(element);
      }
      
      let executed = false;

      // execute based on category
      switch (category) {
        case "sorting activity - manual sorting":
          executed = executeSortingActivity(element, iframeDoc);
          if (executed) {
            // i wait for user to complete manual sorting
            await waitForNextButton(element, category);
          }
          break;
        case "flashcards - flip cards":
          executed = executeFlashcards(element, iframeDoc);
          break;
        case "accordion - open all accordions":
          executed = executeAccordion(element, iframeDoc);
          break;
        case "labeled graphic - open labels":
          executed = executeLabeledGraphic(element, iframeDoc);
          break;
        case "continue button - click":
          executed = executeContinueButton(element, iframeDoc, iframeWin);
          break;
        case "knowledge - answer with radio":
        case "knowledge - answer with checkbox":
        case "knowledge - general":
          // i execute knowledge blocks twice for better reliability
          console.log("🧠 Starting double execution for knowledge block");
          
          // first execution
          updateCategoryDisplay(category, currentIndex, noOutlineElements.length, false, "1st execution...");
          const firstExecution = executeKnowledge(element, iframeDoc, iframeWin, 1);
          
          // wait between executions
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // second execution
          updateCategoryDisplay(category, currentIndex, noOutlineElements.length, false, "2nd execution...");
          const secondExecution = executeKnowledge(element, iframeDoc, iframeWin, 2);
          
          // wait after second execution
          await new Promise(resolve => setTimeout(resolve, 500));
          
          executed = firstExecution || secondExecution;
          console.log("✅ Double execution completed for knowledge block");
          break;
        default:
          console.log(`ℹ️ No execution logic for category: ${category}`);
          executed = true; // mark as executed to avoid re-processing
      }

      if (executed) {
        executedBlocks.add(blockId);
        console.log(`✅ Executed block ${blockId}: ${category}`);
      }

      return executed;
    } catch (err) {
      console.warn("❌ Error executing block function:", err);
      return false;
    }
  }

  // function to update category display
  function updateCategoryDisplay(category, index, total, executed = false, customStatus = "") {
    let status = "";
    if (customStatus) {
      status = ` - ${customStatus}`;
    } else if (executed) {
      if (isKnowledgeBlock(category)) {
        status = " - EXECUTED! (2x)";
      } else if (isManualBlock(category)) {
        status = " - HINTS APPLIED!";
      } else {
        status = " - EXECUTED!";
      }
    }
    categoryDisplay.textContent = `${index + 1}/${total}: ${category}${status}`;
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
        console.log("🔄 New content found, resuming execution");
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

  // function to check latest noOutline element for continue button and execute it
  async function checkLatestForContinueButton() {
    if (noOutlineElements.length === 0 || !currentIframe) {
      return false;
    }

    // get the latest (last) noOutline element
    const latestElement = noOutlineElements[noOutlineElements.length - 1];
    
    // i scroll the latest element into view first
    await scrollIntoViewAndWait(latestElement);
    
    const continueBtn = latestElement.querySelector("button.continue-btn.brand--ui");
    
    if (continueBtn) {
      console.log("🔄 Fallback: Found continue button in latest noOutline element");
      
      try {
        const iframeWin = currentIframe.contentWindow;
        
        // scroll the button into view first
        await scrollIntoViewAndWait(continueBtn);
        
        // check if button is in viewport and click it
        if (isInViewport(continueBtn, iframeWin)) {
          console.log("✅ Fallback: Clicking continue button");
          continueBtn.click();
          
          // mark this element as having executed continue button
          const blockId = latestElement.getAttribute('data-block-id');
          if (blockId) {
            executedBlocks.add(blockId + '_continue_fallback');
          }
          
          // set the recently clicked flag
          recentlyContinueClicked = true;
          setTimeout(() => {
            recentlyContinueClicked = false;
          }, 2000);
          
          return true;
        }
      } catch (err) {
        console.warn("❌ Error in continue button fallback:", err);
      }
    }
    
    return false;
  }

  // function to wait for new content with continue button fallback
  async function waitForNewContent() {
    isWaitingForNewContent = true;
    categoryDisplay.textContent = "Focusing last element and checking for continue button...";
    
    // i first focus the last noOutline element
    if (noOutlineElements.length > 0) {
      const lastElement = noOutlineElements[noOutlineElements.length - 1];
      await scrollIntoViewAndWait(lastElement);
      console.log("🎯 Focused last noOutline element");
    }
    
    // then check if the latest noOutline element has a continue button
    const continueButtonExecuted = await checkLatestForContinueButton();
    
    if (continueButtonExecuted) {
      // if we executed a continue button, wait 2 seconds then check for new content
      categoryDisplay.textContent = "Continue button clicked, waiting for new content...";
      
      waitingTimeout = setTimeout(() => {
        if (isWaitingForNewContent) {
          // check again if new content appeared after continue button click
          if (currentIndex < noOutlineElements.length) {
            // new content appeared, resume navigation
            console.log("🔄 New content found after continue button, resuming");
            isWaitingForNewContent = false;
            setTimeout(navigateToNextSection, 500);
          } else {
            // still no new content, start the main countdown
            startMainCountdown();
          }
        }
      }, 2000);
    } else {
      // no continue button found, start the main countdown immediately
      startMainCountdown();
    }
  }

  // function to start the main countdown for new content
  function startMainCountdown() {
    categoryDisplay.textContent = "Waiting for new content...";
    
    // wait up to 8 seconds for new content
    waitingTimeout = setTimeout(() => {
      if (isWaitingForNewContent) {
        // no new content found, stop navigation
        console.log("⏹️ No new content found, stopping execution");
        enabled = false;
        toggleBtn.textContent = "▶️ Start Execution";
        categoryDisplay.textContent = "Execution complete!";
        isWaitingForNewContent = false;
        currentIndex = 0;
      }
    }, 8000);
  }

  // function to navigate to next section
  async function navigateToNextSection() {
    if (!enabled) return;
    
    // if we're at the end of current elements, wait for new content
    if (currentIndex >= noOutlineElements.length) {
      if (!isWaitingForNewContent) {
        await waitForNewContent();
      }
      return;
    }
    
    const currentElement = noOutlineElements[currentIndex];
    if (currentElement) {
      const category = identifyBlockType(currentElement);
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length);
      
      // execute the block function (with special handling for manual activities)
      const executed = await executeBlockFunction(currentElement, category);
      
      // update display with execution status
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length, executed);
      
      // check if this is a continue button section and set flag
      if (category === "continue button - click" && executed) {
        recentlyContinueClicked = true;
        
        // reset the flag after a delay
        setTimeout(() => {
          recentlyContinueClicked = false;
        }, 2000);
      }
      
      currentIndex++;
      
      // i determine the delay based on element type and recent actions
      let delay;
      if (recentlyContinueClicked) {
        delay = 1000; // 1 second after continue click
      } else if (isKnowledgeBlock(category)) {
        delay = 1500; // 1.5 seconds for knowledge blocks (they take longer due to double execution)
      } else if (isManualBlock(category)) {
        delay = 500; // 500ms for manual activities (user already waited)
      } else if (isInteractiveBlock(category)) {
        delay = 1000; // 1 second for other interactive elements
      } else {
        delay = 100; // 100ms for general elements
      }
      
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
    executedBlocks.clear();
    noOutlineElements = [];
    currentIndex = 0;
    isWaitingForNewContent = false;
    isWaitingForNextButton = false;
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
    if (nextButtonTimeout) {
      clearTimeout(nextButtonTimeout);
      nextButtonTimeout = null;
    }
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    currentIndex = 0;
    noOutlineElements = [];
    seenBlockIds.clear();
    executedBlocks.clear();
    isWaitingForNewContent = false;
    isWaitingForNextButton = false;
    recentlyContinueClicked = false;
    categoryDisplay.textContent = "Execution stopped";
  }

  // toggle button event listener
  toggleBtn.addEventListener("click", () => {
    enabled = !enabled;
    
    if (enabled) {
      toggleBtn.textContent = "⏸️ Stop Execution";
      if (!startNavigation()) {
        enabled = false;
        toggleBtn.textContent = "▶️ Start Execution";
      }
    } else {
      toggleBtn.textContent = "▶️ Start Execution";
      stopNavigation();
    }
  });

  // cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopNavigation();
  });

  // i added keyboard shortcut for quick toggle (Ctrl+Shift+E for Execute)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  console.log("✅ Sequential Section Navigator V8 loaded for SkillsLine.com");
})();