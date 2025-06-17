use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::State;

// Global state to manage running MCP server processes
type MCPProcesses = Mutex<HashMap<String, Child>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_mcp_server(
    server_name: String,
    command: String,
    args: Vec<String>,
    processes: State<MCPProcesses>,
) -> Result<String, String> {
    let mut processes_map = processes.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Check if server is already running
    if processes_map.contains_key(&server_name) {
        return Err(format!("Server {} is already running", server_name));
    }

    // Start the process
    let child = Command::new(&command)
        .args(&args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start {}: {}", server_name, e))?;

    processes_map.insert(server_name.clone(), child);
    Ok(format!("Started MCP server: {}", server_name))
}

#[tauri::command]
fn stop_mcp_server(
    server_name: String,
    processes: State<MCPProcesses>,
) -> Result<String, String> {
    let mut processes_map = processes.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(mut child) = processes_map.remove(&server_name) {
        child.kill().map_err(|e| format!("Failed to kill {}: {}", server_name, e))?;
        Ok(format!("Stopped MCP server: {}", server_name))
    } else {
        Err(format!("Server {} is not running", server_name))
    }
}

#[tauri::command]
fn list_mcp_servers(processes: State<MCPProcesses>) -> Result<Vec<String>, String> {
    let processes_map = processes.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(processes_map.keys().cloned().collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(MCPProcesses::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_mcp_server,
            stop_mcp_server,
            list_mcp_servers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
