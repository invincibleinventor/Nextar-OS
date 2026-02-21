const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    iselectron: true,

    platform: {
        get: () => ipcRenderer.invoke('get-platform'),
        getsysteminfo: () => ipcRenderer.invoke('get-system-info'),
        getpowerstate: () => ipcRenderer.invoke('get-power-state')
    },

    app: {
        getversion: () => ipcRenderer.invoke('get-app-version'),
        getconfig: () => ipcRenderer.invoke('get-config'),
        setconfig: (config) => ipcRenderer.invoke('set-config', config)
    },

    notifications: {
        show: (title, body, options) => ipcRenderer.invoke('show-notification', title, body, options)
    },

    filesystem: {
        readfile: (filepath) => ipcRenderer.invoke('read-file', filepath),
        writefile: (filepath, content) => ipcRenderer.invoke('write-file', filepath, content),
        readdir: (dirpath) => ipcRenderer.invoke('read-directory', dirpath),
        getstats: (filepath) => ipcRenderer.invoke('get-file-stats', filepath),
        mkdir: (dirpath) => ipcRenderer.invoke('create-directory', dirpath),
        remove: (targetpath, recursive) => ipcRenderer.invoke('delete-path', targetpath, recursive),
        rename: (oldpath, newpath) => ipcRenderer.invoke('rename-path', oldpath, newpath),
        copy: (source, dest) => ipcRenderer.invoke('copy-path', source, dest),
        trash: (filepath) => ipcRenderer.invoke('system-trash', filepath),
        // File watchers
        watchstart: (watchPath, options) => ipcRenderer.invoke('fs-watch-start', watchPath, options),
        watchstop: (id) => ipcRenderer.invoke('fs-watch-stop', id),
        watchstopall: () => ipcRenderer.invoke('fs-watch-stop-all'),
        onwatchchange: (callback) => ipcRenderer.on('fs-watch-change', (_, data) => callback(data)),
        onwatcherror: (callback) => ipcRenderer.on('fs-watch-error', (_, data) => callback(data))
    },

    shell: {
        openexternal: (url) => ipcRenderer.invoke('open-external', url),
        openpath: (filepath) => ipcRenderer.invoke('open-path', filepath),
        showinfolder: (filepath) => ipcRenderer.invoke('show-item-in-folder', filepath),
        openwith: (filepath, appname) => ipcRenderer.invoke('system-open-with', filepath, appname)
    },

    icons: {
        getdata: (iconpath) => ipcRenderer.invoke('get-icon-data', iconpath),
    },

    clipboard: {
        readtext: () => ipcRenderer.invoke('get-clipboard-text'),
        writetext: (text) => ipcRenderer.invoke('set-clipboard-text', text),
        readimage: () => ipcRenderer.invoke('get-clipboard-image')
    },

    window: {
        minimize: () => ipcRenderer.invoke('minimize-window'),
        maximize: () => ipcRenderer.invoke('maximize-window'),
        close: () => ipcRenderer.invoke('close-window'),
        ismaximized: () => ipcRenderer.invoke('is-maximized'),
        setfullscreen: (fullscreen) => ipcRenderer.invoke('set-fullscreen', fullscreen),
        isfullscreen: () => ipcRenderer.invoke('is-fullscreen')
    },

    display: {
        getall: () => ipcRenderer.invoke('get-displays'),
        gettheme: () => ipcRenderer.invoke('get-theme')
    },

    updates: {
        check: () => ipcRenderer.invoke('check-for-updates'),
        install: () => ipcRenderer.invoke('install-update'),
        onavailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
        ondownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
        onprogress: (callback) => ipcRenderer.on('update-progress', (_, progress) => callback(progress)),
        onstatus: (callback) => ipcRenderer.on('update-status', (_, status) => callback(status)),
        onerror: (callback) => ipcRenderer.on('update-error', (_, error) => callback(error))
    },

    events: {
        onglobalshortcut: (callback) => ipcRenderer.on('global-shortcut', (_, action) => callback(action)),
        onpowerevent: (callback) => ipcRenderer.on('power-event', (_, event) => callback(event)),
        onmenuaction: (callback) => ipcRenderer.on('menu-action', (_, action) => callback(action)),
        onprotocolurl: (callback) => ipcRenderer.on('protocol-url', (_, url) => callback(url))
    },

    wifi: {
        getstatus: () => ipcRenderer.invoke('system-wifi-status'),
        setenabled: (enabled) => ipcRenderer.invoke('system-wifi-enable', enabled),
        getnetworks: () => ipcRenderer.invoke('system-wifi-networks'),
        connect: (ssid, password) => ipcRenderer.invoke('system-wifi-connect', ssid, password)
    },

    bluetooth: {
        getstatus: () => ipcRenderer.invoke('system-bluetooth-status'),
        setenabled: (enabled) => ipcRenderer.invoke('system-bluetooth-enable', enabled),
        getdevices: () => ipcRenderer.invoke('system-bluetooth-devices')
    },

    audio: {
        getvolume: () => ipcRenderer.invoke('system-volume-get'),
        setvolume: (volume) => ipcRenderer.invoke('system-volume-set', volume),
        setmuted: (muted) => ipcRenderer.invoke('system-volume-mute', muted)
    },

    brightness: {
        get: () => ipcRenderer.invoke('system-brightness-get'),
        set: (level) => ipcRenderer.invoke('system-brightness-set', level)
    },

    battery: {
        getstatus: () => ipcRenderer.invoke('system-battery')
    },

    processes: {
        list: () => ipcRenderer.invoke('system-processes'),
        kill: (pid, force) => ipcRenderer.invoke('system-process-kill', pid, force)
    },

    power: {
        shutdown: () => ipcRenderer.invoke('system-power-action', 'shutdown'),
        restart: () => ipcRenderer.invoke('system-power-action', 'restart'),
        sleep: () => ipcRenderer.invoke('system-power-action', 'sleep'),
        hibernate: () => ipcRenderer.invoke('system-power-action', 'hibernate'),
        logout: () => ipcRenderer.invoke('system-power-action', 'logout'),
        lock: () => ipcRenderer.invoke('system-power-action', 'lock')
    },

    apps: {
        getinstalled: () => ipcRenderer.invoke('system-installed-apps'),
        launch: (apppath, args) => ipcRenderer.invoke('system-launch-app', apppath, args)
    },

    externalwindows: {
        list: () => ipcRenderer.invoke('system-windows'),
        focus: (windowid) => ipcRenderer.invoke('system-window-focus', windowid),
        minimize: (windowid) => ipcRenderer.invoke('system-window-minimize', windowid),
        close: (windowid) => ipcRenderer.invoke('system-window-close', windowid)
    },

    desktop: {
        setwallpaper: (imagepath) => ipcRenderer.invoke('system-wallpaper', imagepath)
    },

    system: {
        getnetworkinfo: () => ipcRenderer.invoke('system-network-info'),
        getdiskusage: () => ipcRenderer.invoke('system-disk-usage')
    },

    keyboard: {
        getlayout: () => ipcRenderer.invoke('system:keyboard:getlayout'),
        getlayouts: () => ipcRenderer.invoke('system:keyboard:getlayouts'),
        setlayout: (layout) => ipcRenderer.invoke('system:keyboard:setlayout', layout),
        getrepeatrate: () => ipcRenderer.invoke('system:keyboard:getrepeatrate'),
        setrepeatrate: (delay, interval) => ipcRenderer.invoke('system:keyboard:setrepeatrate', delay, interval),
    },

    mouse: {
        getspeed: () => ipcRenderer.invoke('system:mouse:getspeed'),
        setspeed: (speed) => ipcRenderer.invoke('system:mouse:setspeed', speed),
        getnaturalscroll: () => ipcRenderer.invoke('system:mouse:getnaturalscroll'),
        setnaturalscroll: (enabled) => ipcRenderer.invoke('system:mouse:setnaturalscroll', enabled),
    },

    locale: {
        getlocale: () => ipcRenderer.invoke('system:locale:getlocale'),
        getlocales: () => ipcRenderer.invoke('system:locale:getlocales'),
        setlocale: (locale) => ipcRenderer.invoke('system:locale:setlocale', locale),
    },

    datetime: {
        getstatus: () => ipcRenderer.invoke('system:datetime:getstatus'),
        gettimezones: () => ipcRenderer.invoke('system:datetime:gettimezones'),
        settimezone: (tz) => ipcRenderer.invoke('system:datetime:settimezone', tz),
        setntp: (enabled) => ipcRenderer.invoke('system:datetime:setntp', enabled),
    },

    defaultapps: {
        getbrowser: () => ipcRenderer.invoke('system:defaultapps:getbrowser'),
        setbrowser: (desktop) => ipcRenderer.invoke('system:defaultapps:setbrowser', desktop),
        gethandler: (mime) => ipcRenderer.invoke('system:defaultapps:gethandler', mime),
        sethandler: (mime, desktop) => ipcRenderer.invoke('system:defaultapps:sethandler', mime, desktop),
    },

    printers: {
        getprinters: () => ipcRenderer.invoke('system:printers:getprinters'),
        getdefault: () => ipcRenderer.invoke('system:printers:getdefault'),
        setdefault: (printer) => ipcRenderer.invoke('system:printers:setdefault', printer),
    },

    terminal: {
        execute: (command, cwd) => ipcRenderer.invoke('terminal-execute', command, cwd),
        // Interactive PTY
        ptyspawn: (options) => ipcRenderer.invoke('pty-spawn', options),
        ptywrite: (id, data) => ipcRenderer.invoke('pty-write', id, data),
        ptyresize: (id, cols, rows) => ipcRenderer.invoke('pty-resize', id, cols, rows),
        ptykill: (id) => ipcRenderer.invoke('pty-kill', id),
        onptydata: (callback) => ipcRenderer.on('pty-data', (_, data) => callback(data)),
        onptyexit: (callback) => ipcRenderer.on('pty-exit', (_, data) => callback(data))
    },

    // Session info (backwards compat: shellinfo still works)
    shellinfo: {
        get: () => ipcRenderer.invoke('get-session-info'),
        oninfo: (callback) => ipcRenderer.on('session-info', (_, info) => callback(info))
    },

    session: {
        getinfo: () => ipcRenderer.invoke('get-session-info'),
        oninfo: (callback) => ipcRenderer.on('session-info', (_, info) => callback(info)),
        lock: () => ipcRenderer.invoke('session-lock'),
        logout: () => ipcRenderer.invoke('session-logout'),
        install: () => ipcRenderer.invoke('install-session'),
        onaction: (callback) => ipcRenderer.on('session-action', (_, action) => callback(action))
    },

    displayconfig: {
        getconfig: () => ipcRenderer.invoke('get-display-config'),
        setresolution: (display, w, h, rate) => ipcRenderer.invoke('set-display-resolution', display, w, h, rate),
        setrotation: (display, rotation) => ipcRenderer.invoke('set-display-rotation', display, rotation),
        onchanged: (callback) => ipcRenderer.on('display-changed', (_, data) => callback(data))
    },

    // --- CAPABILITY APIS ---

    dialogs: {
        openfile: (options) => ipcRenderer.invoke('dialog-open-file', options),
        opendirectory: (options) => ipcRenderer.invoke('dialog-open-directory', options),
        savefile: (options) => ipcRenderer.invoke('dialog-save-file', options),
        messagebox: (options) => ipcRenderer.invoke('dialog-message-box', options),
        errorbox: (title, content) => ipcRenderer.invoke('dialog-error-box', title, content)
    },

    screencapture: {
        getsources: (options) => ipcRenderer.invoke('screen-get-sources', options),
        capture: (sourceId, options) => ipcRenderer.invoke('screen-capture', sourceId, options)
    },

    print: {
        page: (options) => ipcRenderer.invoke('print-page', options),
        topdf: (options) => ipcRenderer.invoke('print-to-pdf', options),
        getprinters: () => ipcRenderer.invoke('get-printers')
    },

    securestorage: {
        isavailable: () => ipcRenderer.invoke('secure-storage-available'),
        encrypt: (plaintext) => ipcRenderer.invoke('secure-storage-encrypt', plaintext),
        decrypt: (encrypted) => ipcRenderer.invoke('secure-storage-decrypt', encrypted)
    },

    autolaunch: {
        getsettings: () => ipcRenderer.invoke('get-login-item-settings'),
        setsettings: (settings) => ipcRenderer.invoke('set-login-item-settings', settings)
    },

    media: {
        checkpermission: (mediaType) => ipcRenderer.invoke('media-check-permission', mediaType),
        requestpermission: (mediaType) => ipcRenderer.invoke('media-request-permission', mediaType)
    },

    appbadge: {
        setbadge: (badge) => ipcRenderer.invoke('app-badge-set', badge),
        setprogress: (progress) => ipcRenderer.invoke('app-progress-set', progress),
        bounce: (type) => ipcRenderer.invoke('app-bounce', type)
    },

    hardware: {
        getgpu: () => ipcRenderer.invoke('system-gpu-info'),
        getfonts: () => ipcRenderer.invoke('system-fonts'),
        getdisplays: () => ipcRenderer.invoke('system-display-info')
    },

    fileassociations: {
        register: (extension, appName, appPath) => ipcRenderer.invoke('register-file-association', extension, appName, appPath)
    }
});

// Pre-register all event channels so they don't get garbage collected
const channels = [
    'update-available', 'update-downloaded', 'update-progress', 'update-status', 'update-error',
    'global-shortcut', 'power-event', 'session-info', 'session-action', 'menu-action', 'protocol-url',
    'fs-watch-change', 'fs-watch-error', 'pty-data', 'pty-exit', 'display-changed'
];
channels.forEach(ch => ipcRenderer.on(ch, () => { }));
