use serde::Serialize;

#[derive(Serialize)]
pub struct DateTimeStatus {
    pub timezone: String,
    pub ntp_enabled: bool,
    pub local_time: String,
    pub utc_time: String,
}

#[tauri::command]
pub async fn locale_get() -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("localectl")
            .args(["status"])
            .output().await.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            if line.contains("LANG=") {
                return Ok(line.split('=').nth(1).unwrap_or("en_US.UTF-8").to_string());
            }
        }
        Ok("en_US.UTF-8".into())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok("en_US.UTF-8".into()) }
}

#[tauri::command]
pub async fn locale_get_all() -> Result<Vec<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("localectl")
            .args(["list-locales"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(String::from_utf8_lossy(&output.stdout).lines().map(|l| l.to_string()).collect())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(vec!["en_US.UTF-8".into()]) }
}

#[tauri::command]
pub async fn locale_set(locale: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("localectl")
            .args(["set-locale", &format!("LANG={}", locale)])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = locale; Ok(()) }
}

#[tauri::command]
pub async fn datetime_get_status() -> Result<DateTimeStatus, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("timedatectl")
            .args(["show"])
            .output().await.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout);
        let mut tz = "UTC".to_string();
        let mut ntp = false;
        for line in text.lines() {
            if let Some((k, v)) = line.split_once('=') {
                match k {
                    "Timezone" => tz = v.to_string(),
                    "NTP" => ntp = v == "yes",
                    _ => {}
                }
            }
        }
        Ok(DateTimeStatus {
            timezone: tz,
            ntp_enabled: ntp,
            local_time: chrono_local_time(),
            utc_time: chrono_utc_time(),
        })
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(DateTimeStatus {
            timezone: "UTC".into(), ntp_enabled: true,
            local_time: String::new(), utc_time: String::new(),
        })
    }
}

fn chrono_local_time() -> String {
    // Simple timestamp without chrono dep
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{}", now)
}

fn chrono_utc_time() -> String { chrono_local_time() }

#[tauri::command]
pub async fn datetime_get_timezones() -> Result<Vec<String>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = tokio::process::Command::new("timedatectl")
            .args(["list-timezones"])
            .output().await.map_err(|e| e.to_string())?;
        Ok(String::from_utf8_lossy(&output.stdout).lines().map(|l| l.to_string()).collect())
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(vec!["UTC".into()]) }
}

#[tauri::command]
pub async fn datetime_set_timezone(tz: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("timedatectl")
            .args(["set-timezone", &tz])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = tz; Ok(()) }
}

#[tauri::command]
pub async fn datetime_set_ntp(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("timedatectl")
            .args(["set-ntp", &enabled.to_string()])
            .output().await.map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = enabled; Ok(()) }
}
