// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Allow unused code for cross-platform compatibility and future features
#![allow(dead_code)]
#![allow(unused_variables)]

mod ai_cleanup;
mod ai_cli;
mod cache;
mod chat_history;
mod commands;
mod config;
mod detection;
mod error;
mod package_manager;
mod security_scan;
mod services;
mod utils;

use commands::{
    analyze_path_cmd, clean_cache_cmd, clean_multiple_caches, delete_ai_junk_cmd,
    delete_chat_file_cmd, delete_multiple_ai_junk, delete_multiple_chat_files,
    delete_project_chat_history_cmd, diagnose_env_cmd, get_ai_cli_tools_cmd, get_all_processes_cmd,
    get_common_dev_ports_cmd, get_dev_processes_cmd, get_path_suggestions_cmd, get_ports_cmd,
    get_security_tools_cmd, get_shell_configs_cmd, get_tool_info, get_total_cache_size,
    install_ai_tool_cmd, kill_process_cmd, scan_ai_junk_cmd, scan_caches, scan_chat_history_cmd,
    scan_global_chat_history_cmd, scan_packages, scan_project_caches_cmd, scan_security_cmd,
    scan_tool_security_cmd, scan_tools, uninstall_ai_tool_cmd, uninstall_package, uninstall_tool,
    update_ai_tool_cmd, update_package,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Tool commands
            scan_tools,
            get_tool_info,
            uninstall_tool,
            // Package commands
            scan_packages,
            update_package,
            uninstall_package,
            // Cache commands
            scan_caches,
            scan_project_caches_cmd,
            clean_cache_cmd,
            clean_multiple_caches,
            get_total_cache_size,
            // AI Cleanup commands
            scan_ai_junk_cmd,
            delete_ai_junk_cmd,
            delete_multiple_ai_junk,
            // Chat History commands
            scan_chat_history_cmd,
            scan_global_chat_history_cmd,
            delete_chat_file_cmd,
            delete_project_chat_history_cmd,
            delete_multiple_chat_files,
            // Service monitoring commands
            get_dev_processes_cmd,
            get_all_processes_cmd,
            kill_process_cmd,
            get_ports_cmd,
            get_common_dev_ports_cmd,
            // Config diagnostics commands
            analyze_path_cmd,
            get_shell_configs_cmd,
            diagnose_env_cmd,
            get_path_suggestions_cmd,
            // AI CLI tools commands
            get_ai_cli_tools_cmd,
            install_ai_tool_cmd,
            update_ai_tool_cmd,
            uninstall_ai_tool_cmd,
            // Security scan commands
            scan_security_cmd,
            scan_tool_security_cmd,
            get_security_tools_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
