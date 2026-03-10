/**
 * Tauri Bridge — Drop-in replacement for electronAPI
 *
 * This module provides the same API surface as the old Electron preload.js
 * but uses Tauri's invoke() and event system under the hood.
 *
 * Usage: import { tauriAPI } from '@/utils/tauri-bridge'
 * Then replace window.electronAPI with tauriAPI
 */

// Dynamic imports for Tauri — these are tree-shaken in web builds
let invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
let listen: (event: string, handler: (event: any) => void) => Promise<() => void>;
let emit: (event: string, payload?: any) => Promise<void>;

const IS_TAURI = typeof window !== 'undefined' && '__TAURI__' in window;

if (IS_TAURI) {
    const tauri = (window as any).__TAURI__;
    invoke = tauri.core.invoke;
    listen = tauri.event.listen;
    emit = tauri.event.emit;
} else {
    // Fallback for web mode — all calls return defaults
    invoke = async () => null;
    listen = async () => () => {};
    emit = async () => {};
}

// ── Helper ──────────────────────────────────────────────────────────────────
function cmd<T = any>(command: string, args?: Record<string, unknown>): Promise<T> {
    return invoke(command, args);
}

// ── Event listeners ─────────────────────────────────────────────────────────
type UnlistenFn = () => void;
const listeners: Map<string, UnlistenFn> = new Map();

async function on(event: string, callback: (data: any) => void): Promise<void> {
    const unlisten = await listen(event, (e: any) => callback(e.payload));
    listeners.set(event, unlisten);
}

// ── The API ─────────────────────────────────────────────────────────────────
export const tauriAPI = {
    istauri: IS_TAURI,
    iselectron: false, // Backwards compat

    // Platform
    platform: {
        get: () => cmd('get_platform'),
        getsysteminfo: () => cmd('get_system_info'),
        getpowerstate: () => cmd('get_power_state'),
    },

    // App
    app: {
        getversion: () => Promise.resolve('1.0.0'),
        getconfig: () => cmd('get_config').catch(() => ({})),
        setconfig: (config: any) => cmd('set_config', { config }).catch(() => {}),
    },

    // Notifications
    notifications: {
        show: (title: string, body: string, options?: any) =>
            cmd('plugin:notification|notify', { title, body, ...options }),
    },

    // Filesystem
    filesystem: {
        readfile: (filepath: string) => cmd('read_file', { path: filepath }),
        readfilebinary: (filepath: string) => cmd('read_file_binary', { path: filepath }),
        writefile: (filepath: string, content: string) => cmd('write_file', { path: filepath, content }),
        writefilebinary: (filepath: string, content: Uint8Array) => cmd('write_file_binary', { path: filepath, content: Array.from(content) }),
        readdir: (dirpath: string) => cmd('read_directory', { path: dirpath }),
        getstats: (filepath: string) => cmd('get_file_stats', { path: filepath }),
        mkdir: (dirpath: string) => cmd('create_directory', { path: dirpath }),
        remove: (targetpath: string, recursive?: boolean) => cmd('delete_path', { path: targetpath, recursive }),
        rename: (oldpath: string, newpath: string) => cmd('rename_path', { oldPath: oldpath, newPath: newpath }),
        copy: (source: string, dest: string) => cmd('copy_path', { source, dest }),
        trash: (filepath: string) => cmd('trash_path', { path: filepath }),
        watchstart: (watchPath: string, options?: { recursive?: boolean }) =>
            cmd('watch_start', { path: watchPath, recursive: options?.recursive }),
        watchstop: (id: string) => cmd('watch_stop', { id }),
        watchstopall: () => Promise.resolve(), // TODO
        onwatchchange: (callback: (data: any) => void) => on('fs-watch-change', callback),
        onwatcherror: (callback: (data: any) => void) => on('fs-watch-error', callback),
    },

    // Shell
    shell: {
        openexternal: (url: string) => cmd('open_external', { url }),
        openpath: (filepath: string) => cmd('open_path', { path: filepath }),
        showinfolder: (filepath: string) => cmd('show_item_in_folder', { path: filepath }),
        openwith: (filepath: string, appname: string) => cmd('launch_app', { exec: appname, args: [filepath] }),
    },

    // Icons
    icons: {
        getdata: (iconpath: string) => cmd('get_app_icon', { iconName: iconpath }),
    },

    // Clipboard
    clipboard: {
        readtext: () => cmd('get_clipboard_text'),
        writetext: (text: string) => cmd('set_clipboard_text', { text }),
        readimage: () => Promise.resolve(null), // TODO
    },

    // Window
    window: {
        minimize: () => cmd('minimize_window'),
        maximize: () => cmd('maximize_window'),
        close: () => cmd('close_window'),
        ismaximized: () => cmd('is_maximized'),
        setfullscreen: (fullscreen: boolean) => cmd('set_fullscreen', { fullscreen }),
        isfullscreen: () => cmd('is_fullscreen'),
    },

    // Display
    display: {
        getall: () => cmd('get_displays'),
        gettheme: () => cmd('get_theme'),
    },

    // Updates
    updates: {
        check: () => cmd('plugin:updater|check').catch(() => null),
        install: () => cmd('plugin:updater|install').catch(() => {}),
        onavailable: (callback: (info: any) => void) => on('update-available', callback),
        ondownloaded: (callback: (info: any) => void) => on('update-downloaded', callback),
        onprogress: (callback: (progress: any) => void) => on('update-progress', callback),
        onstatus: (callback: (status: any) => void) => on('update-status', callback),
        onerror: (callback: (error: any) => void) => on('update-error', callback),
    },

    // Events
    events: {
        onglobalshortcut: (callback: (action: string) => void) => on('global-shortcut', callback),
        onpowerevent: (callback: (event: string) => void) => on('power-event', callback),
        onmenuaction: (callback: (action: string) => void) => on('menu-action', callback),
        onprotocolurl: (callback: (url: string) => void) => on('protocol-url', callback),
    },

    // WiFi
    wifi: {
        getstatus: () => cmd('wifi_get_status'),
        setenabled: (enabled: boolean) => cmd('wifi_set_enabled', { enabled }),
        getnetworks: () => cmd('wifi_get_networks'),
        connect: (ssid: string, password?: string) => cmd('wifi_connect', { ssid, password }),
    },

    // Bluetooth
    bluetooth: {
        getstatus: () => cmd('bluetooth_get_status'),
        setenabled: (enabled: boolean) => cmd('bluetooth_set_enabled', { enabled }),
        getdevices: () => cmd('bluetooth_get_devices'),
        connect: (address: string) => cmd('bluetooth_connect', { address }),
        disconnect: (address: string) => cmd('bluetooth_disconnect', { address }),
    },

    // Audio
    audio: {
        getvolume: () => cmd('audio_get_volume'),
        setvolume: (volume: number) => cmd('audio_set_volume', { volume }),
        setmuted: (muted: boolean) => cmd('audio_set_muted', { muted }),
        getdevices: () => cmd('audio_get_devices'),
        setdefaultdevice: (name: string, deviceType: string) => cmd('audio_set_default_device', { name, deviceType }),
        getstreams: () => cmd('audio_get_streams'),
    },

    // Brightness
    brightness: {
        get: () => cmd('brightness_get'),
        set: (level: number) => cmd('brightness_set', { level }),
        setnightlight: (enabled: boolean, temperature?: number) => cmd('night_light_set', { enabled, temperature }),
    },

    // Battery
    battery: {
        getstatus: () => cmd('battery_get_status'),
    },

    // Processes
    processes: {
        list: () => cmd('process_list'),
        kill: (pid: number, force?: boolean) => cmd('process_kill', { pid, force }),
    },

    // Power
    power: {
        shutdown: () => cmd('power_action', { action: 'shutdown' }),
        restart: () => cmd('power_action', { action: 'restart' }),
        sleep: () => cmd('power_action', { action: 'sleep' }),
        hibernate: () => cmd('power_action', { action: 'hibernate' }),
        logout: () => cmd('power_action', { action: 'logout' }),
        lock: () => cmd('power_action', { action: 'lock' }),
        getprofile: () => cmd('power_get_profile'),
        setprofile: (profile: string) => cmd('power_set_profile', { profile }),
    },

    // Apps
    apps: {
        getinstalled: () => cmd('get_installed_apps'),
        launch: (exec: string, args?: string[]) => cmd('launch_app', { exec, args }),
        geticon: (iconName: string) => cmd('get_app_icon', { iconName }),
    },

    // External Windows
    externalwindows: {
        list: () => cmd('external_window_list'),
        focus: (windowId: number) => cmd('external_window_focus', { windowId }),
        minimize: (windowId: number) => cmd('external_window_minimize', { windowId }),
        maximize: (windowId: number) => cmd('external_window_maximize', { windowId }),
        close: (windowId: number) => cmd('external_window_close', { windowId }),
        move: (windowId: number, x: number, y: number) => cmd('external_window_move', { windowId, x, y }),
        resize: (windowId: number, width: number, height: number) => cmd('external_window_resize', { windowId, width, height }),
    },

    // Desktop
    desktop: {
        setwallpaper: (imagepath: string) => cmd('appearance_set_wallpaper', { path: imagepath }),
    },

    // System
    system: {
        getnetworkinfo: () => cmd('network_get_info'),
        getdiskusage: () => cmd('hardware_get_disks'),
        getconnections: () => cmd('network_get_connections'),
        getvpns: () => cmd('network_get_vpns'),
        connectvpn: (name: string) => cmd('network_connect_vpn', { name }),
        disconnectvpn: (name: string) => cmd('network_disconnect_vpn', { name }),
    },

    // Keyboard
    keyboard: {
        getlayout: () => cmd('keyboard_get_layout'),
        getlayouts: () => cmd('keyboard_get_layouts'),
        setlayout: (layout: string, variant?: string) => cmd('keyboard_set_layout', { layout, variant }),
        getrepeatrate: () => cmd('keyboard_get_repeat_rate'),
        setrepeatrate: (delay: number, interval: number) => cmd('keyboard_set_repeat_rate', { delay, interval }),
    },

    // Mouse
    mouse: {
        getspeed: () => cmd('mouse_get_speed'),
        setspeed: (speed: number) => cmd('mouse_set_speed', { speed }),
        getnaturalscroll: () => cmd('mouse_get_natural_scroll'),
        setnaturalscroll: (enabled: boolean) => cmd('mouse_set_natural_scroll', { enabled }),
    },

    // Locale
    locale: {
        getlocale: () => cmd('locale_get'),
        getlocales: () => cmd('locale_get_all'),
        setlocale: (locale: string) => cmd('locale_set', { locale }),
    },

    // DateTime
    datetime: {
        getstatus: () => cmd('datetime_get_status'),
        gettimezones: () => cmd('datetime_get_timezones'),
        settimezone: (tz: string) => cmd('datetime_set_timezone', { tz }),
        setntp: (enabled: boolean) => cmd('datetime_set_ntp', { enabled }),
    },

    // Default apps
    defaultapps: {
        getbrowser: () => cmd('xdg_get_default_app', { mimeType: 'text/html' }),
        setbrowser: (desktop: string) => cmd('xdg_set_default_app', { mimeType: 'text/html', desktopFile: desktop }),
        gethandler: (mime: string) => cmd('xdg_get_default_app', { mimeType: mime }),
        sethandler: (mime: string, desktop: string) => cmd('xdg_set_default_app', { mimeType: mime, desktopFile: desktop }),
    },

    // Printers
    printers: {
        getprinters: () => cmd('printer_get_list'),
        getdefault: () => cmd('printer_get_default'),
        setdefault: (printer: string) => cmd('printer_set_default', { name: printer }),
    },

    // Terminal
    terminal: {
        execute: (command: string, cwd?: string) => cmd('terminal_execute', { command, cwd }),
        ptyspawn: (options: any) => cmd('pty_spawn', { options }),
        ptywrite: (id: string, data: string) => cmd('pty_write', { id, data }),
        ptyresize: (id: string, cols: number, rows: number) => cmd('pty_resize', { id, cols, rows }),
        ptykill: (id: string) => cmd('pty_kill', { id }),
        onptydata: (callback: (data: any) => void) => on('pty-data', callback),
        onptyexit: (callback: (data: any) => void) => on('pty-exit', callback),
    },

    // Session
    session: {
        getinfo: () => cmd('get_session_info'),
        oninfo: (callback: (info: any) => void) => on('session-info', callback),
        lock: () => cmd('session_lock'),
        logout: () => cmd('session_logout'),
        install: () => cmd('session_install'),
        onaction: (callback: (action: string) => void) => on('session-action', callback),
    },

    // Backwards compat alias
    shellinfo: {
        get: () => cmd('get_session_info'),
        oninfo: (callback: (info: any) => void) => on('session-info', callback),
    },

    // Display config
    displayconfig: {
        getconfig: () => cmd('get_display_config'),
        setresolution: (display: string, w: number, h: number, rate?: number) =>
            cmd('set_display_resolution', { display, width: w, height: h, rate }),
        setrotation: (display: string, rotation: string) =>
            cmd('set_display_rotation', { display, rotation }),
        onchanged: (callback: (data: any) => void) => on('display-changed', callback),
    },

    // Dialogs
    dialogs: {
        openfile: (options?: any) => cmd('dialog_open_file', { options }),
        opendirectory: (options?: any) => cmd('dialog_open_directory', { title: options?.title }),
        savefile: (options?: any) => cmd('dialog_save_file', { title: options?.title, defaultName: options?.defaultName }),
        messagebox: (options: any) => cmd('dialog_message_box', { title: options.title || '', message: options.message || '', kind: options.type }),
        errorbox: (title: string, content: string) => cmd('dialog_message_box', { title, message: content, kind: 'error' }),
    },

    // Screenshot
    screencapture: {
        getsources: () => Promise.resolve([]),
        capture: () => Promise.resolve(null),
        take: (mode: string, delay?: number) => cmd('screenshot_take', { mode, delay }),
    },

    // Print
    print: {
        page: () => Promise.resolve(),
        topdf: () => Promise.resolve(null),
        getprinters: () => cmd('printer_get_list'),
    },

    // Secure storage
    securestorage: {
        isavailable: () => Promise.resolve(IS_TAURI),
        encrypt: (plaintext: string) => Promise.resolve(plaintext), // TODO
        decrypt: (encrypted: string) => Promise.resolve(encrypted), // TODO
    },

    // Auto launch
    autolaunch: {
        getsettings: () => Promise.resolve({ openAtLogin: false }),
        setsettings: () => Promise.resolve(),
    },

    // Media
    media: {
        checkpermission: () => Promise.resolve('granted'),
        requestpermission: () => Promise.resolve('granted'),
    },

    // App badge
    appbadge: {
        setbadge: () => Promise.resolve(),
        setprogress: () => Promise.resolve(),
        bounce: () => Promise.resolve(),
    },

    // Hardware
    hardware: {
        getgpu: () => cmd('hardware_get_gpu'),
        getdisplays: () => cmd('get_displays'),
        getfonts: () => Promise.resolve([]),
        getdisks: () => cmd('hardware_get_disks'),
        getcpu: () => cmd('hardware_get_cpu'),
        getmemory: () => cmd('hardware_get_memory'),
    },

    // File associations
    fileassociations: {
        register: () => Promise.resolve(),
    },

    // ── NEW DE-specific APIs ──────────────────────────────────────────────

    // Workspaces
    workspaces: {
        list: () => cmd('workspace_list'),
        switch: (index: number) => cmd('workspace_switch', { index }),
        movewindow: (windowId: number, workspace: number) => cmd('workspace_move_window', { windowId, workspace }),
        create: (name?: string) => cmd('workspace_create', { name }),
        remove: (index: number) => cmd('workspace_remove', { index }),
    },

    // System Tray
    tray: {
        getitems: () => cmd('tray_get_items'),
        activate: (service: string, x: number, y: number) => cmd('tray_item_activate', { service, x, y }),
        getmenu: (service: string, menuPath: string) => cmd('tray_item_menu', { service, menuPath }),
        onregistered: (callback: (item: any) => void) => on('tray-item-registered', callback),
        onunregistered: (callback: (service: string) => void) => on('tray-item-unregistered', callback),
    },

    // Global Menu
    globalmenu: {
        getforwindow: (windowId: number) => cmd('menu_get_for_window', { windowId }),
        activateitem: (service: string, menuPath: string, itemId: number) =>
            cmd('menu_activate_item', { service, menuPath, itemId }),
        onregistered: (callback: (data: any) => void) => on('global-menu-registered', callback),
        onunregistered: (callback: (windowId: number) => void) => on('global-menu-unregistered', callback),
    },

    // Notification daemon
    notificationdaemon: {
        gethistory: () => cmd('notification_get_history'),
        close: (id: number) => cmd('notification_close', { id }),
        setdnd: (enabled: boolean) => cmd('notification_set_dnd', { enabled }),
        getdnd: () => cmd('notification_get_dnd'),
        onreceived: (callback: (notification: any) => void) => on('notification-received', callback),
        onclosed: (callback: (id: number) => void) => on('notification-closed', callback),
    },

    // Screenshots
    screenshot: {
        take: (mode: string, delay?: number) => cmd('screenshot_take', { mode, delay }),
        recordstart: (audio?: boolean) => cmd('screen_record_start', { audio }),
        recordstop: () => cmd('screen_record_stop'),
    },

    // XDG
    xdg: {
        getdefaultapp: (mimeType: string) => cmd('xdg_get_default_app', { mimeType }),
        setdefaultapp: (mimeType: string, desktopFile: string) => cmd('xdg_set_default_app', { mimeType, desktopFile }),
        getmimeapps: (mimeType: string) => cmd('xdg_get_mime_apps', { mimeType }),
        getrecentfiles: () => cmd('xdg_get_recent_files'),
        getbookmarks: () => cmd('xdg_get_bookmarks'),
    },

    // Appearance
    appearance: {
        setwallpaper: (path: string) => cmd('appearance_set_wallpaper', { path }),
        setgtktheme: (theme: string) => cmd('appearance_set_gtk_theme', { theme }),
        seticontheme: (theme: string) => cmd('appearance_set_icon_theme', { theme }),
        setcursortheme: (theme: string) => cmd('appearance_set_cursor_theme', { theme }),
        setdarkmode: (dark: boolean) => cmd('appearance_set_dark_mode', { dark }),
        setaccentcolor: (color: string) => cmd('appearance_set_accent_color', { color }),
    },

    // Polkit
    polkit: {
        checkauth: (actionId: string) => cmd('polkit_check_auth', { actionId }),
        authenticate: (actionId: string) => cmd('polkit_authenticate', { actionId }),
    },

    // Autostart
    autostart: {
        getapps: () => cmd('get_autostart_apps'),
        setapp: (desktopFile: string, enabled: boolean) => cmd('set_autostart_app', { desktopFile, enabled }),
    },

    // Screensaver inhibit
    screensaver: {
        oninhibitchanged: (callback: (data: any) => void) => on('screensaver-inhibit-changed', callback),
    },

    // Power profiles
    powerprofiles: {
        get: () => cmd('power_get_profile'),
        set: (profile: string) => cmd('power_set_profile', { profile }),
    },
};

// ── Backwards compatibility ─────────────────────────────────────────────────
// Make tauriAPI available as window.electronAPI for zero-change migration
if (typeof window !== 'undefined') {
    (window as any).electronAPI = tauriAPI;
    (window as any).tauriAPI = tauriAPI;
}

export default tauriAPI;
