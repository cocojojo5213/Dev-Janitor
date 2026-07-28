//! Shared metadata for supported AI coding tools.

#[derive(Debug, Clone, Copy)]
pub struct AiToolMetadata {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub docs_url: &'static str,
    pub commands: &'static [&'static str],
    pub version_args: &'static [&'static str],
    pub version_regex: Option<&'static str>,
    pub config_directories: &'static [&'static str],
    pub config_files: &'static [&'static str],
    pub config_extensions: &'static [&'static str],
}

static AI_TOOLS: &[AiToolMetadata] = &[
    AiToolMetadata {
        id: "claude",
        name: "Claude Code",
        description: "Anthropic's terminal coding agent",
        docs_url: "https://code.claude.com/docs/en/install",
        commands: &["claude"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".claude"],
        config_files: &[
            ".claude/settings.json",
            ".claude/agents",
            ".claude/commands",
            ".claude/CLAUDE.md",
            ".claude.json",
        ],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "codex",
        name: "OpenAI Codex CLI",
        description: "OpenAI's coding agent for terminal workflows",
        docs_url: "https://developers.openai.com/codex/cli",
        commands: &["codex"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".codex"],
        config_files: &[".codex/config.toml"],
        config_extensions: &["toml"],
    },
    AiToolMetadata {
        id: "opencode",
        name: "OpenCode",
        description: "Terminal-first coding agent with structured JSON config",
        docs_url: "https://opencode.ai/docs",
        commands: &["opencode"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".opencode", ".config/opencode"],
        config_files: &[
            ".opencode/opencode.json",
            ".opencode/opencode.jsonc",
            ".config/opencode/opencode.json",
            ".config/opencode/opencode.jsonc",
            ".config/opencode/tui.json",
            ".config/opencode/tui.jsonc",
            ".config/opencode/agents",
            ".config/opencode/commands",
            ".config/opencode/plugins",
            ".config/opencode/skills",
            ".config/opencode/tools",
        ],
        config_extensions: &["json", "jsonc"],
    },
    AiToolMetadata {
        id: "goose",
        name: "Goose CLI",
        description: "Local-first extensible AI agent with MCP support",
        docs_url: "https://goose-docs.ai/docs/getting-started/installation",
        commands: &["goose"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".config/goose", ".local/share/goose", ".local/state/goose"],
        config_files: &[
            ".config/goose/config.yaml",
            ".config/goose/profiles.yaml",
            ".config/goose/history.txt",
            ".local/share/goose/sessions",
            ".local/state/goose/logs",
        ],
        config_extensions: &["yaml", "yml", "json", "jsonl", "txt", "db"],
    },
    AiToolMetadata {
        id: "openhands",
        name: "OpenHands CLI",
        description: "Open-source software development agent with CLI and web modes",
        docs_url: "https://docs.openhands.dev/openhands/usage/cli/installation",
        commands: &["openhands"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".openhands"],
        config_files: &[
            ".openhands/settings.json",
            ".openhands/conversations",
            ".openhands/hooks.json",
            ".openhands/setup.sh",
            ".openhands/hooks",
        ],
        config_extensions: &["json", "toml", "yaml", "yml", "sh"],
    },
    AiToolMetadata {
        id: "auggie",
        name: "Auggie CLI",
        description: "Augment Code's terminal coding agent",
        docs_url: "https://docs.augmentcode.com/cli/overview",
        commands: &["auggie"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".augment"],
        config_files: &[
            ".augment/settings.json",
            ".augment/commands",
            ".augment/skills",
        ],
        config_extensions: &["json", "jsonc", "md"],
    },
    AiToolMetadata {
        id: "kilo",
        name: "Kilo Code CLI",
        description: "Kilo Code's terminal coding agent",
        docs_url: "https://kilo.ai/docs/code-with-ai/platforms/cli",
        commands: &["kilo"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".config/kilo"],
        config_files: &[
            ".config/kilo/kilo.jsonc",
            ".config/kilo/opencode.json",
            ".config/kilo/opencode.jsonc",
            ".config/kilo/config.json",
        ],
        config_extensions: &["json", "jsonc"],
    },
    AiToolMetadata {
        id: "junie",
        name: "Junie CLI",
        description: "JetBrains' terminal coding agent",
        docs_url: "https://junie.jetbrains.com/docs/junie-cli.html",
        commands: &["junie"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".junie"],
        config_files: &[
            ".junie/config.json",
            ".junie/settings.json",
            ".junie/AGENTS.md",
            ".junie/mcp/mcp.json",
            ".junie/skills",
            ".junie/commands",
            ".junie/agents",
            ".junie/models",
            ".junie/extensions/extensions.json",
            ".junie/extensions/marketplaces.json",
        ],
        config_extensions: &["json", "md"],
    },
    AiToolMetadata {
        id: "gemini",
        name: "Gemini CLI",
        description: "Google's open-source terminal AI agent",
        docs_url: "https://google-gemini.github.io/gemini-cli/",
        commands: &["gemini"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".gemini"],
        config_files: &[".gemini/settings.json"],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "aider",
        name: "Aider",
        description: "AI pair programming from your terminal",
        docs_url: "https://aider.chat/docs/install.html",
        commands: &["aider"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".aider"],
        config_files: &[
            ".aider.conf.yml",
            ".aider.conf.yaml",
            ".aider.model.settings.yml",
            ".aider.model.metadata.json",
        ],
        config_extensions: &["json", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "continue",
        name: "Continue",
        description: "Continue's terminal coding agent",
        docs_url: "https://docs.continue.dev/cli/quickstart",
        commands: &["cn", "continue"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".continue"],
        config_files: &[
            ".continue/config.yaml",
            ".continue/config.yml",
            ".continue/config.json",
            ".continue/rules",
        ],
        config_extensions: &["json", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "cody",
        name: "Sourcegraph Cody",
        description: "Sourcegraph's coding assistant CLI",
        docs_url: "https://sourcegraph.com/docs/cody/clients/install-cli",
        commands: &["cody", "cody-agent"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".sourcegraph", ".cody"],
        config_files: &[".sourcegraph/cody.json", ".cody/config.json"],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "cursor",
        name: "Cursor CLI",
        description: "Cursor Agent command-line interface",
        docs_url: "https://docs.cursor.com/en/cli/installation",
        commands: &["cursor-agent", "cursor"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".cursor"],
        config_files: &[".cursor/cli-config.json"],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "kiro",
        name: "Kiro CLI",
        description: "AWS Kiro coding agent for terminal and CI workflows",
        docs_url: "https://kiro.dev/docs/cli/installation/",
        commands: &["kiro-cli", "kiro"],
        version_args: &["version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".kiro"],
        config_files: &[
            ".kiro/settings/cli.json",
            ".kiro/settings/mcp.json",
            ".kiro/steering",
        ],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "iflow",
        name: "iFlow CLI",
        description: "Terminal AI assistant from iFlow",
        docs_url: "https://platform.iflow.cn/en/cli/quickstart",
        commands: &["iflow"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".iflow"],
        config_files: &[".iflow/settings.json", ".iflow/IFLOW.md"],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "copilot",
        name: "GitHub Copilot CLI",
        description: "GitHub Copilot's standalone terminal assistant",
        docs_url: "https://github.com/github/copilot-cli",
        commands: &["copilot"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".copilot", ".config/github-copilot"],
        config_files: &[".copilot/config.json"],
        config_extensions: &["json"],
    },
    AiToolMetadata {
        id: "qwen",
        name: "Qwen Code",
        description: "Qwen's open-source terminal coding agent",
        docs_url: "https://github.com/QwenLM/qwen-code",
        commands: &["qwen"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".qwen", ".config/qwen"],
        config_files: &[".qwen/settings.json", ".qwen/QWEN.md"],
        config_extensions: &["json", "toml", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "cline",
        name: "Cline CLI",
        description: "Autonomous coding agent CLI from Cline",
        docs_url: "https://cline.bot",
        commands: &["cline"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".cline", ".config/cline"],
        config_files: &[
            ".cline/config.json",
            ".cline/settings.json",
            ".config/cline/config.json",
            ".config/cline/settings.json",
        ],
        config_extensions: &["json", "jsonc", "toml", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "amp",
        name: "Amp",
        description: "Sourcegraph's agentic coding tool for the terminal",
        docs_url: "https://ampcode.com/manual",
        commands: &["amp"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".amp", ".config/amp"],
        config_files: &[".amp/settings.json", ".config/amp/settings.json"],
        config_extensions: &["json", "jsonc", "toml"],
    },
    AiToolMetadata {
        id: "crush",
        name: "Crush",
        description: "Charm's terminal AI coding agent",
        docs_url: "https://charm.sh/crush",
        commands: &["crush"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".crush", ".config/crush"],
        config_files: &[".crush/config.json", ".config/crush/config.json"],
        config_extensions: &["json", "jsonc", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "droid",
        name: "Factory Droid",
        description: "Factory's autonomous coding agent for terminal workflows",
        docs_url: "https://docs.factory.ai/reference/cli-reference",
        commands: &["droid"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".factory"],
        config_files: &[
            ".factory/settings.json",
            ".factory/settings.local.json",
            ".factory/config.json",
            ".factory/mcp.json",
            ".factory/AGENTS.md",
        ],
        config_extensions: &["json", "jsonc", "md"],
    },
    AiToolMetadata {
        id: "vibe",
        name: "Mistral Vibe",
        description: "Mistral's open-source coding agent for terminal workflows",
        docs_url: "https://docs.mistral.ai/vibe/code/cli/install-setup",
        commands: &["vibe"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".vibe"],
        config_files: &[".vibe/config.toml"],
        config_extensions: &["toml", "json", "yaml", "yml"],
    },
    AiToolMetadata {
        id: "qoder",
        name: "Qoder CLI",
        description: "Qoder's agentic coding interface for terminal workflows",
        docs_url: "https://docs.qoder.com/en/cli/quick-start",
        commands: &["qodercli"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".qoder", ".qodercli"],
        config_files: &[
            ".qoder/settings.json",
            ".qoder/settings.local.json",
            ".qodercli/config.json",
        ],
        config_extensions: &["json", "jsonc", "md"],
    },
    AiToolMetadata {
        id: "pi",
        name: "Pi Coding Agent",
        description: "Minimal terminal coding agent with extensible models and tools",
        docs_url: "https://badlogic-pi-mono.mintlify.app/installation",
        commands: &["pi"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z\.-]+)?)"),
        config_directories: &[".pi/agent"],
        config_files: &[
            ".pi/agent/settings.json",
            ".pi/agent/keybindings.json",
            ".pi/agent/AGENTS.md",
        ],
        config_extensions: &["json", "jsonc", "md", "toml"],
    },
    AiToolMetadata {
        id: "amazonq",
        name: "Amazon Q Developer CLI",
        description: "Legacy AWS coding CLI; migrate existing installations to Kiro CLI",
        docs_url: "https://kiro.dev/docs/cli/migrating-from-q/",
        commands: &["q"],
        version_args: &["--version"],
        version_regex: Some(r"(\d+\.\d+\.\d+)"),
        config_directories: &[".amazonq", ".aws/amazonq"],
        config_files: &[".amazonq/mcp.json", ".aws/amazonq/mcp.json"],
        config_extensions: &["json", "toml", "yaml", "yml"],
    },
];

pub fn ai_tools() -> &'static [AiToolMetadata] {
    AI_TOOLS
}

pub fn find_ai_tool(id: &str) -> Option<&'static AiToolMetadata> {
    let normalized = normalize_ai_tool_id(id)?;
    AI_TOOLS.iter().find(|tool| tool.id == normalized)
}

pub fn normalize_ai_tool_id(id: &str) -> Option<&'static str> {
    match id {
        "claude" => Some("claude"),
        "codex" => Some("codex"),
        "opencode" => Some("opencode"),
        "goose" | "goose_cli" => Some("goose"),
        "openhands" | "openhands_cli" | "open_hands" => Some("openhands"),
        "auggie" | "augment" | "augment_cli" => Some("auggie"),
        "kilo" | "kilo_code" | "kilocode" => Some("kilo"),
        "junie" | "jetbrains_junie" => Some("junie"),
        "gemini" => Some("gemini"),
        "aider" => Some("aider"),
        "continue" | "continue_cli" => Some("continue"),
        "cody" => Some("cody"),
        "cursor" | "cursor_cli" => Some("cursor"),
        "kiro" | "kiro_cli" => Some("kiro"),
        "iflow" | "iflow_cli" => Some("iflow"),
        "copilot" | "github_copilot" => Some("copilot"),
        "qwen" | "qwen_code" => Some("qwen"),
        "cline" | "cline_cli" => Some("cline"),
        "amp" | "sourcegraph_amp" | "ampcode_cli" => Some("amp"),
        "crush" => Some("crush"),
        "droid" | "factory_droid" | "factory_cli" => Some("droid"),
        "vibe" | "mistral_vibe" => Some("vibe"),
        "qoder" | "qoder_cli" | "qodercli" => Some("qoder"),
        "pi" | "pi_coding_agent" => Some("pi"),
        "amazonq" | "amazon_q" | "q_cli" => Some("amazonq"),
        _ => None,
    }
}

pub fn is_ai_tool_id(id: &str) -> bool {
    normalize_ai_tool_id(id).is_some()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn includes_current_ai_cli_matrix() {
        let ids: Vec<_> = ai_tools().iter().map(|tool| tool.id).collect();
        assert!(ids.contains(&"codex"));
        assert!(ids.contains(&"claude"));
        assert!(ids.contains(&"goose"));
        assert!(ids.contains(&"openhands"));
        assert!(ids.contains(&"auggie"));
        assert!(ids.contains(&"kilo"));
        assert!(ids.contains(&"junie"));
        assert!(ids.contains(&"kiro"));
        assert!(ids.contains(&"iflow"));
        assert!(ids.contains(&"copilot"));
        assert!(ids.contains(&"qwen"));
        assert!(ids.contains(&"cline"));
        assert!(ids.contains(&"amp"));
        assert!(ids.contains(&"crush"));
        assert!(ids.contains(&"droid"));
        assert!(ids.contains(&"vibe"));
        assert!(ids.contains(&"qoder"));
        assert!(ids.contains(&"pi"));
        assert!(ids.contains(&"amazonq"));
    }

    #[test]
    fn codex_points_to_config_toml() {
        let codex = find_ai_tool("codex").expect("codex metadata should exist");
        assert!(codex.config_files.contains(&".codex/config.toml"));
    }

    #[test]
    fn normalizes_aliases() {
        assert_eq!(normalize_ai_tool_id("cursor_cli"), Some("cursor"));
        assert_eq!(normalize_ai_tool_id("continue_cli"), Some("continue"));
        assert_eq!(normalize_ai_tool_id("goose_cli"), Some("goose"));
        assert_eq!(normalize_ai_tool_id("open_hands"), Some("openhands"));
        assert_eq!(normalize_ai_tool_id("augment_cli"), Some("auggie"));
        assert_eq!(normalize_ai_tool_id("kilocode"), Some("kilo"));
        assert_eq!(normalize_ai_tool_id("jetbrains_junie"), Some("junie"));
        assert_eq!(normalize_ai_tool_id("iflow_cli"), Some("iflow"));
        assert_eq!(normalize_ai_tool_id("github_copilot"), Some("copilot"));
        assert_eq!(normalize_ai_tool_id("qwen_code"), Some("qwen"));
        assert_eq!(normalize_ai_tool_id("cline_cli"), Some("cline"));
        assert_eq!(normalize_ai_tool_id("ampcode_cli"), Some("amp"));
        assert_eq!(normalize_ai_tool_id("factory_cli"), Some("droid"));
        assert_eq!(normalize_ai_tool_id("mistral_vibe"), Some("vibe"));
        assert_eq!(normalize_ai_tool_id("qodercli"), Some("qoder"));
        assert_eq!(normalize_ai_tool_id("pi_coding_agent"), Some("pi"));
        assert_eq!(normalize_ai_tool_id("q_cli"), Some("amazonq"));
    }

    #[test]
    fn metadata_ids_and_commands_are_unique() {
        let mut ids = std::collections::HashSet::new();
        let mut commands = std::collections::HashSet::new();

        for tool in ai_tools() {
            assert!(ids.insert(tool.id), "duplicate tool id: {}", tool.id);
            assert!(tool.docs_url.starts_with("https://"));
            for command in tool.commands {
                assert!(
                    commands.insert(command),
                    "command {command} is assigned to more than one tool"
                );
            }
        }
    }
}
