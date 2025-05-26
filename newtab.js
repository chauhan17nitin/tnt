// TNT - Team New Tab Extension JavaScript

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
    return new Promise((resolve) => {
        chrome.storage.local.get(['currentSpace'], (result) => {
            const spaceId = result.currentSpace;
            if (spaceId && allSpaces[spaceId]) {
                currentSpace = allSpaces[spaceId];
                currentSpace.id = spaceId;
            } else {
                currentSpace = null;
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
    
    selector.innerHTML = '<option value="">Select a space</option>';
    
    Object.entries(allSpaces).forEach(([id, space]) => {
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
        card.target = '_blank';
        
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
        'Documentation': 'gradient-documentation'
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
        'Documentation': 'fas fa-book'
    };
    return iconMap[tag] || 'fas fa-link';
}

// Filter functions
function toggleFilter(filter) {
    if (activeFilters.includes(filter)) {
        activeFilters = activeFilters.filter(f => f !== filter);
    } else {
        activeFilters.push(filter);
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
    if (confirm('Are you sure you want to delete this space?')) {
        delete allSpaces[spaceId];
        await saveSpaces();
        
        // If this was the current space, clear it
        if (currentSpace && currentSpace.id === spaceId) {
            currentSpace = null;
            await saveCurrentSpace(null);
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
    
    Object.entries(allSpaces).forEach(([id, space]) => {
        const item = document.createElement('div');
        item.className = 'space-item';
        
        item.innerHTML = `
            <div class="space-info">
                <div class="space-name">${space.name}</div>
                <div class="space-meta">${space.links ? space.links.length : 0} links</div>
            </div>
            <button class="delete-btn" onclick="deleteSpace('${id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
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

// Make functions globally available for onclick handlers
window.deleteSpace = deleteSpace;