use serde::Serialize;

#[derive(Serialize)]
pub struct AuthResult {
    pub authorized: bool,
    pub challenge: bool,
}

#[tauri::command]
pub async fn polkit_check_auth(action_id: String) -> Result<AuthResult, String> {
    #[cfg(target_os = "linux")]
    {
        let conn = zbus::Connection::system().await.map_err(|e| e.to_string())?;
        let proxy = zbus::Proxy::new(
            &conn,
            "org.freedesktop.PolicyKit1",
            "/org/freedesktop/PolicyKit1/Authority",
            "org.freedesktop.PolicyKit1.Authority",
        ).await.map_err(|e| e.to_string())?;

        let subject = (
            "unix-process",
            std::collections::HashMap::from([
                ("pid".to_string(), zbus::zvariant::Value::new(std::process::id())),
                ("start-time".to_string(), zbus::zvariant::Value::new(0u64)),
            ]),
        );

        let result: (bool, bool, std::collections::HashMap<String, String>) = proxy
            .call("CheckAuthorization", &(
                &subject,
                &action_id,
                &std::collections::HashMap::<String, String>::new(),
                0u32, // AllowUserInteraction
                "",
            ))
            .await
            .map_err(|e| e.to_string())?;

        Ok(AuthResult {
            authorized: result.0,
            challenge: result.1,
        })
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = action_id; Ok(AuthResult { authorized: true, challenge: false }) }
}

#[tauri::command]
pub async fn polkit_authenticate(action_id: String) -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        // Use pkexec to trigger auth dialog
        let output = tokio::process::Command::new("pkexec")
            .args(["--disable-internal-agent", "true"])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        Ok(output.status.success())
    }
    #[cfg(not(target_os = "linux"))]
    { let _ = action_id; Ok(true) }
}
