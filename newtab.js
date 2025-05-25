// TNT - Team New Tab Extension JavaScript

class TNTExtension {
    constructor() {
        this.spaces = [];
        this.selectedSpaceId = null;
        this.currentFilter = 'all';
        this.theme = 'auto';
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateClock();
        this.renderSpaces();
        this.renderCurrentSpace();
        this.applyTheme();
        this.checkTimeBasedActivation();
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
        
        // Check time-based activation every minute
        setInterval(() => this.checkTimeBasedActivation(), 60000);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['tntSettings']);
            const settings = result.tntSettings || this.getDefaultSettings();
            
            this.spaces = settings.spaces || [];
            this.selectedSpaceId = settings.selectedSpaceId;
            this.theme = settings.theme || 'auto';
        } catch (error) {
            console.error('Failed to load settings:', error);
            const defaultSettings = this.getDefaultSettings();
            this.spaces = defaultSettings.spaces;
            this.selectedSpaceId = defaultSettings.selectedSpaceId;
            this.theme = defaultSettings.theme;
        }
    }

    async saveSettings() {
        const settings = {
            spaces: this.spaces,
            selectedSpaceId: this.selectedSpaceId,
            theme: this.theme
        };
        
        try {
            await chrome.storage.local.set({ tntSettings: settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getDefaultSettings() {
        const defaultSpace = {
            id: 'default',
            config: {
                name: 'Engineering',
                version: 'v1',
                mode: 'auto',
                activeTime: {
                    start: '09:00',
                    end: '18:00'
                },
                filters: ['Backend', 'Frontend', 'DevOps', 'Tools'],
                links: [
                    {
                        label: 'GitHub Repository',
                        url: 'https://github.com',
                        tag: 'Backend'
                    },
                    {
                        label: 'Grafana Dashboard',
                        url: 'https://grafana.com',
                        tag: 'DevOps'
                    },
                    {
                        label: 'Design System',
                        url: 'https://figma.com',
                        tag: 'Frontend'
                    },
                    {
                        label: 'Project Board',
                        url: 'https://linear.app',
                        tag: 'Tools'
                    },
                    {
                        label: 'Database Admin',
                        url: 'https://adminer.org',
                        tag: 'Backend'
                    },
                    {
                        label: 'Cloud Console',
                        url: 'https://console.cloud.google.com',
                        tag: 'DevOps'
                    }
                ]
            },
            source: 'raw',
            sourceData: ''
        };

        return {
            spaces: [defaultSpace],
            selectedSpaceId: 'default',
            theme: 'auto'
        };
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add space button
        document.getElementById('addSpaceBtn').addEventListener('click', () => {
            this.openAddSpaceModal();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // Space selector
        document.getElementById('spaceSelector').addEventListener('change', (e) => {
            this.selectSpace(e.target.value);
        });

        // Modal events
        this.setupModalEvents();
        
        // Settings events
        this.setupSettingsEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('addSpaceModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const addBtn = document.getElementById('addSpaceConfirm');

        // Close modal
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => this.closeAddSpaceModal());
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAddSpaceModal();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add space confirm
        addBtn.addEventListener('click', () => this.addSpace());

        // Add first space button
        document.getElementById('addFirstSpace').addEventListener('click', () => {
            this.openAddSpaceModal();
        });
    }

    setupSettingsEvents() {
        const settingsPanel = document.getElementById('settingsPanel');
        const closeBtn = document.getElementById('closeSettings');

        closeBtn.addEventListener('click', () => this.closeSettings());

        // Theme radio buttons
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setTheme(e.target.value);
                }
            });
        });
    }

    updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        document.getElementById('currentTime').textContent = timeStr;
        document.getElementById('currentDate').textContent = dateStr;
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.setTheme(nextTheme);
    }

    setTheme(theme) {
        this.theme = theme;
        this.applyTheme();
        this.saveSettings();
        
        // Update theme radio button
        const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (radio) radio.checked = true;
    }

    applyTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('#themeToggle i');
        
        body.removeAttribute('data-theme');
        
        if (this.theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-moon';
        } else if (this.theme === 'light') {
            themeIcon.className = 'fas fa-sun';
        } else {
            // Auto mode - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.setAttribute('data-theme', 'dark');
            }
            themeIcon.className = 'fas fa-magic';
        }
    }

    checkTimeBasedActivation() {
        if (!this.spaces.length) return;

        // Find space with matching active time
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        for (const space of this.spaces) {
            if (space.config.activeTime) {
                const { start, end } = space.config.activeTime;
                const [startHour, startMin] = start.split(':').map(Number);
                const [endHour, endMin] = end.split(':').map(Number);
                
                const startTime = startHour * 60 + startMin;
                const endTime = endHour * 60 + endMin;
                
                let isInRange;
                if (startTime > endTime) {
                    // Overnight range
                    isInRange = currentTime >= startTime || currentTime <= endTime;
                } else {
                    isInRange = currentTime >= startTime && currentTime <= endTime;
                }

                if (isInRange && this.selectedSpaceId !== space.id) {
                    this.selectSpace(space.id, false); // Don't save manual selection
                    break;
                }
            }
        }
    }

    renderSpaces() {
        const selector = document.getElementById('spaceSelector');
        selector.innerHTML = '<option value="">Select a space</option>';

        this.spaces.forEach(space => {
            const option = document.createElement('option');
            option.value = space.id;
            option.textContent = space.config.name;
            if (space.config.activeTime) {
                option.textContent += ` (${space.config.activeTime.start}-${space.config.activeTime.end})`;
            }
            selector.appendChild(option);
        });

        if (this.selectedSpaceId) {
            selector.value = this.selectedSpaceId;
        }

        // Update settings spaces list
        this.renderSettingsSpaces();
    }

    renderSettingsSpaces() {
        const spacesList = document.getElementById('spacesList');
        spacesList.innerHTML = '';

        this.spaces.forEach(space => {
            const spaceItem = document.createElement('div');
            spaceItem.className = 'space-item';
            
            spaceItem.innerHTML = `
                <div class="space-info">
                    <div class="space-name">${space.config.name}</div>
                    <div class="space-meta">${space.source === 'url' ? 'From URL' : 'Raw JSON'} • ${space.config.links.length} links</div>
                </div>
                <button class="delete-btn" data-space-id="${space.id}" ${this.spaces.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            `;

            const deleteBtn = spaceItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteSpace(space.id));

            spacesList.appendChild(spaceItem);
        });
    }

    renderCurrentSpace() {
        const currentSpace = this.spaces.find(s => s.id === this.selectedSpaceId);
        
        if (!currentSpace) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.updateSpaceBanner(currentSpace);
        this.renderFilterChips(currentSpace);
        this.renderLinksGrid(currentSpace);
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('spaceBanner').style.display = 'none';
        document.getElementById('filterChips').style.display = 'none';
        document.getElementById('linksGrid').style.display = 'none';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('spaceBanner').style.display = 'block';
        document.getElementById('filterChips').style.display = 'block';
        document.getElementById('linksGrid').style.display = 'block';
    }

    updateSpaceBanner(space) {
        document.getElementById('spaceName').textContent = space.config.name;
        
        const timeRange = document.getElementById('spaceTime');
        const status = document.getElementById('spaceStatus');
        
        if (space.config.activeTime) {
            timeRange.textContent = `Active: ${space.config.activeTime.start} - ${space.config.activeTime.end}`;
            
            const isActive = this.isSpaceActive(space);
            status.textContent = isActive ? 'Currently Active' : 'Inactive';
            status.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
        } else {
            timeRange.textContent = 'Always active';
            status.textContent = 'Always Active';
            status.className = 'status-badge active';
        }
    }

    isSpaceActive(space) {
        if (!space.config.activeTime) return true;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const { start, end } = space.config.activeTime;
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        return currentTime >= startTime && currentTime <= endTime;
    }

    renderFilterChips(space) {
        const container = document.getElementById('filterChips');
        container.innerHTML = '';

        if (!space.config.filters || space.config.filters.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        // Count links per filter
        const linkCounts = {};
        space.config.links.forEach(link => {
            linkCounts[link.tag] = (linkCounts[link.tag] || 0) + 1;
        });

        // All links chip
        const allChip = this.createFilterChip('All Links', 'all', space.config.links.length);
        container.appendChild(allChip);

        // Individual filter chips
        space.config.filters.forEach(filter => {
            const count = linkCounts[filter] || 0;
            const chip = this.createFilterChip(filter, filter.toLowerCase(), count);
            container.appendChild(chip);
        });
    }

    createFilterChip(label, value, count) {
        const chip = document.createElement('button');
        chip.className = `filter-chip ${this.currentFilter === value ? 'active' : ''}`;
        chip.innerHTML = `
            ${label}
            <span class="chip-count">(${count})</span>
        `;
        chip.addEventListener('click', () => {
            this.currentFilter = value;
            this.renderCurrentSpace();
        });
        return chip;
    }

    renderLinksGrid(space) {
        const container = document.getElementById('linksGrid');
        container.innerHTML = '';

        let filteredLinks = space.config.links;
        if (this.currentFilter !== 'all') {
            filteredLinks = space.config.links.filter(link => 
                link.tag.toLowerCase() === this.currentFilter
            );
        }

        filteredLinks.forEach(link => {
            const linkCard = this.createLinkCard(link);
            container.appendChild(linkCard);
        });

        // Add fade-in animation
        container.classList.add('fade-in');
    }

    createLinkCard(link) {
        const card = document.createElement('a');
        card.className = 'link-card';
        card.href = link.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const gradientClass = this.getLinkGradientClass(link.tag);
        const iconClass = this.getLinkIconClass(link.tag);

        card.innerHTML = `
            <div class="link-content">
                <div class="link-icon ${gradientClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="link-info">
                    <div class="link-title">${link.label}</div>
                    <div class="link-url">${link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>
                    <span class="link-tag">${link.tag}</span>
                </div>
            </div>
        `;

        return card;
    }

    getLinkGradientClass(tag) {
        const gradientMap = {
            backend: 'gradient-backend',
            frontend: 'gradient-frontend',
            devops: 'gradient-devops',
            tools: 'gradient-tools',
            design: 'gradient-design',
            monitoring: 'gradient-monitoring',
            communication: 'gradient-communication',
            documentation: 'gradient-documentation'
        };
        return gradientMap[tag.toLowerCase()] || 'gradient-default';
    }

    getLinkIconClass(tag) {
        const iconMap = {
            backend: 'fas fa-database',
            frontend: 'fas fa-code',
            devops: 'fas fa-cogs',
            tools: 'fas fa-wrench',
            design: 'fas fa-pen-nib',
            monitoring: 'fas fa-chart-line',
            communication: 'fas fa-comments',
            documentation: 'fas fa-file-alt'
        };
        return iconMap[tag.toLowerCase()] || 'fas fa-link';
    }

    selectSpace(spaceId, saveSelection = true) {
        this.selectedSpaceId = spaceId;
        this.currentFilter = 'all';
        
        if (saveSelection) {
            this.saveSettings();
        }
        
        this.renderSpaces();
        this.renderCurrentSpace();
    }

    openAddSpaceModal() {
        document.getElementById('addSpaceModal').classList.add('active');
        this.clearModalForm();
    }

    closeAddSpaceModal() {
        document.getElementById('addSpaceModal').classList.remove('active');
        this.clearModalForm();
    }

    clearModalForm() {
        document.getElementById('configUrl').value = '';
        document.getElementById('rawJson').value = '';
        document.getElementById('modalError').style.display = 'none';
        this.switchTab('url');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Tab`);
        });
    }

    async addSpace() {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const errorDiv = document.getElementById('modalError');
        
        try {
            let config;
            let source;
            let sourceData;

            if (activeTab === 'url') {
                const url = document.getElementById('configUrl').value.trim();
                if (!url) {
                    throw new Error('Please enter a URL');
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }

                config = await response.json();
                source = 'url';
                sourceData = url;
            } else {
                const jsonText = document.getElementById('rawJson').value.trim();
                if (!jsonText) {
                    throw new Error('Please enter JSON configuration');
                }

                config = JSON.parse(jsonText);
                source = 'raw';
                sourceData = jsonText;
            }

            // Validate config
            this.validateSpaceConfig(config);

            // Add space
            const newSpace = {
                id: this.generateId(),
                config,
                source,
                sourceData
            };

            this.spaces.push(newSpace);
            this.selectedSpaceId = newSpace.id;
            await this.saveSettings();

            this.renderSpaces();
            this.renderCurrentSpace();
            this.closeAddSpaceModal();

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }

    validateSpaceConfig(config) {
        if (!config.name || typeof config.name !== 'string') {
            throw new Error('Space name is required');
        }
        if (!config.version || config.version !== 'v1') {
            throw new Error('Version must be "v1"');
        }
        if (!Array.isArray(config.links)) {
            throw new Error('Links must be an array');
        }
        
        config.links.forEach((link, index) => {
            if (!link.label || !link.url || !link.tag) {
                throw new Error(`Link ${index + 1} is missing required fields`);
            }
            try {
                new URL(link.url);
            } catch {
                throw new Error(`Link ${index + 1} has invalid URL`);
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    deleteSpace(spaceId) {
        if (this.spaces.length <= 1) {
            alert('You must have at least one space.');
            return;
        }

        this.spaces = this.spaces.filter(s => s.id !== spaceId);
        
        if (this.selectedSpaceId === spaceId) {
            this.selectedSpaceId = this.spaces[0]?.id || null;
        }

        this.saveSettings();
        this.renderSpaces();
        this.renderCurrentSpace();
    }

    openSettings() {
        document.getElementById('settingsPanel').classList.add('active');
        
        // Set current theme radio
        const themeRadio = document.querySelector(`input[name="theme"][value="${this.theme}"]`);
        if (themeRadio) themeRadio.checked = true;
    }

    closeSettings() {
        document.getElementById('settingsPanel').classList.remove('active');
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TNTExtension();
});