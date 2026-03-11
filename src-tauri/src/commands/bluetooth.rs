use serde::Serialize;

#[derive(Serialize)]
pub struct BluetoothStatus {
    pub enabled: bool,
    pub discoverable: bool,
    pub adapter_name: String,
}

#[derive(Serialize)]
pub struct BluetoothDevice {
    pub address: String,
    pub name: String,
    pub paired: bool,
    pub connected: bool,
    pub device_type: String,
    pub icon: String,
    pub rssi: Option<i16>,
}

#[tauri::command]
pub async fn bluetooth_get_status() -> Result<BluetoothStatus, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;

        // Find the first adapter
        let om_proxy = zbus::Proxy::builder(&conn)
            .destination("org.bluez").map_err(|e| e.to_string())?
            .path("/").map_err(|e| e.to_string())?
            .interface("org.freedesktop.DBus.ObjectManager").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;

        let objects: std::collections::HashMap<
            zbus::zvariant::OwnedObjectPath,
            std::collections::HashMap<String, std::collections::HashMap<String, zbus::zvariant::OwnedValue>>,
        > = om_proxy.call::<_, (), _>("GetManagedObjects", &()).await.map_err(|e| e.to_string())?;

        for (path, interfaces) in &objects {
            if let Some(adapter_props) = interfaces.get("org.bluez.Adapter1") {
                let powered = adapter_props
                    .get("Powered")
                    .and_then(|v| v.downcast_ref::<bool>().ok().copied())
                    .unwrap_or(false);
                let discoverable = adapter_props
                    .get("Discoverable")
                    .and_then(|v| v.downcast_ref::<bool>().ok().copied())
                    .unwrap_or(false);
                let name = adapter_props
                    .get("Alias")
                    .and_then(|v| v.downcast_ref::<&str>().ok())
                    .unwrap_or("Bluetooth")
                    .to_string();

                return Ok(BluetoothStatus {
                    enabled: powered,
                    discoverable,
                    adapter_name: name,
                });
            }
        }

        Ok(BluetoothStatus {
            enabled: false,
            discoverable: false,
            adapter_name: String::new(),
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(BluetoothStatus {
            enabled: false,
            discoverable: false,
            adapter_name: String::new(),
        })
    }
}

#[tauri::command]
pub async fn bluetooth_set_enabled(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::builder(&conn)
            .destination("org.bluez").map_err(|e| e.to_string())?
            .path("/org/bluez/hci0").map_err(|e| e.to_string())?
            .interface("org.bluez.Adapter1").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;

        proxy
            .set_property("Powered", enabled)
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
pub async fn bluetooth_get_devices() -> Result<Vec<BluetoothDevice>, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;

        let om_proxy = zbus::Proxy::builder(&conn)
            .destination("org.bluez").map_err(|e| e.to_string())?
            .path("/").map_err(|e| e.to_string())?
            .interface("org.freedesktop.DBus.ObjectManager").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;

        let objects: std::collections::HashMap<
            zbus::zvariant::OwnedObjectPath,
            std::collections::HashMap<String, std::collections::HashMap<String, zbus::zvariant::OwnedValue>>,
        > = om_proxy.call::<_, (), _>("GetManagedObjects", &()).await.map_err(|e| e.to_string())?;

        let mut devices = Vec::new();
        for (_path, interfaces) in &objects {
            if let Some(dev_props) = interfaces.get("org.bluez.Device1") {
                let address = dev_props
                    .get("Address")
                    .and_then(|v| v.downcast_ref::<&str>().ok())
                    .unwrap_or("")
                    .to_string();
                let name = dev_props
                    .get("Alias")
                    .and_then(|v| v.downcast_ref::<&str>().ok())
                    .unwrap_or(&address)
                    .to_string();
                let paired = dev_props
                    .get("Paired")
                    .and_then(|v| v.downcast_ref::<bool>().ok().copied())
                    .unwrap_or(false);
                let connected = dev_props
                    .get("Connected")
                    .and_then(|v| v.downcast_ref::<bool>().ok().copied())
                    .unwrap_or(false);
                let icon = dev_props
                    .get("Icon")
                    .and_then(|v| v.downcast_ref::<&str>().ok())
                    .unwrap_or("bluetooth")
                    .to_string();
                let rssi = dev_props
                    .get("RSSI")
                    .and_then(|v| v.downcast_ref::<i16>().ok().copied());

                devices.push(BluetoothDevice {
                    address,
                    name,
                    paired,
                    connected,
                    device_type: icon.clone(),
                    icon,
                    rssi,
                });
            }
        }

        // Sort: connected first, then paired, then by name
        devices.sort_by(|a, b| {
            b.connected
                .cmp(&a.connected)
                .then_with(|| b.paired.cmp(&a.paired))
                .then_with(|| a.name.cmp(&b.name))
        });

        Ok(devices)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn bluetooth_connect(address: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let obj_path = format!("/org/bluez/hci0/dev_{}", address.replace(':', "_"));
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::builder(&conn)
            .destination("org.bluez").map_err(|e| e.to_string())?
            .path(zbus::zvariant::ObjectPath::try_from(obj_path.as_str()).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?
            .interface("org.bluez.Device1").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;

        proxy.call::<_, (), ()>("Connect", &()).await.map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = address;
        Err("Bluetooth not supported".into())
    }
}

#[tauri::command]
pub async fn bluetooth_disconnect(address: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let obj_path = format!("/org/bluez/hci0/dev_{}", address.replace(':', "_"));
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::builder(&conn)
            .destination("org.bluez").map_err(|e| e.to_string())?
            .path(zbus::zvariant::ObjectPath::try_from(obj_path.as_str()).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?
            .interface("org.bluez.Device1").map_err(|e| e.to_string())?
            .build().await.map_err(|e| e.to_string())?;

        proxy.call::<_, (), ()>("Disconnect", &()).await.map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = address;
        Err("Bluetooth not supported".into())
    }
}
