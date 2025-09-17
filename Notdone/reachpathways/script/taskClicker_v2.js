{
  /* <button
  type="submit"
  class="styles_button__fF84e"
  style="width: 100%; cursor: none;"
>
  <span class="styles_placeholder__znOGn"></span>
  <span class="styles_label__ilDO2">Submit</span>
  <span class="styles_placeholder__znOGn"></span>
</button>; */
}

// button B
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

  // Function to create a stack data structure
  function createStack() {
    const items = [];
    return {
      push: function (element) {
        items.push(element);
      },
      pop: function () {
        if (this.isEmpty()) {
          return "Underflow";
        }
        return items.pop();
      },
      peek: function () {
        return items[items.length - 1];
      },
      isEmpty: function () {
        return items.length === 0;
      },
      size: function () {
        return items.length;
      },
      print: function () {
        console.log(
          "Task Stack contents:",
          items.map((item) => item.title)
        );
      },
      getItems: function () {
        return [...items];
      },
    };
  }

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

    // Additional checks for other completion indicators
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

    // Check parent elements for completion indicators
    let parent = taskElement.parentElement;
    while (parent) {
      for (const cls of parent.classList) {
        if (
          completedStyles.some((style) => cls.toLowerCase().includes(style))
        ) {
          return true;
        }
      }
      parent = parent.parentElement;
    }

    return false;
  }

  // Function to find and process task items with completion status
  function processTaskItems() {
    // Find the container
    const container = document.querySelector(".styles_taskContainer__9ZuGd");

    if (!container) {
      console.log("Task container not found");
      return null;
    }

    // Create a new stack
    const taskStack = createStack();

    // Find all task items within the container
    const taskItems = container.querySelectorAll(".styles_task__QUAyl");

    console.log(`📋 Found ${taskItems.length} task items:`);

    let completedCount = 0;

    // Process each task item
    taskItems.forEach((taskItem, index) => {
      const header = taskItem.querySelector(".styles_taskHeader__qAGq4 h3");
      const isCompleted = isTaskCompleted(taskItem);

      if (isCompleted) {
        completedCount++;
      }

      const taskData = {
        element: taskItem,
        index: index,
        title: header ? header.textContent.trim() : `Task ${index + 1}`,
        isCompleted: isCompleted,
        completionIndicator: isCompleted ? "✅" : "❌",
      };

      taskStack.push(taskData);

      // Log individual task status
      console.log(
        `   ${index + 1}. ${taskData.completionIndicator} "${
          taskData.title
        }" - ${isCompleted ? "COMPLETED" : "PENDING"}`
      );
    });

    // Log completion summary
    console.log("\n📊 COMPLETION SUMMARY:");
    console.log(`   ${completedCount}/${taskItems.length} tasks completed`);
    console.log(
      `   Progress: ${Math.round((completedCount / taskItems.length) * 100)}%`
    );

    // Visual feedback in console
    if (completedCount === taskItems.length) {
      console.log("   🎉 All tasks completed!");
    } else if (completedCount > 0) {
      console.log("   ⏳ Keep going!");
    } else {
      console.log("   🚦 No tasks completed yet");
    }

    return {
      stack: taskStack,
      completed: completedCount,
      total: taskItems.length,
      percentage: Math.round((completedCount / taskItems.length) * 100),
    };
  }

  // Function to monitor for completion changes
  function monitorCompletionChanges() {
    console.log("\n👀 Monitoring for completion changes...");

    let lastCompletionState = null;

    const checkForChanges = function () {
      const result = processTaskItems();

      if (
        result &&
        lastCompletionState !== null &&
        lastCompletionState.completed !== result.completed
      ) {
        console.log("\n🔄 CHANGE DETECTED! Completion status updated.");
        console.log(
          `   Was: ${lastCompletionState.completed}/${lastCompletionState.total}`
        );
        console.log(`   Now: ${result.completed}/${result.total}`);
      }

      lastCompletionState = result;
    };

    // Check every 2 seconds for changes
    setInterval(checkForChanges, 2000);
  }

  // Function to add visual indicators to tasks
  function addVisualIndicators(taskStack) {
    if (!taskStack) return;

    const tasks = taskStack.getItems();

    tasks.forEach((task) => {
      // Add visual indicator
      const indicator = document.createElement("span");
      indicator.style.marginLeft = "10px";
      indicator.style.fontWeight = "bold";
      indicator.textContent = task.isCompleted ? "✅" : "⏳";
      indicator.title = task.isCompleted ? "Completed" : "Pending";

      // Add to the task header if possible
      const header = task.element.querySelector(".styles_taskHeader__qAGq4 h3");
      if (header && !header.querySelector(".completion-indicator")) {
        header.appendChild(indicator);
      }
    });
  }

  // Main function to initialize everything
  function initializeTaskChecker() {
    console.log("🚀 Initializing Task Completion Checker...");

    const result = processTaskItems();

    if (result && result.stack.size() > 0) {
      addVisualIndicators(result.stack);
      monitorCompletionChanges();

      // Store for debugging
      window.taskCompletion = result;

      console.log("\n✨ Task monitoring active!");
    } else {
      console.log("❌ No tasks found. Retrying in 2 seconds...");
      setTimeout(initializeTaskChecker, 2000);
    }
  }

  // Wait for page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeTaskChecker);
  } else {
    initializeTaskChecker();
  }

  // Observe DOM changes
  const observer = new MutationObserver(function () {
    console.log("🔄 DOM changed - checking tasks...");
    setTimeout(initializeTaskChecker, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
