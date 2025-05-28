#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ExtensionDevWatcher {
  constructor() {
    this.watchedFiles = [
      'manifest.json',
      'background.js',
      'newtab.js',
      'newtab.html',
      'styles.css',
      'config.js',
    ];

    this.lastModified = new Map();
    this.isWatching = false;

    // Initialize last modified times
    this.watchedFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        this.lastModified.set(file, fs.statSync(file).mtime);
      }
    });
  }

  start() {
    console.log('\n🚀 TNT Extension Development Watcher');
    console.log('====================================');
    console.log('📁 Watching files:', this.watchedFiles.join(', '));
    console.log('\n💡 Quick Setup:');
    console.log('1. Open chrome://extensions/ in a new tab');
    console.log('2. Enable "Developer mode" (top right)');
    console.log('3. Keep that tab open and pinned');
    console.log('4. When you see "🔄 RELOAD NEEDED", click the reload button on your extension');
    console.log('\n👀 Watching for changes...\n');

    this.isWatching = true;
    this.watch();
  }

  watch() {
    if (!this.isWatching) return;

    let hasChanges = false;
    const changedFiles = [];

    this.watchedFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        const currentMtime = fs.statSync(file).mtime;
        const lastMtime = this.lastModified.get(file);

        if (!lastMtime || currentMtime > lastMtime) {
          hasChanges = true;
          changedFiles.push(file);
          this.lastModified.set(file, currentMtime);
        }
      }
    });

    if (hasChanges) {
      console.log(`\n🔄 RELOAD NEEDED - Files changed: ${changedFiles.join(', ')}`);
      console.log(`⏰ ${new Date().toLocaleTimeString()}`);
      console.log('👆 Go to chrome://extensions/ and click reload on "TNT - Team New Tab"\n');

      // Optional: Play a sound or send a notification
      this.notify();
    }

    // Check again in 1 second
    setTimeout(() => this.watch(), 1000);
  }

  notify() {
    // Try to send a system notification (macOS)
    if (process.platform === 'darwin') {
      exec(
        `osascript -e 'display notification "Extension files changed - reload needed!" with title "TNT Extension Dev"'`,
        (error) => {
          if (error) {
            // Fallback to terminal bell
            process.stdout.write('\x07');
          }
        }
      );
    } else {
      // Terminal bell for other platforms
      process.stdout.write('\x07');
    }
  }

  stop() {
    this.isWatching = false;
    console.log('\n👋 Stopped watching files');
  }
}

// Handle graceful shutdown
const watcher = new ExtensionDevWatcher();

process.on('SIGINT', () => {
  watcher.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.stop();
  process.exit(0);
});

// Start watching
watcher.start();
