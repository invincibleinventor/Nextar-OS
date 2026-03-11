use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join(".config"));
    config_dir.join("nextaros")
}

fn config_file() -> PathBuf {
    config_path().join("settings.json")
}

fn read_config_file() -> Value {
    let path = config_file();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(val) = serde_json::from_str(&content) {
                return val;
            }
        }
    }
    Value::Object(serde_json::Map::new())
}

fn write_config_file(config: &Value) -> Result<(), String> {
    let dir = config_path();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(config_file(), content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_config() -> Result<Value, String> {
    Ok(read_config_file())
}

#[tauri::command]
pub fn set_config(config: Value) -> Result<(), String> {
    write_config_file(&config)
}

#[tauri::command]
pub fn get_config_value(key: String) -> Result<Value, String> {
    let config = read_config_file();
    Ok(config.get(&key).cloned().unwrap_or(Value::Null))
}

#[tauri::command]
pub fn set_config_value(key: String, value: Value) -> Result<(), String> {
    let mut config = read_config_file();
    if let Value::Object(ref mut map) = config {
        map.insert(key, value);
    }
    write_config_file(&config)
}
