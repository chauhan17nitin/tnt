# TNT - Team New Tab Chrome Extension

A Chrome extension that replaces your new tab page with a customizable dashboard of internal links, featuring spaces, filters, themes, and time-based activation.

## Installation

1. **Download the extension files** from this project
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the folder containing these files:
   - `manifest.json`
   - `newtab.html`
   - `newtab.js`
   - `styles.css`
   - Icon files (icon16.png, icon48.png, icon128.png)

## Features

### 🏠 **New Tab Override**

- Automatically loads your custom dashboard when opening a new tab
- Clean, modern interface with dark/light/auto themes

### 🎯 **Spaces**

- Create multiple spaces for different contexts (work, personal, etc.)
- Each space has its own set of links and configuration
- Add spaces via JSON URL or raw JSON input

### ⏰ **Time-Based Activation**

- Spaces can automatically activate based on time ranges
- Perfect for work hours vs. personal time
- Manual override always available

### 🏷️ **Filter Chips**

- Organize links by tags/categories
- Quick filtering to find what you need
- Visual count indicators

### 🎨 **Themes**

- Light mode
- Dark mode
- Auto (follows system preference)

### ⚙️ **Easy Configuration**

All configuration is stored locally using Chrome's storage API.

## JSON Configuration Format

```json
{
  "name": "My Space",
  "version": "v1",
  "mode": "auto",
  "activeTime": {
    "start": "09:00",
    "end": "18:00"
  },
  "filters": ["Backend", "Frontend", "DevOps"],
  "links": [
    {
      "label": "GitHub",
      "url": "https://github.com/myorg/repo",
      "tag": "Backend"
    },
    {
      "label": "Figma",
      "url": "https://figma.com/myproject",
      "tag": "Frontend"
    }
  ]
}
```

## Usage

1. **Open a new tab** - TNT will load automatically
2. **Add your first space** using the + button
3. **Switch between spaces** using the dropdown
4. **Filter links** using the tag chips
5. **Customize appearance** in settings

## Notes

- The extension works completely offline after installation
- All data is stored locally in your browser
- No external servers or data collection
- You can host your JSON configs anywhere accessible via URL

Perfect for teams who want quick access to internal tools, dashboards, and frequently used links!
