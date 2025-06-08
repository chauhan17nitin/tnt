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

// Configuration utilities for TNT extension

// Utility functions for space configuration
function validateSpaceConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be a valid object');
  }

  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Space must have a valid name');
  }

  if (config.filters && !Array.isArray(config.filters)) {
    throw new Error('Filters must be an array');
  }

  if (config.links && !Array.isArray(config.links)) {
    throw new Error('Links must be an array');
  }

  if (config.links) {
    config.links.forEach((link, index) => {
      if (!link.label || !link.url || !link.tag) {
        throw new Error(`Link at index ${index} must have label, url, and tag`);
      }
    });
  }

  return true;
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.TNTConfig = {
    validateSpaceConfig,
  };
}
