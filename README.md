# Dev Janitor

<p align="center">
  <img src="build/icon.svg" alt="Dev Janitor Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A cross-platform desktop application for cleaning up and managing development tools and dependencies</strong>
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
  <img src="https://img.shields.io/badge/version-1.2.0-blue.svg" alt="Version">
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
- **Supported Tools**: Node.js, Python, PHP, Java, Go, Rust, Ruby, .NET, npm, pip, Composer, Yarn, pnpm, Cargo, RubyGems, Git, Docker, Kubernetes CLI, Terraform, and more
- **Version Information**: Displays version numbers and installation paths
- **Installation Status**: Clear visual indicators for installed vs unavailable tools
- **Windows Compatibility**: Special handling for Windows Python Launcher (`py` command)

### 🤖 AI Assistant (NEW!)
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
| Windows | `Dev-Janitor-Setup-1.2.0.exe` |
| macOS | `Dev-Janitor-1.2.0.dmg` |
| Linux | `Dev-Janitor-1.2.0.AppImage` |

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

1. **Language**: Switch between English and Chinese
2. **AI Config**: Configure OpenAI API Key for AI-powered analysis
3. **About**: View application version, license, and contact information

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
│   │   └── pathScanner.ts
│   ├── renderer/          # React frontend
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand store
│   │   ├── i18n/          # Internationalization
│   │   └── ipc/           # IPC client
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
  Made with ❤️ by developers, for developers
</p>
