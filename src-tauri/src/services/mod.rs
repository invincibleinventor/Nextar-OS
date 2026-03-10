pub mod state;

#[cfg(target_os = "linux")]
pub mod dbus_notifications;
#[cfg(target_os = "linux")]
pub mod dbus_screensaver;
#[cfg(target_os = "linux")]
pub mod dbus_tray;
#[cfg(target_os = "linux")]
pub mod dbus_global_menu;
#[cfg(target_os = "linux")]
pub mod dbus_power;
#[cfg(target_os = "linux")]
pub mod file_watcher;
#[cfg(target_os = "linux")]
pub mod pty_manager;

pub use state::AppState;

/// Start all background services
pub async fn start_all(app: tauri::AppHandle) {
    log::info!("Starting NextarOS background services...");

    #[cfg(target_os = "linux")]
    {
        // Start D-Bus notification daemon
        let app_clone = app.clone();
        tokio::spawn(async move {
            if let Err(e) = dbus_notifications::start(app_clone).await {
                log::error!("Notification daemon failed: {}", e);
            }
        });

        // Start system tray watcher
        let app_clone = app.clone();
        tokio::spawn(async move {
            if let Err(e) = dbus_tray::start(app_clone).await {
                log::error!("System tray watcher failed: {}", e);
            }
        });

        // Start global menu registrar
        let app_clone = app.clone();
        tokio::spawn(async move {
            if let Err(e) = dbus_global_menu::start(app_clone).await {
                log::error!("Global menu registrar failed: {}", e);
            }
        });

        // Start screensaver/lock D-Bus interface
        let app_clone = app.clone();
        tokio::spawn(async move {
            if let Err(e) = dbus_screensaver::start(app_clone).await {
                log::error!("ScreenSaver D-Bus service failed: {}", e);
            }
        });

        // Start power management listener
        let app_clone = app.clone();
        tokio::spawn(async move {
            if let Err(e) = dbus_power::start(app_clone).await {
                log::error!("Power management listener failed: {}", e);
            }
        });
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = app;
        log::info!("Non-Linux platform: D-Bus services skipped");
    }
}
