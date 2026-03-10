use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Shared application state managed by Tauri
pub struct AppState {
    pub is_session: bool,
    pub file_watchers: Arc<RwLock<HashMap<String, notify::RecommendedWatcher>>>,
    pub pty_sessions: Arc<RwLock<HashMap<String, PtySession>>>,
    pub notification_history: Arc<RwLock<Vec<NotificationRecord>>>,
    pub tray_items: Arc<RwLock<Vec<TrayItem>>>,
    pub global_menus: Arc<RwLock<HashMap<u32, Vec<MenuItem>>>>,
    pub workspaces: Arc<RwLock<WorkspaceState>>,
    pub dnd_enabled: Arc<RwLock<bool>>,
}

impl AppState {
    pub fn new(is_session: bool) -> Self {
        Self {
            is_session,
            file_watchers: Arc::new(RwLock::new(HashMap::new())),
            pty_sessions: Arc::new(RwLock::new(HashMap::new())),
            notification_history: Arc::new(RwLock::new(Vec::new())),
            tray_items: Arc::new(RwLock::new(Vec::new())),
            global_menus: Arc::new(RwLock::new(HashMap::new())),
            workspaces: Arc::new(RwLock::new(WorkspaceState::default())),
            dnd_enabled: Arc::new(RwLock::new(false)),
        }
    }
}

/// PTY session handle
pub struct PtySession {
    pub id: String,
    pub child: Option<std::process::Child>,
    // On Linux this would be a real PTY fd
    #[cfg(target_os = "linux")]
    pub master_fd: Option<i32>,
}

/// Notification record for history
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct NotificationRecord {
    pub id: u32,
    pub app_name: String,
    pub summary: String,
    pub body: String,
    pub icon: String,
    pub urgency: u8,
    pub actions: Vec<String>,
    pub timestamp: u64,
}

/// System tray item
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct TrayItem {
    pub id: String,
    pub service: String,
    pub title: String,
    pub icon_name: String,
    pub icon_data: Option<Vec<u8>>,
    pub tooltip: String,
    pub menu_path: String,
    pub category: String,
    pub status: String,
}

/// Menu item for global menus and tray menus
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct MenuItem {
    pub id: i32,
    pub label: String,
    pub enabled: bool,
    pub visible: bool,
    pub icon_name: Option<String>,
    pub shortcut: Option<String>,
    pub toggle_type: Option<String>,
    pub toggle_state: Option<i32>,
    pub children: Vec<MenuItem>,
    pub item_type: String, // "normal", "separator", "submenu"
}

/// Workspace state
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct WorkspaceState {
    pub current: usize,
    pub count: usize,
    pub names: Vec<String>,
}

impl Default for WorkspaceState {
    fn default() -> Self {
        Self {
            current: 0,
            count: 4,
            names: vec![
                "Workspace 1".into(),
                "Workspace 2".into(),
                "Workspace 3".into(),
                "Workspace 4".into(),
            ],
        }
    }
}
