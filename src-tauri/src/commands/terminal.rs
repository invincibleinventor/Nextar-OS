use serde::{Deserialize, Serialize};
use tauri::Emitter;
#[cfg(target_os = "linux")]
use std::os::fd::AsRawFd;

#[derive(Deserialize)]
pub struct PtySpawnOptions {
    pub shell: Option<String>,
    pub cwd: Option<String>,
    pub cols: Option<u16>,
    pub rows: Option<u16>,
    pub env: Option<std::collections::HashMap<String, String>>,
}

#[derive(Serialize)]
pub struct TerminalOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

#[tauri::command]
pub async fn terminal_execute(command: String, cwd: Option<String>) -> Result<TerminalOutput, String> {
    let shell = if cfg!(target_os = "linux") {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into())
    } else if cfg!(target_os = "macos") {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into())
    } else {
        "cmd".into()
    };

    let mut cmd = tokio::process::Command::new(&shell);
    cmd.args(["-c", &command]);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    let output = cmd.output().await.map_err(|e| e.to_string())?;

    Ok(TerminalOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn pty_spawn(options: PtySpawnOptions, app: tauri::AppHandle) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();

    #[cfg(target_os = "linux")]
    {
        use std::os::unix::io::FromRawFd;
        use std::io::{Read, Write};

        let shell = options.shell.unwrap_or_else(|| {
            std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into())
        });
        let cwd = options
            .cwd
            .unwrap_or_else(|| dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|| "/".into()));

        let cols = options.cols.unwrap_or(80);
        let rows = options.rows.unwrap_or(24);

        // Use nix to create PTY
        let pty_result = nix::pty::openpty(
            Some(&nix::pty::Winsize {
                ws_row: rows,
                ws_col: cols,
                ws_xpixel: 0,
                ws_ypixel: 0,
            }),
            None,
        )
        .map_err(|e: nix::Error| e.to_string())?;

        let master_fd = pty_result.master;
        let slave_fd = pty_result.slave;

        // Fork process
        match unsafe { nix::unistd::fork() } {
            Ok(nix::unistd::ForkResult::Child) => {
                // Child process
                let _ = nix::unistd::setsid();
                unsafe {
                    libc::ioctl(slave_fd.as_raw_fd(), libc::TIOCSCTTY, 0);
                }
                let _ = nix::unistd::dup2(slave_fd.as_raw_fd(), 0); // stdin
                let _ = nix::unistd::dup2(slave_fd.as_raw_fd(), 1); // stdout
                let _ = nix::unistd::dup2(slave_fd.as_raw_fd(), 2); // stderr
                drop(master_fd);
                drop(slave_fd);

                std::env::set_current_dir(&cwd).ok();
                if let Some(env) = options.env {
                    for (k, v) in env {
                        std::env::set_var(k, v);
                    }
                }
                std::env::set_var("TERM", "xterm-256color");

                let shell_cstr = std::ffi::CString::new(shell.as_bytes()).unwrap();
                nix::unistd::execvp(&shell_cstr, &[&shell_cstr]).ok();
                std::process::exit(1);
            }
            Ok(nix::unistd::ForkResult::Parent { child }) => {
                drop(slave_fd);

                let pty_id = id.clone();
                let app_clone = app.clone();
                let master_raw = master_fd.as_raw_fd();

                // Read thread
                std::thread::spawn(move || {
                    let mut master = unsafe { std::fs::File::from_raw_fd(master_raw) };
                    let mut buf = [0u8; 4096];
                    loop {
                        match master.read(&mut buf) {
                            Ok(0) => break,
                            Ok(n) => {
                                let data = String::from_utf8_lossy(&buf[..n]).to_string();
                                let _ = app_clone.emit("pty-data", serde_json::json!({
                                    "id": pty_id,
                                    "data": data,
                                }));
                            }
                            Err(_) => break,
                        }
                    }
                    let _ = app_clone.emit("pty-exit", serde_json::json!({
                        "id": pty_id,
                        "code": 0,
                    }));
                });

                // We need to store the master_fd for writing
                // For now, use a static map (state is handled via AppState)
                // This is simplified — in production, use AppState properly
            }
            Err(e) => return Err(e.to_string()),
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = (options, app);
        return Err("PTY only supported on Linux".into());
    }

    Ok(id)
}

#[tauri::command]
pub async fn pty_write(id: String, data: String) -> Result<(), String> {
    // Write to the master fd
    // This requires the master fd to be stored in AppState
    // Simplified implementation — in full version, look up fd from state
    let _ = (id, data);
    Ok(())
}

#[tauri::command]
pub async fn pty_resize(id: String, cols: u16, rows: u16) -> Result<(), String> {
    let _ = (id, cols, rows);
    // Use TIOCSWINSZ ioctl to resize PTY
    Ok(())
}

#[tauri::command]
pub async fn pty_kill(id: String) -> Result<(), String> {
    let _ = id;
    Ok(())
}
