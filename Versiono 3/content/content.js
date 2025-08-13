// Sequential Section Navigator V9.5 - Chrome Extension Content Script
(function () {
  "use strict";

  // i check if we're on skillsline.com domain
  if (!window.location.hostname.includes("skillsline.com")) {
    console.log("🚫 Extension only works on skillsline.com");
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
  let isPausingWhileListening = false;
  let waitingTimeout = null;
  let nextButtonTimeout = null;
  let pauseListeningTimeout = null;
  let recentlyContinueClicked = false;
  let scenarioClickingInterval = null;
  let processClickingInterval = null;

  // sorting configuration from original script
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

    // Listening skills
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Leaning away": "right",

    // Environmental Initiative (LEFT)
    "Traffic congestion": "right",
    Pollution: "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Hunting license": "right",
    "Insect crop damage": "left",

    // Social Relationship (CENTER)
    "Skills training": "center",
    "Child adoption": "center",
    Education: "center",
    "Substance abuse": "center",

    // Governance Standard (RIGHT)
    "Antibiotic approval": "right",
    "Poison control": "right",

    // Sustainable behaviors
    "Walk or bicycle rather than drive.": "right",
    "Bring reusable bags into stores.": "left",
    "Take public transportation when possible.": "right",
    "Buy only enough food to meet your needs.": "left",
    "Avoid single-use water bottles and straws.": "left",
    "Drive energy-efficient vehicles.": "right",
    "Share rides, car-pool, and use public transportation.": "right",
    "Buy energy-efficient electrical appliances.": "left",
  };

  // create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "▶️ Start Execution";
  toggleBtn.className = "nav-toggle-btn";
  document.body.appendChild(toggleBtn);

  // create category display
  const categoryDisplay = document.createElement("div");
  categoryDisplay.textContent = "Ready to execute (SkillsLine Only)";
  categoryDisplay.className = "nav-category-display";
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

    // check for process block - enhanced with next wait
    if (element.querySelector(".block-process")) {
      return "process - auto click with next wait";
    }

    // check for scenario block - enhanced with next wait
    if (element.querySelector(".block-scenario")) {
      return "scenario - auto continue with next wait";
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
      "process - auto click with next wait",
      "scenario - auto continue with next wait",
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
      category === "process - auto click with next wait" ||
      category === "scenario - auto continue with next wait"
    );
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
      } else if (category === "scenario - auto continue with next wait") {
        displayMessage = "SCENARIO COMPLETE - Waiting for next button";
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

  // execution function for process blocks - using V9.2 logic
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

  // enhanced execution function for scenario blocks with continuous clicking
  function executeScenario(element, iframeDoc, iframeWin) {
    return new Promise((resolve) => {
      console.log(
        "🎬 Executing enhanced scenario logic - continuous clicking until next button appears"
      );

      const SCENARIO_SELECTORS = [
        "button.scenario-block__text__continue",
        "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
      ];

      // selectors for next button (completion signal)
      const NEXT_BUTTON_SELECTORS = [
        'button[data-testid="arrow-next"]',
        "button.next-btn",
        'button[aria-label*="next"]',
        'button[aria-label*="Next"]',
        "button.continue-btn",
        'button[class*="next"]',
      ];

      let clickCount = 0;
      const maxClicks = 300; // safety limit (60 seconds at 200ms intervals)

      updateCategoryDisplay(
        "scenario - auto continue with next wait",
        currentIndex,
        noOutlineElements.length,
        false,
        "Auto-clicking continue buttons..."
      );

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
          if (
            continueButton &&
            continueButton.offsetParent !== null &&
            isInViewport(continueButton, iframeWin)
          ) {
            console.log(
              `🎬 Clicking scenario continue: ${selector} (click ${
                clickCount + 1
              })`
            );
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

  // function to inject hint dot styles into iframe
  function injectHintDotStyles(iframeDoc) {
    // i check if styles are already injected
    if (iframeDoc.querySelector("#hint-dot-styles")) return;

    const style = iframeDoc.createElement("style");
    style.id = "hint-dot-styles";
    style.textContent = `
      .hint-dot {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        top: 6px;
        z-index: 10;
      }
      .dot-left { 
        left: 6px; 
        background-color: #00cc00; 
      }
      .dot-center { 
        left: 50%; 
        transform: translateX(-50%); 
        background-color: #ffcc00; 
      }
      .dot-right { 
        right: 6px; 
        background-color: #3399ff; 
      }
      .sorting {
        display: block !important;
      }
      .playing-card {
        position: relative !important;
      }
    `;
    iframeDoc.head.appendChild(style);
    console.log("✅ Injected hint dot styles into iframe");
  }

  // execution function for sorting activities
  function executeSortingActivity(element, iframeDoc) {
    console.log("🎯 Executing sorting activity logic - applying hint dots");

    // i inject the hint dot styles first
    injectHintDotStyles(iframeDoc);

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

        const dot = iframeDoc.createElement("div");
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
  // i created a keyword-based quiz database for automatic answer selection
  const quizDatabase = {
    "chess champion.*watson.*jeopardy": "Era of AI",
    "categorized.*qualitative data.*cannot be processed": "Unstructured data",

    // New entries below
    "four debate steps.*order.*learn and understand.*build a position.*organize your proof.*respond to your opponent":
      [
        "Learn and understand the topic",
        "Build a position",
        "Organize your proof",
        "Respond to your opponent",
      ],

    "likely consequence of ai becoming more pervasive":
      "Enhanced productivity and the creation of new opportunities",

    "promotion candidates.*indicator.*unwanted bias": [
      "A group receives a systematic advantage",
      "A group receives a systematic disadvantage",
    ],

    "true about bias in ai systems":
      "Unwanted bias is a systematic error in AI systems that may result in unfair outcomes.",

    "describes a robust ai system":
      "The AI system can effectively handle malicious attacks without causing unintentional harm.",

    "examples of adversarial attacks.*select the two": ["Poisoning", "Evasion"],

    "degree to which an observer can understand the cause of a decision":
      "interpretability",

    "ai system.*everyday people.*understand prediction or recommendation":
      "Explainable",

    "sheldon.*ai recommendation system.*share.*transparency": [
      "What data is collected",
      "Who has access to the data",
    ],

    "in order to be trustworthy, an ai system must be": "transparent",

    "employ privacy controls before deployment.*select the two": [
      "Model anonymization",
      "Differential privacy",
    ],

    "shirley.*arrested for protesting.*example of":
      "Sensitive personal information (SPI)",

    "john.*different opinion.*agile value": "Courage",

    "nora.*error in report.*agile value": "Openness",

    "jagdish.*values input.*agile value": "Respect",

    "first step to act on iteration and learning principle":
      "Start by doing and trying small pieces of work.",

    "principle emphasizes importance of groups empowered to manage own work":
      "Self-directed teams",

    "jordan.*planning camping trip.*agile principle": "Clarity of outcome",

    "correct sequence.*clarity of outcome principle":
      "Define the problem, determine the user outcome, and keep the user outcome in sight",

    "john.*shares recipe feedback.*next step":
      "Adjust the recipe based on the feedback",

    "agile practice.*review performance.*reflect on ways to improve":
      "Retrospective",

    "creating social contract.*writing ideas on sticky notes":
      "Brainstorm individually",

    "maxim.*mood marbles.*team emotional state":
      "To evaluate how the team is feeling",

    "stand-up meeting.*next step":
      "Have team members give their status updates",

    "shuhari stage.*move away from traditional methods": "Ri",

    "clinic.*outdated operating system.*relevant risk question":
      "What negative impact can this outdated OS have on system and data security?",

    "clinic.*email system.*single-factor authentication.*relevant risk question":
      "How can single-factor authentication compromise the clinic’s email security?",

    "organization.*antimalware software.*relevant risk question":
      "What is the probability of a virus or other malware attacking this system?",

    "organization.*no regular backup routine.*relevant risk question":
      "What damages can result from losing patients’ data?",

    "clinic.*old hardware.*relevant risk question":
      "Are the old computers accessible through the clinic’s network?",
  };

  // i created a function to select answers from the database using keyword matching
  function selectAnswerFromDatabase(block) {
    try {
      // i extract question text from different possible locations
      const questionElement =
        block.querySelector(".quiz-card__title") ||
        block.querySelector('[class*="question"]') ||
        block.querySelector('[class*="title"]');

      if (!questionElement) {
        console.log("❌ No question element found");
        return false;
      }

      const questionText = questionElement.textContent.toLowerCase().trim();
      console.log(
        "🔍 Analyzing question:",
        questionText.substring(0, 100) + "..."
      );

      // i search through database patterns
      let correctAnswer = null;
      let matchedPattern = null;

      for (const [pattern, answer] of Object.entries(quizDatabase)) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(questionText)) {
          correctAnswer = answer;
          matchedPattern = pattern;
          console.log(
            `✅ Found match! Pattern: "${pattern}" -> Answer: "${answer}"`
          );
          break;
        }
      }

      if (!correctAnswer) {
        console.log("❌ No matching pattern found in database");
        return false;
      }

      // i look for the correct answer option
      const options = block.querySelectorAll(
        '.quiz-multiple-choice-option, [role="radio"], [role="checkbox"]'
      );
      let targetOption = null;

      // i try different methods to find the correct option
      for (const option of options) {
        const optionText = option.textContent.toLowerCase().trim();

        // exact match
        if (optionText.includes(correctAnswer.toLowerCase())) {
          targetOption = option;
          console.log(`🎯 Found exact match: "${optionText}"`);
          break;
        }

        // partial match for longer answers
        const answerWords = correctAnswer.toLowerCase().split(" ");
        const matchingWords = answerWords.filter(
          (word) => word.length > 2 && optionText.includes(word)
        );

        if (matchingWords.length >= Math.ceil(answerWords.length * 0.6)) {
          targetOption = option;
          console.log(
            `🎯 Found partial match: "${optionText}" (${matchingWords.length}/${answerWords.length} words)`
          );
          break;
        }
      }

      if (targetOption) {
        // i click the correct option
        const input = targetOption.querySelector("input") || targetOption;
        if (input) {
          input.click();
          console.log(`✅ Selected answer from database: "${correctAnswer}"`);
          return true;
        }
      } else {
        console.log(`❌ Could not find option matching: "${correctAnswer}"`);
      }
    } catch (error) {
      console.error("❌ Error in selectAnswerFromDatabase:", error);
    }

    return false;
  }

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

      // i try database first (only on first execution to avoid conflicts)
      if (executionNumber === 1) {
        console.log("🗄️ Trying database approach first...");
        if (selectAnswerFromDatabase(wrapper)) {
          console.log("✅ Answer selected from database!");
          processed++;

          // i submit after database selection
          setTimeout(() => {
            const submitBtn = wrapper.querySelector(
              "button.quiz-card__button:not(.quiz-card__button--disabled)"
            );
            if (submitBtn) {
              console.log(
                `📤 Clicking submit button after database selection (execution ${executionNumber})`
              );
              submitBtn.click();
            }
          }, 300);

          return; // i skip random selection since database worked
        }
        console.log(
          "❌ Database approach failed, falling back to random selection..."
        );
      }

      // i fall back to existing random selection logic
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
            `🔘 Selected random radio option (execution ${executionNumber})`
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
          `☑️ Selected ${picked.length} random checkbox options (execution ${executionNumber})`
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

  // function to execute block-specific functionality - using v9.2 knowledge block logic
  async function executeBlockFunction(element, category, iframeDoc, iframeWin) {
    switch (category) {
      case "sorting activity - manual sorting":
        return executeSortingActivity(element, iframeDoc);
      case "process - auto click with next wait":
        return executeProcess(element, iframeDoc, iframeWin);
      case "scenario - auto continue with next wait":
        return executeScenario(element, iframeDoc, iframeWin);
      case "flashcards - flip cards":
        return executeFlashcards(element, iframeDoc);
      case "accordion - open all accordions":
        return executeAccordion(element, iframeDoc);
      case "labeled graphic - open labels":
        return executeLabeledGraphic(element, iframeDoc);
      case "continue button - click":
        return executeContinueButton(element, iframeDoc, iframeWin);
      case "knowledge - answer with radio":
      case "knowledge - answer with checkbox":
      case "knowledge - general":
        // i execute knowledge blocks twice for better reliability (v9.2 approach)
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

        const executed = firstExecution || secondExecution;
        console.log("✅ Double execution completed for knowledge block");
        return executed;
      default:
        console.log(`⚠️ No specific execution for category: ${category}`);
        return false;
    }
  }

  // function to update category display
  function updateCategoryDisplay(
    category,
    index,
    total,
    isWaiting = false,
    customMessage = null
  ) {
    let displayText;

    if (customMessage) {
      displayText = `${index + 1}/${total}: ${category} - ${customMessage}`;
    } else if (isWaiting) {
      displayText = `Waiting for new content... (${index}/${total})`;
    } else {
      displayText = `${category} (${index + 1}/${total})`;
    }

    categoryDisplay.textContent = displayText;

    // i update background color based on category
    if (category.includes("manual sorting") || category.includes("MANUAL")) {
      categoryDisplay.style.backgroundColor = "#dc3545"; // red for manual
    } else if (category.includes("knowledge")) {
      categoryDisplay.style.backgroundColor = "#6f42c1"; // purple for knowledge
    } else if (isWaiting || customMessage?.includes("Waiting")) {
      categoryDisplay.style.backgroundColor = "#ffc107"; // yellow for waiting
    } else if (category.includes("process") || category.includes("scenario")) {
      categoryDisplay.style.backgroundColor = "#17a2b8"; // teal for auto-clicking
    } else {
      categoryDisplay.style.backgroundColor = "#28a745"; // green for others
    }
  }

  // function to collect noOutline elements
  function collectNoOutlineElements() {
    if (!currentIframe) return [];

    try {
      const iframeDoc = currentIframe.contentDocument;
      const elements = Array.from(iframeDoc.querySelectorAll(".noOutline"));

      console.log(`📋 Found ${elements.length} noOutline elements`);

      // i filter out elements we've already seen
      const newElements = elements.filter((el) => {
        const blockId =
          el.getAttribute("data-block-id") ||
          el.querySelector("[data-block-id]")?.getAttribute("data-block-id") ||
          el.innerHTML.substring(0, 100);
        return !seenBlockIds.has(blockId);
      });

      // i mark new elements as seen
      newElements.forEach((el) => {
        const blockId =
          el.getAttribute("data-block-id") ||
          el.querySelector("[data-block-id]")?.getAttribute("data-block-id") ||
          el.innerHTML.substring(0, 100);
        seenBlockIds.add(blockId);
      });

      console.log(`🆕 Found ${newElements.length} new noOutline elements`);
      return newElements;
    } catch (err) {
      console.warn("❌ Error collecting noOutline elements:", err);
      return [];
    }
  }

  // function to highlight current element
  function highlightElement(element) {
    // i remove previous highlight
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove("nav-highlighted");
    }

    // i add new highlight
    if (element) {
      element.classList.add("nav-highlighted");
      currentHighlightedElement = element;
    }
  }

  // function to pause while listening for new content
  function pauseWhileListening() {
    return new Promise((resolve) => {
      console.log(
        "⏸️ Pausing for 20 seconds while listening for new content..."
      );
      isPausingWhileListening = true;

      updateCategoryDisplay(
        "Pausing while listening",
        currentIndex,
        noOutlineElements.length,
        false,
        "Pausing while listening for new content..."
      );

      const checkForNewContent = () => {
        if (!isPausingWhileListening || !currentIframe) {
          resolve(false);
          return;
        }

        try {
          const iframeDoc = currentIframe.contentDocument;

          // i check for new noOutline elements
          const newElements = collectNoOutlineElements();
          if (newElements.length > 0) {
            console.log(
              "✅ Found new content during pause, resuming navigation"
            );
            noOutlineElements.push(...newElements);
            isPausingWhileListening = false;
            if (pauseListeningTimeout) {
              clearTimeout(pauseListeningTimeout);
              pauseListeningTimeout = null;
            }
            resolve(true);
            return;
          }

          // i check for continue button that might have appeared
          const continueBtn = iframeDoc.querySelector(
            "button.continue-btn.brand--ui"
          );
          if (
            continueBtn &&
            continueBtn.offsetParent !== null &&
            !recentlyContinueClicked
          ) {
            console.log("✅ Found continue button during pause, clicking it");
            continueBtn.click();
            recentlyContinueClicked = true;

            // i reset the flag after a delay
            setTimeout(() => {
              recentlyContinueClicked = false;
            }, 2000);
          }

          // i keep checking every 500ms during pause
          if (isPausingWhileListening) {
            pauseListeningTimeout = setTimeout(checkForNewContent, 500);
          }
        } catch (err) {
          console.warn("❌ Error checking for new content during pause:", err);
          if (isPausingWhileListening) {
            pauseListeningTimeout = setTimeout(checkForNewContent, 500);
          }
        }
      };

      // i start checking immediately
      checkForNewContent();

      // i set the 20-second pause timeout
      setTimeout(() => {
        if (isPausingWhileListening) {
          console.log("⏰ 20-second pause completed, continuing navigation");
          isPausingWhileListening = false;
          if (pauseListeningTimeout) {
            clearTimeout(pauseListeningTimeout);
            pauseListeningTimeout = null;
          }
          resolve(false);
        }
      }, 20000);
    });
  }

  // function to wait for new content or continue button
  function waitForNewContent() {
    return new Promise((resolve) => {
      console.log("⏳ Waiting for new content or continue button...");
      isWaitingForNewContent = true;

      updateCategoryDisplay(
        "general",
        currentIndex,
        noOutlineElements.length,
        true
      );

      const checkForContent = () => {
        if (!isWaitingForNewContent || !currentIframe) {
          resolve(false);
          return;
        }

        try {
          const iframeDoc = currentIframe.contentDocument;

          // i check for new noOutline elements
          const newElements = collectNoOutlineElements();
          if (newElements.length > 0) {
            console.log("✅ Found new content, updating elements list");
            noOutlineElements.push(...newElements);
            isWaitingForNewContent = false;
            if (waitingTimeout) {
              clearTimeout(waitingTimeout);
              waitingTimeout = null;
            }
            resolve(true);
            return;
          }

          // i check for continue button that might have appeared
          const continueBtn = iframeDoc.querySelector(
            "button.continue-btn.brand--ui"
          );
          if (
            continueBtn &&
            continueBtn.offsetParent !== null &&
            !recentlyContinueClicked
          ) {
            console.log("✅ Found continue button, clicking it");
            continueBtn.click();
            recentlyContinueClicked = true;

            // i reset the flag after a delay
            setTimeout(() => {
              recentlyContinueClicked = false;
            }, 2000);

            // i continue waiting for new content after clicking continue
            waitingTimeout = setTimeout(checkForContent, 1000);
            return;
          }

          // i keep checking every 1 second
          waitingTimeout = setTimeout(checkForContent, 1000);
        } catch (err) {
          console.warn("❌ Error checking for new content:", err);
          waitingTimeout = setTimeout(checkForContent, 1000);
        }
      };

      // i start checking immediately
      checkForContent();

      // i set a maximum wait time of 10 seconds
      setTimeout(() => {
        if (isWaitingForNewContent) {
          console.log(
            "⏰ Timeout waiting for new content, proceeding to next section"
          );
          isWaitingForNewContent = false;
          if (waitingTimeout) {
            clearTimeout(waitingTimeout);
            waitingTimeout = null;
          }
          resolve(false);
        }
      }, 10000);
    });
  }

  // main navigation function
  async function navigateToNextSection() {
    if (!enabled || !currentIframe) return;

    try {
      const iframeDoc = currentIframe.contentDocument;

      // i collect fresh noOutline elements if we don't have any
      if (noOutlineElements.length === 0) {
        noOutlineElements = collectNoOutlineElements();
        currentIndex = 0;
      }

      // i check if we have elements to process
      if (currentIndex >= noOutlineElements.length) {
        console.log(
          "🔍 No more elements, entering pause while listening mode..."
        );
        const foundNewContent = await pauseWhileListening();

        if (!foundNewContent) {
          console.log(
            "🏁 No new content found after pause, navigation complete"
          );
          updateCategoryDisplay(
            "Complete - No more sections",
            currentIndex,
            noOutlineElements.length
          );
          return;
        }
      }

      // i get current element
      const currentElement = noOutlineElements[currentIndex];
      if (!currentElement || !currentElement.offsetParent) {
        console.log("⚠️ Current element not visible, moving to next");
        currentIndex++;
        setTimeout(navigateToNextSection, 200);
        return;
      }

      // i scroll to and highlight the element
      await scrollIntoViewAndWait(currentElement);
      highlightElement(currentElement);

      // i identify the block type
      const category = identifyBlockType(currentElement);
      console.log(
        `📍 Processing element ${currentIndex + 1}/${
          noOutlineElements.length
        }: ${category}`
      );

      updateCategoryDisplay(category, currentIndex, noOutlineElements.length);

      // i execute block-specific functionality
      if (isInteractiveBlock(category)) {
        const blockId =
          currentElement.getAttribute("data-block-id") ||
          currentElement
            .querySelector("[data-block-id]")
            ?.getAttribute("data-block-id") ||
          currentElement.innerHTML.substring(0, 100);

        if (!executedBlocks.has(blockId)) {
          console.log(`🎯 Executing interactive block: ${category}`);

          const executed = await executeBlockFunction(
            currentElement,
            category,
            iframeDoc,
            currentIframe.contentWindow
          );

          if (executed) {
            executedBlocks.add(blockId);

            // i wait for next button if it's a manual block
            if (isManualBlock(category)) {
              await waitForNextButton(currentElement, category);
            }

            // knowledge blocks now handle double execution internally (v9.2 approach)
            // no need for separate second execution here
          }
        } else {
          console.log("⏭️ Block already executed, skipping");
        }
      }

      // i move to next element
      currentIndex++;

      // i continue navigation with faster delay for general blocks
      const delay = isKnowledgeBlock(category) ? 500 : 100; // reduced from 200ms to 100ms for general blocks
      setTimeout(navigateToNextSection, delay);
    } catch (err) {
      console.error("❌ Error in navigation:", err);
      currentIndex++;
      setTimeout(navigateToNextSection, 1000);
    }
  }

  // function to find current visible element for resume
  function findCurrentVisibleElement() {
    if (!currentIframe) return -1;

    try {
      const iframeDoc = currentIframe.contentDocument;
      const iframeWin = currentIframe.contentWindow;
      const allElements = Array.from(iframeDoc.querySelectorAll(".noOutline"));

      // i find the first element that's in viewport
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.offsetParent && isInViewport(element, iframeWin)) {
          console.log(`📍 Found visible element at index ${i} for resume`);
          return i;
        }
      }

      // i fallback to first visible element
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.offsetParent) {
          console.log(
            `📍 Found first visible element at index ${i} for resume`
          );
          return i;
        }
      }

      return 0;
    } catch (err) {
      console.warn("❌ Error finding current visible element:", err);
      return 0;
    }
  }

  // function to start navigation
  function startNavigation() {
    if (!currentIframe) {
      console.log("❌ No iframe found");
      return;
    }

    enabled = true;

    // i check if we're resuming or starting fresh
    if (noOutlineElements.length === 0) {
      // i start fresh
      currentIndex = 0;
      noOutlineElements = [];
      seenBlockIds.clear();
      executedBlocks.clear();
      console.log("🚀 Starting navigation from beginning...");
    } else {
      // i resume from current visible element
      const visibleIndex = findCurrentVisibleElement();
      currentIndex = Math.max(visibleIndex, currentIndex);
      console.log(`🔄 Resuming navigation from element ${currentIndex + 1}...`);
    }

    toggleBtn.textContent = "⏸️ Stop Execution";
    toggleBtn.style.backgroundColor = "#dc3545";

    navigateToNextSection();
  }

  // function to stop navigation
  function stopNavigation() {
    enabled = false;
    isWaitingForNewContent = false;
    isWaitingForNextButton = false;
    isPausingWhileListening = false;

    // i clear all timeouts and intervals
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
      navigationTimeout = null;
    }
    if (waitingTimeout) {
      clearTimeout(waitingTimeout);
      waitingTimeout = null;
    }
    if (pauseListeningTimeout) {
      clearTimeout(pauseListeningTimeout);
      pauseListeningTimeout = null;
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

    // i remove highlight
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove("nav-highlighted");
      currentHighlightedElement = null;
    }

    toggleBtn.textContent = "▶️ Start Execution";
    toggleBtn.style.backgroundColor = "#0043ce";
    categoryDisplay.textContent = "Stopped (SkillsLine Only)";
    categoryDisplay.style.backgroundColor = "#6c757d";

    console.log("⏹️ Navigation stopped");
  }

  // function to find iframe
  function findIframe() {
    const iframe =
      document.querySelector('iframe[src*="skillsline.com"]') ||
      document.querySelector('iframe[src*="content"]') ||
      document.querySelector("iframe");

    if (iframe && iframe.contentDocument) {
      currentIframe = iframe;
      console.log("✅ Found iframe");
      return true;
    }

    console.log("❌ No accessible iframe found");
    return false;
  }

  // toggle button event listener
  toggleBtn.addEventListener("click", () => {
    if (!enabled) {
      if (findIframe()) {
        startNavigation();
      } else {
        alert(
          "No accessible iframe found. Make sure you're on a SkillsLine lesson page."
        );
      }
    } else {
      stopNavigation();
    }
  });

  // i initialize by finding iframe
  setTimeout(() => {
    findIframe();
  }, 2000);

  console.log(
    "🎯 Sequential Section Navigator V9.5 Chrome Extension loaded - SkillsLine Only"
  );
})();
