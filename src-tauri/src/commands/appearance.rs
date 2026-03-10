use serde::Serialize;

#[tauri::command]
pub async fn appearance_set_wallpaper(path: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let uri = if path.starts_with('/') { format!("file://{}", path) } else { path.clone() };
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.background", "picture-uri", &uri])
            .output().await.map_err(|e| e.to_string())?;
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.background", "picture-uri-dark", &uri])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = path; Ok(()) }
}

#[tauri::command]
pub async fn appearance_set_gtk_theme(theme: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.interface", "gtk-theme", &theme])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = theme; Ok(()) }
}

#[tauri::command]
pub async fn appearance_set_icon_theme(theme: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.interface", "icon-theme", &theme])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = theme; Ok(()) }
}

#[tauri::command]
pub async fn appearance_set_cursor_theme(theme: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.interface", "cursor-theme", &theme])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = theme; Ok(()) }
}

#[tauri::command]
pub async fn appearance_set_dark_mode(dark: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let scheme = if dark { "prefer-dark" } else { "prefer-light" };
        tokio::process::Command::new("gsettings")
            .args(["set", "org.gnome.desktop.interface", "color-scheme", scheme])
            .output().await.map_err(|e| e.to_string())?;

        // Also update Qt
        let home = dirs::home_dir().ok_or("No home dir")?;
        let qt5ct_conf = home.join(".config/qt5ct/qt5ct.conf");
        if qt5ct_conf.exists() {
            let content = tokio::fs::read_to_string(&qt5ct_conf).await.unwrap_or_default();
            let new_content = if dark {
                content.replace("color_scheme_path=", &format!("color_scheme_path={}/.local/share/color-schemes/NextarOSDark.conf", home.display()))
            } else {
                content.replace("color_scheme_path=", &format!("color_scheme_path={}/.local/share/color-schemes/NextarOS.conf", home.display()))
            };
            let _ = tokio::fs::write(&qt5ct_conf, new_content).await;
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = dark; Ok(()) }
}

#[tauri::command]
pub async fn appearance_set_accent_color(color: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        // GTK4/libadwaita accent color
        let home = dirs::home_dir().ok_or("No home dir")?;
        let gtk4_css = home.join(".config/gtk-4.0/gtk.css");
        let _ = tokio::fs::create_dir_all(home.join(".config/gtk-4.0")).await;

        let css = format!(
            "@define-color accent_color {};\n\
             @define-color accent_bg_color {};\n\
             @define-color accent_fg_color white;\n",
            color, color
        );
        tokio::fs::write(&gtk4_css, css).await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = color; Ok(()) }
}
