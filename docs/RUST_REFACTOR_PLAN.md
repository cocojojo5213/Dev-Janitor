# Dev Janitor - Rust 重构计划

> 📅 计划日期：2026-01-24
> 🎯 目标：使用 2026 年 1 月最新稳定技术栈，将 Electron 项目重构为 Tauri + Rust

---

## 📊 技术栈选型（2026.1 最新稳定版）

### 核心框架

| 组件 | 版本 | 说明 |
|------|------|------|
| **Rust** | 1.93.0 (2026-01-22) | 最新稳定版 |
| **Tauri** | 2.9.x | 稳定版，2024.10 发布 2.0 |
| **Node.js** | 22.x LTS | 前端构建工具链 |

### 前端技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| **React** | 19.x | 最新稳定版 |
| **TypeScript** | 5.7+ | 类型安全 |
| **Vite** | 6.x / 7.x | 前端构建 |
| **Ant Design** | 5.x | 保持 v5 稳定版（v6 刚发布，等待稳定） |
| **Tailwind CSS** | 4.x | CSS-first 配置 |
| **Zustand** | 5.x | 状态管理 |
| **i18next** | 25.x | 国际化 |

### Rust 后端依赖

| Crate | 版本 | 用途 |
|-------|------|------|
| `tauri` | 2.9.x | 桌面应用框架 |
| `tokio` | 1.x | 异步运行时 |
| `serde` | 1.x | 序列化 |
| `serde_json` | 1.x | JSON 处理 |
| `reqwest` | 0.12.x | HTTP 客户端 |
| `sysinfo` | 0.33.x | 系统信息 |
| `walkdir` | 2.x | 目录遍历 |
| `regex` | 1.x | 正则表达式 |
| `which` | 7.x | 命令查找 |
| `directories` | 6.x | 跨平台路径 |
| `thiserror` | 2.x | 错误处理 |
| `tracing` | 0.1.x | 日志/追踪 |

---

## 🏗️ 项目架构

```
dev-janitor-rs/
├── src-tauri/                    # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs               # 入口
│   │   ├── lib.rs                # 库入口
│   │   ├── commands/             # Tauri 命令（IPC）
│   │   │   ├── mod.rs
│   │   │   ├── tools.rs          # 工具检测命令
│   │   │   ├── packages.rs       # 包管理命令
│   │   │   ├── services.rs       # 服务监控命令
│   │   │   ├── cache.rs          # 缓存清理命令
│   │   │   └── ai_assistant.rs   # AI CLI 管理命令
│   │   ├── detection/            # 工具检测引擎
│   │   │   ├── mod.rs
│   │   │   ├── tool_scanner.rs
│   │   │   ├── environment.rs
│   │   │   └── registry.rs       # 工具注册表
│   │   ├── package_manager/      # 包管理器
│   │   │   ├── mod.rs
│   │   │   ├── npm.rs
│   │   │   ├── pip.rs
│   │   │   ├── cargo.rs
│   │   │   └── composer.rs
│   │   ├── services/             # 服务监控
│   │   │   ├── mod.rs
│   │   │   ├── process.rs
│   │   │   └── port.rs
│   │   ├── cache/                # 缓存扫描清理
│   │   │   ├── mod.rs
│   │   │   ├── scanner.rs
│   │   │   └── cleaner.rs
│   │   ├── ai/                   # AI 助手管理
│   │   │   ├── mod.rs
│   │   │   ├── codex.rs
│   │   │   ├── claude_code.rs
│   │   │   ├── gemini_cli.rs
│   │   │   └── open_code.rs
│   │   ├── utils/                # 工具函数
│   │   │   ├── mod.rs
│   │   │   ├── command.rs        # 命令执行
│   │   │   ├── path.rs           # 路径处理
│   │   │   └── platform.rs       # 平台差异
│   │   └── error.rs              # 错误类型
│   └── icons/                    # 应用图标
│
├── src/                          # React 前端（复用+升级）
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── store/
│   ├── i18n/
│   └── ipc/                      # Tauri IPC 调用
│       └── commands.ts           # 替换 Electron IPC
│
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js            # Tailwind v4 配置
└── tsconfig.json
```

---

## 📋 功能模块迁移清单

### Phase 1: 基础架构（Week 1-2）

| 任务 | 优先级 | 复杂度 | 状态 |
|------|--------|--------|------|
| Tauri 项目初始化 | P0 | 🟢 低 | ⬜ |
| 前端迁移（React 19 + Vite 6） | P0 | 🟡 中 | ⬜ |
| Tailwind CSS v4 升级 | P0 | 🟡 中 | ⬜ |
| IPC 桥接层设计 | P0 | 🟡 中 | ⬜ |
| 错误处理框架 | P0 | 🟢 低 | ⬜ |
| 日志/追踪系统 | P1 | 🟢 低 | ⬜ |

### Phase 2: 工具检测引擎（Week 3-4）

| 现有模块 | Rust 模块 | 复杂度 | 状态 |
|----------|-----------|--------|------|
| `detectionEngine.ts` | `detection/tool_scanner.rs` | 🔴 高 | ⬜ |
| `environmentScanner.ts` | `detection/environment.rs` | 🟡 中 | ⬜ |
| `pathScanner.ts` | `utils/path.rs` | 🟡 中 | ⬜ |
| 39+ 工具检测规则 | `detection/registry.rs` | 🔴 高 | ⬜ |

### Phase 3: 包管理器（Week 5-6）

| 现有模块 | Rust 模块 | 复杂度 | 状态 |
|----------|-----------|--------|------|
| `packageManager.ts` | `package_manager/mod.rs` | 🔴 高 | ⬜ |
| npm 全局包管理 | `package_manager/npm.rs` | 🟡 中 | ⬜ |
| pip 包管理 | `package_manager/pip.rs` | 🟡 中 | ⬜ |
| Cargo 包管理 | `package_manager/cargo.rs` | 🟢 低 | ⬜ |
| Composer 包管理 | `package_manager/composer.rs` | 🟡 中 | ⬜ |
| `packageDiscovery/` | 合并到各模块 | 🟡 中 | ⬜ |

### Phase 4: 服务监控（Week 7）

| 现有模块 | Rust 模块 | 复杂度 | 状态 |
|----------|-----------|--------|------|
| `serviceMonitor.ts` | `services/process.rs` | 🟡 中 | ⬜ |
| 端口占用查询 | `services/port.rs` | 🟡 中 | ⬜ |
| 进程终止 | `services/process.rs` | 🟢 低 | ⬜ |

### Phase 5: 缓存清理（Week 8）

| 现有模块 | Rust 模块 | 复杂度 | 状态 |
|----------|-----------|--------|------|
| `cacheScanner.ts` | `cache/scanner.rs` | 🟡 中 | ⬜ |
| 缓存清理 | `cache/cleaner.rs` | 🟡 中 | ⬜ |
| 11 种包管理器缓存 | `cache/scanner.rs` | 🟡 中 | ⬜ |

### Phase 6: AI 助手管理（Week 9-10）

| 现有模块 | Rust 模块 | 复杂度 | 状态 |
|----------|-----------|--------|------|
| `aiAssistant.ts` | `ai/mod.rs` | 🔴 高 | ⬜ |
| `aiCleanupScanner.ts` | `ai/cleanup.rs` | 🟡 中 | ⬜ |
| Codex 管理 | `ai/codex.rs` | 🟡 中 | ⬜ |
| Claude Code 管理 | `ai/claude_code.rs` | 🟡 中 | ⬜ |
| Gemini CLI 管理 | `ai/gemini_cli.rs` | 🟡 中 | ⬜ |
| OpenCode 管理 | `ai/open_code.rs` | 🟡 中 | ⬜ |
| iFlow 管理 | `ai/iflow.rs` | 🟡 中 | ⬜ |

### Phase 7: 自动更新 & 打包（Week 11）

| 任务 | 复杂度 | 状态 |
|------|--------|------|
| Tauri 自动更新配置 | 🟡 中 | ⬜ |
| Windows 签名 | 🟡 中 | ⬜ |
| macOS 签名公证 | 🔴 高 | ⬜ |
| Linux 打包（AppImage/deb/rpm） | 🟢 低 | ⬜ |
| GitHub Actions CI/CD | 🟡 中 | ⬜ |

### Phase 8: 测试 & 发布（Week 12）

| 任务 | 复杂度 | 状态 |
|------|--------|------|
| 单元测试 | 🟡 中 | ⬜ |
| 集成测试 | 🟡 中 | ⬜ |
| 跨平台测试 | 🔴 高 | ⬜ |
| 性能对比测试 | 🟢 低 | ⬜ |
| 文档更新 | 🟢 低 | ⬜ |
| v2.0.0 发布 | 🟢 低 | ⬜ |

---

## 🔧 关键实现细节

### 1. IPC 命令设计

```rust
// src-tauri/src/commands/tools.rs
use tauri::command;

#[derive(serde::Serialize)]
pub struct DetectedTool {
    pub id: String,
    pub name: String,
    pub version: Option<String>,
    pub path: Option<String>,
    pub category: String,
    pub status: ToolStatus,
}

#[command]
pub async fn scan_tools() -> Result<Vec<DetectedTool>, String> {
    crate::detection::tool_scanner::scan_all_tools()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_tool_version(tool_id: String) -> Result<String, String> {
    crate::detection::tool_scanner::get_version(&tool_id)
        .await
        .map_err(|e| e.to_string())
}
```

### 2. 前端 IPC 调用

```typescript
// src/ipc/commands.ts
import { invoke } from '@tauri-apps/api/core';

export interface DetectedTool {
  id: string;
  name: string;
  version: string | null;
  path: string | null;
  category: string;
  status: 'installed' | 'outdated' | 'not_installed';
}

export async function scanTools(): Promise<DetectedTool[]> {
  return invoke('scan_tools');
}

export async function getToolVersion(toolId: string): Promise<string> {
  return invoke('get_tool_version', { toolId });
}
```

### 3. 跨平台命令执行

```rust
// src-tauri/src/utils/command.rs
use std::process::Command;
use tokio::process::Command as AsyncCommand;

pub async fn execute_command(
    program: &str,
    args: &[&str],
) -> Result<String, crate::error::AppError> {
    #[cfg(windows)]
    let output = AsyncCommand::new("cmd")
        .args(["/C", program])
        .args(args)
        .output()
        .await?;

    #[cfg(not(windows))]
    let output = AsyncCommand::new(program)
        .args(args)
        .output()
        .await?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(crate::error::AppError::CommandFailed(
            String::from_utf8_lossy(&output.stderr).to_string()
        ))
    }
}
```

---

## 📈 预期收益

| 指标 | Electron (当前) | Tauri (目标) | 改进 |
|------|-----------------|--------------|------|
| 安装包大小 | ~180 MB | ~15-25 MB | **85-90% ↓** |
| 内存占用 | ~300-500 MB | ~50-100 MB | **70-80% ↓** |
| 启动时间 | ~3-5s | ~0.5-1s | **80% ↓** |
| 依赖数量 | 845+ npm 包 | ~30 crates | **96% ↓** |
| 安全性 | 中 | 高 (Rust 内存安全) | ⬆️ |

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Rust 学习曲线 | 🟡 中 | 利用现有 Rust 经验，参考 Tauri 官方示例 |
| 跨平台兼容性 | 🔴 高 | 每个 Phase 完成后进行三平台测试 |
| 功能回归 | 🟡 中 | 保持测试覆盖，对照现有功能列表 |
| AI 助手 API 变化 | 🟡 中 | 设计可扩展的 Trait 抽象 |

---

## 🚀 启动步骤

### Step 1: 创建新分支
```bash
git checkout -b feat/tauri-refactor
```

### Step 2: 初始化 Tauri 项目
```bash
# 安装 Tauri CLI
cargo install tauri-cli --version "^2.0"

# 在现有项目中初始化 Tauri
npx tauri init
```

### Step 3: 配置 Rust 工具链
```bash
rustup update stable
rustup default stable
```

### Step 4: 开始迁移
按照 Phase 顺序逐步实施。

---

## 📅 时间线

| 阶段 | 时间 | 里程碑 |
|------|------|--------|
| Phase 1 | Week 1-2 | 🎯 基础架构就绪，Hello World |
| Phase 2 | Week 3-4 | 🎯 工具检测核心功能 |
| Phase 3 | Week 5-6 | 🎯 包管理功能完成 |
| Phase 4 | Week 7 | 🎯 服务监控功能 |
| Phase 5 | Week 8 | 🎯 缓存清理功能 |
| Phase 6 | Week 9-10 | 🎯 AI 助手管理 |
| Phase 7 | Week 11 | 🎯 打包与自动更新 |
| Phase 8 | Week 12 | 🎯 **v2.0.0 发布** |

**总计：约 3 个月**

---

## ✅ 下一步行动

1. [ ] 确认技术栈选型
2. [ ] 创建 `feat/tauri-refactor` 分支
3. [ ] 初始化 Tauri 项目结构
4. [ ] 开始 Phase 1 基础架构搭建

---

*最后更新：2026-01-24*
