// TNT - Team New Tab Extension JavaScript

const DEFAULT_SPACE_NAME = "My Digital Hub";

// Set TNT logo as favicon
function setFavicon() {
    const logoUrl = chrome.runtime.getURL("tnt_logo.jpg"); // Update path if you change logo file
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
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

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    updateTime();
    setInterval(updateTime, 1000);
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
        chrome.storage.local.get(['currentSpace'], async (result) => {
            const spaceId = result.currentSpace;
            if (spaceId && allSpaces[spaceId]) {
                currentSpace = allSpaces[spaceId];
                currentSpace.id = spaceId;
            } else {
                // No space selected or space doesn't exist, create default space and set as current
                await createDefaultSpace(true);
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
    const existingDefaultSpace = Object.values(allSpaces).find(space => space.name === DEFAULT_SPACE_NAME);
    
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
    const existingDefaultSpace = Object.values(allSpaces).find(space => space.name === DEFAULT_SPACE_NAME);
    if (existingDefaultSpace && setAsCurrent) {
        // Set the existing default space as current
        const spaceId = Object.keys(allSpaces).find(id => allSpaces[id] === existingDefaultSpace);
        currentSpace = existingDefaultSpace;
        currentSpace.id = spaceId;
        await saveCurrentSpace(spaceId);
        activeFilters = [];
        return;
    }
    
    const defaultSpaceConfig = {
        name: DEFAULT_SPACE_NAME,
        filters: ["Social Media", "Entertainment", "Music"],
        links: [
            // Social Media
            {
                label: "Facebook",
                url: "https://facebook.com",
                tag: "Social Media"
            },
            {
                label: "Instagram",
                url: "https://instagram.com",
                tag: "Social Media"
            },
            {
                label: "Twitter / X",
                url: "https://x.com",
                tag: "Social Media"
            },
            {
                label: "LinkedIn",
                url: "https://linkedin.com",
                tag: "Social Media"
            },
            {
                label: "Reddit",
                url: "https://reddit.com",
                tag: "Social Media"
            },
            {
                label: "Discord",
                url: "https://discord.com",
                tag: "Social Media"
            },
            {
                label: "WhatsApp Web",
                url: "https://web.whatsapp.com",
                tag: "Social Media"
            },
            
            // Entertainment & OTT
            {
                label: "Netflix",
                url: "https://netflix.com",
                tag: "Entertainment"
            },
            {
                label: "YouTube",
                url: "https://youtube.com",
                tag: "Entertainment"
            },
            {
                label: "Prime Video",
                url: "https://primevideo.com",
                tag: "Entertainment"
            },
            {
                label: "Disney+ Hotstar",
                url: "https://hotstar.com",
                tag: "Entertainment"
            },
            
            // Music
            {
                label: "Spotify",
                url: "https://open.spotify.com",
                tag: "Music"
            },
            {
                label: "Apple Music",
                url: "https://music.apple.com",
                tag: "Music"
            },
            {
                label: "YouTube Music",
                url: "https://music.youtube.com",
                tag: "Music"
            }
        ]
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
            minute: '2-digit'
        });
    }
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
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
            const isActive = isSpaceActive(currentSpace);
            spaceStatus.textContent = isActive ? 'Active' : 'Inactive';
            spaceStatus.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
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
        currentSpace.links.forEach(link => {
            filterCounts[link.tag] = (filterCounts[link.tag] || 0) + 1;
        });
    }
    
    currentSpace.filters.forEach(filter => {
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

function renderLinks() {
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
        filteredLinks = currentSpace.links.filter(link => 
            activeFilters.includes(link.tag)
        );
    }
    
    if (filteredLinks.length === 0) {
        showEmptyState();
        return;
    }
    
    // Hide empty state and show links
    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = '';
    
    filteredLinks.forEach(link => {
        const card = document.createElement('a');
        card.className = 'link-card';
        card.href = link.url;

        // open links in a new tab
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.title = link.label;
        
        // Add gradient class based on tag
        const gradientClass = getGradientClass(link.tag);
        
        card.innerHTML = `
            <div class="link-content">
                <div class="link-icon ${gradientClass}">
                    <i class="${getIconClass(link.tag)}"></i>
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
        'Backend': 'gradient-backend',
        'Frontend': 'gradient-frontend',
        'DevOps': 'gradient-devops',
        'Tools': 'gradient-tools',
        'Design': 'gradient-design',
        'Monitoring': 'gradient-monitoring',
        'Communication': 'gradient-communication',
        'Documentation': 'gradient-documentation',
        'Social Media': 'gradient-social-media',
        'Entertainment': 'gradient-entertainment',
        'Music': 'gradient-music'
    };
    return tagMap[tag] || 'gradient-default';
}

function getIconClass(tag) {
    const iconMap = {
        'Backend': 'fas fa-server',
        'Frontend': 'fas fa-code',
        'DevOps': 'fas fa-cogs',
        'Tools': 'fas fa-tools',
        'Design': 'fas fa-palette',
        'Monitoring': 'fas fa-chart-line',
        'Communication': 'fas fa-comments',
        'Documentation': 'fas fa-book',
        'Social Media': 'fas fa-share-alt',
        'Entertainment': 'fas fa-play-circle',
        'Music': 'fas fa-music'
    };
    return iconMap[tag] || 'fas fa-link';
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

function clearAllFilters() {
    activeFilters = [];
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
            const isDark = document.body.dataset.theme === 'dark';
            icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
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
            const defaultSpaceEntry = Object.entries(allSpaces).find(([id, space]) => space.name === DEFAULT_SPACE_NAME);
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
            ${isDefaultSpace 
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
    radios.forEach(radio => {
        radio.checked = radio.value === currentTheme;
        radio.addEventListener('change', () => {
            if (radio.checked) {
                applyTheme(radio.value);
            }
        });
    });
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
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
            if (settingsPanel.classList.contains('active') && 
                !settingsPanel.contains(e.target) && 
                !document.getElementById('settingsBtn').contains(e.target)) {
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