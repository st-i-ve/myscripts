// ==UserScript==
// @name         AI Quiz - Question-Based Regex Answer Selector V2.5.1 (Regex Pattern Matching)
// @namespace    http://tampermonkey.net/
// @version      2.5.1
// @description  Auto-selects correct answer using regex pattern matching on questions instead of section-based answers
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // i replaced the section-based answers with question-answer regex patterns
  const questionAnswerPairs = {
    "what is artificial intelligence?": [
      {
        question: /which.*example.*whole brain emulation.*machine.*think.*decisions/i,
        answer: "General AI"
      },
      {
        question: /what.*artificial intelligence/i,
        answer: "Techniques that help machines and computers mimic human behavior"
      },
      {
        question: /which.*basis.*ai systems.*algorithms.*reveal patterns.*trends/i,
        answer: "Data"
      },
      {
        question: /mathematical instructions.*tell.*machine.*finding solutions.*problem/i,
        answer: "Algorithm"
      },
      {
        question: /ai application.*computers.*ability.*understand.*human language.*spoken/i,
        answer: "Natural language processing"
      }
    ]
  };

  const normalize = (str) =>
    str
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  // i added this function to extract question text from the quiz card
  const getQuestionText = (activeCard, doc) => {
    let questionText = "";

    // primary method: look for .quiz-card__title .fr-view span
    const titleEl = activeCard.querySelector(".quiz-card__title .fr-view span");
    if (titleEl) {
      questionText = titleEl.innerText.trim();
    }

    // fallback 1: try .quiz-card__title .fr-view p
    if (!questionText) {
      console.log("🔄 Falling back to .quiz-card__title .fr-view p");
      const titleP = activeCard.querySelector(".quiz-card__title .fr-view p");
      if (titleP) {
        questionText = titleP.innerText.trim();
      }
    }

    // fallback 2: try .quiz-card__title directly
    if (!questionText) {
      console.log("🔄 Falling back to .quiz-card__title direct text");
      const titleDiv = activeCard.querySelector(".quiz-card__title");
      if (titleDiv) {
        questionText = titleDiv.innerText.trim();
      }
    }

    return questionText;
  };

  // i added this function to find answers using regex pattern matching
  const findAnswerByRegex = (questionText, qaMap) => {
    if (!questionText || !qaMap || qaMap.length === 0) {
      return null;
    }

    const normalizedQuestion = normalize(questionText);
    console.log(`🔍 Searching for question: "${questionText}"`);
    console.log(`🔍 Normalized: "${normalizedQuestion}"`);

    for (const pair of qaMap) {
      if (pair.question.test(normalizedQuestion)) {
        console.log(`✅ Found matching pattern: ${pair.question}`);
        console.log(`✅ Corresponding answer: ${pair.answer}`);
        return pair.answer;
      }
    }

    console.warn("❌ No regex pattern matched the question");
    return null;
  };

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
      const qaMap = questionAnswerPairs[sectionTitle];

      if (!qaMap || !Array.isArray(qaMap)) {
        console.warn(`⚠️ No question patterns defined for section: "${sectionTitle}"`);
        return;
      }

      // i extract the question text and find the answer using regex matching
      const questionText = getQuestionText(activeCard, iframeDoc);
      if (!questionText) {
        console.warn("❌ Could not extract question text");
        return;
      }

      const expectedAnswer = findAnswerByRegex(questionText, qaMap);
      if (!expectedAnswer) {
        console.warn("❌ Could not find answer for question");
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
          const normalizedExpected = normalize(expectedAnswer);
          
          availableOptionsDebug.push({
            original: answerText,
            normalized: normalizedAnswer,
          });

          if (normalizedAnswer === normalizedExpected) {
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
        console.log(`🎯 Expected answer: "${expectedAnswer}"`);
        console.log(`🎯 Normalized expected: "${normalize(expectedAnswer)}"`);
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