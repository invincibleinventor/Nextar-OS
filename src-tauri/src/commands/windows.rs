use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct ExternalWindow {
    pub id: u64,
    pub title: String,
    pub app_id: String,
    pub class: String,
    pub pid: u32,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub minimized: bool,
    pub maximized: bool,
    pub fullscreen: bool,
    pub focused: bool,
    pub workspace: i32,
    pub icon_name: Option<String>,
}

#[tauri::command]
pub async fn external_window_list() -> Result<Vec<ExternalWindow>, String> {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            return wayland_window_list().await;
        }
        return x11_window_list().await;
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[cfg(target_os = "linux")]
async fn x11_window_list() -> Result<Vec<ExternalWindow>, String> {
    use x11rb::connection::Connection;
    use x11rb::protocol::xproto::*;
    use x11rb::rust_connection::RustConnection;

    let (conn, screen_num) = RustConnection::connect(None).map_err(|e| e.to_string())?;
    let screen = &conn.setup().roots[screen_num];
    let root = screen.root;

    // Get _NET_CLIENT_LIST
    let client_list_atom = conn
        .intern_atom(false, b"_NET_CLIENT_LIST")
        .map_err(|e| e.to_string())?
        .reply()
        .map_err(|e| e.to_string())?
        .atom;

    let net_wm_name = conn.intern_atom(false, b"_NET_WM_NAME").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_pid = conn.intern_atom(false, b"_NET_WM_PID").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_state = conn.intern_atom(false, b"_NET_WM_STATE").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_state_hidden = conn.intern_atom(false, b"_NET_WM_STATE_HIDDEN").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_state_maximized_v = conn.intern_atom(false, b"_NET_WM_STATE_MAXIMIZED_VERT").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_state_maximized_h = conn.intern_atom(false, b"_NET_WM_STATE_MAXIMIZED_HORZ").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_state_fullscreen = conn.intern_atom(false, b"_NET_WM_STATE_FULLSCREEN").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_wm_desktop = conn.intern_atom(false, b"_NET_WM_DESKTOP").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let net_active_window = conn.intern_atom(false, b"_NET_ACTIVE_WINDOW").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let utf8_string = conn.intern_atom(false, b"UTF8_STRING").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
    let wm_class = conn.intern_atom(false, b"WM_CLASS").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;

    // Get active window
    let active_reply = conn.get_property(false, root, net_active_window, AtomEnum::WINDOW, 0, 1)
        .map_err(|e| e.to_string())?.reply().ok();
    let active_window = active_reply
        .and_then(|r| r.value32().and_then(|mut v| v.next()))
        .unwrap_or(0);

    // Get client list
    let reply = conn
        .get_property(false, root, client_list_atom, AtomEnum::WINDOW, 0, 1024)
        .map_err(|e| e.to_string())?
        .reply()
        .map_err(|e| e.to_string())?;

    let window_ids: Vec<u32> = reply.value32().map(|v| v.collect()).unwrap_or_default();
    let mut windows = Vec::new();

    for wid in window_ids {
        // Get title
        let title_reply = conn.get_property(false, wid, net_wm_name, utf8_string, 0, 256)
            .ok().and_then(|c| c.reply().ok());
        let title = title_reply
            .and_then(|r| String::from_utf8(r.value.clone()).ok())
            .unwrap_or_default();

        // Get WM_CLASS
        let class_reply = conn.get_property(false, wid, wm_class, AtomEnum::STRING, 0, 256)
            .ok().and_then(|c| c.reply().ok());
        let (instance, class) = class_reply
            .map(|r| {
                let parts: Vec<&str> = std::str::from_utf8(&r.value).unwrap_or("").split('\0').collect();
                (parts.first().unwrap_or(&"").to_string(), parts.get(1).unwrap_or(&"").to_string())
            })
            .unwrap_or_default();

        // Get PID
        let pid_reply = conn.get_property(false, wid, net_wm_pid, AtomEnum::CARDINAL, 0, 1)
            .ok().and_then(|c| c.reply().ok());
        let pid = pid_reply.and_then(|r| r.value32().and_then(|mut v| v.next())).unwrap_or(0);

        // Get geometry
        let geom = conn.get_geometry(wid).ok().and_then(|c| c.reply().ok());
        let (x, y, width, height) = geom
            .map(|g| (g.x as i32, g.y as i32, g.width as u32, g.height as u32))
            .unwrap_or((0, 0, 0, 0));

        // Get state
        let state_reply = conn.get_property(false, wid, net_wm_state, AtomEnum::ATOM, 0, 32)
            .ok().and_then(|c| c.reply().ok());
        let states: Vec<u32> = state_reply
            .and_then(|r| r.value32().map(|v| v.collect()))
            .unwrap_or_default();

        let minimized = states.contains(&net_wm_state_hidden);
        let maximized = states.contains(&net_wm_state_maximized_v) && states.contains(&net_wm_state_maximized_h);
        let fullscreen = states.contains(&net_wm_state_fullscreen);

        // Get workspace
        let desktop_reply = conn.get_property(false, wid, net_wm_desktop, AtomEnum::CARDINAL, 0, 1)
            .ok().and_then(|c| c.reply().ok());
        let workspace = desktop_reply.and_then(|r| r.value32().and_then(|mut v| v.next())).unwrap_or(0) as i32;

        windows.push(ExternalWindow {
            id: wid as u64,
            title,
            app_id: instance.clone(),
            class,
            pid,
            x,
            y,
            width,
            height,
            minimized,
            maximized,
            fullscreen,
            focused: wid == active_window,
            workspace,
            icon_name: Some(instance),
        });
    }

    Ok(windows)
}

#[cfg(target_os = "linux")]
async fn wayland_window_list() -> Result<Vec<ExternalWindow>, String> {
    // On Wayland, we need wlr-foreign-toplevel-management or GNOME's ext-foreign-toplevel-list
    // For now, fall back to a D-Bus approach if available
    // This is a placeholder — full implementation requires Wayland protocol binding
    Ok(Vec::new())
}

#[tauri::command]
pub async fn external_window_focus(window_id: u64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        x11_send_client_message(window_id as u32, "_NET_ACTIVE_WINDOW", &[2, 0, 0, 0, 0])
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = window_id; Ok(()) }
}

#[tauri::command]
pub async fn external_window_minimize(window_id: u64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        use x11rb::connection::Connection;
        use x11rb::rust_connection::RustConnection;
        use x11rb::protocol::xproto::*;

        let (conn, _) = RustConnection::connect(None).map_err(|e| e.to_string())?;
        let wm_change_state = conn.intern_atom(false, b"WM_CHANGE_STATE").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
        let screen = &conn.setup().roots[0];

        let event = ClientMessageEvent::new(
            32,
            window_id as u32,
            wm_change_state,
            [3, 0, 0, 0, 0], // IconicState = 3
        );

        conn.send_event(false, screen.root, EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY, event)
            .map_err(|e| e.to_string())?;
        conn.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = window_id; Ok(()) }
}

#[tauri::command]
pub async fn external_window_maximize(window_id: u64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        use x11rb::connection::Connection;
        use x11rb::rust_connection::RustConnection;
        use x11rb::protocol::xproto::*;

        let (conn, _) = RustConnection::connect(None).map_err(|e| e.to_string())?;
        let net_wm_state = conn.intern_atom(false, b"_NET_WM_STATE").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
        let max_v = conn.intern_atom(false, b"_NET_WM_STATE_MAXIMIZED_VERT").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
        let max_h = conn.intern_atom(false, b"_NET_WM_STATE_MAXIMIZED_HORZ").map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;
        let screen = &conn.setup().roots[0];

        let event = ClientMessageEvent::new(
            32, window_id as u32, net_wm_state,
            [2, max_v, max_h, 0, 0], // _NET_WM_STATE_TOGGLE = 2
        );

        conn.send_event(false, screen.root, EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY, event)
            .map_err(|e| e.to_string())?;
        conn.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = window_id; Ok(()) }
}

#[tauri::command]
pub async fn external_window_close(window_id: u64) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        x11_send_client_message(window_id as u32, "_NET_CLOSE_WINDOW", &[0, 2, 0, 0, 0])
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = window_id; Ok(()) }
}

#[tauri::command]
pub async fn external_window_move(window_id: u64, x: i32, y: i32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        use x11rb::connection::Connection;
        use x11rb::protocol::xproto::*;
        use x11rb::rust_connection::RustConnection;

        let (conn, _) = RustConnection::connect(None).map_err(|e| e.to_string())?;
        conn.configure_window(window_id as u32, &ConfigureWindowAux::new().x(x).y(y))
            .map_err(|e| e.to_string())?;
        conn.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (window_id, x, y); Ok(()) }
}

#[tauri::command]
pub async fn external_window_resize(window_id: u64, width: u32, height: u32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        use x11rb::connection::Connection;
        use x11rb::protocol::xproto::*;
        use x11rb::rust_connection::RustConnection;

        let (conn, _) = RustConnection::connect(None).map_err(|e| e.to_string())?;
        conn.configure_window(window_id as u32, &ConfigureWindowAux::new().width(width).height(height))
            .map_err(|e| e.to_string())?;
        conn.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (window_id, width, height); Ok(()) }
}

#[cfg(target_os = "linux")]
fn x11_send_client_message(wid: u32, atom_name: &str, data: &[u32; 5]) -> Result<(), String> {
    use x11rb::connection::Connection;
    use x11rb::protocol::xproto::*;
    use x11rb::rust_connection::RustConnection;

    let (conn, screen_num) = RustConnection::connect(None).map_err(|e| e.to_string())?;
    let screen = &conn.setup().roots[screen_num];
    let atom = conn.intern_atom(false, atom_name.as_bytes()).map_err(|e| e.to_string())?.reply().map_err(|e| e.to_string())?.atom;

    let event = ClientMessageEvent::new(32, wid, atom, *data);
    conn.send_event(false, screen.root, EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY, event)
        .map_err(|e| e.to_string())?;
    conn.flush().map_err(|e| e.to_string())?;
    Ok(())
}
