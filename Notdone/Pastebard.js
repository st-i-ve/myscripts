// ==UserScript==
// @name         Paste Board Assistant
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  A paste board for storing and copying user information
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // Add custom CSS for the paste board
  GM_addStyle(`
        #pasteBoardContainer {
            position: fixed;
            bottom: 7%;
            right: 20px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        }

        #pasteBoardButton {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #4285f4;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #pasteBoardPopup {
            position: absolute;
            bottom: 60px;
            right: 0;
            width: 350px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: none;
            overflow: hidden;
        }

        .popup-header {
            display: flex;
            border-bottom: 1px solid #eee;
        }

        .tab-button {
            flex: 1;
            padding: 12px;
            background: #f5f5f5;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }

        .tab-button.active {
            background: white;
            border-bottom: 2px solid #4285f4;
        }

        .tab-content {
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
        }

        .tab-pane {
            display: none;
        }

        .tab-pane.active {
            display: block;
        }

        #inputForm {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        #inputForm textarea {
            height: 200px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
            font-family: monospace;
        }

        #saveButton {
            padding: 10px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .data-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .data-label {
            font-weight: bold;
            min-width: 80px;
        }

        .data-value {
            flex: 1;
            margin: 0 10px;
            word-break: break-all;
        }

        .copy-button {
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
        }

        .copy-button:hover {
            background: #3367d6;
        }

        .copy-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .copy-notification.show {
            opacity: 1;
        }
    `);

  // Create the main container
  const container = document.createElement("div");
  container.id = "pasteBoardContainer";

  // Create the toggle button
  const toggleButton = document.createElement("button");
  toggleButton.id = "pasteBoardButton";
  toggleButton.textContent = "📋";
  toggleButton.title = "Paste Board";

  // Create the popup
  const popup = document.createElement("div");
  popup.id = "pasteBoardPopup";

  // Create tab headers
  const header = document.createElement("div");
  header.className = "popup-header";

  const inputTabButton = document.createElement("button");
  inputTabButton.className = "tab-button active";
  inputTabButton.textContent = "Input";
  inputTabButton.dataset.tab = "input";

  const dataTabButton = document.createElement("button");
  dataTabButton.className = "tab-button";
  dataTabButton.textContent = "Data";
  dataTabButton.dataset.tab = "data";

  header.appendChild(inputTabButton);
  header.appendChild(dataTabButton);

  // Create tab content container
  const tabContent = document.createElement("div");
  tabContent.className = "tab-content";

  // Input tab
  const inputTab = document.createElement("div");
  inputTab.id = "inputTab";
  inputTab.className = "tab-pane active";

  const inputForm = document.createElement("form");
  inputForm.id = "inputForm";

  const textarea = document.createElement("textarea");
  textarea.placeholder = `Name: Finn O'Connell\nEmail: finnoconnell60@gmail.com\nEthnicity: European\nState: New York\nCity: New York City\nDOB: 12/18/2011\nSchool: Stuyvesant High School\nZIP: 10001\nPhone: (212) 555-0176\nPassword: Wright10*`;

  const saveButton = document.createElement("button");
  saveButton.id = "saveButton";
  saveButton.textContent = "Save Data";
  saveButton.type = "button";

  inputForm.appendChild(textarea);
  inputForm.appendChild(saveButton);
  inputTab.appendChild(inputForm);

  // Data tab
  const dataTab = document.createElement("div");
  dataTab.id = "dataTab";
  dataTab.className = "tab-pane";

  const dataContainer = document.createElement("div");
  dataContainer.id = "dataContainer";

  dataTab.appendChild(dataContainer);

  // Add tabs to content container
  tabContent.appendChild(inputTab);
  tabContent.appendChild(dataTab);

  // Assemble the popup
  popup.appendChild(header);
  popup.appendChild(tabContent);

  // Assemble the container
  container.appendChild(toggleButton);
  container.appendChild(popup);

  // Add to document
  document.body.appendChild(container);

  // Create notification element
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = "Copied to clipboard!";
  document.body.appendChild(notification);

  // Tab switching functionality
  const tabButtons = [inputTabButton, dataTabButton];
  const tabPanes = [inputTab, dataTab];

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;

      // Update button states
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update tab visibility
      tabPanes.forEach((pane) => pane.classList.remove("active"));
      document.getElementById(tabId + "Tab").classList.add("active");

      // If switching to data tab, refresh the data display
      if (tabId === "data") {
        displayStoredData();
      }
    });
  });

  // Toggle popup visibility
  toggleButton.addEventListener("click", () => {
    const isVisible = popup.style.display === "block";
    popup.style.display = isVisible ? "none" : "block";

    // If opening and data tab is active, refresh the data
    if (!isVisible && dataTabButton.classList.contains("active")) {
      displayStoredData();
    }
  });

  // Save data functionality
  saveButton.addEventListener("click", () => {
    const text = textarea.value;
    const parsedData = parseInputText(text);

    if (parsedData) {
      // Store the data
      GM_setValue("userData", JSON.stringify(parsedData));

      // Switch to data tab and display
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      dataTabButton.classList.add("active");

      tabPanes.forEach((pane) => pane.classList.remove("active"));
      dataTab.classList.add("active");

      displayStoredData();

      // Show confirmation
      alert("Data saved successfully!");
    } else {
      alert("Please enter data in the correct format.");
    }
  });

  // Parse the input text
  function parseInputText(text) {
    const lines = text.split("\n");
    const data = {};

    for (const line of lines) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();

      data[key.toLowerCase()] = value;
    }

    // Check if we have at least some data
    return Object.keys(data).length > 0 ? data : null;
  }

  // Display stored data
  function displayStoredData() {
    const storedData = GM_getValue("userData");
    dataContainer.innerHTML = "";

    if (!storedData) {
      dataContainer.innerHTML = "<p>No data saved yet.</p>";
      return;
    }

    const data = JSON.parse(storedData);
    const fields = [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "ethnicity", label: "Ethnicity" },
      { key: "state", label: "State" },
      { key: "city", label: "City" },
      { key: "dob", label: "DOB" },
      { key: "school", label: "School" },
      { key: "zip", label: "ZIP" },
      { key: "phone", label: "Phone" },
      { key: "password", label: "Password" },
    ];

    fields.forEach((field) => {
      if (data[field.key]) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "data-item";

        const labelSpan = document.createElement("span");
        labelSpan.className = "data-label";
        labelSpan.textContent = field.label + ":";

        const valueSpan = document.createElement("span");
        valueSpan.className = "data-value";
        valueSpan.textContent = data[field.key];

        const copyButton = document.createElement("button");
        copyButton.className = "copy-button";
        copyButton.textContent = "Copy";
        copyButton.dataset.value = data[field.key];

        copyButton.addEventListener("click", () => {
          copyToClipboard(data[field.key]);
        });

        itemDiv.appendChild(labelSpan);
        itemDiv.appendChild(valueSpan);
        itemDiv.appendChild(copyButton);

        dataContainer.appendChild(itemDiv);
      }
    });
  }

  // Copy text to clipboard
  function copyToClipboard(text) {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showNotification("Copied to clipboard!");
      } else {
        showNotification("Failed to copy to clipboard");
      }
    } catch (err) {
      showNotification("Failed to copy to clipboard: " + err);
    }

    document.body.removeChild(textarea);
  }

  // Show notification
  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 2000);
  }
})();
