use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize, Clone)]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub generic_name: Option<String>,
    pub comment: Option<String>,
    pub exec: String,
    pub icon: Option<String>,
    pub icon_data: Option<String>, // base64 PNG
    pub categories: Vec<String>,
    pub mime_types: Vec<String>,
    pub terminal: bool,
    pub no_display: bool,
    pub actions: Vec<AppAction>,
    pub desktop_file: String,
    pub keywords: Vec<String>,
}

#[derive(Serialize, Clone)]
pub struct AppAction {
    pub name: String,
    pub exec: String,
    pub icon: Option<String>,
}

#[tauri::command]
pub async fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    #[cfg(target_os = "linux")]
    {
        let mut apps = Vec::new();
        let mut seen = std::collections::HashSet::new();

        // XDG app dirs
        let app_dirs = vec![
            "/usr/share/applications".to_string(),
            "/usr/local/share/applications".to_string(),
            format!("{}/.local/share/applications", dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_default()),
            "/var/lib/flatpak/exports/share/applications".to_string(),
            "/var/lib/snapd/desktop/applications".to_string(),
        ];

        for dir in &app_dirs {
            let dir_path = std::path::Path::new(dir);
            if !dir_path.exists() { continue; }

            if let Ok(entries) = std::fs::read_dir(dir_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|e| e.to_str()) != Some("desktop") {
                        continue;
                    }

                    let desktop_file = path.to_string_lossy().to_string();
                    if seen.contains(&desktop_file) { continue; }
                    seen.insert(desktop_file.clone());

                    if let Ok(app) = parse_desktop_file(&path) {
                        if !app.no_display {
                            apps.push(app);
                        }
                    }
                }
            }
        }

        // Sort by name
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        Ok(apps)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[cfg(target_os = "linux")]
fn parse_desktop_file(path: &std::path::Path) -> Result<InstalledApp, String> {
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut props = HashMap::new();
    let mut in_desktop_entry = false;
    let mut actions_section = HashMap::new();
    let mut current_action = String::new();

    for line in content.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            if line == "[Desktop Entry]" {
                in_desktop_entry = true;
                current_action.clear();
            } else if line.starts_with("[Desktop Action ") {
                in_desktop_entry = false;
                current_action = line
                    .trim_start_matches("[Desktop Action ")
                    .trim_end_matches(']')
                    .to_string();
            } else {
                in_desktop_entry = false;
                current_action.clear();
            }
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            if in_desktop_entry {
                props.insert(key.to_string(), value.to_string());
            } else if !current_action.is_empty() {
                actions_section
                    .entry(current_action.clone())
                    .or_insert_with(HashMap::new)
                    .insert(key.to_string(), value.to_string());
            }
        }
    }

    let name = props.get("Name").cloned().unwrap_or_default();
    if name.is_empty() {
        return Err("No Name field".into());
    }

    let exec = props.get("Exec").cloned().unwrap_or_default();
    let icon = props.get("Icon").cloned();
    let categories: Vec<String> = props
        .get("Categories")
        .map(|c| c.split(';').filter(|s| !s.is_empty()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    let mime_types: Vec<String> = props
        .get("MimeType")
        .map(|c| c.split(';').filter(|s| !s.is_empty()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    let keywords: Vec<String> = props
        .get("Keywords")
        .map(|c| c.split(';').filter(|s| !s.is_empty()).map(|s| s.to_string()).collect())
        .unwrap_or_default();

    let action_names: Vec<String> = props
        .get("Actions")
        .map(|a| a.split(';').filter(|s| !s.is_empty()).map(|s| s.to_string()).collect())
        .unwrap_or_default();

    let actions: Vec<AppAction> = action_names
        .iter()
        .filter_map(|name| {
            let ap = actions_section.get(name)?;
            Some(AppAction {
                name: ap.get("Name").cloned().unwrap_or_else(|| name.clone()),
                exec: ap.get("Exec").cloned().unwrap_or_default(),
                icon: ap.get("Icon").cloned(),
            })
        })
        .collect();

    let id = path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(InstalledApp {
        id,
        name,
        generic_name: props.get("GenericName").cloned(),
        comment: props.get("Comment").cloned(),
        exec,
        icon,
        icon_data: None,
        categories,
        mime_types,
        terminal: props.get("Terminal").map(|v| v == "true").unwrap_or(false),
        no_display: props.get("NoDisplay").map(|v| v == "true").unwrap_or(false),
        actions,
        desktop_file: path.to_string_lossy().to_string(),
        keywords,
    })
}

#[tauri::command]
pub async fn launch_app(exec: String, args: Option<Vec<String>>) -> Result<(), String> {
    // Clean exec field: remove %f, %F, %u, %U, etc.
    let clean_exec = exec
        .replace("%f", "")
        .replace("%F", "")
        .replace("%u", "")
        .replace("%U", "")
        .replace("%d", "")
        .replace("%D", "")
        .replace("%n", "")
        .replace("%N", "")
        .replace("%i", "")
        .replace("%c", "")
        .replace("%k", "")
        .trim()
        .to_string();

    let parts: Vec<&str> = clean_exec.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty exec command".into());
    }

    let mut cmd = tokio::process::Command::new(parts[0]);
    if parts.len() > 1 {
        cmd.args(&parts[1..]);
    }
    if let Some(extra_args) = args {
        cmd.args(&extra_args);
    }

    // Detach from our process
    cmd.stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    #[cfg(target_os = "linux")]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            cmd.pre_exec(|| {
                let _ = nix::unistd::setsid();
                Ok(())
            });
        }
    }
    #[cfg(all(unix, not(target_os = "linux")))]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            cmd.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }

    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_app_icon(icon_name: String) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        // Search icon themes
        let icon_dirs = vec![
            "/usr/share/icons/hicolor",
            "/usr/share/icons/Adwaita",
            "/usr/share/pixmaps",
        ];

        let sizes = ["256x256", "128x128", "64x64", "48x48", "scalable"];
        let categories = ["apps", "mimetypes", "status", "actions"];

        for dir in &icon_dirs {
            for size in &sizes {
                for cat in &categories {
                    let exts = if *size == "scalable" { vec!["svg"] } else { vec!["png", "svg"] };
                    for ext in &exts {
                        let path = format!("{}/{}/{}/{}.{}", dir, size, cat, icon_name, ext);
                        if std::path::Path::new(&path).exists() {
                            if *ext == "svg" {
                                return Ok(Some(path));
                            }
                            // Convert PNG to base64 data URL
                            if let Ok(data) = tokio::fs::read(&path).await {
                                use base64::Engine;
                                let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
                                return Ok(Some(format!("data:image/png;base64,{}", b64)));
                            }
                        }
                    }
                }
            }
        }

        // Try pixmaps directly
        for ext in &["png", "svg", "xpm"] {
            let path = format!("/usr/share/pixmaps/{}.{}", icon_name, ext);
            if std::path::Path::new(&path).exists() {
                return Ok(Some(path));
            }
        }

        Ok(None)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = icon_name;
        Ok(None)
    }
}
