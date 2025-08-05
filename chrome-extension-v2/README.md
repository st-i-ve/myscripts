# Sequential Section Navigator - Modular Chrome Extension v2.0

A modular Chrome extension that automates navigation through interactive learning blocks on skillsline.com, refactored from the original userscript for better maintainability and organization.

## 🏗️ Architecture

This extension follows a modular architecture with clear separation of concerns:

```
chrome-extension-v2/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Main content script
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── styles/
│   └── main.css          # UI styles
└── modules/
    ├── config.js         # Configuration and constants
    ├── utils.js          # Utility functions
    ├── blockHandlers.js  # Block-specific logic
    ├── ui.js            # UI management
    └── core.js          # Main navigation logic
```

## 🎯 Features

### Supported Block Types
- **Sorting Activities**: Adds visual hint dots for manual sorting
- **Process Blocks**: Auto-clicks through process steps
- **Scenario Blocks**: Auto-continues through dialogue
- **Flashcards**: Auto-flips cards
- **Accordion Panels**: Auto-opens all sections
- **Labeled Graphics**: Auto-reveals all labels
- **Knowledge Blocks**: Auto-answers with radio/checkbox
- **Continue Buttons**: Auto-clicks next/continue buttons

### UI Components
- **Toggle Button**: Bottom-right corner button to activate/deactivate
- **Category Display**: Shows current block type being processed
- **Extension Popup**: Status information and feature overview

## 🚀 Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `chrome-extension-v2` folder
4. The extension will appear in your extensions list

## 📖 Usage

1. Navigate to any skillsline.com learning module
2. Click the "SSN: OFF" button in the bottom-right corner to activate
3. The extension will automatically detect and process interactive blocks
4. Click the button again to deactivate ("SSN: ON" → "SSN: OFF")

## 🔧 Module Details

### Core Module (`core.js`)
- Main navigation logic and state management
- Block type detection and processing coordination
- Iframe monitoring and mutation observation
- Processed block tracking to avoid duplicates

### Block Handlers (`blockHandlers.js`)
- Specific logic for each block type
- Async processing with proper timing
- Viewport checking and scrolling
- Error handling for each block type

### UI Module (`ui.js`)
- Toggle button creation and management
- Category display updates
- Temporary notifications
- UI cleanup functionality

### Configuration (`config.js`)
- Sorting activity configurations
- CSS selectors for different elements
- Timing configurations
- Interactive block type definitions

### Utilities (`utils.js`)
- Viewport checking functions
- Smooth scrolling utilities
- Safe element interaction
- Iframe access helpers
- Logging utilities

## 🔄 Key Improvements from Original

### Modular Architecture
- Clear separation of concerns
- Easier testing and maintenance
- Better code organization
- Reusable components

### Modern Chrome Extension Standards
- Manifest V3 compliance
- Service worker background script
- Proper content script injection
- CSP-compliant code

### Enhanced Error Handling
- Safe iframe access
- Graceful degradation
- Comprehensive logging
- Timeout management

### Better State Management
- Processed block tracking
- Clean initialization/cleanup
- Memory leak prevention
- Proper event handling

## 🛠️ Development

### Adding New Block Types
1. Add detection logic in `core.js` → `detectBlockType()`
2. Create handler in `blockHandlers.js`
3. Add configuration in `config.js` if needed
4. Update the block type list in `config.js` → `interactiveTypes`

### Modifying UI
1. Update styles in `styles/main.css`
2. Modify UI logic in `ui.js`
3. Update popup in `popup.html` and `popup.js`

### Configuration Changes
1. Update selectors in `config.js` → `selectors`
2. Modify timing in `config.js` → `timing`
3. Add sorting configurations in `config.js` → `sortingConfig`

## 🐛 Debugging

The extension provides comprehensive logging:
- 🚀 Initialization messages
- 🔍 Block detection results
- 👆 Click actions
- ✅ Success confirmations
- ❌ Error messages
- 🧹 Cleanup operations

Open Chrome DevTools Console to view all logging output.

## 📝 Notes

- Extension only activates on skillsline.com domains
- Requires manual activation via toggle button
- Processes blocks automatically when active
- Maintains state across page navigation within iframes
- Handles dynamic content loading via mutation observers

## 🔒 Permissions

- `activeTab`: Access to current tab content
- `scripting`: Inject content scripts
- `host_permissions`: Access to skillsline.com

## 🎉 Version History

- **v2.0**: Complete modular refactor from original userscript
- **v1.0**: Original userscript implementation