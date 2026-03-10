use serde::Serialize;

#[derive(Serialize)]
pub struct KeyboardLayout {
    pub layout: String,
    pub variant: String,
    pub description: String,
}

#[derive(Serialize)]
pub struct RepeatRate {
    pub delay: u32,
    pub interval: u32,
}

#[tauri::command]
pub async fn keyboard_get_layout() -> Result<KeyboardLayout, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("setxkbmap")
            .args(["-query"])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout);
        let mut layout = String::new();
        let mut variant = String::new();
        for line in text.lines() {
            if line.starts_with("layout:") {
                layout = line.split_whitespace().nth(1).unwrap_or("").to_string();
            }
            if line.starts_with("variant:") {
                variant = line.split_whitespace().nth(1).unwrap_or("").to_string();
            }
        }
        Ok(KeyboardLayout {
            description: format!("{}{}", layout, if variant.is_empty() { String::new() } else { format!(" ({})", variant) }),
            layout,
            variant,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(KeyboardLayout { layout: "us".into(), variant: String::new(), description: "English (US)".into() })
    }
}

#[tauri::command]
pub async fn keyboard_get_layouts() -> Result<Vec<KeyboardLayout>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("localectl")
            .args(["list-x11-keymap-layouts"])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout);
        Ok(text.lines().map(|l| KeyboardLayout {
            layout: l.trim().to_string(),
            variant: String::new(),
            description: l.trim().to_string(),
        }).collect())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}

#[tauri::command]
pub async fn keyboard_set_layout(layout: String, variant: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let mut args = vec!["-layout".to_string(), layout];
        if let Some(v) = variant {
            args.push("-variant".into());
            args.push(v);
        }
        tokio::process::Command::new("setxkbmap").args(&args).output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (layout, variant); Ok(()) }
}

#[tauri::command]
pub async fn keyboard_get_repeat_rate() -> Result<RepeatRate, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.peripherals.keyboard", "delay"])
            .output().await.ok();
        let delay: u32 = output.map(|o| String::from_utf8_lossy(&o.stdout).trim().parse().unwrap_or(500)).unwrap_or(500);
        let output2 = tokio::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.peripherals.keyboard", "repeat-interval"])
            .output().await.ok();
        let interval: u32 = output2.map(|o| String::from_utf8_lossy(&o.stdout).trim().parse().unwrap_or(30)).unwrap_or(30);
        Ok(RepeatRate { delay, interval })
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(RepeatRate { delay: 500, interval: 30 }) }
}

#[tauri::command]
pub async fn keyboard_set_repeat_rate(delay: u32, interval: u32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let _ = tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.peripherals.keyboard", "delay", &delay.to_string()])
            .output().await;
        let _ = tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.peripherals.keyboard", "repeat-interval", &interval.to_string()])
            .output().await;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (delay, interval); Ok(()) }
}

#[tauri::command]
pub async fn mouse_get_speed() -> Result<f64, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.peripherals.mouse", "speed"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(String::from_utf8_lossy(&output.stdout).trim().parse().unwrap_or(0.0))
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(0.0) }
}

#[tauri::command]
pub async fn mouse_set_speed(speed: f64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.peripherals.mouse", "speed", &speed.to_string()])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = speed; Ok(()) }
}

#[tauri::command]
pub async fn mouse_get_natural_scroll() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.peripherals.mouse", "natural-scroll"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(String::from_utf8_lossy(&output.stdout).trim() == "true")
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(false) }
}

#[tauri::command]
pub async fn mouse_set_natural_scroll(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.peripherals.mouse", "natural-scroll", &enabled.to_string()])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = enabled; Ok(()) }
}
