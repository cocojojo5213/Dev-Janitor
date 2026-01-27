//! Core security scanning logic
//!
//! This module implements the actual scanning functionality using the rules
//! defined in definitions.rs

use crate::services::{get_ports_in_use, PortInfo};
use chrono::Local;
use std::env;
use std::fs;
use std::net::TcpStream;
use std::path::PathBuf;
use std::time::Duration;
use sysinfo::System;

use super::definitions::{
    AiToolSecurityRule, ConfigCheckType, RiskLevel, SecurityFinding,
    SecurityScanResult, SecuritySummary, get_rules,
};

/// Check if a port is actively listening and potentially exposed
fn check_port_binding(port: u16) -> Option<String> {
    // Try to connect to the port to see if something is listening
    let timeout = Duration::from_millis(100);

    // Check localhost first
    if let Ok(addr) = format!("127.0.0.1:{}", port).parse() {
        if TcpStream::connect_timeout(&addr, timeout).is_ok() {
            return Some("Listening on localhost".into());
        }
    }

    None
}

/// Get home directory cross-platform
fn get_home_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        env::var("USERPROFILE").ok().map(PathBuf::from)
    }
    #[cfg(not(target_os = "windows"))]
    {
        env::var("HOME").ok().map(PathBuf::from)
    }
}

/// Check exposed ports for a tool
pub fn check_exposed_ports(
    tool: &AiToolSecurityRule,
    ports_info: &[PortInfo],
) -> Vec<SecurityFinding> {
    let mut findings = Vec::new();

    for port_rule in &tool.ports {
        // Check if the port is in use
        for p in ports_info {
            if p.port == port_rule.port {
                // Port is in use - check if it's safely bound
                let is_safe = port_rule.safe_bindings.iter().any(|safe| {
                    // This is simplified - in reality we'd check the actual binding address
                    p.process_name.to_lowercase().contains("localhost")
                        || p.state.contains("127.0.0.1")
                });

                if !is_safe {
                    findings.push(SecurityFinding {
                        tool_id: tool.id.clone(),
                        tool_name: tool.name.clone(),
                        issue: format!("Port {} ({}) is exposed", port_rule.port, port_rule.name),
                        description: port_rule.description.clone(),
                        risk_level: port_rule.risk_if_exposed,
                        remediation: format!(
                            "Bind {} to localhost only (127.0.0.1) or use a firewall",
                            port_rule.name
                        ),
                        details: format!(
                            "Process: {}, State: {}, PID: {}",
                            p.process_name, p.state, p.pid
                        ),
                    });
                }
            }
        }

        // Also try direct connection check
        if let Some(status) = check_port_binding(port_rule.port) {
            // Port is listening - warn even if we couldn't determine exposure
            let already_reported = findings
                .iter()
                .any(|f| f.issue.contains(&port_rule.port.to_string()));

            if !already_reported {
                findings.push(SecurityFinding {
                    tool_id: tool.id.clone(),
                    tool_name: tool.name.clone(),
                    issue: format!(
                        "Port {} ({}) is active",
                        port_rule.port, port_rule.name
                    ),
                    description: port_rule.description.clone(),
                    risk_level: if port_rule.risk_if_exposed == RiskLevel::Critical {
                        RiskLevel::High
                    } else {
                        RiskLevel::Medium
                    },
                    remediation: format!(
                        "Verify {} is only accessible from trusted networks",
                        port_rule.name
                    ),
                    details: status,
                });
            }
        }
    }

    findings
}

/// Check config files for security issues
pub fn check_config_files(tool: &AiToolSecurityRule) -> Vec<SecurityFinding> {
    let mut findings = Vec::new();
    let home = match get_home_dir() {
        Some(h) => h,
        None => return findings,
    };

    for config_rule in &tool.configs {
        match &config_rule.check {
            ConfigCheckType::FileContains { path_pattern: _, pattern } => {
                // Search for matching config files
                for config_path in &tool.config_paths {
                    let full_path = home.join(config_path);
                    if full_path.exists() {
                        // Check files in the directory
                        if full_path.is_dir() {
                            if let Ok(entries) = fs::read_dir(&full_path) {
                                for entry in entries.flatten() {
                                    if let Ok(content) = fs::read_to_string(entry.path()) {
                                        // Simple pattern check
                                        let patterns: Vec<&str> = pattern.split('|').collect();
                                        for p in patterns {
                                            if content.contains(p) {
                                                findings.push(SecurityFinding {
                                                    tool_id: tool.id.clone(),
                                                    tool_name: tool.name.clone(),
                                                    issue: config_rule.name.clone(),
                                                    description: config_rule.description.clone(),
                                                    risk_level: config_rule.risk_level,
                                                    remediation: config_rule.remediation.clone(),
                                                    details: format!("Found in: {}", entry.path().display()),
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        } else if let Ok(content) = fs::read_to_string(&full_path) {
                            let patterns: Vec<&str> = pattern.split('|').collect();
                            for p in patterns {
                                if content.contains(p) {
                                    findings.push(SecurityFinding {
                                        tool_id: tool.id.clone(),
                                        tool_name: tool.name.clone(),
                                        issue: config_rule.name.clone(),
                                        description: config_rule.description.clone(),
                                        risk_level: config_rule.risk_level,
                                        remediation: config_rule.remediation.clone(),
                                        details: format!("Found in: {}", full_path.display()),
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            ConfigCheckType::FileExists { path_pattern: _ } => {
                for config_path in &tool.config_paths {
                    let full_path = home.join(config_path);
                    if full_path.exists() {
                        findings.push(SecurityFinding {
                            tool_id: tool.id.clone(),
                            tool_name: tool.name.clone(),
                            issue: config_rule.name.clone(),
                            description: config_rule.description.clone(),
                            risk_level: config_rule.risk_level,
                            remediation: config_rule.remediation.clone(),
                            details: format!("File exists: {}", full_path.display()),
                        });
                    }
                }
            }
            ConfigCheckType::FileMissing { path_pattern: _, pattern } => {
                // Check if required security config is missing
                for config_path in &tool.config_paths {
                    let full_path = home.join(config_path);
                    if full_path.exists() && full_path.is_dir() {
                        if let Ok(entries) = fs::read_dir(&full_path) {
                            for entry in entries.flatten() {
                                if let Ok(content) = fs::read_to_string(entry.path()) {
                                    if !content.contains(pattern) {
                                        findings.push(SecurityFinding {
                                            tool_id: tool.id.clone(),
                                            tool_name: tool.name.clone(),
                                            issue: config_rule.name.clone(),
                                            description: config_rule.description.clone(),
                                            risk_level: config_rule.risk_level,
                                            remediation: config_rule.remediation.clone(),
                                            details: format!(
                                                "Missing '{}' in: {}",
                                                pattern,
                                                entry.path().display()
                                            ),
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            ConfigCheckType::EnvVar { name, insecure_value } => {
                if let Ok(value) = env::var(name) {
                    if let Some(insecure) = insecure_value {
                        if value == *insecure {
                            findings.push(SecurityFinding {
                                tool_id: tool.id.clone(),
                                tool_name: tool.name.clone(),
                                issue: config_rule.name.clone(),
                                description: config_rule.description.clone(),
                                risk_level: config_rule.risk_level,
                                remediation: config_rule.remediation.clone(),
                                details: format!("Env var {} has insecure value", name),
                            });
                        }
                    }
                }
            }
        }
    }

    findings
}

/// Check if a tool's process is running
#[allow(dead_code)]
fn is_tool_running(tool: &AiToolSecurityRule) -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    for process in sys.processes().values() {
        let name = process.name().to_string_lossy().to_lowercase();
        for pattern in &tool.process_names {
            if name.contains(pattern) {
                return true;
            }
        }
    }
    false
}

/// Get all security findings
pub fn get_security_findings() -> Vec<SecurityFinding> {
    let ports_info = get_ports_in_use();
    let rules = get_rules();
    let mut all_findings = Vec::new();

    for tool in rules.iter() {
        // Check ports
        let port_findings = check_exposed_ports(tool, &ports_info);
        all_findings.extend(port_findings);

        // Check configs
        let config_findings = check_config_files(tool);
        all_findings.extend(config_findings);
    }

    // Sort by risk level (Critical first)
    all_findings.sort_by(|a, b| {
        let risk_order = |r: &RiskLevel| match r {
            RiskLevel::Critical => 0,
            RiskLevel::High => 1,
            RiskLevel::Medium => 2,
            RiskLevel::Low => 3,
        };
        risk_order(&a.risk_level).cmp(&risk_order(&b.risk_level))
    });

    all_findings
}

/// Perform a complete security scan
pub fn scan_ai_tool_security() -> SecurityScanResult {
    let findings = get_security_findings();
    let rules = get_rules();

    let summary = SecuritySummary {
        total_findings: findings.len(),
        critical: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Critical)
            .count(),
        high: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::High)
            .count(),
        medium: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Medium)
            .count(),
        low: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Low)
            .count(),
    };

    let tools_scanned: Vec<String> = rules
        .iter()
        .map(|t| t.name.clone())
        .collect();

    SecurityScanResult {
        scan_time: Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        tools_scanned,
        findings,
        summary,
    }
}

/// Scan a specific tool only
pub fn scan_specific_tool(tool_id: &str) -> Option<SecurityScanResult> {
    let rules = get_rules();
    let tool = rules
        .iter()
        .find(|t| t.id == tool_id)?;

    let ports_info = get_ports_in_use();
    let mut findings = Vec::new();

    findings.extend(check_exposed_ports(tool, &ports_info));
    findings.extend(check_config_files(tool));

    let summary = SecuritySummary {
        total_findings: findings.len(),
        critical: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Critical)
            .count(),
        high: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::High)
            .count(),
        medium: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Medium)
            .count(),
        low: findings
            .iter()
            .filter(|f| f.risk_level == RiskLevel::Low)
            .count(),
    };

    Some(SecurityScanResult {
        scan_time: Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        tools_scanned: vec![tool.name.clone()],
        findings,
        summary,
    })
}

/// Get list of all supported tools
#[allow(dead_code)]
pub fn get_supported_tools() -> Vec<(String, String, String)> {
    get_rules()
        .iter()
        .map(|t| (t.id.clone(), t.name.clone(), t.description.clone()))
        .collect()
}
