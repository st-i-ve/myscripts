// background service worker for auto form filler extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('auto form filler extension installed');
});

// i handle storage operations and cross-tab communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProfile') {
    chrome.storage.sync.get(['autoFormFillerProfile'], (result) => {
      sendResponse(result.autoFormFillerProfile || null);
    });
    return true; // keep message channel open for async response
  }
  
  if (request.action === 'saveProfile') {
    chrome.storage.sync.set({ autoFormFillerProfile: request.profile }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'deleteProfile') {
    chrome.storage.sync.remove(['autoFormFillerProfile'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});