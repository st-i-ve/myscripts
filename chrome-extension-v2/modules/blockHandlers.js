// Block handlers module for Sequential Section Navigator
window.SSNBlockHandlers = {
  // handler for sorting activities
  async handleSorting(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🎯", "Handling sorting activity");
    
    const sortingContainer = iframeDoc.querySelector('.sorting');
    if (!sortingContainer) {
      window.SSNUtils.log("❌", "No sorting container found");
      return false;
    }

    // i add hint dots to all cards
    const cards = sortingContainer.querySelectorAll('.playing-card');
    cards.forEach(card => {
      if (!card.querySelector('.hint-dot')) {
        const cardText = card.textContent.trim();
        const position = window.SSNConfig.sortingConfig[cardText];
        
        if (position) {
          const dot = iframeDoc.createElement('div');
          dot.className = `hint-dot dot-${position}`;
          card.style.position = 'relative';
          card.appendChild(dot);
        }
      }
    });

    window.SSNUtils.log("✅", "Added hint dots to sorting cards");
    return true;
  },

  // handler for process blocks
  async handleProcess(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🔄", "Handling process block");
    
    let clickCount = 0;
    const maxClicks = window.SSNConfig.timing.maxClicks;
    
    while (clickCount < maxClicks) {
      const processButton = window.SSNUtils.findElementBySelectors(
        iframeDoc, 
        window.SSNConfig.selectors.process
      );
      
      if (!processButton) {
        window.SSNUtils.log("✅", "No more process buttons found");
        break;
      }

      if (!window.SSNUtils.isInViewport(processButton, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(processButton);
      }

      if (window.SSNUtils.safeClick(processButton, "process button")) {
        clickCount++;
        window.SSNUtils.log("👆", `Process click ${clickCount}`);
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
      } else {
        break;
      }
    }

    // i check for next button after process completion
    await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.nextButtonCheck);
    const nextButton = window.SSNUtils.findElementBySelectors(
      iframeDoc,
      window.SSNConfig.selectors.nextButtonExcludeProcess
    );
    
    if (nextButton) {
      if (!window.SSNUtils.isInViewport(nextButton, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(nextButton);
      }
      window.SSNUtils.safeClick(nextButton, "next button after process");
    }

    return true;
  },

  // handler for scenario blocks
  async handleScenario(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🎭", "Handling scenario block");
    
    let clickCount = 0;
    const maxClicks = window.SSNConfig.timing.maxClicks;
    
    while (clickCount < maxClicks) {
      const scenarioButton = window.SSNUtils.findElementBySelectors(
        iframeDoc,
        window.SSNConfig.selectors.scenario
      );
      
      if (!scenarioButton) {
        window.SSNUtils.log("✅", "No more scenario buttons found");
        break;
      }

      if (!window.SSNUtils.isInViewport(scenarioButton, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(scenarioButton);
      }

      if (window.SSNUtils.safeClick(scenarioButton, "scenario button")) {
        clickCount++;
        window.SSNUtils.log("👆", `Scenario click ${clickCount}`);
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
      } else {
        break;
      }
    }

    // i check for next button after scenario completion
    await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.nextButtonCheck);
    const nextButton = window.SSNUtils.findElementBySelectors(
      iframeDoc,
      window.SSNConfig.selectors.nextButton
    );
    
    if (nextButton) {
      if (!window.SSNUtils.isInViewport(nextButton, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(nextButton);
      }
      window.SSNUtils.safeClick(nextButton, "next button after scenario");
    }

    return true;
  },

  // handler for flashcards
  async handleFlashcards(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🃏", "Handling flashcards");
    
    const flashcards = iframeDoc.querySelectorAll('.flashcard');
    for (const card of flashcards) {
      if (!window.SSNUtils.isInViewport(card, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(card);
      }
      
      if (window.SSNUtils.safeClick(card, "flashcard")) {
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
      }
    }

    return true;
  },

  // handler for accordion blocks
  async handleAccordion(iframeDoc, iframeWindow) {
    window.SSNUtils.log("📋", "Handling accordion");
    
    const accordionHeaders = iframeDoc.querySelectorAll('.accordion-header, .accordion-toggle, [data-toggle="collapse"]');
    for (const header of accordionHeaders) {
      if (!window.SSNUtils.isInViewport(header, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(header);
      }
      
      if (window.SSNUtils.safeClick(header, "accordion header")) {
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
      }
    }

    return true;
  },

  // handler for labeled graphics
  async handleLabeledGraphic(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🏷️", "Handling labeled graphic");
    
    const labels = iframeDoc.querySelectorAll('.label, .hotspot, [class*="label"]');
    for (const label of labels) {
      if (!window.SSNUtils.isInViewport(label, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(label);
      }
      
      if (window.SSNUtils.safeClick(label, "graphic label")) {
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
      }
    }

    return true;
  },

  // handler for continue buttons
  async handleContinueButton(iframeDoc, iframeWindow) {
    window.SSNUtils.log("➡️", "Handling continue button");
    
    const continueButton = window.SSNUtils.findElementBySelectors(
      iframeDoc,
      window.SSNConfig.selectors.nextButton
    );
    
    if (continueButton) {
      if (!window.SSNUtils.isInViewport(continueButton, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(continueButton);
      }
      window.SSNUtils.safeClick(continueButton, "continue button");
      return true;
    }

    return false;
  },

  // handler for knowledge blocks with radio buttons
  async handleKnowledgeRadio(iframeDoc, iframeWindow) {
    window.SSNUtils.log("📚", "Handling knowledge block with radio buttons");
    
    const radioButtons = iframeDoc.querySelectorAll('input[type="radio"]');
    if (radioButtons.length > 0) {
      // i select the first radio button as default
      const firstRadio = radioButtons[0];
      if (!window.SSNUtils.isInViewport(firstRadio, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(firstRadio);
      }
      
      if (window.SSNUtils.safeClick(firstRadio, "radio button")) {
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
        
        // i look for submit or next button
        const submitButton = iframeDoc.querySelector('button[type="submit"], .submit-btn, .next-btn');
        if (submitButton) {
          if (!window.SSNUtils.isInViewport(submitButton, iframeWindow)) {
            await window.SSNUtils.scrollIntoViewAndWait(submitButton);
          }
          window.SSNUtils.safeClick(submitButton, "submit button");
        }
        return true;
      }
    }

    return false;
  },

  // handler for knowledge blocks with checkboxes
  async handleKnowledgeCheckbox(iframeDoc, iframeWindow) {
    window.SSNUtils.log("☑️", "Handling knowledge block with checkboxes");
    
    const checkboxes = iframeDoc.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // i select the first checkbox as default
      const firstCheckbox = checkboxes[0];
      if (!window.SSNUtils.isInViewport(firstCheckbox, iframeWindow)) {
        await window.SSNUtils.scrollIntoViewAndWait(firstCheckbox);
      }
      
      if (window.SSNUtils.safeClick(firstCheckbox, "checkbox")) {
        await window.SSNUtils.waitWithTimeout(window.SSNConfig.timing.clickInterval);
        
        // i look for submit or next button
        const submitButton = iframeDoc.querySelector('button[type="submit"], .submit-btn, .next-btn');
        if (submitButton) {
          if (!window.SSNUtils.isInViewport(submitButton, iframeWindow)) {
            await window.SSNUtils.scrollIntoViewAndWait(submitButton);
          }
          window.SSNUtils.safeClick(submitButton, "submit button");
        }
        return true;
      }
    }

    return false;
  },

  // general knowledge handler
  async handleKnowledgeGeneral(iframeDoc, iframeWindow) {
    window.SSNUtils.log("🧠", "Handling general knowledge block");
    
    // i try radio buttons first, then checkboxes, then continue button
    if (await this.handleKnowledgeRadio(iframeDoc, iframeWindow)) {
      return true;
    }
    
    if (await this.handleKnowledgeCheckbox(iframeDoc, iframeWindow)) {
      return true;
    }
    
    return await this.handleContinueButton(iframeDoc, iframeWindow);
  }
};