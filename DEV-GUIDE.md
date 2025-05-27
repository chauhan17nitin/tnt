# TNT Extension - Development Guide 🚀

## Quick Start for Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Mode
```bash
npm run dev
```

This will start a file watcher that monitors your extension files and notifies you when changes are detected.

### 3. Set Up Chrome for Development

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select your extension folder
4. **Keep this tab open and pinned** for easy access

### 4. Development Workflow

1. Make changes to your extension files
2. The watcher will detect changes and show: `🔄 RELOAD NEEDED`
3. Go to your pinned `chrome://extensions/` tab
4. Click the reload button (🔄) on your "TNT - Team New Tab" extension
5. Test your changes!

## File Watching

The dev watcher monitors these files:
- `manifest.json`
- `background.js`
- `newtab.js`
- `newtab.html`
- `styles.css`
- `config.js`

## Pro Tips 💡

### Keyboard Shortcuts
- `Ctrl+R` (or `Cmd+R`) to reload the extensions page
- `Ctrl+Shift+R` to hard reload your new tab page

### Browser Setup
- Pin the `chrome://extensions/` tab for quick access
- Use Chrome DevTools (`F12`) on your new tab page for debugging
- Check the background script console in the extension details

### Faster Reloading
1. Keep `chrome://extensions/` open in a pinned tab
2. When you see the reload notification, just click the reload button
3. No need to navigate back and forth!

## Alternative Methods

### Method 1: Simple File Watcher
```bash
npm run watch
```

### Method 2: Manual Reload Helper
```bash
npm run reload-extension
```

## Troubleshooting

### Extension Not Loading
- Check the console for errors in `chrome://extensions/`
- Verify all files are saved
- Make sure manifest.json is valid JSON

### Changes Not Reflecting
- Make sure you clicked the reload button on the extension
- Hard refresh your new tab page (`Ctrl+Shift+R`)
- Check if the file watcher detected the changes

### File Watcher Not Working
- Make sure you're in the correct directory
- Check that Node.js is installed
- Try restarting the dev watcher

## Happy Coding! 🎉

The auto-reload setup should make your development much smoother. No more manual navigation to reload your extension every time! 