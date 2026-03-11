//! Listen to logind/UPower D-Bus signals for power events

use tauri::Emitter;
use futures_util::StreamExt;

pub async fn start(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Listen for PrepareForSleep from logind (suspend/resume)
    let app_clone = app.clone();
    tokio::spawn(async move {
        let conn = match zbus::Connection::system().await {
            Ok(c) => c,
            Err(e) => { log::error!("D-Bus connect failed for sleep listener: {}", e); return; }
        };
        let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
            .destination("org.freedesktop.login1").unwrap()
            .path("/org/freedesktop/login1").unwrap()
            .interface("org.freedesktop.login1.Manager").unwrap()
            .build()
            .await
        {
            Ok(p) => p,
            Err(e) => { log::error!("logind proxy failed: {}", e); return; }
        };
        let mut stream = match proxy.receive_signal("PrepareForSleep").await {
            Ok(s) => s,
            Err(e) => { log::error!("PrepareForSleep signal failed: {}", e); return; }
        };
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
    tokio::spawn(async move {
        let conn = match zbus::Connection::system().await {
            Ok(c) => c,
            Err(e) => { log::error!("D-Bus connect failed for shutdown listener: {}", e); return; }
        };
        let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
            .destination("org.freedesktop.login1").unwrap()
            .path("/org/freedesktop/login1").unwrap()
            .interface("org.freedesktop.login1.Manager").unwrap()
            .build()
            .await
        {
            Ok(p) => p,
            Err(e) => { log::error!("logind proxy failed: {}", e); return; }
        };
        let mut stream = match proxy.receive_signal("PrepareForShutdown").await {
            Ok(s) => s,
            Err(e) => { log::error!("PrepareForShutdown signal failed: {}", e); return; }
        };
        while let Some(signal) = stream.next().await {
            if let Ok(args) = signal.body().deserialize::<(bool,)>() {
                if args.0 {
                    let _ = app_clone.emit("power-event", "shutdown");
                }
            }
        }
    });

    // Listen for Lock/Unlock from session
    let session_path = get_current_session_path().await;
    if let Some(session_path) = session_path {
        let app_clone = app.clone();
        let sp = session_path.clone();
        tokio::spawn(async move {
            let conn = match zbus::Connection::system().await {
                Ok(c) => c,
                Err(e) => { log::error!("D-Bus connect failed for lock listener: {}", e); return; }
            };
            let obj_path = match zbus::zvariant::OwnedObjectPath::try_from(sp.as_str()) {
                Ok(p) => p,
                Err(e) => { log::error!("Invalid session path: {}", e); return; }
            };
            let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
                .destination("org.freedesktop.login1").unwrap()
                .path(obj_path).unwrap()
                .interface("org.freedesktop.login1.Session").unwrap()
                .build()
                .await
            {
                Ok(p) => p,
                Err(e) => { log::error!("Session proxy failed: {}", e); return; }
            };
            let mut stream = match proxy.receive_signal("Lock").await {
                Ok(s) => s,
                Err(e) => { log::error!("Lock signal failed: {}", e); return; }
            };
            while let Some(_) = stream.next().await {
                let _ = app_clone.emit("session-action", "lock");
                log::info!("Session lock signal received");
            }
        });

        let app_clone = app.clone();
        tokio::spawn(async move {
            let conn = match zbus::Connection::system().await {
                Ok(c) => c,
                Err(e) => { log::error!("D-Bus connect failed for unlock listener: {}", e); return; }
            };
            let obj_path = match zbus::zvariant::OwnedObjectPath::try_from(session_path.as_str()) {
                Ok(p) => p,
                Err(e) => { log::error!("Invalid session path: {}", e); return; }
            };
            let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
                .destination("org.freedesktop.login1").unwrap()
                .path(obj_path).unwrap()
                .interface("org.freedesktop.login1.Session").unwrap()
                .build()
                .await
            {
                Ok(p) => p,
                Err(e) => { log::error!("Session proxy failed: {}", e); return; }
            };
            let mut stream = match proxy.receive_signal("Unlock").await {
                Ok(s) => s,
                Err(e) => { log::error!("Unlock signal failed: {}", e); return; }
            };
            while let Some(_) = stream.next().await {
                let _ = app_clone.emit("session-action", "unlock");
            }
        });
    }

    // Listen for UPower device changes (battery)
    let app_clone = app.clone();
    tokio::spawn(async move {
        let conn = match zbus::Connection::system().await {
            Ok(c) => c,
            Err(e) => { log::error!("D-Bus connect failed for UPower listener: {}", e); return; }
        };
        let proxy: zbus::Proxy<'_> = match zbus::proxy::Builder::new(&conn)
            .destination("org.freedesktop.UPower").unwrap()
            .path("/org/freedesktop/UPower").unwrap()
            .interface("org.freedesktop.UPower").unwrap()
            .build()
            .await
        {
            Ok(p) => p,
            Err(e) => { log::error!("UPower proxy failed: {}", e); return; }
        };
        let mut stream = match proxy.receive_all_signals().await {
            Ok(s) => s,
            Err(e) => { log::error!("UPower signals failed: {}", e); return; }
        };
        while let Some(signal) = stream.next().await {
            let member = signal.header().member().map(|m| m.to_string()).unwrap_or_default();
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

async fn get_current_session_path() -> Option<String> {
    let conn = zbus::Connection::system().await.ok()?;
    let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
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
