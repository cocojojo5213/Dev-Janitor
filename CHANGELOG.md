# Changelog / 更新日志

All notable changes to Dev Janitor will be documented in this file.
本文件记录 Dev Janitor 的所有重要更新。

---

## [1.7.7] - 2026-01-27

### Fixed / 修复
- **Release CI on legacy branch**: Remove npm cache (lockfile required) and use `npm install` instead of `npm ci` so tagged builds can run without a lockfile.
- **旧版分支发布 CI**: 移除 npm 缓存（需要 lockfile）并将 `npm ci` 改为 `npm install`，避免无 lockfile 时发布失败。

---

## [1.7.6] - 2026-01-27

### Changed / 变更
- **Legacy v1 upgrade notice**: Show a startup dialog pointing to the v2 releases page; it appears on every launch until the user chooses to stop reminders.
- **旧版 v1 升级提醒**: 启动时弹窗引导到 v2 发布页；每次启动都会提示，直到用户选择停止提醒。

---

## [1.7.5] - 2026-01-23

### Added / 新增
- **AI Cleanup scan modes**: Full disk scan or specific folder scan, with folder picker
- **AI 垃圾清理扫描模式**: 支持全盘扫描/指定目录扫描，并提供目录选择

### Changed / 变更
- **AI Cleanup detection**: Expanded AI junk heuristics (AI tool keywords, stale temp files, zero-byte short/odd names) and scan coverage/skip rules
- **AI 垃圾清理检测**: 扩展 AI 垃圾文件启发式规则（AI 关键词、过期临时文件、零字节短/异常名）并优化扫描范围/跳过规则

### Fixed / 修复
- **Windows cache scan**: Escape PowerShell LiteralPath to avoid path quoting issues
- **Windows 缓存扫描**: PowerShell LiteralPath 路径转义，避免引号问题
- **CSP hardening**: Remove `unsafe-inline` from script-src
- **CSP 加固**: script-src 移除 `unsafe-inline`
- **AI cleanup deletion feedback**: Clearer permission errors and chmod retry
- **AI 清理删除反馈**: 权限不足时提示更清晰并尝试解除只读

---

## [1.7.4] - 2026-01-22

### Added / 新增
- **Enhanced Package Discovery**: Support for Homebrew, Conda, Pipx, Poetry, and Pyenv package managers
- **增强包发现**: 支持 Homebrew、Conda、Pipx、Poetry 和 Pyenv 包管理器
- **Tiered Path Search**: Smart 4-tier search strategy for finding package managers (direct command → PATH scan → common paths → custom config)
- **分层路径搜索**: 智能四层搜索策略查找包管理器（直接命令 → PATH 扫描 → 常见路径 → 自定义配置）
- **PATH Status Detection**: Detect when package managers are installed but not in PATH, with helpful suggestions
- **PATH 状态检测**: 检测包管理器已安装但不在 PATH 中的情况，并提供修复建议
- **Custom Config Support**: User-configurable paths via `~/.config/dev-janitor/package-managers.json`
- **自定义配置支持**: 用户可通过 `~/.config/dev-janitor/package-managers.json` 配置自定义路径
- **Package Uninstall Button**: Added uninstall button to the packages table for npm/pip/composer packages
- **包卸载按钮**: 在依赖包表格中添加了 npm/pip/composer 包的卸载按钮
- **Issue Templates**: Added GitHub issue templates for bug reports, feature requests, and general questions (PR #32)
- **Issue 模板**: 添加了 GitHub issue 模板，用于 bug 报告、功能请求和一般问题 (PR #32)

### Changed / 变更
- **Property-Based Testing**: Added comprehensive PBT tests for all new package handlers
- **属性测试**: 为所有新包处理器添加了全面的属性测试

### Fixed / 修复
- **macOS nvm detection**: Fixed nvm detection on macOS/Linux where nvm is a shell script, not a binary (PR #29, thanks @webliuxiang) - Fixes #28
- **macOS nvm 检测**: 修复 macOS/Linux 上 nvm 检测问题，nvm 是 shell 脚本而非二进制文件 (PR #29, 感谢 @webliuxiang) - 修复 #28
- **AI CLI detection on macOS**: Improved AI CLI tool detection to not require npm list check, supporting alternative installation methods (PR #29) - Fixes #28
- **macOS AI CLI 检测**: 改进 AI CLI 工具检测，不再强制要求 npm list 检查，支持其他安装方式 (PR #29) - 修复 #28
- **Enhanced npm package uninstall**: Added `--force` flag, npm cache cleanup, and verification to ensure complete package removal
- **增强 npm 包卸载**: 添加 `--force` 标志、npm 缓存清理和验证机制，确保包被完全删除
- **AI Cleanup algorithm**: Improved junk file detection with whitelist mechanism to avoid false positives (audio, video, documents are now safe)
- **AI 垃圾清理算法**: 改进垃圾文件检测算法，添加白名单机制避免误删（音频、视频、文档等文件现在安全）

### Known Issues / 已知问题
- **Windows multi-Python detection**: Currently only detects one Python version. Multi-version detection (conda, pyenv, etc.) will be improved in future releases - See #30
- **Windows 多 Python 检测**: 目前只能检测到一个 Python 版本。多版本检测（conda、pyenv 等）将在后续版本中改进 - 见 #30
- **macOS tool detection**: Some tools (golang, .net, java, homebrew) are not yet detected on macOS - See #28
- **macOS 工具检测**: 部分工具（golang、.net、java、homebrew）在 macOS 上尚未支持检测 - 见 #28

---

## [1.7.3] - 2026-01-22

### Added / 新增
- **AI Cleanup**: New feature to scan and clean junk files created by AI coding assistants (nul files, .aider session files, .claude.json.backup, etc.)
- **AI 垃圾清理**: 新功能，扫描并清理 AI 编程助手产生的垃圾文件（nul 文件、.aider 会话文件、.claude.json.backup 等）

### Changed / 变更
- **README**: Added hero images to both English and Chinese README files
- **README**: 中英文 README 添加了预览图

---

## [1.7.2] - 2026-01-22

### Fixed / 修复
- **AI CLI uninstall**: Fixed issue where deleted AI CLI tools still showed as installed after refresh
- **AI CLI 删除功能**: 修复删除 AI CLI 工具后刷新仍显示已安装的问题

### Changed / 变更
- **Font**: Use Google Fonts CDN (Noto Sans SC) for unified Chinese/English display
- **字体**: 使用 Google Fonts CDN 加载思源黑体，统一中英文显示效果
- **App icon**: Generate custom ICO icon, replace default system icon
- **应用图标**: 生成自定义 ICO 图标，替换系统默认图标

### Added / 新增
- **iFlow CLI**: Install/update/uninstall support for iFlow CLI
- **iFlow CLI**: AI CLI 工具现已支持 iFlow CLI 的安装/更新/卸载

---

## [1.7.1] - 2026-01-21

### Added / 新增
- SVN detection / SVN 版本控制工具检测
- uv Python package installer detection / uv Python 包管理器检测
- iFlow CLI support / iFlow CLI 支持

### Performance / 性能
- Lazy loading for all view components / 所有视图组件懒加载
- Image compression: 16MB → 0.6MB (96% reduction) / 图片压缩 96%

---

## [1.7.0] - 2026-01-21

### Added / 新增
- **Cache Cleaner**: Clean caches for 11 package managers (npm, yarn, pip, etc.)
- **缓存清理**: 支持清理 11 种包管理器缓存
- **Tool Uninstall**: One-click uninstall for development tools
- **工具卸载**: 一键卸载开发工具

---

## [1.6.1] - 2026-01-20

### Added / 新增
- Maven tool detection / Maven 工具检测

### Fixed / 修复
- Java version detection (stderr output) / Java 版本检测修复

### Changed / 变更
- Hide default Electron menu bar / 隐藏默认菜单栏
- Dynamic version display in About page / 关于页面动态显示版本号

---

## [1.5.x] - 2026-01-18

### Fixed / 修复
- White screen bug on production builds / 生产构建白屏问题
- Preload script loading failure / 预加载脚本加载失败
- AI API crash when electronAPI undefined / AI API 崩溃问题
- Language persistence on restart / 语言设置持久化
- Mac white screen issue / Mac 白屏问题

---

## [1.5.0] - 2026-01-18

### Added / 新增
- **Theme Support**: Light/Dark/System themes / 主题支持：亮色/暗色/跟随系统
- Package version cache persistence / 包版本缓存持久化

---

## [1.4.0] - 2026-01-17

### Added / 新增
- **Security**: Command validation, input sanitization, CSP / 安全增强
- **Performance**: LRU cache, debounced monitoring / 性能优化
- 402 tests passing / 402 个测试通过

---

## [1.2.0] - 2026-01-17

### Added / 新增
- **One-Click Update**: Direct package update for npm/pip / 一键更新 npm/pip 包

---

## [1.1.0] - 2026-01-17

### Added / 新增
- **Custom AI Provider**: Support for OpenAI-compatible endpoints / 自定义 AI 服务端点

---

## [1.0.0] - 2024-01-XX

### Added / 新增
- **AI Assistant**: Local rule-based analysis + optional OpenAI / AI 助手
- **Tool Detection**: 19+ development tools / 工具检测
- **Package Management**: npm, pip, Composer / 包管理
- **Service Monitoring**: Port detection, process control / 服务监控
- **Environment Variables**: PATH analysis / 环境变量分析
- **i18n**: English & Chinese / 中英文支持
- **Cross-Platform**: Windows, macOS, Linux / 跨平台支持

---

[1.7.7]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.7
[1.7.6]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.6
[1.7.5]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.5
[1.7.4]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.4
[1.7.3]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.3
[1.7.2]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.2
[1.7.1]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.1
[1.7.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.7.0
[1.6.1]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.6.1
[1.5.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.5.0
[1.4.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.4.0
[1.2.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.2.0
[1.1.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.1.0
[1.0.0]: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v1.0.0
