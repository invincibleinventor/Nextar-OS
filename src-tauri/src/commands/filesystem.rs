use serde::Serialize;
use std::path::PathBuf;
use tauri::{Emitter, State};
use crate::services::AppState;

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_symlink: bool,
    pub size: u64,
    pub modified: Option<u64>,
    pub created: Option<u64>,
    pub permissions: Option<String>,
    pub mime_type: Option<String>,
}

#[derive(Serialize)]
pub struct FileStats {
    pub size: u64,
    pub is_dir: bool,
    pub is_file: bool,
    pub is_symlink: bool,
    pub modified: Option<u64>,
    pub created: Option<u64>,
    pub accessed: Option<u64>,
    pub permissions: Option<String>,
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_file_binary(path: String) -> Result<Vec<u8>, String> {
    tokio::fs::read(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent dir exists
    if let Some(parent) = PathBuf::from(&path).parent() {
        let _ = tokio::fs::create_dir_all(parent).await;
    }
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file_binary(path: String, content: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = PathBuf::from(&path).parent() {
        let _ = tokio::fs::create_dir_all(parent).await;
    }
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    let mut dir = tokio::fs::read_dir(&path).await.map_err(|e| e.to_string())?;

    while let Ok(Some(entry)) = dir.next_entry().await {
        let metadata = entry.metadata().await.ok();
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path().to_string_lossy().to_string();

        let mime = if metadata.as_ref().map(|m| m.is_file()).unwrap_or(false) {
            mime_guess::from_path(&full_path)
                .first()
                .map(|m| m.to_string())
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: full_path,
            is_dir: metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false),
            is_file: metadata.as_ref().map(|m| m.is_file()).unwrap_or(false),
            is_symlink: metadata.as_ref().map(|m| m.is_symlink()).unwrap_or(false),
            size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
            modified: metadata.as_ref().and_then(|m| {
                m.modified().ok().and_then(|t| {
                    t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
                })
            }),
            created: metadata.as_ref().and_then(|m| {
                m.created().ok().and_then(|t| {
                    t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
                })
            }),
            permissions: {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    metadata.as_ref().map(|m| format!("{:o}", m.permissions().mode()))
                }
                #[cfg(not(unix))]
                { None }
            },
            mime_type: mime,
        });
    }

    // Sort: dirs first, then alphabetically
    entries.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}

#[tauri::command]
pub async fn get_file_stats(path: String) -> Result<FileStats, String> {
    let metadata = tokio::fs::metadata(&path).await.map_err(|e| e.to_string())?;

    Ok(FileStats {
        size: metadata.len(),
        is_dir: metadata.is_dir(),
        is_file: metadata.is_file(),
        is_symlink: metadata.is_symlink(),
        modified: metadata.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
        }),
        created: metadata.created().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
        }),
        accessed: metadata.accessed().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
        }),
        permissions: {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                Some(format!("{:o}", metadata.permissions().mode()))
            }
            #[cfg(not(unix))]
            { None }
        },
    })
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    tokio::fs::create_dir_all(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_path(path: String, recursive: Option<bool>) -> Result<(), String> {
    let metadata = tokio::fs::metadata(&path).await.map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        if recursive.unwrap_or(false) {
            tokio::fs::remove_dir_all(&path).await.map_err(|e| e.to_string())
        } else {
            tokio::fs::remove_dir(&path).await.map_err(|e| e.to_string())
        }
    } else {
        tokio::fs::remove_file(&path).await.map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    tokio::fs::rename(&old_path, &new_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn copy_path(source: String, dest: String) -> Result<(), String> {
    let metadata = tokio::fs::metadata(&source).await.map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        copy_dir_recursive(&source, &dest).await.map_err(|e| e.to_string())
    } else {
        tokio::fs::copy(&source, &dest).await.map(|_| ()).map_err(|e| e.to_string())
    }
}

async fn copy_dir_recursive(src: &str, dst: &str) -> std::io::Result<()> {
    tokio::fs::create_dir_all(dst).await?;
    let mut dir = tokio::fs::read_dir(src).await?;
    while let Some(entry) = dir.next_entry().await? {
        let src_path = entry.path();
        let dst_path = PathBuf::from(dst).join(entry.file_name());
        if entry.metadata().await?.is_dir() {
            Box::pin(copy_dir_recursive(
                &src_path.to_string_lossy(),
                &dst_path.to_string_lossy(),
            ))
            .await?;
        } else {
            tokio::fs::copy(&src_path, &dst_path).await?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn trash_path(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn watch_start(
    path: String,
    recursive: Option<bool>,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};

    let id = uuid::Uuid::new_v4().to_string();
    let watch_id = id.clone();
    let app_clone = app.clone();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let paths: Vec<String> = event
                        .paths
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();
                    let _ = app_clone.emit(
                        "fs-watch-change",
                        serde_json::json!({
                            "id": watch_id,
                            "kind": format!("{:?}", event.kind),
                            "paths": paths,
                        }),
                    );
                }
                Err(e) => {
                    let _ = app_clone.emit(
                        "fs-watch-error",
                        serde_json::json!({
                            "id": watch_id,
                            "error": e.to_string(),
                        }),
                    );
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    let mode = if recursive.unwrap_or(false) {
        RecursiveMode::Recursive
    } else {
        RecursiveMode::NonRecursive
    };

    watcher
        .watch(std::path::Path::new(&path), mode)
        .map_err(|e| e.to_string())?;

    state.file_watchers.write().await.insert(id.clone(), watcher);
    Ok(id)
}

#[tauri::command]
pub async fn watch_stop(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.file_watchers.write().await.remove(&id);
    Ok(())
}
