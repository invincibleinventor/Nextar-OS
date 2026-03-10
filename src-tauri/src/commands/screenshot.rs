use serde::Serialize;

#[derive(Serialize)]
pub struct ScreenshotResult {
    pub path: String,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn screenshot_take(mode: String, delay: Option<u32>) -> Result<ScreenshotResult, String> {
    #[cfg(target_os = "linux")]
    {
        if let Some(d) = delay {
            tokio::time::sleep(std::time::Duration::from_secs(d as u64)).await;
        }

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let pictures_dir = dirs::picture_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Pictures"));
        let _ = std::fs::create_dir_all(&pictures_dir);
        let filename = format!("Screenshot_{}.png", timestamp);
        let path = pictures_dir.join(&filename);

        let args = match mode.as_str() {
            "window" => vec!["-w".to_string(), path.to_string_lossy().to_string()],
            "area" | "selection" => vec!["-s".to_string(), path.to_string_lossy().to_string()],
            _ => vec![path.to_string_lossy().to_string()], // full screen
        };

        // Try gnome-screenshot, then scrot, then import (ImageMagick)
        let tools = ["gnome-screenshot", "scrot", "grim"];
        let mut success = false;

        for tool in &tools {
            let result = tokio::process::Command::new(tool)
                .args(&args)
                .output()
                .await;

            if let Ok(output) = result {
                if output.status.success() {
                    success = true;
                    break;
                }
            }
        }

        if !success {
            return Err("No screenshot tool available (install gnome-screenshot, scrot, or grim)".into());
        }

        Ok(ScreenshotResult {
            path: path.to_string_lossy().to_string(),
            width: 0,
            height: 0,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (mode, delay);
        Err("Screenshots only supported on Linux".into())
    }
}

#[tauri::command]
pub async fn screen_record_start(audio: Option<bool>) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let videos_dir = dirs::video_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Videos"));
        let _ = std::fs::create_dir_all(&videos_dir);
        let filename = format!("Recording_{}.mp4", timestamp);
        let path = videos_dir.join(&filename);

        let mut args = vec![
            "-video-encoder".to_string(), "libx264".to_string(),
            "-o".to_string(), path.to_string_lossy().to_string(),
        ];

        if audio.unwrap_or(false) {
            args.extend_from_slice(&["-audio-encoder".to_string(), "aac".to_string()]);
        }

        // Try wf-recorder (Wayland) or ffmpeg
        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            tokio::process::Command::new("wf-recorder")
                .args(&args)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            // X11: use ffmpeg with x11grab
            tokio::process::Command::new("ffmpeg")
                .args(["-f", "x11grab", "-i", ":0", "-c:v", "libx264", "-preset", "ultrafast", &path.to_string_lossy()])
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .spawn()
                .map_err(|e| e.to_string())?;
        }

        Ok(path.to_string_lossy().to_string())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = audio;
        Err("Screen recording only supported on Linux".into())
    }
}

#[tauri::command]
pub async fn screen_record_stop() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        // Kill recording processes
        let _ = tokio::process::Command::new("pkill")
            .args(["-SIGINT", "wf-recorder"])
            .output()
            .await;
        let _ = tokio::process::Command::new("pkill")
            .args(["-SIGINT", "ffmpeg"])
            .output()
            .await;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(()) }
}
