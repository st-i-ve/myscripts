// ==UserScript==
// @name         Auto Answer Question 14
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-focus and select the correct answer for question 14
// @author       OpenAI
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Wait until the page loads
  window.addEventListener("load", function () {
    // Use a short delay to ensure DOM is ready
    setTimeout(function () {
      const questionSection = document.getElementById("lessonQuestion14");

      if (questionSection) {
        // Scroll question into view
        questionSection.scrollIntoView({ behavior: "smooth", block: "center" });

        // Auto-select the correct answer (the first radio input)
        const correctOption = document.querySelector("input#option-2415-0");

        if (correctOption && !correctOption.checked) {
          correctOption.checked = true;

          // Optionally, trigger change event if needed by the app
          correctOption.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }, 500); // Adjust timeout as needed
  });
})();
