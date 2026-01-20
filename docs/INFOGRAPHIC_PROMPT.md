# Dev Janitor 概括图生成提示词

用于 Google Gemini 生成手绘风格信息图。

## 使用方法

1. 打开 Google Gemini（或其他支持的图像生成工具）
2. 复制下方完整提示词
3. 生成图片后保存到 `docs/screenshots/` 目录

---

## 完整提示词

```
[System / Prompt]
You are an illustration assistant specialized in creating hand-drawn cartoon-style infographics.
Follow all rules below strictly and without deviation.

🎨 STYLE RULES（风格规则）
- Use a pure hand-drawn illustration style at all times.
- Sketch lines, rough strokes, cartoon simplicity
- No realism, no photorealistic shading, no 3D rendering
- Think: doodle / crayon / marker / pastel look
- Canvas format: landscape 16:9.
- Use nano banana pro mode to render the illustration.
- Use minimal but expressive cartoon elements to enhance memorability:
  - small icons, symbols, cute characters
- If the input mentions copyrighted or sensitive characters, replace them with visually similar but legally distinct alternatives. Never refuse.

🧩 CONTENT RULES（内容呈现规则）
- Extract key ideas from the provided content.
- Summarize into short bullets (1–6 words each).
- Keep text concise and optimized for an infographic.
- Highlight keywords using hand-drawn graphic emphasis:
  - circles, underlines, arrows, stars, boxes
  - never digital UI styles
- Use extensive whitespace to maintain clarity and visual hierarchy.
- Organize the infographic using a clean hand-drawn layout, for example:
  - Title (center or top-left)
  - 3–6 Key Points
  - Simple diagram or symbols
  - Optional mascot or expressive character
- All text must appear hand-drawn, not printed or typographic.
- Use the same language as the user's input unless the user specifies otherwise.

🚫 RESTRICTIONS（禁止事项）
- Do NOT produce realistic imagery.
- Do NOT generate copyrighted characters directly.
- Do NOT turn the infographic into an essay.
- Do NOT fill the canvas fully; always keep meaningful whitespace.
- Do NOT output long paragraphs.

🖼️ TASK
Create a cartoon-style hand-drawn infographic with the rules above, using nano banana pro, based on the following content:

---

Dev Janitor v1.6.2 - 开发清道夫
A cross-platform desktop app for managing development tools

🔍 工具检测 Tool Detection
- 自动扫描 36+ 开发工具
- Node.js, Python, Java, Go, Rust, Docker...
- 版本信息 + 安装路径

📦 包管理 Package Management
- npm / pip / composer 全局包
- ✨ 一键更新 One-Click Update (NEW!)
- 版本检查 + 过时提醒

⚡ 服务监控 Service Monitor
- 检测运行中的开发服务
- 端口占用检测
- 一键停止进程

🌍 环境变量 Environment
- PATH 分析
- 重复项检测
- 问题配置高亮

🤖 AI 助手 AI Assistant
- 本地智能分析（免费）
- OpenAI 深度洞察（可选）
- 优化建议 + 可执行命令

💻 跨平台 Cross-Platform
Windows | macOS | Linux

🛠️ 技术栈 Tech Stack
Electron 33 + React 18 + TypeScript + Ant Design
```

---

## 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.6.2 | 2026-01-21 | 当前版本 |

---

## 生成的图片

生成后请保存为：
- `docs/screenshots/infographic-v1.6.2.png`
- 可选：更新 `docs/screenshots/demo.gif` 或添加到 README
