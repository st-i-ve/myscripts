// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-09-17
// @description  try to take over the world!
// @author       You
// @match        https://app.reachpathways.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reachpathways.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const taskText = "Watch the Building AI Agents Tutorial";
  const maxAttempts = 30;
  const attemptDelay = 1000; // 1 second
  let attempts = 0;

  function log(message) {
    console.log(`[✅ Auto Clicker]: ${message}`);
  }

  function clickTaskAndThenButton() {
    const tasks = document.querySelectorAll(".styles_task__QUAyl");
    for (const task of tasks) {
      const header = task.querySelector(".styles_taskHeader__qAGq4");
      if (header && header.textContent.includes(taskText)) {
        log(`Found task: "${taskText}". Clicking...`);
        task.click();

        // Wait for UI to update and show "Mark as Complete" button
        waitForMarkAsCompleteButton();
        return true;
      }
    }
    return false;
  }

  function waitForMarkAsCompleteButton() {
    let buttonAttempts = 0;
    const buttonMaxAttempts = 20;

    const buttonInterval = setInterval(() => {
      const buttons = document.querySelectorAll("button.styles_button__fF84e");
      for (const btn of buttons) {
        const label = btn.querySelector(".styles_label__ilDO2");
        if (label && label.textContent.trim() === "Mark as Complete") {
          log(`Found "Mark as Complete" button. Clicking...`);
          btn.click();
          log(`"Mark as Complete" button has been clicked.`);
          clearInterval(buttonInterval);
          return;
        }
      }

      buttonAttempts++;
      if (buttonAttempts >= buttonMaxAttempts) {
        clearInterval(buttonInterval);
        log(
          `⚠️ Could not find "Mark as Complete" button after ${buttonMaxAttempts} attempts.`
        );
      }
    }, 1000);
  }

  const taskInterval = setInterval(() => {
    const clicked = clickTaskAndThenButton();
    attempts++;
    if (clicked || attempts >= maxAttempts) {
      clearInterval(taskInterval);
      if (!clicked) {
        log(
          `⚠️ Could not find task "${taskText}" after ${maxAttempts} attempts.`
        );
      }
    }
  }, attemptDelay);
})();
