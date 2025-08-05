// Background service worker for Sequential Section Navigator Chrome Extension

// i handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 Sequential Section Navigator installed:', details.reason);
  
  if (details.reason === 'install') {
    console.log('✅ Extension installed for the first time');
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated');
  }
});

// i handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🌅 Sequential Section Navigator starting up');
});

// i handle messages from content scripts (if needed in the future)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received in background:', request);
  
  // i could handle different message types here
  switch (request.type) {
    case 'log':
      console.log('📝 Content script log:', request.message);
      break;
    
    case 'error':
      console.error('❌ Content script error:', request.error);
      break;
    
    default:
      console.log('❓ Unknown message type:', request.type);
  }
  
  // i send response if needed
  sendResponse({ success: true });
});

// i handle tab updates to inject content script when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // i only act when the page is completely loaded
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('skillsline.com')) {
    console.log('🌐 Skillsline.com page loaded, content script should be injected automatically');
  }
});

// i handle extension icon clicks (if we add a popup later)
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Extension icon clicked on tab:', tab.id);
  
  // i could open a popup or perform an action here
  // for now, i just log the event
});

console.log('🎯 Sequential Section Navigator background script loaded');