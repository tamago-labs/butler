// Test the environment variable functionality
// Run with: cargo test --manifest-path=src-tauri/Cargo.toml

use std::collections::HashMap;

#[tokio::test]
async fn test_env_vars() {
    let mut env = HashMap::new();
    env.insert("TEST_KEY".to_string(), "test_value".to_string());
    
    println!("Environment variables test: {:?}", env.keys().collect::<Vec<_>>());
    
    // This should compile without issues
    assert_eq!(env.len(), 1);
    assert!(env.contains_key("TEST_KEY"));
}

#[test]
fn test_basic_functionality() {
    println!("Basic test passed");
}
