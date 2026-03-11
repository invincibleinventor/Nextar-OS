// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;
mod system;

use std::env;
use tauri::Manager;

fn main() {
    env_logger::init();

    // Fix WebKitGTK black screen on some Linux configurations (VM, missing GPU drivers)
    #[cfg(target_os = "linux")]
    {
        if env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
            unsafe { env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1"); }
        }
    }

    // Detect desktop session mode
    let is_session = env::args().any(|a| a == "--session")
        || env::var("NEXTAROS_SESSION").unwrap_or_default() == "1"
        || env::var("XDG_SESSION_DESKTOP").unwrap_or_default() == "nextaros"
        || env::var("DESKTOP_SESSION").unwrap_or_default() == "nextaros";

    // Set XDG vars if in session mode
    if is_session {
        unsafe {
            env::set_var("XDG_CURRENT_DESKTOP", "NextarOS");
            env::set_var("XDG_SESSION_DESKTOP", "nextaros");
            env::set_var("DESKTOP_SESSION", "nextaros");
            env::set_var("QT_QPA_PLATFORMTHEME", "qt5ct");
            env::set_var("QT_AUTO_SCREEN_SCALE_FACTOR", "1");
        }
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Focus main window when second instance is launched
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_focus();
                let _ = w.unminimize();
            }
            log::info!("Single instance triggered with args: {:?}", args);
        }))
        .plugin(tauri_plugin_updater::Builder::default().build())
        .manage(services::AppState::new(is_session))
        .setup(move |app| {
            let window = app.get_webview_window("main").unwrap();

            // Enable devtools for debugging
            #[cfg(debug_assertions)]
            window.open_devtools();

            // Session mode: fullscreen, no decorations
            if is_session {
                let _ = window.set_fullscreen(true);
                let _ = window.set_decorations(false);
                let _ = window.set_always_on_top(true);
            } else {
                // Non-session: maximize window to fill screen
                let _ = window.maximize();
            }

            // Start background services
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                services::start_all(app_handle).await;
            });

            // Register global shortcuts
            #[cfg(target_os = "linux")]
            {
                let app_handle = app.handle().clone();
                commands::shortcuts::register_global_shortcuts(app_handle, is_session);
            }

            // Install themes on session start
            #[cfg(target_os = "linux")]
            if is_session {
                let resource_path = app.path().resource_dir().ok();
                if let Some(res) = resource_path {
                    let theme_script = res.join("themes").join("install-themes.sh");
                    if theme_script.exists() {
                        std::thread::spawn(move || {
                            let _ = std::process::Command::new("bash")
                                .arg(&theme_script)
                                .status();
                        });
                    }
                }
            }

            Ok(())
        })
        // Register all Tauri commands
        .invoke_handler(tauri::generate_handler![
            // Platform
            commands::platform::get_platform,
            commands::platform::get_system_info,
            commands::platform::get_power_state,
            // Filesystem
            commands::filesystem::read_file,
            commands::filesystem::read_file_binary,
            commands::filesystem::write_file,
            commands::filesystem::write_file_binary,
            commands::filesystem::read_directory,
            commands::filesystem::get_file_stats,
            commands::filesystem::create_directory,
            commands::filesystem::delete_path,
            commands::filesystem::rename_path,
            commands::filesystem::copy_path,
            commands::filesystem::trash_path,
            commands::filesystem::watch_start,
            commands::filesystem::watch_stop,
            // Clipboard
            commands::clipboard::get_clipboard_text,
            commands::clipboard::set_clipboard_text,
            // Window
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::close_window,
            commands::window::is_maximized,
            commands::window::set_fullscreen,
            commands::window::is_fullscreen,
            // Display
            commands::display::get_displays,
            commands::display::get_theme,
            commands::display::get_display_config,
            commands::display::set_display_resolution,
            commands::display::set_display_rotation,
            // Shell
            commands::shell::open_external,
            commands::shell::open_path,
            commands::shell::show_item_in_folder,
            // Dialogs
            commands::dialogs::dialog_open_file,
            commands::dialogs::dialog_open_directory,
            commands::dialogs::dialog_save_file,
            commands::dialogs::dialog_message_box,
            // Terminal
            commands::terminal::terminal_execute,
            commands::terminal::pty_spawn,
            commands::terminal::pty_write,
            commands::terminal::pty_resize,
            commands::terminal::pty_kill,
            // System - WiFi
            commands::wifi::wifi_get_status,
            commands::wifi::wifi_set_enabled,
            commands::wifi::wifi_get_networks,
            commands::wifi::wifi_connect,
            // System - Bluetooth
            commands::bluetooth::bluetooth_get_status,
            commands::bluetooth::bluetooth_set_enabled,
            commands::bluetooth::bluetooth_get_devices,
            commands::bluetooth::bluetooth_connect,
            commands::bluetooth::bluetooth_disconnect,
            // System - Audio
            commands::audio::audio_get_volume,
            commands::audio::audio_set_volume,
            commands::audio::audio_set_muted,
            commands::audio::audio_get_devices,
            commands::audio::audio_set_default_device,
            commands::audio::audio_get_streams,
            // System - Brightness
            commands::brightness::brightness_get,
            commands::brightness::brightness_set,
            commands::brightness::night_light_set,
            // System - Battery
            commands::battery::battery_get_status,
            // System - Power
            commands::power::power_action,
            commands::power::power_get_profile,
            commands::power::power_set_profile,
            // System - Network
            commands::network::network_get_info,
            commands::network::network_get_connections,
            commands::network::network_get_vpns,
            commands::network::network_connect_vpn,
            commands::network::network_disconnect_vpn,
            // System - Processes
            commands::processes::process_list,
            commands::processes::process_kill,
            // System - Apps
            commands::apps::get_installed_apps,
            commands::apps::launch_app,
            commands::apps::get_app_icon,
            // System - Input
            commands::input::keyboard_get_layout,
            commands::input::keyboard_get_layouts,
            commands::input::keyboard_set_layout,
            commands::input::keyboard_get_repeat_rate,
            commands::input::keyboard_set_repeat_rate,
            commands::input::mouse_get_speed,
            commands::input::mouse_set_speed,
            commands::input::mouse_get_natural_scroll,
            commands::input::mouse_set_natural_scroll,
            // System - Locale & DateTime
            commands::locale::locale_get,
            commands::locale::locale_get_all,
            commands::locale::locale_set,
            commands::locale::datetime_get_status,
            commands::locale::datetime_get_timezones,
            commands::locale::datetime_set_timezone,
            commands::locale::datetime_set_ntp,
            // Session
            commands::session::get_session_info,
            commands::session::session_lock,
            commands::session::session_logout,
            commands::session::session_install,
            commands::session::get_autostart_apps,
            commands::session::set_autostart_app,
            // External windows
            commands::windows::external_window_list,
            commands::windows::external_window_focus,
            commands::windows::external_window_minimize,
            commands::windows::external_window_maximize,
            commands::windows::external_window_close,
            commands::windows::external_window_move,
            commands::windows::external_window_resize,
            // Workspaces
            commands::workspaces::workspace_list,
            commands::workspaces::workspace_switch,
            commands::workspaces::workspace_move_window,
            commands::workspaces::workspace_create,
            commands::workspaces::workspace_remove,
            // System tray
            commands::tray::tray_get_items,
            commands::tray::tray_item_activate,
            commands::tray::tray_item_menu,
            // Global menu
            commands::global_menu::menu_get_for_window,
            commands::global_menu::menu_activate_item,
            // Notifications daemon
            commands::notifications::notification_get_history,
            commands::notifications::notification_close,
            commands::notifications::notification_set_dnd,
            commands::notifications::notification_get_dnd,
            // Screenshot
            commands::screenshot::screenshot_take,
            commands::screenshot::screen_record_start,
            commands::screenshot::screen_record_stop,
            // XDG / MIME
            commands::xdg::xdg_get_default_app,
            commands::xdg::xdg_set_default_app,
            commands::xdg::xdg_get_mime_apps,
            commands::xdg::xdg_get_recent_files,
            commands::xdg::xdg_get_bookmarks,
            // Polkit
            commands::polkit::polkit_check_auth,
            commands::polkit::polkit_authenticate,
            // Printers
            commands::printers::printer_get_list,
            commands::printers::printer_get_default,
            commands::printers::printer_set_default,
            // Hardware info
            commands::hardware::hardware_get_gpu,
            commands::hardware::hardware_get_disks,
            commands::hardware::hardware_get_cpu,
            commands::hardware::hardware_get_memory,
            // Appearance
            commands::appearance::appearance_set_wallpaper,
            commands::appearance::appearance_set_gtk_theme,
            commands::appearance::appearance_set_icon_theme,
            commands::appearance::appearance_set_cursor_theme,
            commands::appearance::appearance_set_dark_mode,
            commands::appearance::appearance_set_accent_color,
            // Config
            commands::config::get_config,
            commands::config::set_config,
            commands::config::get_config_value,
            commands::config::set_config_value,
        ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running NextarOS");
}
