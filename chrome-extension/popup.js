// popup logic for auto form filler extension

// us states list for dropdown
const US_STATES = [
  { value: "", text: "select state..." },
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
  dob: "",
  school: "",
  zip: "",
  phone: "",
  email: "",
  password: "DefaultPass123!",
};

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

// parse user data from bulk text input
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
    console.error('error parsing data:', e);
    return null;
  }
}

// show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// load existing profile data
async function loadProfile() {
  try {
    const result = await chrome.storage.sync.get(['autoFormFillerProfile']);
    const profile = result.autoFormFillerProfile || defaultProfile;
    
    // i populate individual fields
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
    document.getElementById('state').value = profile.state || '';
    document.getElementById('city').value = profile.city || '';
    document.getElementById('dob').value = profile.dob ? convertDateToDisplay(profile.dob) : '';
    document.getElementById('school').value = profile.school || '';
    document.getElementById('zip').value = profile.zip || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('password').value = profile.password || 'DefaultPass123!';
    
  } catch (error) {
    console.error('error loading profile:', error);
    showStatus('error loading saved data', 'error');
  }
}

// save profile data
async function saveProfile() {
  try {
    // i get individual field values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value.trim();
    const dob = document.getElementById('dob').value.trim();
    const school = document.getElementById('school').value.trim();
    const zip = document.getElementById('zip').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // i get bulk data
    const bulkData = document.getElementById('bulkData').value.trim();
    
    // i start with parsed bulk data as base
    let profile = { ...defaultProfile };
    if (bulkData) {
      const parsedBulk = parseUserData(bulkData);
      if (parsedBulk) {
        profile = parsedBulk;
      }
    }
    
    // i override with individual field values (if provided)
    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (state) profile.state = state;
    if (city) profile.city = city;
    if (dob) {
      // convert display format (dd/mm/yyyy) to storage format
      const convertedDob = convertDateToStorage(dob);
      if (convertedDob) profile.dob = convertedDob;
    }
    if (school) profile.school = school;
    if (zip) profile.zip = zip;
    if (phone) profile.phone = phone;
    if (email) profile.email = email;
    if (password) profile.password = password;
    
    // i validate that we have at least some data
    if (!profile.firstName && !profile.lastName && !profile.email) {
      showStatus('please provide at least a name or email address', 'error');
      return;
    }
    
    // i save the profile
    await chrome.storage.sync.set({ autoFormFillerProfile: profile });
    showStatus('✅ data saved successfully!', 'success');
    
  } catch (error) {
    console.error('error saving profile:', error);
    showStatus('error saving data', 'error');
  }
}

// delete profile data
async function deleteProfile() {
  if (confirm('are you sure you want to delete all saved data?')) {
    try {
      await chrome.storage.sync.remove(['autoFormFillerProfile']);
      
      // i clear all form fields
      document.getElementById('firstName').value = '';
      document.getElementById('lastName').value = '';
      document.getElementById('state').value = '';
      document.getElementById('city').value = '';
      document.getElementById('dob').value = '';
      document.getElementById('school').value = '';
      document.getElementById('zip').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('email').value = '';
      document.getElementById('password').value = 'DefaultPass123!';
      document.getElementById('bulkData').value = '';
      
      showStatus('🗑️ data deleted successfully', 'success');
      
    } catch (error) {
      console.error('error deleting profile:', error);
      showStatus('error deleting data', 'error');
    }
  }
}

// initialize popup
document.addEventListener('DOMContentLoaded', function() {
  // i populate states dropdown
  const stateSelect = document.getElementById('state');
  US_STATES.forEach(state => {
    const option = document.createElement('option');
    option.value = state.value;
    option.textContent = state.text;
    stateSelect.appendChild(option);
  });
  
  // i handle tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      // i remove active class from all tabs and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // i add active class to clicked tab and corresponding content
      btn.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
  
  // i handle button clicks
  document.getElementById('saveBtn').addEventListener('click', saveProfile);
  document.getElementById('deleteBtn').addEventListener('click', deleteProfile);
  
  // i load existing profile data
  loadProfile();
});