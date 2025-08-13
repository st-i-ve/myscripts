// ==UserScript==
// @name         AI Quiz - Question-Based Regex Answer Selector V2.5.2 (Multi-Answer Support)
// @namespace    http://tampermonkey.net/
// @version      2.5.2
// @description  Auto-selects correct answers using regex pattern matching with multi-answer checkbox support
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // i extended the question-answer patterns to support multi-answer questions
  const questionAnswerPairs = {
    "what is artificial intelligence?": [
      {
        question:
          /which.*example.*whole brain emulation.*machine.*think.*decisions/i,
        answers: ["General AI"],
      },
      {
        question: /what.*artificial intelligence/i,
        answers: [
          "Techniques that help machines and computers mimic human behavior",
        ],
      },
      {
        question:
          /which.*basis.*ai systems.*algorithms.*reveal patterns.*trends/i,
        answers: ["Data"],
      },
      {
        question:
          /mathematical instructions.*tell.*machine.*finding solutions.*problem/i,
        answers: ["Algorithm"],
      },
      {
        question:
          /ai application.*computers.*ability.*understand.*human language.*spoken/i,
        answers: ["Natural language processing"],
      },
    ],
    "applying ux design": [
      {
        question:
          /which guidelines.*follow.*design.*consistent user experience.*different platforms/i,
        answers: [
          "Ensure that users can seamlessly transition between different devices and platforms without encountering jarring differences in user experience",
          "Align branding, visual elements, and user flows for products that span multiple platforms",
        ],
      },
      {
        question:
          /designing.*ux design case study.*details.*ux designers provide.*first step.*define project requirements/i,
        answers: [
          "Details of the selected project, potential user challenges, and the goal",
        ],
      },
      {
        question: /why.*good communication.*key skill.*ux designers/i,
        answers: [
          "It helps designers advocate user needs to other members of their team",
          "It helps designers collaborate with other members of their team",
          "It helps designers present ideas effectively",
        ],
      },
      {
        question:
          /example case study.*littleseed plants.*users finding.*current navigation complex/i,
        answers: [
          "The current navigation isn't intuitive enough, as the users are unable to find the right plants easily",
        ],
      },
      {
        question: /what.*difference.*adaptive.*responsive design/i,
        answers: [
          "An adaptive design delivers better performance on specific devices, while a responsive design ensures consistent performance across devices",
          "An adaptive design focuses on creating multiple app layouts for specific devices or screen sizes through manual customization, while a responsive design uses a single design that adapts to various screens and devices automatically",
        ],
      },
      {
        question:
          /kwame.*ux designer.*create.*app.*middle.*high school students.*build healthy habits.*empathy.*creativity.*accessibility.*inclusive design/i,
        answers: [
          "Research the age group's physical and mental health challenges in forming healthy habits",
          "Use empathetic language and tone, encouragement and rewards, and accessibility features to encourage students with diverse abilities",
          "Add elements such as stickers, avatars, and color-coded reports creatively to engage the students",
        ],
      },
      {
        question:
          /ricky.*designing.*user experience.*app.*teaches mathematics.*middle school students.*different cultures.*key points/i,
        answers: [
          "Use age-appropriate images and icons suitable for middle school students",
          "Ensure that graphics do not exclude certain cultures",
          "Consider the varying needs of students with different abilities to create an inclusive and accessible design",
        ],
      },
      {
        question:
          /multinational news organization.*redesign.*website.*global audience.*rio.*ux designer.*design approach.*choose/i,
        answers: [
          "To adjust the heavy content automatically across devices, Rio should choose responsive design, as it uses a single code and thus, needs lesser effort",
          "To ensure smooth user experience across all devices, Rio should choose responsive design, as it will eliminate the need for user adjustments",
        ],
      },
    ],
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

    // new primary: get full text from the entire .fr-view container to include multi-paragraph questions
    const frView = activeCard.querySelector(".quiz-card__title .fr-view");
    if (frView) {
      // collect all p/spans text, join, and normalize whitespace
      const parts = Array.from(frView.querySelectorAll("p, span"))
        .map((el) => (el.innerText || "").trim())
        .filter((t) => t && t.toLowerCase() !== "select all that apply."); // i drop boilerplate lines
      if (parts.length) {
        questionText = parts.join(" ").replace(/\s+/g, " ").trim();
      } else {
        questionText = (frView.innerText || "").replace(/\s+/g, " ").trim();
      }
    }

    // fallback 1: specific span inside fr-view (legacy)
    if (!questionText) {
      const titleEl = activeCard.querySelector(
        ".quiz-card__title .fr-view span"
      );
      if (titleEl) {
        questionText = titleEl.innerText.trim();
      }
    }

    // fallback 2: first p inside fr-view (legacy)
    if (!questionText) {
      console.log("🔄 Falling back to .quiz-card__title .fr-view p");
      const titleP = activeCard.querySelector(".quiz-card__title .fr-view p");
      if (titleP) {
        questionText = titleP.innerText.trim();
      }
    }

    // fallback 3: the title container text as a whole
    if (!questionText) {
      console.log("🔄 Falling back to .quiz-card__title direct text");
      const titleDiv = activeCard.querySelector(".quiz-card__title");
      if (titleDiv) {
        questionText = titleDiv.innerText.trim();
      }
    }

    return questionText;
  };

  // i modified this function to return an array of answers for multi-answer support
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
        console.log(
          `✅ Corresponding answers: ${JSON.stringify(pair.answers)}`
        );
        return pair.answers; // i return array instead of single answer
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
        console.warn(
          `⚠️ No question patterns defined for section: "${sectionTitle}"`
        );
        return;
      }

      // i extract the question text and find the answers using regex matching
      const questionText = getQuestionText(activeCard, iframeDoc);
      if (!questionText) {
        console.warn("❌ Could not extract question text");
        return;
      }

      const expectedAnswers = findAnswerByRegex(questionText, qaMap);
      if (!expectedAnswers || !Array.isArray(expectedAnswers)) {
        console.warn("❌ Could not find answers for question");
        return;
      }

      // i use the enhanced function with multiple fallback mechanisms
      const options = getQuizOptions(activeCard);
      let selectedCount = 0;

      const availableOptionsDebug = [];
      const normalizedExpectedAnswers = expectedAnswers.map((ans) =>
        normalize(ans)
      );

      options.forEach((option) => {
        // i use the enhanced function to get answer text with multiple fallbacks
        const answerText = getAnswerText(option, iframeDoc);

        if (answerText) {
          const normalizedAnswer = normalize(answerText);

          availableOptionsDebug.push({
            original: answerText,
            normalized: normalizedAnswer,
          });

          // i check if this answer matches any of the expected answers (for multi-answer support)
          if (normalizedExpectedAnswers.includes(normalizedAnswer)) {
            option.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
            console.log(`✅ Selected correct answer: ${answerText}`);
            selectedCount++;
          }
        }
      });

      if (selectedCount === 0) {
        console.warn("❌ No matching answers found in options.");
        console.log(`🎯 Expected answers: ${JSON.stringify(expectedAnswers)}`);
        console.log(
          `🎯 Normalized expected: ${JSON.stringify(normalizedExpectedAnswers)}`
        );
        console.group("🔍 Available options (for debugging):");
        availableOptionsDebug.forEach((opt, idx) =>
          console.log(
            `#${idx + 1}: Original = "${opt.original}", Normalized = "${
              opt.normalized
            }"`
          )
        );
        console.groupEnd();
      } else {
        console.log(
          `✅ Selected ${selectedCount} correct answer(s) out of ${expectedAnswers.length} expected`
        );
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
