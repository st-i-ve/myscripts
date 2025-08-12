// ==UserScript==
// @name         QuizcardV2.5.4_IBM - Enhanced Extraction & Matching
// @namespace    http://tampermonkey.net/
// @version      2.5.4
// @description  Auto-select quiz answers with robust multi-paragraph extraction, enhanced option handling, and fallback matching
// @author       You
// @match        https://skills.yourlearning.ibm.com/activity/PLAN-*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const questionAnswerPairs = {
    "what is artificial intelligence?": [
      {
        question: /what.*ai.*system.*goal/i,
        answers: ["To perform cognitive tasks typically associated with human intelligence"],
      },
      {
        question: /machine learning.*type.*ai.*systems.*learn/i,
        answers: ["From experience or training data"],
      },
      {
        question: /large language model.*best.*described/i,
        answers: ["A type of AI model trained on a large amount of text data"],
      },
      {
        question: /generative.*ai.*systems.*primary.*function/i,
        answers: ["To create new content by learning patterns from existing data"],
      },
      {
        question: /natural language processing.*ai.*concerned.*primarily/i,
        answers: ["Understanding and manipulating written and spoken language"],
      },
      {
        question: /computer vision.*ai.*systems.*primarily.*designed/i,
        answers: ["To interpret and understand visual data"],
      },
      {
        question: /foundation model.*best.*characterized/i,
        answers: ["A large model trained on diverse data that can be adapted for multiple tasks"],
      },
    ],

    "applying ux design": [
      {
        question: /design thinking.*iterative process.*empathize.*define.*ideate.*prototype.*test/i,
        answers: ["All of the above"],
      },
      {
        question: /user.*experience.*design.*primary.*goal/i,
        answers: ["Ensuring that the product meets user needs and provides a meaningful experience"],
      },
      {
        question: /persona.*user.*research/i,
        answers: ["A fictional representation of a target user based on research and data"],
      },
      {
        question: /usability.*testing.*primary.*objective/i,
        answers: ["To identify usability issues and gather user feedback on the design"],
      },
      {
        question: /wireframe.*design.*process/i,
        answers: ["A basic visual guide that shows the structure and layout of a page or screen"],
      },
      {
        question: /user.*journey.*mapping.*help.*designers/i,
        answers: ["Understand the user's experience from start to finish"],
      },
      {
        question: /information.*architecture.*involves/i,
        answers: ["Organizing and structuring content in a way that users can easily navigate and understand"],
      },
      {
        question: /responsive.*design.*ensuring/i,
        answers: ["The design adapts to different screen sizes and devices"],
      },
    ],

    "beyond conservation to sustainability": [
      {
        question: /stillwater.*simulation.*result.*suggested.*selling.*lumber.*forest.*conserving.*fish/i,
        answers: ["The community was deeply upset and strongly opposed your proposal"],
      },
      {
        question: /sustainability.*differ.*conservation/i,
        answers: ["Sustainability focuses on long-term balance, while conservation focuses on preservation"],
      },
      {
        question: /triple.*bottom.*line.*refers/i,
        answers: ["People, Planet, Profit"],
      },
      {
        question: /circular.*economy.*best.*described/i,
        answers: ["A system where resources are reused and recycled to minimize waste"],
      },
      {
        question: /sustainable.*development.*goals.*sdgs.*established/i,
        answers: ["United Nations"],
      },
    ],

    "introduction to ux design": [
      {
        question: /user.*centered.*design.*ucd.*emphasizes/i,
        answers: ["Understanding user needs and designing solutions that meet those needs"],
      },
      {
        question: /design.*thinking.*process.*begins/i,
        answers: ["Empathy"],
      },
      {
        question: /prototype.*design.*process/i,
        answers: ["A testable version of a design concept"],
      },
      {
        question: /user.*interface.*ui.*design.*focuses/i,
        answers: ["Visual elements and interactive components"],
      },
      {
        question: /accessibility.*design.*ensures/i,
        answers: ["Products are usable by people with disabilities"],
      },
      {
        question: /ucd.*process.*iterative.*ux.*designers.*continuously.*gather.*fix.*elements.*user.*feedback.*ensure.*final.*product.*meets.*user.*needs/i,
        answers: ["iterative"],
      },
    ],

    "digital literacy": [
      {
        question: /digital.*literacy.*best.*defined/i,
        answers: ["The ability to effectively use digital tools and technologies"],
      },
      {
        question: /information.*literacy.*involves/i,
        answers: ["The ability to find, evaluate, and use information effectively"],
      },
      {
        question: /digital.*citizenship.*refers/i,
        answers: ["Responsible and ethical use of technology"],
      },
      {
        question: /cybersecurity.*awareness.*important.*digital.*literacy/i,
        answers: ["It helps protect personal and organizational data from threats"],
      },
    ],

    "introduction to cybersecurity": [
      {
        question: /cybersecurity.*primarily.*concerned/i,
        answers: ["Protecting digital information and systems from threats"],
      },
      {
        question: /confidentiality.*cybersecurity.*refers/i,
        answers: ["Ensuring that information is only accessible to authorized individuals"],
      },
      {
        question: /integrity.*cybersecurity.*context.*means/i,
        answers: ["Information remains accurate and unaltered"],
      },
      {
        question: /availability.*cybersecurity.*ensures/i,
        answers: ["Systems and data are accessible when needed"],
      },
      {
        question: /malware.*best.*described/i,
        answers: ["Malicious software designed to damage or disrupt systems"],
      },
      {
        question: /phishing.*attack.*typically.*involves/i,
        answers: ["Deceiving users into providing sensitive information"],
      },
      {
        question: /chief.*technical.*officer.*healthcare.*organization.*problem.*solve.*keeping.*patient.*records.*confidential.*sharing.*lifesaving.*new.*research.*data.*other.*healthcare.*providers.*following.*technologies.*help.*accomplish.*both.*goals/i,
        answers: ["Blockchain"],
      },
    ],

    "foundations of data analysis": [
      {
        question: /data.*analysis.*primary.*purpose/i,
        answers: ["To extract meaningful insights from raw data"],
      },
      {
        question: /descriptive.*analytics.*focuses/i,
        answers: ["What happened in the past"],
      },
      {
        question: /predictive.*analytics.*used/i,
        answers: ["To forecast future trends and outcomes"],
      },
      {
        question: /data.*visualization.*important/i,
        answers: ["It makes complex data easier to understand and interpret"],
      },
    ],

    "agile fundamentals": [
      {
        question: /agile.*methodology.*emphasizes/i,
        answers: ["Iterative development and collaboration"],
      },
      {
        question: /scrum.*framework.*sprint.*typically.*lasts/i,
        answers: ["1-4 weeks"],
      },
      {
        question: /product.*owner.*agile.*team.*responsible/i,
        answers: ["Defining requirements and priorities"],
      },
      {
        question: /daily.*standup.*meeting.*primary.*purpose/i,
        answers: ["To synchronize team activities and identify obstacles"],
      },
      {
        question: /following.*statements.*false.*agile/i,
        answers: ["Agile is limited to software work"],
      },
    ],

    "introduction to cloud computing": [
      {
        question: /cloud.*computing.*best.*described/i,
        answers: ["Delivery of computing services over the internet"],
      },
      {
        question: /infrastructure.*service.*iaas.*provides/i,
        answers: ["Virtualized computing resources over the internet"],
      },
      {
        question: /platform.*service.*paas.*offers/i,
        answers: ["A platform for developing and deploying applications"],
      },
      {
        question: /software.*service.*saas.*delivers/i,
        answers: ["Software applications over the internet"],
      },
      {
        question: /public.*cloud.*deployment.*model.*means/i,
        answers: ["Services are available to the general public over the internet"],
      },
    ],

    "introduction to artificial intelligence": [
      {
        question: /machine.*learning.*subset.*ai.*enables.*systems/i,
        answers: ["To learn and improve from experience without being explicitly programmed"],
      },
      {
        question: /supervised.*learning.*involves/i,
        answers: ["Training algorithms on labeled datasets"],
      },
      {
        question: /unsupervised.*learning.*used.*when/i,
        answers: ["Working with unlabeled data to find hidden patterns"],
      },
      {
        question: /neural.*networks.*inspired/i,
        answers: ["The structure and function of the human brain"],
      },
      {
        question: /deep.*learning.*characterized/i,
        answers: ["Neural networks with multiple hidden layers"],
      },
    ],

    "ai ethics and governance": [
      {
        question: /bias.*ai.*systems.*result.*from/i,
        answers: ["Biased training data or algorithms"],
      },
      {
        question: /transparency.*ai.*means/i,
        answers: ["Making AI decision-making processes understandable"],
      },
      {
        question: /accountability.*ai.*governance.*refers/i,
        answers: ["Taking responsibility for AI system outcomes"],
      },
      {
        question: /explainable.*ai.*xai.*important/i,
        answers: ["It helps users understand how AI systems make decisions"],
      },
    ],

    "generative ai fundamentals": [
      {
        question: /generative.*ai.*models.*trained/i,
        answers: ["To create new content based on learned patterns"],
      },
      {
        question: /large.*language.*models.*llms.*generate/i,
        answers: ["Human-like text based on input prompts"],
      },
      {
        question: /prompt.*engineering.*involves/i,
        answers: ["Crafting effective input prompts for AI models"],
      },
      {
        question: /fine.*tuning.*ai.*model.*means/i,
        answers: ["Adapting a pre-trained model for specific tasks"],
      },
      {
        question: /hallucination.*ai.*context.*refers/i,
        answers: ["When AI generates false or nonsensical information"],
      },
    ],

    "prompt engineering fundamentals": [
      {
        question: /effective.*prompt.*design.*should.*include/i,
        answers: ["Clear instructions and context"],
      },
      {
        question: /few.*shot.*prompting.*involves/i,
        answers: ["Providing examples in the prompt"],
      },
      {
        question: /zero.*shot.*prompting.*means/i,
        answers: ["Asking the model to perform a task without examples"],
      },
      {
        question: /chain.*thought.*prompting.*helps/i,
        answers: ["Guide the model through step-by-step reasoning"],
      },
    ],

    "natural language processing with python": [
      {
        question: /tokenization.*nlp.*process/i,
        answers: ["Breaking text into individual words or tokens"],
      },
      {
        question: /stemming.*nlp.*reduces.*words/i,
        answers: ["To their root form"],
      },
      {
        question: /named.*entity.*recognition.*ner.*identifies/i,
        answers: ["Specific entities like names, locations, and organizations"],
      },
      {
        question: /sentiment.*analysis.*determines/i,
        answers: ["The emotional tone of text"],
      },
      {
        question: /word.*embeddings.*represent/i,
        answers: ["Words as numerical vectors"],
      },
    ],

    "watsonx fundamentals": [
      {
        question: /watsonx.*ai.*platform.*designed/i,
        answers: ["To help organizations build and deploy AI models"],
      },
      {
        question: /watsonx.*data.*provides/i,
        answers: ["Data management and governance capabilities"],
      },
      {
        question: /watsonx.*governance.*focuses/i,
        answers: ["AI lifecycle management and compliance"],
      },
      {
        question: /foundation.*models.*watsonx.*can.*be/i,
        answers: ["Customized for specific business needs"],
      },
    ],
  };

  // enhanced normalization - handles smart quotes, em dashes, nbsp, and whitespace
  const normalize = (str) => {
    if (!str) return "";
    return str
      .replace(/[\u2018\u2019]/g, "'") // smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // smart double quotes
      .replace(/[\u2013\u2014]/g, "-") // em/en dashes
      .replace(/\u00A0/g, " ") // non-breaking space
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
      .replace(/[^\w\s]|_/g, "") // punctuation
      .replace(/\s+/g, " ") // collapse whitespace
      .toLowerCase()
      .trim();
  };

  // robust question extraction - handles mixed content, nested elements, and line breaks
  const getQuestionText = (activeCard, doc) => {
    const frView = activeCard.querySelector(".quiz-card__title .fr-view");
    if (!frView) {
      // fallback to direct title container
      const titleDiv = activeCard.querySelector(".quiz-card__title");
      return titleDiv ? normalize(titleDiv.innerText) : "";
    }

    // i collect all text nodes, respecting structure and line breaks
    const extractTextWithBreaks = (element) => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      const textParts = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text && text.toLowerCase() !== "select all that apply.") {
            textParts.push(text);
          }
        } else if (node.tagName.toLowerCase() === 'br') {
          textParts.push(" "); // i treat br as space separator
        }
      }
      return textParts.join(" ").replace(/\s+/g, " ").trim();
    };

    let questionText = extractTextWithBreaks(frView);

    // fallback methods if advanced extraction fails
    if (!questionText) {
      // try p and span collection
      const elements = frView.querySelectorAll("p, span, li, strong, em");
      if (elements.length) {
        const parts = Array.from(elements)
          .map(el => (el.innerText || "").trim())
          .filter(t => t && t.toLowerCase() !== "select all that apply.");
        questionText = parts.join(" ").replace(/\s+/g, " ").trim();
      }
    }

    if (!questionText) {
      // final fallback - direct text content
      questionText = (frView.innerText || "").replace(/\s+/g, " ").trim();
    }

    return questionText;
  };

  // unified option extraction - handles both input and role-based patterns
  const getQuizOptions = (container) => {
    // pattern 1: role-based (aria) elements
    let options = container.querySelectorAll('[role="radio"], [role="checkbox"]');
    
    if (options.length === 0) {
      // pattern 2: input elements with labels
      options = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    }

    if (options.length === 0) {
      // pattern 3: quiz-specific class-based selection
      options = container.querySelectorAll(
        '.quiz-multiple-choice-option__input, .quiz-multiple-response-option__input'
      );
    }

    return options;
  };

  // robust answer text extraction - handles aria-labelledby and nested structures
  const getAnswerText = (option, doc) => {
    // method 1: aria-labelledby resolution
    const labelId = option.getAttribute("aria-labelledby");
    if (labelId) {
      const labelEl = doc.getElementById(labelId);
      if (labelEl) {
        return (labelEl.innerText || "").trim();
      }
    }

    // method 2: traverse to find text container
    const findTextContainer = (element) => {
      // look for common text container classes
      const selectors = [
        ".quiz-multiple-choice-option__text",
        ".quiz-multiple-choice-option__label",
        ".quiz-multiple-response-option__text",
        ".quiz-multiple-response-option__label"
      ];

      for (const selector of selectors) {
        const textEl = element.querySelector(selector) || element.closest("label")?.querySelector(selector);
        if (textEl) {
          return (textEl.innerText || "").trim();
        }
      }
      return null;
    };

    // search from option element and its parent structures
    let answerText = findTextContainer(option);
    if (answerText) return answerText;

    const parentLabel = option.closest("label") || 
                        option.closest(".quiz-multiple-choice-option") ||
                        option.closest(".quiz-multiple-choice-option-wrap") ||
                        option.closest(".quiz-multiple-response-option");
    
    if (parentLabel) {
      answerText = findTextContainer(parentLabel);
      if (answerText) return answerText;

      // final fallback - direct text content
      answerText = (parentLabel.innerText || "").trim();
      // i filter out just the option text, not the whole label structure
      const lines = answerText.split('\n').map(l => l.trim()).filter(l => l);
      return lines.length > 0 ? lines[lines.length - 1] : answerText;
    }

    return "";
  };

  // enhanced regex matching with fallback to option-level matching for generic questions
  const findAnswerByRegex = (questionText, qaMap) => {
    if (!questionText || !qaMap || qaMap.length === 0) {
      return null;
    }

    const normalizedQuestion = normalize(questionText);
    console.log(`🔍 Searching for question: "${questionText}"`);
    console.log(`🔍 Normalized: "${normalizedQuestion}"`);

    // primary match - regex patterns
    for (const pair of qaMap) {
      if (pair.question.test(normalizedQuestion)) {
        console.log(`✅ Found matching pattern: ${pair.question}`);
        console.log(`✅ Corresponding answers: ${JSON.stringify(pair.answers)}`);
        return pair.answers;
      }
    }

    // fallback for generic question stems
    const genericStems = [
      "which of the following statements is false",
      "which of the following is true",
      "which of the following statements is correct",
      "fill in the blank",
      "complete the sentence",
      "select all that apply"
    ];

    const isGeneric = genericStems.some(stem => normalizedQuestion.includes(stem));
    if (isGeneric) {
      console.log("🔄 Generic question detected, option-level matching available if needed");
    }

    console.warn("❌ No regex pattern matched the question");
    return null;
  };

  // option-level fallback matching for when regex fails on generic questions
  const findAnswersByOptions = (options, expectedAnswers, doc) => {
    const normalizedExpected = expectedAnswers.map(ans => normalize(ans));
    const matches = [];

    options.forEach(option => {
      const answerText = getAnswerText(option, doc);
      if (answerText) {
        const normalizedAnswer = normalize(answerText);
        
        // exact match first
        if (normalizedExpected.includes(normalizedAnswer)) {
          matches.push(option);
        } else {
          // contains fallback
          const hasMatch = normalizedExpected.some(expected => 
            normalizedAnswer.includes(expected) || expected.includes(normalizedAnswer)
          );
          if (hasMatch) {
            matches.push(option);
          }
        }
      }
    });

    return matches;
  };

  // consistent selection state detection
  const isSelected = (option) => {
    // input elements
    if (option.type === "radio" || option.type === "checkbox") {
      return option.checked;
    }
    // aria elements
    return option.getAttribute("aria-checked") === "true" || 
           option.getAttribute("aria-selected") === "true";
  };

  // main execution logic
  setInterval(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headerEl = iframeDoc.querySelector(".nav-sidebar-header__title");
      const activeCard = iframeDoc.querySelector(".quiz__wrap .quiz-item__card--active");
      if (!headerEl || !activeCard) return;

      const sectionTitle = headerEl.innerText.trim().toLowerCase();
      const qaMap = questionAnswerPairs[sectionTitle];

      if (!qaMap || !Array.isArray(qaMap)) {
        console.warn(`⚠️ No question patterns defined for section: "${sectionTitle}"`);
        return;
      }

      // i extract question text with robust handling
      const questionText = getQuestionText(activeCard, iframeDoc);
      if (!questionText) {
        console.warn("❌ Could not extract question text");
        return;
      }

      // i try regex matching first
      let expectedAnswers = findAnswerByRegex(questionText, qaMap);
      const options = getQuizOptions(activeCard);
      let selectedCount = 0;

      if (expectedAnswers && Array.isArray(expectedAnswers)) {
        // standard regex-based matching
        const availableOptionsDebug = [];
        const normalizedExpectedAnswers = expectedAnswers.map(ans => normalize(ans));

        options.forEach((option) => {
          const answerText = getAnswerText(option, iframeDoc);
          if (answerText) {
            const normalizedAnswer = normalize(answerText);
            availableOptionsDebug.push({ original: answerText, normalized: normalizedAnswer });

            // exact match
            let shouldSelect = normalizedExpectedAnswers.includes(normalizedAnswer);
            
            // contains fallback if exact fails
            if (!shouldSelect) {
              shouldSelect = normalizedExpectedAnswers.some(expected => 
                normalizedAnswer.includes(expected) || expected.includes(normalizedAnswer)
              );
            }

            if (shouldSelect && !isSelected(option)) {
              option.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
              console.log(`✅ Selected answer: ${answerText}`);
              selectedCount++;
            }
          }
        });

        if (selectedCount === 0) {
          console.warn("❌ No matching answers found in options.");
          console.log(`🎯 Expected: ${JSON.stringify(expectedAnswers)}`);
          console.log(`🎯 Normalized expected: ${JSON.stringify(normalizedExpectedAnswers)}`);
          console.group("🔍 Available options:");
          availableOptionsDebug.forEach((opt, idx) =>
            console.log(`#${idx + 1}: "${opt.original}" → "${opt.normalized}"`)
          );
          console.groupEnd();
        } else {
          console.log(`✅ Selected ${selectedCount} correct answer(s)`);
        }
      } else {
        console.warn("❌ Could not find answers for question - no fallback implemented yet");
      }

      // submit logic
      if (selectedCount > 0) {
        setTimeout(() => {
          const submitBtn = activeCard.querySelector(
            "button.quiz-card__button:not(.quiz-card__button--disabled):not(.quiz-card__button--next)"
          );
          if (submitBtn) {
            console.log("🧠 Clicking submit");
            submitBtn.click();
          }
        }, 300);
      }

      // next button logic
      setTimeout(() => {
        const nextButton = activeCard.querySelector("button.quiz-card__button--next:not([disabled])");
        if (nextButton && !nextButton.classList.contains("visually-hidden-always")) {
          console.log("➡️ Clicking next");
          nextButton.click();
        }
      }, 1000);

    } catch (error) {
      console.error("❌ Error in quiz automation:", error);
    }
  }, 1000);

  console.log("🎯 QuizcardV2.5.4_IBM loaded with enhanced extraction and matching");
})();