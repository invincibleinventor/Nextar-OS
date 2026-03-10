use serde::Serialize;
use sysinfo::System;

#[derive(Serialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory: u64,
    pub status: String,
    pub user: Option<String>,
    pub command: String,
}

#[tauri::command]
pub fn process_list() -> Vec<ProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();

    sys.processes()
        .iter()
        .map(|(pid, proc_info)| ProcessInfo {
            pid: pid.as_u32(),
            name: proc_info.name().to_string_lossy().to_string(),
            cpu_usage: proc_info.cpu_usage(),
            memory: proc_info.memory(),
            status: format!("{:?}", proc_info.status()),
            user: proc_info
                .user_id()
                .map(|uid| format!("{:?}", uid)),
            command: proc_info
                .cmd()
                .iter()
                .map(|s| s.to_string_lossy().to_string())
                .collect::<Vec<_>>()
                .join(" "),
        })
        .collect()
}

#[tauri::command]
pub fn process_kill(pid: u32, force: Option<bool>) -> Result<(), String> {
    let sys = System::new_all();
    let pid = sysinfo::Pid::from_u32(pid);
    if let Some(proc_info) = sys.process(pid) {
        if force.unwrap_or(false) {
            proc_info.kill();
        } else {
            // Try SIGTERM first
            #[cfg(target_os = "linux")]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                let _ = kill(Pid::from_raw(pid.as_u32() as i32), Signal::SIGTERM);
            }
            #[cfg(not(target_os = "linux"))]
            {
                proc_info.kill();
            }
        }
        Ok(())
    } else {
        Err(format!("Process {} not found", pid))
    }
}
