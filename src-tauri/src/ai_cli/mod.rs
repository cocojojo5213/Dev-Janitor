//! AI CLI Tools management module for Dev Janitor v2
//! Manage AI coding assistant CLI tools

use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;

use crate::utils::command::command_no_window;

/// Represents an AI CLI tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiCliTool {
    pub id: String,
    pub name: String,
    pub description: String,
    pub installed: bool,
    pub version: Option<String>,
    pub install_command: String,
    pub update_command: String,
    pub uninstall_command: String,
    pub docs_url: String,
    pub config_paths: Vec<AiConfigFile>,
}

/// Represents a config file for an AI CLI tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfigFile {
    pub name: String,
    pub path: String,
    pub exists: bool,
}

/// Get all supported AI CLI tools with their status
pub fn get_ai_cli_tools() -> Vec<AiCliTool> {
    vec![
        check_tool(AiCliTool {
            id: "claude".to_string(),
            name: "Claude Code".to_string(),
            description: "Anthropic's Claude AI coding assistant".to_string(),
            installed: false,
            version: None,
            install_command: "npm install -g @anthropic-ai/claude-code".to_string(),
            update_command: "npm update -g @anthropic-ai/claude-code".to_string(),
            uninstall_command: "npm uninstall -g @anthropic-ai/claude-code".to_string(),
            docs_url: "https://docs.anthropic.com/claude-code".to_string(),
            config_paths: find_config_files("claude"),
        }),
        check_tool(AiCliTool {
            id: "codex".to_string(),
            name: "OpenAI Codex CLI".to_string(),
            description: "OpenAI's Codex coding assistant".to_string(),
            installed: false,
            version: None,
            install_command: "npm install -g @openai/codex".to_string(),
            update_command: "npm update -g @openai/codex".to_string(),
            uninstall_command: "npm uninstall -g @openai/codex".to_string(),
            docs_url: "https://github.com/openai/codex".to_string(),
            config_paths: find_config_files("codex"),
        }),
        check_tool(AiCliTool {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            description: "Google's Gemini AI coding assistant".to_string(),
            installed: false,
            version: None,
            install_command: "npm install -g @google/gemini-cli".to_string(),
            update_command: "npm update -g @google/gemini-cli".to_string(),
            uninstall_command: "npm uninstall -g @google/gemini-cli".to_string(),
            docs_url: "https://ai.google.dev/gemini-api/docs".to_string(),
            config_paths: find_config_files("gemini"),
        }),
        check_tool(AiCliTool {
            id: "aider".to_string(),
            name: "Aider".to_string(),
            description: "AI pair programming in your terminal".to_string(),
            installed: false,
            version: None,
            install_command: "pipx install aider-chat".to_string(),
            update_command: "pipx upgrade aider-chat".to_string(),
            uninstall_command: "pipx uninstall aider-chat".to_string(),
            docs_url: "https://aider.chat".to_string(),
            config_paths: find_config_files("aider"),
        }),
        check_tool(AiCliTool {
            id: "continue".to_string(),
            name: "Continue".to_string(),
            description: "Open-source AI code assistant".to_string(),
            installed: false,
            version: None,
            install_command: "npm install -g continue".to_string(),
            update_command: "npm update -g continue".to_string(),
            uninstall_command: "npm uninstall -g continue".to_string(),
            docs_url: "https://continue.dev".to_string(),
            config_paths: find_config_files("continue"),
        }),
        check_tool(AiCliTool {
            id: "cody".to_string(),
            name: "Sourcegraph Cody".to_string(),
            description: "Sourcegraph's AI coding assistant".to_string(),
            installed: false,
            version: None,
            install_command: "npm install -g @sourcegraph/cody".to_string(),
            update_command: "npm update -g @sourcegraph/cody".to_string(),
            uninstall_command: "npm uninstall -g @sourcegraph/cody".to_string(),
            docs_url: "https://sourcegraph.com/cody".to_string(),
            config_paths: find_config_files("cody"),
        }),
        check_tool(AiCliTool {
            id: "cursor".to_string(),
            name: "Cursor CLI".to_string(),
            description: "Cursor AI editor command line interface".to_string(),
            installed: false,
            version: None,
            install_command: "Download from https://cursor.sh".to_string(),
            update_command: "cursor --update".to_string(),
            uninstall_command: "Manual uninstall required".to_string(),
            docs_url: "https://cursor.sh".to_string(),
            config_paths: find_config_files("cursor"),
        }),
    ]
}

/// Find config files for an AI CLI tool
fn find_config_files(tool_id: &str) -> Vec<AiConfigFile> {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_default();
    let app_data = env::var("APPDATA").unwrap_or_default();
    let local_app_data = env::var("LOCALAPPDATA").unwrap_or_default();

    let config_patterns: Vec<(&str, &str)> = match tool_id {
        "claude" => vec![
            (".claude.json", "Claude Config"),
            (".claude", "Claude Directory"),
            ("claude/config.json", "Claude Settings"),
        ],
        "codex" => vec![
            (".codex/config.json", "Codex Config"),
            (".codexrc", "Codex RC"),
        ],
        "gemini" => vec![
            (".gemini/config.json", "Gemini Config"),
            (".geminirc", "Gemini RC"),
        ],
        "aider" => vec![
            (".aider.conf.yml", "Aider Config"),
            (".aider.model.settings.yml", "Aider Model Settings"),
            (".aider.model.metadata.json", "Aider Model Metadata"),
        ],
        "continue" => vec![
            (".continue/config.json", "Continue Config"),
            (".continue/config.yaml", "Continue Config YAML"),
        ],
        "cody" => vec![
            (".sourcegraph/cody.json", "Cody Config"),
            ("sourcegraph-cody/config.json", "Cody Settings"),
        ],
        "cursor" => vec![
            (".cursor/settings.json", "Cursor Settings"),
            (".cursorignore", "Cursor Ignore"),
            (".cursorrules", "Cursor Rules"),
        ],
        _ => vec![],
    };

    let mut configs = Vec::new();

    for (pattern, name) in config_patterns {
        // Check in home directory
        let home_path = PathBuf::from(&home).join(pattern);
        if home_path.exists() || pattern.starts_with('.') {
            configs.push(AiConfigFile {
                name: name.to_string(),
                path: home_path.to_string_lossy().to_string(),
                exists: home_path.exists(),
            });
        }

        // Check in AppData (Windows)
        if !app_data.is_empty() {
            let app_path = PathBuf::from(&app_data).join(pattern);
            if app_path.exists() {
                configs.push(AiConfigFile {
                    name: format!("{} (AppData)", name),
                    path: app_path.to_string_lossy().to_string(),
                    exists: true,
                });
            }
        }

        // Check in LocalAppData (Windows)
        if !local_app_data.is_empty() {
            let local_path = PathBuf::from(&local_app_data).join(pattern);
            if local_path.exists() {
                configs.push(AiConfigFile {
                    name: format!("{} (Local)", name),
                    path: local_path.to_string_lossy().to_string(),
                    exists: true,
                });
            }
        }
    }

    configs
}

/// Check if a tool is installed and get its version
fn check_tool(mut tool: AiCliTool) -> AiCliTool {
    let (cmd, args) = match tool.id.as_str() {
        "claude" => ("claude", vec!["--version"]),
        "codex" => ("codex", vec!["--version"]),
        "gemini" => ("gemini", vec!["--version"]),
        "aider" => ("aider", vec!["--version"]),
        "continue" => ("continue", vec!["--version"]),
        "cody" => ("cody", vec!["--version"]),
        "cursor" => ("cursor", vec!["--version"]),
        _ => return tool,
    };

    if let Some(version) = run_command_get_version(cmd, &args) {
        tool.installed = true;
        tool.version = Some(version);
    }

    tool
}

/// Run a command and extract version
fn run_command_get_version(cmd: &str, args: &[&str]) -> Option<String> {
    // On Windows, .cmd files (npm scripts) need to be run through cmd /c
    #[cfg(target_os = "windows")]
    let output = {
        let full_cmd = format!("{} {}", cmd, args.join(" "));
        command_no_window("cmd")
            .args(["/C", &full_cmd])
            .output()
            .ok()?
    };

    #[cfg(not(target_os = "windows"))]
    let output = command_no_window(cmd).args(args).output().ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = format!("{}{}", stdout, stderr);

        // Extract version number
        let version = combined
            .lines()
            .next()
            .map(|l| l.trim().to_string())
            .unwrap_or_default();

        if !version.is_empty() {
            return Some(version);
        }
    }

    None
}

/// Install an AI CLI tool
pub fn install_ai_tool(tool_id: &str) -> Result<String, String> {
    let tools = get_ai_cli_tools();
    let tool = tools
        .iter()
        .find(|t| t.id == tool_id)
        .ok_or_else(|| format!("Tool not found: {}", tool_id))?;

    if tool.install_command.starts_with("Download") {
        return Err(format!(
            "{} requires manual installation. Visit: {}",
            tool.name, tool.docs_url
        ));
    }

    run_install_command(&tool.install_command)
}

/// Update an AI CLI tool
pub fn update_ai_tool(tool_id: &str) -> Result<String, String> {
    let tools = get_ai_cli_tools();
    let tool = tools
        .iter()
        .find(|t| t.id == tool_id)
        .ok_or_else(|| format!("Tool not found: {}", tool_id))?;

    run_install_command(&tool.update_command)
}

/// Uninstall an AI CLI tool
pub fn uninstall_ai_tool(tool_id: &str) -> Result<String, String> {
    let tools = get_ai_cli_tools();
    let tool = tools
        .iter()
        .find(|t| t.id == tool_id)
        .ok_or_else(|| format!("Tool not found: {}", tool_id))?;

    if tool.uninstall_command.contains("Manual") {
        return Err(format!("{} requires manual uninstallation", tool.name));
    }

    run_install_command(&tool.uninstall_command)
}

/// Run an installation command
fn run_install_command(command: &str) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let output = command_no_window("cmd").args(["/C", command]).output();

    #[cfg(not(target_os = "windows"))]
    let output = command_no_window("sh").args(["-c", command]).output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let stderr = String::from_utf8_lossy(&out.stderr);

            if out.status.success() {
                Ok(format!("Success!\n{}{}", stdout, stderr))
            } else {
                Err(format!("Command failed:\n{}{}", stdout, stderr))
            }
        }
        Err(e) => Err(format!("Failed to run command: {}", e)),
    }
}
