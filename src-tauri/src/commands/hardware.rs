use serde::Serialize;
use sysinfo::System;

#[derive(Serialize)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub driver: String,
}

#[derive(Serialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total: u64,
    pub available: u64,
    pub used: u64,
    pub filesystem: String,
    pub removable: bool,
}

#[derive(Serialize)]
pub struct CpuInfo {
    pub name: String,
    pub cores: usize,
    pub frequency: u64,
    pub usage: f32,
    pub vendor: String,
}

#[derive(Serialize)]
pub struct MemoryInfo {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub swap_total: u64,
    pub swap_used: u64,
}

#[tauri::command]
pub fn hardware_get_gpu() -> Result<Vec<GpuInfo>, String> {
    #[cfg(target_os = "linux")]
    {
        let output = std::process::Command::new("lspci")
            .args(["-mm", "-nn"])
            .output()
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let gpus: Vec<GpuInfo> = text
            .lines()
            .filter(|l| l.contains("VGA") || l.contains("3D") || l.contains("Display"))
            .map(|line| {
                let parts: Vec<&str> = line.split('"').collect();
                GpuInfo {
                    name: parts.get(5).unwrap_or(&"Unknown GPU").to_string(),
                    vendor: parts.get(3).unwrap_or(&"Unknown").to_string(),
                    driver: String::new(),
                }
            })
            .collect();
        Ok(gpus)
    }
    #[cfg(not(target_os = "linux"))]
    { Ok(Vec::new()) }
}

#[tauri::command]
pub fn hardware_get_disks() -> Vec<DiskInfo> {
    use sysinfo::Disks;
    let disks = Disks::new_with_refreshed_list();
    disks
        .iter()
        .map(|d| {
            let total = d.total_space();
            let available = d.available_space();
            DiskInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                total,
                available,
                used: total.saturating_sub(available),
                filesystem: d.file_system().to_string_lossy().to_string(),
                removable: d.is_removable(),
            }
        })
        .collect()
}

#[tauri::command]
pub fn hardware_get_cpu() -> CpuInfo {
    let mut sys = System::new();
    sys.refresh_cpu_all();
    let cpus = sys.cpus();
    let first = cpus.first();

    CpuInfo {
        name: first.map(|c| c.brand().to_string()).unwrap_or_default(),
        cores: cpus.len(),
        frequency: first.map(|c| c.frequency()).unwrap_or(0),
        usage: sys.global_cpu_usage(),
        vendor: first.map(|c| c.vendor_id().to_string()).unwrap_or_default(),
    }
}

#[tauri::command]
pub fn hardware_get_memory() -> MemoryInfo {
    let mut sys = System::new();
    sys.refresh_memory();
    MemoryInfo {
        total: sys.total_memory(),
        used: sys.used_memory(),
        available: sys.available_memory(),
        swap_total: sys.total_swap(),
        swap_used: sys.used_swap(),
    }
}
