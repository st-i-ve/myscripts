// ==UserScript==
// @name         AI Quiz - Answer Picker by Section
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Selects correct answers based on quiz section header and predefined answers list
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 200;
  let nextClickTimeout = null;
  let nextClicked = false;

  // Grouped answers based on section titles (lowercased for safe comparison)
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
      "turning off lights and appliances not in use",
      "ai analysis of building photos to identify signs of metal fatigue",
      "conservation of power use",
      "using alternative power sources",
      "the protection and preservation of what exists today",
      "hybrid cloud",
      "The town had to find other resources",
      "Environmental",
      "using renewable energy sources to power furnaces and other production equipment",
      "a storm destoyed the town",
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

      const options = activeCard.querySelectorAll(
        '[role="radio"], [role="checkbox"]'
      );
      let selected = false;

      options.forEach((option) => {
        const labelId = option.getAttribute("aria-labelledby");
        const labelEl = iframeDoc.getElementById(labelId);
        const answerText = labelEl?.innerText.trim();

        if (
          answerText &&
          answerList.some(
            (ans) => ans.toLowerCase() === answerText.toLowerCase()
          )
        ) {
          option.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          console.log(`✅ Selected correct answer: ${answerText}`);
          selected = true;
        }
      });

      if (!selected) {
        console.warn("❌ No matching answer found in options");
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
