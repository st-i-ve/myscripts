// ==UserScript==
// @name         Hybrid - Section-Aware + Retry + Iframe-Aware + Pool Fallback
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Section-based quiz auto-answer tool with retries, iframe awareness, and fallback pool
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const sectionAnswers = {
    "what is artificial intelligence?": [
      "General AI",
      "Algorithm",
      "Techniques that help machines and computers mimic human behavior",
      "Data",
      "Natural language processing",
    ],
    "beyond conservation to sustainability": [
      "the needs of current and future generations",
      "ai analysis of building photos to identify signs of metal fatigue",
      "turning off lights and appliances not in use",
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
      "Research the age group’s physical and mental health challenges in forming healthy habits.",
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
      "Sensors and IoT devices",
      "Check whether the tools used for collecting data give stable results over time.",
      "Use visualizations to show patterns, trends, and key insights.",
      "Check her information by comparing it with data from different methods or sources.",
    ],
  };

  const fallbackPool = [
    "Commercial transaction records",
    "Surveys and questionnaires",
    "Web scraping technologies",
    "Use visualizations to show patterns, trends, and key insights.",
    "Techniques that help machines and computers mimic human behavior",
    "To ensure smooth user experience across all devices, Rio should choose responsive design, as it will eliminate the need for user adjustments.",
    "Sensors and IoT devices",
    "The needs of current and future generations",
    "Turn off lights and appliances not in use",
    "Add elements such as stickers, avatars, and color-coded reports creatively to engage the students.",
  ];

  const normalize = (str) =>
    str
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  function createButton() {
    const btn = document.createElement("button");
    btn.textContent = "⚡ Auto-Run Quiz";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "9999",
      background: "#0d6efd",
      color: "#fff",
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      fontSize: "15px",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    });
    document.body.appendChild(btn);
    return btn;
  }

  function findQuizIframe() {
    return Array.from(document.getElementsByTagName("iframe")).find(
      (iframe) => {
        try {
          return iframe.contentDocument?.querySelector(".quiz__wrap");
        } catch {
          return false;
        }
      }
    );
  }

  function runInIframe(iframe, retries = 0) {
    try {
      const doc = iframe.contentDocument;
      const headerEl = doc.querySelector(".nav-sidebar-header__title");
      const activeCard = doc.querySelector(
        ".quiz__wrap .quiz-item__card--active"
      );

      if (!headerEl || !activeCard) {
        console.warn("❌ Section title or active quiz card not found.");
        return;
      }

      const sectionTitle = normalize(headerEl.innerText);
      const sectionKeys = Object.keys(sectionAnswers);
      const allAnswerSources = [
        sectionTitle,
        ...sectionKeys.filter((k) => k !== sectionTitle),
      ];

      const options = activeCard.querySelectorAll(
        '[role="radio"], [role="checkbox"]'
      );
      let matched = false;

      for (let round = 0; round < 4 && !matched; round++) {
        const currentSection =
          allAnswerSources[round % allAnswerSources.length];
        const answerList = sectionAnswers[currentSection] ?? [];

        options.forEach((option) => {
          const labelId = option.getAttribute("aria-labelledby");
          const labelEl = doc.getElementById(labelId);
          const answerText = labelEl?.innerText.trim();

          if (
            answerText &&
            answerList.some((a) => normalize(a) === normalize(answerText))
          ) {
            option.click();
            console.log(`✅ Matched with [${currentSection}]:`, answerText);
            matched = true;
          }
        });
      }

      if (!matched) {
        console.warn("🔁 No match in sections. Trying fallback pool...");

        const fallback = Array.from(options).find((option) => {
          const labelId = option.getAttribute("aria-labelledby");
          const labelEl = doc.getElementById(labelId);
          const answerText = labelEl?.innerText.trim();
          return (
            answerText &&
            fallbackPool.some(
              (poolAns) => normalize(poolAns) === normalize(answerText)
            )
          );
        });

        if (fallback) {
          fallback.click();
          console.log("✅ Fallback pool answer selected.");
        } else {
          console.warn("❌ Still no match. Selecting first option...");
          if (options.length) options[0].click();
        }
      }

      // Submit
      setTimeout(() => {
        const submitBtn = activeCard.querySelector(
          "button.quiz-card__button:not(.quiz-card__button--disabled):not(.quiz-card__button--next)"
        );
        if (submitBtn) {
          submitBtn.click();
          console.log("🚀 Submitted answer");

          setTimeout(() => {
            const nextBtn = activeCard.querySelector(
              "button.quiz-card__button--next:not([disabled])"
            );
            if (nextBtn) {
              nextBtn.click();
              console.log("➡️ Clicked NEXT");
              setTimeout(() => runInIframe(iframe), 200);
            } else {
              console.warn("⏭️ NEXT button not found.");
            }
          }, 200);
        } else {
          console.warn("⚠️ Submit button not found.");
        }
      }, 100);
    } catch (err) {
      console.error("❌ Error running in iframe:", err);
    }
  }

  window.addEventListener("load", () => {
    const btn = createButton();
    btn.addEventListener("click", () => {
      const iframe = findQuizIframe();
      if (!iframe) {
        alert("❌ Could not find quiz iframe.");
        return;
      }
      runInIframe(iframe);
    });
  });
})();
