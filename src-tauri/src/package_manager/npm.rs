//! npm package manager support

use super::{PackageInfo, PackageManager};
use serde::Deserialize;

use crate::utils::command::command_no_window;

pub struct NpmManager {
    version: String,
}

#[derive(Deserialize)]
struct NpmListOutput {
    dependencies: Option<std::collections::HashMap<String, NpmPackage>>,
}

#[derive(Deserialize)]
struct NpmPackage {
    version: String,
}

#[derive(Deserialize)]
struct NpmOutdatedPackage {
    current: String,
    latest: String,
}

impl NpmManager {
    pub fn new() -> Option<Self> {
        let output = run_npm_command(&["--version"])?;
        let version = output.trim().to_string();
        Some(Self { version })
    }
}

impl PackageManager for NpmManager {
    fn name(&self) -> &str {
        "npm"
    }

    fn is_available(&self) -> bool {
        true
    }

    fn get_version(&self) -> Option<String> {
        Some(self.version.clone())
    }

    fn list_packages(&self) -> Vec<PackageInfo> {
        let mut packages = Vec::new();

        // Get global packages
        let output = match run_npm_command(&["list", "-g", "--depth=0", "--json"]) {
            Some(o) => o,
            None => return packages,
        };

        let list: NpmListOutput = match serde_json::from_str(&output) {
            Ok(l) => l,
            Err(_) => return packages,
        };

        // Skip outdated check for now - it requires network and is slow
        // TODO: Move to async background task
        // let outdated_output = run_npm_command(&["outdated", "-g", "--json"]).unwrap_or_default();
        let outdated: std::collections::HashMap<String, NpmOutdatedPackage> =
            std::collections::HashMap::new();

        if let Some(deps) = list.dependencies {
            for (name, pkg) in deps {
                // Skip npm itself
                if name == "npm" {
                    continue;
                }

                let (is_outdated, latest) = if let Some(out) = outdated.get(&name) {
                    (true, Some(out.latest.clone()))
                } else {
                    (false, None)
                };

                packages.push(PackageInfo {
                    name,
                    version: pkg.version,
                    latest,
                    manager: "npm".to_string(),
                    is_outdated,
                    description: None,
                });
            }
        }

        packages
    }

    fn update_package(&self, name: &str) -> Result<String, String> {
        match run_npm_command(&["update", "-g", name]) {
            Some(output) => Ok(format!("Updated {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to update {}", name)),
        }
    }

    fn uninstall_package(&self, name: &str) -> Result<String, String> {
        match run_npm_command(&["uninstall", "-g", name, "--force"]) {
            Some(output) => Ok(format!("Uninstalled {} successfully:\n{}", name, output)),
            None => Err(format!("Failed to uninstall {}", name)),
        }
    }
}

fn run_npm_command(args: &[&str]) -> Option<String> {
    // On Windows, npm is a .cmd file, so we need to run it via cmd /C
    #[cfg(target_os = "windows")]
    let output = {
        let npm_args = std::iter::once("npm")
            .chain(args.iter().copied())
            .collect::<Vec<_>>()
            .join(" ");
        command_no_window("cmd")
            .args(["/C", &npm_args])
            .output()
            .ok()?
    };

    #[cfg(not(target_os = "windows"))]
    let output = command_no_window("npm").args(args).output().ok()?;

    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        // For npm outdated, non-zero exit is normal when packages are outdated
        if args.contains(&"outdated") {
            Some(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            None
        }
    }
}
