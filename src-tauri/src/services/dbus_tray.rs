//! StatusNotifierWatcher + StatusNotifierHost D-Bus service
//! Captures system tray icons from all running applications.

use std::collections::HashMap;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;
use zbus::{interface, Connection, ConnectionBuilder, MatchRule, MessageStream};
use zbus::names::BusName;
use futures_util::StreamExt;

use super::state::TrayItem;

struct StatusNotifierWatcher {
    app: tauri::AppHandle,
    items: Arc<RwLock<Vec<String>>>,
    hosts: Arc<RwLock<Vec<String>>>,
}

#[interface(name = "org.kde.StatusNotifierWatcher")]
impl StatusNotifierWatcher {
    /// Called by apps to register their tray icon
    async fn register_status_notifier_item(&self, service: &str) {
        let mut items = self.items.write().await;
        let full_service = service.to_string();
        if !items.contains(&full_service) {
            items.push(full_service.clone());
            log::info!("Tray item registered: {}", service);

            // Fetch item properties and send to frontend
            let app = self.app.clone();
            let svc = full_service.clone();
            tokio::spawn(async move {
                if let Ok(item) = fetch_tray_item_props(&svc).await {
                    let _ = app.emit("tray-item-registered", &item);
                    // Update state
                    if let Some(state) = app.try_state::<super::state::AppState>() {
                        state.tray_items.write().await.push(item);
                    }
                }
            });
        }
    }

    /// Called by DE to register as host
    async fn register_status_notifier_host(&self, service: &str) {
        let mut hosts = self.hosts.write().await;
        if !hosts.contains(&service.to_string()) {
            hosts.push(service.to_string());
        }
    }

    /// List registered items
    #[zbus(property)]
    async fn registered_status_notifier_items(&self) -> Vec<String> {
        self.items.read().await.clone()
    }

    /// Whether a host is registered
    #[zbus(property)]
    async fn is_status_notifier_host_registered(&self) -> bool {
        true // We ARE the host
    }

    /// Protocol version
    #[zbus(property)]
    fn protocol_version(&self) -> i32 {
        0
    }

    #[zbus(signal)]
    async fn status_notifier_item_registered(ctxt: &zbus::SignalContext<'_>, service: &str) -> zbus::Result<()>;

    #[zbus(signal)]
    async fn status_notifier_item_unregistered(ctxt: &zbus::SignalContext<'_>, service: &str) -> zbus::Result<()>;

    #[zbus(signal)]
    async fn status_notifier_host_registered(ctxt: &zbus::SignalContext<'_>) -> zbus::Result<()>;
}

/// Fetch properties from a StatusNotifierItem service
async fn fetch_tray_item_props(service: &str) -> Result<TrayItem, Box<dyn std::error::Error + Send + Sync>> {
    let conn = Connection::session().await?;

    // The path is usually /StatusNotifierItem
    let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
        .destination(BusName::try_from(service)?)?
        .path("/StatusNotifierItem")?
        .interface("org.kde.StatusNotifierItem")?
        .build()
        .await?;

    let title: String = proxy.get_property("Title").await.unwrap_or_default();
    let icon_name: String = proxy.get_property("IconName").await.unwrap_or_default();
    let tooltip_text = proxy
        .get_property::<(String, Vec<(i32, i32, Vec<u8>)>, String, String)>("ToolTip")
        .await
        .map(|t: (String, Vec<(i32, i32, Vec<u8>)>, String, String)| t.2)
        .unwrap_or_default();
    let category: String = proxy.get_property("Category").await.unwrap_or_default();
    let status: String = proxy.get_property("Status").await.unwrap_or_default();
    let menu_path: String = proxy.get_property::<zbus::zvariant::OwnedObjectPath>("Menu").await
        .map(|p: zbus::zvariant::OwnedObjectPath| p.to_string())
        .unwrap_or_else(|_| "/MenuBar".into());

    Ok(TrayItem {
        id: service.to_string(),
        service: service.to_string(),
        title,
        icon_name,
        icon_data: None,
        tooltip: tooltip_text,
        menu_path,
        category,
        status,
    })
}

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let watcher = StatusNotifierWatcher {
        app: app.clone(),
        items: Arc::new(RwLock::new(Vec::new())),
        hosts: Arc::new(RwLock::new(Vec::new())),
    };

    let conn = ConnectionBuilder::session()?
        .name("org.kde.StatusNotifierWatcher")?
        .serve_at("/StatusNotifierWatcher", watcher)?
        .build()
        .await?;

    log::info!("StatusNotifierWatcher D-Bus service started");

    // Also register ourselves as a host
    {
        if let Ok(proxy) = async {
            let p: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
                .destination("org.kde.StatusNotifierWatcher")?
                .path("/StatusNotifierWatcher")?
                .interface("org.kde.StatusNotifierWatcher")?
                .build()
                .await?;
            Ok::<zbus::Proxy<'_>, zbus::Error>(p)
        }.await {
            let _ = proxy.call::<_, (&str,), ()>("RegisterStatusNotifierHost", &("org.nextaros.Desktop",)).await;
        }
    }

    // Watch for NameOwnerChanged to detect when tray items exit
    let app_clone = app.clone();
    tokio::spawn(async move {
        let conn = match Connection::session().await {
            Ok(c) => c,
            Err(_) => return,
        };
        let rule = MatchRule::builder()
            .msg_type(zbus::message::Type::Signal)
            .sender("org.freedesktop.DBus")
            .unwrap()
            .interface("org.freedesktop.DBus")
            .unwrap()
            .member("NameOwnerChanged")
            .unwrap()
            .build();

        let mut stream = MessageStream::for_match_rule(rule, &conn, None).await.unwrap();
        while let Some(Ok(msg)) = stream.next().await {
            if let Ok((name, _old, new)) = msg.body().deserialize::<(String, String, String)>()
            {
                if new.is_empty() {
                    // Service disappeared — remove from tray
                    if let Some(state) = app_clone.try_state::<super::state::AppState>() {
                        let mut items = state.tray_items.write().await;
                        items.retain(|i| i.service != name);
                        let _ = app_clone.emit("tray-item-unregistered", &name);
                    }
                }
            }
        }
    });

    std::future::pending::<()>().await;
    Ok(())
}
