//! Tauri commands for AI tool security scanning

use crate::security_scan::{
    scan_ai_tool_security, scan_specific_tool, get_rules, SecurityScanResult,
};

/// Perform a full security scan of all AI tools
#[tauri::command]
pub fn scan_security_cmd() -> SecurityScanResult {
    scan_ai_tool_security()
}

/// Get list of supported tools for scanning  
#[tauri::command]
pub fn get_security_tools_cmd() -> Vec<SecurityToolInfo> {
    get_rules()
        .iter()
        .map(|t| SecurityToolInfo {
            id: t.id.clone(),
            name: t.name.clone(),
            description: t.description.clone(),
            docs_url: t.docs_url.clone(),
            port_count: t.ports.len(),
            config_check_count: t.configs.len(),
        })
        .collect()
}

/// Scan a specific tool only
#[tauri::command]
pub fn scan_tool_security_cmd(tool_id: String) -> Option<SecurityScanResult> {
    scan_specific_tool(&tool_id)
}

/// Tool info for frontend display
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SecurityToolInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub docs_url: String,
    pub port_count: usize,
    pub config_check_count: usize,
}
