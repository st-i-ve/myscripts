// ==UserScript==
// @name         AI Quiz - Section + Keyword-Based Answer Selector V2.5 (Advanced Pattern Matching)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Auto-selects correct answers using section-based keyword pattern matching, supports single/multi-choice questions
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // i reorganized the data structure to use regex patterns for keyword-based matching within sections
  const sectionPatterns = {
    "introduction to artificial intelligence": {
      "which.*example.*whole brain emulation.*machine.*think.*decisions.*many subjects": "General AI",
      "what.*artificial intelligence": "Techniques that help machines and computers mimic human behavior",
      "which.*basis.*all.*ai systems.*algorithms.*reveal patterns.*trends": "Data",
      "mathematical instructions.*tell.*machine.*finding solutions.*problem": "Algorithm",
      "ai application.*computers.*ability.*understand human language.*spoken": "Natural language processing",
      "key attribute.*artificial intelligence system": "AI systems make predictions",
      "type.*data.*categorized.*qualitative.*cannot.*processed.*analyzed.*conventional": "Unstructured data",
      "likely consequence.*ai.*becoming.*more pervasive.*industries": "Enhanced productivity and the creation of new opportunities",
      "employer.*learn.*social media.*customers.*products.*services": "Social media data contains a mix of structured and unstructured data",
      "accurately describes.*semi-structured data": "Data that combines features of both structured and unstructured data, using metadata for organization",
      "type.*data.*analyzed.*more quickly.*machine learning.*programmable computer": "Unstructured",
      "example.*structured data": "Flight schedules",
      "methods.*learning.*describes.*ai system.*learns.*trial.*error": "Reinforcement learning",
      "level.*ai.*refers.*machines.*perform.*intellectual task.*human": "General AI",
      "ai.*trained.*machine learning.*rapidly map.*best route.*between.*two points": "It performs millions of tiny calculations quickly, trying different routes through trial and error",
      "machine learning.*enable.*decision-making.*complex scenarios.*medical treatment": "By providing probabilistic statements with confidence levels for different treatment options",
      "machine learning.*differs.*classical systems.*structuring unstructured data": "Machine learning offers probabilistic statements instead of binary decisions"
    },
    "what is artificial intelligence?": {
      "example.*whole brain emulation.*machine.*think.*make decisions": "General AI",
      "mathematical instructions.*tell.*machine.*how.*finding solutions": "Algorithm",
      "artificial intelligence": "Techniques that help machines and computers mimic human behavior",
      "basis.*all.*ai systems.*algorithms.*reveal patterns.*trends": "Data",
      "ai application.*computers.*ability.*understand human language.*spoken": "Natural language processing"
    },
    "learn about sustainability": {
      "sustainability.*typically focus": "The needs of current and future generations",
      "conservation.*typically focus": "The protection and preservation of what exists today",
      "sustainability practice.*can.*do.*home": "Turning off lights and appliances not in use",
      "steel-framed windows.*falling.*newly built skyscraper.*advanced technology": "AI analysis of building photos to identify signs of metal fatigue",
      "national chain.*coffeehouses.*initiative.*compostable straws.*pillar.*esg": "Environmental",
      "stillwater simulation.*result.*suggested selling.*lumber.*forest.*conserving.*fish": "A storm destroyed the town",
      "chief technical officer.*healthcare.*keeping patient records confidential.*sharing.*research data": "Hybrid cloud",
      "potential sustainability goal.*newly built steel mill": "Using renewable energy sources to power furnaces and other production equipment",
      "example.*environmental initiative": "conservation of power use",
      "explaining.*esg initiatives.*friend.*actions.*include": "Using alternative power sources"
    },
    "apply ux design": {
      "guidelines.*follow.*design.*consistent user experience.*different platforms": "Ensure that users can seamlessly transition between different devices and platforms without encountering jarring differences in user experience",
      "align branding.*visual elements.*user flows.*products.*span multiple platforms": "Align branding, visual elements, and user flows for products that span multiple platforms",
      "designing.*ux design case study.*details.*ux designers provide.*first step.*define project requirements": "Details of the selected project, potential user challenges, and the goal",
      "good communication.*key skill.*ux designers": ["It helps designers present ideas effectively", "It helps designers advocate user needs to other members of their team", "It helps designers collaborate with other members of their team"],
      "littleseed plants.*users finding.*current navigation complex": "The current navigation isn't intuitive enough, as the users are unable to find the right plants easily",
      "difference.*adaptive.*responsive design": ["An adaptive design delivers better performance on specific devices, while a responsive design ensures consistent performance across devices", "An adaptive design focuses on creating multiple app layouts for specific devices or screen sizes through manual customization, while a responsive design uses a single design that adapts to various screens and devices automatically"],
      "kwame.*ux designer.*app.*middle.*high school students.*build healthy habits.*empathy.*creativity.*accessibility": ["Research the age group's physical and mental health challenges in forming healthy habits", "Use empathetic language and tone, encouragement and rewards, and accessibility features to encourage students with diverse abilities", "Add elements such as stickers, avatars, and color-coded reports creatively to engage the students"],
      "ricky.*designing.*user experience.*app.*teaches mathematics.*middle school students.*different cultures": ["Use age-appropriate images and icons suitable for middle school students", "Ensure that graphics do not exclude certain cultures", "Consider the varying needs of students with different abilities to create an inclusive and accessible design"],
      "multinational news organization.*redesign.*website.*global audience.*varying devices.*screen sizes": ["To adjust the heavy content automatically across devices, Rio should choose responsive design, as it uses a single code and thus, needs lesser effort", "To deliver better performance on specific devices, Rio should choose adaptive design, as the design is optimized for the specific screen or device", "To ensure smooth user experience across all devices, Rio should choose responsive design, as it will eliminate the need for user adjustments"]
    },
    "digital literacy foundations": {
      "ravi.*data analyst.*company.*collected.*large amount.*customer data.*critical step.*ensure.*reliability": "Check whether the tools used for collecting data give stable results over time",
      "justine.*business analyst.*start-up.*understand customer behavior patterns.*data gathering strategy": ["Surveys and questionnaires", "Public data set and government repositories", "Commercial transaction records"],
      "layla.*analyzed.*large amount.*data.*discovered insights.*present.*insights.*executive team": "Use visualizations to show patterns, trends, and key insights",
      "dara.*data scientist.*weather forecasting.*gather.*real-time data.*weather conditions": "Sensors and IoT devices",
      "sara.*collected.*vast amount.*internal.*external data.*customer purchasing habits.*key consideration.*data analysis": "Check her information by comparing it with data from different methods or sources"
    },
    "agile implementation and trends": {
      "winny.*manages.*payroll system.*company.*handle.*monthly process.*distributing salaries.*agile pattern": "Agile operations pattern",
      "first step.*agile patterns.*regardless.*specific pattern": "Mobilize",
      "agile pattern.*suitable.*managing project work.*defined start.*end": "Agile program pattern",
      "lily.*head.*non-profit organization.*expand.*reach.*impact.*five years.*develop.*clear direction": "Agile strategy and governance pattern",
      "team understands.*problems.*challenges.*desired outcomes.*next step.*agile pattern": "Explore the required changes and strategies",
      "statement.*false": "Agile is limited to software work",
      "agile practitioner.*central question.*always ask": "How can I get better today?",
      "agile pattern.*helps business leaders.*develop.*company.*direction": "Agile strategy and governance pattern"
    },
    "agile principles and practices": {
      "first step.*act.*iteration.*learning principle": "Start by doing and trying small pieces of work",
      "principles.*emphasizes.*importance.*groups.*empowered.*manage.*own work": "Self-directed teams",
      "jordan.*friends.*planning.*camping trip.*clearly defining.*goal.*agile principle": "Clarity of outcome",
      "correct sequence.*steps.*act.*clarity.*outcome principle": "Define the problem, determine the user outcome, and keep the user outcome in sight",
      "john.*preparing.*new recipe.*community potluck.*cooking.*small batch.*shares.*friends.*feedback": "Adjust the recipe based on the feedback",
      "agile practice.*allows.*team.*review.*performance.*reflect.*ways.*improve": "Retrospective",
      "creating.*social contract.*step.*involves.*writing.*ideas.*sticky notes": "Brainstorm individually",
      "maxim.*introduces.*mood marbles.*team meeting.*select.*marble.*represents.*current emotional state": "To evaluate how the team is feeling",
      "gathering everyone.*stand-up meeting.*next step": "Have team members give their status updates",
      "shuhari stage.*move away.*traditional methods.*develop.*new approach.*teach.*others": "Ri"
    },
    "run ai models with ibm watson studio": {
      "first save.*notebook.*displays.*editable form.*not": "trusted",
      "watson autoai.*select.*binary classification.*prediction type": "Because predicting risk or no risk has only two options",
      "confusion matrix.*generated.*ai model.*cell.*no risk predicted.*no risk observed": "True negative",
      "selected.*csv file.*all assets.*what.*see": "A list of possible storage locations",
      "services.*provision.*first.*project": "Database storage",
      "provisioned.*database.*cloud object storage.*select.*access.*ai.*machine learning": "Catalog",
      "watson.*test.*four.*different algorithms.*ai model": "To determine which set of algorithms predicted defaults most effectively",
      "run.*several versions.*ai machine learning model.*client.*anticipate repair needs.*identified.*version.*save.*current form": "Continue using it with additional data",
      "save.*model.*jupyter notebook.*ipynb.*file": "To be able to edit the code and algorithms",
      "ai team.*developed.*several models.*visually spot defects.*building construction.*generate.*confusion matrix": "Run them all on the identical batches of new data, then compare their performance"
    },
    "applying artificial intelligence": {
      "olivia.*agricultural scientist.*monitor crop health.*optimize yields.*ai technology.*analyzing.*aerial images": "Deep learning",
      "dr.*smith.*climate scientist.*predicting environmental changes.*ai.*enhance.*accuracy.*climate models": ["Use AI to analyze historical climate data and identify patterns that can enhance the predictive accuracy of climate models", "Use AI to test different climate scenarios and see how they affect the future"],
      "timothy.*manager.*finance company.*improve efficiency.*reduce errors.*repetitive tasks.*data entry.*invoice processing": "Robotic process automation (RPA)",
      "taraji.*healthcare professional.*integrating.*ai diagnostic tool.*patient assessment.*maintain.*patient privacy": "Review the AI tool's privacy policies to understand data handling practices",
      "sophia.*high school science fair.*ai chatbot.*help.*classmates.*homework.*simulate human intelligence": ["The chatbot will use ML algorithms to learn from previous interactions and improve its responses over time", "The chatbot will be able to understand and respond to inputs from her classmates"]
    },
    "introduction to ux design": {
      "statements.*correct.*ux design": "UX design focuses on how users will engage with products, by organizing all aspects for a meaningful user experience",
      "raj.*ux designer.*improve.*usability.*instant messaging app.*correct.*ucd process": "analyze the existing version of the app to identify usability issues, create the updated design, evaluate it, and then implement the changes in the design",
      "fundamental concept.*ux design.*organizes.*structures information.*users.*easily find": "Information architecture (IA)",
      "rukia.*designed.*ux.*online shopping app.*customer feedback.*font.*too small.*color contrast": "Accessibility issues",
      "statements.*correct.*difference.*ui.*ux design": "UI design creates inclusive, accessible, pleasant, and aesthetically pleasing digital interfaces, while UX design focuses on making the entire user experience positive, from start to finish",
      "sam.*ux designer.*groceries app.*customer feedback.*hard.*locate items.*not logically categorized.*information architecture": "IA organizes and structures the information in a way that users easily find what they need",
      "ucd process": "Iterative",
      "zeyad.*ux designer.*team.*working.*exercise app.*completed.*report.*analyzes.*users.*next step": "The design step to create a prototype of the app to make sure the user interface and experience meet his users' expectations and goals"
    },
    "intro to cybersecurity": {
      "lakshmi.*job pays.*1000.*week.*pay stub.*900.*earnings.*altered.*unauthorized.*cia triad": "Integrity",
      "john.*risk assessment specialist.*vulnerability analyst.*identified.*vulnerability.*crucial system.*equation.*calculate.*risk value": "Consequence × Likelihood",
      "rafael.*cybersecurity consultant.*new startup company.*multiple technical controls.*protect systems.*technology element": "Encryption on all hard disk drives",
      "rigorously debated topic.*cybersecurity ethics.*active defense.*ethical debate": "Whether retaliation against cybercriminals is justifiable",
      "cheluchi.*first-year university student.*career.*cybersecurity.*campus job fair.*cybersecurity analyst.*skills.*work.*cybersecurity": "The cybersecurity field welcomes a wide range of skills"
    },
    "ai ethics": {
      "list.*promotion candidates.*generated.*ai system.*indicator.*unwanted bias": ["A group receives a systematic disadvantage", "A group receives a systematic advantage"],
      "true.*bias.*ai systems": "Unwanted bias is a systematic error in AI systems that may result in unfair outcomes",
      "describes.*robust.*ai system": "The AI system can effectively handle malicious attacks without causing unintentional harm",
      "examples.*adversarial attacks.*ai system": ["Poisoning", "Evasion"],
      "interpretability.*degree.*observer.*understand.*cause.*decision": "Interpretability is the degree to which an observer can understand the cause of a decision",
      "describes.*ai system.*everyday people.*no special training.*understand.*how.*why.*particular prediction": "Explainable",
      "sheldon.*creating.*ai recommendation system.*facts.*system.*share.*ensure transparency": ["What data is collected", "Who has access to the data"],
      "order.*trustworthy.*ai system.*must": "transparent",
      "ahbed.*employ.*privacy controls.*model.*deployed": ["Model anonymization", "Differential privacy"],
      "shirley.*arrested.*protesting.*college.*example": "Sensitive personal information (SPI)",
      "grandmother.*netflix.*romantic comedies.*recommendations.*pillar.*ai ethics": "Explainability",
      "rutherford.*implement.*privacy control.*limit.*amount.*personal.*sensitive data.*collected.*granular": "Data minimization",
      "rose.*auditor.*large ai project.*transparency.*framework.*map key details.*teams.*responsible.*algorithms": "Model team",
      "maria.*team.*creating.*ai model.*recruit engineers.*ensure.*data set.*not include.*race.*age.*sex.*ethnicity": "Protected attributes",
      "lester.*ai team.*concerned.*people.*company.*receive equitable treatment.*areas.*ai ethics": "Fairness",
      "ai-powered tutor.*students.*personalize.*learning experiences.*system.*access.*student data.*personal information": "Home address",
      "uma.*large travel booking company.*responsible.*disclosing.*information.*data.*company.*uses.*vacation recommendation": "Transparency",
      "terms.*describes.*systematic errors.*ai systems.*generate unfair decisions": "Bias",
      "daniel.*nursing school.*resume.*excellent.*turned down.*schools.*ai model.*process.*applications": "Females are a privileged group",
      "adds.*random noise.*model training.*reduce.*impact.*single individual.*guarantee.*individual.*training data.*not.*identified": "Differential privacy",
      "x-ray.*graphic.*no disease.*adversary.*adds noise.*data.*ai model.*x-ray.*disease present.*areas.*ai ethics": "Robustness",
      "clara.*evaluate.*ai system.*model b.*more interpretable.*model a": "Model B's flow is clear and easy to understand",
      "nora.*preparing.*data set.*ai system.*patient data.*determine.*information.*sensitive personal information": "Patient name",
      "business roles.*responsible.*deployment.*ai models": "AI Ops Engineer",
      "bao.*reviewing.*diagnostic ai model.*data set.*larger.*extra items.*placed.*ai model.*process.*bogus data.*accurate.*correct diagnoses": "Robustness"
    },
    "all about computer vision": {
      "best use.*computer vision.*self-driving car": "Detecting a stop sign",
      "processes.*used.*ai.*analyze.*small parts.*image.*time.*visual recognition systems.*identify parts": "Convolutional neural network (CNN)",
      "convolutional neural network.*cnn.*used.*ai system.*processes images.*derive meaning": "Identifying patterns and features in images",
      "doctor.*suggest.*ai capability.*help analyze.*x-rays.*computer vision technology": "Convolutional neural network (CNN)",
      "project.*two convolutional neural networks.*working.*against.*generator.*creates.*discriminator.*identifies.*real.*generated": "Generative adversarial network (GAN)"
    },
    "your future in ai: the job landscape": {
      "primary job role.*business intelligence developer": "To analyze complex data, looking at business and market trends to increase profitability of their organization",
      "ai professional.*specializes.*human language.*works.*voice assistants.*speech recognition": "Natural language processing engineer",
      "applying.*entry-level job.*ai professional.*interviewer.*workplace skills": "Communication and teamwork",
      "job interview.*describe.*advanced.*ai technical skills": "Python, TensorFlow, and machine learning",
      "statements.*true.*industries.*ai professionals work": "Most industries have already hired or are in the process of hiring AI professionals"
    },
    "learn natural language processing": {
      "grammatical terms.*describes.*entity.*relation.*chatbots": "Noun",
      "describes.*chatbots differ.*general.*ai systems.*capabilities": "Chatbots are focused on answering specific questions in a limited domain",
      "terms.*used.*describe.*reason.*user sends.*message.*chatbot": "Intent",
      "explains.*detecting emotions.*help.*ai system.*user interactions": "It enables the AI to detect when a customer is frustrated or angry and escalate the issue to a human agent",
      "handling unstructured information.*computers.*sentence segmentation.*break.*information.*smaller chunks.*classified.*sorted": "Tokens",
      "create.*new.*ai application.*suitable use.*nlp": "An AI-powered customer service chatbot that can handle complex inquiries and resolve customer issues",
      "reading reviews.*latest blockbuster movie.*fantastic.*worst movie ever.*process.*ai system.*classify": "Sentiment analysis",
      "natural language processing.*field.*computer science.*concerned": "Understanding and manipulating spoken and written language",
      "messaging channel.*chatbot.*interacts.*user.*asking.*question": "Frontend",
      "complete.*sentence.*more difficult.*ai system.*identifying tokens.*depends.*context": "Classification",
      "ceo.*large retail company.*implementing chatbots.*website.*interact.*customers.*appropriate use.*chatbot": "Answering frequently asked questions (FAQs) about store policy, product availability, and return procedures"
    }
  };

  const normalize = (str) =>
    str
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  // i enhanced this to handle keyword-based pattern matching within sections
  const findMatchingAnswer = (questionText, sectionTitle) => {
    const patterns = sectionPatterns[sectionTitle];
    if (!patterns) {
      console.warn(`⚠️ No patterns defined for section: "${sectionTitle}"`);
      return null;
    }

    const normalizedQuestion = normalize(questionText);
    console.log(`🔍 Searching for pattern match in "${sectionTitle}"`);
    console.log(`📝 Question: "${normalizedQuestion}"`);

    // i search through regex patterns for this section
    for (const [pattern, answer] of Object.entries(patterns)) {
      try {
        const regex = new RegExp(pattern, "i");
        if (regex.test(normalizedQuestion)) {
          console.log(`✅ Pattern matched! "${pattern}" -> Answer:`, answer);
          return Array.isArray(answer) ? answer : [answer];
        }
      } catch (error) {
        console.warn(`⚠️ Invalid regex pattern: "${pattern}"`, error);
      }
    }

    console.log(`❌ No pattern match found for: "${normalizedQuestion}"`);
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

      const sectionTitle = normalize(headerEl.innerText.trim());

      // i extract the question text for pattern matching
      const questionEl = activeCard.querySelector(".quiz-card__title");
      if (!questionEl) {
        console.warn("❌ No question element found");
        return;
      }

      const questionText = questionEl.innerText.trim();
      console.log(`📋 Current question: "${questionText}"`);

      // i use keyword-based pattern matching to find answers
      const expectedAnswers = findMatchingAnswer(questionText, sectionTitle);
      if (!expectedAnswers || expectedAnswers.length === 0) {
        console.warn(`⚠️ No matching answers found for current question`);
        return;
      }

      // i use the enhanced function with multiple fallback mechanisms
      const options = getQuizOptions(activeCard);
      let selectedCount = 0;

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

          // i check if this answer text matches any of the expected answers
          const isMatch = expectedAnswers.some(expectedAnswer => {
            const normalizedExpected = normalize(expectedAnswer);
            // exact match or contains match for partial answers
            return normalizedExpected === normalizedAnswer || 
                   normalizedAnswer.includes(normalizedExpected) ||
                   normalizedExpected.includes(normalizedAnswer);
          });

          if (isMatch) {
            option.dispatchEvent(
              new MouseEvent("click", { bubbles: true, cancelable: true })
            );
            console.log(`✅ Selected correct answer: ${answerText}`);
            selectedCount++;
          }
        }
      });

      if (selectedCount === 0) {
        console.warn("❌ No matching answer found in available options.");
        console.group("🔍 Available options (for debugging):");
        availableOptionsDebug.forEach((opt, idx) =>
          console.log(
            `#${idx + 1}: Original = "${opt.original}", Normalized = "${
              opt.normalized
            }"`
          )
        );
        console.log("🎯 Expected answers:", expectedAnswers);
        console.groupEnd();
      } else {
        console.log(`🎉 Successfully selected ${selectedCount} answer(s)`);
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