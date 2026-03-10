use serde::Serialize;

#[derive(Serialize)]
pub struct PowerProfile {
    pub current: String,
    pub available: Vec<String>,
}

#[tauri::command]
pub async fn power_action(action: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "org.freedesktop.login1",
            "/org/freedesktop/login1",
            "org.freedesktop.login1.Manager",
        )
        .await
        .map_err(|e| e.to_string())?;

        match action.as_str() {
            "shutdown" => {
                proxy
                    .call::<_, ()>("PowerOff", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "restart" => {
                proxy
                    .call::<_, ()>("Reboot", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "sleep" | "suspend" => {
                proxy
                    .call::<_, ()>("Suspend", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "hibernate" => {
                proxy
                    .call::<_, ()>("Hibernate", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "lock" => {
                let session_path = get_session_path(&conn).await?;
                let sp = zbus::Proxy::new(
                    &conn,
                    "org.freedesktop.login1",
                    &session_path,
                    "org.freedesktop.login1.Session",
                )
                .await
                .map_err(|e| e.to_string())?;
                sp.call::<_, ()>("Lock", &()).await.map_err(|e| e.to_string())?;
            }
            "logout" => {
                let session_path = get_session_path(&conn).await?;
                let sp = zbus::Proxy::new(
                    &conn,
                    "org.freedesktop.login1",
                    &session_path,
                    "org.freedesktop.login1.Session",
                )
                .await
                .map_err(|e| e.to_string())?;
                sp.call::<_, ()>("Terminate", &()).await.map_err(|e| e.to_string())?;
            }
            _ => return Err(format!("Unknown power action: {}", action)),
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = action;
        Err("Power actions only supported on Linux".into())
    }
}

#[cfg(target_os = "linux")]
async fn get_session_path(conn: &zbus::Connection) -> Result<String, String> {
    let proxy = zbus::Proxy::new(
        conn,
        "org.freedesktop.login1",
        "/org/freedesktop/login1",
        "org.freedesktop.login1.Manager",
    )
    .await
    .map_err(|e| e.to_string())?;

    let (path,): (zbus::zvariant::OwnedObjectPath,) = proxy
        .call("GetSession", &("auto",))
        .await
        .map_err(|e| e.to_string())?;

    Ok(path.to_string())
}

#[tauri::command]
pub async fn power_get_profile() -> Result<PowerProfile, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "net.hadess.PowerProfiles",
            "/net/hadess/PowerProfiles",
            "net.hadess.PowerProfiles",
        )
        .await
        .map_err(|e| e.to_string())?;

        let current: String = proxy
            .get_property("ActiveProfile")
            .await
            .unwrap_or_else(|_| "balanced".into());

        let profiles: Vec<std::collections::HashMap<String, zbus::zvariant::OwnedValue>> = proxy
            .get_property("Profiles")
            .await
            .unwrap_or_default();

        let available: Vec<String> = profiles
            .iter()
            .filter_map(|p| {
                p.get("Profile")
                    .and_then(|v| v.downcast_ref::<str>().ok())
                    .map(|s| s.to_string())
            })
            .collect();

        Ok(PowerProfile {
            current,
            available: if available.is_empty() {
                vec!["balanced".into()]
            } else {
                available
            },
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(PowerProfile {
            current: "balanced".into(),
            available: vec!["balanced".into()],
        })
    }
}

#[tauri::command]
pub async fn power_set_profile(profile: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "net.hadess.PowerProfiles",
            "/net/hadess/PowerProfiles",
            "net.hadess.PowerProfiles",
        )
        .await
        .map_err(|e| e.to_string())?;

        proxy
            .set_property("ActiveProfile", &*profile)
            .await
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = profile;
        Ok(())
    }
}
