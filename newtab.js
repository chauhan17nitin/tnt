// TNT - Team New Tab Extension JavaScript

const DEFAULT_SPACE_NAME = 'My Digital Hub';

// Set TNT logo as favicon
function setFavicon() {
  const logoUrl = chrome.runtime.getURL('tnt_logo.jpg'); // Update path if you change logo file
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = logoUrl;
}
setFavicon();

// Global state
let currentSpace = null;
let allSpaces = {};
let activeFilters = [];
let currentTheme = 'auto';
let wasAutoSelected = false; // Track if current space was auto-selected

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  await renderAdviceCard();
  setupEventListeners();
  updateTime();
  setInterval(updateTime, 1000);
  
  // Check for space changes every minute
  setInterval(checkAndSwitchSpaceByTime, 60000);
});

async function initializeApp() {
  try {
    // Load spaces from storage
    await loadSpaces();

    // Ensure default space always exists
    await ensureDefaultSpaceExists();

    // Load current space
    await loadCurrentSpace();

    // Apply theme
    applyTheme(currentTheme);

    // Update UI
    updateSpaceSelector();
    updateSpaceBanner();
    renderFilterChips();
    renderLinks();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showEmptyState();
  }
}

// Storage functions
async function loadSpaces() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['spaces'], (result) => {
      allSpaces = result.spaces || {};
      resolve();
    });
  });
}

async function saveSpaces() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ spaces: allSpaces }, resolve);
  });
}

async function loadCurrentSpace() {
  return new Promise(async (resolve) => {
    // First, try to find a space that should be active based on current time
    const timeBasedSpace = findActiveSpaceByTime();
    
    if (timeBasedSpace) {
      // Set the time-based space as current
      currentSpace = timeBasedSpace.space;
      currentSpace.id = timeBasedSpace.id;
      wasAutoSelected = true; // Mark as auto-selected
      await saveCurrentSpace(timeBasedSpace.id);
      console.log(`Auto-selected space "${currentSpace.name}" based on time`);
      
      // Show notification for initial auto-selection (but only if it's not the default space)
      if (timeBasedSpace.space.name !== DEFAULT_SPACE_NAME) {
        setTimeout(() => {
          showAutoSwitchNotification(timeBasedSpace.space.name, true);
        }, 1000); // Delay to ensure UI is ready
      }
      
      resolve();
      return;
    }

    // If no time-based space found, fall back to saved current space or default
    chrome.storage.local.get(['currentSpace'], async (result) => {
      const spaceId = result.currentSpace;
      if (spaceId && allSpaces[spaceId]) {
        currentSpace = allSpaces[spaceId];
        currentSpace.id = spaceId;
        wasAutoSelected = false; // User's saved selection
      } else {
        // No space selected or space doesn't exist, create default space and set as current
        await createDefaultSpace(true);
        wasAutoSelected = false; // Default space creation
      }
      resolve();
    });
  });
}

async function saveCurrentSpace(spaceId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ currentSpace: spaceId }, resolve);
  });
}

async function ensureDefaultSpaceExists() {
  // Check if the default space DEFAULT_SPACE_NAME already exists
  const existingDefaultSpace = Object.values(allSpaces).find(
    (space) => space.name === DEFAULT_SPACE_NAME
  );

  if (!existingDefaultSpace) {
    // Create the default space if it doesn't exist
    console.log('Creating default space "My Digital Hub"...');
    await createDefaultSpace(false);
  } else {
    console.log('Default space "My Digital Hub" already exists');
  }
}

async function createDefaultSpace(setAsCurrent = true) {
  // Check if a default space already exists
  const existingDefaultSpace = Object.values(allSpaces).find(
    (space) => space.name === DEFAULT_SPACE_NAME
  );
  if (existingDefaultSpace && setAsCurrent) {
    // Set the existing default space as current
    const spaceId = Object.keys(allSpaces).find((id) => allSpaces[id] === existingDefaultSpace);
    currentSpace = existingDefaultSpace;
    currentSpace.id = spaceId;
    await saveCurrentSpace(spaceId);
    activeFilters = [];
    return;
  }

  const defaultSpaceConfig = {
    name: DEFAULT_SPACE_NAME,
    filters: ['Social Media', 'Entertainment', 'Music'],
    links: [
      // Social Media
      {
        label: 'Facebook',
        url: 'https://facebook.com',
        tag: 'Social Media',
        icon: 'facebook',
      },
      {
        label: 'Instagram',
        url: 'https://instagram.com',
        tag: 'Social Media',
        icon: 'instagram',
      },
      {
        label: 'Twitter / X',
        url: 'https://x.com',
        tag: 'Social Media',
        icon: 'x',
      },
      {
        label: 'LinkedIn',
        url: 'https://linkedin.com',
        tag: 'Social Media',
        icon: 'naukri',
      },
      {
        label: 'Reddit',
        url: 'https://reddit.com',
        tag: 'Social Media',
        icon: 'reddit',
      },
      {
        label: 'Discord',
        url: 'https://discord.com',
        tag: 'Social Media',
        icon: 'discord',
      },
      {
        label: 'WhatsApp Web',
        url: 'https://web.whatsapp.com',
        tag: 'Social Media',
        icon: 'whatsapp',
      },

      // Entertainment & OTT
      {
        label: 'Netflix',
        url: 'https://netflix.com',
        tag: 'Entertainment',
        icon: 'netflix',
      },
      {
        label: 'YouTube',
        url: 'https://youtube.com',
        tag: 'Entertainment',
        icon: 'youtube',
      },
      {
        label: 'Prime Video',
        url: 'https://primevideo.com',
        tag: 'Entertainment',
        icon: 'primevideo',
      },
      {
        label: 'Disney+ Hotstar',
        url: 'https://hotstar.com',
        tag: 'Entertainment',
        icon: 'jio',
      },

      // Music
      {
        label: 'Spotify',
        url: 'https://open.spotify.com',
        tag: 'Music',
        icon: 'spotify',
      },
      {
        label: 'Apple Music',
        url: 'https://music.apple.com',
        tag: 'Music',
        icon: 'applemusic',
      },
      {
        label: 'YouTube Music',
        url: 'https://music.youtube.com',
        tag: 'Music',
        icon: 'youtube',
      },
    ],
  };

  try {
    if (setAsCurrent) {
      // Use addSpace to create and set as current
      const spaceId = await addSpace(defaultSpaceConfig);
      console.log('Default space created and set as current:', spaceId);

      // Clear any active filters for the new space
      activeFilters = [];
    } else {
      // Just create the space without setting as current
      const spaceId = generateSpaceId(defaultSpaceConfig.name);
      allSpaces[spaceId] = defaultSpaceConfig;
      await saveSpaces();
      console.log('Default space created successfully:', spaceId);
    }
  } catch (error) {
    console.error('Failed to create default space:', error);
    if (setAsCurrent) {
      currentSpace = null;
    }
  }
}

// Time and greeting functions
function updateTime() {
  const now = new Date();
  const timeElement = document.getElementById('currentTime');
  const dateElement = document.getElementById('currentDate');

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}

function isSpaceActive(space) {
  if (!space.activeTime) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = space.activeTime.start.split(':').map(Number);
  const [endHour, endMinute] = space.activeTime.end.split(':').map(Number);

  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Handle case where time range crosses midnight (e.g., 23:00 - 06:00)
  if (endTime < startTime) {
    // Time is active if it's after start time OR before end time
    return currentTime >= startTime || currentTime <= endTime;
  }

  // Normal case where time range is within same day
  return currentTime >= startTime && currentTime <= endTime;
}

// UI update functions
function updateSpaceSelector() {
  const selector = document.getElementById('spaceSelector');
  if (!selector) return;

  selector.innerHTML = '';

  // If no spaces exist, show placeholder
  if (Object.keys(allSpaces).length === 0) {
    selector.innerHTML = '<option value="">No spaces available</option>';
    return;
  }

  // Sort spaces to put "My Digital Hub" first
  const sortedSpaces = Object.entries(allSpaces).sort(([idA, spaceA], [idB, spaceB]) => {
    if (spaceA.name === DEFAULT_SPACE_NAME) return -1;
    if (spaceB.name === DEFAULT_SPACE_NAME) return 1;
    return spaceA.name.localeCompare(spaceB.name);
  });

  sortedSpaces.forEach(([id, space]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = space.name;
    if (currentSpace && currentSpace.id === id) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
  
  // Ensure the selector shows the correct current space
  if (currentSpace && currentSpace.id) {
    selector.value = currentSpace.id;
  }
}

function updateSpaceBanner() {
  const spaceName = document.getElementById('spaceName');
  const spaceTime = document.getElementById('spaceTime');
  const spaceStatus = document.getElementById('spaceStatus');

  if (currentSpace) {
    if (spaceName) spaceName.textContent = currentSpace.name;

    if (spaceTime && currentSpace.activeTime) {
      spaceTime.textContent = `${currentSpace.activeTime.start} - ${currentSpace.activeTime.end}`;
    } else if (spaceTime) {
      spaceTime.textContent = 'Always active';
    }

    if (spaceStatus) {
      console.log('Updating space status for:', currentSpace?.name);
      
      // With auto-switching enabled, we need to handle status differently
      if (!currentSpace.activeTime) {
        console.log('Space has no time restrictions - setting to Always Active');
        // Space has no time restrictions - always active
        spaceStatus.textContent = 'Always Active';
        spaceStatus.className = 'status-badge active';
      } else {
        console.log('Space has time restrictions:', currentSpace.activeTime);
        // Space has time restrictions - check if currently in active time
        const isActive = isSpaceActive(currentSpace);
        console.log('Is space currently active?', isActive);
        
        if (isActive) {
          console.log('Space is active, wasAutoSelected:', wasAutoSelected);
          if (wasAutoSelected) {
            spaceStatus.textContent = 'Auto-Selected';
            spaceStatus.className = 'status-badge auto-selected';
          } else {
            spaceStatus.textContent = 'Active';
            spaceStatus.className = 'status-badge active';
          }
        } else {
          console.log('Space is inactive - this may be due to manual selection or pending auto-switch');
          // This case should be rare with auto-switching, but can happen if:
          // 1. User manually selected a space outside its active time
          // 2. Time just changed and auto-switch hasn't triggered yet
          spaceStatus.textContent = 'Inactive';
          spaceStatus.className = 'status-badge inactive';
        }
      }
      console.log('Final status:', spaceStatus.textContent);
    }
  } else {
    if (spaceName) spaceName.textContent = 'Welcome to TNT';
    if (spaceTime) spaceTime.textContent = '';
    if (spaceStatus) spaceStatus.textContent = '';
  }
}

function renderFilterChips() {
  const container = document.getElementById('filterChips');
  if (!container) return;

  container.innerHTML = '';

  if (!currentSpace || !currentSpace.filters) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  // Count links per filter
  const filterCounts = {};
  if (currentSpace.links) {
    currentSpace.links.forEach((link) => {
      filterCounts[link.tag] = (filterCounts[link.tag] || 0) + 1;
    });
  }

  currentSpace.filters.forEach((filter) => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.filter = filter;

    if (activeFilters.includes(filter)) {
      chip.classList.add('active');
    }

    chip.innerHTML = `
            ${filter}
            <span class="chip-count">${filterCounts[filter] || 0}</span>
        `;

    chip.addEventListener('click', () => toggleFilter(filter));
    container.appendChild(chip);
  });
}

async function fetchSimpleIconSVG(slug) {
  const url = `https://cdn.simpleicons.org/${slug}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Icon not found');
    return await res.text();
  } catch {
    return null;
  }
}

async function renderLinks() {
  const container = document.getElementById('linksGrid');
  const emptyState = document.getElementById('emptyState');

  if (!container) return;

  if (!currentSpace || !currentSpace.links || currentSpace.links.length === 0) {
    showEmptyState();
    return;
  }

  // Filter links
  let filteredLinks = currentSpace.links;
  if (activeFilters.length > 0) {
    filteredLinks = currentSpace.links.filter((link) => activeFilters.includes(link.tag));
  }

  if (filteredLinks.length === 0) {
    showEmptyState();
    return;
  }

  // Hide empty state and show links
  if (emptyState) emptyState.style.display = 'none';
  container.style.display = 'grid';
  container.innerHTML = '';

  filteredLinks.forEach(async (link) => {
    const card = document.createElement('a');
    card.className = 'link-card';
    card.href = link.url;
    card.rel = 'noopener noreferrer';
    card.title = link.label;

    // Use icon key directly if present, fallback to label-based slug if not
    let svg = '';
    console.log(link);
    if (link.icon) {
      console.log(`Fetching icon for: ${link.icon}`);
      svg = await fetchSimpleIconSVG(link.icon.toLowerCase());
    }
    // if (!svg && link.label) {
    //   // fallback: try label as slug
    //   const fallbackSlug = link.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    //   svg = await fetchSimpleIconSVG(fallbackSlug);
    // }
    if (!svg) {
      // fallback to default icon (FontAwesome)
      svg = '<i class="fas fa-link"></i>';
    }

    card.innerHTML = `
      <div class="link-content">
        <div class="link-icon" style="display:flex;align-items:center;justify-content:center;width:3rem;height:3rem;">
          ${svg}
        </div>
        <div class="link-info">
          <div class="link-title">${link.label}</div>
          <div class="link-url">${link.url}</div>
          <div class="link-tag">${link.tag}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function showEmptyState() {
  const container = document.getElementById('linksGrid');
  const emptyState = document.getElementById('emptyState');

  if (container) container.style.display = 'none';
  if (emptyState) emptyState.style.display = 'block';
}

function getGradientClass(tag) {
  const tagMap = {
    Backend: 'gradient-backend',
    Frontend: 'gradient-frontend',
    DevOps: 'gradient-devops',
    Tools: 'gradient-tools',
    Design: 'gradient-design',
    Monitoring: 'gradient-monitoring',
    Communication: 'gradient-communication',
    Documentation: 'gradient-documentation',
    'Social Media': 'gradient-social-media',
    Entertainment: 'gradient-entertainment',
    Music: 'gradient-music',
  };
  return tagMap[tag] || 'gradient-default';
}

// Filter functions
function toggleFilter(filter) {
  if (activeFilters.includes(filter)) {
    // If the filter is already active, deselect it (clear all filters)
    activeFilters = [];
  } else {
    // Clear all filters and select only the clicked one (single select)
    activeFilters = [filter];
  }

  renderFilterChips();
  renderLinks();
}

// Theme functions
function applyTheme(theme) {
  currentTheme = theme;

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    document.body.dataset.theme = theme;
  }

  // Update theme toggle icon
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      if (theme === 'auto') {
        icon.className = 'fas fa-circle-half-stroke';
      } else {
        const isDark = document.body.dataset.theme === 'dark';
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
      }
    }
  }

  // Save theme preference
  chrome.storage.local.set({ theme: currentTheme });
}

function toggleTheme() {
  const themes = ['light', 'dark', 'auto'];
  const currentIndex = themes.indexOf(currentTheme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  applyTheme(nextTheme);
}

// Modal functions
function showModal() {
  const modal = document.getElementById('addSpaceModal');
  if (modal) {
    modal.classList.add('active');
    // Clear form
    const urlInput = document.getElementById('configUrl');
    const jsonInput = document.getElementById('rawJson');
    if (urlInput) urlInput.value = '';
    if (jsonInput) jsonInput.value = '';
    hideError();
  }
}

function hideModal() {
  const modal = document.getElementById('addSpaceModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function showError(message) {
  const errorElement = document.getElementById('modalError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function hideError() {
  const errorElement = document.getElementById('modalError');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// Space management functions
async function addSpaceFromUrl(url) {
  try {
    // Check if it's a GitHub URL and convert to raw URL if needed
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      // Convert GitHub URL to raw URL
      url = url.replace('github.com', 'raw.githubusercontent.com')
               .replace('/blob/', '/')
               .replace('/tree/', '/');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const spaceConfig = await response.json();
    return addSpace(spaceConfig);
  } catch (error) {
    throw new Error(`Failed to load from URL: ${error.message}`);
  }
}

async function addSpaceFromJson(jsonString) {
  try {
    const spaceConfig = JSON.parse(jsonString);
    return addSpace(spaceConfig);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

async function addSpace(spaceConfig) {
  // Validate space config
  if (!spaceConfig.name) {
    throw new Error('Space must have a name');
  }

  // Generate unique ID
  const spaceId = generateSpaceId(spaceConfig.name);

  // Add to spaces
  allSpaces[spaceId] = spaceConfig;
  await saveSpaces();

  // Set as current space
  currentSpace = spaceConfig;
  currentSpace.id = spaceId;
  await saveCurrentSpace(spaceId);

  // Update UI
  updateSpaceSelector();
  updateSpaceBanner();
  renderFilterChips();
  renderLinks();

  return spaceId;
}

function generateSpaceId(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const timestamp = Date.now();
  return `${base}-${timestamp}`;
}

async function deleteSpace(spaceId) {
  // Prevent deletion of the default space
  const spaceToDelete = allSpaces[spaceId];
  if (spaceToDelete && spaceToDelete.name === DEFAULT_SPACE_NAME) {
    alert(`The default space "${DEFAULT_SPACE_NAME}" cannot be deleted.`);
    return;
  }

  if (confirm('Are you sure you want to delete this space?')) {
    delete allSpaces[spaceId];
    await saveSpaces();

    // If this was the current space, switch to the default space
    if (currentSpace && currentSpace.id === spaceId) {
      // Find the default space and set it as current
      const defaultSpaceEntry = Object.entries(allSpaces).find(
        ([id, space]) => space.name === DEFAULT_SPACE_NAME
      );
      if (defaultSpaceEntry) {
        const [defaultSpaceId, defaultSpace] = defaultSpaceEntry;
        currentSpace = defaultSpace;
        currentSpace.id = defaultSpaceId;
        await saveCurrentSpace(defaultSpaceId);
      } else {
        currentSpace = null;
        await saveCurrentSpace(null);
      }
    }

    updateSpaceSelector();
    updateSpaceBanner();
    renderFilterChips();
    renderLinks();
    updateSettingsSpacesList();
  }
}

// Settings functions
function showSettings() {
  const panel = document.getElementById('settingsPanel');
  if (panel) {
    panel.classList.add('active');
    updateSettingsSpacesList();
    updateThemeSettings();
  }
}

function hideSettings() {
  const panel = document.getElementById('settingsPanel');
  if (panel) {
    panel.classList.remove('active');
  }
}

function updateSettingsSpacesList() {
  const container = document.getElementById('spacesList');
  if (!container) return;

  container.innerHTML = '';

  // Sort spaces to put "My Digital Hub" first
  const sortedSpaces = Object.entries(allSpaces).sort(([idA, spaceA], [idB, spaceB]) => {
    if (spaceA.name === DEFAULT_SPACE_NAME) return -1;
    if (spaceB.name === DEFAULT_SPACE_NAME) return 1;
    return spaceA.name.localeCompare(spaceB.name);
  });

  sortedSpaces.forEach(([id, space]) => {
    const item = document.createElement('div');
    item.className = 'space-item';

    const isDefaultSpace = space.name === DEFAULT_SPACE_NAME;

    item.innerHTML = `
            <div class="space-info">
                <div class="space-name">${space.name}</div>
                <div class="space-meta">${space.links ? space.links.length : 0} links</div>
            </div>
            ${
              isDefaultSpace
                ? '<span class="default-badge">Default</span>'
                : '<button class="delete-btn"><i class="fas fa-trash"></i></button>'
            }
        `;

    // Add event listener for delete button if it's not the default space
    if (!isDefaultSpace) {
      const deleteBtn = item.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteSpace(id));
      }
    }

    container.appendChild(item);
  });
}

function updateThemeSettings() {
  const radios = document.querySelectorAll('input[name="theme"]');
  radios.forEach((radio) => {
    radio.checked = radio.value === currentTheme;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        applyTheme(radio.value);
      }
    });
  });
}

// Advice quote functions
async function getCachedAdvice() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['adviceQuote', 'adviceQuoteTimestamp'], async (result) => {
      const now = Date.now();
      const cachedQuote = result.adviceQuote;
      const cachedTimestamp = result.adviceQuoteTimestamp;
      if (cachedQuote && cachedTimestamp && now - cachedTimestamp < 3600 * 1000) {
        resolve(cachedQuote);
      } else {
        try {
          const res = await fetch('https://api.adviceslip.com/advice');
          const data = await res.json();
          const advice = data.slip.advice;
          chrome.storage.local.set({ adviceQuote: advice, adviceQuoteTimestamp: now });
          resolve(advice);
        } catch {
          resolve('Could not load advice.');
        }
      }
    });
  });
}

async function renderAdviceCard() {
  const container = document.getElementById('adviceCard');
  if (!container) return;
  container.innerHTML = '<div class="advice-loading">Loading advice...</div>';
  const advice = await getCachedAdvice();
  container.innerHTML = `
    <div class="advice-quote-card">
      <i class="fas fa-quote-left"></i>
      <span class="advice-text">${advice}</span>
      <i class="fas fa-quote-right"></i>
    </div>
  `;
}

// Event listeners
function setupEventListeners() {
  // Space selector
  const spaceSelector = document.getElementById('spaceSelector');
  if (spaceSelector) {
    spaceSelector.addEventListener('change', async (e) => {
      const spaceId = e.target.value;
      if (spaceId && allSpaces[spaceId]) {
        currentSpace = allSpaces[spaceId];
        currentSpace.id = spaceId;
        wasAutoSelected = false; // Reset auto-selected flag for manual selection
        await saveCurrentSpace(spaceId);

        // Clear filters and update UI
        activeFilters = [];
        updateSpaceBanner();
        renderFilterChips();
        renderLinks();
      }
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Add space button
  const addSpaceBtn = document.getElementById('addSpaceBtn');
  if (addSpaceBtn) {
    addSpaceBtn.addEventListener('click', showModal);
  }

  // Add first space button
  const addFirstSpace = document.getElementById('addFirstSpace');
  if (addFirstSpace) {
    addFirstSpace.addEventListener('click', showModal);
  }

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettings);
  }

  // Modal controls
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideModal);
  }

  // Settings controls
  const closeSettings = document.getElementById('closeSettings');
  if (closeSettings) {
    closeSettings.addEventListener('click', hideSettings);
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update tab panels
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      const targetPanel = document.getElementById(`${tabName}Tab`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Add space form submission
  const addSpaceConfirm = document.getElementById('addSpaceConfirm');
  if (addSpaceConfirm) {
    addSpaceConfirm.addEventListener('click', async () => {
      hideError();

      const urlInput = document.getElementById('configUrl');
      const jsonInput = document.getElementById('rawJson');

      try {
        if (urlInput && urlInput.value.trim()) {
          await addSpaceFromUrl(urlInput.value.trim());
        } else if (jsonInput && jsonInput.value.trim()) {
          await addSpaceFromJson(jsonInput.value.trim());
        } else {
          throw new Error('Please provide either a URL or JSON configuration');
        }

        hideModal();
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById('addSpaceModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal();
      }
    });
  }

  // Close settings when clicking outside
  const settingsPanel = document.getElementById('settingsPanel');
  if (settingsPanel) {
    document.addEventListener('click', (e) => {
      if (
        settingsPanel.classList.contains('active') &&
        !settingsPanel.contains(e.target) &&
        !document.getElementById('settingsBtn').contains(e.target)
      ) {
        hideSettings();
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
      hideSettings();
    }
  });

  // System theme change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

// Load theme on startup
chrome.storage.local.get(['theme'], (result) => {
  currentTheme = result.theme || 'auto';
  applyTheme(currentTheme);
});

// New function to find active space based on current time
function findActiveSpaceByTime() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  console.log(`Checking for active spaces at ${currentTimeStr} (${currentTime} minutes)`);

  // Find all spaces that have activeTime configured and are currently active
  const activeSpaces = [];
  
  Object.entries(allSpaces).forEach(([id, space]) => {
    if (space.activeTime) {
      const [startHour, startMinute] = space.activeTime.start.split(':').map(Number);
      const [endHour, endMinute] = space.activeTime.end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Handle cases where end time is before start time (crosses midnight)
      let isActive;
      if (endTime < startTime) {
        // Time range crosses midnight (e.g., 22:00 - 06:00)
        isActive = currentTime >= startTime || currentTime <= endTime;
        console.log(`Space "${space.name}": ${space.activeTime.start}-${space.activeTime.end} (crosses midnight) - ${isActive ? 'ACTIVE' : 'inactive'}`);
      } else {
        // Normal time range within same day
        isActive = currentTime >= startTime && currentTime <= endTime;
        console.log(`Space "${space.name}": ${space.activeTime.start}-${space.activeTime.end} - ${isActive ? 'ACTIVE' : 'inactive'}`);
      }

      if (isActive) {
        activeSpaces.push({ id, space });
      }
    } else {
      console.log(`Space "${space.name}": No activeTime configured - always available`);
    }
  });

  // If multiple spaces are active, prioritize non-default spaces first
  if (activeSpaces.length > 0) {
    console.log(`Found ${activeSpaces.length} active space(s):`, activeSpaces.map(s => s.space.name));
    
    // Sort to put non-default spaces first
    activeSpaces.sort((a, b) => {
      if (a.space.name === DEFAULT_SPACE_NAME && b.space.name !== DEFAULT_SPACE_NAME) return 1;
      if (a.space.name !== DEFAULT_SPACE_NAME && b.space.name === DEFAULT_SPACE_NAME) return -1;
      return 0;
    });
    
    console.log(`Selected space: "${activeSpaces[0].space.name}"`);
    return activeSpaces[0];
  }

  // If no time-based spaces are active, check if default space should be used
  const defaultSpaceEntry = Object.entries(allSpaces).find(
    ([id, space]) => space.name === DEFAULT_SPACE_NAME
  );
  
  if (defaultSpaceEntry) {
    const [id, space] = defaultSpaceEntry;
    console.log(`No time-based spaces active, falling back to default space: "${space.name}"`);
    return { id, space };
  }

  console.log('No spaces found');
  return null;
}

// New function to check and switch space based on time
async function checkAndSwitchSpaceByTime() {
  const timeBasedSpace = findActiveSpaceByTime();
  
  // Only switch if we found a different space than the current one
  if (timeBasedSpace && (!currentSpace || currentSpace.id !== timeBasedSpace.id)) {
    console.log(`Auto-switching from "${currentSpace?.name || 'none'}" to "${timeBasedSpace.space.name}" based on time`);
    
    currentSpace = timeBasedSpace.space;
    currentSpace.id = timeBasedSpace.id;
    wasAutoSelected = true; // Mark as auto-selected
    await saveCurrentSpace(timeBasedSpace.id);
    
    // Clear filters and update UI
    activeFilters = [];
    updateSpaceSelector();
    updateSpaceBanner();
    renderFilterChips();
    renderLinks();
    
    // Show a brief notification about the auto-switch
    showAutoSwitchNotification(timeBasedSpace.space.name);
  }
}

// New function to show auto-switch notification
function showAutoSwitchNotification(spaceName, isInitial = false) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'auto-switch-notification';
  
  const message = isInitial 
    ? `Selected "${spaceName}" based on current time`
    : `Auto-switched to "${spaceName}" based on time`;
    
  notification.innerHTML = `
    <i class="fas fa-clock"></i>
    <span>${message}</span>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
