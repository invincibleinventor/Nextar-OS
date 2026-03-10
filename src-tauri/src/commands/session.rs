use serde::Serialize;
use tauri::State;
use crate::services::AppState;

#[derive(Serialize)]
pub struct SessionInfo {
    pub is_desktop_session: bool,
    pub session_type: String, // "x11", "wayland"
    pub display_server: String,
    pub username: String,
    pub hostname: String,
    pub home_dir: String,
    pub xdg_session_desktop: String,
}

#[derive(Serialize)]
pub struct AutostartApp {
    pub name: String,
    pub exec: String,
    pub enabled: bool,
    pub desktop_file: String,
    pub comment: Option<String>,
    pub icon: Option<String>,
}

#[tauri::command]
pub fn get_session_info(state: State<'_, AppState>) -> SessionInfo {
    let session_type = if std::env::var("WAYLAND_DISPLAY").is_ok() {
        "wayland"
    } else {
        "x11"
    };

    SessionInfo {
        is_desktop_session: state.is_session,
        session_type: session_type.to_string(),
        display_server: session_type.to_string(),
        username: whoami::username(),
        hostname: whoami::fallible::hostname().unwrap_or_default(),
        home_dir: dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        xdg_session_desktop: std::env::var("XDG_SESSION_DESKTOP").unwrap_or_default(),
    }
}

#[tauri::command]
pub async fn session_lock() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("loginctl")
            .args(["lock-session"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(()) }
}

#[tauri::command]
pub async fn session_logout() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("loginctl")
            .args(["terminate-session", "self"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(()) }
}

#[tauri::command]
pub async fn session_install() -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_path = exe.to_string_lossy();

        let xsession_content = format!(
            "[Desktop Entry]\n\
            Name=NextarOS\n\
            Comment=NextarOS Desktop Environment\n\
            Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS QT_QPA_PLATFORMTHEME=qt5ct {} --no-sandbox --session\n\
            TryExec={}\n\
            Type=Application\n\
            DesktopNames=NextarOS\n\
            X-Ubuntu-Gettext-Domain=nextaros\n",
            exe_path, exe_path
        );

        let wayland_content = format!(
            "[Desktop Entry]\n\
            Name=NextarOS (Wayland)\n\
            Comment=NextarOS Desktop Environment on Wayland\n\
            Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS XDG_SESSION_TYPE=wayland QT_QPA_PLATFORMTHEME=qt5ct {} --no-sandbox --session --ozone-platform-hint=auto\n\
            TryExec={}\n\
            Type=Application\n\
            DesktopNames=NextarOS\n",
            exe_path, exe_path
        );

        // Try system dir first, fall back to user dir
        let system_x11 = "/usr/share/xsessions/nextaros.desktop";
        let system_wayland = "/usr/share/wayland-sessions/nextaros.desktop";
        let user_x11 = format!("{}/.local/share/xsessions/nextaros.desktop",
            dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default());

        let mut installed = Vec::new();

        if let Ok(()) = tokio::fs::write(system_x11, &xsession_content).await.map_err(|_| ()) {
            installed.push(system_x11.to_string());
        }
        if let Ok(()) = tokio::fs::write(system_wayland, &wayland_content).await.map_err(|_| ()) {
            installed.push(system_wayland.to_string());
        }

        // Always try user dir
        if let Some(parent) = std::path::Path::new(&user_x11).parent() {
            let _ = tokio::fs::create_dir_all(parent).await;
        }
        let _ = tokio::fs::write(&user_x11, &xsession_content).await;
        installed.push(user_x11);

        Ok(format!("Session files installed: {}", installed.join(", ")))
    }
    #[cfg(not(target_os = "linux"))]
    {
        Err("Session installation only supported on Linux".into())
    }
}

#[tauri::command]
pub async fn get_autostart_apps() -> Result<Vec<AutostartApp>, String> {
    #[cfg(target_os = "linux")]
    {
        let mut apps = Vec::new();
        let autostart_dirs = vec![
            format!("{}/.config/autostart", dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default()),
            "/etc/xdg/autostart".to_string(),
        ];

        for dir in &autostart_dirs {
            if let Ok(entries) = std::fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|e| e.to_str()) != Some("desktop") { continue; }

                    if let Ok(content) = std::fs::read_to_string(&path) {
                        let mut name = String::new();
                        let mut exec = String::new();
                        let mut comment = None;
                        let mut icon = None;
                        let mut hidden = false;
                        let mut only_show_in = Vec::new();
                        let mut not_show_in = Vec::new();

                        for line in content.lines() {
                            let line = line.trim();
                            if let Some((k, v)) = line.split_once('=') {
                                match k {
                                    "Name" => name = v.to_string(),
                                    "Exec" => exec = v.to_string(),
                                    "Comment" => comment = Some(v.to_string()),
                                    "Icon" => icon = Some(v.to_string()),
                                    "Hidden" => hidden = v == "true",
                                    "OnlyShowIn" => only_show_in = v.split(';').map(|s| s.to_string()).collect(),
                                    "NotShowIn" => not_show_in = v.split(';').map(|s| s.to_string()).collect(),
                                    _ => {}
                                }
                            }
                        }

                        if name.is_empty() || hidden { continue; }

                        // Check OnlyShowIn/NotShowIn
                        let show = if !only_show_in.is_empty() {
                            only_show_in.iter().any(|d| d == "NextarOS" || d == "GNOME" || d == "KDE")
                        } else if !not_show_in.is_empty() {
                            !not_show_in.iter().any(|d| d == "NextarOS")
                        } else {
                            true
                        };

                        if !show { continue; }

                        apps.push(AutostartApp {
                            name,
                            exec,
                            enabled: !hidden,
                            desktop_file: path.to_string_lossy().to_string(),
                            comment,
                            icon,
                        });
                    }
                }
            }
        }

        Ok(apps)
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}

#[tauri::command]
pub async fn set_autostart_app(desktop_file: String, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let home = dirs::home_dir().ok_or("No home dir")?;
        let autostart_dir = home.join(".config/autostart");
        let _ = tokio::fs::create_dir_all(&autostart_dir).await;

        let filename = std::path::Path::new(&desktop_file)
            .file_name()
            .ok_or("Invalid path")?
            .to_string_lossy()
            .to_string();

        let target = autostart_dir.join(&filename);

        if enabled {
            // Copy to autostart dir
            if !target.exists() {
                tokio::fs::copy(&desktop_file, &target).await.map_err(|e| e.to_string())?;
            }
            // Remove Hidden=true if present
            let content = tokio::fs::read_to_string(&target).await.map_err(|e| e.to_string())?;
            let new_content = content.replace("Hidden=true", "Hidden=false");
            tokio::fs::write(&target, new_content).await.map_err(|e| e.to_string())?;
        } else {
            // Set Hidden=true
            if target.exists() {
                let content = tokio::fs::read_to_string(&target).await.map_err(|e| e.to_string())?;
                if content.contains("Hidden=") {
                    let new_content = content.replace("Hidden=false", "Hidden=true");
                    tokio::fs::write(&target, new_content).await.map_err(|e| e.to_string())?;
                } else {
                    let new_content = content + "\nHidden=true\n";
                    tokio::fs::write(&target, new_content).await.map_err(|e| e.to_string())?;
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (desktop_file, enabled); Ok(()) }
}
