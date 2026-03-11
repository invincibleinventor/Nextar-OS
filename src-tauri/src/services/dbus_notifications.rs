//! org.freedesktop.Notifications D-Bus daemon
//! Receives notifications from all apps and forwards them to the frontend.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use tauri::{Emitter, Manager};
use zbus::{interface, Connection, ConnectionBuilder};

use super::state::NotificationRecord;

static NEXT_ID: AtomicU32 = AtomicU32::new(1);

struct NotificationDaemon {
    app: tauri::AppHandle,
}

#[interface(name = "org.freedesktop.Notifications")]
impl NotificationDaemon {
    /// Notify — the main notification method
    async fn notify(
        &self,
        app_name: &str,
        replaces_id: u32,
        app_icon: &str,
        summary: &str,
        body: &str,
        actions: Vec<String>,
        hints: HashMap<String, zbus::zvariant::Value<'_>>,
        expire_timeout: i32,
    ) -> u32 {
        let id = if replaces_id > 0 {
            replaces_id
        } else {
            NEXT_ID.fetch_add(1, Ordering::SeqCst)
        };

        let urgency = hints
            .get("urgency")
            .and_then(|v| {
                if let zbus::zvariant::Value::U8(u) = v { Some(*u) } else { None }
            })
            .unwrap_or(1);

        let record = NotificationRecord {
            id,
            app_name: app_name.to_string(),
            summary: summary.to_string(),
            body: body.to_string(),
            icon: app_icon.to_string(),
            urgency,
            actions: actions.clone(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };

        // Store in history
        if let Some(state) = self.app.try_state::<super::state::AppState>() {
            let mut history = state.notification_history.write().await;
            // Replace if same ID exists
            if let Some(pos) = history.iter().position(|n| n.id == id) {
                history[pos] = record.clone();
            } else {
                history.push(record.clone());
            }
            // Cap at 200
            if history.len() > 200 {
                let excess = history.len() - 200;
                history.drain(0..excess);
            }
        }

        // Check DND
        let dnd = if let Some(state) = self.app.try_state::<super::state::AppState>() {
            *state.dnd_enabled.read().await
        } else {
            false
        };

        // Forward to frontend (unless DND and non-critical)
        if !dnd || urgency >= 2 {
            let _ = self.app.emit("notification-received", &record);
        }

        log::debug!(
            "Notification #{} from '{}': {} (urgency={}, timeout={}ms)",
            id, app_name, summary, urgency, expire_timeout
        );

        id
    }

    /// Close a notification
    async fn close_notification(&self, id: u32) {
        let _ = self.app.emit("notification-closed", id);
    }

    /// GetCapabilities
    fn get_capabilities(&self) -> Vec<String> {
        vec![
            "actions".into(),
            "body".into(),
            "body-hyperlinks".into(),
            "body-markup".into(),
            "icon-static".into(),
            "persistence".into(),
            "sound".into(),
        ]
    }

    /// GetServerInformation
    fn get_server_information(&self) -> (String, String, String, String) {
        (
            "NextarOS".into(),
            "nextaros.com".into(),
            "1.0.0".into(),
            "1.2".into(), // spec version
        )
    }

    /// Signals
    #[zbus(signal)]
    async fn notification_closed(signal_ctxt: &zbus::SignalContext<'_>, id: u32, reason: u32) -> zbus::Result<()>;

    #[zbus(signal)]
    async fn action_invoked(signal_ctxt: &zbus::SignalContext<'_>, id: u32, action_key: &str) -> zbus::Result<()>;
}

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let daemon = NotificationDaemon { app };

    let _conn = ConnectionBuilder::session()?
        .name("org.freedesktop.Notifications")?
        .serve_at("/org/freedesktop/Notifications", daemon)?
        .build()
        .await?;

    log::info!("Notification daemon started on org.freedesktop.Notifications");

    // Keep alive
    std::future::pending::<()>().await;
    Ok(())
}
