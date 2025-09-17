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

  let previousCompletionState = null;
  let hasInitialized = false;

  // Function to check if a task is completed
  function isTaskCompleted(taskElement) {
    // Look for the checkmark icon or complete indicator
    const completeIcon = taskElement.querySelector(".styles_complete___ZI32");
    const checkmark = taskElement.querySelector("svg.lucide-check");

    // Check if the complete icon exists and is visible
    if (completeIcon) {
      const style = window.getComputedStyle(completeIcon);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    // Check for checkmark SVG
    if (checkmark) {
      const style = window.getComputedStyle(checkmark);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    // Additional checks for completion indicators in classes
    const completedStyles = [
      "complete",
      "completed",
      "done",
      "finished",
      "checked",
    ];

    // Check classes for completion indicators
    for (const cls of taskElement.classList) {
      if (completedStyles.some((style) => cls.toLowerCase().includes(style))) {
        return true;
      }
    }

    return false;
  }

  // Function to get current completion state
  function getCompletionState() {
    const container = document.querySelector(".styles_taskContainer__9ZuGd");
    if (!container) return null;

    const taskItems = container.querySelectorAll(".styles_task__QUAyl");
    const completionState = {
      total: taskItems.length,
      completed: 0,
      tasks: [],
    };

    taskItems.forEach((taskItem, index) => {
      const header = taskItem.querySelector(".styles_taskHeader__qAGq4 h3");
      const isCompleted = isTaskCompleted(taskItem);

      if (isCompleted) {
        completionState.completed++;
      }

      completionState.tasks.push({
        index: index,
        title: header ? header.textContent.trim() : `Task ${index + 1}`,
        isCompleted: isCompleted,
      });
    });

    return completionState;
  }

  // Function to log completion status
  function logCompletionStatus(state, isChange = false) {
    if (!state || state.total === 0) return;

    if (isChange) {
      console.log("\n🔄 TASK COMPLETION CHANGE DETECTED");
    } else {
      console.log("📋 TASK COMPLETION STATUS");
    }

    console.log(`   ${state.completed}/${state.total} tasks completed`);
    console.log(
      `   Progress: ${Math.round((state.completed / state.total) * 100)}%`
    );

    // Log individual task status
    state.tasks.forEach((task) => {
      console.log(`   ${task.isCompleted ? "✅" : "❌"} ${task.title}`);
    });

    if (state.completed === state.total) {
      console.log("   🎉 All tasks completed!");
    } else if (state.completed > 0) {
      console.log("   ⏳ Keep going!");
    } else {
      console.log("   🚦 No tasks completed yet");
    }
  }

  // Function to check for completion changes
  function checkForCompletionChanges() {
    const currentState = getCompletionState();

    if (!currentState) return;

    // Check if this is the first run
    if (!previousCompletionState) {
      previousCompletionState = currentState;
      if (!hasInitialized) {
        logCompletionStatus(currentState, false);
        hasInitialized = true;
      }
      return;
    }

    // Check if completion count has changed
    if (previousCompletionState.completed !== currentState.completed) {
      logCompletionStatus(currentState, true);
      previousCompletionState = currentState;
    }

    // Check if individual task status changed (in case total count stays same but different tasks)
    let taskStatusChanged = false;
    for (let i = 0; i < currentState.tasks.length; i++) {
      if (
        previousCompletionState.tasks[i] &&
        previousCompletionState.tasks[i].isCompleted !==
          currentState.tasks[i].isCompleted
      ) {
        taskStatusChanged = true;
        break;
      }
    }

    if (taskStatusChanged) {
      logCompletionStatus(currentState, true);
      previousCompletionState = currentState;
    }
  }

  // Main initialization function
  function initializeMonitor() {
    console.log("🚀 Initializing Task Completion Monitor...");

    // Initial check
    checkForCompletionChanges();

    // Set up interval to check for changes every second
    setInterval(checkForCompletionChanges, 1000);

    console.log("👀 Monitoring for completion changes...");
  }

  // Wait for page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(initializeMonitor, 1000);
    });
  } else {
    setTimeout(initializeMonitor, 1000);
  }

  // MutationObserver to detect DOM changes that might affect completion status
  const observer = new MutationObserver(function (mutations) {
    let shouldCheck = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
        shouldCheck = true;
      }

      // Check if attributes changed that might affect completion status
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "class" ||
          mutation.attributeName === "style")
      ) {
        shouldCheck = true;
      }
    });

    if (shouldCheck) {
      setTimeout(checkForCompletionChanges, 300);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
})();
