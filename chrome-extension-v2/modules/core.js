// Core module for Sequential Section Navigator
window.SSNCore = {
  isActive: false,
  currentIframe: null,
  mutationObserver: null,
  processedBlocks: new Set(),
  
  // function to initialize the navigator
  initialize() {
    if (!window.SSNUtils.isValidDomain()) {
      window.SSNUtils.log("❌", "Not on skillsline.com domain");
      return;
    }

    window.SSNUtils.log("🚀", "Initializing Sequential Section Navigator");
    
    // i initialize the UI
    window.SSNUI.initializeUI();
    
    // i start observing for iframes
    this.observeForIframes();
    
    window.SSNUtils.log("✅", "Sequential Section Navigator initialized");
  },

  // function to toggle navigation on/off
  toggleNavigation() {
    this.isActive = !this.isActive;
    window.SSNUI.updateToggleButton(this.isActive);
    
    if (this.isActive) {
      window.SSNUtils.log("🟢", "Navigation activated");
      this.startNavigation();
    } else {
      window.SSNUtils.log("🔴", "Navigation deactivated");
      this.stopNavigation();
    }
  },

  // function to start navigation
  startNavigation() {
    if (this.currentIframe) {
      this.processIframe(this.currentIframe);
    }
  },

  // function to stop navigation
  stopNavigation() {
    window.SSNUI.updateCategoryDisplay('Navigation stopped', false);
  },

  // function to observe for iframes
  observeForIframes() {
    // i look for existing iframes first
    const existingIframes = document.querySelectorAll('iframe');
    existingIframes.forEach(iframe => this.handleIframeFound(iframe));

    // i set up mutation observer to watch for new iframes
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IFRAME') {
              this.handleIframeFound(node);
            } else {
              // i check for iframes within added elements
              const iframes = node.querySelectorAll && node.querySelectorAll('iframe');
              if (iframes) {
                iframes.forEach(iframe => this.handleIframeFound(iframe));
              }
            }
          }
        });
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.SSNUtils.log("👀", "Observing for iframes");
  },

  // function to handle when iframe is found
  handleIframeFound(iframe) {
    window.SSNUtils.log("🖼️", "Iframe found, setting up monitoring");
    
    this.currentIframe = iframe;
    
    // i wait for iframe to load then start monitoring
    iframe.addEventListener('load', () => {
      window.SSNUtils.log("📄", "Iframe loaded");
      if (this.isActive) {
        this.processIframe(iframe);
      }
    });

    // i also try to process immediately in case it's already loaded
    if (this.isActive) {
      setTimeout(() => this.processIframe(iframe), 1000);
    }
  },

  // function to process iframe content
  async processIframe(iframe) {
    const iframeDoc = window.SSNUtils.getIframeDocument(iframe);
    const iframeWindow = window.SSNUtils.getIframeWindow(iframe);
    
    if (!iframeDoc || !iframeWindow) {
      window.SSNUtils.log("❌", "Cannot access iframe content");
      return;
    }

    // i detect the block type
    const blockType = this.detectBlockType(iframeDoc);
    window.SSNUtils.log("🔍", `Detected block type: ${blockType}`);
    
    // i update the UI with the detected block type
    window.SSNUI.showCategoryTemporarily(blockType);
    
    // i generate a unique ID for this block to avoid reprocessing
    const blockId = this.generateBlockId(iframeDoc);
    if (this.processedBlocks.has(blockId)) {
      window.SSNUtils.log("⏭️", "Block already processed, skipping");
      return;
    }

    // i process the block based on its type
    const success = await this.processBlock(blockType, iframeDoc, iframeWindow);
    
    if (success) {
      this.processedBlocks.add(blockId);
      window.SSNUtils.log("✅", `Successfully processed ${blockType}`);
    } else {
      window.SSNUtils.log("⚠️", `Failed to process ${blockType}`);
    }

    // i set up observer for changes within the iframe
    this.observeIframeChanges(iframe, iframeDoc);
  },

  // function to detect block type based on content
  detectBlockType(iframeDoc) {
    // i check for sorting activity
    if (iframeDoc.querySelector('.sorting')) {
      return "sorting activity - manual sorting";
    }

    // i check for process blocks
    if (window.SSNUtils.findElementBySelectors(iframeDoc, window.SSNConfig.selectors.process)) {
      return "process - auto click with next wait";
    }

    // i check for scenario blocks
    if (window.SSNUtils.findElementBySelectors(iframeDoc, window.SSNConfig.selectors.scenario)) {
      return "scenario - auto continue with next wait";
    }

    // i check for flashcards
    if (iframeDoc.querySelector('.flashcard')) {
      return "flashcards - flip cards";
    }

    // i check for accordion
    if (iframeDoc.querySelector('.accordion-header, .accordion-toggle, [data-toggle="collapse"]')) {
      return "accordion - open all accordions";
    }

    // i check for labeled graphic
    if (iframeDoc.querySelector('.label, .hotspot, [class*="label"]')) {
      return "labeled graphic - open labels";
    }

    // i check for knowledge blocks with radio buttons
    if (iframeDoc.querySelector('input[type="radio"]')) {
      return "knowledge - answer with radio";
    }

    // i check for knowledge blocks with checkboxes
    if (iframeDoc.querySelector('input[type="checkbox"]')) {
      return "knowledge - answer with checkbox";
    }

    // i check for continue button
    if (window.SSNUtils.findElementBySelectors(iframeDoc, window.SSNConfig.selectors.nextButton)) {
      return "continue button - click";
    }

    // i default to general knowledge
    return "knowledge - general";
  },

  // function to process block based on type
  async processBlock(blockType, iframeDoc, iframeWindow) {
    switch (blockType) {
      case "sorting activity - manual sorting":
        return await window.SSNBlockHandlers.handleSorting(iframeDoc, iframeWindow);
      
      case "process - auto click with next wait":
        return await window.SSNBlockHandlers.handleProcess(iframeDoc, iframeWindow);
      
      case "scenario - auto continue with next wait":
        return await window.SSNBlockHandlers.handleScenario(iframeDoc, iframeWindow);
      
      case "flashcards - flip cards":
        return await window.SSNBlockHandlers.handleFlashcards(iframeDoc, iframeWindow);
      
      case "accordion - open all accordions":
        return await window.SSNBlockHandlers.handleAccordion(iframeDoc, iframeWindow);
      
      case "labeled graphic - open labels":
        return await window.SSNBlockHandlers.handleLabeledGraphic(iframeDoc, iframeWindow);
      
      case "continue button - click":
        return await window.SSNBlockHandlers.handleContinueButton(iframeDoc, iframeWindow);
      
      case "knowledge - answer with radio":
        return await window.SSNBlockHandlers.handleKnowledgeRadio(iframeDoc, iframeWindow);
      
      case "knowledge - answer with checkbox":
        return await window.SSNBlockHandlers.handleKnowledgeCheckbox(iframeDoc, iframeWindow);
      
      case "knowledge - general":
        return await window.SSNBlockHandlers.handleKnowledgeGeneral(iframeDoc, iframeWindow);
      
      default:
        window.SSNUtils.log("❓", `Unknown block type: ${blockType}`);
        return false;
    }
  },

  // function to generate unique block ID
  generateBlockId(iframeDoc) {
    // i create a simple hash based on the document content
    const content = iframeDoc.body ? iframeDoc.body.innerHTML : '';
    const hash = content.length + (content.match(/class=/g) || []).length;
    return `block-${hash}-${Date.now()}`;
  },

  // function to observe changes within iframe
  observeIframeChanges(iframe, iframeDoc) {
    // i set up mutation observer for iframe content changes
    const iframeObserver = new MutationObserver((mutations) => {
      if (!this.isActive) return;
      
      let shouldReprocess = false;
      mutations.forEach((mutation) => {
        // i check if significant changes occurred
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          shouldReprocess = true;
        }
      });

      if (shouldReprocess) {
        window.SSNUtils.log("🔄", "Iframe content changed, reprocessing");
        setTimeout(() => this.processIframe(iframe), 500);
      }
    });

    iframeObserver.observe(iframeDoc.body, {
      childList: true,
      subtree: true
    });
  },

  // function to cleanup resources
  cleanup() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    this.processedBlocks.clear();
    this.currentIframe = null;
    this.isActive = false;
    
    window.SSNUI.cleanup();
    window.SSNUtils.log("🧹", "Core cleanup completed");
  }
};