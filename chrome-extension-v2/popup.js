// Popup script for Sequential Section Navigator Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const domainInfo = document.getElementById('domainInfo');

  try {
    // i get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      updateStatus(false, 'No active tab found', 'Unknown domain');
      return;
    }

    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // i check if we're on the correct domain
    if (domain.includes('skillsline.com')) {
      updateStatus(true, 'Ready on Skillsline', `Domain: ${domain}`);
      
      // i could check if the extension is actually active by sending a message
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'status_check' });
        if (response && response.active) {
          updateStatus(true, 'Navigator is active', `Domain: ${domain}`);
        } else {
          updateStatus(true, 'Navigator ready (click SSN button)', `Domain: ${domain}`);
        }
      } catch (error) {
        // i handle the case where content script might not be loaded yet
        updateStatus(true, 'Navigator ready (reload if needed)', `Domain: ${domain}`);
      }
    } else {
      updateStatus(false, 'Not on Skillsline domain', `Current: ${domain}`);
    }
    
  } catch (error) {
    console.error('Error in popup:', error);
    updateStatus(false, 'Error checking status', 'Unknown');
  }
});

function updateStatus(isActive, statusMessage, domainMessage) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const domainInfo = document.getElementById('domainInfo');
  
  if (isActive) {
    statusDot.classList.add('active');
  } else {
    statusDot.classList.remove('active');
  }
  
  statusText.textContent = statusMessage;
  domainInfo.textContent = domainMessage;
}