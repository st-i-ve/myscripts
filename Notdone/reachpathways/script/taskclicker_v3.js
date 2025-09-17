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

  // Create floating button
  function createFloatingButton() {
    const button = document.createElement("button");
    button.id = "completeTasksBtn";
    button.innerHTML = "Complete Next Task";
    button.style.position = "fixed";
    button.style.bottom = "30%";
    button.style.right = "5%"; // 5% from right side
    button.style.zIndex = "9999";
    button.style.padding = "12px 20px";
    button.style.backgroundColor = "#4CAF50";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.fontWeight = "bold";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    button.style.transition = "all 0.3s ease";

    // Hover effects
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#45a049";
      button.style.transform = "scale(1.05)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#4CAF50";
      button.style.transform = "scale(1)";
    });

    return button;
  }

  // Function to check if a task is completed
  function isTaskCompleted(taskElement) {
    const completeIcon = taskElement.querySelector(".styles_complete___ZI32");
    const checkmark = taskElement.querySelector("svg.lucide-check");

    if (completeIcon) {
      const style = window.getComputedStyle(completeIcon);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    if (checkmark) {
      const style = window.getComputedStyle(checkmark);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }

    return false;
  }

  // Function to get all tasks
  function getAllTasks() {
    const container = document.querySelector(".styles_taskContainer__9ZuGd");
    if (!container) return [];

    const taskItems = container.querySelectorAll(".styles_task__QUAyl");
    const tasks = [];

    taskItems.forEach((taskItem, index) => {
      const header = taskItem.querySelector(".styles_taskHeader__qAGq4 h3");
      tasks.push({
        element: taskItem,
        index: index,
        title: header ? header.textContent.trim() : `Task ${index + 1}`,
        isCompleted: isTaskCompleted(taskItem),
      });
    });

    return tasks;
  }

  // Function to find and click the "Mark as Complete" button
  function clickMarkCompleteButton() {
    // Look for the button inside the task controls container
    const markCompleteBtn = document.querySelector(
      ".styles_taskControls__lYLu8 button.styles_button__fF84e"
    );

    if (markCompleteBtn) {
      const btnText = markCompleteBtn.querySelector(".styles_label__ilDO2");
      if (btnText && btnText.textContent.includes("Mark as Complete")) {
        console.log('✅ Clicking "Mark as Complete" button');
        markCompleteBtn.click();
        return true;
      }
    }

    // Alternative search if not found in the specific container
    const allButtons = document.querySelectorAll("button.styles_button__fF84e");
    for (const button of allButtons) {
      const btnText = button.querySelector(".styles_label__ilDO2");
      if (btnText && btnText.textContent.includes("Mark as Complete")) {
        console.log('✅ Found "Mark as Complete" button (alternative search)');
        button.click();
        return true;
      }
    }

    console.log('❌ "Mark as Complete" button not found');
    console.log(
      "   Searching for elements with class: styles_taskControls__lYLu8"
    );
    console.log(
      "   Available buttons:",
      document.querySelectorAll("button.styles_button__fF84e").length
    );
    return false;
  }

  // Function to complete the next incomplete task
  function completeNextTask() {
    const tasks = getAllTasks();
    const incompleteTasks = tasks.filter((task) => !task.isCompleted);

    if (incompleteTasks.length === 0) {
      console.log("🎉 All tasks are already completed!");
      alert("All tasks are already completed!");
      return;
    }

    const nextTask = incompleteTasks[0];
    console.log(`📋 Attempting to complete: "${nextTask.title}"`);

    // Click the task to activate it (this should make the Mark as Complete button visible)
    nextTask.element.click();
    console.log("👆 Clicked task");

    // Wait for UI to update, then click the mark complete button
    setTimeout(() => {
      const success = clickMarkCompleteButton();

      if (success) {
        // Check if task was actually marked complete after a delay
        setTimeout(() => {
          const updatedTasks = getAllTasks();
          const updatedTask = updatedTasks[nextTask.index];

          if (updatedTask.isCompleted) {
            console.log(`✅ Successfully completed: "${nextTask.title}"`);

            // Update completion status
            const totalTasks = tasks.length;
            const completedTasks = updatedTasks.filter(
              (t) => t.isCompleted
            ).length;
            console.log(
              `📊 Progress: ${completedTasks}/${totalTasks} tasks completed`
            );
          } else {
            console.log(`❌ Failed to complete: "${nextTask.title}"`);
            console.log(
              "   The task may need more time or the button may not have worked"
            );
          }
        }, 1500);
      }
    }, 800);
  }

  // Main initialization
  function initialize() {
    console.log("🚀 Initializing Task Completer...");

    // Create and add floating button
    const floatingButton = createFloatingButton();
    document.body.appendChild(floatingButton);

    // Add click event to the floating button
    floatingButton.addEventListener("click", function () {
      console.log("---");
      console.log("🔄 Floating button clicked - completing next task");
      completeNextTask();
    });

    console.log(
      "✅ Floating button added to right side (5% from right, 30% from bottom)"
    );
    console.log("👆 Click it to complete tasks one by one");
  }

  // Wait for page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
