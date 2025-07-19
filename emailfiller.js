// ==UserScript==
// @name         Auto Form Filler - Universal
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fill form fields with saved profile data, including ASA registration and other sites
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Storage key for user profile
  const STORAGE_KEY = "autoFormFillerProfile";

  // Default profile structure
  const defaultProfile = {
    firstName: "",
    lastName: "",
    state: "",
    city: "",
    dob: "", // ISO format YYYY-MM-DD
    school: "",
    zip: "",
    phone: "",
    email: "",
    password: "DefaultPass123!",
  };

  // Get stored profile or return null if not exists
  function getStoredProfile() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error reading stored profile:", e);
      return null;
    }
  }

  // Save profile to localStorage
  function saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error("Error saving profile:", e);
      return false;
    }
  }

  // Convert date from DD/MM/YYYY to YYYY-MM-DD
  function convertDateFormat(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateStr;
  }

  // Create data capture form
  function createDataCaptureForm() {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10001;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const form = document.createElement("div");
    form.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;

    form.innerHTML = `
      <h2 style="margin-top: 0; color: #333; text-align: center;">Enter Your Information</h2>
      <p style="color: #666; text-align: center; margin-bottom: 20px;">This data will be saved and used to fill forms automatically</p>
      
      <textarea id="userDataInput" placeholder="Paste your information here in this format:

Name: Robert Harris
State: Massachusetts
City: Boston
DOB: 18/11/2009
School: Boston Latin Academy
ZIP: 02124
PHONE: 4085554449
password: Wright10*
robertharris181109@gmail.com" 
        style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; resize: vertical; box-sizing: border-box;"></textarea>
      
      <div style="margin-top: 20px; text-align: center;">
        <button id="saveDataBtn" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">Save Data</button>
        <button id="cancelBtn" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px;">Cancel</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    // Handle save button
    document.getElementById("saveDataBtn").onclick = function() {
      const inputData = document.getElementById("userDataInput").value.trim();
      if (parseAndSaveData(inputData)) {
        document.body.removeChild(overlay);
        addFillFormButton();
      }
    };

    // Handle cancel button
    document.getElementById("cancelBtn").onclick = function() {
      document.body.removeChild(overlay);
    };

    // Close on overlay click
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    };
  }

  // Parse the input data and save to profile
  function parseAndSaveData(inputData) {
    try {
      const lines = inputData.split('\n').map(line => line.trim()).filter(line => line);
      const profile = { ...defaultProfile };
      
      lines.forEach(line => {
        if (line.toLowerCase().startsWith('name:')) {
          const fullName = line.substring(5).trim();
          const nameParts = fullName.split(' ');
          profile.firstName = nameParts[0] || '';
          profile.lastName = nameParts.slice(1).join(' ') || '';
        } else if (line.toLowerCase().startsWith('state:')) {
          profile.state = line.substring(6).trim();
        } else if (line.toLowerCase().startsWith('city:')) {
          profile.city = line.substring(5).trim();
        } else if (line.toLowerCase().startsWith('dob:')) {
          const dobStr = line.substring(4).trim();
          profile.dob = convertDateFormat(dobStr);
        } else if (line.toLowerCase().startsWith('school:')) {
          profile.school = line.substring(7).trim();
        } else if (line.toLowerCase().startsWith('zip:')) {
          profile.zip = line.substring(4).trim();
        } else if (line.toLowerCase().startsWith('phone:')) {
          profile.phone = line.substring(6).trim();
        } else if (line.toLowerCase().startsWith('password:')) {
          profile.password = line.substring(9).trim();
        } else if (line.includes('@')) {
          profile.email = line.trim();
        }
      });

      if (profile.firstName && profile.email) {
        saveProfile(profile);
        alert('Profile data saved successfully!');
        return true;
      } else {
        alert('Please make sure to include at least Name and Email');
        return false;
      }
    } catch (e) {
      alert('Error parsing data. Please check the format.');
      return false;
    }
  }

  // Enhanced form filling function
  function fillForm() {
    const profile = getStoredProfile();
    if (!profile) {
      alert('No profile data found. Please set up your data first.');
      return;
    }

    const map = {
      firstName: ["first name", "fname", "first", "first_name", "given-name"],
      lastName: ["last name", "lname", "last", "last_name", "family-name", "surname"],
      state: ["state", "province", "region"],
      city: ["city", "town", "locality"],
      dob: ["dob", "birth", "date of birth", "date_of_birth", "birthday"],
      school: ["school", "institution", "university", "college"],
      zip: ["zip", "postal", "postcode", "postal_code"],
      phone: ["phone", "tel", "telephone", "mobile", "sms_number"],
      email: ["email", "e-mail", "mail"],
      password: ["password", "pass", "pwd", "cpassword", "confirm"],
    };

    const inputs = document.querySelectorAll("input, textarea, select");
    let filledCount = 0;

    inputs.forEach((input) => {
      const type = input.type ? input.type.toLowerCase() : '';
      
      // Handle checkboxes - automatically tick them
      if (type === 'checkbox') {
        if (!input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
        }
        return;
      }
      
      // Skip if already filled
      if (input.value && input.value.trim() !== '') return;

      const name = input.name?.toLowerCase() || "";
      const id = input.id?.toLowerCase() || "";
      const placeholder = input.placeholder?.toLowerCase() || "";
      const autocomplete = input.autocomplete?.toLowerCase() || "";
      
      // Get label text
      let label = "";
      if (input.id) {
        const labelEl = document.querySelector(`label[for="${input.id}"]`);
        if (labelEl) label = labelEl.innerText.toLowerCase();
      }
      
      // Also check parent element for label
      if (!label && input.parentElement) {
        const parentLabel = input.parentElement.querySelector('label');
        if (parentLabel) label = parentLabel.innerText.toLowerCase();
      }

      for (let key in map) {
        if (
          map[key].some(
            (keyword) =>
              name.includes(keyword) ||
              id.includes(keyword) ||
              placeholder.includes(keyword) ||
              label.includes(keyword) ||
              autocomplete.includes(keyword)
          )
        ) {
          let value = profile[key];
          
          // Special handling for confirm password
          if ((name.includes('cpassword') || name.includes('confirm')) && key === 'password') {
            value = profile.password;
          }
          
          if (value) {
            input.value = value;
            
            // Trigger multiple events to ensure the form recognizes the input
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("blur", { bubbles: true }));
            
            // For React forms, also trigger focus and keyup
            input.dispatchEvent(new Event("focus", { bubbles: true }));
            input.dispatchEvent(new Event("keyup", { bubbles: true }));
            
            filledCount++;
          }
          break;
        }
      }
    });

    if (filledCount > 0) {
      console.log(`Auto Form Filler: Filled ${filledCount} fields`);
      
      // Show success message
      const successMsg = document.createElement("div");
      successMsg.textContent = `✓ Filled ${filledCount} fields`;
      successMsg.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
      `;
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        if (document.body.contains(successMsg)) {
          document.body.removeChild(successMsg);
        }
      }, 3000);
    } else {
      alert('No matching form fields found on this page.');
    }
  }

  // Add the "Set Up Data" button
  function addSetupButton() {
    const btn = document.createElement("button");
    btn.textContent = "Set Up Data";
    btn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      padding: 10px 15px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    btn.onclick = createDataCaptureForm;
    document.body.appendChild(btn);
  }

  // Add the "Fill Form" button with delete button
  function addFillFormButton() {
    // Remove any existing buttons first
    const existingBtn = document.querySelector('#autoFormFillerBtn');
    if (existingBtn) existingBtn.remove();
    const existingDeleteBtn = document.querySelector('#deleteDataBtn');
    if (existingDeleteBtn) existingDeleteBtn.remove();

    // Create container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      display: flex;
      gap: 5px;
    `;

    // Fill Form button
    const fillBtn = document.createElement("button");
    fillBtn.id = "autoFormFillerBtn";
    fillBtn.textContent = "Fill Form";
    fillBtn.style.cssText = `
      padding: 10px 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    fillBtn.onclick = fillForm;

    // Delete Data button
    const deleteBtn = document.createElement("button");
    deleteBtn.id = "deleteDataBtn";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete saved data";
    deleteBtn.style.cssText = `
      padding: 10px 12px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    deleteBtn.onclick = deleteStoredData;

    buttonContainer.appendChild(fillBtn);
    buttonContainer.appendChild(deleteBtn);
    document.body.appendChild(buttonContainer);
  }

  // Delete stored data function
  function deleteStoredData() {
    if (confirm('Are you sure you want to delete all saved data? This action cannot be undone.')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        alert('Data deleted successfully!');
        
        // Remove current buttons and show setup button
        const existingBtn = document.querySelector('#autoFormFillerBtn');
        if (existingBtn && existingBtn.parentElement) {
          existingBtn.parentElement.remove();
        }
        
        addSetupButton();
      } catch (e) {
        alert('Error deleting data: ' + e.message);
      }
    }
  }

  // Initialize the script
  function init() {
    // Remove any existing buttons
    const existingBtn = document.querySelector('#autoFormFillerBtn');
    if (existingBtn) existingBtn.remove();

    const profile = getStoredProfile();
    if (profile && profile.firstName && profile.email) {
      addFillFormButton();
    } else {
      addSetupButton();
    }
  }

  // Wait for page to load then initialize
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', () => {
       setTimeout(init, 1000);
     });
   } else {
     setTimeout(init, 1000);
   }
 })();