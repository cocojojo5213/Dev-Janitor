# Changelog

All notable changes to Dev Janitor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2026-01-25

### 新增
- 所有视图的扫描结果在切换页面后保持不变（Tools、Cache、Services、AI CLI）
- 添加 README 截图展示

### 修复
- 修复 Windows 上 AI CLI 工具检测失败的问题（npm 全局安装的 .cmd 脚本现在可以正确检测）
- 修复 CI Clippy 更多警告 (`&PathBuf` → `&Path`, 冗余模式匹配等)
- 消除 Rust 编译时的所有警告

### 优化
- 改进代码结构，使用全局 store 统一管理视图状态

## [2.0.2] - 2026-01-25

### 修复
- 修复 GitHub Actions 的 Clippy 在 Linux 上报 `permissions_set_readonly_false` 警告
- 修复 AI 清理扫描结果在切换页面后丢失的问题（将状态从组件本地状态迁移到全局 store）

## [2.0.1] - 2026-01-24

### 修复
- 修复缓存清理在不同标签页之间的选中状态混用问题
- 修复 AI 清理白名单目录仍会继续递归扫描的问题
- 修复 Gemini CLI 安装包名错误

### 优化
- Windows 下执行命令不再弹出终端窗口，减少“闪烁”现象

### 本地化
- 补充缓存名称、AI 清理原因、服务状态等中文显示
- 修正语言切换按钮的显示字符

## [2.0.0] - 2025-01-24

### 🎉 Complete Rebuild - v2.0

This is a complete rewrite of Dev Janitor with a new tech stack and vastly improved performance.

### ✨ New Features

#### Phase 1: Lightweight Foundation
- Migrated from Electron to **Tauri 2.0** for smaller bundle size (< 25MB)
- React 18 + TypeScript + Vite frontend
- pnpm for fast package management
- Multi-language support (English, Japanese, Chinese)
- Dark/Light theme with system preference detection

#### Phase 2: Fast Detection
- **Development Tools Detection**: Automatic detection of 30+ dev tools
  - Node.js, Python, Rust, Go, Java, Ruby, PHP, .NET, and more
  - Version detection and path information
  - Uninstall support

#### Phase 3: Dependency Management
- **Package Managers**: npm, pnpm, yarn, pip, cargo, composer
  - List all global packages
  - Update/Uninstall individual packages
  - Version and author information

#### Phase 4: Precise Cleanup
- **Cache Management**: Clean up development caches
  - npm cache, pnpm cache, yarn cache
  - pip cache, cargo cache
  - Project-level node_modules and __pycache__
  - Batch selection and deletion

#### Phase 5: AI Junk Cleanup
- **AI-Generated Files Detection**
  - 15+ AI tool patterns (Aider, Claude, Cursor, Copilot, etc.)
  - Temporary file detection
  - Anomalous file detection (zero-byte, suspicious names)
  - Whitelist protection for important files
  - Permission error handling

#### Phase 6: Service Monitoring
- **Process Management** using sysinfo
  - Development-related process filtering (50+ patterns)
  - Process categorization (Runtime, Build Tool, Server, etc.)
  - Memory and CPU usage display
  - One-click process termination
- **Port Monitoring**
  - Active port scanning (Windows: netstat, Unix: ss/lsof)
  - Common dev ports filtering

#### Phase 7: Environment Diagnostics
- **PATH Analysis**
  - List all PATH entries with status
  - Dev-related path categorization
  - Issue detection (missing paths, duplicates, spaces)
- **Shell Config Analysis**
  - Bash, Zsh, Fish, PowerShell config detection
  - Dev-related export extraction
  - Configuration issue detection

#### Phase 8: AI CLI Tools Management
- **AI Coding Assistants**
  - Claude Code, Codex, Gemini CLI, Aider, Continue, Cody, Cursor
  - Install/Update/Uninstall support
  - Version detection
  - **Config file path display** for easy editing

### 🔧 Technical Improvements

- Rust backend with parallel processing (rayon)
- Lazy-loaded React components for fast startup
- Optimized release profile for smaller binaries
- GitHub Actions CI/CD pipeline

### 📦 Distribution

- Windows: .msi, .exe (NSIS)
- Linux: .AppImage, .deb, .rpm
- macOS: .dmg (unsigned, requires Apple Developer for signing)
- Tauri Updater for automatic updates

### 🎨 UI/UX

- Modern, clean interface with glassmorphism effects
- Responsive layout with minimum window size
- Color-coded status badges and categories
- Tabbed navigation for complex views
- Confirmation dialogs for destructive actions

---

## [1.x.x] - Legacy

Previous Electron-based versions. See old repository for history.
