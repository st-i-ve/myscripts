// Sequential Section Navigator V9.5 - Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Sequential Section Navigator V9.5 extension installed');
});

// i handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    // i can add status tracking here if needed
    sendResponse({ status: 'ready' });
  }
  
  if (request.action === 'log') {
    console.log('Content Script Log:', request.message);
  }
  
  return true;
});

// i handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // i check if we're on skillsline.com
  if (tab.url && tab.url.includes('skillsline.com')) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleNavigation' });
  } else {
    // i show notification if not on skillsline.com
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Sequential Section Navigator',
      message: 'This extension only works on skillsline.com'
    });
  }
});