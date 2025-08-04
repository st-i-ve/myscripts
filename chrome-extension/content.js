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

  // specific function to handle asa registration checkboxes
  async function handleASACheckboxes() {
    const asaCheckboxes = [
      'accept_terms_and_conditions',
      'accept_marketing'
    ];
    
    let checkedCount = 0;
    
    for (const checkboxId of asaCheckboxes) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox && !checkbox.checked) {
        // multiple approaches to ensure the checkbox gets checked
        checkbox.focus();
        
        // method 1: direct property setting with events
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("focus", { bubbles: true }));
        checkbox.dispatchEvent(new Event("click", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        
        // method 2: simulate actual click on the element
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        checkbox.dispatchEvent(clickEvent);
        
        // method 3: try clicking the parent container (for custom styled checkboxes)
        if (checkbox.parentElement) {
          checkbox.parentElement.click();
        }
        
        checkedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (checkedCount > 0) {
      console.log(`✅ checked ${checkedCount} asa checkboxes`);
    }
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
        
        // state matching
        else if (allIdentifiers.includes('state') || 
                 allIdentifiers.includes('province') ||
                 allIdentifiers.includes('region')) {
          if (profile.state && !input.value) {
            if (input.tagName.toLowerCase() === 'select') {
              // for select dropdowns, try to find matching option
              const options = input.querySelectorAll('option');
              for (const option of options) {
                if (option.value === profile.state || 
                    option.textContent.trim() === profile.state) {
                  input.value = option.value;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  filledCount++;
                  console.log(`✅ filled state dropdown: ${profile.state}`);
                  break;
                }
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

    // handle asa specific checkboxes
    await handleASACheckboxes();

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