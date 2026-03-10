use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct FileDialogOptions {
    pub title: Option<String>,
    pub default_path: Option<String>,
    pub filters: Option<Vec<DialogFilter>>,
    pub multiple: Option<bool>,
}

#[derive(Deserialize)]
pub struct DialogFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Serialize)]
pub struct MessageBoxResult {
    pub response: u32,
}

#[tauri::command]
pub async fn dialog_open_file(options: Option<FileDialogOptions>) -> Result<Option<Vec<String>>, String> {
    use tauri_plugin_dialog::DialogExt;
    // For now, use native dialog via command
    #[cfg(target_os = "linux")]
    {
        let mut cmd = tokio::process::Command::new("zenity");
        cmd.arg("--file-selection");
        if let Some(opts) = &options {
            if let Some(title) = &opts.title {
                cmd.args(["--title", title]);
            }
            if opts.multiple.unwrap_or(false) {
                cmd.arg("--multiple");
                cmd.args(["--separator", "\n"]);
            }
        }
        let output = cmd.output().await.map_err(|e| e.to_string())?;
        if output.status.success() {
            let paths: Vec<String> = String::from_utf8_lossy(&output.stdout)
                .trim()
                .split('\n')
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
                .collect();
            Ok(Some(paths))
        } else {
            Ok(None) // User cancelled
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = options;
        Ok(None)
    }
}

#[tauri::command]
pub async fn dialog_open_directory(title: Option<String>) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let mut cmd = tokio::process::Command::new("zenity");
        cmd.args(["--file-selection", "--directory"]);
        if let Some(t) = &title {
            cmd.args(["--title", t]);
        }
        let output = cmd.output().await.map_err(|e| e.to_string())?;
        if output.status.success() {
            Ok(Some(String::from_utf8_lossy(&output.stdout).trim().to_string()))
        } else {
            Ok(None)
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = title;
        Ok(None)
    }
}

#[tauri::command]
pub async fn dialog_save_file(
    title: Option<String>,
    default_name: Option<String>,
) -> Result<Option<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let mut cmd = tokio::process::Command::new("zenity");
        cmd.args(["--file-selection", "--save", "--confirm-overwrite"]);
        if let Some(t) = &title {
            cmd.args(["--title", t]);
        }
        if let Some(name) = &default_name {
            cmd.args(["--filename", name]);
        }
        let output = cmd.output().await.map_err(|e| e.to_string())?;
        if output.status.success() {
            Ok(Some(String::from_utf8_lossy(&output.stdout).trim().to_string()))
        } else {
            Ok(None)
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (title, default_name);
        Ok(None)
    }
}

#[tauri::command]
pub async fn dialog_message_box(
    title: String,
    message: String,
    kind: Option<String>,
) -> Result<MessageBoxResult, String> {
    #[cfg(target_os = "linux")]
    {
        let dialog_type = match kind.as_deref() {
            Some("error") => "--error",
            Some("warning") => "--warning",
            Some("question") => "--question",
            _ => "--info",
        };
        let output = tokio::process::Command::new("zenity")
            .args([dialog_type, "--title", &title, "--text", &message])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        Ok(MessageBoxResult {
            response: if output.status.success() { 0 } else { 1 },
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (title, message, kind);
        Ok(MessageBoxResult { response: 0 })
    }
}
