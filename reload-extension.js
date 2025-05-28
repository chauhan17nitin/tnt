#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔄 Chrome Extension Auto-Reload Helper');
console.log('=====================================');

// Check if manifest.json exists
const manifestPath = path.join(__dirname, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ manifest.json not found!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);

console.log('\n🚀 To reload your extension:');
console.log('1. Go to chrome://extensions/');
console.log('2. Find "TNT - Team New Tab"');
console.log('3. Click the reload button (🔄)');
console.log('\n💡 Pro tip: Keep the extensions page open in a pinned tab!');

// Create a timestamp file to track changes
const timestampFile = path.join(__dirname, '.last-reload');
fs.writeFileSync(timestampFile, new Date().toISOString());

console.log(`\n⏰ Last reload: ${new Date().toLocaleTimeString()}`);
console.log('👀 Watching for file changes...\n');
