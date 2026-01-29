const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, shell, screen, nativeTheme, powerMonitor, clipboard, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const system = require('./system');

const { protocol } = require('electron');
const mime = require('mime-types');

function setupprotocol() {
    const apppath = app.getAppPath();
    const outdir = path.join(apppath, 'out');

    protocol.handle('app', (request) => {
        let urlpath = request.url.replace('app://-/', '');

        if (!urlpath || urlpath === '' || urlpath === '/') {
            urlpath = 'index.html';
        }

        urlpath = decodeURIComponent(urlpath);

        let filepath = path.join(outdir, urlpath);

        if (!fs.existsSync(filepath)) {
            if (fs.existsSync(filepath + '.html')) {
                filepath = filepath + '.html';
            } else if (fs.existsSync(path.join(filepath, 'index.html'))) {
                filepath = path.join(filepath, 'index.html');
            } else {
                filepath = path.join(outdir, 'index.html');
            }
        }

        const mimetype = mime.lookup(filepath) || 'application/octet-stream';

        return new Response(fs.readFileSync(filepath), {
            headers: { 'Content-Type': mimetype }
        });
    });
}

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

let mainwindow = null;
let tray = null;
let isquitting = false;

const PLATFORM = process.platform;
const IS_LINUX = PLATFORM === 'linux';
const IS_MAC = PLATFORM === 'darwin';
const IS_WINDOWS = PLATFORM === 'win32';

const userdata = app.getPath('userData');
const configpath = path.join(userdata, 'nextarde-config.json');

function loadconfig() {
    try {
        if (fs.existsSync(configpath)) {
            return JSON.parse(fs.readFileSync(configpath, 'utf-8'));
        }
    } catch (e) { }
    return {
        theme: 'system',
        startminimized: false,
        autohidetray: false,
        enablenotifications: true
    };
}

function saveconfig(config) {
    try {
        fs.writeFileSync(configpath, JSON.stringify(config, null, 2));
    } catch (e) { }
}

function createwindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const windowoptions = {
        width: Math.min(1400, width),
        height: Math.min(900, height),
        minWidth: 800,
        minHeight: 600,
        show: false,
        backgroundColor: '#1c1c1e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    };

    if (IS_MAC) {
        windowoptions.titleBarStyle = 'hiddenInset';
        windowoptions.trafficLightPosition = { x: 15, y: 15 };
        windowoptions.vibrancy = 'under-window';
        windowoptions.visualEffectState = 'followWindow';
    } else if (IS_LINUX) {
        windowoptions.frame = false;
        windowoptions.transparent = false;
    } else if (IS_WINDOWS) {
        windowoptions.frame = false;
        windowoptions.transparent = false;
    }

    mainwindow = new BrowserWindow(windowoptions);

    mainwindow.once('ready-to-show', () => {
        mainwindow.show();
        if (IS_LINUX) {
            mainwindow.maximize();
        }
    });

    if (app.isPackaged) {
        mainwindow.loadURL('app://-/');
    } else {
        mainwindow.loadURL('http://localhost:3000');
        mainwindow.webContents.openDevTools({ mode: 'detach' });
    }

    mainwindow.on('close', (event) => {
        if (!isquitting) {
            event.preventDefault();
            mainwindow.hide();
            return false;
        }
        return true;
    });

    mainwindow.on('closed', () => {
        mainwindow = null;
    });
}

function createtray() {
    const iconname = IS_WINDOWS ? 'tray-icon.ico' : 'tray-icon.png';
    const iconpath = app.isPackaged
        ? path.join(process.resourcesPath, 'public', iconname)
        : path.join(__dirname, '../public', iconname);

    try {
        tray = new Tray(iconpath);
    } catch (e) {
        return;
    }

    const contextmenu = Menu.buildFromTemplate([
        {
            label: 'Show NextarDE',
            click: () => {
                if (mainwindow) {
                    mainwindow.show();
                    mainwindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Check for Updates',
            click: () => {
                if (app.isPackaged) {
                    try {
                        autoUpdater.checkForUpdates().catch(() => { });
                    } catch (e) { }
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit NextarDE',
            click: () => {
                isquitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('NextarDE');
    tray.setContextMenu(contextmenu);

    tray.on('click', () => {
        if (mainwindow) {
            if (mainwindow.isVisible()) {
                mainwindow.focus();
            } else {
                mainwindow.show();
            }
        }
    });

    tray.on('double-click', () => {
        if (mainwindow) {
            mainwindow.show();
            mainwindow.focus();
        }
    });
}

function setupipc() {
    ipcMain.handle('get-platform', () => ({
        platform: PLATFORM,
        islinux: IS_LINUX,
        ismac: IS_MAC,
        iswindows: IS_WINDOWS,
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

        const notification = new Notification({
            title,
            body,
            silent: options.silent || false,
            icon: options.icon
        });
        notification.show();
        return true;
    });

    ipcMain.handle('read-file', async (_, filepath) => {
        try {
            const content = fs.readFileSync(filepath, 'utf-8');
            return { success: true, content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('write-file', async (_, filepath, content) => {
        try {
            fs.writeFileSync(filepath, content, 'utf-8');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('read-directory', async (_, dirpath) => {
        try {
            const items = fs.readdirSync(dirpath, { withFileTypes: true });
            return {
                success: true,
                items: items.map(item => ({
                    name: item.name,
                    isdir: item.isDirectory(),
                    isfile: item.isFile(),
                    issymlink: item.isSymbolicLink()
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-file-stats', async (_, filepath) => {
        try {
            const stats = fs.statSync(filepath);
            return {
                success: true,
                stats: {
                    size: stats.size,
                    isdir: stats.isDirectory(),
                    isfile: stats.isFile(),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    accessed: stats.atime,
                    mode: stats.mode
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('create-directory', async (_, dirpath) => {
        try {
            fs.mkdirSync(dirpath, { recursive: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-path', async (_, targetpath, recursive = false) => {
        try {
            if (recursive) {
                fs.rmSync(targetpath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(targetpath);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rename-path', async (_, oldpath, newpath) => {
        try {
            fs.renameSync(oldpath, newpath);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copy-path', async (_, source, dest) => {
        try {
            fs.copyFileSync(source, dest);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-external', async (_, url) => {
        await shell.openExternal(url);
        return true;
    });

    ipcMain.handle('open-path', async (_, filepath) => {
        await shell.openPath(filepath);
        return true;
    });

    ipcMain.handle('show-item-in-folder', async (_, filepath) => {
        shell.showItemInFolder(filepath);
        return true;
    });

    ipcMain.handle('get-clipboard-text', () => clipboard.readText());

    ipcMain.handle('set-clipboard-text', (_, text) => {
        clipboard.writeText(text);
        return true;
    });

    ipcMain.handle('get-clipboard-image', () => {
        const image = clipboard.readImage();
        if (image.isEmpty()) return null;
        return image.toDataURL();
    });

    ipcMain.handle('minimize-window', () => {
        if (mainwindow) mainwindow.minimize();
    });

    ipcMain.handle('maximize-window', () => {
        if (mainwindow) {
            if (mainwindow.isMaximized()) {
                mainwindow.unmaximize();
            } else {
                mainwindow.maximize();
            }
        }
    });

    ipcMain.handle('close-window', () => {
        if (mainwindow) mainwindow.close();
    });

    ipcMain.handle('is-maximized', () => {
        return mainwindow ? mainwindow.isMaximized() : false;
    });

    ipcMain.handle('set-fullscreen', (_, fullscreen) => {
        if (mainwindow) mainwindow.setFullScreen(fullscreen);
    });

    ipcMain.handle('is-fullscreen', () => {
        return mainwindow ? mainwindow.isFullScreen() : false;
    });

    ipcMain.handle('get-displays', () => {
        return screen.getAllDisplays().map(display => ({
            id: display.id,
            bounds: display.bounds,
            workarea: display.workArea,
            scalefactor: display.scaleFactor,
            rotation: display.rotation,
            isprimary: display.id === screen.getPrimaryDisplay().id
        }));
    });

    ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

    ipcMain.handle('check-for-updates', async () => {
        if (app.isPackaged) {
            try {
                const result = await autoUpdater.checkForUpdates();
                return { available: !!result };
            } catch (e) {
                return { available: false, error: e.message };
            }
        }
        return { available: false };
    });

    ipcMain.handle('install-update', () => {
        autoUpdater.quitAndInstall();
    });

    ipcMain.handle('get-config', () => loadconfig());

    ipcMain.handle('set-config', (_, config) => {
        saveconfig(config);
        return true;
    });

    ipcMain.handle('get-system-info', () => ({
        platform: PLATFORM,
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        username: os.userInfo().name,
        homedir: os.homedir(),
        tmpdir: os.tmpdir(),
        cpus: os.cpus(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        uptime: os.uptime(),
        networkinterfaces: os.networkInterfaces(),
        loadavg: os.loadavg()
    }));

    ipcMain.handle('get-power-state', () => ({
        onbattery: powerMonitor.isOnBatteryPower?.() ?? false
    }));

    ipcMain.handle('system-wifi-status', () => system.getwifistatus());
    ipcMain.handle('system-wifi-enable', (_, enabled) => system.setwifienabled(enabled));
    ipcMain.handle('system-wifi-networks', () => system.getwifinetworks());
    ipcMain.handle('system-wifi-connect', (_, ssid, password) => system.connecttowifi(ssid, password));

    ipcMain.handle('system-bluetooth-status', () => system.getbluetoothstatus());
    ipcMain.handle('system-bluetooth-enable', (_, enabled) => system.setbluetoothenabled(enabled));
    ipcMain.handle('system-bluetooth-devices', () => system.getbluetoothdevices());

    ipcMain.handle('system-volume-get', () => system.getvolume());
    ipcMain.handle('system-volume-set', (_, volume) => system.setvolume(volume));
    ipcMain.handle('system-volume-mute', (_, muted) => system.setmuted(muted));

    ipcMain.handle('system-brightness-get', () => system.getbrightness());
    ipcMain.handle('system-brightness-set', (_, brightness) => system.setbrightness(brightness));

    ipcMain.handle('system-battery', () => system.getbatterystatus());

    ipcMain.handle('system-processes', () => system.getprocesses());
    ipcMain.handle('system-process-kill', (_, pid, force) => system.killprocess(pid, force));

    ipcMain.handle('system-power-action', (_, action) => system.poweraction(action));

    ipcMain.handle('system-launch-app', (_, apppath, args) => system.launchapp(apppath, args));
    ipcMain.handle('system-installed-apps', () => system.getinstalledapps());
    ipcMain.handle('system-open-with', (_, filepath, appname) => system.openfilewithapp(filepath, appname));

    ipcMain.handle('system-windows', () => system.getwindowlist());
    ipcMain.handle('system-window-focus', (_, windowid) => system.focuswindow(windowid));
    ipcMain.handle('system-window-minimize', (_, windowid) => system.minimizewindow(windowid));
    ipcMain.handle('system-window-close', (_, windowid) => system.closewindow(windowid));

    ipcMain.handle('system-wallpaper', (_, imagepath) => system.setwallpaper(imagepath));

    ipcMain.handle('system-network-info', () => system.getnetworkinfo());
    ipcMain.handle('system-disk-usage', () => system.getdiskusage());

    ipcMain.handle('system-trash', (_, filepath) => system.trash(filepath));

    ipcMain.handle('terminal-execute', (_, command, cwd) => system.executeshell(command, cwd));
}

function setupautoupdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        if (mainwindow) {
            mainwindow.webContents.send('update-status', 'checking');
        }
    });

    autoUpdater.on('update-available', (info) => {
        if (mainwindow) {
            mainwindow.webContents.send('update-status', 'available');
            mainwindow.webContents.send('update-available', info);
        }
    });

    autoUpdater.on('update-not-available', () => {
        if (mainwindow) {
            mainwindow.webContents.send('update-status', 'not-available');
        }
    });

    autoUpdater.on('download-progress', (progress) => {
        if (mainwindow) {
            mainwindow.webContents.send('update-progress', progress);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        if (mainwindow) {
            mainwindow.webContents.send('update-status', 'downloaded');
            mainwindow.webContents.send('update-downloaded', info);
        }
    });

    autoUpdater.on('error', (error) => {
        if (mainwindow) {
            mainwindow.webContents.send('update-error', error.message);
        }
    });
}

function setupglobalshortcuts() {
    globalShortcut.register('Super+Space', () => {
        if (mainwindow) {
            mainwindow.webContents.send('global-shortcut', 'search');
        }
    });

    globalShortcut.register('Super+Tab', () => {
        if (mainwindow) {
            mainwindow.webContents.send('global-shortcut', 'app-switcher');
        }
    });
}

function setuppowermonitor() {
    powerMonitor.on('suspend', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'suspend');
        }
    });

    powerMonitor.on('resume', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'resume');
        }
    });

    powerMonitor.on('on-ac', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'on-ac');
        }
    });

    powerMonitor.on('on-battery', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'on-battery');
        }
    });

    powerMonitor.on('lock-screen', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'lock-screen');
        }
    });

    powerMonitor.on('unlock-screen', () => {
        if (mainwindow) {
            mainwindow.webContents.send('power-event', 'unlock-screen');
        }
    });
}

const gotthelock = app.requestSingleInstanceLock();

if (!gotthelock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainwindow) {
            if (mainwindow.isMinimized()) mainwindow.restore();
            mainwindow.show();
            mainwindow.focus();
        }
    });

    app.whenReady().then(() => {
        setupprotocol();
        setupipc();
        setupautoupdater();
        setuppowermonitor();
        createwindow();
        createtray();

        if (IS_MAC || IS_LINUX) {
            setupglobalshortcuts();
        }

        if (app.isPackaged) {
            autoUpdater.checkForUpdates().catch(() => { });
        }
    });

    app.on('window-all-closed', () => {
        if (!IS_MAC) {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createwindow();
        } else if (mainwindow) {
            mainwindow.show();
        }
    });

    app.on('before-quit', () => {
        isquitting = true;
        globalShortcut.unregisterAll();
    });
}
