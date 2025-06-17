use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command, ChildStdin, ChildStdout};
use serde_json::{json, Value};

#[derive(Debug)]
pub struct MCPClient {
    process: Child,
    stdin: Option<ChildStdin>,
    stdout: Option<BufReader<ChildStdout>>,
    request_id_counter: u64,
    initialized: bool,
}

impl MCPClient {
    pub async fn new(command: String, args: Vec<String>) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        println!("[MCP] Starting server: {} {:?}", command, args);
        
        let mut cmd = Command::new(&command);
        cmd.args(&args);
        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        let mut process = cmd.spawn()?;

        let stdin = process.stdin.take();
        let stdout = process.stdout.take().map(BufReader::new);

        let mut client = MCPClient {
            process,
            stdin,
            stdout,
            request_id_counter: 1,
            initialized: false,
        };

        client.initialize().await?;
        
        Ok(client)
    }

    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let init_request = json!({
            "jsonrpc": "2.0",
            "id": self.next_request_id(),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "clientInfo": {
                    "name": "butler",
                    "version": "0.1.0"
                }
            }
        });

        println!("[MCP] Initializing connection...");
        let _response = self.send_request(init_request).await?;
        
        // Send initialized notification
        let initialized = json!({
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        });
        
        self.send_notification(initialized).await?;
        self.initialized = true;
        println!("[MCP] Connection initialized successfully");
        
        Ok(())
    }

    fn next_request_id(&mut self) -> u64 {
        let id = self.request_id_counter;
        self.request_id_counter += 1;
        id
    }

    pub async fn list_tools(&mut self) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        if !self.initialized {
            return Err("Client not initialized".into());
        }

        let request = json!({
            "jsonrpc": "2.0",
            "id": self.next_request_id(),
            "method": "tools/list"
        });

        self.send_request(request).await
    }

    pub async fn call_tool(&mut self, name: &str, arguments: Value) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        if !self.initialized {
            return Err("Client not initialized".into());
        }

        println!("[MCP] Calling tool: {} with args: {}", name, arguments);

        let request = json!({
            "jsonrpc": "2.0",
            "id": self.next_request_id(),
            "method": "tools/call",
            "params": {
                "name": name,
                "arguments": arguments
            }
        });

        self.send_request(request).await
    }

    pub async fn list_resources(&mut self) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        if !self.initialized {
            return Err("Client not initialized".into());
        }

        let request = json!({
            "jsonrpc": "2.0",
            "id": self.next_request_id(),
            "method": "resources/list"
        });

        self.send_request(request).await
    }

    pub async fn read_resource(&mut self, uri: &str) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        if !self.initialized {
            return Err("Client not initialized".into());
        }

        let request = json!({
            "jsonrpc": "2.0",
            "id": self.next_request_id(),
            "method": "resources/read",
            "params": {
                "uri": uri
            }
        });

        self.send_request(request).await
    }

    async fn send_request(&mut self, request: Value) -> Result<Value, Box<dyn std::error::Error + Send + Sync>> {
        if let Some(ref mut stdin) = self.stdin {
            let request_str = serde_json::to_string(&request)?;
            println!("[MCP] Sending request: {}", request_str);
            stdin.write_all(format!("{}\n", request_str).as_bytes()).await?;
            stdin.flush().await?;

            // Read response with timeout and better error handling
            if let Some(ref mut stdout) = self.stdout {
                let mut response_line = String::new();
                let bytes_read = stdout.read_line(&mut response_line).await?;
                
                println!("[MCP] Raw response ({} bytes): {:?}", bytes_read, response_line);
                
                if bytes_read == 0 {
                    return Err("MCP server closed connection".into());
                }
                
                if response_line.trim().is_empty() {
                    return Err("Empty response from MCP server".into());
                }

                let response: Value = match serde_json::from_str(&response_line.trim()) {
                    Ok(json) => json,
                    Err(e) => {
                        println!("[MCP] JSON parse error: {}", e);
                        println!("[MCP] Raw response was: {:?}", response_line);
                        return Err(format!("Failed to parse JSON response: {}", e).into());
                    }
                };
                
                println!("[MCP] Parsed response: {}", serde_json::to_string_pretty(&response)?);
                
                // Check for error in response
                if let Some(error) = response.get("error") {
                    return Err(format!("MCP error: {}", error).into());
                }
                
                Ok(response)
            } else {
                Err("No stdout available".into())
            }
        } else {
            Err("No stdin available".into())
        }
    }

    async fn send_notification(&mut self, notification: Value) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(ref mut stdin) = self.stdin {
            let notification_str = serde_json::to_string(&notification)?;
            println!("[MCP] Sending notification: {}", notification_str);
            stdin.write_all(format!("{}\n", notification_str).as_bytes()).await?;
            stdin.flush().await?;
            Ok(())
        } else {
            Err("No stdin available".into())
        }
    }

    pub async fn shutdown(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if self.initialized {
            let shutdown_request = json!({
                "jsonrpc": "2.0",
                "id": self.next_request_id(),
                "method": "shutdown"
            });

            let _ = self.send_request(shutdown_request).await;
        }

        let _ = self.process.kill().await;
        Ok(())
    }
}
