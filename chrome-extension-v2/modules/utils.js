// Utilities module for Sequential Section Navigator
window.SSNUtils = {
  // function to check if element is visible in the iframe's viewport
  isInViewport(el, iframeWindow) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (iframeWindow.innerHeight ||
          iframeWindow.document.documentElement.clientHeight) &&
      rect.right <=
        (iframeWindow.innerWidth ||
          iframeWindow.document.documentElement.clientWidth)
    );
  },

  // function to scroll element into view and wait
  scrollIntoViewAndWait(element) {
    return new Promise((resolve) => {
      // i scroll the element into view smoothly
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // i wait a bit for the scroll to complete
      setTimeout(resolve, window.SSNConfig.timing.scrollWait);
    });
  },

  // function to check if we're on the correct domain
  isValidDomain() {
    return window.location.hostname.includes('skillsline.com');
  },

  // function to safely get iframe document
  getIframeDocument(iframe) {
    try {
      return iframe.contentDocument || iframe.contentWindow.document;
    } catch (err) {
      console.warn("❌ Cannot access iframe document:", err);
      return null;
    }
  },

  // function to safely get iframe window
  getIframeWindow(iframe) {
    try {
      return iframe.contentWindow;
    } catch (err) {
      console.warn("❌ Cannot access iframe window:", err);
      return null;
    }
  },

  // function to generate unique block ID
  generateBlockId(element) {
    // i try to create a unique identifier for the block
    const classList = Array.from(element.classList).join('-');
    const position = element.getBoundingClientRect();
    return `${classList}-${Math.round(position.top)}-${Math.round(position.left)}`;
  },

  // function to wait with timeout
  waitWithTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // function to find element with multiple selectors
  findElementBySelectors(container, selectors) {
    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.offsetParent !== null) {
        return element;
      }
    }
    return null;
  },

  // function to log with emoji prefix
  log(emoji, message, ...args) {
    console.log(`${emoji} ${message}`, ...args);
  },

  // function to safely click element
  safeClick(element, description = "element") {
    try {
      if (element && typeof element.click === 'function') {
        element.click();
        return true;
      } else {
        this.log("⚠️", `Cannot click ${description} - element not clickable`);
        return false;
      }
    } catch (err) {
      this.log("❌", `Error clicking ${description}:`, err);
      return false;
    }
  }
};