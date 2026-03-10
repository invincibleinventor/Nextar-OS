/// XDG base directory paths
pub fn data_home() -> String {
    std::env::var("XDG_DATA_HOME").unwrap_or_else(|_| {
        dirs::home_dir()
            .map(|h| h.join(".local/share").to_string_lossy().to_string())
            .unwrap_or_default()
    })
}

pub fn config_home() -> String {
    std::env::var("XDG_CONFIG_HOME").unwrap_or_else(|_| {
        dirs::home_dir()
            .map(|h| h.join(".config").to_string_lossy().to_string())
            .unwrap_or_default()
    })
}

pub fn cache_home() -> String {
    std::env::var("XDG_CACHE_HOME").unwrap_or_else(|_| {
        dirs::home_dir()
            .map(|h| h.join(".cache").to_string_lossy().to_string())
            .unwrap_or_default()
    })
}

pub fn data_dirs() -> Vec<String> {
    std::env::var("XDG_DATA_DIRS")
        .unwrap_or_else(|_| "/usr/local/share:/usr/share".into())
        .split(':')
        .map(|s| s.to_string())
        .collect()
}

pub fn config_dirs() -> Vec<String> {
    std::env::var("XDG_CONFIG_DIRS")
        .unwrap_or_else(|_| "/etc/xdg".into())
        .split(':')
        .map(|s| s.to_string())
        .collect()
}

pub fn applications_dirs() -> Vec<String> {
    let mut dirs = vec![format!("{}/applications", data_home())];
    for d in data_dirs() {
        dirs.push(format!("{}/applications", d));
    }
    dirs
}

pub fn autostart_dirs() -> Vec<String> {
    let mut dirs = vec![format!("{}/autostart", config_home())];
    for d in config_dirs() {
        dirs.push(format!("{}/autostart", d));
    }
    dirs
}
