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
        let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
            .destination("org.freedesktop.login1").map_err(|e| e.to_string())?
            .path("/org/freedesktop/login1").map_err(|e| e.to_string())?
            .interface("org.freedesktop.login1.Manager").map_err(|e| e.to_string())?
            .build()
            .await
            .map_err(|e| e.to_string())?;

        match action.as_str() {
            "shutdown" => {
                proxy
                    .call::<_, (bool,), ()>("PowerOff", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "restart" => {
                proxy
                    .call::<_, (bool,), ()>("Reboot", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "sleep" | "suspend" => {
                proxy
                    .call::<_, (bool,), ()>("Suspend", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "hibernate" => {
                proxy
                    .call::<_, (bool,), ()>("Hibernate", &(false,))
                    .await
                    .map_err(|e| e.to_string())?;
            }
            "lock" => {
                let session_path = get_session_path(&conn).await?;
                let sp: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
                    .destination("org.freedesktop.login1").map_err(|e| e.to_string())?
                    .path(zbus::zvariant::ObjectPath::try_from(session_path.as_str()).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?
                    .interface("org.freedesktop.login1.Session").map_err(|e| e.to_string())?
                    .build()
                    .await
                    .map_err(|e| e.to_string())?;
                sp.call::<_, (), ()>("Lock", &()).await.map_err(|e| e.to_string())?;
            }
            "logout" => {
                let session_path = get_session_path(&conn).await?;
                let sp: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
                    .destination("org.freedesktop.login1").map_err(|e| e.to_string())?
                    .path(zbus::zvariant::ObjectPath::try_from(session_path.as_str()).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?
                    .interface("org.freedesktop.login1.Session").map_err(|e| e.to_string())?
                    .build()
                    .await
                    .map_err(|e| e.to_string())?;
                sp.call::<_, (), ()>("Terminate", &()).await.map_err(|e| e.to_string())?;
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
    let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(conn)
        .destination("org.freedesktop.login1").map_err(|e| e.to_string())?
        .path("/org/freedesktop/login1").map_err(|e| e.to_string())?
        .interface("org.freedesktop.login1.Manager").map_err(|e| e.to_string())?
        .build()
        .await
        .map_err(|e| e.to_string())?;

    let (path,): (zbus::zvariant::OwnedObjectPath,) = proxy
        .call::<_, (&str,), (zbus::zvariant::OwnedObjectPath,)>("GetSession", &("auto",))
        .await
        .map_err(|e| e.to_string())?;

    Ok(path.to_string())
}

#[tauri::command]
pub async fn power_get_profile() -> Result<PowerProfile, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
            .destination("net.hadess.PowerProfiles").map_err(|e| e.to_string())?
            .path("/net/hadess/PowerProfiles").map_err(|e| e.to_string())?
            .interface("net.hadess.PowerProfiles").map_err(|e| e.to_string())?
            .build()
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
            .filter_map(|p: &std::collections::HashMap<String, zbus::zvariant::OwnedValue>| {
                p.get("Profile")
                    .and_then(|v: &zbus::zvariant::OwnedValue| {
                        String::try_from(v.clone()).ok()
                    })
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
        let proxy: zbus::Proxy<'_> = zbus::proxy::Builder::new(&conn)
            .destination("net.hadess.PowerProfiles").map_err(|e| e.to_string())?
            .path("/net/hadess/PowerProfiles").map_err(|e| e.to_string())?
            .interface("net.hadess.PowerProfiles").map_err(|e| e.to_string())?
            .build()
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
