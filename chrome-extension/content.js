(function () {
  "use strict";

  // storage key for user profile
  const STORAGE_KEY = "autoFormFillerProfile";

  // us states list for dropdown
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

  // default profile structure
  const defaultProfile = {
    firstName: "",
    lastName: "",
    state: "",
    city: "",
    dob: "", // iso format yyyy-mm-dd
    school: "",
    zip: "",
    phone: "",
    email: "",
    password: "DefaultPass123!",
  };

  // get stored profile using chrome storage
  async function getStoredProfile() {
    try {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getProfile' }, (response) => {
          resolve(response);
        });
      });
    } catch (e) {
      console.error("error reading stored profile:", e);
      return null;
    }
  }

  // save profile using chrome storage
  async function saveProfile(profile) {
    try {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'saveProfile', profile }, (response) => {
          resolve(response.success);
        });
      });
    } catch (e) {
      console.error("error saving profile:", e);
      return false;
    }
  }

  // delete stored profile using chrome storage
  async function deleteStoredProfile() {
    try {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'deleteProfile' }, (response) => {
          resolve(response.success);
        });
      });
    } catch (e) {
      console.error("error deleting stored profile:", e);
      return false;
    }
  }

  // convert date from dd/mm/yyyy to yyyy-mm-dd for storage
  function convertDateToStorage(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateStr;
  }

  // convert date from yyyy-mm-dd to dd/mm/yyyy for display
  function convertDateToDisplay(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    return dateStr;
  }

  // simulate human typing for better form recognition
  function simulateTyping(input, text) {
    return new Promise((resolve) => {
      const inputType = input.type ? input.type.toLowerCase() : '';
      
      // handle date inputs specially
      if (inputType === 'date') {
        input.focus();
        input.dispatchEvent(new Event('focus', { bubbles: true }));
        
        // for date inputs, convert dd/mm/yyyy to yyyy-mm-dd
        let dateValue = text;
        if (text && text.includes('/')) {
          const parts = text.split('/');
          if (parts.length === 3) {
            // convert dd/mm/yyyy to yyyy-mm-dd
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
      
      // for regular text inputs - ultra-fast typing
      input.value = '';
      input.focus();
      
      // trigger focus event
      input.dispatchEvent(new Event('focus', { bubbles: true }));
      
      let index = 0;
      const typeChar = () => {
        if (index < text.length) {
          input.value += text[index];
          
          // trigger input events for each character
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('keyup', { bubbles: true }));
          
          index++;
          setTimeout(typeChar, 2); // 2ms delay between characters - ultra fast!
        } else {
          // final events after typing is complete
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          resolve();
        }
      };
      
      setTimeout(typeChar, 10); // reduced initial delay
    });
  }

  // enhanced function to find the correct state option in custom dropdowns (li elements)
  function findCustomDropdownOption(container, stateValue) {
    if (!stateValue || !container) return null;
    
    // i look for list items that might contain state options
    const listItems = container.querySelectorAll('li, .dropdown-item, .menu-item, [class*="dropdown"][class*="item"], [class*="menu"][class*="item"]');
    const normalizedState = stateValue.trim().toLowerCase();
    
    // i create the same state mapping as before
    const stateNames = {
      'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas', 'ca': 'california',
      'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'fl': 'florida', 'ga': 'georgia',
      'hi': 'hawaii', 'id': 'idaho', 'il': 'illinois', 'in': 'indiana', 'ia': 'iowa',
      'ks': 'kansas', 'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
      'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi', 'mo': 'missouri',
      'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada', 'nh': 'new hampshire', 'nj': 'new jersey',
      'nm': 'new mexico', 'ny': 'new york', 'nc': 'north carolina', 'nd': 'north dakota', 'oh': 'ohio',
      'ok': 'oklahoma', 'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode island', 'sc': 'south carolina',
      'sd': 'south dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah', 'vt': 'vermont',
      'va': 'virginia', 'wa': 'washington', 'wv': 'west virginia', 'wi': 'wisconsin', 'wy': 'wyoming'
    };
    
    const reverseStateMap = {};
    Object.keys(stateNames).forEach(abbrev => {
      reverseStateMap[stateNames[abbrev]] = abbrev;
    });
    
    // i try the same matching strategies but for list items
    for (const item of listItems) {
      const itemText = item.textContent.trim().toLowerCase();
      const itemValue = item.getAttribute('value') || item.getAttribute('data-value') || '';
      const normalizedItemValue = itemValue.toLowerCase();
      
      // strategy 1: exact match
      if (itemText === normalizedState || normalizedItemValue === normalizedState) {
        return item;
      }
      
      // strategy 2: if stored state is abbreviation, try full name
      if (stateNames[normalizedState] && itemText === stateNames[normalizedState]) {
        return item;
      }
      
      // strategy 3: if stored state is full name, try abbreviation
      if (reverseStateMap[normalizedState] && itemText === reverseStateMap[normalizedState]) {
        return item;
      }
      
      // strategy 4: partial match
      if (itemText.includes(normalizedState)) {
        return item;
      }
      
      // strategy 5: if stored is abbreviation, check if item contains full name
      if (stateNames[normalizedState] && itemText.includes(stateNames[normalizedState])) {
        return item;
      }
    }
    
    return null;
  }

  // function to handle custom state dropdowns (non-standard select elements)
  async function handleCustomStateDropdowns(profile) {
    if (!profile.state) return 0;
    
    let filledCount = 0;
    
    // i look for custom dropdown containers that might contain states
    const dropdownContainers = document.querySelectorAll([
      '[class*="dropdown"]',
      '[class*="select"]', 
      '[class*="menu"]',
      '[class*="picker"]',
      '[data-testid*="state"]',
      '[data-testid*="dropdown"]'
    ].join(', '));
    
    for (const container of dropdownContainers) {
      // i check if this container might be for states
      const containerText = container.textContent.toLowerCase();
      const containerClasses = container.className.toLowerCase();
      const containerAttributes = Array.from(container.attributes).map(attr => 
        `${attr.name}="${attr.value}"`).join(' ').toLowerCase();
      
      const allContainerInfo = `${containerText} ${containerClasses} ${containerAttributes}`;
      
      if (allContainerInfo.includes('state') || 
          allContainerInfo.includes('province') ||
          allContainerInfo.includes('region') ||
          // i also check if it contains multiple US state names (likely a state dropdown)
          (containerText.includes('alabama') && containerText.includes('california') && containerText.includes('texas'))) {
        
        // i try to find the matching state option
        const matchedItem = findCustomDropdownOption(container, profile.state);
        
        if (matchedItem) {
          // i need to open the dropdown first if it's closed
          const trigger = container.querySelector('[class*="dropdown"]:not([class*="menu"]), .select-trigger, .dropdown-trigger');
          if (trigger && !container.querySelector('[class*="menu"]:not([style*="display: none"])')) {
            trigger.click();
            await new Promise(resolve => setTimeout(resolve, 200)); // wait for dropdown to open
          }
          
          // i click on the matched item
          matchedItem.click();
          filledCount++;
          console.log(`✅ filled custom state dropdown: ${profile.state} -> ${matchedItem.textContent.trim()}`);
          
          // i wait a bit for the selection to register
          await new Promise(resolve => setTimeout(resolve, 100));
          break; // i only fill one state dropdown
        }
      }
    }
    
    return filledCount;
  }

  // enhanced function to handle various types of checkboxes
  async function handleCheckboxes(profile) {
    let checkedCount = 0;
    
    // i look for checkboxes that might need to be checked
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    for (const checkbox of checkboxes) {
      if (checkbox.checked) continue; // skip already checked boxes
      
      const checkboxId = checkbox.id ? checkbox.id.toLowerCase() : '';
      const checkboxName = checkbox.name ? checkbox.name.toLowerCase() : '';
      const checkboxClass = checkbox.className ? checkbox.className.toLowerCase() : '';
      
      // i look for labels associated with this checkbox
      let labelText = '';
      const label = document.querySelector(`label[for="${checkbox.id}"]`) || 
                   checkbox.closest('label') ||
                   checkbox.parentElement.querySelector('label');
      if (label) {
        labelText = label.textContent.toLowerCase();
      }
      
      const allCheckboxInfo = `${checkboxId} ${checkboxName} ${checkboxClass} ${labelText}`.toLowerCase();
      
      // i check for common checkbox patterns that usually need to be checked
      const shouldCheck = 
        allCheckboxInfo.includes('terms') ||
        allCheckboxInfo.includes('conditions') ||
        allCheckboxInfo.includes('agree') ||
        allCheckboxInfo.includes('accept') ||
        allCheckboxInfo.includes('consent') ||
        allCheckboxInfo.includes('privacy') ||
        allCheckboxInfo.includes('policy') ||
        allCheckboxInfo.includes('age') ||
        allCheckboxInfo.includes('18') ||
        allCheckboxInfo.includes('adult') ||
        allCheckboxInfo.includes('marketing') ||
        allCheckboxInfo.includes('newsletter') ||
        // asa specific ones
        checkboxId.includes('accept_terms') ||
        checkboxId.includes('accept_marketing');
      
      if (shouldCheck) {
        // i use multiple methods to ensure the checkbox gets checked
        checkbox.focus();
        checkbox.checked = true;
        
        // i dispatch various events to ensure compatibility
        checkbox.dispatchEvent(new Event("focus", { bubbles: true }));
        checkbox.dispatchEvent(new Event("click", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        
        // i also try clicking the parent container for custom styled checkboxes
        if (checkbox.parentElement) {
          checkbox.parentElement.click();
        }
        
        checkedCount++;
        console.log(`✅ checked checkbox: ${checkboxId || checkboxName || 'unnamed'}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return checkedCount;
  }

  // enhanced function to find the correct state option in dropdowns
  function findStateOption(selectElement, stateValue) {
    if (!stateValue || !selectElement) return null;
    
    const options = selectElement.querySelectorAll('option');
    const normalizedState = stateValue.trim().toLowerCase();
    
    // i create a mapping for state abbreviations to full names
    const stateMap = {};
    const reverseStateMap = {};
    
    US_STATES.forEach(state => {
      const abbrev = state.toLowerCase();
      // i assume the stored state is either abbreviation or we need to find the full name
      // this is a simplified mapping - in a real app you'd have a complete state mapping
      const stateNames = {
        'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas', 'ca': 'california',
        'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'fl': 'florida', 'ga': 'georgia',
        'hi': 'hawaii', 'id': 'idaho', 'il': 'illinois', 'in': 'indiana', 'ia': 'iowa',
        'ks': 'kansas', 'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
        'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi', 'mo': 'missouri',
        'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada', 'nh': 'new hampshire', 'nj': 'new jersey',
        'nm': 'new mexico', 'ny': 'new york', 'nc': 'north carolina', 'nd': 'north dakota', 'oh': 'ohio',
        'ok': 'oklahoma', 'or': 'oregon', 'pa': 'pennsylvania', 'ri': 'rhode island', 'sc': 'south carolina',
        'sd': 'south dakota', 'tn': 'tennessee', 'tx': 'texas', 'ut': 'utah', 'vt': 'vermont',
        'va': 'virginia', 'wa': 'washington', 'wv': 'west virginia', 'wi': 'wisconsin', 'wy': 'wyoming'
      };
      
      if (stateNames[abbrev]) {
        stateMap[abbrev] = stateNames[abbrev];
        reverseStateMap[stateNames[abbrev]] = abbrev;
      }
    });
    
    // i try multiple matching strategies in order of preference
    for (const option of options) {
      const optionValue = option.value.trim().toLowerCase();
      const optionText = option.textContent.trim().toLowerCase();
      
      // strategy 1: exact match with value or text
      if (optionValue === normalizedState || optionText === normalizedState) {
        return option;
      }
      
      // strategy 2: if stored state is abbreviation, try full name
      if (stateMap[normalizedState]) {
        const fullName = stateMap[normalizedState];
        if (optionValue === fullName || optionText === fullName) {
          return option;
        }
      }
      
      // strategy 3: if stored state is full name, try abbreviation
      if (reverseStateMap[normalizedState]) {
        const abbrev = reverseStateMap[normalizedState];
        if (optionValue === abbrev || optionText === abbrev) {
          return option;
        }
      }
      
      // strategy 4: handle mixed formats like "CA - California" or "California (CA)"
      if (stateMap[normalizedState]) {
        const fullName = stateMap[normalizedState];
        if (optionText.includes(normalizedState) && optionText.includes(fullName)) {
          return option;
        }
      }
      
      if (reverseStateMap[normalizedState]) {
        const abbrev = reverseStateMap[normalizedState];
        if (optionText.includes(abbrev) && optionText.includes(normalizedState)) {
          return option;
        }
      }
      
      // strategy 5: partial match (contains the state)
      if (optionText.includes(normalizedState) || optionValue.includes(normalizedState)) {
        return option;
      }
      
      // strategy 6: if stored is abbreviation, check if option contains full name
      if (stateMap[normalizedState] && optionText.includes(stateMap[normalizedState])) {
        return option;
      }
      
      // strategy 7: if stored is full name, check if option contains abbreviation
      if (reverseStateMap[normalizedState] && optionText.includes(reverseStateMap[normalizedState])) {
        return option;
      }
    }
    
    return null; // no match found
  }

  // main form filling function
  async function fillForm() {
    const profile = await getStoredProfile();
    if (!profile) {
      alert("❌ no profile data found. please set up your profile first using the extension popup.");
      return;
    }

    console.log("🔄 starting form fill with profile:", profile);

    // i collect all possible form fields
    const allInputs = document.querySelectorAll('input, select, textarea');
    let filledCount = 0;

    for (const input of allInputs) {
      if (input.type === 'hidden' || input.disabled || input.readOnly) {
        continue;
      }

      const inputId = input.id ? input.id.toLowerCase() : '';
      const inputName = input.name ? input.name.toLowerCase() : '';
      const inputClass = input.className ? input.className.toLowerCase() : '';
      const inputPlaceholder = input.placeholder ? input.placeholder.toLowerCase() : '';
      const inputType = input.type ? input.type.toLowerCase() : '';
      
      // i combine all identifiers for matching
      const allIdentifiers = `${inputId} ${inputName} ${inputClass} ${inputPlaceholder}`.toLowerCase();

      try {
        // first name matching
        if ((allIdentifiers.includes('first') && allIdentifiers.includes('name')) || 
            allIdentifiers.includes('firstname') || 
            allIdentifiers.includes('fname') ||
            inputId === 'first_name' ||
            inputName === 'first_name') {
          if (profile.firstName && !input.value) {
            await simulateTyping(input, profile.firstName);
            filledCount++;
            console.log(`✅ filled first name: ${profile.firstName}`);
          }
        }
        
        // last name matching
        else if ((allIdentifiers.includes('last') && allIdentifiers.includes('name')) || 
                 allIdentifiers.includes('lastname') || 
                 allIdentifiers.includes('lname') ||
                 allIdentifiers.includes('surname') ||
                 inputId === 'last_name' ||
                 inputName === 'last_name') {
          if (profile.lastName && !input.value) {
            await simulateTyping(input, profile.lastName);
            filledCount++;
            console.log(`✅ filled last name: ${profile.lastName}`);
          }
        }
        
        // email matching
        else if (inputType === 'email' || 
                 allIdentifiers.includes('email') || 
                 allIdentifiers.includes('e-mail') ||
                 allIdentifiers.includes('mail')) {
          if (profile.email && !input.value) {
            await simulateTyping(input, profile.email);
            filledCount++;
            console.log(`✅ filled email: ${profile.email}`);
          }
        }
        
        // phone matching
        else if (inputType === 'tel' || 
                 allIdentifiers.includes('phone') || 
                 allIdentifiers.includes('mobile') ||
                 allIdentifiers.includes('telephone')) {
          if (profile.phone && !input.value) {
            await simulateTyping(input, profile.phone);
            filledCount++;
            console.log(`✅ filled phone: ${profile.phone}`);
          }
        }
        
        // date of birth matching
        else if (inputType === 'date' || 
                 allIdentifiers.includes('birth') || 
                 allIdentifiers.includes('dob') ||
                 allIdentifiers.includes('birthday')) {
          if (profile.dob && !input.value) {
            const displayDate = convertDateToDisplay(profile.dob);
            await simulateTyping(input, displayDate);
            filledCount++;
            console.log(`✅ filled date of birth: ${displayDate}`);
          }
        }
        
        // city matching
        else if (allIdentifiers.includes('city') || 
                 allIdentifiers.includes('town')) {
          if (profile.city && !input.value) {
            await simulateTyping(input, profile.city);
            filledCount++;
            console.log(`✅ filled city: ${profile.city}`);
          }
        }
        
        // state matching - enhanced dropdown support
        else if (allIdentifiers.includes('state') || 
                 allIdentifiers.includes('province') ||
                 allIdentifiers.includes('region')) {
          if (profile.state && !input.value) {
            if (input.tagName.toLowerCase() === 'select') {
              // i use the enhanced state matching function
              const matchedOption = findStateOption(input, profile.state);
              if (matchedOption) {
                input.value = matchedOption.value;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                filledCount++;
                console.log(`✅ filled state dropdown: ${profile.state} -> ${matchedOption.textContent.trim()}`);
              } else {
                console.log(`⚠️ could not find matching state option for: ${profile.state}`);
              }
            } else {
              await simulateTyping(input, profile.state);
              filledCount++;
              console.log(`✅ filled state: ${profile.state}`);
            }
          }
        }
        
        // zip code matching
        else if (allIdentifiers.includes('zip') || 
                 allIdentifiers.includes('postal') ||
                 allIdentifiers.includes('postcode')) {
          if (profile.zip && !input.value) {
            await simulateTyping(input, profile.zip);
            filledCount++;
            console.log(`✅ filled zip: ${profile.zip}`);
          }
        }
        
        // school matching
        else if (allIdentifiers.includes('school') || 
                 allIdentifiers.includes('university') ||
                 allIdentifiers.includes('college') ||
                 allIdentifiers.includes('institution')) {
          if (profile.school && !input.value) {
            await simulateTyping(input, profile.school);
            filledCount++;
            console.log(`✅ filled school: ${profile.school}`);
          }
        }
        
        // password matching
        else if (inputType === 'password') {
          if (profile.password && !input.value) {
            await simulateTyping(input, profile.password);
            filledCount++;
            console.log(`✅ filled password`);
          }
        }

        // small delay between fields to avoid overwhelming the page
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`error filling field:`, error);
      }
    }

    // handle custom state dropdowns (for non-standard dropdowns like Vue components)
    const customStateCount = await handleCustomStateDropdowns(profile);
    filledCount += customStateCount;

    // handle various checkboxes (enhanced version)
    const checkboxCount = await handleCheckboxes(profile);
    filledCount += checkboxCount;

    console.log(`🎉 form filling complete! filled ${filledCount} fields`);
    
    // show success message
    if (filledCount > 0) {
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      successMsg.textContent = `✅ filled ${filledCount} form fields!`;
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        if (successMsg.parentNode) {
          successMsg.parentNode.removeChild(successMsg);
        }
      }, 3000);
    }
  }

  // add floating fill button
  function addFillFormButton() {
    // remove existing button if present
    const existingBtn = document.getElementById('autoFormFillerBtn');
    if (existingBtn) {
      existingBtn.remove();
    }

    const button = document.createElement('button');
    button.id = 'autoFormFillerBtn';
    button.innerHTML = '🔄 fill form';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #2196F3;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    button.onmouseover = function() {
      this.style.background = '#1976D2';
      this.style.transform = 'scale(1.05)';
    };

    button.onmouseout = function() {
      this.style.background = '#2196F3';
      this.style.transform = 'scale(1)';
    };

    button.onclick = fillForm;
    document.body.appendChild(button);
  }

  // initialize when page loads
  function init() {
    // i wait a bit for the page to fully load
    setTimeout(() => {
      addFillFormButton();
    }, 1000);
  }

  // start the extension
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();