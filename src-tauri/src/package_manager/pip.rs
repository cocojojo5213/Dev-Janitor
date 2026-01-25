//! pip package manager support

use super::{PackageInfo, PackageManager};
use serde::Deserialize;

use crate::utils::command::command_no_window;

pub struct PipManager {
    version: String,
    command: String, // pip or pip3
}

#[derive(Deserialize)]
struct PipPackage {
    name: String,
    version: String,
}

#[derive(Deserialize)]
struct PipOutdatedPackage {
    name: String,
    version: String,
    latest_version: String,
}

impl PipManager {
    pub fn new() -> Option<Self> {
        // Try pip3 first, then pip
        for cmd in &["pip3", "pip"] {
            if let Some(output) = run_pip_command(cmd, &["--version"]) {
                // Extract version from "pip X.Y.Z from ..."
                let version = output
                    .split_whitespace()
                    .nth(1)
                    .unwrap_or("unknown")
                    .to_string();
                return Some(Self {
                    version,
                    command: cmd.to_string(),
                });
            }
        }
        None
    }
}

impl PackageManager for PipManager {
    fn name(&self) -> &str {
        "pip"
    }

    fn is_available(&self) -> bool {
        true
    }

    fn get_version(&self) -> Option<String> {
        Some(self.version.clone())
    }

    fn list_packages(&self) -> Vec<PackageInfo> {
        let mut packages = Vec::new();

        // Get installed packages
        let output = match run_pip_command(&self.command, &["list", "--format=json"]) {
            Some(o) => o,
            None => return packages,
        };

        let list: Vec<PipPackage> = match serde_json::from_str(&output) {
            Ok(l) => l,
            Err(_) => return packages,
        };

        // Skip outdated check for now - it requires network and is very slow
        // TODO: Move to async background task
        // let outdated_output =
        //     run_pip_command(&self.command, &["list", "--outdated", "--format=json"])
        //         .unwrap_or_default();
        // let outdated: Vec<PipOutdatedPackage> =
        //     serde_json::from_str(&outdated_output).unwrap_or_default();

        let outdated_map: std::collections::HashMap<String, String> =
            std::collections::HashMap::new();

        for pkg in list {
            // Skip common system packages
            if pkg.name == "pip" || pkg.name == "setuptools" || pkg.name == "wheel" {
                continue;
            }

            let name_lower = pkg.name.to_lowercase();
            let (is_outdated, latest) = if let Some(latest) = outdated_map.get(&name_lower) {
                (true, Some(latest.clone()))
            } else {
                (false, None)
            };

            packages.push(PackageInfo {
                name: pkg.name,
                version: pkg.version,
                latest,
                manager: "pip".to_string(),
                is_outdated,
                description: None,
            });
        }

        packages
    }

    fn update_package(&self, name: &str) -> Result<String, String> {
        match run_pip_command(&self.command, &["install", "--upgrade", name]) {
            Some(output) => Ok(format!("Updated {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to update {}", name)),
        }
    }

    fn uninstall_package(&self, name: &str) -> Result<String, String> {
        match run_pip_command(&self.command, &["uninstall", "-y", name]) {
            Some(output) => Ok(format!("Uninstalled {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to uninstall {}", name)),
        }
    }
}

fn run_pip_command(pip_cmd: &str, args: &[&str]) -> Option<String> {
    // On Windows, pip may need to run via cmd /C
    #[cfg(target_os = "windows")]
    let output = {
        let pip_args = std::iter::once(pip_cmd)
            .chain(args.iter().copied())
            .collect::<Vec<_>>()
            .join(" ");
        command_no_window("cmd")
            .args(["/C", &pip_args])
            .output()
            .ok()?
    };

    #[cfg(not(target_os = "windows"))]
    let output = command_no_window(pip_cmd).args(args).output().ok()?;

    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        None
    }
}
