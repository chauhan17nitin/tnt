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

// Background service worker for TNT extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('TNT Extension.. installed');

  // Initialize basic settings
  try {
    const result = await chrome.storage.local.get(['theme']);

    if (!result.theme) {
      await chrome.storage.local.set({
        theme: 'auto',
      });
      console.log('Basic settings initialized');
    }
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
});

// Handle space auto-activation based on time
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['spaces', 'currentSpace']);
    const spaces = result.spaces || {};
    const currentSpaceId = result.currentSpace;

    // Only proceed if there are spaces configured
    if (Object.keys(spaces).length === 0) {
      return;
    }

    // Find active space based on current time
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let activeSpaceId = null;

    for (const [spaceId, space] of Object.entries(spaces)) {
      if (space.activeTime) {
        const [startHour, startMinute] = space.activeTime.start.split(':').map(Number);
        const [endHour, endMinute] = space.activeTime.end.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime <= endTime) {
          activeSpaceId = spaceId;
          break;
        }
      }
    }

    // Switch to active space if different from current
    if (activeSpaceId && activeSpaceId !== currentSpaceId) {
      await chrome.storage.local.set({ currentSpace: activeSpaceId });
      console.log(`Auto-switched to space: ${spaces[activeSpaceId].name}`);
    }
  } catch (error) {
    console.error('Failed to check space auto-activation:', error);
  }
}, 60000); // Check every minute
