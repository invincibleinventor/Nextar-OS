use tauri::{Manager, WebviewWindow};

fn get_main_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".into())
}

#[tauri::command]
pub fn minimize_window(app: tauri::AppHandle) -> Result<(), String> {
    get_main_window(&app)?.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn maximize_window(app: tauri::AppHandle) -> Result<(), String> {
    let w = get_main_window(&app)?;
    if w.is_maximized().unwrap_or(false) {
        w.unmaximize().map_err(|e| e.to_string())
    } else {
        w.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn close_window(app: tauri::AppHandle) -> Result<(), String> {
    get_main_window(&app)?.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_maximized(app: tauri::AppHandle) -> Result<bool, String> {
    get_main_window(&app)?.is_maximized().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_fullscreen(app: tauri::AppHandle, fullscreen: bool) -> Result<(), String> {
    get_main_window(&app)?
        .set_fullscreen(fullscreen)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_fullscreen(app: tauri::AppHandle) -> Result<bool, String> {
    get_main_window(&app)?
        .is_fullscreen()
        .map_err(|e| e.to_string())
}
