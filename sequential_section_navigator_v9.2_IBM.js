// ==UserScript==
// @name         Sequential Section Navigator V9.2 - SkillsLine Only with Process and Scenario Support
// @namespace    http://tampermonkey.net/
// @version      9.2
// @description  Navigate through noOutline sections on skillsline.com with process, scenario and sorting support
// @match        *://skillsline.com/*
// @match        *://*.skillsline.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // i check if we're on skillsline.com domain
  if (!window.location.hostname.includes("skillsline.com")) {
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
    "A fishing fleet wants to develop nets that will capture and kill fewer dolphins":
      "left",
    "A company switches its delivery fleet to electric vehicles": "left",
    "A farm reduces chemical pesticide use": "left",

    // Governance Standard (RIGHT - Blue)
    "An online retailer wants to keep fraudulent merchandise off its website":
      "right",
    "A business adopts transparent auditing procedures": "right",
    "A company enforces anti-bribery compliance": "right",

    // Social Relationship (CENTER - Yellow)
    "A restaurant chain wants to provide surplus food supplies to homeless shelters":
      "center",
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

    // Sustainable behaviors
    "Walk or bicycle rather than drive.": "right",
    "Bring reusable bags into stores.": "left",
    "Take public transportation when possible.": "right",
    "Buy only enough food to meet your needs.": "left",
    "Avoid single-use water bottles and straws.": "left",
    "Drive energy-efficient vehicles.": "right",
    "Share rides, car-pool, and use public transportation.": "right",
    "Buy energy-efficient electrical appliances.": "left",

    // Listening skills
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Leaning away": "right",

    // Environmental Initiative (LEFT)
    "Traffic congestion": "left",
    Pollution: "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Hunting license": "left",
    "Insect crop damage": "left",

    // Social Relationship (CENTER)
    "Skills training": "center",
    "Child adoption": "center",
    Education: "center",
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
    if (element.querySelector(".block-sorting-activity")) {
      return "sorting activity - manual sorting";
    }

    // check for scenario block
    if (element.querySelector(".block-scenario")) {
      return "scenario - auto continue";
    }

    // check for process block
    if (element.querySelector(".block-process")) {
      return "process - auto click with next wait";
    }

    // check for specific interactive classes
    if (element.querySelector(".blocks-tabs")) {
      return "tabs - open all tabs";
    }
    if (element.querySelector(".block-flashcards")) {
      return "flashcards - flip cards";
    }
    if (element.querySelector(".blocks-accordion")) {
      return "accordion - open all accordions";
    }
    if (element.querySelector(".block-labeled-graphic")) {
      return "labeled graphic - open labels";
    }
    if (element.querySelector(".continue-btn.brand--ui")) {
      return "continue button - click";
    }

    // check for knowledge blocks with specific aria-labels
    const knowledgeBlock = element.querySelector(".block-knowledge");
    if (knowledgeBlock) {
      const ariaLabel = knowledgeBlock.getAttribute("aria-label") || "";
      if (ariaLabel.includes("Multiple choice")) {
        return "knowledge - answer with radio";
      }
      if (ariaLabel.includes("Multiple response")) {
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
      "scenario - auto continue",
      "process - auto click with next wait",
      "flashcards - flip cards",
      "accordion - open all accordions",
      "labeled graphic - open labels",
      "continue button - click",
      "knowledge - answer with radio",
      "knowledge - answer with checkbox",
      "knowledge - general",
    ];
    return interactiveTypes.includes(category);
  }

  // function to check if block type is knowledge-related
  function isKnowledgeBlock(category) {
    return category.startsWith("knowledge -");
  }

  // function to check if block type requires manual completion or next button wait
  function isManualBlock(category) {
    return (
      category === "sorting activity - manual sorting" ||
      category === "process - auto click with next wait"
    );
  }

  // execution function for process blocks
  function executeProcess(element, iframeDoc, iframeWin) {
    return new Promise((resolve) => {
      console.log(
        "⚙️ Executing process logic - auto clicking process arrows until next button appears"
      );

      // selectors for process arrow buttons based on the HTML structure
      const PROCESS_SELECTORS = [
        "button.process-arrow.process-arrow--right.process-arrow--scrolling",
        "button[data-testid='arrow-next'][data-arrow='next']",
        "button.process-arrow[aria-label='Next']",
        "button.process-arrow",
      ];

      // selectors for next button (completion signal)
      const NEXT_BUTTON_SELECTORS = [
        'button[data-testid="arrow-next"]:not(.process-arrow)',
        "button.next-btn",
        'button[aria-label*="next"]:not(.process-arrow)',
        'button[aria-label*="Next"]:not(.process-arrow)',
        "button.continue-btn",
        'button[class*="next"]:not(.process-arrow)',
      ];

      let clickCount = 0;
      const maxClicks = 300; // safety limit (60 seconds at 200ms intervals)

      updateCategoryDisplay(
        "process - auto click with next wait",
        currentIndex,
        noOutlineElements.length,
        false,
        "Auto-clicking process arrows..."
      );

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

        // i check if next button appeared (outside the process block)
        let nextButtonFound = false;
        for (const selector of NEXT_BUTTON_SELECTORS) {
          const nextButton = iframeDoc.querySelector(selector);
          if (nextButton && nextButton.offsetParent !== null) {
            // i make sure it's not inside the process block
            const processBlock = element.querySelector(".block-process");
            if (processBlock && !processBlock.contains(nextButton)) {
              console.log(
                "✅ Next button found outside process block, stopping clicks"
              );
              nextButtonFound = true;
              break;
            }
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
          if (
            processButton &&
            processButton.offsetParent !== null &&
            isInViewport(processButton, iframeWin)
          ) {
            console.log(
              `⚙️ Clicking process arrow: ${selector} (click ${clickCount + 1})`
            );
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

  // execution function for scenario blocks
  function executeScenario(element, iframeDoc, iframeWin) {
    console.log("🎬 Executing scenario logic - auto clicking continue buttons");

    const CLICKS_PER_RUN = 15;
    const CLICK_DELAY_MS = 50;

    const SELECTORS = [
      "button.scenario-block__text__continue",
      "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
    ];

    let totalClicked = 0;

    // i check each selector for continue buttons
    for (const selector of SELECTORS) {
      const button = iframeDoc.querySelector(selector);
      if (button && isInViewport(button, iframeWin)) {
        console.log(`🎬 Found scenario continue button: ${selector}`);

        // i click the button 15 times with delays
        for (let i = 0; i < CLICKS_PER_RUN; i++) {
          setTimeout(() => {
            if (button && isInViewport(button, iframeWin)) {
              button.click();
            }
          }, i * CLICK_DELAY_MS);
        }
        totalClicked++;
      }
    }

    console.log(
      `✅ Executed scenario auto-continue on ${totalClicked} buttons`
    );
    return totalClicked > 0;
  }

  // execution function for sorting activities
  function executeSortingActivity(element, iframeDoc) {
    console.log("🎯 Executing sorting activity logic - applying hint dots");

    const sortingActivities = element.querySelectorAll(
      ".sorting, .block-sorting-activity"
    );
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
  function executeKnowledge(
    element,
    iframeDoc,
    iframeWin,
    executionNumber = 1
  ) {
    console.log(
      `🧠 Executing knowledge block logic (${executionNumber}${
        executionNumber === 1 ? "st" : "nd"
      } time)`
    );

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
          console.log(
            `🔘 Selected radio option (execution ${executionNumber})`
          );
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
        console.log(
          `☑️ Selected ${picked.length} checkbox options (execution ${executionNumber})`
        );
      }

      // submit button with delay
      setTimeout(() => {
        const submitBtn = wrapper.querySelector(
          "button.quiz-card__button:not(.quiz-card__button--disabled)"
        );
        if (submitBtn) {
          console.log(
            `📤 Clicking submit button (execution ${executionNumber})`
          );
          submitBtn.click();
        }
      }, 300);

      processed++;
    });

    console.log(
      `✅ Processed ${processed} knowledge blocks (execution ${executionNumber})`
    );
    return processed > 0;
  }

  // function to scroll element into view and wait
  function scrollIntoViewAndWait(element) {
    return new Promise((resolve) => {
      // i scroll the element into view smoothly
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
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
      }

      updateCategoryDisplay(
        category,
        currentIndex,
        noOutlineElements.length,
        false,
        displayMessage
      );

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
            "button.next-btn",
            'button[aria-label*="next"]',
            'button[aria-label*="Next"]',
            "button.continue-btn",
            'button[class*="next"]',
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

  // function to execute block function based on type
  async function executeBlockFunction(element, category) {
    if (!element || !currentIframe) return false;

    const blockId = element.getAttribute("data-block-id");
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
        case "scenario - auto continue":
          executed = executeScenario(element, iframeDoc, iframeWin);
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
          updateCategoryDisplay(
            category,
            currentIndex,
            noOutlineElements.length,
            false,
            "1st execution..."
          );
          const firstExecution = executeKnowledge(
            element,
            iframeDoc,
            iframeWin,
            1
          );

          // wait between executions
          await new Promise((resolve) => setTimeout(resolve, 500));

          // second execution
          updateCategoryDisplay(
            category,
            currentIndex,
            noOutlineElements.length,
            false,
            "2nd execution..."
          );
          const secondExecution = executeKnowledge(
            element,
            iframeDoc,
            iframeWin,
            2
          );

          // wait after second execution
          await new Promise((resolve) => setTimeout(resolve, 500));

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
  function updateCategoryDisplay(
    category,
    index,
    total,
    executed = false,
    customStatus = ""
  ) {
    let status = "";
    if (customStatus) {
      status = ` - ${customStatus}`;
    } else if (executed) {
      if (isKnowledgeBlock(category)) {
        status = " - EXECUTED! (2x)";
      } else if (isManualBlock(category)) {
        if (category === "process - auto click with next wait") {
          status = " - PROCESS COMPLETED!";
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
    const elements = Array.from(
      iframeDoc.querySelectorAll(".noOutline[data-block-id]")
    );

    // i filter out elements we've already seen to avoid duplicates
    const newElements = elements.filter((el) => {
      const blockId = el.getAttribute("data-block-id");
      return blockId && !seenBlockIds.has(blockId);
    });

    // i add new block IDs to our seen set
    newElements.forEach((el) => {
      const blockId = el.getAttribute("data-block-id");
      seenBlockIds.add(blockId);
    });

    console.log(
      `📋 Found ${newElements.length} new noOutline elements (${elements.length} total)`
    );
    return newElements;
  }

  // function to navigate to next element
  async function navigateToNext() {
    if (!enabled || currentIndex >= noOutlineElements.length) {
      console.log("🏁 Navigation completed or disabled");
      enabled = false;
      toggleBtn.textContent = "▶️ Start Execution";
      categoryDisplay.textContent = "Execution completed";
      return;
    }

    const element = noOutlineElements[currentIndex];
    if (!element) {
      console.log("❌ Element not found, moving to next");
      currentIndex++;
      setTimeout(navigateToNext, 100);
      return;
    }

    // i identify the block type
    const category = identifyBlockType(element);
    console.log(
      `🔍 Processing element ${currentIndex + 1}/${
        noOutlineElements.length
      }: ${category}`
    );

    // i update the display
    updateCategoryDisplay(category, currentIndex, noOutlineElements.length);

    // i highlight current element
    if (currentHighlightedElement) {
      currentHighlightedElement.style.outline = "";
    }
    element.style.outline = "3px solid #ff6b6b";
    currentHighlightedElement = element;

    // i execute the appropriate function for this block type
    const executed = await executeBlockFunction(element, category);

    // i update display to show execution status
    updateCategoryDisplay(
      category,
      currentIndex,
      noOutlineElements.length,
      executed
    );

    // i move to next element
    currentIndex++;

    // i continue navigation after a short delay
    navigationTimeout = setTimeout(navigateToNext, 1000);
  }

  // function to start/stop navigation
  function toggleNavigation() {
    if (enabled) {
      // stop navigation
      enabled = false;
      isWaitingForNextButton = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
        navigationTimeout = null;
      }
      if (nextButtonTimeout) {
        clearTimeout(nextButtonTimeout);
        nextButtonTimeout = null;
      }
      if (processClickingInterval) {
        clearInterval(processClickingInterval);
        processClickingInterval = null;
      }
      toggleBtn.textContent = "▶️ Start Execution";
      categoryDisplay.textContent = "Execution stopped";

      // i remove highlight
      if (currentHighlightedElement) {
        currentHighlightedElement.style.outline = "";
        currentHighlightedElement = null;
      }
    } else {
      // start navigation
      if (!currentIframe) {
        alert(
          "❌ No iframe found. Please make sure you're on a SkillsLine lesson page."
        );
        return;
      }

      try {
        const iframeDoc = currentIframe.contentDocument;
        const newElements = collectNoOutlineElements(iframeDoc);

        if (newElements.length === 0) {
          alert("❌ No noOutline elements found in the current page.");
          return;
        }

        // i add new elements to our collection
        noOutlineElements.push(...newElements);

        enabled = true;
        toggleBtn.textContent = "⏸️ Stop Execution";
        categoryDisplay.textContent = "Starting execution...";

        console.log(
          `🚀 Starting navigation with ${noOutlineElements.length} total elements`
        );
        navigateToNext();
      } catch (err) {
        console.error("❌ Error accessing iframe:", err);
        alert(
          "❌ Cannot access iframe content. Please refresh the page and try again."
        );
      }
    }
  }

  // function to find iframe
  function findIframe() {
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc && iframeDoc.querySelector(".noOutline")) {
          return iframe;
        }
      } catch (err) {
        // i skip iframes we can't access
        continue;
      }
    }
    return null;
  }

  // function to setup mutation observer for iframe changes
  function setupMutationObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver((mutations) => {
      if (!enabled || !currentIframe) return;

      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // i check if new noOutline elements were added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (
                node.classList?.contains("noOutline") ||
                node.querySelector?.(".noOutline")
              ) {
                shouldUpdate = true;
              }
            }
          });
        }
      });

      if (shouldUpdate) {
        console.log("🔄 New content detected, updating element list");
        try {
          const iframeDoc = currentIframe.contentDocument;
          const newElements = collectNoOutlineElements(iframeDoc);
          if (newElements.length > 0) {
            noOutlineElements.push(...newElements);
            console.log(
              `📋 Added ${newElements.length} new elements to navigation queue`
            );
          }
        } catch (err) {
          console.warn("❌ Error updating elements:", err);
        }
      }
    });

    try {
      const iframeDoc = currentIframe.contentDocument;
      mutationObserver.observe(iframeDoc.body, {
        childList: true,
        subtree: true,
      });
      console.log("👁️ Mutation observer setup complete");
    } catch (err) {
      console.warn("❌ Could not setup mutation observer:", err);
    }
  }

  // function to initialize the script
  function initialize() {
    console.log("🔧 Initializing Sequential Section Navigator V9.2");

    // i find the iframe
    currentIframe = findIframe();
    if (!currentIframe) {
      console.log("⏳ No iframe found yet, will retry...");
      setTimeout(initialize, 2000);
      return;
    }

    console.log("✅ Found iframe, setting up navigation");
    setupMutationObserver();

    // i add click handler to toggle button
    toggleBtn.addEventListener("click", toggleNavigation);

    console.log("🎯 Sequential Section Navigator V9.2 ready!");
  }

  // i start initialization when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
