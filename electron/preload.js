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
        trash: (filepath) => ipcRenderer.invoke('system-trash', filepath)
    },

    shell: {
        openexternal: (url) => ipcRenderer.invoke('open-external', url),
        openpath: (filepath) => ipcRenderer.invoke('open-path', filepath),
        showinfolder: (filepath) => ipcRenderer.invoke('show-item-in-folder', filepath),
        openwith: (filepath, appname) => ipcRenderer.invoke('system-open-with', filepath, appname)
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
        onpowerevent: (callback) => ipcRenderer.on('power-event', (_, event) => callback(event))
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

    terminal: {
        execute: (command, cwd) => ipcRenderer.invoke('terminal-execute', command, cwd)
    }
});

ipcRenderer.on('update-available', () => { });
ipcRenderer.on('update-downloaded', () => { });
ipcRenderer.on('update-progress', () => { });
ipcRenderer.on('update-status', () => { });
ipcRenderer.on('update-error', () => { });
ipcRenderer.on('global-shortcut', () => { });
ipcRenderer.on('power-event', () => { });
