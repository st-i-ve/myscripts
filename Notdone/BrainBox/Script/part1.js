// ==UserScript==
// @name         Auto Select Python Mentor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically clicks Pick Now button and selects Captain Brainlox
// @author       You
// @match        https://brainlox.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=brainlox.ai
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let executed = false;
  let observer = null;
  let timeoutIds = [];

  // Function to clean up and prevent further execution
  function cleanup() {
    executed = true;
    if (observer) {
      observer.disconnect();
    }
    // Clear all timeouts
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds = [];
  }

  // Function to click the Captain Brainlox button
  function clickCaptainButton() {
    if (executed) return false;

    // Look for the modal and Captain Brainlox button
    const modalPanel = document.querySelector('[data-headlessui-state="open"]');
    if (modalPanel) {
      // Find all mentor buttons
      const mentorButtons = modalPanel.querySelectorAll("button");
      // Look for the button that corresponds to Captain Brainlox
      for (let button of mentorButtons) {
        // Check if the button is in the Captain Brainlox section by looking at the previous elements
        const parentDiv = button.closest("div");
        if (
          parentDiv &&
          parentDiv.querySelector('img[alt="Captain Brainlox"]')
        ) {
          button.click();
          console.log("Captain Brainlox selected!");
          cleanup();
          return true;
        }
      }
    }
    return false;
  }

  // Function to handle the initial button click
  function clickPickNowButton() {
    if (executed) return false;

    const pickNowButton = document.querySelector("button.asa_ctaButton__uUVCo");
    if (pickNowButton) {
      pickNowButton.click();
      console.log("Pick Now button clicked!");

      // Wait a moment for the modal to appear, then try to click Captain
      const id1 = setTimeout(() => {
        if (!clickCaptainButton()) {
          // If not found immediately, try again with a short delay
          const id2 = setTimeout(clickCaptainButton, 500);
          timeoutIds.push(id2);
        }
      }, 300);
      timeoutIds.push(id1);
      return true;
    }
    return false;
  }

  // MutationObserver to detect when elements are added to the DOM
  observer = new MutationObserver(function (mutations) {
    if (executed) return;

    // First try to click the Pick Now button if it exists
    if (!clickPickNowButton()) {
      // If Pick Now button doesn't exist yet, check for the modal
      clickCaptainButton();
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });

  // Also try immediately on page load
  const id1 = setTimeout(() => {
    if (!executed && !clickPickNowButton()) {
      clickCaptainButton();
    }
  }, 1000);
  timeoutIds.push(id1);

  // Additional check after a longer delay to catch dynamically loaded content
  const id2 = setTimeout(() => {
    if (!executed && !clickPickNowButton()) {
      clickCaptainButton();
    }
  }, 3000);
  timeoutIds.push(id2);
})();
