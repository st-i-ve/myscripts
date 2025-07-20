// ==UserScript==
// @name         Auto Form Filler - Universal
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Fill form fields with saved profile data, including ASA registration and other sites
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
  "use strict";

  // Storage key for user profile
  const STORAGE_KEY = "autoFormFillerProfile";

  // US States list for dropdown
  const US_STATES = [
    { value: "", text: "Select State..." },
    { value: "Alabama", text: "Alabama" },
    { value: "Alaska", text: "Alaska" },
    { value: "Arizona", text: "Arizona" },
    { value: "Arkansas", text: "Arkansas" },
    { value: "California", text: "California" },
    { value: "Colorado", text: "Colorado" },
    { value: "Connecticut", text: "Connecticut" },
    { value: "Delaware", text: "Delaware" },
    { value: "Florida", text: "Florida" },
    { value: "Georgia", text: "Georgia" },
    { value: "Hawaii", text: "Hawaii" },
    { value: "Idaho", text: "Idaho" },
    { value: "Illinois", text: "Illinois" },
    { value: "Indiana", text: "Indiana" },
    { value: "Iowa", text: "Iowa" },
    { value: "Kansas", text: "Kansas" },
    { value: "Kentucky", text: "Kentucky" },
    { value: "Louisiana", text: "Louisiana" },
    { value: "Maine", text: "Maine" },
    { value: "Maryland", text: "Maryland" },
    { value: "Massachusetts", text: "Massachusetts" },
    { value: "Michigan", text: "Michigan" },
    { value: "Minnesota", text: "Minnesota" },
    { value: "Mississippi", text: "Mississippi" },
    { value: "Missouri", text: "Missouri" },
    { value: "Montana", text: "Montana" },
    { value: "Nebraska", text: "Nebraska" },
    { value: "Nevada", text: "Nevada" },
    { value: "New Hampshire", text: "New Hampshire" },
    { value: "New Jersey", text: "New Jersey" },
    { value: "New Mexico", text: "New Mexico" },
    { value: "New York", text: "New York" },
    { value: "North Carolina", text: "North Carolina" },
    { value: "North Dakota", text: "North Dakota" },
    { value: "Ohio", text: "Ohio" },
    { value: "Oklahoma", text: "Oklahoma" },
    { value: "Oregon", text: "Oregon" },
    { value: "Pennsylvania", text: "Pennsylvania" },
    { value: "Rhode Island", text: "Rhode Island" },
    { value: "South Carolina", text: "South Carolina" },
    { value: "South Dakota", text: "South Dakota" },
    { value: "Tennessee", text: "Tennessee" },
    { value: "Texas", text: "Texas" },
    { value: "Utah", text: "Utah" },
    { value: "Vermont", text: "Vermont" },
    { value: "Virginia", text: "Virginia" },
    { value: "Washington", text: "Washington" },
    { value: "West Virginia", text: "West Virginia" },
    { value: "Wisconsin", text: "Wisconsin" },
    { value: "Wyoming", text: "Wyoming" },
    { value: "District of Columbia", text: "District of Columbia" },
    { value: "Puerto Rico", text: "Puerto Rico" },
    { value: "US Virgin Islands", text: "US Virgin Islands" },
    { value: "American Samoa", text: "American Samoa" },
    { value: "Guam", text: "Guam" },
    { value: "Northern Mariana Islands", text: "Northern Mariana Islands" }
  ];

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

  // Get stored profile using Tampermonkey storage (cross-domain persistent)
  function getStoredProfile() {
    try {
      const stored = GM_getValue(STORAGE_KEY, null);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error reading stored profile:", e);
      return null;
    }
  }

  // Save profile using Tampermonkey storage (cross-domain persistent)
  function saveProfile(profile) {
    try {
      GM_setValue(STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error("Error saving profile:", e);
      return false;
    }
  }

  // Delete stored profile using Tampermonkey storage
  function deleteStoredProfile() {
    try {
      GM_deleteValue(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error("Error deleting stored profile:", e);
      return false;
    }
  }

  // Legacy function for date conversion (keeping for compatibility)
  function convertDateFormat(dateStr) {
    return convertDateToStorage(dateStr);
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
      max-width: 600px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
    `;

    // Generate state options
    const stateOptions = US_STATES.map(state => 
      `<option value="${state.value}">${state.text}</option>`
    ).join('');

    // Get existing profile data if available
    const existingProfile = getStoredProfile() || defaultProfile;

    form.innerHTML = `
      <h2 style="margin-top: 0; color: #333; text-align: center;">Enter Your Information</h2>
      <p style="color: #666; text-align: center; margin-bottom: 20px;">This data will be saved across ALL websites and persist until you delete it</p>
      
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <!-- Individual Fields Column -->
        <div style="flex: 1;">
          <h3 style="color: #333; margin-bottom: 15px;">📝 Individual Fields</h3>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">First Name:</label>
            <input type="text" id="firstNameInput" value="${existingProfile.firstName}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Last Name:</label>
            <input type="text" id="lastNameInput" value="${existingProfile.lastName}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">State:</label>
            <select id="stateSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
              ${stateOptions}
            </select>
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">City:</label>
            <input type="text" id="cityInput" value="${existingProfile.city}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date of Birth (DD/MM/YYYY):</label>
            <input type="text" id="dobInput" value="${existingProfile.dob ? convertDateToDisplay(existingProfile.dob) : ''}" placeholder="18/11/2009" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">School:</label>
            <input type="text" id="schoolInput" value="${existingProfile.school}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">ZIP Code:</label>
            <input type="text" id="zipInput" value="${existingProfile.zip}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Phone:</label>
            <input type="text" id="phoneInput" value="${existingProfile.phone}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
            <input type="email" id="emailInput" value="${existingProfile.email}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
          
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Password:</label>
            <input type="text" id="passwordInput" value="${existingProfile.password}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          </div>
        </div>
        
        <!-- Bulk Paste Column -->
        <div style="flex: 1;">
          <h3 style="color: #333; margin-bottom: 15px;">📋 Or Paste Bulk Data</h3>
          <textarea id="userDataInput" placeholder="Paste your information here in this format:

Name: Robert Harris
State: Massachusetts
City: Boston
DOB: 18/11/2009
School: Boston Latin Academy
ZIP: 02124
PHONE: 4085554449
password: Wright10*
robertharris181109@gmail.com

Note: Individual fields above will override this data" 
            style="width: 100%; height: 400px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; resize: vertical; box-sizing: border-box;"></textarea>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button id="saveDataBtn" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">💾 Save Data</button>
        <button id="cancelBtn" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px;">❌ Cancel</button>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px; font-size: 12px; color: #1976d2;">
        <strong>💡 Storage Info:</strong> Your data is stored using Tampermonkey's cross-domain storage. It will persist across ALL websites and browser sessions until you explicitly delete it.
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    // Set the current state value in dropdown
    const stateSelect = document.getElementById("stateSelect");
    if (existingProfile.state) {
      stateSelect.value = existingProfile.state;
    }

    // Handle save button
    document.getElementById("saveDataBtn").onclick = function() {
      if (saveFormData()) {
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

  // Convert date from DD/MM/YYYY to YYYY-MM-DD for storage
  function convertDateToStorage(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateStr;
  }

  // Convert date from YYYY-MM-DD to DD/MM/YYYY for display
  function convertDateToDisplay(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    return dateStr;
  }

  // Save form data with priority to individual fields
  function saveFormData() {
    // Get individual field values
    const firstName = document.getElementById("firstNameInput").value.trim();
    const lastName = document.getElementById("lastNameInput").value.trim();
    const state = document.getElementById("stateSelect").value;
    const city = document.getElementById("cityInput").value.trim();
    const dob = document.getElementById("dobInput").value.trim();
    const school = document.getElementById("schoolInput").value.trim();
    const zip = document.getElementById("zipInput").value.trim();
    const phone = document.getElementById("phoneInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    
    // Get bulk data
    const bulkData = document.getElementById("userDataInput").value.trim();
    
    // Start with parsed bulk data as base
    let profile = { ...defaultProfile };
    if (bulkData) {
      const parsedBulk = parseUserData(bulkData);
      if (parsedBulk) {
        profile = parsedBulk;
      }
    }
    
    // Override with individual field values (if provided)
    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (state) profile.state = state;
    if (city) profile.city = city;
    if (dob) {
      // Convert display format (DD/MM/YYYY) to storage format
      const convertedDob = convertDateToStorage(dob);
      if (convertedDob) profile.dob = convertedDob;
    }
    if (school) profile.school = school;
    if (zip) profile.zip = zip;
    if (phone) profile.phone = phone;
    if (email) profile.email = email;
    if (password) profile.password = password;
    
    // Validate that we have at least some data
    if (!profile.firstName && !profile.lastName && !profile.email) {
      alert("Please provide at least a name or email address.");
      return false;
    }
    
    // Save the profile
    saveProfile(profile);
    alert("✅ Data saved successfully! It will persist across all websites and browser sessions.");
    return true;
  }

  // Parse user data from text input
  function parseUserData(inputData) {
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
          profile.dob = convertDateToStorage(dobStr);
        } else if (line.toLowerCase().startsWith('school:')) {
          profile.school = line.substring(7).trim();
        } else if (line.toLowerCase().startsWith('zip:')) {
          profile.zip = line.substring(4).trim();
        } else if (line.toLowerCase().startsWith('phone:')) {
          profile.phone = line.substring(6).trim();
        } else if (line.toLowerCase().startsWith('password:')) {
          profile.password = line.substring(9).trim();
        } else if (line.includes('@') && !line.includes(':')) {
          profile.email = line.trim();
        }
      });

      return profile;
    } catch (e) {
      console.error('Error parsing data:', e);
      return null;
    }
  }

  // Parse and save user data (legacy function for compatibility)
  function parseAndSaveData(inputData) {
    if (!inputData) {
      alert("Please enter your information.");
      return false;
    }

    const profile = parseUserData(inputData);
    if (!profile) {
      alert('Error parsing data. Please check the format.');
      return false;
    }

    if (profile.firstName && profile.email) {
      saveProfile(profile);
      alert('Profile data saved successfully!');
      return true;
    } else {
      alert('Please make sure to include at least Name and Email');
      return false;
    }
  }

  // Simulate human typing for better form recognition
  function simulateTyping(input, text) {
    return new Promise((resolve) => {
      const inputType = input.type ? input.type.toLowerCase() : '';
      
      // Handle date inputs specially
      if (inputType === 'date') {
        input.focus();
        input.dispatchEvent(new Event('focus', { bubbles: true }));
        
        // For date inputs, convert DD/MM/YYYY to YYYY-MM-DD
        let dateValue = text;
        if (text && text.includes('/')) {
          const parts = text.split('/');
          if (parts.length === 3) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            dateValue = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        input.value = dateValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
        
        setTimeout(resolve, 10);
        return;
      }
      
      // For regular text inputs - ultra-fast typing
      input.value = '';
      input.focus();
      
      // Trigger focus event
      input.dispatchEvent(new Event('focus', { bubbles: true }));
      
      let index = 0;
      const typeChar = () => {
        if (index < text.length) {
          input.value += text[index];
          
          // Trigger input events for each character
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('keyup', { bubbles: true }));
          
          index++;
          setTimeout(typeChar, 2); // 2ms delay between characters - ultra fast!
        } else {
          // Final events after typing is complete
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          resolve();
        }
      };
      
      setTimeout(typeChar, 10); // Reduced initial delay
    });
  }

  // Specific function to handle ASA registration checkboxes
  async function handleASACheckboxes() {
    const asaCheckboxes = [
      'accept_terms_and_conditions',
      'accept_marketing'
    ];
    
    let checkedCount = 0;
    
    for (const checkboxId of asaCheckboxes) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox && !checkbox.checked) {
        // Multiple approaches to ensure the checkbox gets checked
        checkbox.focus();
        
        // Method 1: Direct property setting with events
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("focus", { bubbles: true }));
        checkbox.dispatchEvent(new Event("click", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        
        // Method 2: Simulate actual click on the element
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        checkbox.dispatchEvent(clickEvent);
        
        // Method 3: Try clicking the parent container (for custom styled checkboxes)
        if (checkbox.parentElement) {
          checkbox.parentElement.click();
        }
        
        checkedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return checkedCount;
  }

  // Enhanced form filling function with human-like typing
  async function fillForm() {
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
      dob: ["dob", "birth", "date of birth", "date_of_birth", "birthday", "dateofbirth", "bdate", "born"],
      school: ["school", "institution", "university", "college"],
      zip: ["zip", "postal", "postcode", "postal_code"],
      phone: ["phone", "tel", "telephone", "mobile", "sms_number"],
      email: ["email", "e-mail", "mail"],
      password: ["password", "pass", "pwd", "cpassword", "confirm"],
    };

    const inputs = document.querySelectorAll("input, textarea, select");
    let filledCount = 0;
    let checkboxCount = 0;

    // Show progress message
    const progressMsg = document.createElement("div");
    progressMsg.textContent = "🤖 Filling form...";
    progressMsg.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: #2196F3;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;
    document.body.appendChild(progressMsg);

    // Process inputs sequentially for better simulation
    for (const input of inputs) {
      const type = input.type ? input.type.toLowerCase() : '';
      
      // Handle checkboxes - automatically tick them with enhanced targeting
      if (type === 'checkbox') {
        if (!input.checked) {
          // Focus the checkbox first
          input.focus();
          
          // Set checked property
          input.checked = true;
          
          // Dispatch multiple events to ensure recognition
          input.dispatchEvent(new Event("focus", { bubbles: true }));
          input.dispatchEvent(new Event("click", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          input.dispatchEvent(new Event("input", { bubbles: true }));
          
          // Also try triggering on parent element if it exists
          if (input.parentElement) {
            input.parentElement.dispatchEvent(new Event("click", { bubbles: true }));
          }
          
          checkboxCount++;
          
          // Small delay to ensure the checkbox state is processed
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        continue;
      }
      
      // Skip if already filled or not a fillable input
      if ((input.value && input.value.trim() !== '') || 
          type === 'submit' || type === 'button' || type === 'hidden' || type === 'radio') {
        continue;
      }

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

      // Special handling for date input types
      if (type === 'date' && profile.dob) {
        progressMsg.textContent = `🤖 Setting date...`;
        await simulateTyping(input, profile.dob);
        filledCount++;
        continue;
      }

      // Special handling for select dropdowns (especially state)
      if (input.tagName.toLowerCase() === 'select') {
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
            if (value) {
              progressMsg.textContent = `🤖 Setting ${key}...`;
              
              // For select elements, try to match by value or text
              const options = Array.from(input.options);
              let matched = false;
              
              // First try exact value match
              for (const option of options) {
                if (option.value.toLowerCase() === value.toLowerCase()) {
                  input.value = option.value;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  matched = true;
                  filledCount++;
                  break;
                }
              }
              
              // If no exact match, try text content match
              if (!matched) {
                for (const option of options) {
                  if (option.textContent.toLowerCase().includes(value.toLowerCase()) || 
                      value.toLowerCase().includes(option.textContent.toLowerCase())) {
                    input.value = option.value;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    matched = true;
                    filledCount++;
                    break;
                  }
                }
              }
            }
            break;
          }
        }
        continue;
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
            progressMsg.textContent = `🤖 Typing ${key}...`;
            await simulateTyping(input, value);
            filledCount++;
          }
          break;
        }
      }
    }

    // Special handling for ASA registration checkboxes
    progressMsg.textContent = "🤖 Checking ASA checkboxes...";
    const asaCheckedCount = await handleASACheckboxes();
    checkboxCount += asaCheckedCount;

    // Remove progress message
    if (document.body.contains(progressMsg)) {
      document.body.removeChild(progressMsg);
    }

    // Show final success message
    const totalFilled = filledCount + checkboxCount;
    if (totalFilled > 0) {
      console.log(`Auto Form Filler: Filled ${filledCount} fields and checked ${checkboxCount} checkboxes`);
      
      const successMsg = document.createElement("div");
      successMsg.textContent = `✓ Filled ${filledCount} fields, checked ${checkboxCount} boxes`;
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
      }, 4000);
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

  // Clear all form fields on the page
  function clearFormFields() {
    const inputs = document.querySelectorAll("input, textarea, select");
    let clearedCount = 0;

    inputs.forEach((input) => {
      const type = input.type ? input.type.toLowerCase() : '';
      
      // Handle checkboxes and radio buttons
      if (type === 'checkbox' || type === 'radio') {
        if (input.checked) {
          input.checked = false;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          clearedCount++;
        }
        return;
      }
      
      // Skip non-fillable inputs
      if (type === 'submit' || type === 'button' || type === 'hidden') {
        return;
      }

      // Clear text inputs, textareas, and selects
      if (input.value && input.value.trim() !== '') {
        input.value = '';
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        clearedCount++;
      }
    });

    return clearedCount;
  }

  // Check if there are any filled form fields
  function hasFilledFields() {
    const inputs = document.querySelectorAll("input, textarea, select");
    
    for (const input of inputs) {
      const type = input.type ? input.type.toLowerCase() : '';
      
      // Check checkboxes and radio buttons
      if ((type === 'checkbox' || type === 'radio') && input.checked) {
        return true;
      }
      
      // Skip non-fillable inputs
      if (type === 'submit' || type === 'button' || type === 'hidden') {
        continue;
      }

      // Check text inputs, textareas, and selects
      if (input.value && input.value.trim() !== '') {
        return true;
      }
    }
    
    return false;
  }

  // Enhanced delete function with dual functionality
  function deleteStoredData() {
    // First check if there are filled fields on the page
    if (hasFilledFields()) {
      if (confirm('Clear all form fields on this page?')) {
        const clearedCount = clearFormFields();
        
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.textContent = `🧹 Cleared ${clearedCount} fields`;
        successMsg.style.cssText = `
          position: fixed;
          top: 60px;
          right: 10px;
          background: #FF9800;
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
      }
    } else {
      // No filled fields, proceed to delete stored data
      if (confirm('Are you sure you want to delete all saved profile data? This action cannot be undone.')) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          alert('Profile data deleted successfully!');
          
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