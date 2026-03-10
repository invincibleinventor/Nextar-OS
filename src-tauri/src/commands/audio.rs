use serde::Serialize;

#[derive(Serialize)]
pub struct AudioStatus {
    pub volume: f64,
    pub muted: bool,
    pub device_name: String,
}

#[derive(Serialize)]
pub struct AudioDevice {
    pub name: String,
    pub description: String,
    pub is_default: bool,
    pub device_type: String, // "output" or "input"
    pub volume: f64,
    pub muted: bool,
}

#[derive(Serialize)]
pub struct AudioStream {
    pub id: u32,
    pub name: String,
    pub app_name: String,
    pub volume: f64,
    pub muted: bool,
    pub icon: String,
}

#[tauri::command]
pub async fn audio_get_volume() -> Result<AudioStatus, String> {
    #[cfg(target_os = "linux")]
    {
        // Use pactl for reliability
        let output = tokio::process::Command::new("pactl")
            .args(["get-sink-volume", "@DEFAULT_SINK@"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let vol_text = String::from_utf8_lossy(&output.stdout);
        let volume = vol_text
            .split('/')
            .nth(1)
            .and_then(|s| s.trim().trim_end_matches('%').parse::<f64>().ok())
            .unwrap_or(50.0);

        let mute_output = tokio::process::Command::new("pactl")
            .args(["get-sink-mute", "@DEFAULT_SINK@"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let muted = String::from_utf8_lossy(&mute_output.stdout)
            .contains("yes");

        let name_output = tokio::process::Command::new("pactl")
            .args(["get-default-sink"])
            .output()
            .await
            .ok();

        let device_name = name_output
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_default();

        Ok(AudioStatus {
            volume,
            muted,
            device_name,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(AudioStatus {
            volume: 50.0,
            muted: false,
            device_name: String::new(),
        })
    }
}

#[tauri::command]
pub async fn audio_set_volume(volume: f64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let vol_str = format!("{}%", volume.round() as i32);
        tokio::process::Command::new("pactl")
            .args(["set-sink-volume", "@DEFAULT_SINK@", &vol_str])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = volume;
        Ok(())
    }
}

#[tauri::command]
pub async fn audio_set_muted(muted: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let val = if muted { "1" } else { "0" };
        tokio::process::Command::new("pactl")
            .args(["set-sink-mute", "@DEFAULT_SINK@", val])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = muted;
        Ok(())
    }
}

#[tauri::command]
pub async fn audio_get_devices() -> Result<Vec<AudioDevice>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("pactl")
            .args(["--format=json", "list", "sinks"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let sinks: Vec<serde_json::Value> = serde_json::from_str(&text).unwrap_or_default();

        let default_output = tokio::process::Command::new("pactl")
            .args(["get-default-sink"])
            .output()
            .await
            .ok();
        let default_sink = default_output
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_default();

        let mut devices: Vec<AudioDevice> = sinks
            .iter()
            .map(|s| {
                let name = s["name"].as_str().unwrap_or("").to_string();
                let desc = s["description"].as_str().unwrap_or("").to_string();
                let muted = s["mute"].as_bool().unwrap_or(false);
                let vol = s["volume"]
                    .as_object()
                    .and_then(|v| v.values().next())
                    .and_then(|ch| ch["value_percent"].as_str())
                    .and_then(|p| p.trim_end_matches('%').parse::<f64>().ok())
                    .unwrap_or(50.0);

                AudioDevice {
                    is_default: name == default_sink,
                    name,
                    description: desc,
                    device_type: "output".into(),
                    volume: vol,
                    muted,
                }
            })
            .collect();

        // Also get sources (inputs)
        let src_output = tokio::process::Command::new("pactl")
            .args(["--format=json", "list", "sources"])
            .output()
            .await
            .ok();

        if let Some(src_out) = src_output {
            let src_text = String::from_utf8_lossy(&src_out.stdout);
            let sources: Vec<serde_json::Value> = serde_json::from_str(&src_text).unwrap_or_default();
            for s in &sources {
                let name = s["name"].as_str().unwrap_or("").to_string();
                // Skip monitor sources
                if name.contains(".monitor") { continue; }
                let desc = s["description"].as_str().unwrap_or("").to_string();
                devices.push(AudioDevice {
                    name,
                    description: desc,
                    is_default: false,
                    device_type: "input".into(),
                    volume: 50.0,
                    muted: s["mute"].as_bool().unwrap_or(false),
                });
            }
        }

        Ok(devices)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn audio_set_default_device(name: String, device_type: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let cmd = if device_type == "input" {
            "set-default-source"
        } else {
            "set-default-sink"
        };
        tokio::process::Command::new("pactl")
            .args([cmd, &name])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (name, device_type);
        Ok(())
    }
}

#[tauri::command]
pub async fn audio_get_streams() -> Result<Vec<AudioStream>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("pactl")
            .args(["--format=json", "list", "sink-inputs"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let inputs: Vec<serde_json::Value> = serde_json::from_str(&text).unwrap_or_default();

        let streams: Vec<AudioStream> = inputs
            .iter()
            .filter_map(|i| {
                let id = i["index"].as_u64()? as u32;
                let props = i["properties"].as_object()?;
                let app_name = props
                    .get("application.name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown")
                    .to_string();
                let media_name = props
                    .get("media.name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let icon = props
                    .get("application.icon_name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("audio-volume-medium")
                    .to_string();
                let muted = i["mute"].as_bool().unwrap_or(false);

                Some(AudioStream {
                    id,
                    name: if media_name.is_empty() { app_name.clone() } else { media_name },
                    app_name,
                    volume: 50.0,
                    muted,
                    icon,
                })
            })
            .collect();

        Ok(streams)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}
