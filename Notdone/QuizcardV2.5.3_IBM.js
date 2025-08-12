// ==UserScript==
// @name         AI Quiz - Question-Based Regex Answer Selector V2.5.3 (All Sections)
// @namespace    http://tampermonkey.net/
// @version      2.5.3
// @description  Auto-selects correct answers using regex pattern matching with multi-answer checkbox support - All sections included
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // i extended the question-answer patterns to include all sections from quizibm.txt
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
    "beyond conservation to sustainability": [
      {
        question:
          /steel.*framed windows.*falling.*skyscraper.*advanced technology.*solve/i,
        answers: [
          "AI analysis of building photos to identify signs of metal fatigue",
        ],
      },
      {
        question: /what.*sustainability.*typically focus on/i,
        answers: ["The needs of current and future generations"],
      },
      {
        question: /what.*conservation.*typically focus on/i,
        answers: ["The protection and preservation of what exists today"],
      },
      {
        question: /sustainability practice.*can do at home/i,
        answers: ["Turning off lights and appliances not in use"],
      },
      {
        question:
          /national chain.*coffeehouses.*compostable straws.*pillar.*esg/i,
        answers: ["Environmental"],
      },
      {
        question:
          /(?=.*stillwater simulation)(?=.*selling (the )?lumber)(?=.*conserving the fish)(?=.*result)/i,
        answers: ["A storm destroyed the town"],
      },
      {
        question:
          /(?=.*healthcare.*organization)(?=.*patient.*records)(?=.*confidential|privacy)(?=.*sharing)(?=.*research.*data)(?=.*technolog(y|ies))/i,
        answers: ["Hybrid cloud"],
      },
      {
        question: /potential sustainability goal.*newly built steel mill/i,
        answers: [
          "Using renewable energy sources to power furnaces and other production equipment",
        ],
      },
      {
        question: /example.*environmental initiative/i,
        answers: ["conservation of power use"],
      },
      {
        question: /esg initiatives.*which.*actions.*include/i,
        answers: ["Using alternative power sources"],
      },
    ],
    "introduction to ux design": [
      {
        question: /which.*statements?.*correct.*(ui|ux) design/i,
        answers: [
          "UI design creates inclusive, accessible, pleasant, and aesthetically pleasing digital interfaces, while UX design focuses on making the entire user experience positive, from start to finish.",
          "UX design focuses on how users will engage with products, by organizing all aspects for a meaningful user experience.",
        ],
      },

      {
        question: /which.*statements?.*correct.*(ui|ux) design/i,
        answers: [
          "UX design focuses on how users will engage with products, by organizing all aspects for a meaningful user experience.",
        ],
      },
      {
        question:
          /(?=.*raj)(?=.*ux.*designer)(?=.*improve.*usability)(?=.*instant.*messaging.*app)(?=.*correct.*ucd.*process)/i,
        answers: [
          "analyze the existing version of the app to identify usability issues, create the updated design, evaluate it, and then implement the changes in the design",
        ],
      },
      {
        question:
          /fundamental concept.*ux design.*organizes.*structures information.*users.*easily find/i,
        answers: ["Information architecture (IA)"],
      },
      {
        question:
          /rukia.*online shopping app.*font.*small.*color contrast.*type.*issue/i,
        answers: ["Accessibility issues"],
      },
      {
        question:
          /sam.*ux designer.*groceries app.*items.*not logically categorized.*information architecture.*help/i,
        answers: [
          "IA helps to create the architecture of the software application",
        ],
      },
      {
        question:
          /(?=.*fill in the blank)(?=.*ucd.*process)(?=.*user.*feedback)(?=.*ux.*designers)/i,
        answers: ["Iterative"],
      },
      {
        question:
          /(?=.*zeyad)(?=.*ux.*designer)(?=.*exercise.*app)(?=.*analyzes.*users)(?=.*next.*step)(?=.*ucd.*process)/i,
        answers: [
          "The design step to create a prototype of the app to make sure the user interface and experience meet his users' expectations and goals",
        ],
      },
    ],
    "digital literacy: the what, why, and how of digital data": [
      {
        question:
          /ravi.*data analyst.*customer data.*critical step.*reliability.*data analysis/i,
        answers: [
          "Check whether the tools used for collecting data give stable results over time",
        ],
      },
      {
        question:
          /justine.*business analyst.*customer behavior patterns.*data gathering strategy.*effective/i,
        answers: [
          "Surveys and questionnaires",
          "Public data set and government repositories",
          "Commercial transaction records",
        ],
      },
      {
        question:
          /layla.*data.*insights.*present.*executive team.*effective strategy/i,
        answers: [
          "Use visualizations to show patterns, trends, and key insights",
        ],
      },
      {
        question:
          /dara.*data scientist.*weather forecasting.*real.*time data.*weather conditions.*data gathering method/i,
        answers: ["Sensors and IoT devices"],
      },
      {
        question:
          /sara.*customer purchasing habits.*data analysis.*validity.*results.*key consideration/i,
        answers: [
          "Check her information by comparing it with data from different methods or sources",
        ],
      },
    ],
    "a taste of agile - implementation and trends": [
      {
        question:
          /winny.*payroll system.*monthly process.*distributing salaries.*agile pattern/i,
        answers: ["Agile operations pattern"],
      },
      {
        question: /first step.*agile patterns.*specific pattern/i,
        answers: ["Mobilize"],
      },
      {
        question: /agile pattern.*managing project work.*defined start.*end/i,
        answers: ["Agile program pattern"],
      },
      {
        question:
          /lily.*non.*profit organization.*expand.*reach.*impact.*five years.*agile pattern/i,
        answers: ["Agile strategy and governance pattern"],
      },
      {
        question:
          /team understands.*problems.*challenges.*desired outcomes.*next step.*agile pattern/i,
        answers: ["Explore the required changes and strategies"],
      },
      {
        question: /which.*statements?.*false/i,
        answers: ["Agile is limited to software work"],
      },
      {
        question: /agile practitioner.*central question.*always ask/i,
        answers: ["How can I get better today?"],
      },
      {
        question:
          /agile pattern.*business leaders.*develop.*company.*direction/i,
        answers: ["Agile strategy and governance pattern"],
      },
    ],
    "a taste of agile - principles and practices": [
      {
        question: /first step.*act.*iteration.*learning principle/i,
        answers: ["Start by doing and trying small pieces of work"],
      },
      {
        question: /principle.*emphasizes.*groups.*empowered.*manage.*own work/i,
        answers: ["Self-directed teams"],
      },
      {
        question:
          /jordan.*camping trip.*clearly defining.*goal.*agile principle/i,
        answers: ["Clarity of outcome"],
      },
      {
        question: /correct sequence.*steps.*clarity.*outcome principle/i,
        answers: [
          "Define the problem, determine the user outcome, and keep the user outcome in sight",
        ],
      },
      {
        question: /john.*recipe.*community potluck.*feedback.*next step/i,
        answers: ["Adjust the recipe based on the feedback"],
      },
      {
        question:
          /agile practice.*team.*review.*performance.*reflect.*improve/i,
        answers: ["Retrospective"],
      },
      {
        question: /social contract.*writing.*ideas.*sticky notes.*wall/i,
        answers: ["Brainstorm individually"],
      },
      {
        question:
          /maxim.*mood marbles.*team members.*emotional state.*purpose/i,
        answers: ["To evaluate how the team is feeling"],
      },
      {
        question: /gathering.*stand.*up meeting.*next step/i,
        answers: ["Have team members give their status updates"],
      },
      {
        question:
          /shuhari stage.*move away.*traditional methods.*develop.*new approach.*teach/i,
        answers: ["Ri"],
      },
    ],
    "run ai models with ibm watson studio": [
      {
        question: /first save.*notebook.*displays.*editable form.*not/i,
        answers: ["trusted"],
      },
      {
        question:
          /watson autoai.*select.*binary classification.*prediction type/i,
        answers: ["Because predicting risk or no risk has only two options"],
      },
      {
        question:
          /confusion matrix.*cell.*no risk predicted.*no risk observed/i,
        answers: ["True positive"],
      },
      {
        question: /selected.*csv file.*all assets.*what.*see/i,
        answers: ["A list of possible storage locations"],
      },
      {
        question: /services.*provision.*first.*project/i,
        answers: ["Database storage"],
      },
      {
        question:
          /provisioned.*database.*cloud object storage.*select.*ai.*machine learning/i,
        answers: ["Catalog"],
      },
      {
        question: /watson.*test.*four.*different algorithms.*ai model/i,
        answers: [
          "To determine which set of algorithms predicted defaults most effectively",
        ],
      },
      {
        question:
          /ai machine learning model.*client.*anticipate repair needs.*machine.*assembly line.*save.*current form/i,
        answers: ["Continue using it with additional data"],
      },
      {
        question: /save.*model.*jupyter notebook.*ipynb.*file/i,
        answers: [
          "t o be able to edit the code and algorithms",
          "To be able to use it with a different data set",
        ],
      },
      {
        question:
          /ai team.*models.*visually spot defects.*building construction.*confusion matrix.*select.*best/i,
        answers: [
          "Run them all on the identical batches of new data, then compare their performance",
        ],
      },
    ],
    "applying artificial intelligence": [
      {
        question:
          /olivia.*agricultural scientist.*monitor crop health.*analyze.*aerial images.*ai technology/i,
        answers: ["Deep learning"],
      },
      {
        question:
          /dr.*smith.*climate scientist.*ai.*enhance.*climate models.*address.*complex issue/i,
        answers: [
          "Use AI to analyze historical climate data and identify patterns that can enhance the predictive accuracy of climate models",
          "Use AI to test different climate scenarios and see how they affect the future",
        ],
      },
      {
        question:
          /timothy.*manager.*finance company.*improve efficiency.*reduce errors.*repetitive tasks.*ai technology/i,
        answers: ["Robotic process automation (RPA)"],
      },
      {
        question:
          /taraji.*healthcare professional.*ai diagnostic tool.*patient privacy.*maintain/i,
        answers: [
          "Review the AI tool's privacy policies to understand data handling practices",
        ],
      },
      {
        question:
          /sophia.*ai chatbot.*homework.*simulate human intelligence.*points.*include/i,
        answers: [
          "The chatbot will use ML algorithms to learn from previous interactions and improve its responses over time",
          "The chatbot will be able to understand and respond to inputs from her classmates",
        ],
      },
    ],
    "introduction to artificial intelligence": [
      {
        question:
          /eras.*computing.*ibm system.*beat.*chess champion.*robot drive.*desert trail.*ibm watson.*jeopardy/i,
        answers: ["Era of AI"],
      },
      {
        question:
          /types.*data.*categorized.*qualitative data.*cannot.*processed.*analyzed.*conventional.*tools/i,
        answers: ["Unstructured data"],
      },
      {
        question: /likely consequence.*ai.*pervasive.*industries/i,
        answers: [
          "Enhanced productivity and the creation of new opportunities",
        ],
      },
      {
        question:
          /employer.*learn.*social media.*customers.*products.*services.*best reason.*ai system/i,
        answers: [
          "Social media data contains a mix of structured and unstructured data",
        ],
      },
      {
        question: /statements.*accurately describes.*semi.*structured data/i,
        answers: [
          "Data that combines features of both structured and unstructured data, using metadata for organization",
        ],
      },
      {
        question:
          /types.*data.*analyzed.*quickly.*machine learning.*programmable computer/i,
        answers: ["Unstructured"],
      },
      {
        question: /key attribute.*artificial intelligence system/i,
        answers: ["AI systems make predictions"],
      },
      {
        question: /example.*structured data/i,
        answers: ["Flight schedules"],
      },
      {
        question: /methods.*learning.*ai system.*learns.*trial.*error/i,
        answers: ["Reinforcement learning"],
      },
      {
        question: /level.*ai.*machines.*perform.*intellectual task.*human/i,
        answers: ["General AI"],
      },
      {
        question:
          /explains.*ai.*trained.*machine learning.*rapidly map.*best route.*two points.*map/i,
        answers: [
          "It performs millions of tiny calculations quickly, trying different routes through trial and error",
        ],
      },
      {
        question:
          /ai system.*help doctors.*treat patients.*machine learning.*enable.*decision.*making.*complex scenarios.*medical treatment/i,
        answers: [
          "By providing probabilistic statements with confidence levels for different treatment options",
        ],
      },
      {
        question:
          /machine learning.*differs.*classical systems.*structuring.*unstructured data/i,
        answers: [
          "Machine learning offers probabilistic statements instead of binary decisions",
        ],
      },
    ],
    "introduction to cybersecurity": [
      {
        question:
          /lakshmi.*job.*pay stub.*earnings.*altered.*cia triad.*protect.*payroll data.*unauthorized modification/i,
        answers: ["Integrity"],
      },
      {
        question:
          /john.*risk assessment specialist.*vulnerability.*crucial system.*equation.*calculate.*risk value/i,
        answers: ["Consequence × Likelihood"],
      },
      {
        question:
          /rafael.*cybersecurity consultant.*startup.*technical controls.*technology element/i,
        answers: ["Encryption on all hard disk drives"],
      },
      {
        question: /ethical debate.*active defense.*cybersecurity/i,
        answers: ["Whether retaliation against cybercriminals is justifiable"],
      },
      {
        question:
          /cheluchi.*university student.*career.*cybersecurity.*skills.*work.*cybersecurity/i,
        answers: ["The cybersecurity field welcomes a wide range of skills"],
      },
    ],
    "ai ethics": [
      {
        question: /promotion candidates.*ai system.*indicator.*unwanted bias/i,
        answers: [
          "A group receives a systematic disadvantage",
          "A group receives a systematic advantage",
        ],
      },
      {
        question: /true.*bias.*ai systems/i,
        answers: [
          "Unwanted bias is a systematic error in AI systems that may result in unfair outcomes",
        ],
      },
      {
        question: /describes.*robust.*ai system/i,
        answers: [
          "The AI system can effectively handle malicious attacks without causing unintentional harm",
        ],
      },
      {
        question: /examples.*adversarial attacks.*ai system/i,
        answers: ["Poisoning", "Evasion"],
      },
      {
        question:
          /interpretability.*degree.*observer.*understand.*cause.*decision/i,
        answers: [
          "Interpretability is the degree to which an observer can understand the cause of a decision",
        ],
      },
      {
        question:
          /ai system.*everyday people.*special training.*understand.*prediction.*recommendation/i,
        answers: ["Explainable"],
      },
      {
        question: /sheldon.*ai recommendation system.*share.*transparency/i,
        answers: ["What data is collected", "Who has access to the data"],
      },
      {
        question: /trustworthy.*ai system.*must be/i,
        answers: ["transparent"],
      },
      {
        question: /ahbed.*privacy controls.*model.*deployed/i,
        answers: ["Model anonymization", "Differential privacy"],
      },
      {
        question: /shirley.*arrested.*protesting.*college.*example/i,
        answers: ["Sensitive personal information (SPI)"],
      },
      {
        question: /netflix.*recommendations.*grandmother.*pillar.*ai ethics/i,
        answers: ["Explainability"],
      },
      {
        question:
          /rutherford.*privacy control.*limit.*(personal|sensitive).*data.*minimization/i,
        answers: ["Data minimization"],
      },
      {
        question:
          /rose.*auditor.*ai project.*transparency.*algorithms.*train.*ai/i,
        answers: ["Model team"],
      },
      {
        question:
          /maria.*ai model.*recruit engineers.*attributes.*race.*age.*sex.*ethnicity/i,
        answers: ["Protected attributes"],
      },
      {
        question: /lester.*ai team.*equitable treatment.*ai ethics/i,
        answers: ["Fairness"],
      },
      {
        question:
          /ai.?powered tutor.*students.*personal information.*(home address|PI)/i,
        answers: ["Home address"],
      },
      {
        question:
          /uma.*travel booking company.*vacation recommendation.*ai system/i,
        answers: ["Transparency"],
      },
      {
        question: /systematic errors.*ai systems.*unfair decisions/i,
        answers: ["Bias"],
      },
      {
        question:
          /daniel.*nursing school.*ai model.*admissions.*majority.*accepted.*female/i,
        answers: ["Females are a privileged group"],
      },
      {
        question:
          /adds.*random noise.*model training.*individual.*identified.*differential privacy/i,
        answers: ["Differential privacy"],
      },
      {
        question: /x.*ray.*adversary.*noise.*robustness/i,
        answers: ["Robustness"],
      },
      {
        question: /clara.*ai system.*model b.*interpretable.*model a/i,
        answers: ["Model B's flow is clear and easy to understand"],
      },
      {
        question:
          /nora.*(data set|patient data).*sensitive personal information.*(removed|qualifies|needs to be removed)/i,
        answers: ["Patient name"],
      },
      {
        question: /business roles.*deployment.*ai models/i,
        answers: ["AI Ops Engineer"],
      },
      {
        question:
          /bao.*diagnostic.*ai model.*data set.*(larger|extra items).*bogus.*robustness/i,
        answers: ["Robustness"],
      },
    ],
    "all about computer vision": [
      {
        question: /best use.*computer vision.*self.*driving car/i,
        answers: ["Detecting a stop sign"],
      },
      {
        question:
          /processes.*ai.*analyze.*small parts.*image.*visual recognition.*identify/i,
        answers: ["Convolutional neural network (CNN)"],
      },
      {
        question:
          /convolutional neural network.*cnn.*ai system.*processes images.*derive meaning/i,
        answers: ["Identifying patterns and features in images"],
      },
      {
        question:
          /doctor.*ai capability.*analyze.*x.*rays.*computer vision technology/i,
        answers: ["Convolutional neural network (CNN)"],
      },
      {
        question:
          /project.*two.*convolutional neural networks.*cnns.*generator.*discriminator.*competitive/i,
        answers: ["Generative adversarial network (GAN)"],
      },
    ],
    "your future in ai: the job landscape": [
      {
        question: /primary job role.*business intelligence developer/i,
        answers: [
          "To analyze complex data, looking at business and market trends to increase profitability of their organization",
        ],
      },
      {
        question:
          /ai professional.*specializes.*human language.*voice assistants.*speech recognition/i,
        answers: ["Natural language processing engineer"],
      },
      {
        question: /entry.*level job.*ai professional.*workplace skills/i,
        answers: ["Communication and teamwork"],
      },
      {
        question: /job interview.*advanced.*ai technical skills/i,
        answers: ["Python, TensorFlow, and machine learning"],
      },
      {
        question: /industries.*ai professionals work/i,
        answers: [
          "Most industries have already hired or are in the process of hiring AI professionals",
        ],
      },
    ],
    "natural language processing": [
      {
        question: /grammatical terms.*describes.*entity.*chatbots/i,
        answers: ["Noun"],
      },
      {
        question:
          /describes.*chatbots.*differ.*general.*ai systems.*capabilities/i,
        answers: [
          "Chatbots are focused on answering specific questions in a limited domain",
        ],
      },
      {
        question: /terms.*reason.*user sends.*message.*chatbot/i,
        answers: ["Intent"],
      },
      {
        question: /detecting emotions.*help.*ai system.*user interactions/i,
        answers: [
          "It enables the AI to detect when a customer is frustrated or angry and escalate the issue to a human agent",
        ],
      },
      {
        question:
          /handling unstructured information.*sentence segmentation.*smaller chunks.*term/i,
        answers: ["Tokens"],
      },
      {
        question: /ai application.*suitable use.*nlp/i,
        answers: [
          "An AI-powered customer service chatbot that can handle complex inquiries and resolve customer issues",
        ],
      },
      {
        question:
          /reviews.*movie.*fantastic.*worst movie.*ai system.*classify/i,
        answers: ["Sentiment analysis"],
      },
      {
        question:
          /natural language processing.*field.*computer science.*concerned/i,
        answers: ["Understanding and manipulating spoken and written language"],
      },
      {
        question: /messaging channel.*chatbot.*interacts.*user/i,
        answers: ["Frontend"],
      },
      {
        question:
          /complete.*sentence.*difficult.*ai system.*identifying tokens.*context/i,
        answers: ["Classification"],
      },
      {
        question: /ceo.*retail company.*chatbots.*website.*appropriate use/i,
        answers: [
          "Answering frequently asked questions (FAQs) about store policy, product availability, and return procedures",
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
