# Sequential Section Navigator V9.5 - Chrome Extension

A powerful Chrome extension that automates navigation through SkillsLine.com learning modules, providing intelligent section progression and interactive element handling.

## 🚀 Features

- **Auto-Navigation**: Automatically progresses through learning sections
- **Smart Sorting**: Provides visual hints for sorting activities
- **Process Automation**: Handles process blocks with intelligent clicking
- **Scenario Management**: Auto-continues through scenario presentations
- **Knowledge Block Answers**: Automatically answers quizzes and knowledge checks
- **Accordion Expansion**: Opens all accordion sections automatically
- **Flashcard Flipping**: Automatically flips flashcards to reveal content
- **Interactive Elements**: Handles labeled graphics, continue buttons, and more

## 📦 Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `Versiono 3` folder containing this extension
5. The extension should now appear in your extensions list

### Method 2: Manual Installation

1. Download or clone this repository
2. Open Chrome Extensions page (`chrome://extensions/`)
3. Turn on Developer mode
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar for easy access

## 🎯 Usage

### Getting Started

1. Navigate to any SkillsLine.com learning module
2. Click the Sequential Section Navigator extension icon in your toolbar
3. The popup will show the current status and available controls

### Controls

- **Start Execution**: Begin automated navigation through sections
- **Stop Execution**: Halt the automation process
- **Reset**: Reset all progress and return to initial state

### Status Indicators

- 🟢 **Ready**: Extension is ready to start
- 🟡 **Running**: Currently processing sections
- 🔴 **Error**: An error occurred during processing
- 🟠 **Manual**: Waiting for manual intervention

## 🔧 Technical Details

### File Structure

```
Versiono 3/
├── manifest.json          # Extension configuration
├── background/
│   └── serviceWorker.js   # Background service worker
├── content/
│   ├── content.js         # Main content script logic
│   └── styles.css         # Injected styles
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup functionality
├── icons/
│   ├── icon16.svg         # 16x16 icon
│   ├── icon48.svg         # 48x48 icon
│   └── icon128.svg        # 128x128 icon
└── README.md              # This file
```

### Permissions

- `storage`: For saving user preferences and state
- `activeTab`: For interacting with the current tab
- `host_permissions`: Limited to skillsline.com domains

## 🎨 Features in Detail

### Sorting Activities
- Automatically detects sorting activities
- Provides visual hints with colored dots
- Handles drag-and-drop operations

### Process Blocks
- Identifies process-related content
- Automatically clicks through process steps
- Handles various button types and selectors

### Knowledge Blocks
- Automatically answers multiple choice questions
- Handles both radio buttons and checkboxes
- Implements random selection for realistic interaction
- Includes submission delays for natural timing

### Scenario Handling
- Detects scenario-based content
- Automatically continues through presentations
- Handles various continue button formats

## 🛠️ Development

### Prerequisites
- Chrome browser
- Basic understanding of Chrome Extension development
- Knowledge of JavaScript, HTML, and CSS

### Local Development
1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test on SkillsLine.com learning modules

### Debugging
- Use Chrome DevTools for content script debugging
- Check the extension's service worker logs
- Monitor the popup console for UI-related issues

## 🔒 Privacy & Security

- Only operates on skillsline.com domains
- No data is sent to external servers
- All processing happens locally in your browser
- Uses Chrome's secure storage APIs

## 📝 Version History

### V9.5 (Current)
- Converted from userscript to Chrome Extension Manifest V3
- Added modern popup interface
- Improved error handling and status reporting
- Enhanced visual feedback and controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on SkillsLine.com
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This extension is designed for educational purposes and to enhance the learning experience on SkillsLine.com. Use responsibly and in accordance with your organization's policies.

## 🐛 Troubleshooting

### Common Issues

1. **Extension not working**: Ensure you're on a skillsline.com page
2. **Popup not opening**: Check if the extension is properly loaded
3. **Navigation stuck**: Use the Reset button to restart
4. **Permission errors**: Reload the extension in developer mode

### Support

For issues or questions, please check the browser console for error messages and ensure you're using the latest version of Chrome.