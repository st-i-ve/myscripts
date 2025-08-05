// UI module for Sequential Section Navigator
window.SSNUI = {
  toggleButton: null,
  categoryDisplay: null,

  // function to create the toggle button
  createToggleButton() {
    if (this.toggleButton) {
      return this.toggleButton;
    }

    this.toggleButton = document.createElement('button');
    this.toggleButton.textContent = 'SSN: OFF';
    this.toggleButton.className = 'ssn-toggle-button';
    this.toggleButton.title = 'Toggle Sequential Section Navigator';
    
    this.toggleButton.addEventListener('click', () => {
      window.SSNCore.toggleNavigation();
    });

    document.body.appendChild(this.toggleButton);
    window.SSNUtils.log("✅", "Toggle button created");
    return this.toggleButton;
  },

  // function to create the category display
  createCategoryDisplay() {
    if (this.categoryDisplay) {
      return this.categoryDisplay;
    }

    this.categoryDisplay = document.createElement('div');
    this.categoryDisplay.className = 'ssn-category-display';
    this.categoryDisplay.textContent = 'No block detected';
    this.categoryDisplay.style.display = 'none';
    
    document.body.appendChild(this.categoryDisplay);
    window.SSNUtils.log("✅", "Category display created");
    return this.categoryDisplay;
  },

  // function to update toggle button state
  updateToggleButton(isActive) {
    if (this.toggleButton) {
      this.toggleButton.textContent = isActive ? 'SSN: ON' : 'SSN: OFF';
      this.toggleButton.style.backgroundColor = isActive ? '#28a745' : '#0043ce';
    }
  },

  // function to update category display
  updateCategoryDisplay(category, isVisible = true) {
    if (this.categoryDisplay) {
      this.categoryDisplay.textContent = category || 'No block detected';
      this.categoryDisplay.style.display = isVisible ? 'block' : 'none';
    }
  },

  // function to show category display temporarily
  showCategoryTemporarily(category, duration = 3000) {
    this.updateCategoryDisplay(category, true);
    setTimeout(() => {
      if (this.categoryDisplay) {
        this.categoryDisplay.style.display = 'none';
      }
    }, duration);
  },

  // function to initialize all UI elements
  initializeUI() {
    this.createToggleButton();
    this.createCategoryDisplay();
    window.SSNUtils.log("✅", "UI initialized");
  },

  // function to cleanup UI elements
  cleanup() {
    if (this.toggleButton) {
      this.toggleButton.remove();
      this.toggleButton = null;
    }
    
    if (this.categoryDisplay) {
      this.categoryDisplay.remove();
      this.categoryDisplay = null;
    }
    
    window.SSNUtils.log("🧹", "UI cleaned up");
  }
};