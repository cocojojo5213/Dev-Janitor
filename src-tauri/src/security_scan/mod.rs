//! AI Tool Security Scanner Module
//! Generic security scanning for AI coding tools with exposed ports/configs
//!
//! To add a new tool, simply add a new entry to `get_ai_tool_rules()` in definitions.rs

mod definitions;
pub mod scanner;

pub use definitions::{
    AiToolSecurityRule, ConfigCheckType, ConfigRule, PortRule, RiskLevel, SecurityFinding,
    SecurityScanResult, SecuritySummary, get_rules, get_ai_tool_rules,
};
pub use scanner::{
    check_config_files, check_exposed_ports, get_security_findings, scan_ai_tool_security,
    scan_specific_tool,
};
