// ==UserScript==
// @name         Sequential Section Navigator V9.4 - SkillsLine Only with Enhanced Process and Scenario Support
// @namespace    http://tampermonkey.net/
// @version      9.4
// @description  Navigate through noOutline sections on skillsline.com with enhanced process, scenario and sorting support
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
  let scenarioClickingInterval = null;
  let processClickingInterval = null;

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
    
    // check for process block - enhanced with next wait
    if (element.querySelector('.block-process')) {
      return "process - auto click with next wait";
    }
    
    // check for scenario block - enhanced with next wait
    if (element.querySelector('.block-scenario')) {
      return "scenario - auto continue with next wait";
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
      "process - auto click with next wait",
      "scenario - auto continue with next wait",
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

  // function to check if block type requires manual completion or next button wait
  function isManualBlock(category) {
    return category === "sorting activity - manual sorting" || 
           category === "process - auto click with next wait" ||
           category === "scenario - auto continue with next wait";
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
      
      let displayMessage = "MANUAL SORTING REQUIRED - Waiting for next button";
      if (category === "process - auto click with next wait") {
        displayMessage = "PROCESS COMPLETE - Waiting for next button";
      } else if (category === "scenario - auto continue with next wait") {
        displayMessage = "SCENARIO COMPLETE - Waiting for next button";
      }
      
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length, false, displayMessage);
      
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
            console.log("✅ Next button found, activity completed");
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

  // enhanced execution function for process blocks with continuous clicking
  function executeProcess(element, iframeDoc, iframeWin) {
    return new Promise((resolve) => {
      console.log("⚙️ Executing enhanced process logic - continuous clicking until next button appears");
      
      const PROCESS_SELECTORS = [
        "button.process-arrow.process-arrow--right.process-arrow--scrolling",
        "button[data-testid='arrow-next']",
        "button[data-arrow='next']",
        "button[aria-label='Next']",
        "button.process-arrow--right",
        "button.process-arrow",
        ".process-arrow.process-arrow--right",
        ".process-arrow--right"
      ];
      
      // selectors for next button (completion signal)
      const NEXT_BUTTON_SELECTORS = [
        'button[data-testid="arrow-next"]',
        'button.next-btn',
        'button[aria-label*="next"]',
        'button[aria-label*="Next"]',
        'button.continue-btn',
        'button[class*="next"]'
      ];
      
      let clickCount = 0;
      const maxClicks = 300; // safety limit (60 seconds at 200ms intervals)
      
      updateCategoryDisplay("process - auto click with next wait", currentIndex, noOutlineElements.length, false, "Auto-clicking process arrows...");
      
      const clickProcess = () => {
        if (clickCount >= maxClicks) {
          console.log("⏰ Process clicking timeout reached");
          if (processClickingInterval) {
            clearInterval(processClickingInterval);
            processClickingInterval = null;
          }
          resolve(true);
          return;
        }
        
        // i check if next button appeared
        let nextButtonFound = false;
        for (const selector of NEXT_BUTTON_SELECTORS) {
          const nextButton = iframeDoc.querySelector(selector);
          if (nextButton && nextButton.offsetParent !== null) {
            console.log("✅ Next button found, stopping process clicks");
            nextButtonFound = true;
            break;
          }
        }
        
        if (nextButtonFound) {
          if (processClickingInterval) {
            clearInterval(processClickingInterval);
            processClickingInterval = null;
          }
          resolve(true);
          return;
        }
        
        // i look for process arrow buttons to click
        let buttonClicked = false;
        for (const selector of PROCESS_SELECTORS) {
          const processButton = element.querySelector(selector);
          if (processButton && processButton.offsetParent !== null && isInViewport(processButton, iframeWin)) {
            console.log(`⚙️ Clicking process arrow: ${selector} (click ${clickCount + 1})`);
            processButton.click();
            buttonClicked = true;
            clickCount++;
            break;
          }
        }
        
        if (!buttonClicked) {
          console.log("⚠️ No process arrow button found to click");
        }
      };
      
      // i start clicking immediately and then every 200ms
      clickProcess();
      processClickingInterval = setInterval(clickProcess, 200);
      
      // i set a maximum timeout of 60 seconds
      setTimeout(() => {
        if (processClickingInterval) {
          console.log("⏰ Process execution timeout, stopping");
          clearInterval(processClickingInterval);
          processClickingInterval = null;
          resolve(true);
        }
      }, 60000);
    });
  }

  // enhanced execution function for scenario blocks with continuous clicking
  function executeScenario(element, iframeDoc, iframeWin) {
    return new Promise((resolve) => {
      console.log("🎬 Executing enhanced scenario logic - continuous clicking until next button appears");
      
      const SCENARIO_SELECTORS = [
        "button.scenario-block__text__continue",
        "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
      ];
      
      // selectors for next button (completion signal)
      const NEXT_BUTTON_SELECTORS = [
        'button[data-testid="arrow-next"]',
        'button.next-btn',
        'button[aria-label*="next"]',
        'button[aria-label*="Next"]',
        'button.continue-btn',
        'button[class*="next"]'
      ];
      
      let clickCount = 0;
      const maxClicks = 300; // safety limit (60 seconds at 200ms intervals)
      
      updateCategoryDisplay("scenario - auto continue with next wait", currentIndex, noOutlineElements.length, false, "Auto-clicking continue buttons...");
      
      const clickScenario = () => {
        if (clickCount >= maxClicks) {
          console.log("⏰ Scenario clicking timeout reached");
          if (scenarioClickingInterval) {
            clearInterval(scenarioClickingInterval);
            scenarioClickingInterval = null;
          }
          resolve(true);
          return;
        }
        
        // i check if next button appeared
        let nextButtonFound = false;
        for (const selector of NEXT_BUTTON_SELECTORS) {
          const nextButton = iframeDoc.querySelector(selector);
          if (nextButton && nextButton.offsetParent !== null) {
            console.log("✅ Next button found, stopping scenario clicks");
            nextButtonFound = true;
            break;
          }
        }
        
        if (nextButtonFound) {
          if (scenarioClickingInterval) {
            clearInterval(scenarioClickingInterval);
            scenarioClickingInterval = null;
          }
          resolve(true);
          return;
        }
        
        // i look for scenario continue buttons to click
        let buttonClicked = false;
        for (const selector of SCENARIO_SELECTORS) {
          const continueButton = element.querySelector(selector);
          if (continueButton && continueButton.offsetParent !== null && isInViewport(continueButton, iframeWin)) {
            console.log(`🎬 Clicking scenario continue: ${selector} (click ${clickCount + 1})`);
            continueButton.click();
            buttonClicked = true;
            clickCount++;
            break;
          }
        }
        
        if (!buttonClicked) {
          console.log("⚠️ No scenario continue button found to click");
        }
      };
      
      // i start clicking immediately and then every 200ms
      clickScenario();
      scenarioClickingInterval = setInterval(clickScenario, 200);
      
      // i set a maximum timeout of 60 seconds
      setTimeout(() => {
        if (scenarioClickingInterval) {
          console.log("⏰ Scenario execution timeout, stopping");
          clearInterval(scenarioClickingInterval);
          scenarioClickingInterval = null;
          resolve(true);
        }
      }, 60000);
    });
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
        case "process - auto click with next wait":
          executed = await executeProcess(element, iframeDoc, iframeWin);
          if (executed) {
            // i wait for next button after process completion
            await waitForNextButton(element, category);
          }
          break;
        case "scenario - auto continue with next wait":
          executed = await executeScenario(element, iframeDoc, iframeWin);
          if (executed) {
            // i wait for next button after scenario completion
            await waitForNextButton(element, category);
          }
          break;
        case "flashcards - flip cards":
          executed = executeFlashcards(element, iframeDoc);
          // i check for next button after flashcards
          if (executed) {
            await waitForNextButton(element, "flashcards - flip cards");
          }
          break;
        case "accordion - open all accordions":
          executed = executeAccordion(element, iframeDoc);
          // i check for next button after accordions
          if (executed) {
            await waitForNextButton(element, "accordion - open all accordions");
          }
          break;
        case "labeled graphic - open labels":
          executed = executeLabeledGraphic(element, iframeDoc);
          // i check for next button after labeled graphics
          if (executed) {
            await waitForNextButton(element, "labeled graphic - open labels");
          }
          break;
        case "continue button - click":
          executed = executeContinueButton(element, iframeDoc, iframeWin);
          // i check for next button after continue button
          if (executed) {
            await waitForNextButton(element, "continue button - click");
          }
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
          
          // i check for next button after knowledge blocks
          if (executed) {
            await waitForNextButton(element, category);
          }
          
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
        if (category === "process - auto click with next wait") {
          status = " - PROCESS COMPLETED!";
        } else if (category === "scenario - auto continue with next wait") {
          status = " - SCENARIO COMPLETED!";
        } else {
          status = " - HINTS APPLIED!";
        }
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

  // function to highlight current element
  function highlightElement(element) {
    // remove previous highlight
    if (currentHighlightedElement) {
      currentHighlightedElement.style.outline = "";
      currentHighlightedElement.style.backgroundColor = "";
    }

    // add new highlight
    if (element) {
      element.style.outline = "3px solid #ff6b6b";
      element.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
      currentHighlightedElement = element;
    }
  }

  // function to wait for new content or continue button
  function waitForNewContent() {
    return new Promise((resolve) => {
      console.log("⏳ Waiting for new content or continue button...");
      isWaitingForNewContent = true;
      
      // i focus on the last noOutline element before waiting
      if (noOutlineElements.length > 0) {
        const lastElement = noOutlineElements[noOutlineElements.length - 1];
        lastElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        console.log("📍 Focused on last noOutline element before waiting");
      }
      
      let countdown = 8;
      updateCategoryDisplay("Waiting for new content", currentIndex, noOutlineElements.length, false, `${countdown}s remaining`);
      
      const checkForContent = () => {
        if (!isWaitingForNewContent || !currentIframe) {
          resolve(false);
          return;
        }
        
        try {
          const iframeDoc = currentIframe.contentDocument;
          
          // check for continue button first
          const continueBtn = iframeDoc.querySelector("button.continue-btn.brand--ui");
          if (continueBtn && continueBtn.offsetParent !== null && !recentlyContinueClicked) {
            console.log("✅ Continue button found, clicking it");
            continueBtn.click();
            recentlyContinueClicked = true;
            setTimeout(() => { recentlyContinueClicked = false; }, 2000);
            
            isWaitingForNewContent = false;
            if (waitingTimeout) {
              clearTimeout(waitingTimeout);
              waitingTimeout = null;
            }
            resolve(true);
            return;
          }
          
          // check for new noOutline elements
          const newElements = collectNoOutlineElements(iframeDoc);
          if (newElements.length > 0) {
            console.log(`✅ Found ${newElements.length} new noOutline elements`);
            noOutlineElements.push(...newElements);
            
            isWaitingForNewContent = false;
            if (waitingTimeout) {
              clearTimeout(waitingTimeout);
              waitingTimeout = null;
            }
            resolve(true);
            return;
          }
          
          // countdown and continue checking
          countdown--;
          if (countdown > 0) {
            updateCategoryDisplay("Waiting for new content", currentIndex, noOutlineElements.length, false, `${countdown}s remaining`);
            waitingTimeout = setTimeout(checkForContent, 1000);
          } else {
            console.log("⏰ Timeout waiting for new content");
            isWaitingForNewContent = false;
            resolve(false);
          }
        } catch (err) {
          console.warn("❌ Error checking for new content:", err);
          waitingTimeout = setTimeout(checkForContent, 1000);
        }
      };
      
      // start checking immediately
      checkForContent();
    });
  }

  // main navigation function with improved timing
  async function navigateToNextSection() {
    if (!enabled || !currentIframe) return;

    // check if we have elements to process
    if (currentIndex >= noOutlineElements.length) {
      console.log("🔍 No more elements, waiting for new content...");
      const foundNewContent = await waitForNewContent();
      
      if (!foundNewContent) {
        console.log("🏁 No new content found, navigation complete");
        updateCategoryDisplay("Navigation complete", currentIndex, noOutlineElements.length, true);
        return;
      }
    }

    // process current element
    if (currentIndex < noOutlineElements.length) {
      const currentElement = noOutlineElements[currentIndex];
      const category = identifyBlockType(currentElement);
      
      console.log(`📍 Processing element ${currentIndex + 1}/${noOutlineElements.length}: ${category}`);
      
      // highlight current element
      highlightElement(currentElement);
      
      // update display
      updateCategoryDisplay(category, currentIndex, noOutlineElements.length);
      
      // execute block function if interactive
      if (isInteractiveBlock(category)) {
        const executed = await executeBlockFunction(currentElement, category);
        updateCategoryDisplay(category, currentIndex, noOutlineElements.length, executed);
        
        // wait a bit after execution
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // move to next element
      currentIndex++;
      
      // continue navigation with reduced timing (100ms instead of 1500ms)
      navigationTimeout = setTimeout(navigateToNextSection, 100);
    }
  }

  // function to start navigation
  function startNavigation() {
    if (!currentIframe) {
      console.log("❌ No iframe found");
      return;
    }

    try {
      const iframeDoc = currentIframe.contentDocument;
      
      // collect initial elements
      const initialElements = collectNoOutlineElements(iframeDoc);
      noOutlineElements = [...initialElements];
      
      console.log(`🚀 Starting navigation with ${noOutlineElements.length} elements`);
      
      if (noOutlineElements.length === 0) {
        console.log("❌ No noOutline elements found");
        updateCategoryDisplay("No elements found", 0, 0);
        return;
      }
      
      // reset state
      currentIndex = 0;
      executedBlocks.clear();
      
      // start navigation
      navigateToNextSection();
      
    } catch (err) {
      console.warn("❌ Error accessing iframe:", err);
      updateCategoryDisplay("Error accessing iframe", 0, 0);
    }
  }

  // function to stop navigation
  function stopNavigation() {
    enabled = false;
    
    // clear timeouts and intervals
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
    if (scenarioClickingInterval) {
      clearInterval(scenarioClickingInterval);
      scenarioClickingInterval = null;
    }
    if (processClickingInterval) {
      clearInterval(processClickingInterval);
      processClickingInterval = null;
    }
    
    // reset state
    isWaitingForNewContent = false;
    isWaitingForNextButton = false;
    
    // remove highlight
    if (currentHighlightedElement) {
      currentHighlightedElement.style.outline = "";
      currentHighlightedElement.style.backgroundColor = "";
      currentHighlightedElement = null;
    }
    
    // disconnect observer
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    
    console.log("⏹️ Navigation stopped");
    updateCategoryDisplay("Stopped", currentIndex, noOutlineElements.length);
  }

  // function to find iframe
  function findIframe() {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc && iframeDoc.querySelector('.noOutline')) {
          return iframe;
        }
      } catch (err) {
        // ignore CORS errors
      }
    }
    return null;
  }

  // toggle button click handler
  toggleBtn.addEventListener("click", () => {
    if (!enabled) {
      // find iframe
      currentIframe = findIframe();
      if (!currentIframe) {
        alert("❌ No accessible iframe with noOutline elements found");
        return;
      }
      
      enabled = true;
      toggleBtn.textContent = "⏹️ Stop Execution";
      toggleBtn.style.backgroundColor = "#dc3545";
      
      startNavigation();
    } else {
      stopNavigation();
      toggleBtn.textContent = "▶️ Start Execution";
      toggleBtn.style.backgroundColor = "#0043ce";
    }
  });

  console.log("✅ Sequential Section Navigator V9.4 loaded - SkillsLine Only with Enhanced Process and Scenario Support");
})();