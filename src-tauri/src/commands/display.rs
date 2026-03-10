use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
pub struct DisplayInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub scale_factor: f64,
    pub is_primary: bool,
    pub refresh_rate: Option<f32>,
}

#[derive(Serialize)]
pub struct DisplayConfig {
    pub displays: Vec<DisplayInfo>,
    pub available_resolutions: Vec<String>,
}

#[tauri::command]
pub fn get_displays(app: tauri::AppHandle) -> Result<Vec<DisplayInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().ok().flatten();

    let mut displays = Vec::new();
    for (i, m) in monitors.iter().enumerate() {
        let size = m.size();
        let pos = m.position();
        let is_primary = primary
            .as_ref()
            .map(|p| p.name() == m.name())
            .unwrap_or(i == 0);

        displays.push(DisplayInfo {
            id: i as u32,
            name: m.name().map(|s| s.to_string()).unwrap_or_else(|| "Unknown".to_string()),
            width: size.width,
            height: size.height,
            x: pos.x,
            y: pos.y,
            scale_factor: m.scale_factor(),
            is_primary,
            refresh_rate: None,
        });
    }
    Ok(displays)
}

#[tauri::command]
pub fn get_theme() -> String {
    // Check system theme preference
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.interface", "color-scheme"])
            .output()
        {
            let theme = String::from_utf8_lossy(&output.stdout);
            if theme.contains("dark") {
                return "dark".into();
            }
        }
    }
    "light".into()
}

#[tauri::command]
pub async fn get_display_config() -> Result<DisplayConfig, String> {
    #[cfg(target_os = "linux")]
    {
        // Try xrandr for X11
        if std::env::var("WAYLAND_DISPLAY").is_err() {
            let output = tokio::process::Command::new("xrandr")
                .arg("--query")
                .output()
                .await
                .map_err(|e| e.to_string())?;

            let text = String::from_utf8_lossy(&output.stdout);
            let mut resolutions = Vec::new();
            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.contains('x') && !trimmed.starts_with("Screen") && !trimmed.contains("connected") {
                    if let Some(res) = trimmed.split_whitespace().next() {
                        if !resolutions.contains(&res.to_string()) {
                            resolutions.push(res.to_string());
                        }
                    }
                }
            }

            return Ok(DisplayConfig {
                displays: Vec::new(), // Filled by get_displays
                available_resolutions: resolutions,
            });
        }
    }

    Ok(DisplayConfig {
        displays: Vec::new(),
        available_resolutions: Vec::new(),
    })
}

#[tauri::command]
pub async fn set_display_resolution(
    display: String,
    width: u32,
    height: u32,
    rate: Option<f32>,
) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let mode = format!("{}x{}", width, height);
        let mut args = vec![
            "--output".to_string(),
            display,
            "--mode".to_string(),
            mode,
        ];
        if let Some(r) = rate {
            args.push("--rate".into());
            args.push(format!("{:.2}", r));
        }

        let output = tokio::process::Command::new("xrandr")
            .args(&args)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn set_display_rotation(display: String, rotation: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("xrandr")
            .args(["--output", &display, "--rotate", &rotation])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
    }
    Ok(())
}
