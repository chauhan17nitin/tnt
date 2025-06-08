/*
 *  * TNT - Team New Tab
 * Copyright (c) 2025 Nitin Chauhan
 * All rights reserved.
 * 
 * This software is provided for internal use only and is not licensed
 * for commercial use, redistribution, or modification without explicit
 * written permission from the copyright holder.
 * 
 * For commercial licensing inquiries, please contact the author.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('\n🔄 Chrome Extension Auto-Reload Helper');
console.log('=====================================');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
