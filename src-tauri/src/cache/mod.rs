//! Cache scanning and cleaning module for Dev Janitor v2
//! Supports 11+ package manager caches and project caches

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

/// Represents a cache entry that can be cleaned
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub size_display: String,
    pub cache_type: String, // "package_manager" or "project"
}

/// Format bytes to human readable string
pub fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Calculate directory size recursively
pub fn get_dir_size(path: &PathBuf) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}

/// Get package manager cache paths
fn get_package_manager_caches() -> Vec<(&'static str, &'static str, Vec<PathBuf>)> {
    use std::env;

    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_default();
    let local_app_data = env::var("LOCALAPPDATA").unwrap_or_default();
    let app_data = env::var("APPDATA").unwrap_or_default();

    vec![
        // npm
        (
            "npm",
            "npm Cache",
            vec![
                PathBuf::from(format!("{}/.npm", home)),
                PathBuf::from(format!("{}/npm-cache", local_app_data)),
            ],
        ),
        // yarn
        (
            "yarn",
            "Yarn Cache",
            vec![
                PathBuf::from(format!("{}/.yarn/cache", home)),
                PathBuf::from(format!("{}/Yarn/Cache", local_app_data)),
            ],
        ),
        // pnpm
        (
            "pnpm",
            "pnpm Cache",
            vec![
                PathBuf::from(format!("{}/.pnpm-store", home)),
                PathBuf::from(format!("{}/pnpm/store", local_app_data)),
            ],
        ),
        // pip
        (
            "pip",
            "pip Cache",
            vec![
                PathBuf::from(format!("{}/.cache/pip", home)),
                PathBuf::from(format!("{}/pip/Cache", local_app_data)),
            ],
        ),
        // conda
        (
            "conda",
            "Conda Cache",
            vec![
                PathBuf::from(format!("{}/.conda/pkgs", home)),
                PathBuf::from(format!("{}/conda/conda/pkgs", app_data)),
            ],
        ),
        // cargo
        (
            "cargo",
            "Cargo Cache",
            vec![PathBuf::from(format!("{}/.cargo/registry/cache", home))],
        ),
        // composer
        (
            "composer",
            "Composer Cache",
            vec![
                PathBuf::from(format!("{}/.composer/cache", home)),
                PathBuf::from(format!("{}/Composer/cache", local_app_data)),
            ],
        ),
        // maven
        (
            "maven",
            "Maven Cache",
            vec![PathBuf::from(format!("{}/.m2/repository", home))],
        ),
        // gradle
        (
            "gradle",
            "Gradle Cache",
            vec![PathBuf::from(format!("{}/.gradle/caches", home))],
        ),
        // homebrew (macOS)
        (
            "homebrew",
            "Homebrew Cache",
            vec![PathBuf::from(format!("{}/Library/Caches/Homebrew", home))],
        ),
        // go modules
        (
            "go",
            "Go Modules Cache",
            vec![PathBuf::from(format!("{}/go/pkg/mod/cache", home))],
        ),
    ]
}

/// Scan all package manager caches
pub fn scan_package_manager_caches() -> Vec<CacheInfo> {
    let caches_config = get_package_manager_caches();

    caches_config
        .par_iter()
        .filter_map(|(id, name, paths)| {
            // Find first existing path
            for path in paths {
                if path.exists() {
                    let size = get_dir_size(path);
                    if size > 0 {
                        return Some(CacheInfo {
                            id: id.to_string(),
                            name: name.to_string(),
                            path: path.to_string_lossy().to_string(),
                            size,
                            size_display: format_size(size),
                            cache_type: "package_manager".to_string(),
                        });
                    }
                }
            }
            None
        })
        .collect()
}

/// Project cache patterns to look for
const PROJECT_CACHE_PATTERNS: &[(&str, &str)] = &[
    ("node_modules", "Node Modules"),
    ("target", "Rust Target"),
    ("__pycache__", "Python Cache"),
    (".gradle", "Gradle Build"),
    ("build", "Build Output"),
    ("dist", "Dist Output"),
    (".next", "Next.js Cache"),
    (".nuxt", "Nuxt.js Cache"),
    (".turbo", "Turbo Cache"),
    ("venv", "Python Venv"),
    (".venv", "Python Venv"),
    ("vendor", "Vendor Directory"),
];

/// Scan a directory for project caches
pub fn scan_project_caches(root_path: &str, max_depth: usize) -> Vec<CacheInfo> {
    let root = PathBuf::from(root_path);
    if !root.exists() {
        return Vec::new();
    }

    let mut caches = Vec::new();

    for entry in WalkDir::new(&root)
        .max_depth(max_depth)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_dir() {
            let dir_name = entry.file_name().to_string_lossy();

            for (pattern, name) in PROJECT_CACHE_PATTERNS {
                if dir_name == *pattern {
                    let path = entry.path().to_path_buf();
                    let size = get_dir_size(&path);

                    if size > 1024 * 1024 {
                        // Only include if > 1MB
                        caches.push(CacheInfo {
                            id: format!("{}_{}", pattern, caches.len()),
                            name: name.to_string(),
                            path: path.to_string_lossy().to_string(),
                            size,
                            size_display: format_size(size),
                            cache_type: "project".to_string(),
                        });
                    }
                }
            }
        }
    }

    // Sort by size descending
    caches.sort_by(|a, b| b.size.cmp(&a.size));
    caches
}

/// Clean a cache directory
pub fn clean_cache(path: &str) -> Result<String, String> {
    let cache_path = PathBuf::from(path);

    if !cache_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    // Get size before deletion
    let size_before = get_dir_size(&cache_path);

    // Try to remove the directory
    match fs::remove_dir_all(&cache_path) {
        Ok(_) => Ok(format!(
            "Successfully cleaned {} (freed {})",
            path,
            format_size(size_before)
        )),
        Err(e) => {
            // Try with more aggressive approach on Windows
            #[cfg(target_os = "windows")]
            {
                // Try to remove readonly attributes first
                if remove_readonly_and_delete(&cache_path).is_err() {
                    return Err(format!("Failed to clean {}: {}", path, e));
                }
                Ok(format!(
                    "Successfully cleaned {} (freed {})",
                    path,
                    format_size(size_before)
                ))
            }

            #[cfg(not(target_os = "windows"))]
            Err(format!("Failed to clean {}: {}", path, e))
        }
    }
}

#[cfg(target_os = "windows")]
fn remove_readonly_and_delete(path: &PathBuf) -> std::io::Result<()> {
    use std::os::windows::fs::MetadataExt;

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if let Ok(metadata) = fs::metadata(entry_path) {
            // Check if file is readonly (FILE_ATTRIBUTE_READONLY = 1)
            if metadata.file_attributes() & 1 != 0 {
                let mut perms = metadata.permissions();
                perms.set_readonly(false);
                let _ = fs::set_permissions(entry_path, perms);
            }
        }
    }

    fs::remove_dir_all(path)
}
