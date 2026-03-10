//! EWMH (Extended Window Manager Hints) helper for X11
//! Sets _NET_SUPPORTED and other WM hints on the root window

use x11rb::connection::Connection;
use x11rb::protocol::xproto::*;
use x11rb::rust_connection::RustConnection;

/// Set up EWMH hints on the root window to advertise our WM capabilities
pub fn setup_ewmh_hints() -> Result<(), Box<dyn std::error::Error>> {
    let (conn, screen_num) = RustConnection::connect(None)?;
    let screen = &conn.setup().roots[screen_num];
    let root = screen.root;

    // Intern all atoms we need
    let atoms: Vec<(&str, Atom)> = [
        "_NET_SUPPORTED",
        "_NET_SUPPORTING_WM_CHECK",
        "_NET_WM_NAME",
        "_NET_CLIENT_LIST",
        "_NET_CLIENT_LIST_STACKING",
        "_NET_ACTIVE_WINDOW",
        "_NET_CURRENT_DESKTOP",
        "_NET_NUMBER_OF_DESKTOPS",
        "_NET_DESKTOP_NAMES",
        "_NET_WM_STATE",
        "_NET_WM_STATE_MAXIMIZED_VERT",
        "_NET_WM_STATE_MAXIMIZED_HORZ",
        "_NET_WM_STATE_FULLSCREEN",
        "_NET_WM_STATE_HIDDEN",
        "_NET_WM_STATE_ABOVE",
        "_NET_WM_STATE_BELOW",
        "_NET_WM_STATE_DEMANDS_ATTENTION",
        "_NET_WM_WINDOW_TYPE",
        "_NET_WM_WINDOW_TYPE_NORMAL",
        "_NET_WM_WINDOW_TYPE_DIALOG",
        "_NET_WM_WINDOW_TYPE_DOCK",
        "_NET_WM_WINDOW_TYPE_TOOLBAR",
        "_NET_WM_WINDOW_TYPE_MENU",
        "_NET_WM_WINDOW_TYPE_NOTIFICATION",
        "_NET_WM_DESKTOP",
        "_NET_CLOSE_WINDOW",
        "_NET_MOVERESIZE_WINDOW",
        "_NET_WM_STRUT_PARTIAL",
        "_NET_WM_PID",
        "_NET_FRAME_EXTENTS",
        "_NET_WM_ICON",
        "_NET_SYSTEM_TRAY_S0",
    ]
    .iter()
    .map(|name| {
        let atom = conn.intern_atom(false, name.as_bytes())
            .unwrap()
            .reply()
            .unwrap()
            .atom;
        (*name, atom)
    })
    .collect();

    let net_supported = atoms.iter().find(|(n, _)| *n == "_NET_SUPPORTED").unwrap().1;
    let utf8_string = conn.intern_atom(false, b"UTF8_STRING")?.reply()?.atom;

    // Set _NET_SUPPORTED on root
    let supported_atoms: Vec<Atom> = atoms.iter().map(|(_, a)| *a).collect();
    conn.change_property32(
        PropMode::REPLACE,
        root,
        net_supported,
        AtomEnum::ATOM,
        &supported_atoms,
    )?;

    // Create a child window for _NET_SUPPORTING_WM_CHECK
    let check_win = conn.generate_id()?;
    conn.create_window(
        0,
        check_win,
        root,
        0, 0, 1, 1, 0,
        WindowClass::INPUT_ONLY,
        0,
        &CreateWindowAux::default(),
    )?;

    let wm_check = atoms.iter().find(|(n, _)| *n == "_NET_SUPPORTING_WM_CHECK").unwrap().1;
    let net_wm_name = atoms.iter().find(|(n, _)| *n == "_NET_WM_NAME").unwrap().1;

    conn.change_property32(PropMode::REPLACE, root, wm_check, AtomEnum::WINDOW, &[check_win])?;
    conn.change_property32(PropMode::REPLACE, check_win, wm_check, AtomEnum::WINDOW, &[check_win])?;
    conn.change_property8(PropMode::REPLACE, check_win, net_wm_name, utf8_string, b"NextarOS")?;

    // Set number of desktops
    let num_desktops = atoms.iter().find(|(n, _)| *n == "_NET_NUMBER_OF_DESKTOPS").unwrap().1;
    conn.change_property32(PropMode::REPLACE, root, num_desktops, AtomEnum::CARDINAL, &[4])?;

    // Set current desktop
    let current_desktop = atoms.iter().find(|(n, _)| *n == "_NET_CURRENT_DESKTOP").unwrap().1;
    conn.change_property32(PropMode::REPLACE, root, current_desktop, AtomEnum::CARDINAL, &[0])?;

    // Set desktop names
    let desktop_names = atoms.iter().find(|(n, _)| *n == "_NET_DESKTOP_NAMES").unwrap().1;
    let names = "Workspace 1\0Workspace 2\0Workspace 3\0Workspace 4\0";
    conn.change_property8(PropMode::REPLACE, root, desktop_names, utf8_string, names.as_bytes())?;

    conn.flush()?;
    log::info!("EWMH hints set on root window");
    Ok(())
}
