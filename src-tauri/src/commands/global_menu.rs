use crate::services::state::MenuItem;

#[tauri::command]
pub async fn menu_get_for_window(window_id: u64) -> Result<Vec<MenuItem>, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::session().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "com.canonical.AppMenu.Registrar",
            "/com/canonical/AppMenu/Registrar",
            "com.canonical.AppMenu.Registrar",
        ).await.map_err(|e| e.to_string())?;

        let (service, menu_path): (String, zbus::zvariant::OwnedObjectPath) = proxy
            .call("GetMenuForWindow", &(window_id as u32,))
            .await
            .map_err(|e| e.to_string())?;

        if service.is_empty() { return Ok(Vec::new()); }

        crate::services::dbus_global_menu::fetch_dbusmenu(&service, menu_path.as_str())
            .await
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = window_id; Ok(Vec::new()) }
}

#[tauri::command]
pub async fn menu_activate_item(service: String, menu_path: String, item_id: i32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::session().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(&conn, &service, &menu_path, "com.canonical.dbusmenu")
            .await.map_err(|e| e.to_string())?;

        // Event(id, eventId, data, timestamp)
        proxy.call::<_, ()>("Event", &(
            item_id,
            "clicked",
            zbus::zvariant::Value::new(0i32),
            0u32,
        )).await.map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = (service, menu_path, item_id); Ok(()) }
}
