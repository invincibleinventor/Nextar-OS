use serde::Serialize;

#[derive(Serialize)]
pub struct WifiStatus {
    pub enabled: bool,
    pub connected: bool,
    pub ssid: Option<String>,
    pub signal: Option<i32>,
    pub ip: Option<String>,
}

#[derive(Serialize)]
pub struct WifiNetwork {
    pub ssid: String,
    pub signal: i32,
    pub security: String,
    pub connected: bool,
    pub bssid: String,
    pub frequency: Option<u32>,
}

#[cfg(target_os = "linux")]
async fn nm_proxy_at(
    conn: &zbus::Connection,
    path: &str,
    iface: &str,
) -> Result<zbus::Proxy<'_>, zbus::Error> {
    zbus::proxy::Builder::new(conn)
        .destination("org.freedesktop.NetworkManager")?
        .path(zbus::zvariant::ObjectPath::try_from(path)?)?
        .interface(iface)?
        .build()
        .await
}

#[tauri::command]
pub async fn wifi_get_status() -> Result<WifiStatus, String> {
    #[cfg(target_os = "linux")]
    {
        // Use NetworkManager D-Bus
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = nm_proxy_at(&conn, "/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager")
            .await
            .map_err(|e| e.to_string())?;

        let wireless_enabled: bool = proxy
            .get_property("WirelessEnabled")
            .await
            .unwrap_or(false);

        // Get active connection
        let active_connections: Vec<zbus::zvariant::OwnedObjectPath> = proxy
            .get_property("ActiveConnections")
            .await
            .unwrap_or_default();

        let mut connected = false;
        let mut ssid = None;
        let mut ip = None;

        for conn_path in &active_connections {
            let active_proxy = nm_proxy_at(
                &conn,
                conn_path.as_str(),
                "org.freedesktop.NetworkManager.Connection.Active",
            )
            .await
            .ok();

            if let Some(ap) = active_proxy {
                let conn_type: String = ap.get_property("Type").await.unwrap_or_default();
                if conn_type == "802-11-wireless" {
                    connected = true;
                    // Get SSID
                    let id: String = ap.get_property("Id").await.unwrap_or_default();
                    ssid = Some(id);

                    // Get IP
                    let ip4_config: zbus::zvariant::OwnedObjectPath = ap
                        .get_property("Ip4Config")
                        .await
                        .unwrap_or_else(|_| zbus::zvariant::OwnedObjectPath::try_from("/").unwrap());

                    if ip4_config.as_str() != "/" {
                        let ip_proxy = nm_proxy_at(
                            &conn,
                            ip4_config.as_str(),
                            "org.freedesktop.NetworkManager.IP4Config",
                        )
                        .await
                        .ok();

                        if let Some(ipp) = ip_proxy {
                            let addresses: Vec<Vec<u32>> =
                                ipp.get_property("Addresses").await.unwrap_or_default();
                            if let Some(addr) = addresses.first() {
                                if let Some(&raw) = addr.first() {
                                    ip = Some(format!(
                                        "{}.{}.{}.{}",
                                        raw & 0xFF,
                                        (raw >> 8) & 0xFF,
                                        (raw >> 16) & 0xFF,
                                        (raw >> 24) & 0xFF
                                    ));
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }

        Ok(WifiStatus {
            enabled: wireless_enabled,
            connected,
            ssid,
            signal: None,
            ip,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(WifiStatus {
            enabled: false,
            connected: false,
            ssid: None,
            signal: None,
            ip: None,
        })
    }
}

#[tauri::command]
pub async fn wifi_set_enabled(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = nm_proxy_at(&conn, "/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager")
            .await
            .map_err(|e| e.to_string())?;

        proxy
            .set_property("WirelessEnabled", enabled)
            .await
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = enabled;
        Ok(())
    }
}

#[tauri::command]
pub async fn wifi_get_networks() -> Result<Vec<WifiNetwork>, String> {
    #[cfg(target_os = "linux")]
    {
        // Request scan then list access points
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let nm_proxy = nm_proxy_at(&conn, "/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager")
            .await
            .map_err(|e| e.to_string())?;

        // Get WiFi devices
        let devices: Vec<zbus::zvariant::OwnedObjectPath> = nm_proxy
            .get_property("AllDevices")
            .await
            .unwrap_or_default();

        let mut networks = Vec::new();

        for dev_path in &devices {
            let dev_proxy = nm_proxy_at(
                &conn,
                dev_path.as_str(),
                "org.freedesktop.NetworkManager.Device",
            )
            .await
            .ok();

            let device_type: u32 = if let Some(ref p) = dev_proxy {
                p.get_property("DeviceType").await.unwrap_or(0)
            } else {
                0
            };

            if device_type != 2 { continue; } // NM_DEVICE_TYPE_WIFI = 2

            let wifi_proxy = nm_proxy_at(
                &conn,
                dev_path.as_str(),
                "org.freedesktop.NetworkManager.Device.Wireless",
            )
            .await
            .ok();

            if let Some(wp) = wifi_proxy {
                // Request scan
                let _ = wp.call::<_, std::collections::HashMap<String, zbus::zvariant::Value<'_>>, ()>("RequestScan", &std::collections::HashMap::<String, zbus::zvariant::Value>::new()).await;
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;

                let access_points: Vec<zbus::zvariant::OwnedObjectPath> = wp
                    .get_property("AccessPoints")
                    .await
                    .unwrap_or_default();

                let active_ap: String = wp
                    .get_property::<zbus::zvariant::OwnedObjectPath>("ActiveAccessPoint")
                    .await
                    .map(|p: zbus::zvariant::OwnedObjectPath| p.to_string())
                    .unwrap_or_default();

                for ap_path in &access_points {
                    let ap_proxy = nm_proxy_at(
                        &conn,
                        ap_path.as_str(),
                        "org.freedesktop.NetworkManager.AccessPoint",
                    )
                    .await
                    .ok();

                    if let Some(ap) = ap_proxy {
                        let ssid_bytes: Vec<u8> = ap.get_property("Ssid").await.unwrap_or_default();
                        let ssid = String::from_utf8_lossy(&ssid_bytes).to_string();
                        if ssid.is_empty() { continue; }

                        let strength: u8 = ap.get_property("Strength").await.unwrap_or(0);
                        let flags: u32 = ap.get_property("WpaFlags").await.unwrap_or(0);
                        let rsn_flags: u32 = ap.get_property("RsnFlags").await.unwrap_or(0);
                        let bssid: String = ap.get_property("HwAddress").await.unwrap_or_default();
                        let freq: u32 = ap.get_property("Frequency").await.unwrap_or(0);

                        let security = if rsn_flags > 0 {
                            "WPA2".into()
                        } else if flags > 0 {
                            "WPA".into()
                        } else {
                            "Open".into()
                        };

                        networks.push(WifiNetwork {
                            ssid,
                            signal: strength as i32,
                            security,
                            connected: ap_path.as_str() == active_ap,
                            bssid,
                            frequency: Some(freq),
                        });
                    }
                }
            }
        }

        // Dedup by SSID, keeping strongest
        networks.sort_by(|a, b| b.signal.cmp(&a.signal));
        let mut seen = std::collections::HashSet::new();
        networks.retain(|n| seen.insert(n.ssid.clone()));

        Ok(networks)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn wifi_connect(ssid: String, password: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        // Use nmcli for simplicity of connection with password
        let mut args = vec!["device".to_string(), "wifi".to_string(), "connect".to_string(), ssid];
        if let Some(pw) = password {
            args.push("password".into());
            args.push(pw);
        }
        let output = tokio::process::Command::new("nmcli")
            .args(&args)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (ssid, password);
        Err("WiFi not supported on this platform".into())
    }
}
