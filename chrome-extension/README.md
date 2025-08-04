# Auto Form Filler - Universal Chrome Extension

A Chrome extension that automatically fills form fields with your saved profile data across all websites. Converted from the original Tampermonkey userscript.

## Features

- 🔄 **Universal Form Filling** - Works on all websites
- 💾 **Cross-Device Sync** - Data syncs across all your Chrome browsers
- 📝 **Dual Input Methods** - Individual fields or bulk paste
- 🎯 **Smart Field Detection** - Automatically detects form fields
- 📅 **Date Format Conversion** - Handles DD/MM/YYYY ↔ YYYY-MM-DD
- 🏫 **ASA Registration Support** - Special handling for ASA forms
- 🌎 **US States Support** - Complete dropdown list
- ⚡ **Fast Typing Simulation** - Human-like form filling

## Installation

1. **Download the Extension**
   - Save all files in the `chrome-extension` folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Add Icons (Optional)**
   - Create an `icons` folder inside `chrome-extension`
   - Add icon files: `icon16.png`, `icon48.png`, `icon128.png`
   - Or remove icon references from `manifest.json`

## Usage

### Setting Up Your Profile

1. **Click the Extension Icon** in your Chrome toolbar
2. **Choose Input Method:**
   - **Individual Fields**: Fill each field separately
   - **Bulk Paste**: Paste formatted data block

3. **Bulk Data Format:**
   ```
   Name: Robert Harris
   State: Massachusetts
   City: Boston
   DOB: 18/11/2009
   School: Boston Latin Academy
   ZIP: 02124
   PHONE: 4085554449
   password: Wright10*
   robertharris181109@gmail.com
   ```

4. **Click "Save Data"** - Your data will sync across all devices

### Filling Forms

1. **Visit any website** with forms
2. **Look for the blue "🔄 Fill Form" button** (bottom right)
3. **Click the button** to auto-fill detected fields
4. **Success message** will show number of fields filled

## Supported Field Types

- ✅ First Name / Last Name
- ✅ Email Address
- ✅ Phone Number
- ✅ Date of Birth
- ✅ City / State / ZIP
- ✅ School / University
- ✅ Password Fields
- ✅ Dropdown Menus
- ✅ Checkboxes (ASA specific)

## Data Storage

- Uses **Chrome Sync Storage** for cross-device persistence
- Data is **encrypted** and stored securely
- **Delete anytime** using the extension popup
- **No external servers** - all data stays in your Chrome account

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the same folder
- Check Chrome Developer Console for errors
- Verify manifest.json syntax

### Forms Not Filling
- Check if floating button appears on page
- Ensure profile data is saved in extension
- Some sites may block automated filling

### Data Not Syncing
- Verify Chrome sync is enabled in settings
- Check internet connection
- Re-save profile data if needed

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Storage, Active Tab, Scripting, All URLs
- **Storage**: Chrome Sync API (cross-device)
- **Content Script**: Injected on all pages
- **Background**: Service worker for storage management

## Differences from Original Tampermonkey Script

- ✅ **No Tampermonkey Required** - Native Chrome extension
- ✅ **Better UI** - Popup interface instead of overlay
- ✅ **Chrome Sync** - Data syncs across devices
- ✅ **Modern Architecture** - Manifest V3 compliant
- ✅ **Same Functionality** - All original features preserved

## Files Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Form filling logic
├── popup.html            # Data entry interface
├── popup.js              # Popup functionality
├── background.js         # Storage management
├── styles.css            # Popup styling
├── README.md             # This file
└── icons/                # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Privacy & Security

- **No data collection** - Everything stays local to your Chrome account
- **No external requests** - Extension works entirely offline
- **Secure storage** - Uses Chrome's encrypted sync storage
- **Open source** - All code is visible and auditable

---

**Original Tampermonkey Script**: `emailfiller.js`  
**Converted to Chrome Extension**: Full feature parity maintained