use serde::Serialize;

#[derive(Serialize)]
pub struct PrinterInfo {
    pub name: String,
    pub description: String,
    pub is_default: bool,
    pub state: String,
    pub location: Option<String>,
}

#[tauri::command]
pub async fn printer_get_list() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("lpstat")
            .args(["-p", "-d"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let default_output = tokio::process::Command::new("lpstat")
            .args(["-d"])
            .output()
            .await
            .ok();
        let default_name = default_output
            .map(|o| {
                let t = String::from_utf8_lossy(&o.stdout);
                t.split(':').nth(1).unwrap_or("").trim().to_string()
            })
            .unwrap_or_default();

        let printers: Vec<PrinterInfo> = text
            .lines()
            .filter(|l| l.starts_with("printer "))
            .map(|line| {
                let parts: Vec<&str> = line.splitn(3, ' ').collect();
                let name = parts.get(1).unwrap_or(&"").to_string();
                let state = if line.contains("idle") { "idle" }
                    else if line.contains("printing") { "printing" }
                    else { "unknown" };
                PrinterInfo {
                    is_default: name == default_name,
                    name,
                    description: parts.get(2).unwrap_or(&"").to_string(),
                    state: state.to_string(),
                    location: None,
                }
            })
            .collect();

        Ok(printers)
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}

#[tauri::command]
pub async fn printer_get_default() -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("lpstat").args(["-d"]).output().await.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout);
        Ok(text.split(':').nth(1).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()))
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(None) }
}

#[tauri::command]
pub async fn printer_set_default(name: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("lpoptions").args(["-d", &name]).output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = name; Ok(()) }
}
