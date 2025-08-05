// Content script for Sequential Section Navigator Chrome Extension
(function() {
  'use strict';

  // i check if we're on the correct domain
  if (!window.location.hostname.includes('skillsline.com')) {
    console.log("❌ Sequential Section Navigator: Not on skillsline.com domain");
    return;
  }

  // i prevent multiple initializations
  if (window.SSNInitialized) {
    console.log("⚠️ Sequential Section Navigator: Already initialized");
    return;
  }

  console.log("🚀 Sequential Section Navigator: Starting initialization");

  // i wait for all modules to be loaded
  function waitForModules() {
    return new Promise((resolve) => {
      const checkModules = () => {
        if (window.SSNConfig && 
            window.SSNUtils && 
            window.SSNBlockHandlers && 
            window.SSNUI && 
            window.SSNCore) {
          resolve();
        } else {
          setTimeout(checkModules, 100);
        }
      };
      checkModules();
    });
  }

  // i initialize the extension once modules are loaded
  waitForModules().then(() => {
    console.log("✅ All modules loaded, initializing core");
    
    // i mark as initialized to prevent duplicate runs
    window.SSNInitialized = true;
    
    // i initialize the core functionality
    window.SSNCore.initialize();
    
    console.log("🎉 Sequential Section Navigator: Fully initialized");
  }).catch((error) => {
    console.error("❌ Sequential Section Navigator: Initialization failed", error);
  });

  // i handle cleanup when the page is about to unload
  window.addEventListener('beforeunload', () => {
    if (window.SSNCore) {
      window.SSNCore.cleanup();
    }
  });

  // i handle visibility changes to pause/resume when tab is not active
  document.addEventListener('visibilitychange', () => {
    if (window.SSNCore) {
      if (document.hidden) {
        console.log("👁️ Tab hidden, pausing navigation");
        // i could pause navigation here if needed
      } else {
        console.log("👁️ Tab visible, resuming navigation");
        // i could resume navigation here if needed
      }
    }
  });

})();