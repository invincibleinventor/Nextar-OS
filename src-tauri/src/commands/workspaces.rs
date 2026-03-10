use serde::Serialize;
use tauri::State;
use crate::services::AppState;

#[derive(Serialize)]
pub struct WorkspaceInfo {
    pub current: usize,
    pub count: usize,
    pub names: Vec<String>,
}

#[tauri::command]
pub async fn workspace_list(state: State<'_, AppState>) -> Result<WorkspaceInfo, String> {
    let ws = state.workspaces.read().await;
    Ok(WorkspaceInfo {
        current: ws.current,
        count: ws.count,
        names: ws.names.clone(),
    })
}

#[tauri::command]
pub async fn workspace_switch(index: usize, state: State<'_, AppState>) -> Result<(), String> {
    let mut ws = state.workspaces.write().await;
    if index >= ws.count { return Err("Invalid workspace index".into()); }
    ws.current = index;

    // On X11, also switch via EWMH
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WAYLAND_DISPLAY").is_err() {
            use x11rb::connection::Connection;
            use x11rb::protocol::xproto::*;
            use x11rb::rust_connection::RustConnection;

            if let Ok((conn, screen_num)) = RustConnection::connect(None) {
                let screen = &conn.setup().roots[screen_num];
                let atom = conn.intern_atom(false, b"_NET_CURRENT_DESKTOP").ok()
                    .and_then(|c| c.reply().ok()).map(|r| r.atom);
                if let Some(atom) = atom {
                    let event = ClientMessageEvent::new(32, screen.root, atom, [index as u32, 0, 0, 0, 0]);
                    let _ = conn.send_event(false, screen.root, EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY, event);
                    let _ = conn.flush();
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn workspace_move_window(window_id: u64, workspace: usize, state: State<'_, AppState>) -> Result<(), String> {
    let ws = state.workspaces.read().await;
    if workspace >= ws.count { return Err("Invalid workspace".into()); }

    #[cfg(target_os = "linux")]
    {
        if std::env::var("WAYLAND_DISPLAY").is_err() {
            use x11rb::connection::Connection;
            use x11rb::protocol::xproto::*;
            use x11rb::rust_connection::RustConnection;

            if let Ok((conn, screen_num)) = RustConnection::connect(None) {
                let screen = &conn.setup().roots[screen_num];
                let atom = conn.intern_atom(false, b"_NET_WM_DESKTOP").ok()
                    .and_then(|c| c.reply().ok()).map(|r| r.atom);
                if let Some(atom) = atom {
                    let event = ClientMessageEvent::new(32, window_id as u32, atom, [workspace as u32, 2, 0, 0, 0]);
                    let _ = conn.send_event(false, screen.root, EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY, event);
                    let _ = conn.flush();
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn workspace_create(name: Option<String>, state: State<'_, AppState>) -> Result<usize, String> {
    let mut ws = state.workspaces.write().await;
    let idx = ws.count;
    ws.count += 1;
    let ws_name = name.unwrap_or_else(|| format!("Workspace {}", ws.count));
    ws.names.push(ws_name);
    Ok(idx)
}

#[tauri::command]
pub async fn workspace_remove(index: usize, state: State<'_, AppState>) -> Result<(), String> {
    let mut ws = state.workspaces.write().await;
    if ws.count <= 1 { return Err("Cannot remove last workspace".into()); }
    if index >= ws.count { return Err("Invalid workspace index".into()); }
    ws.count -= 1;
    ws.names.remove(index);
    if ws.current >= ws.count { ws.current = ws.count - 1; }
    Ok(())
}
