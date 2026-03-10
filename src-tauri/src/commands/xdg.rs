use serde::Serialize;

#[derive(Serialize)]
pub struct MimeApp {
    pub mime_type: String,
    pub default_app: Option<String>,
    pub all_apps: Vec<String>,
}

#[derive(Serialize)]
pub struct RecentFile {
    pub path: String,
    pub mime_type: String,
    pub timestamp: u64,
    pub app: Option<String>,
}

#[derive(Serialize)]
pub struct Bookmark {
    pub path: String,
    pub name: String,
}

#[tauri::command]
pub async fn xdg_get_default_app(mime_type: String) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("xdg-mime")
            .args(["query", "default", &mime_type])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        let app = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if app.is_empty() { None } else { Some(app) })
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = mime_type; Ok(None) }
}

#[tauri::command]
pub async fn xdg_set_default_app(mime_type: String, desktop_file: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("xdg-mime")
            .args(["default", &desktop_file, &mime_type])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (mime_type, desktop_file); Ok(()) }
}

#[tauri::command]
pub async fn xdg_get_mime_apps(mime_type: String) -> Result<Vec<String>, String> {
    #[cfg(target_os = "linux")]
    {
        // Read mimeapps.list and find all handlers
        let home = dirs::home_dir().ok_or("No home dir")?;
        let mimeapps = home.join(".config/mimeapps.list");
        let mut apps = Vec::new();

        if let Ok(content) = tokio::fs::read_to_string(&mimeapps).await {
            let mut in_section = false;
            for line in content.lines() {
                if line.starts_with("[Added Associations]") || line.starts_with("[Default Applications]") {
                    in_section = true;
                    continue;
                }
                if line.starts_with('[') { in_section = false; continue; }
                if in_section {
                    if let Some((mime, app_list)) = line.split_once('=') {
                        if mime == mime_type {
                            for app in app_list.split(';') {
                                if !app.is_empty() && !apps.contains(&app.to_string()) {
                                    apps.push(app.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
        Ok(apps)
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = mime_type; Ok(Vec::new()) }
}

#[tauri::command]
pub async fn xdg_get_recent_files() -> Result<Vec<RecentFile>, String> {
    #[cfg(target_os = "linux")]
    {
        let home = dirs::home_dir().ok_or("No home dir")?;
        let recent = home.join(".local/share/recently-used.xbel");

        if !recent.exists() { return Ok(Vec::new()); }

        let content = tokio::fs::read_to_string(&recent).await.map_err(|e| e.to_string())?;
        let mut files = Vec::new();

        // Simple XML parsing for <bookmark> elements
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("<bookmark href=") {
                if let Some(href) = extract_attr(line, "href") {
                    let path = href.replace("file://", "");
                    let timestamp = extract_attr(line, "modified")
                        .and_then(|t| t.parse::<u64>().ok())
                        .unwrap_or(0);
                    let mime = extract_attr(line, "type").unwrap_or_default();

                    files.push(RecentFile {
                        path: urlencoding_decode(&path),
                        mime_type: mime,
                        timestamp,
                        app: None,
                    });
                }
            }
        }

        files.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        files.truncate(50);
        Ok(files)
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}

fn extract_attr(line: &str, attr: &str) -> Option<String> {
    let search = format!("{}=\"", attr);
    let start = line.find(&search)? + search.len();
    let end = line[start..].find('"')? + start;
    Some(line[start..end].to_string())
}

fn urlencoding_decode(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let hex: String = chars.by_ref().take(2).collect();
            if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                result.push(byte as char);
            }
        } else {
            result.push(c);
        }
    }
    result
}

#[tauri::command]
pub async fn xdg_get_bookmarks() -> Result<Vec<Bookmark>, String> {
    #[cfg(target_os = "linux")]
    {
        let home = dirs::home_dir().ok_or("No home dir")?;
        let bookmarks_file = home.join(".config/gtk-3.0/bookmarks");

        if !bookmarks_file.exists() { return Ok(Vec::new()); }

        let content = tokio::fs::read_to_string(&bookmarks_file).await.map_err(|e| e.to_string())?;
        let bookmarks: Vec<Bookmark> = content
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.splitn(2, ' ').collect();
                let path = parts[0].replace("file://", "");
                let name = parts.get(1).map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        std::path::Path::new(&path)
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| path.clone())
                    });
                Some(Bookmark { path: urlencoding_decode(&path), name })
            })
            .collect();

        Ok(bookmarks)
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}
