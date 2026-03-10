use serde::Serialize;
use sysinfo::System;

#[derive(Serialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub hostname: String,
    pub username: String,
    pub home_dir: String,
    pub platform: String,
}

#[derive(Serialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub hostname: String,
    pub username: String,
    pub home_dir: String,
    pub cpu_count: usize,
    pub total_memory: u64,
    pub used_memory: u64,
    pub uptime: u64,
}

#[derive(Serialize)]
pub struct PowerState {
    pub on_battery: bool,
    pub battery_level: Option<f32>,
}

#[tauri::command]
pub fn get_platform() -> PlatformInfo {
    PlatformInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        hostname: whoami::fallible::hostname().unwrap_or_default(),
        username: whoami::username(),
        home_dir: dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        platform: if cfg!(target_os = "linux") {
            "linux".into()
        } else if cfg!(target_os = "macos") {
            "darwin".into()
        } else {
            "win32".into()
        },
    }
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemInfo {
        os_name: System::name().unwrap_or_default(),
        os_version: System::os_version().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
        hostname: System::host_name().unwrap_or_default(),
        username: whoami::username(),
        home_dir: dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        cpu_count: sys.cpus().len(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        uptime: System::uptime(),
    }
}

#[tauri::command]
pub fn get_power_state() -> PowerState {
    // On Linux, read from /sys/class/power_supply
    #[cfg(target_os = "linux")]
    {
        let status = std::fs::read_to_string("/sys/class/power_supply/BAT0/status")
            .unwrap_or_else(|_| "Unknown".into());
        let capacity = std::fs::read_to_string("/sys/class/power_supply/BAT0/capacity")
            .ok()
            .and_then(|s| s.trim().parse::<f32>().ok());

        PowerState {
            on_battery: status.trim() == "Discharging",
            battery_level: capacity,
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        PowerState {
            on_battery: false,
            battery_level: None,
        }
    }
}
