use serde::Serialize;

#[derive(Serialize)]
pub struct BatteryStatus {
    pub present: bool,
    pub percentage: f64,
    pub state: String, // "charging", "discharging", "full", "not-charging"
    pub time_to_empty: Option<i64>, // seconds
    pub time_to_full: Option<i64>,  // seconds
    pub energy: Option<f64>,
    pub energy_full: Option<f64>,
    pub voltage: Option<f64>,
    pub power_supply: bool,
}

#[tauri::command]
pub async fn battery_get_status() -> Result<BatteryStatus, String> {
    #[cfg(target_os = "linux")]
    {
        // Use UPower D-Bus
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "org.freedesktop.UPower",
            "/org/freedesktop/UPower/devices/DisplayDevice",
            "org.freedesktop.UPower.Device",
        )
        .await
        .map_err(|e| e.to_string())?;

        let percentage: f64 = proxy.get_property("Percentage").await.unwrap_or(0.0);
        let state_num: u32 = proxy.get_property("State").await.unwrap_or(0);
        let time_to_empty: i64 = proxy.get_property("TimeToEmpty").await.unwrap_or(0);
        let time_to_full: i64 = proxy.get_property("TimeToFull").await.unwrap_or(0);
        let energy: f64 = proxy.get_property("Energy").await.unwrap_or(0.0);
        let energy_full: f64 = proxy.get_property("EnergyFull").await.unwrap_or(0.0);
        let voltage: f64 = proxy.get_property("Voltage").await.unwrap_or(0.0);
        let is_present: bool = proxy.get_property("IsPresent").await.unwrap_or(false);
        let power_supply: bool = proxy.get_property("PowerSupply").await.unwrap_or(true);

        let state = match state_num {
            1 => "charging",
            2 => "discharging",
            3 => "empty",
            4 => "full",
            5 => "pending-charge",
            6 => "pending-discharge",
            _ => "unknown",
        };

        Ok(BatteryStatus {
            present: is_present,
            percentage,
            state: state.to_string(),
            time_to_empty: if time_to_empty > 0 { Some(time_to_empty) } else { None },
            time_to_full: if time_to_full > 0 { Some(time_to_full) } else { None },
            energy: Some(energy),
            energy_full: Some(energy_full),
            voltage: Some(voltage),
            power_supply,
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(BatteryStatus {
            present: false,
            percentage: 100.0,
            state: "full".into(),
            time_to_empty: None,
            time_to_full: None,
            energy: None,
            energy_full: None,
            voltage: None,
            power_supply: true,
        })
    }
}
