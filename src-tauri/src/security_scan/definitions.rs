//! Security rule definitions for AI coding tools
//!
//! This file contains all the security rules that define what to check for each AI tool.
//! To add support for a new tool, simply add a new entry to `get_ai_tool_rules()`.

use serde::{Deserialize, Serialize};

/// Risk level classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RiskLevel {
    Critical,  // Immediate action required - exposed API keys, RCE risk
    High,      // Serious issue - exposed admin interface, auth bypass
    Medium,    // Should fix - insecure default config
    Low,       // Informational - best practice recommendation
}

impl RiskLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            RiskLevel::Critical => "Critical",
            RiskLevel::High => "High",
            RiskLevel::Medium => "Medium",
            RiskLevel::Low => "Low",
        }
    }

    pub fn emoji(&self) -> &'static str {
        match self {
            RiskLevel::Critical => "🔴",
            RiskLevel::High => "🟠",
            RiskLevel::Medium => "🟡",
            RiskLevel::Low => "🔵",
        }
    }
}

/// Type of configuration check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigCheckType {
    /// Check if file exists (presence = bad)
    FileExists { path_pattern: String },
    /// Check if file contains a pattern
    FileContains { path_pattern: String, pattern: String },
    /// Check if file does NOT contain expected secure pattern
    FileMissing { path_pattern: String, pattern: String },
    /// Check environment variable
    EnvVar { name: String, insecure_value: Option<String> },
}

/// Port exposure rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortRule {
    pub port: u16,
    pub name: String,
    pub description: String,
    pub risk_if_exposed: RiskLevel,
    /// Acceptable if bound to these addresses only
    pub safe_bindings: Vec<String>,
}

/// Configuration vulnerability rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigRule {
    pub name: String,
    pub description: String,
    pub check: ConfigCheckType,
    pub risk_level: RiskLevel,
    pub remediation: String,
}

/// Security rule definition for an AI tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiToolSecurityRule {
    /// Tool identifier (e.g., "clawdbot", "opencode", "aider")
    pub id: String,
    /// Display name
    pub name: String,
    /// Tool description
    pub description: String,
    /// Official website/docs
    pub docs_url: String,
    /// Process names to detect (lowercase)
    pub process_names: Vec<String>,
    /// Ports to check
    pub ports: Vec<PortRule>,
    /// Config files/patterns to check
    pub configs: Vec<ConfigRule>,
    /// Common config file locations (relative to home or absolute)
    pub config_paths: Vec<String>,
}

/// A security finding from the scan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityFinding {
    pub tool_id: String,
    pub tool_name: String,
    pub issue: String,
    pub description: String,
    pub risk_level: RiskLevel,
    pub remediation: String,
    pub details: String, // e.g., "Port 18789 bound to 0.0.0.0"
}

/// Result of a security scan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScanResult {
    pub scan_time: String,
    pub tools_scanned: Vec<String>,
    pub findings: Vec<SecurityFinding>,
    pub summary: SecuritySummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySummary {
    pub total_findings: usize,
    pub critical: usize,
    pub high: usize,
    pub medium: usize,
    pub low: usize,
}

/// ========================================
/// AI TOOL SECURITY RULES - ADD NEW TOOLS HERE
/// ========================================
///
/// To add a new AI tool, add a new `AiToolSecurityRule` to this function.
/// The scanner will automatically include it in scans.

pub fn get_ai_tool_rules() -> Vec<AiToolSecurityRule> {
    vec![
        // =====================================
        // Clawdbot - AI Agent Gateway (Jan 2026 vulnerability)
        // =====================================
        AiToolSecurityRule {
            id: "clawdbot".into(),
            name: "Clawdbot".into(),
            description: "Open-source AI agent gateway with MCP support".into(),
            docs_url: "https://github.com/clawdbot/clawdbot".into(),
            process_names: vec!["clawdbot".into(), "clawdbot-server".into(), "clawdbot-gateway".into()],
            ports: vec![
                PortRule {
                    port: 18789,
                    name: "Clawdbot Gateway".into(),
                    description: "Primary gateway port - should NOT be exposed to internet".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into(), "::1".into()],
                },
                PortRule {
                    port: 18790,
                    name: "Clawdbot Control UI".into(),
                    description: "Admin web interface - exposes API keys and chat history".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into(), "::1".into()],
                },
            ],
            configs: vec![
                ConfigRule {
                    name: "Exposed trustedProxies".into(),
                    description: "trustedProxies may allow localhost auth bypass via reverse proxy".into(),
                    check: ConfigCheckType::FileMissing {
                        path_pattern: "**/clawdbot.config.*".into(),
                        pattern: "trustedProxies".into(),
                    },
                    risk_level: RiskLevel::High,
                    remediation: "Set gateway.trustedProxies to only trusted reverse proxy IPs".into(),
                },
                ConfigRule {
                    name: "API Keys in Config".into(),
                    description: "Anthropic/OpenAI API keys stored in plaintext config".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/clawdbot.config.*".into(),
                        pattern: "sk-ant-|sk-".into(),
                    },
                    risk_level: RiskLevel::High,
                    remediation: "Use environment variables for API keys instead of config files".into(),
                },
            ],
            config_paths: vec![
                ".clawdbot/".into(),
                ".config/clawdbot/".into(),
            ],
        },
        
        // =====================================
        // OpenCode - Terminal AI coding assistant
        // CVE-2026-22812: Unauthenticated HTTP server with wildcard CORS
        // =====================================
        AiToolSecurityRule {
            id: "opencode".into(),
            name: "OpenCode".into(),
            description: "Terminal-based AI coding assistant (CVE-2026-22812)".into(),
            docs_url: "https://github.com/opencode-ai/opencode".into(),
            process_names: vec!["opencode".into()],
            ports: vec![
                PortRule {
                    port: 4096,
                    name: "OpenCode HTTP Server".into(),
                    description: "CVE-2026-22812: Unauthenticated HTTP server with CORS * - allows RCE from any website".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
                PortRule {
                    port: 4097,
                    name: "OpenCode HTTP Server (alt)".into(),
                    description: "CVE-2026-22812: Alternative port when 4096 is in use".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
                PortRule {
                    port: 8765,
                    name: "OpenCode Debug Server".into(),
                    description: "Debug/MCP server - should be localhost only".into(),
                    risk_if_exposed: RiskLevel::High,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into()],
                },
            ],
            configs: vec![
                ConfigRule {
                    name: "API Keys in Config".into(),
                    description: "API keys stored in opencode config".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/opencode.json".into(),
                        pattern: "sk-".into(),
                    },
                    risk_level: RiskLevel::High,
                    remediation: "Use environment variables for API keys. Update to OpenCode >= 1.0.216 to fix CVE-2026-22812".into(),
                },
            ],
            config_paths: vec![
                ".opencode/".into(),
                ".config/opencode/".into(),
            ],
        },
        
        // =====================================
        // Aider - AI pair programming
        // =====================================
        AiToolSecurityRule {
            id: "aider".into(),
            name: "Aider".into(),
            description: "AI pair programming in your terminal".into(),
            docs_url: "https://aider.chat".into(),
            process_names: vec!["aider".into()],
            ports: vec![
                PortRule {
                    port: 8501,
                    name: "Aider Web UI".into(),
                    description: "Aider browser interface".into(),
                    risk_if_exposed: RiskLevel::Medium,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into()],
                },
            ],
            configs: vec![
                ConfigRule {
                    name: "API Keys in .aider.conf".into(),
                    description: "API keys in aider config file".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/.aider.conf*".into(),
                        pattern: "api_key".into(),
                    },
                    risk_level: RiskLevel::Medium,
                    remediation: "Use OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables".into(),
                },
            ],
            config_paths: vec![
                ".aider.conf.yml".into(),
                ".aider/".into(),
            ],
        },
        
        // =====================================
        // Claude Code (claude-code) - Anthropic official CLI
        // =====================================
        AiToolSecurityRule {
            id: "claude-code".into(),
            name: "Claude Code".into(),
            description: "Anthropic's official AI coding CLI".into(),
            docs_url: "https://docs.anthropic.com/claude-code".into(),
            process_names: vec!["claude".into(), "claude-code".into()],
            ports: vec![
                PortRule {
                    port: 9222,
                    name: "Claude Code Debug Port".into(),
                    description: "Chrome DevTools debug protocol port".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
            ],
            configs: vec![],
            config_paths: vec![
                ".claude/".into(),
            ],
        },
        
        // =====================================
        // Codex CLI - OpenAI
        // =====================================
        AiToolSecurityRule {
            id: "codex-cli".into(),
            name: "Codex CLI".into(),
            description: "OpenAI's Codex command-line tool".into(),
            docs_url: "https://github.com/openai/codex-cli".into(),
            process_names: vec!["codex".into()],
            ports: vec![],
            configs: vec![
                ConfigRule {
                    name: "OpenAI API Key in config".into(),
                    description: "API key stored in codex config".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/codex/config.*".into(),
                        pattern: "sk-".into(),
                    },
                    risk_level: RiskLevel::Medium,
                    remediation: "Use OPENAI_API_KEY environment variable".into(),
                },
            ],
            config_paths: vec![
                ".codex/".into(),
                ".config/codex/".into(),
            ],
        },
        
        // =====================================
        // Continue.dev - VS Code AI extension with local server
        // =====================================
        AiToolSecurityRule {
            id: "continue".into(),
            name: "Continue".into(),
            description: "Open-source AI code assistant (VS Code extension)".into(),
            docs_url: "https://continue.dev".into(),
            process_names: vec!["continue".into()],
            ports: vec![
                PortRule {
                    port: 65432,
                    name: "Continue Local Server".into(),
                    description: "Continue's local model server".into(),
                    risk_if_exposed: RiskLevel::Medium,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into()],
                },
            ],
            configs: vec![],
            config_paths: vec![
                ".continue/".into(),
            ],
        },
        
        // =====================================
        // Cursor - AI-powered code editor
        // Supply chain attack via .vscode/tasks.json (Jan 2026)
        // =====================================
        AiToolSecurityRule {
            id: "cursor".into(),
            name: "Cursor".into(),
            description: "AI-first code editor based on VS Code".into(),
            docs_url: "https://cursor.sh".into(),
            process_names: vec!["cursor".into(), "cursor-helper".into()],
            ports: vec![
                PortRule {
                    port: 9229,
                    name: "Cursor Debug Port".into(),
                    description: "Node.js inspector port - allows remote code execution if exposed".into(),
                    risk_if_exposed: RiskLevel::Critical,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
            ],
            configs: vec![
                ConfigRule {
                    name: "Workspace Trust Disabled".into(),
                    description: "Malicious .vscode/tasks.json can execute arbitrary code on project open".into(),
                    check: ConfigCheckType::FileMissing {
                        path_pattern: "**/settings.json".into(),
                        pattern: "security.workspace.trust".into(),
                    },
                    risk_level: RiskLevel::Medium,
                    remediation: "Enable Workspace Trust feature in Cursor settings. Audit .vscode/tasks.json in untrusted repos".into(),
                },
            ],
            config_paths: vec![
                ".cursor/".into(),
                ".vscode/".into(),
            ],
        },
        
        // =====================================
        // Windsurf - AI coding assistant
        // =====================================
        AiToolSecurityRule {
            id: "windsurf".into(),
            name: "Windsurf".into(),
            description: "Codeium's AI-powered IDE".into(),
            docs_url: "https://codeium.com/windsurf".into(),
            process_names: vec!["windsurf".into()],
            ports: vec![
                PortRule {
                    port: 42424,
                    name: "Windsurf Language Server".into(),
                    description: "AI language server port".into(),
                    risk_if_exposed: RiskLevel::Medium,
                    safe_bindings: vec!["127.0.0.1".into(), "localhost".into()],
                },
            ],
            configs: vec![],
            config_paths: vec![
                ".windsurf/".into(),
            ],
        },
        
        // =====================================
        // MCP Servers - Model Context Protocol
        // 66% of MCP servers have credential leakage (Jan 2026)
        // =====================================
        AiToolSecurityRule {
            id: "mcp-servers".into(),
            name: "MCP Servers".into(),
            description: "Model Context Protocol servers - 36.7% vulnerable to SSRF (2026)".into(),
            docs_url: "https://modelcontextprotocol.io".into(),
            process_names: vec!["mcp-server".into(), "mcp".into()],
            ports: vec![
                PortRule {
                    port: 3000,
                    name: "MCP Server Default".into(),
                    description: "Common MCP server port - check for auth and CORS settings".into(),
                    risk_if_exposed: RiskLevel::High,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
                PortRule {
                    port: 8080,
                    name: "MCP Server HTTP".into(),
                    description: "MCP HTTP server - verify authentication is enabled".into(),
                    risk_if_exposed: RiskLevel::High,
                    safe_bindings: vec!["127.0.0.1".into()],
                },
            ],
            configs: vec![
                ConfigRule {
                    name: "API Keys in MCP Config".into(),
                    description: "Credentials exposed via environment variables or config".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/mcp.json".into(),
                        pattern: "sk-|api_key|apiKey|API_KEY".into(),
                    },
                    risk_level: RiskLevel::Critical,
                    remediation: "Use secret management. Never store API keys in MCP config files".into(),
                },
            ],
            config_paths: vec![
                ".mcp/".into(),
                ".config/mcp/".into(),
            ],
        },
        
        // =====================================
        // Gemini CLI - Google AI
        // =====================================
        AiToolSecurityRule {
            id: "gemini-cli".into(),
            name: "Gemini CLI".into(),
            description: "Google's Gemini AI coding assistant".into(),
            docs_url: "https://cloud.google.com/vertex-ai/docs/generative-ai/gemini".into(),
            process_names: vec!["gemini".into()],
            ports: vec![],
            configs: vec![
                ConfigRule {
                    name: "API Keys in Config".into(),
                    description: "Google API keys stored in config".into(),
                    check: ConfigCheckType::FileContains {
                        path_pattern: "**/settings.json".into(),
                        pattern: "AIza".into(),
                    },
                    risk_level: RiskLevel::Medium,
                    remediation: "Use GOOGLE_API_KEY environment variable or gcloud auth".into(),
                },
            ],
            config_paths: vec![
                ".gemini/".into(),
                ".config/gemini-cli/".into(),
            ],
        },
    ]
}

/// Convenience reference for the rules
pub fn ai_tool_security_rules() -> &'static Vec<AiToolSecurityRule> {
    use std::sync::OnceLock;
    static RULES: OnceLock<Vec<AiToolSecurityRule>> = OnceLock::new();
    RULES.get_or_init(get_ai_tool_rules)
}

/// Alias for backward compatibility
pub static AI_TOOL_SECURITY_RULES: &[AiToolSecurityRule] = &[];

/// Get the actual rules (use this instead of the static)
pub fn get_rules() -> &'static Vec<AiToolSecurityRule> {
    ai_tool_security_rules()
}
