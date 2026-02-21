const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, shell, screen, nativeTheme, powerMonitor, clipboard, globalShortcut, dialog, desktopCapturer, safeStorage, systemPreferences, protocol } = require('electron');

// CRITICAL: Disable Chrome sandbox on Linux BEFORE anything else.
// On Ubuntu 22.04+, the SUID sandbox binary isn't root-owned in .deb installs,
// and unprivileged user namespaces may be disabled. Without this, the app
// silently fails to launch. This is safe — NextarOS IS the desktop environment
// and already has full system access.
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('no-sandbox');

    // Wayland support: enable Ozone and let Chromium pick the right backend.
    // --ozone-platform-hint=auto lets Chromium detect X11 vs Wayland at runtime.
    // Works both nested inside GNOME and as the session itself.
    if (process.env.WAYLAND_DISPLAY) {
        app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
        app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
    }
}

const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const { exec } = require('child_process');
const mime = require('mime-types');

// Lazy-load system module — only when native system APIs are actually called
let _system = null;
function system() {
    if (!_system) _system = require('./system');
    return _system;
}

// Lazy-load node-pty — optional dependency for interactive terminal
let pty = null;
try { pty = require('node-pty'); } catch (e) { }

// File watcher and PTY session management
const watchers = new Map();
let nextWatcherId = 0;
const ptyProcesses = new Map();
let nextPtyId = 0;

// =============================================================================
//  RESOURCE OPTIMIZATION — Target: <1GB RAM at startup
// =============================================================================
const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
const isLowMem = totalMemMB < 4096;
const isUltraLowMem = totalMemMB < 2048;

// Aggressive V8 heap capping — this is a DE, not a browser; be frugal
if (isUltraLowMem) {
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128 --optimize-for-size --gc-interval=100');
} else if (isLowMem) {
    app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${Math.round(totalMemMB * 0.15)}`);
} else {
    app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${Math.min(512, Math.round(totalMemMB * 0.12))}`);
}

// GPU control
const disableGPU = process.env.NEXTAROS_DISABLE_GPU === '1' || isUltraLowMem;
if (disableGPU) {
    app.disableHardwareAcceleration();
} else {
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
}

// Chromium memory reduction flags
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-translate');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('disable-features', 'TranslateUI,SpareRendererForSitePerProcess');
if (isLowMem) {
    app.commandLine.appendSwitch('disable-smooth-scrolling');
    app.commandLine.appendSwitch('disable-features', 'TranslateUI,SpareRendererForSitePerProcess,IsolateOrigins,site-per-process');
}

// =============================================================================
//  SESSION DETECTION — In production, NextarOS IS the desktop environment
// =============================================================================
const IS_LINUX = process.platform === 'linux';
const IS_MAC = process.platform === 'darwin';
const IS_WINDOWS = process.platform === 'win32';
const PLATFORM = process.platform;

// Desktop session: only when explicitly launched as the DE (from display manager or --session flag)
// NOT when running as a regular app window inside another DE
const isDesktopSession =
    process.argv.includes('--session') ||
    process.env.NEXTAROS_SESSION === '1' ||
    process.env.XDG_SESSION_DESKTOP === 'nextaros' ||
    process.env.DESKTOP_SESSION === 'nextaros';

function getDisplayServer() {
    if (IS_MAC) return 'quartz';
    if (IS_WINDOWS) return 'win32';
    if (process.env.WAYLAND_DISPLAY) return 'wayland';
    if (process.env.DISPLAY) return 'x11';
    return 'unknown';
}

// =============================================================================
//  SESSION INSTALLATION — Register with Linux display managers
// =============================================================================

function installsession() {
    if (!IS_LINUX) return { success: false, error: 'Linux only' };
    const execPath = app.isPackaged
        ? process.execPath
        : `${process.execPath} ${path.join(app.getAppPath(), 'electron/main.js')}`;

    // X11 session file
    const x11SessionFile = [
        '[Desktop Entry]',
        'Name=NextarOS',
        'Comment=NextarOS Desktop Environment',
        `Exec=env DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros ${execPath} --no-sandbox --session`,
        `TryExec=${process.execPath}`,
        'Type=Application',
        'DesktopNames=NextarOS',
        'X-LightDM-DesktopName=NextarOS',
        ''
    ].join('\n');

    // NOTE: Only X11 sessions are supported. For Wayland sessions, the session
    // binary must BE the compositor. Electron is a Wayland client, not a compositor.
    // GDM/SDDM can still run X11 sessions on Wayland systems — it starts Xorg.

    const paths = [
        '/usr/share/xsessions/nextaros.desktop',
        path.join(os.homedir(), '.local/share/xsessions/nextaros.desktop')
    ];
    for (const p of paths) {
        try {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(p, x11SessionFile);
            return { success: true, path: p };
        } catch { continue; }
    }
    return { success: false, error: 'Could not write session file' };
}

// =============================================================================
//  PROTOCOL
// =============================================================================

function setupprotocol() {
    const apppath = app.getAppPath();
    const outdir = path.join(apppath, 'out');
    protocol.handle('app', (request) => {
        let urlpath = request.url.replace('app://-/', '');
        if (!urlpath || urlpath === '' || urlpath === '/') urlpath = 'index.html';
        urlpath = decodeURIComponent(urlpath);
        let filepath = path.join(outdir, urlpath);
        if (!fs.existsSync(filepath)) {
            if (fs.existsSync(filepath + '.html')) filepath = filepath + '.html';
            else if (fs.existsSync(path.join(filepath, 'index.html'))) filepath = path.join(filepath, 'index.html');
            else filepath = path.join(outdir, 'index.html');
        }
        const mimetype = mime.lookup(filepath) || 'application/octet-stream';
        return new Response(fs.readFileSync(filepath), { headers: { 'Content-Type': mimetype } });
    });
}

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
    { scheme: 'nextaros', privileges: { standard: true, secure: true } }
]);

let mainwindow = null;
let tray = null;
let isquitting = false;

const userdata = app.getPath('userData');
const configpath = path.join(userdata, 'nextaros-config.json');

function loadconfig() {
    try {
        if (fs.existsSync(configpath)) return JSON.parse(fs.readFileSync(configpath, 'utf-8'));
    } catch (e) { }
    return { theme: 'system', enablenotifications: true };
}

function saveconfig(config) {
    try { fs.writeFileSync(configpath, JSON.stringify(config, null, 2)); } catch (e) { }
}

// =============================================================================
//  WINDOW — This IS the desktop. Not a window in another DE.
// =============================================================================

function createwindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    const windowoptions = {
        show: false,
        backgroundColor: '#1c1c1e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            backgroundThrottling: false,
            spellcheck: false,
            // Memory: limit renderer image cache
            imageAnimationPolicy: 'noAnimation'
        }
    };

    if (isDesktopSession) {
        // THIS IS THE DESKTOP — fill the entire screen, no frame, no escape.
        // Use simpleFullscreen instead of fullscreen — fullscreen requires a WM
        // to handle _NET_WM_STATE_FULLSCREEN, but in session mode there IS no WM.
        // simpleFullscreen just sets the window to cover the screen directly.
        Object.assign(windowoptions, {
            width, height, x: 0, y: 0,
            frame: false,
            simpleFullscreen: true,
            skipTaskbar: true,
            resizable: false,
            closable: false,
            minimizable: false,
            alwaysOnTop: true,
        });
    } else {
        // Dev/app mode — regular window for development
        Object.assign(windowoptions, {
            width: Math.min(1400, width),
            height: Math.min(900, height),
            minWidth: 800,
            minHeight: 600,
            frame: false
        });
    }

    mainwindow = new BrowserWindow(windowoptions);

    mainwindow.once('ready-to-show', () => {
        mainwindow.show();
        if (!isDesktopSession) mainwindow.maximize();
    });

    if (app.isPackaged) {
        mainwindow.loadURL('app://-/');
    } else {
        mainwindow.loadURL('http://localhost:3000');
        mainwindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Permission handler
    mainwindow.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
        const allowed = ['media', 'mediaKeySystem', 'notifications', 'fullscreen', 'clipboard-read', 'clipboard-sanitized-write', 'pointerLock'];
        callback(allowed.includes(permission));
    });

    // Prevent close — this is the desktop, not an app window
    mainwindow.on('close', (event) => {
        if (!isquitting) {
            event.preventDefault();
            if (!isDesktopSession) mainwindow.hide();
            return false;
        }
        return true;
    });

    mainwindow.on('closed', () => { mainwindow = null; });

    // Send session info to renderer on load
    mainwindow.webContents.on('did-finish-load', () => {
        mainwindow.webContents.send('session-info', {
            isDesktopSession,
            isLowMem,
            isUltraLowMem,
            totalMemMB,
            disableGPU,
            platform: PLATFORM,
            displayServer: getDisplayServer()
        });
    });

    // Renderer crash recovery — critical for session mode where a crash = no desktop
    mainwindow.webContents.on('render-process-gone', (_, details) => {
        console.error('[NextarOS] Renderer crashed:', details.reason);
        if (isDesktopSession) {
            // In session mode, reload to restore the desktop
            setTimeout(() => {
                if (mainwindow && !mainwindow.isDestroyed()) {
                    console.log('[NextarOS] Reloading renderer after crash...');
                    mainwindow.loadURL(app.isPackaged ? 'app://-/' : 'http://localhost:3000');
                }
            }, 1000);
        }
    });

    // Handle page load failure (blank screen)
    mainwindow.webContents.on('did-fail-load', (_, errorCode, errorDesc) => {
        console.error('[NextarOS] Page load failed:', errorCode, errorDesc);
        if (isDesktopSession && app.isPackaged) {
            setTimeout(() => {
                if (mainwindow && !mainwindow.isDestroyed()) {
                    mainwindow.loadURL('app://-/');
                }
            }, 2000);
        }
    });
}

// =============================================================================
//  TRAY — Only in dev/app mode. In DE mode, WE are the panel.
// =============================================================================

function createtray() {
    if (isDesktopSession) return; // We ARE the desktop. No tray needed.

    const iconname = IS_WINDOWS ? 'tray-icon.ico' : 'tray-icon.png';
    const iconpath = app.isPackaged
        ? path.join(process.resourcesPath, 'public', iconname)
        : path.join(__dirname, '../public', iconname);
    try { tray = new Tray(iconpath); } catch (e) { return; }

    const contextmenu = Menu.buildFromTemplate([
        { label: 'Show NextarOS', click: () => { if (mainwindow) { mainwindow.show(); mainwindow.focus(); } } },
        { type: 'separator' },
        { label: 'Quit NextarOS', click: () => { isquitting = true; app.quit(); } }
    ]);
    tray.setToolTip('NextarOS');
    tray.setContextMenu(contextmenu);
    tray.on('click', () => { if (mainwindow) { mainwindow.isVisible() ? mainwindow.focus() : mainwindow.show(); } });
}

// =============================================================================
//  CLEANUP
// =============================================================================

function cleanupResources() {
    for (const [, watcher] of watchers) { try { watcher.close(); } catch (e) { } }
    watchers.clear();
    for (const [, proc] of ptyProcesses) { try { proc.kill(); } catch (e) { } }
    ptyProcesses.clear();
}

// =============================================================================
//  IPC HANDLERS
// =============================================================================

function setupipc() {
    // --- Platform & system info ---
    ipcMain.handle('get-platform', () => ({
        platform: PLATFORM,
        islinux: IS_LINUX,
        ismac: IS_MAC,
        iswindows: IS_WINDOWS,
        displayserver: getDisplayServer(),
        hostname: os.hostname(),
        username: os.userInfo().name,
        homedir: os.homedir(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalmem: os.totalmem(),
        freemem: os.freemem()
    }));

    ipcMain.handle('get-app-version', () => app.getVersion());

    ipcMain.handle('show-notification', async (_, title, body, options = {}) => {
        const config = loadconfig();
        if (!config.enablenotifications) return false;
        const notification = new Notification({ title, body, silent: options.silent || false, icon: options.icon });
        notification.show();
        return true;
    });

    // --- File operations: all async ---
    ipcMain.handle('read-file', async (_, filepath) => {
        try { return { success: true, content: await fsp.readFile(filepath, 'utf-8') }; }
        catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('write-file', async (_, filepath, content) => {
        try { await fsp.writeFile(filepath, content, 'utf-8'); return { success: true }; }
        catch (error) { return { success: false, error: error.message }; }
    });

    // Serve native app icons as data URLs (file:// is blocked from app:// origin)
    ipcMain.handle('get-icon-data', async (_, iconpath) => {
        try {
            if (!iconpath || !iconpath.startsWith('/')) return { success: false };
            const data = await fsp.readFile(iconpath);
            const ext = path.extname(iconpath).toLowerCase();
            const mimeMap = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.xpm': 'image/x-xpixmap', '.ico': 'image/x-icon' };
            const mimetype = mimeMap[ext] || 'image/png';
            return { success: true, dataurl: `data:${mimetype};base64,${data.toString('base64')}` };
        } catch { return { success: false }; }
    });

    ipcMain.handle('read-directory', async (_, dirpath) => {
        try {
            const items = await fsp.readdir(dirpath, { withFileTypes: true });
            return {
                success: true,
                items: items.map(item => ({
                    name: item.name,
                    isdir: item.isDirectory(),
                    isfile: item.isFile(),
                    issymlink: item.isSymbolicLink()
                }))
            };
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('get-file-stats', async (_, filepath) => {
        try {
            const stats = await fsp.stat(filepath);
            return {
                success: true,
                stats: {
                    size: stats.size, isdir: stats.isDirectory(), isfile: stats.isFile(),
                    created: stats.birthtime, modified: stats.mtime, accessed: stats.atime, mode: stats.mode
                }
            };
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('create-directory', async (_, dirpath) => {
        try { await fsp.mkdir(dirpath, { recursive: true }); return { success: true }; }
        catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('delete-path', async (_, targetpath, recursive = false) => {
        try {
            if (recursive) await fsp.rm(targetpath, { recursive: true, force: true });
            else await fsp.unlink(targetpath);
            return { success: true };
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('rename-path', async (_, oldpath, newpath) => {
        try { await fsp.rename(oldpath, newpath); return { success: true }; }
        catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('copy-path', async (_, source, dest) => {
        try { await fsp.copyFile(source, dest); return { success: true }; }
        catch (error) { return { success: false, error: error.message }; }
    });

    // --- Shell operations ---
    ipcMain.handle('open-external', async (_, url) => { await shell.openExternal(url); return true; });
    ipcMain.handle('open-path', async (_, filepath) => { await shell.openPath(filepath); return true; });
    ipcMain.handle('show-item-in-folder', (_, filepath) => { shell.showItemInFolder(filepath); return true; });

    // --- Clipboard ---
    ipcMain.handle('get-clipboard-text', () => clipboard.readText());
    ipcMain.handle('set-clipboard-text', (_, text) => { clipboard.writeText(text); return true; });
    ipcMain.handle('get-clipboard-image', () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        return image.toDataURL();
    });

    // --- Window management ---
    ipcMain.handle('minimize-window', () => { if (mainwindow && !isDesktopSession) mainwindow.minimize(); });
    ipcMain.handle('maximize-window', () => {
        if (mainwindow && !isDesktopSession) {
            mainwindow.isMaximized() ? mainwindow.unmaximize() : mainwindow.maximize();
        }
    });
    ipcMain.handle('close-window', () => { if (mainwindow && !isDesktopSession) mainwindow.close(); });
    ipcMain.handle('is-maximized', () => mainwindow ? mainwindow.isMaximized() : false);
    ipcMain.handle('set-fullscreen', (_, fullscreen) => { if (mainwindow) mainwindow.setFullScreen(fullscreen); });
    ipcMain.handle('is-fullscreen', () => mainwindow ? mainwindow.isFullScreen() : false);

    // --- Display ---
    ipcMain.handle('get-displays', () => {
        return screen.getAllDisplays().map(display => ({
            id: display.id, bounds: display.bounds, workarea: display.workArea,
            scalefactor: display.scaleFactor, rotation: display.rotation,
            isprimary: display.id === screen.getPrimaryDisplay().id
        }));
    });
    ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    // --- Updates ---
    ipcMain.handle('check-for-updates', async () => {
        if (app.isPackaged) {
            try { const result = await autoUpdater.checkForUpdates(); return { available: !!result }; }
            catch (e) { return { available: false, error: e.message }; }
        }
        return { available: false };
    });
    ipcMain.handle('install-update', () => { autoUpdater.quitAndInstall(); });

    // --- Config ---
    ipcMain.handle('get-config', () => loadconfig());
    ipcMain.handle('set-config', (_, config) => { saveconfig(config); return true; });

    // --- System info ---
    ipcMain.handle('get-system-info', () => ({
        platform: PLATFORM, arch: os.arch(), release: os.release(),
        hostname: os.hostname(), username: os.userInfo().name,
        homedir: os.homedir(), tmpdir: os.tmpdir(),
        cpus: os.cpus(), totalmem: os.totalmem(), freemem: os.freemem(),
        uptime: os.uptime(), networkinterfaces: os.networkInterfaces(), loadavg: os.loadavg()
    }));
    ipcMain.handle('get-power-state', () => ({ onbattery: powerMonitor.isOnBatteryPower?.() ?? false }));

    // --- Native system APIs (lazy-loaded) ---
    ipcMain.handle('system-wifi-status', () => system().getwifistatus());
    ipcMain.handle('system-wifi-enable', (_, enabled) => system().setwifienabled(enabled));
    ipcMain.handle('system-wifi-networks', () => system().getwifinetworks());
    ipcMain.handle('system-wifi-connect', (_, ssid, password) => system().connecttowifi(ssid, password));

    ipcMain.handle('system-bluetooth-status', () => system().getbluetoothstatus());
    ipcMain.handle('system-bluetooth-enable', (_, enabled) => system().setbluetoothenabled(enabled));
    ipcMain.handle('system-bluetooth-devices', () => system().getbluetoothdevices());

    ipcMain.handle('system-volume-get', () => system().getvolume());
    ipcMain.handle('system-volume-set', (_, volume) => system().setvolume(volume));
    ipcMain.handle('system-volume-mute', (_, muted) => system().setmuted(muted));

    ipcMain.handle('system-brightness-get', () => system().getbrightness());
    ipcMain.handle('system-brightness-set', (_, brightness) => system().setbrightness(brightness));

    ipcMain.handle('system-battery', () => system().getbatterystatus());

    ipcMain.handle('system-processes', () => system().getprocesses());
    ipcMain.handle('system-process-kill', (_, pid, force) => system().killprocess(pid, force));

    ipcMain.handle('system-power-action', (_, action) => system().poweraction(action));

    ipcMain.handle('system-launch-app', (_, apppath, args) => system().launchapp(apppath, args));
    ipcMain.handle('system-installed-apps', () => system().getinstalledapps());
    ipcMain.handle('system-open-with', (_, filepath, appname) => system().openfilewithapp(filepath, appname));

    ipcMain.handle('system-windows', () => system().getwindowlist());
    ipcMain.handle('system-window-focus', (_, windowid) => system().focuswindow(windowid));
    ipcMain.handle('system-window-minimize', (_, windowid) => system().minimizewindow(windowid));
    ipcMain.handle('system-window-close', (_, windowid) => system().closewindow(windowid));

    ipcMain.handle('system-wallpaper', (_, imagepath) => system().setwallpaper(imagepath));
    ipcMain.handle('system-network-info', () => system().getnetworkinfo());
    ipcMain.handle('system-disk-usage', () => system().getdiskusage());
    ipcMain.handle('system-trash', (_, filepath) => system().trash(filepath));
    ipcMain.handle('terminal-execute', (_, command, cwd) => system().executeshell(command, cwd));

    // --- Keyboard ---
    ipcMain.handle('system:keyboard:getlayout', () => system().keyboard.getlayout());
    ipcMain.handle('system:keyboard:getlayouts', () => system().keyboard.getlayouts());
    ipcMain.handle('system:keyboard:setlayout', (_, layout) => system().keyboard.setlayout(layout));
    ipcMain.handle('system:keyboard:getrepeatrate', () => system().keyboard.getrepeatrate());
    ipcMain.handle('system:keyboard:setrepeatrate', (_, delay, interval) => system().keyboard.setrepeatrate(delay, interval));

    // --- Mouse ---
    ipcMain.handle('system:mouse:getspeed', () => system().mouse.getspeed());
    ipcMain.handle('system:mouse:setspeed', (_, speed) => system().mouse.setspeed(speed));
    ipcMain.handle('system:mouse:getnaturalscroll', () => system().mouse.getnaturalscroll());
    ipcMain.handle('system:mouse:setnaturalscroll', (_, enabled) => system().mouse.setnaturalscroll(enabled));

    // --- Locale ---
    ipcMain.handle('system:locale:getlocale', () => system().locale.getlocale());
    ipcMain.handle('system:locale:getlocales', () => system().locale.getlocales());
    ipcMain.handle('system:locale:setlocale', (_, locale) => system().locale.setlocale(locale));

    // --- Date/Time ---
    ipcMain.handle('system:datetime:getstatus', () => system().datetime.getstatus());
    ipcMain.handle('system:datetime:gettimezones', () => system().datetime.gettimezones());
    ipcMain.handle('system:datetime:settimezone', (_, tz) => system().datetime.settimezone(tz));
    ipcMain.handle('system:datetime:setntp', (_, enabled) => system().datetime.setntp(enabled));

    // --- Default Apps ---
    ipcMain.handle('system:defaultapps:getbrowser', () => system().defaultapps.getdefaultbrowser());
    ipcMain.handle('system:defaultapps:setbrowser', (_, desktop) => system().defaultapps.setdefaultbrowser(desktop));
    ipcMain.handle('system:defaultapps:gethandler', (_, mime) => system().defaultapps.getfiletypehandler(mime));
    ipcMain.handle('system:defaultapps:sethandler', (_, mime, desktop) => system().defaultapps.setfiletypehandler(mime, desktop));

    // --- Printers ---
    ipcMain.handle('system:printers:getprinters', () => system().printers.getprinters());
    ipcMain.handle('system:printers:getdefault', () => system().printers.getdefault());
    ipcMain.handle('system:printers:setdefault', (_, printer) => system().printers.setdefault(printer));

    // --- Session info (backwards compat: get-shell-info still works) ---
    const sessionInfo = () => ({
        isDesktopSession,
        isShellMode: isDesktopSession, // backwards compat
        isLowMem,
        isUltraLowMem,
        totalMemMB,
        disableGPU,
        platform: PLATFORM,
        displayServer: getDisplayServer(),
        isPackaged: app.isPackaged,
        execPath: process.execPath,
        appPath: app.getAppPath()
    });
    ipcMain.handle('get-session-info', sessionInfo);
    ipcMain.handle('get-shell-info', sessionInfo);

    // =========================================================================
    //  DESKTOP ENVIRONMENT FEATURES
    // =========================================================================

    // --- Native Dialogs ---
    ipcMain.handle('dialog-open-file', async (_, options) => {
        const props = ['openFile'];
        if (options?.multiSelections) props.push('multiSelections');
        if (options?.showHiddenFiles) props.push('showHiddenFiles');
        const result = await dialog.showOpenDialog(mainwindow, {
            properties: props, filters: options?.filters || [],
            defaultPath: options?.defaultPath, title: options?.title
        });
        return { canceled: result.canceled, filePaths: result.filePaths };
    });

    ipcMain.handle('dialog-open-directory', async (_, options) => {
        const props = ['openDirectory'];
        if (options?.createDirectory) props.push('createDirectory');
        const result = await dialog.showOpenDialog(mainwindow, {
            properties: props, defaultPath: options?.defaultPath, title: options?.title
        });
        return { canceled: result.canceled, filePaths: result.filePaths };
    });

    ipcMain.handle('dialog-save-file', async (_, options) => {
        const result = await dialog.showSaveDialog(mainwindow, {
            filters: options?.filters || [], defaultPath: options?.defaultPath, title: options?.title
        });
        return { canceled: result.canceled, filePath: result.filePath };
    });

    ipcMain.handle('dialog-message-box', async (_, options) => {
        const result = await dialog.showMessageBox(mainwindow, {
            type: options?.type || 'info', title: options?.title || '',
            message: options?.message || '', detail: options?.detail,
            buttons: options?.buttons || ['OK'], defaultId: options?.defaultId || 0,
            cancelId: options?.cancelId, checkboxLabel: options?.checkboxLabel,
            checkboxChecked: options?.checkboxChecked
        });
        return { response: result.response, checkboxChecked: result.checkboxChecked };
    });

    ipcMain.handle('dialog-error-box', (_, title, content) => { dialog.showErrorBox(title, content); });

    // --- Screen Capture ---
    ipcMain.handle('screen-get-sources', async (_, options) => {
        const sources = await desktopCapturer.getSources({
            types: options?.types || ['window', 'screen'],
            thumbnailSize: options?.thumbnailSize || { width: 300, height: 300 }
        });
        return sources.map(s => ({
            id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL(),
            display_id: s.display_id,
            appIcon: s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null
        }));
    });

    ipcMain.handle('screen-capture', async (_, sourceId, options) => {
        const sources = await desktopCapturer.getSources({
            types: ['window', 'screen'],
            thumbnailSize: options?.size || { width: 1920, height: 1080 }
        });
        const source = sources.find(s => s.id === sourceId);
        if (!source) return { success: false, error: 'Source not found' };
        return { success: true, dataURL: source.thumbnail.toDataURL() };
    });

    // --- File Watchers ---
    ipcMain.handle('fs-watch-start', (_, watchPath, options) => {
        const id = nextWatcherId++;
        try {
            const watcher = fs.watch(watchPath, { recursive: options?.recursive || false }, (eventType, filename) => {
                if (mainwindow && !mainwindow.isDestroyed()) {
                    mainwindow.webContents.send('fs-watch-change', { id, eventType, filename, path: watchPath });
                }
            });
            watcher.on('error', (error) => {
                if (mainwindow && !mainwindow.isDestroyed()) {
                    mainwindow.webContents.send('fs-watch-error', { id, error: error.message, path: watchPath });
                }
                watchers.delete(id);
            });
            watchers.set(id, watcher);
            return { success: true, id };
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('fs-watch-stop', (_, id) => {
        const watcher = watchers.get(id);
        if (watcher) { watcher.close(); watchers.delete(id); return { success: true }; }
        return { success: false, error: 'Watcher not found' };
    });

    ipcMain.handle('fs-watch-stop-all', () => {
        for (const [, watcher] of watchers) { watcher.close(); }
        watchers.clear();
        return { success: true };
    });

    // --- PTY Terminal (Interactive) ---
    ipcMain.handle('pty-spawn', (_, options) => {
        if (!pty) return { success: false, error: 'node-pty not available — install with: npm i node-pty' };
        const id = nextPtyId++;
        const shellName = process.env.SHELL || '/bin/bash';
        try {
            const proc = pty.spawn(options?.shell || shellName, options?.args || [], {
                name: 'xterm-256color',
                cols: options?.cols || 80, rows: options?.rows || 24,
                cwd: options?.cwd || os.homedir(),
                env: { ...process.env, ...(options?.env || {}) }
            });
            proc.onData((data) => {
                if (mainwindow && !mainwindow.isDestroyed()) mainwindow.webContents.send('pty-data', { id, data });
            });
            proc.onExit(({ exitCode, signal }) => {
                if (mainwindow && !mainwindow.isDestroyed()) mainwindow.webContents.send('pty-exit', { id, exitCode, signal });
                ptyProcesses.delete(id);
            });
            ptyProcesses.set(id, proc);
            return { success: true, id, pid: proc.pid };
        } catch (error) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('pty-write', (_, id, data) => { const p = ptyProcesses.get(id); if (p) { p.write(data); return true; } return false; });
    ipcMain.handle('pty-resize', (_, id, cols, rows) => { const p = ptyProcesses.get(id); if (p) { p.resize(cols, rows); return true; } return false; });
    ipcMain.handle('pty-kill', (_, id) => { const p = ptyProcesses.get(id); if (p) { p.kill(); ptyProcesses.delete(id); return true; } return false; });

    // --- Printing ---
    ipcMain.handle('print-page', (_, options) => { if (!mainwindow) return { success: false }; mainwindow.webContents.print(options || {}); return { success: true }; });
    ipcMain.handle('print-to-pdf', async (_, options) => {
        if (!mainwindow) return { success: false };
        const data = await mainwindow.webContents.printToPDF(options || {});
        return { success: true, data: data.toString('base64') };
    });
    ipcMain.handle('get-printers', async () => { if (!mainwindow) return []; return mainwindow.webContents.getPrintersAsync(); });

    // --- File Associations ---
    ipcMain.handle('register-file-association', (_, extension, appName, appPath) => system().registerfileassociation(extension, appName, appPath));

    // --- Secure Storage (OS Keychain/libsecret) ---
    ipcMain.handle('secure-storage-available', () => safeStorage.isEncryptionAvailable());
    ipcMain.handle('secure-storage-encrypt', (_, plaintext) => {
        if (!safeStorage.isEncryptionAvailable()) return { success: false, error: 'Encryption not available' };
        try { return { success: true, data: safeStorage.encryptString(plaintext).toString('base64') }; }
        catch (e) { return { success: false, error: e.message }; }
    });
    ipcMain.handle('secure-storage-decrypt', (_, encryptedBase64) => {
        if (!safeStorage.isEncryptionAvailable()) return { success: false, error: 'Encryption not available' };
        try { return { success: true, data: safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64')) }; }
        catch (e) { return { success: false, error: e.message }; }
    });

    // --- Auto-launch ---
    ipcMain.handle('get-login-item-settings', () => app.getLoginItemSettings());
    ipcMain.handle('set-login-item-settings', (_, settings) => {
        app.setLoginItemSettings({ openAtLogin: settings.openAtLogin, openAsHidden: settings.openAsHidden || false });
        return { success: true };
    });

    // --- Media Permissions ---
    ipcMain.handle('media-check-permission', (_, mediaType) => {
        if (IS_MAC) return systemPreferences.getMediaAccessStatus(mediaType);
        return 'granted'; // Linux doesn't gate at the DE level
    });
    ipcMain.handle('media-request-permission', async (_, mediaType) => {
        if (IS_MAC) { const granted = await systemPreferences.askForMediaAccess(mediaType); return { granted }; }
        return { granted: true };
    });

    // --- App badge / progress ---
    ipcMain.handle('app-badge-set', () => ({ success: false, error: 'Not applicable — this IS the DE' }));
    ipcMain.handle('app-progress-set', (_, progress) => {
        if (mainwindow) { mainwindow.setProgressBar(progress); return { success: true }; }
        return { success: false };
    });
    ipcMain.handle('app-bounce', () => ({ success: false, error: 'Not applicable — this IS the DE' }));

    // --- Hardware Info ---
    ipcMain.handle('system-gpu-info', async () => {
        try { return await app.getGPUInfo('complete'); }
        catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('system-fonts', () => system().getsystemfonts());
    ipcMain.handle('system-display-info', () => system().getdisplayinfo());

    // --- Menu action relay ---
    ipcMain.handle('menu-action-send', (_, action) => {
        if (mainwindow) mainwindow.webContents.send('menu-action', action);
        return { success: true };
    });

    // =========================================================================
    //  SESSION MANAGEMENT — This DE controls the session
    // =========================================================================

    ipcMain.handle('install-session', () => installsession());

    ipcMain.handle('session-lock', () => {
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('session-action', 'lock');
            return { success: true };
        }
        return { success: false };
    });

    ipcMain.handle('session-logout', () => {
        isquitting = true;
        if (IS_LINUX && isDesktopSession) {
            // End the display server session — returns to display manager greeter
            system().poweraction('logout');
        }
        app.quit();
        return { success: true };
    });

    // =========================================================================
    //  DISPLAY CONFIGURATION — We manage the displays
    // =========================================================================

    ipcMain.handle('get-display-config', () => system().getdisplayconfig());
    ipcMain.handle('set-display-resolution', (_, display, width, height, refreshRate) =>
        system().setdisplayresolution(display, width, height, refreshRate));
    ipcMain.handle('set-display-rotation', (_, display, rotation) =>
        system().setdisplayrotation(display, rotation));
}

// =============================================================================
//  THEME INSTALLATION — Apply GTK/Qt themes on session login
// =============================================================================

function installthemes() {
    if (!IS_LINUX) return;
    // Themes are bundled alongside the app — find them relative to the app path
    const themesDir = app.isPackaged
        ? path.join(process.resourcesPath, 'themes')
        : path.join(__dirname, '..', 'themes');
    const script = path.join(themesDir, 'install-themes.sh');
    if (!fs.existsSync(script)) {
        console.log('[NextarOS] Theme installer not found at', script);
        return;
    }
    exec(`bash "${script}"`, (error, stdout, stderr) => {
        if (error) console.error('[NextarOS] Theme install error:', stderr);
        else console.log(stdout.trim());
    });
}

// =============================================================================
//  AUTO UPDATER
// =============================================================================

function setupautoupdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => { if (mainwindow) mainwindow.webContents.send('update-status', 'checking'); });
    autoUpdater.on('update-available', (info) => { if (mainwindow) { mainwindow.webContents.send('update-status', 'available'); mainwindow.webContents.send('update-available', info); } });
    autoUpdater.on('update-not-available', () => { if (mainwindow) mainwindow.webContents.send('update-status', 'not-available'); });
    autoUpdater.on('download-progress', (progress) => { if (mainwindow) mainwindow.webContents.send('update-progress', progress); });
    autoUpdater.on('update-downloaded', (info) => { if (mainwindow) { mainwindow.webContents.send('update-status', 'downloaded'); mainwindow.webContents.send('update-downloaded', info); } });
    autoUpdater.on('error', (error) => { if (mainwindow) mainwindow.webContents.send('update-error', error.message); });
}

// =============================================================================
//  GLOBAL SHORTCUTS — This is the DE. We own ALL shortcuts.
// =============================================================================

function setupglobalshortcuts() {
    const send = (action) => {
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('global-shortcut', action);
            mainwindow.show();
            mainwindow.focus();
        }
    };

    const shortcuts = isDesktopSession ? {
        // Core DE shortcuts — we own the desktop
        'Super+Space': 'search',
        'Super+Tab': 'app-switcher',
        'Super+L': 'lock-screen',
        'Super+E': 'file-manager',
        'Super+T': 'terminal',
        'Alt+F2': 'run-dialog',
        'Print': 'screenshot',
        'Alt+Print': 'screenshot-window',
        'CommandOrControl+Alt+Delete': 'system-menu',
    } : {
        // App mode — minimal shortcuts
        'Super+Space': 'search',
        'Super+Tab': 'app-switcher',
    };

    for (const [key, action] of Object.entries(shortcuts)) {
        try { globalShortcut.register(key, () => send(action)); } catch (e) { }
    }
}

// =============================================================================
//  POWER MONITOR
// =============================================================================

function setuppowermonitor() {
    const events = ['suspend', 'resume', 'on-ac', 'on-battery', 'lock-screen', 'unlock-screen'];
    for (const event of events) {
        powerMonitor.on(event, () => {
            if (mainwindow) mainwindow.webContents.send('power-event', event);
        });
    }
}

// =============================================================================
//  DISPLAY MONITOR — React to hot-plug, resolution changes
// =============================================================================

function setupdisplaymonitor() {
    screen.on('display-added', (_, display) => {
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('display-changed', { event: 'added', display });
        }
    });
    screen.on('display-removed', (_, display) => {
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('display-changed', { event: 'removed', display });
        }
    });
    screen.on('display-metrics-changed', (_, display, changedMetrics) => {
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('display-changed', { event: 'metrics-changed', display, changedMetrics });
        }
    });
}

// =============================================================================
//  APP LIFECYCLE
// =============================================================================

const gotthelock = app.requestSingleInstanceLock();

if (!gotthelock) {
    app.quit();
} else {
    app.on('second-instance', (_, commandLine) => {
        if (mainwindow) {
            if (mainwindow.isMinimized()) mainwindow.restore();
            mainwindow.show();
            mainwindow.focus();
        }
        const protocolUrl = commandLine.find(arg => arg.startsWith('nextaros://'));
        if (protocolUrl && mainwindow) {
            mainwindow.webContents.send('protocol-url', protocolUrl);
        }
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        if (mainwindow && !mainwindow.isDestroyed()) {
            mainwindow.webContents.send('protocol-url', url);
            mainwindow.show();
            mainwindow.focus();
        }
    });

    app.whenReady().then(() => {
        setupprotocol();
        setupipc();
        setupautoupdater();
        setuppowermonitor();
        setupdisplaymonitor();
        createwindow();
        createtray();
        setupglobalshortcuts();

        // Register nextaros:// protocol
        if (!app.isDefaultProtocolClient('nextaros')) {
            app.setAsDefaultProtocolClient('nextaros');
        }

        // Auto-install session file on Linux (so display managers can see us)
        if (IS_LINUX && app.isPackaged) {
            installsession();
        }

        // Apply GTK/Qt themes on session login so native Linux apps match the DE
        if (IS_LINUX && isDesktopSession) {
            installthemes();
        }

        if (app.isPackaged) {
            autoUpdater.checkForUpdates().catch(() => { });
        }
    });

    app.on('window-all-closed', () => {
        // In DE mode, NEVER quit on window close — that would kill the desktop
        if (!isDesktopSession) app.quit();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createwindow();
        else if (mainwindow) mainwindow.show();
    });

    app.on('before-quit', () => {
        isquitting = true;
        globalShortcut.unregisterAll();
        cleanupResources();
    });
}
