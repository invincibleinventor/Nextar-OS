use tauri::State;
use crate::services::AppState;
use crate::services::state::NotificationRecord;

#[tauri::command]
pub async fn notification_get_history(state: State<'_, AppState>) -> Result<Vec<NotificationRecord>, String> {
    Ok(state.notification_history.read().await.clone())
}

#[tauri::command]
pub async fn notification_close(id: u32, state: State<'_, AppState>) -> Result<(), String> {
    state.notification_history.write().await.retain(|n| n.id != id);
    Ok(())
}

#[tauri::command]
pub async fn notification_set_dnd(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    *state.dnd_enabled.write().await = enabled;
    Ok(())
}

#[tauri::command]
pub async fn notification_get_dnd(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(*state.dnd_enabled.read().await)
}
