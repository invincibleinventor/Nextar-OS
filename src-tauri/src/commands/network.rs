use serde::Serialize;

#[derive(Serialize)]
pub struct NetworkInfo {
    pub interfaces: Vec<NetworkInterface>,
}

#[derive(Serialize)]
pub struct NetworkInterface {
    pub name: String,
    pub ip4: Option<String>,
    pub ip6: Option<String>,
    pub mac: Option<String>,
    pub interface_type: String, // "ethernet", "wifi", "vpn", "loopback"
    pub connected: bool,
    pub speed: Option<u64>,
}

#[derive(Serialize)]
pub struct NetworkConnection {
    pub id: String,
    pub name: String,
    pub connection_type: String,
    pub active: bool,
    pub device: String,
}

#[derive(Serialize)]
pub struct VpnConnection {
    pub id: String,
    pub name: String,
    pub vpn_type: String, // "openvpn", "wireguard", etc.
    pub active: bool,
}

#[tauri::command]
pub async fn network_get_info() -> Result<NetworkInfo, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("ip")
            .args(["-j", "addr", "show"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let ifaces: Vec<serde_json::Value> = serde_json::from_str(&text).unwrap_or_default();

        let interfaces: Vec<NetworkInterface> = ifaces
            .iter()
            .filter_map(|i| {
                let name = i["ifname"].as_str()?.to_string();
                if name == "lo" { return None; }

                let flags = i["flags"].as_array().unwrap_or(&Vec::new()).clone();
                let up = flags.iter().any(|f| f.as_str() == Some("UP"));

                let mut ip4 = None;
                let mut ip6 = None;
                if let Some(addrs) = i["addr_info"].as_array() {
                    for addr in addrs {
                        match addr["family"].as_str() {
                            Some("inet") => ip4 = addr["local"].as_str().map(|s| s.to_string()),
                            Some("inet6") => {
                                let a = addr["local"].as_str().unwrap_or("");
                                if !a.starts_with("fe80") { // Skip link-local
                                    ip6 = Some(a.to_string());
                                }
                            }
                            _ => {}
                        }
                    }
                }

                let mac = i["address"].as_str().map(|s| s.to_string());
                let itype = if name.starts_with("wl") {
                    "wifi"
                } else if name.starts_with("en") || name.starts_with("eth") {
                    "ethernet"
                } else if name.starts_with("tun") || name.starts_with("wg") {
                    "vpn"
                } else {
                    "other"
                };

                Some(NetworkInterface {
                    name,
                    ip4,
                    ip6,
                    mac,
                    interface_type: itype.to_string(),
                    connected: up && ip4.is_some(),
                    speed: None,
                })
            })
            .collect();

        Ok(NetworkInfo { interfaces })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(NetworkInfo { interfaces: Vec::new() })
    }
}

#[tauri::command]
pub async fn network_get_connections() -> Result<Vec<NetworkConnection>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("nmcli")
            .args(["-t", "-f", "NAME,TYPE,ACTIVE,DEVICE", "connection", "show"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let connections: Vec<NetworkConnection> = text
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() >= 4 {
                    Some(NetworkConnection {
                        id: parts[0].to_string(),
                        name: parts[0].to_string(),
                        connection_type: parts[1].to_string(),
                        active: parts[2] == "yes",
                        device: parts[3].to_string(),
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(connections)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn network_get_vpns() -> Result<Vec<VpnConnection>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("nmcli")
            .args(["-t", "-f", "NAME,TYPE,ACTIVE", "connection", "show"])
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let vpns: Vec<VpnConnection> = text
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() >= 3 && (parts[1].contains("vpn") || parts[1].contains("wireguard")) {
                    Some(VpnConnection {
                        id: parts[0].to_string(),
                        name: parts[0].to_string(),
                        vpn_type: parts[1].to_string(),
                        active: parts[2] == "yes",
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(vpns)
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn network_connect_vpn(name: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("nmcli")
            .args(["connection", "up", &name])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = name;
        Err("VPN not supported".into())
    }
}

#[tauri::command]
pub async fn network_disconnect_vpn(name: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("nmcli")
            .args(["connection", "down", &name])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = name;
        Err("VPN not supported".into())
    }
}
