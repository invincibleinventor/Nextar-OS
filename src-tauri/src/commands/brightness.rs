use serde::Serialize;

#[derive(Serialize)]
pub struct BrightnessInfo {
    pub level: f64,
    pub max: f64,
}

#[tauri::command]
pub async fn brightness_get() -> Result<BrightnessInfo, String> {
    #[cfg(target_os = "linux")]
    {
        // Read from /sys/class/backlight
        let backlight_dir = std::path::Path::new("/sys/class/backlight");
        if let Ok(mut entries) = std::fs::read_dir(backlight_dir) {
            if let Some(Ok(entry)) = entries.next() {
                let path = entry.path();
                let current = std::fs::read_to_string(path.join("brightness"))
                    .ok()
                    .and_then(|s| s.trim().parse::<f64>().ok())
                    .unwrap_or(0.0);
                let max = std::fs::read_to_string(path.join("max_brightness"))
                    .ok()
                    .and_then(|s| s.trim().parse::<f64>().ok())
                    .unwrap_or(100.0);
                return Ok(BrightnessInfo {
                    level: (current / max * 100.0).round(),
                    max,
                });
            }
        }
        // Fallback to brightnessctl
        let output = tokio::process::Command::new("brightnessctl")
            .args(["get"])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        let current: f64 = String::from_utf8_lossy(&output.stdout)
            .trim()
            .parse()
            .unwrap_or(50.0);
        let max_output = tokio::process::Command::new("brightnessctl")
            .args(["max"])
            .output()
            .await
            .ok();
        let max: f64 = max_output
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().parse().unwrap_or(100.0))
            .unwrap_or(100.0);

        Ok(BrightnessInfo {
            level: (current / max * 100.0).round(),
            max,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(BrightnessInfo {
            level: 50.0,
            max: 100.0,
        })
    }
}

#[tauri::command]
pub async fn brightness_set(level: f64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let pct = format!("{}%", level.round() as i32);
        tokio::process::Command::new("brightnessctl")
            .args(["set", &pct])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = level;
        Ok(())
    }
}

#[tauri::command]
pub async fn night_light_set(enabled: bool, temperature: Option<u32>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        if enabled {
            let temp = temperature.unwrap_or(4500);
            // Use gammastep or redshift
            let _ = tokio::process::Command::new("pkill")
                .arg("gammastep")
                .output()
                .await;
            tokio::process::Command::new("gammastep")
                .args(["-O", &temp.to_string()])
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            let _ = tokio::process::Command::new("pkill")
                .arg("gammastep")
                .output()
                .await;
            // Reset with gammastep -x
            let _ = tokio::process::Command::new("gammastep")
                .arg("-x")
                .output()
                .await;
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (enabled, temperature);
        Ok(())
    }
}
