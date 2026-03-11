use tauri::State;
use crate::services::AppState;
use crate::services::state::{TrayItem, MenuItem};

#[tauri::command]
pub async fn tray_get_items(state: State<'_, AppState>) -> Result<Vec<TrayItem>, String> {
    Ok(state.tray_items.read().await.clone())
}

#[tauri::command]
pub async fn tray_item_activate(service: String, x: i32, y: i32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::session().await.map_err(|e| e.to_string())?;
        let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
            .destination(zbus::names::BusName::try_from(service.as_str()).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?
            .path("/StatusNotifierItem").map_err(|e| e.to_string())?
            .interface("org.kde.StatusNotifierItem").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;
        proxy.call::<_, (i32, i32), ()>("Activate", &(x, y)).await.map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (service, x, y); Ok(()) }
}

#[tauri::command]
pub async fn tray_item_menu(service: String, menu_path: String) -> Result<Vec<MenuItem>, String> {
    #[cfg(target_os = "linux")]
    {
        crate::services::dbus_global_menu::fetch_dbusmenu(&service, &menu_path)
            .await
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (service, menu_path); Ok(Vec::new()) }
}
