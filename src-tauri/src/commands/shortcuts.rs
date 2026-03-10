use tauri::Emitter;

pub fn register_global_shortcuts(app: tauri::AppHandle, is_session: bool) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let shortcuts = if is_session {
        vec![
            ("Super+Space", "search"),
            ("Super+Tab", "app-switcher"),
            ("Super+L", "lock"),
            ("Super+E", "file-manager"),
            ("Super+T", "terminal"),
            ("Alt+F2", "run-dialog"),
            ("Print", "screenshot"),
            ("Alt+Print", "screenshot-window"),
            ("Shift+Print", "screenshot-area"),
            ("Ctrl+Alt+Delete", "system-menu"),
            ("Super+D", "show-desktop"),
            ("Super+M", "notification-center"),
            ("Super+A", "app-launcher"),
            ("Super+Left", "snap-left"),
            ("Super+Right", "snap-right"),
            ("Super+Up", "maximize"),
            ("Super+Down", "restore"),
            ("Ctrl+Super+Left", "workspace-prev"),
            ("Ctrl+Super+Right", "workspace-next"),
            ("Super+1", "workspace-1"),
            ("Super+2", "workspace-2"),
            ("Super+3", "workspace-3"),
            ("Super+4", "workspace-4"),
            ("Ctrl+Alt+T", "terminal"),
            ("Super+I", "settings"),
        ]
    } else {
        vec![
            ("Super+Space", "search"),
            ("Super+Tab", "app-switcher"),
        ]
    };

    for (key, action) in shortcuts {
        let app_clone = app.clone();
        let action_str = action.to_string();
        if let Err(e) = app.global_shortcut().on_shortcut(key, move |_app, _shortcut, _event| {
            let _ = app_clone.emit("global-shortcut", &action_str);
        }) {
            log::warn!("Failed to register shortcut {}: {}", key, e);
        }
    }
}
