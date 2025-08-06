// ==UserScript==
// @name         AI Quiz - Section-Based Answer Selector V2.3 (Enhanced Fallbacks + AI Intro)
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Auto-selects correct answer, submits, and clicks NEXT based on section heading, with enhanced fallback mechanisms and AI Introduction section
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  const sectionAnswers = {
    "introduction to artificial intelligence": [
      "AI systems make predictions.",
      "Unstructured",
      "Social media data contains a mix of structured and unstructured data.",
      "Machine learning offers probabilistic statements instead of binary decisions.",
      "Data that combines features of both structured and unstructured data, using metadata for organization",
      "Flight schedules",
      "General AI",
      "By providing probabilistic statements with confidence levels for different treatment options",
      "Reinforcement learning",
      "It performs millions of tiny calculations quickly, trying different routes through trial and error.",
    ],
    "what is artificial intelligence?": [
      "General AI",
      "Algorithm",
      "Techniques that help machines and computers mimic human behavior",
      "Data",
      "Natural language processing",
    ],
    "beyond conservation to sustainability": [
      "the needs of current and future generations",
      "turning off lights and appliances not in use",
      "ai analysis of building photos to identify signs of metal fatigue",
      "conservation of power use",
      "using alternative power sources",
      "the protection and preservation of what exists today",
      "hybrid cloud",
      "The town had to find other resources.",
      "Environmental",
      "using renewable energy sources to power furnaces and other production equipment",
    ],
    "applying ux design": [
      "It helps designers present ideas effectively.",
      "It helps designers advocate user needs to other members of their team.",
      "It helps designers collaborate with other members of their team.",
      "The current navigation isn't intuitive enough, as the users are unable to find the right plants easily.",
      "Add elements such as stickers, avatars, and color-coded reports creatively to engage the students.",
      "Use empathetic language and tone, encouragement and rewards, and accessibility features to encourage students with diverse abilities.",
      "Research the age group's physical and mental health challenges in forming healthy habits.",
      "To adjust the heavy content automatically across devices, Rio should choose responsive design, as it uses a single code and thus, needs lesser effort.",
      "To ensure smooth user experience across all devices, Rio should choose responsive design, as it will eliminate the need for user adjustments.",
      "Ensure that users can seamlessly transition between different devices and platforms without encountering jarring differences in user experience.",
      "Align branding, visual elements, and user flows for products that span multiple platforms.",
      "An adaptive design focuses on creating multiple app layouts for specific devices or screen sizes through manual customization, while a responsive design uses a single design that adapts to various screens and devices automatically.",
      "An adaptive design delivers better performance on specific devices, while a responsive design ensures consistent performance across devices.",
      "Details of the selected project, potential user challenges, and the goal",
      "Use age-appropriate images and icons suitable for middle school students",
      "Ensure that graphics do not exclude certain cultures",
      "Consider the varying needs of students with different abilities to create an inclusive and accessible design",
    ],
    "digital literacy: the what, why, and how of digital data": [
      "Surveys and questionnaires.",
      "Dispose of the data securely when it's no longer needed.",
      "Clearly define objectives and align data collection methods with the objectives.",
      "Check whether the tools used for collecting data give stable results over time.",
      "Commercial transaction records",
      "Surveys and questionnaires",
      "Web scraping technologies",
      "Use visualizations to show patterns, trends, and key insights.",
      "Check her information by comparing it with data from different methods or sources.",
      "Sensors and IoT devices",
    ],
  };

  const normalize = (str) =>
    str
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  // i enhanced this function to handle both radio and checkbox inputs with multiple fallback mechanisms
  const getQuizOptions = (container) => {
    // first try the original method - role-based selection
    let options = container.querySelectorAll(
      '[role="radio"], [role="checkbox"]'
    );

    if (options.length === 0) {
      // fallback 1: single-choice radio buttons
      console.log("🔄 Falling back to input[type='radio'] selection");
      options = container.querySelectorAll(
        'input[type="radio"].quiz-multiple-choice-option__input'
      );
    }

    if (options.length === 0) {
      // fallback 2: multiple-choice checkboxes (single-choice style)
      console.log(
        "🔄 Falling back to input[type='checkbox'] single-choice selection"
      );
      options = container.querySelectorAll(
        'input[type="checkbox"].quiz-multiple-choice-option__input'
      );
    }

    if (options.length === 0) {
      // fallback 3: multiple-choice checkboxes (multiple-response style)
      console.log(
        "🔄 Falling back to input[type='checkbox'] multiple-response selection"
      );
      options = container.querySelectorAll(
        'input[type="checkbox"].quiz-multiple-response-option__input'
      );
    }

    return options;
  };

  // i enhanced this function to handle both single-choice and multiple-choice answer text extraction
  const getAnswerText = (option, doc) => {
    let answerText = "";

    // first try the original method - aria-labelledby
    const labelId = option.getAttribute("aria-labelledby");
    if (labelId) {
      const labelEl = doc.getElementById(labelId);
      answerText = labelEl?.innerText.trim();
    }

    // fallback 1: single-choice question text divs
    if (!answerText) {
      console.log(
        "🔄 Falling back to .quiz-multiple-choice-option__text selection"
      );
      const parentLabel =
        option.closest("label") ||
        option.closest(".quiz-multiple-choice-option");
      if (parentLabel) {
        const textDiv = parentLabel.querySelector(
          ".quiz-multiple-choice-option__text"
        );
        if (textDiv) {
          answerText = textDiv.innerText.trim();
        }
      }
    }

    // fallback 2: multiple-choice question text divs
    if (!answerText) {
      console.log(
        "🔄 Falling back to .quiz-multiple-response-option__text selection"
      );
      const parentLabel =
        option.closest("label") ||
        option.closest(".quiz-multiple-response-option");
      if (parentLabel) {
        const textDiv = parentLabel.querySelector(
          ".quiz-multiple-response-option__text"
        );
        if (textDiv) {
          answerText = textDiv.innerText.trim();
        }
      }
    }

    return answerText;
  };

  setInterval(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headerEl = iframeDoc.querySelector(".nav-sidebar-header__title");
      const activeCard = iframeDoc.querySelector(
        ".quiz__wrap .quiz-item__card--active"
      );
      if (!headerEl || !activeCard) return;

      const sectionTitle = headerEl.innerText.trim().toLowerCase();
      const answerList = sectionAnswers[sectionTitle];

      if (!answerList || !Array.isArray(answerList)) {
        console.warn(`⚠️ No answers defined for section: "${sectionTitle}"`);
        return;
      }

      // i use the enhanced function with multiple fallback mechanisms
      const options = getQuizOptions(activeCard);
      let selected = false;

      const availableOptionsDebug = [];

      options.forEach((option) => {
        // i use the enhanced function to get answer text with multiple fallbacks
        const answerText = getAnswerText(option, iframeDoc);

        if (answerText) {
          const normalizedAnswer = normalize(answerText);
          availableOptionsDebug.push({
            original: answerText,
            normalized: normalizedAnswer,
          });

          if (answerList.some((ans) => normalize(ans) === normalizedAnswer)) {
            option.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
            console.log(`✅ Selected correct answer: ${answerText}`);
            selected = true;
          }
        }
      });

      if (!selected) {
        console.warn("❌ No matching answer found in options.");
        console.group("🔍 Available options (for debugging):");
        availableOptionsDebug.forEach((opt, idx) =>
          console.log(
            `#${idx + 1}: Original = "${opt.original}", Normalized = "${
              opt.normalized
            }"`
          )
        );
        console.groupEnd();
      }

      // === SUBMIT BUTTON ===
      setTimeout(() => {
        const submitBtn = activeCard.querySelector(
          "button.quiz-card__button:not(.quiz-card__button--disabled):not(.quiz-card__button--next)"
        );
        if (submitBtn) {
          console.log("🧠 Clicking submit");
          submitBtn.click();
        }
      }, 300);

      // === NEXT BUTTON ===
      const nextButton = activeCard.querySelector(
        "button.quiz-card__button--next:not([disabled])"
      );

      const isInView = (el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth
        );
      };

      if (
        nextButton &&
        nextButton.offsetParent !== null &&
        nextButton.getAttribute("aria-hidden") !== "true" &&
        isInView(nextButton) &&
        !nextClicked
      ) {
        if (nextClickTimeout) clearTimeout(nextClickTimeout);

        nextClickTimeout = setTimeout(() => {
          console.log("➡️ Debounced 'NEXT' button click x10");
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              nextButton.click();
            }, i * 100);
          }

          nextClicked = true;
          setTimeout(() => {
            nextClicked = false;
          }, 100);
        }, 100);
      }
    } catch (err) {
      console.warn("⚠️ Error accessing iframe content:", err);
    }
  }, CHECK_INTERVAL_MS);
})();
