//! org.freedesktop.ScreenSaver D-Bus interface
//! Allows apps to inhibit screen saver and provides lock/unlock signals.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::RwLock;
use zbus::interface;
use zbus::object_server::SignalEmitter;

static NEXT_COOKIE: AtomicU32 = AtomicU32::new(1);

struct ScreenSaver {
    app: tauri::AppHandle,
    inhibitors: Arc<RwLock<HashMap<u32, Inhibitor>>>,
    active: Arc<RwLock<bool>>,
}

struct Inhibitor {
    app_name: String,
    reason: String,
}

#[interface(name = "org.freedesktop.ScreenSaver")]
impl ScreenSaver {
    /// Inhibit the screensaver (e.g. during video playback)
    async fn inhibit(&self, app_name: &str, reason: &str) -> u32 {
        let cookie = NEXT_COOKIE.fetch_add(1, Ordering::SeqCst);
        let mut inhibitors = self.inhibitors.write().await;
        inhibitors.insert(cookie, Inhibitor {
            app_name: app_name.to_string(),
            reason: reason.to_string(),
        });
        log::info!("ScreenSaver inhibited by '{}': {} (cookie={})", app_name, reason, cookie);
        let _ = self.app.emit("screensaver-inhibit-changed", serde_json::json!({
            "inhibited": true,
            "count": inhibitors.len(),
            "app": app_name,
            "reason": reason,
        }));
        cookie
    }

    /// Remove an inhibitor
    async fn un_inhibit(&self, cookie: u32) {
        let mut inhibitors = self.inhibitors.write().await;
        if let Some(inh) = inhibitors.remove(&cookie) {
            log::info!("ScreenSaver uninhibited by '{}' (cookie={})", inh.app_name, cookie);
        }
        let _ = self.app.emit("screensaver-inhibit-changed", serde_json::json!({
            "inhibited": !inhibitors.is_empty(),
            "count": inhibitors.len(),
        }));
    }

    /// Lock the screen
    async fn lock(&self) {
        let _ = self.app.emit("session-action", "lock");
    }

    /// Simulate user activity (reset idle timer)
    async fn simulate_user_activity(&self) {
        // Reset idle timer in frontend
        let _ = self.app.emit("user-activity", ());
    }

    /// Get active state
    async fn get_active(&self) -> bool {
        *self.active.read().await
    }

    /// Set active state (lock/unlock)
    async fn set_active(&self, active: bool) {
        *self.active.write().await = active;
        if active {
            let _ = self.app.emit("session-action", "lock");
        } else {
            let _ = self.app.emit("session-action", "unlock");
        }
    }

    /// Get idle time in seconds
    fn get_active_time(&self) -> u32 {
        0 // TODO: track actual idle time
    }

    #[zbus(signal)]
    async fn active_changed(signal_ctxt: &SignalEmitter<'_>, active: bool) -> zbus::Result<()>;
}

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let screensaver = ScreenSaver {
        app,
        inhibitors: Arc::new(RwLock::new(HashMap::new())),
        active: Arc::new(RwLock::new(false)),
    };

    let _conn = zbus::connection::Builder::session()?
        .name("org.freedesktop.ScreenSaver")?
        .serve_at("/org/freedesktop/ScreenSaver", screensaver)?
        .build()
        .await?;

    log::info!("ScreenSaver D-Bus service started");
    std::future::pending::<()>().await;
    Ok(())
}
