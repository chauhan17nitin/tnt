# 🚀 TNT - Team New Tab

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/chauhan17nitin/tnt)

> Transform your Chrome new tab into a powerful, customizable dashboard for your team's internal tools and frequently used links.

TNT (Team New Tab) is a Chrome extension that replaces the default new tab page with a beautiful, organized dashboard featuring spaces, time-based activation, filtering, and multiple themes.

## ✨ Features

### 🏠 **Smart New Tab Override**
- Automatically loads your custom dashboard on every new tab
- Clean, modern interface with responsive design
- Seamless integration with Chrome

### 🎯 **Organized Spaces**
- Create multiple spaces for different contexts (Work, Personal, Projects, etc.)
- Each space maintains its own links and configuration
- Easy switching between spaces with dropdown selector

### ⏰ **Time-Based Activation**
- Spaces automatically activate based on configured time ranges
- Perfect for separating work hours from personal time
- Manual override available at any time

### 🏷️ **Smart Filtering**
- Organize links with tags and categories
- Quick filter chips for instant link discovery
- Visual count indicators for each filter

### 🎨 **Beautiful Themes**
- **Light Mode**: Clean and bright interface
- **Dark Mode**: Easy on the eyes for extended use
- **Auto Mode**: Follows your system preference

### 🔍 **Integrated Search**
- Built-in Google search functionality
- Quick access without leaving your dashboard

### ⚙️ **Flexible Configuration**
- JSON-based configuration for easy sharing
- Support for both URL-hosted and raw JSON configs
- Local storage with Chrome's secure storage API

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
   ```bash
   git clone https://github.com/your-username/tnt.git
   cd tnt
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)

3. **Load the Extension**
   - Click **"Load unpacked"**
   - Select the project folder containing `manifest.json`

4. **Start Using TNT**
   - Open a new tab to see TNT in action
   - Click the **+** button to add your first space

### First Space Setup

1. Click the **+ Add Space** button
2. Choose between **JSON URL** or **Raw JSON** input
3. Use the configuration format below or start with the provided template
4. Save and enjoy your customized new tab experience!

## 📋 Configuration Format

TNT uses a simple JSON format for space configuration:

```json
{
  "name": "My Workspace",
  "version": "v1",
  "mode": "auto",
  "activeTime": {
    "start": "09:00",
    "end": "18:00"
  },
  "links": [
    {
      "label": "GitHub Repository",
      "url": "https://github.com/myorg/project",
      "tag": "Development",
      "icon": "github"
    },
    {
      "label": "Figma Design System",
      "url": "https://figma.com/design-system",
      "tag": "Design",
      "icon": "figma"
    },
    {
      "label": "AWS Console",
      "url": "https://console.aws.amazon.com",
      "tag": "DevOps",
      "icon": "amazonaws"
    },
    {
      "label": "Project Wiki",
      "url": "https://wiki.company.com/project",
      "tag": "Documentation",
      "icon": "gitbook"
    }
  ]
}
```

### Configuration Options

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for the space |
| `version` | string | Configuration version (currently "v1") |
| `mode` | string | Activation mode: "auto", "manual", or "always" |
| `activeTime` | object | Time range when space is active (24-hour format) |
| `activeTime.start` | string | Start time (e.g., "09:00") |
| `activeTime.end` | string | End time (e.g., "18:00") |
| `links` | array | Array of link objects |
| `links[].label` | string | Display text for the link |
| `links[].url` | string | Target URL |
| `links[].tag` | string | Filter tag (unique tags are automatically used as filters) |
| `links[].icon` | string | (Optional) Icon slug from Simple Icons (e.g., "github", "figma") |

> **Note:** Filters are automatically derived from the unique tags in your links. You don't need to specify them manually.

### 🎨 Icons

TNT supports beautiful icons for your links using [Simple Icons](https://simpleicons.org/):

- **Icon Source**: Icons are loaded from Simple Icons CDN (`cdn.simpleicons.org`)
- **Icon Format**: Use the icon slug (lowercase name) from Simple Icons
- **Fallback**: If an icon is not found, a default link icon is displayed
- **Optional**: The `icon` field is optional - links work perfectly without icons

**Popular Icon Examples:**
```json
{
  "label": "GitHub",
  "url": "https://github.com",
  "icon": "github"
},
{
  "label": "Google Drive",
  "url": "https://drive.google.com",
  "icon": "googledrive"
},
{
  "label": "Slack",
  "url": "https://slack.com",
  "icon": "slack"
}
```

**Finding Icon Slugs:**
1. Visit [simpleicons.org](https://simpleicons.org/)
2. Search for your desired brand/service
3. Use the slug shown (usually the lowercase brand name)
4. Common examples: `github`, `google`, `microsoft`, `apple`, `netflix`, `spotify`, `discord`, `slack`

## 🛠️ Development

### Prerequisites
- Node.js 16+ (for development tools)
- Chrome browser for testing

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-username/tnt.git
cd tnt

# Install development dependencies
npm install

# Start development watcher
npm run dev
```

### Available Scripts

- `npm run dev` - Start development watcher with auto-reload
- `npm run lint` - Run ESLint for code quality
- `npm run format` - Format code with Prettier
- `npm run watch` - Watch for file changes

### Project Structure

```
tnt/
├── manifest.json          # Chrome extension manifest
├── newtab.html           # Main HTML template
├── newtab.js             # Core application logic
├── styles.css            # Styling and themes
├── background.js         # Extension background script
├── config.js             # Configuration utilities
├── icons/                # Extension icons
└── dev-tools/            # Development utilities
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style (enforced by ESLint and Prettier)
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

The BSD 3-Clause License allows:
- ✅ Free use for any purpose (including commercial)
- ✅ Modification and distribution
- ✅ Private use
- ✅ Commercial use

With the following conditions:
- 📝 Include the original copyright notice
- 📝 Include the license text
- 📝 Include any attribution notices

## 🙏 Acknowledgments

- Built with modern web technologies
- Icons provided by [Font Awesome](https://fontawesome.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/chauhan17nitin/tnt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chauhan17nitin/tnt/discussions)
- **Documentation**: [Wiki](https://github.com/chauhan17nitin/tnt/wiki)

---

<div align="center">
  <strong>Made with ❤️ for teams who value efficiency</strong>
  <br>
  <sub>Star ⭐ this repo if you find it helpful!</sub>
</div>
