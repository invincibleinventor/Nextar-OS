//! Listen to logind/UPower D-Bus signals for power events

use tauri::Emitter;
use futures_util::StreamExt;
use zbus::Connection;

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let conn = Connection::system().await?;

    // Listen for PrepareForSleep from logind (suspend/resume)
    let app_clone = app.clone();
    let logind_proxy = zbus::Proxy::builder(&conn)
        .destination("org.freedesktop.login1")?
        .path("/org/freedesktop/login1")?
        .interface("org.freedesktop.login1.Manager")?
        .build()
        .await?;

    tokio::spawn(async move {
        let mut stream = logind_proxy
            .receive_signal("PrepareForSleep")
            .await
            .unwrap();
        while let Some(signal) = stream.next().await {
            if let Ok(args) = signal.body().deserialize::<(bool,)>() {
                let event = if args.0 { "suspend" } else { "resume" };
                let _ = app_clone.emit("power-event", event);
                log::info!("Power event: {}", event);
            }
        }
    });

    // Listen for PrepareForShutdown
    let app_clone = app.clone();
    let logind_proxy2 = zbus::Proxy::builder(&conn)
        .destination("org.freedesktop.login1")?
        .path("/org/freedesktop/login1")?
        .interface("org.freedesktop.login1.Manager")?
        .build()
        .await?;

    tokio::spawn(async move {
        let mut stream = logind_proxy2
            .receive_signal("PrepareForShutdown")
            .await
            .unwrap();
        while let Some(signal) = stream.next().await {
            if let Ok(args) = signal.body().deserialize::<(bool,)>() {
                if args.0 {
                    let _ = app_clone.emit("power-event", "shutdown");
                }
            }
        }
    });

    // Listen for Lock/Unlock from session
    let session_path = get_current_session_path(&conn).await;
    if let Some(session_path) = session_path {
        let app_clone = app.clone();
        let session_proxy = zbus::Proxy::builder(&conn)
            .destination("org.freedesktop.login1")?
            .path(zbus::zvariant::ObjectPath::try_from(session_path.as_str())?)?
            .interface("org.freedesktop.login1.Session")?
            .build()
            .await?;

        tokio::spawn(async move {
            let mut lock_stream = session_proxy.receive_signal("Lock").await.unwrap();
            while let Some(_) = lock_stream.next().await {
                let _ = app_clone.emit("session-action", "lock");
                log::info!("Session lock signal received");
            }
        });

        let app_clone = app.clone();
        let session_proxy2 = zbus::Proxy::builder(&conn)
            .destination("org.freedesktop.login1")?
            .path(zbus::zvariant::ObjectPath::try_from(session_path.as_str())?)?
            .interface("org.freedesktop.login1.Session")?
            .build()
            .await?;

        tokio::spawn(async move {
            let mut unlock_stream = session_proxy2.receive_signal("Unlock").await.unwrap();
            while let Some(_) = unlock_stream.next().await {
                let _ = app_clone.emit("session-action", "unlock");
            }
        });
    }

    // Listen for UPower device changes (battery)
    let app_clone = app.clone();
    let upower_conn = Connection::system().await?;
    let upower_proxy = zbus::Proxy::builder(&upower_conn)
        .destination("org.freedesktop.UPower")?
        .path("/org/freedesktop/UPower")?
        .interface("org.freedesktop.UPower")?
        .build()
        .await?;

    tokio::spawn(async move {
        // Watch for property changes on UPower
        let mut stream = upower_proxy.receive_all_signals().await.unwrap();
        while let Some(signal) = stream.next().await {
            let member = signal.member().map(|m| m.to_string()).unwrap_or_default();
            match member.as_str() {
                "DeviceChanged" | "Changed" => {
                    let _ = app_clone.emit("battery-changed", ());
                }
                _ => {}
            }
        }
    });

    log::info!("Power management listener started");
    std::future::pending::<()>().await;
    Ok(())
}

async fn get_current_session_path(conn: &Connection) -> Option<String> {
    let proxy = zbus::Proxy::builder(conn)
        .destination("org.freedesktop.login1").ok()?
        .path("/org/freedesktop/login1").ok()?
        .interface("org.freedesktop.login1.Manager").ok()?
        .build()
        .await
        .ok()?;

    let reply: (zbus::zvariant::OwnedObjectPath,) = proxy
        .call::<_, (&str,), (zbus::zvariant::OwnedObjectPath,)>("GetSession", &("auto",))
        .await
        .ok()?;

    Some(reply.0.to_string())
}
