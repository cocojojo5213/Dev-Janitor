# Dev Janitor

<p align="center">
  <img src="docs/hero-2.png" alt="Dev Janitor Hero" width="100%">
</p>

<p align="center">
  <img src="build/icon.svg" alt="Dev Janitor Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Your Vibe Coding Toolkit</strong>
  <br>
  <em>A cross-platform desktop application for managing development tools, AI coding assistants, and dependencies</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a> •
  <a href="README.zh-CN.md">中文文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/cocojojo5213/Dev-Janitor?label=version" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-green.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/electron-33.3.1-9feaf9.svg" alt="Electron">
  <img src="https://img.shields.io/badge/react-18.3.1-61dafb.svg" alt="React">
</p>

---

## Overview

Dev Janitor is a powerful desktop application designed to help developers detect, view, and manage development tools, packages, services, and environment configurations on their system. It provides a unified visual interface to clean up version confusion and scattered management.

## Features

### 🔍 Tool Detection
- **Automatic Detection**: Automatically scans and detects installed development tools
- **36+ Supported Tools**: Comprehensive detection including:
  - **Runtimes**: Node.js, Python, PHP, Java, Go, Rust, Ruby, .NET, Deno, Bun, Perl, Lua
  - **Package Managers**: npm, pip, Composer, Yarn, pnpm, Cargo, RubyGems, Homebrew, Chocolatey, Scoop, winget
  - **Cloud Tools**: AWS CLI, Azure CLI, Google Cloud SDK, Helm, Ansible
  - **Version Managers**: nvm, pyenv, rbenv, SDKMAN, uv
  - **Dev Tools**: Git, Docker, Kubernetes CLI, Terraform, Maven, SVN
- **Version Information**: Displays version numbers and installation paths
- **Installation Status**: Clear visual indicators for installed vs unavailable tools
- **Windows Compatibility**: Special handling for Windows Python Launcher (`py` command)
- **Configurable Timeouts**: Smart timeout presets (Quick/Normal/Slow/Extended) for reliable detection
- **Detection Caching**: 5-minute cache for improved performance with force-refresh option
- **Detection Summary**: Detailed summary with success/failure counts and timing information

### 🤖 AI CLI Tools Management (NEW!)
- **Unified Management**: Manage popular AI coding assistants from one place
- **Supported Tools**:
  - **Codex** (OpenAI): AI coding agent that runs locally
  - **Claude Code** (Anthropic): Agentic coding tool from Anthropic
  - **Gemini CLI** (Google): AI agent that brings Gemini to your terminal
  - **OpenCode** (SST): Open source AI coding agent
- **One-Click Operations**: Install, update, and uninstall with a single click
- **Status Detection**: Automatically detect installed tools and versions
- **Quick Access**: Open homepage or config folder directly

### 🤖 AI Assistant
- **Local Analysis**: Free, offline intelligent analysis without API key
  - Detects outdated tool versions (Node.js 22 LTS, Python 3.12+ standards)
  - Finds PATH duplicates and conflicts
  - Identifies port conflicts
  - Suggests missing essential tools
- **AI-Powered Insights**: Optional OpenAI integration for deeper analysis
  - Environment health assessment
  - Personalized optimization recommendations
  - Best practices suggestions (2026 standards)
- **Supported Models** (January 2026):
  - GPT-5 (Recommended - Best coding capability, 400K context)
  - GPT-5 Mini / GPT-5 Nano (Fast & economical)
  - o3 / o4-mini (Reasoning-enhanced for complex problems)
  - GPT-4.1 (Previous stable version)
- **Smart Suggestions**: Actionable recommendations with commands
- **Multi-language**: Full support in English and Chinese

### 📦 Package Management
- **NPM Packages**: View and manage globally installed npm packages
- **Python Packages**: Browse pip-installed packages
- **Composer Packages**: Manage PHP Composer global packages
- **Version Check**: Detect outdated package versions
- **One-Click Update**: Update packages directly from the UI (npm/pip) (NEW!)
- **Safe Operations**: View and copy path only, removed dangerous operations like delete/open file

### ⚡ Service Monitoring
- **Running Services**: Monitor development servers and processes
- **Port Detection**: Identify services running on specific ports
- **Process Control**: Stop/kill running services with one click
- **Auto-Refresh**: Automatic service list updates every 5 seconds

### 🌍 Environment Variables
- **Full Scan**: View all system environment variables
- **PATH Analysis**: Analyze PATH entries with duplicate detection
- **Category Filtering**: Filter variables by category (PATH, Java, Python, Node, etc.)
- **Problem Detection**: Highlight potentially problematic configurations

### 🌐 Internationalization
- **Multi-language Support**: English (en-US) and Chinese (zh-CN)
- **Easy Switching**: Change language instantly from settings
- **System Detection**: Automatically detects system language on first launch

### 🎨 Theme Support (NEW!)
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for night coding
- **System Follow**: Automatically matches your OS theme preference

### 🧹 Cache Cleaner (NEW!)
- **Multi-Cache Support**: Scan and clean caches for 11 package managers
  - npm, yarn, pnpm, pip, Composer, Cargo, Gradle, Maven, NuGet, Homebrew, CocoaPods
- **Size Statistics**: Display total cache size and individual cache sizes
- **Risk Level Indicators**: Low/Medium/High risk labels for each cache
- **Batch Cleaning**: Select multiple caches to clean at once
- **Safety Warnings**: Confirmation dialogs and special warnings for high-risk caches

### 🗑️ Tool Uninstall (NEW!)
- **One-Click Uninstall**: Uninstall development tools directly from the UI
- **Windows Support**: Uses winget for common tools (Node.js, Python, Git, Docker, etc.)
- **Cross-Platform**: Supports Homebrew (macOS), apt (Linux), and more
- **Safety Features**: Warning messages and confirmation dialogs before uninstall

### 🔄 Auto Update
- **Automatic Check**: Checks for updates on startup
- **One-Click Update**: Download and install updates with a single click
- **Progress Tracking**: Real-time download progress display

### 💻 Cross-Platform
- **Windows**: Full support for Windows 10/11
- **macOS**: Native support for macOS 10.15+
- **Linux**: AppImage and deb packages for Linux distributions

## Screenshots

<p align="center">
  <img src="docs/screenshots/demo.gif" alt="Dev Janitor Demo" width="800">
  <br>
  <em>Dev Janitor in action</em>
</p>

## Installation

### Download Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/cocojojo5213/Dev-Janitor/releases) page:

| Platform | Download |
|----------|----------|
| Windows | `Dev-Janitor-Setup-1.7.0.exe` |
| macOS | `Dev-Janitor-1.7.0.dmg` |
| Linux | `Dev-Janitor-1.7.0.AppImage` |

### macOS Troubleshooting

If you see **"Dev Janitor is damaged and can't be opened"** error on macOS, this is because the app is not signed with an Apple Developer certificate. To fix this:

#### Option 1: Terminal Command (Recommended)

Open Terminal and run:

```bash
xattr -cr /Applications/Dev\ Janitor.app
```

Or if the app is in your Downloads folder:

```bash
xattr -cr ~/Downloads/Dev\ Janitor.app
```

#### Option 2: System Preferences

1. Click "Cancel" on the error dialog
2. Go to **System Preferences > Security & Privacy**
3. Look for the message about "Dev Janitor was blocked"
4. Click **"Open Anyway"**

### Build from Source

#### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/cocojojo5213/Dev-Janitor.git
   cd Dev-Janitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for your platform**
   ```bash
   # Build for current platform
   npm run build
   
   # Build for specific platforms
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```

## Usage

### AI Assistant

The AI Assistant helps you intelligently analyze and optimize your development environment:

1. **Open AI Assistant**: Click the robot icon in the bottom-right corner
2. **Start Analysis**: Click the "Analyze Environment" button
3. **View Results**:
   - **Environment Overview**: Overall health status
   - **Issues Found**: Categorized list of problems by severity
   - **Optimization Suggestions**: Actionable improvement recommendations
   - **AI Deep Analysis**: (Requires API Key) More detailed insights
4. **Execute Suggestions**: Copy provided commands to your terminal

**Configure AI Enhancement** (Optional):
1. Go to Settings page
2. Configure OpenAI API Key
3. Enable AI features for smarter analysis

### Tools View

The Tools view displays all detected development tools on your system:

1. **View Tool Status**: See which tools are installed and their versions
2. **Refresh Detection**: Click the refresh button to re-scan for tools
3. **View Details**: Click on a tool card to see detailed information
4. **Copy Path**: Easily copy the installation path to clipboard

### Packages View

Manage your globally installed packages:

1. **Switch Package Manager**: Use tabs to switch between npm, pip, and Composer
2. **Search Packages**: Filter packages by name
3. **Check Updates**: Click "Check All Updates" to detect outdated packages
4. **One-Click Update**: Click the "Update" button next to outdated packages to update directly
5. **Copy Command**: Click on version tags to copy update commands to clipboard
6. **Refresh List**: Update the package list with the refresh button

### Services View

Monitor and control running development services:

1. **View Running Services**: See all development processes with their ports
2. **Stop Services**: Click the stop button to terminate a service
3. **Auto-Refresh**: Services list updates automatically every 5 seconds
4. **Manual Refresh**: Click refresh for immediate update

### Environment View

Explore your system's environment configuration:

1. **Browse Variables**: View all environment variables
2. **Filter by Category**: Use category filters to narrow down results
3. **PATH Analysis**: See detailed PATH breakdown with duplicate detection
4. **Search**: Find specific variables by name or value

### Settings

Customize your experience:

1. **Theme**: Switch between Light, Dark, or System-follow mode
2. **Language**: Switch between English and Chinese
3. **AI Config**: Configure OpenAI API Key for AI-powered analysis
4. **About**: View application version, license, and contact information

## Development

### Tech Stack

- **Framework**: Electron 33
- **Frontend**: React 18 + TypeScript
- **UI Library**: Ant Design 5
- **State Management**: Zustand
- **Internationalization**: i18next
- **Styling**: Tailwind CSS
- **Testing**: Vitest + fast-check
- **Build Tool**: Vite + electron-builder
- **Security**: CSP, Command Validation, Input Sanitization

### Project Structure

```
dev-janitor/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── preload.ts     # Preload script
│   │   ├── ipcHandlers.ts # IPC handlers
│   │   ├── commandExecutor.ts
│   │   ├── detectionEngine.ts
│   │   ├── packageManager.ts
│   │   ├── serviceMonitor.ts
│   │   ├── environmentScanner.ts
│   │   ├── pathScanner.ts
│   │   ├── security/      # Security modules (NEW!)
│   │   │   ├── commandValidator.ts
│   │   │   ├── inputValidator.ts
│   │   │   └── cspManager.ts
│   │   └── utils/         # Utility modules
│   │       └── cacheManager.ts
│   ├── renderer/          # React frontend
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand store
│   │   ├── i18n/          # Internationalization
│   │   └── ipc/           # IPC client with timeout
│   └── shared/            # Shared types
│       └── types/
├── build/                 # Build resources
├── public/                # Static assets
└── electron-builder.json5 # Build configuration
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm run build:linux  # Build for Linux
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

The project maintains high code quality standards with:

- **Type Safety**: Full TypeScript coverage with strict type checking
- **Testing**: Comprehensive unit tests using Vitest and property-based testing with fast-check
- **Security**: Multiple security layers including:
  - Content Security Policy (CSP)
  - Command validation and sanitization with enhanced injection protection
  - Input validation for all user inputs
  - IPC sender validation
  - Safe command execution with whitelisting
  - URL validation for external links (HTTP/HTTPS only)
  - XSS protection with rehype-sanitize for markdown rendering
- **Performance Optimizations**:
  - Async file I/O operations (non-blocking)
  - Parallel execution for tool detection and package queries
  - React.memo for component optimization
  - Debouncing for service monitoring
  - 5-minute caching for detection results
  - Timeout protection for network requests (10s)
- **Memory Management**:
  - Proper cleanup of intervals and timers
  - Race condition prevention in async operations
  - Component unmount protection
- **Error Handling**:
  - Process-level error handlers for uncaught exceptions
  - Proper error propagation in IPC handlers
  - Graceful degradation on failures
- **Code Standards**: ESLint configuration for consistent code style
- **Build Verification**: All builds pass TypeScript compilation and bundling

### Recent Improvements (v1.6.0)

**Backend Enhancements:**
- Converted synchronous file I/O to async operations for better performance
- Added concurrency control for parallel AI analysis
- Implemented timeout protection for network requests
- Strengthened command validation against injection attacks
- Added URL validation for external link security
- Implemented process-level error handlers
- Fixed memory leaks in service monitoring
- Fixed IPC handler race conditions

**Frontend Enhancements:**
- Added XSS protection with rehype-sanitize for markdown rendering
- Implemented React.memo for performance optimization
- Fixed memory leaks in AIAssistantDrawer component
- Fixed race conditions in PackageTable version checking
- Improved component cleanup on unmount
- Enhanced error handling consistency

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules configured in the project
- Write meaningful commit messages
- Add JSDoc comments for public APIs

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/cocojojo5213/Dev-Janitor/issues) with:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- System information (OS, Node.js version, etc.)

## License

This project is licensed under the MIT License with Commons Clause - see the [LICENSE](LICENSE) file for details.

**Note**: This is a source-available license. You can freely use, modify, and distribute this software for personal and non-commercial purposes. Commercial use (selling the software or services based on it) is not permitted without explicit permission.

## Contact

For commercial licensing inquiries or other questions, please contact us at:
- Email: cocojojo5213@gmail.com
- Email: cocojojo5213@icloud.com

## Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://reactjs.org/) - UI library
- [Ant Design](https://ant.design/) - UI components
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [i18next](https://www.i18next.com/) - Internationalization

---

<p align="center">
  Made with ❤️ 
</p>
