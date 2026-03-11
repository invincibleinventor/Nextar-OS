//! com.canonical.AppMenu.Registrar D-Bus service
//! Captures GTK/Qt application menus and makes them available for the panel.

use std::collections::HashMap;
use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::RwLock;
use zbus::{interface, Connection, ConnectionBuilder};

use super::state::MenuItem;

/// Maps window XID → (bus name, menu object path)
struct MenuRegistrar {
    app: tauri::AppHandle,
    registrations: Arc<RwLock<HashMap<u32, (String, String)>>>,
}

#[interface(name = "com.canonical.AppMenu.Registrar")]
impl MenuRegistrar {
    /// Register a window's menu
    async fn register_window(&self, window_id: u32, service: &str, menu_path: zbus::zvariant::ObjectPath<'_>) {
        let mut regs = self.registrations.write().await;
        regs.insert(window_id, (service.to_string(), menu_path.to_string()));
        log::info!("Global menu registered for window {} → {}:{}", window_id, service, menu_path);

        let _ = self.app.emit("global-menu-registered", serde_json::json!({
            "windowId": window_id,
            "service": service,
            "menuPath": menu_path.as_str(),
        }));
    }

    /// Unregister a window's menu
    async fn unregister_window(&self, window_id: u32) {
        let mut regs = self.registrations.write().await;
        regs.remove(&window_id);
        let _ = self.app.emit("global-menu-unregistered", window_id);
    }

    /// Get the menu for a window
    async fn get_menu_for_window(&self, window_id: u32) -> (String, zbus::zvariant::OwnedObjectPath) {
        let regs = self.registrations.read().await;
        if let Some((service, path)) = regs.get(&window_id) {
            (
                service.clone(),
                zbus::zvariant::OwnedObjectPath::try_from(path.as_str()).unwrap_or_else(|_| {
                    zbus::zvariant::OwnedObjectPath::try_from("/").unwrap()
                }),
            )
        } else {
            (
                String::new(),
                zbus::zvariant::OwnedObjectPath::try_from("/").unwrap(),
            )
        }
    }
}

/// Fetch a com.canonical.dbusmenu menu tree from a service
pub async fn fetch_dbusmenu(
    service: &str,
    menu_path: &str,
) -> Result<Vec<MenuItem>, Box<dyn std::error::Error + Send + Sync>> {
    let conn = Connection::session().await?;
    let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
        .destination(zbus::names::BusName::try_from(service)?)?
        .path(zbus::zvariant::ObjectPath::try_from(menu_path)?)?
        .interface("com.canonical.dbusmenu")?
        .build()
        .await?;

    // GetLayout(parentId=0, recursionDepth=-1, propertyNames=[])
    let reply: (u32, (i32, HashMap<String, zbus::zvariant::OwnedValue>, Vec<zbus::zvariant::OwnedValue>)) =
        proxy.call::<_, (i32, i32, Vec<String>), _>("GetLayout", &(0i32, -1i32, Vec::<String>::new())).await?;

    let (_revision, root) = reply;
    let items = parse_menu_item(&root.2);
    Ok(items)
}

fn parse_menu_item(children: &[zbus::zvariant::OwnedValue]) -> Vec<MenuItem> {
    let mut items = Vec::new();
    for child in children {
        // Each child is a struct (id, props, children)
        if let Ok(tuple) = child.downcast_ref::<zbus::zvariant::Structure<'_>>() {
            let fields = tuple.fields();
            if fields.len() >= 3 {
                // In zbus 5, downcast_ref returns Result<T, _> where T is the value (not a reference)
                let id: i32 = fields[0].downcast_ref::<i32>().unwrap_or(0);

                // Parse properties dict: a{sv} → try to extract as HashMap<String, OwnedValue>
                let props: HashMap<String, String> = HashMap::<String, zbus::zvariant::OwnedValue>::try_from(fields[1].clone())
                    .unwrap_or_default()
                    .into_iter()
                    .filter_map(|(k, v)| {
                        String::try_from(v).ok().map(|s| (k, s))
                    })
                    .collect();

                let label = props.get("label").cloned().unwrap_or_default();
                let item_type = props.get("type").cloned().unwrap_or_else(|| "normal".into());
                let enabled = props.get("enabled").map(|v| v != "false").unwrap_or(true);
                let visible = props.get("visible").map(|v| v != "false").unwrap_or(true);
                let icon_name = props.get("icon-name").cloned();
                let shortcut = props.get("shortcut").cloned();
                let toggle_type = props.get("toggle-type").cloned();
                let toggle_state = props.get("toggle-state").and_then(|v| v.parse().ok());

                let sub_children = if let Some(arr) = fields.get(2) {
                    // Try to get children as Vec<OwnedValue>
                    Vec::<zbus::zvariant::OwnedValue>::try_from(arr.clone())
                        .map(|owned| parse_menu_item(&owned))
                        .unwrap_or_default()
                } else {
                    Vec::new()
                };

                let resolved_type = if item_type == "separator" { "separator".into() } else if !sub_children.is_empty() { "submenu".into() } else { "normal".into() };
                items.push(MenuItem {
                    id,
                    label,
                    enabled,
                    visible,
                    icon_name,
                    shortcut,
                    toggle_type,
                    toggle_state,
                    children: sub_children,
                    item_type: resolved_type,
                });
            }
        }
    }
    items
}

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let registrar = MenuRegistrar {
        app,
        registrations: Arc::new(RwLock::new(HashMap::new())),
    };

    let _conn = ConnectionBuilder::session()?
        .name("com.canonical.AppMenu.Registrar")?
        .serve_at("/com/canonical/AppMenu/Registrar", registrar)?
        .build()
        .await?;

    log::info!("Global menu registrar started on com.canonical.AppMenu.Registrar");
    std::future::pending::<()>().await;
    Ok(())
}
