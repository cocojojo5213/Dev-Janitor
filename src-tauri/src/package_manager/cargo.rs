//! Cargo package manager support

use super::{PackageInfo, PackageManager};
use regex::Regex;

use crate::utils::command::command_no_window;

pub struct CargoManager {
    version: String,
}

impl CargoManager {
    pub fn new() -> Option<Self> {
        let output = run_cargo_command(&["--version"])?;
        // Extract version from "cargo X.Y.Z (hash date)"
        let version = output
            .split_whitespace()
            .nth(1)
            .unwrap_or("unknown")
            .to_string();
        Some(Self { version })
    }
}

impl PackageManager for CargoManager {
    fn name(&self) -> &str {
        "cargo"
    }

    fn is_available(&self) -> bool {
        true
    }

    fn get_version(&self) -> Option<String> {
        Some(self.version.clone())
    }

    fn list_packages(&self) -> Vec<PackageInfo> {
        let mut packages = Vec::new();

        // Get installed packages via cargo install --list
        let output = match run_cargo_command(&["install", "--list"]) {
            Some(o) => o,
            None => return packages,
        };

        // Parse output format:
        // package_name v1.2.3:
        //     binary1
        //     binary2
        let re = Regex::new(r"^(\S+)\s+v(\d+\.\d+\.\d+)").unwrap();

        for line in output.lines() {
            if let Some(caps) = re.captures(line) {
                let name = caps.get(1).map(|m| m.as_str()).unwrap_or("").to_string();
                let version = caps.get(2).map(|m| m.as_str()).unwrap_or("").to_string();

                if !name.is_empty() {
                    packages.push(PackageInfo {
                        name,
                        version,
                        latest: None, // Cargo doesn't easily provide latest version
                        manager: "cargo".to_string(),
                        is_outdated: false,
                        description: None,
                    });
                }
            }
        }

        packages
    }

    fn update_package(&self, name: &str) -> Result<String, String> {
        match run_cargo_command(&["install", name, "--force"]) {
            Some(output) => Ok(format!("Updated {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to update {}", name)),
        }
    }

    fn uninstall_package(&self, name: &str) -> Result<String, String> {
        match run_cargo_command(&["uninstall", name]) {
            Some(output) => Ok(format!("Uninstalled {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to uninstall {}", name)),
        }
    }
}

fn run_cargo_command(args: &[&str]) -> Option<String> {
    // On Windows, run via cmd /C for consistency
    #[cfg(target_os = "windows")]
    let output = {
        let cargo_args = std::iter::once("cargo")
            .chain(args.iter().copied())
            .collect::<Vec<_>>()
            .join(" ");
        command_no_window("cmd")
            .args(["/C", &cargo_args])
            .output()
            .ok()?
    };

    #[cfg(not(target_os = "windows"))]
    let output = command_no_window("cargo").args(args).output().ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    // Cargo often outputs to stderr
    if output.status.success() || !stderr.is_empty() {
        Some(format!("{}{}", stdout, stderr))
    } else {
        None
    }
}
