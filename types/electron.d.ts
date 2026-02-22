interface ElectronPlatform {
    platform: string;
    islinux: boolean;
    ismac: boolean;
    iswindows: boolean;
    hostname: string;
    username: string;
    homedir: string;
    arch: string;
    cpus: number;
    totalmem: number;
    freemem: number;
}

interface ElectronSystemInfo {
    platform: string;
    arch: string;
    release: string;
    hostname: string;
    username: string;
    homedir: string;
    tmpdir: string;
    cpus: any[];
    totalmem: number;
    freemem: number;
    uptime: number;
    networkinterfaces: Record<string, any[]>;
    loadavg: number[];
}

interface ElectronFileResult {
    success: boolean;
    content?: string;
    error?: string;
}

interface ElectronDirItem {
    name: string;
    isdir: boolean;
    isfile: boolean;
    issymlink: boolean;
}

interface ElectronDirResult {
    success: boolean;
    items?: ElectronDirItem[];
    error?: string;
}

interface ElectronFileStats {
    size: number;
    isdir: boolean;
    isfile: boolean;
    created: Date;
    modified: Date;
    accessed: Date;
    mode: number;
}

interface ElectronStatsResult {
    success: boolean;
    stats?: ElectronFileStats;
    error?: string;
}

interface ElectronDisplay {
    id: number;
    bounds: { x: number; y: number; width: number; height: number };
    workarea: { x: number; y: number; width: number; height: number };
    scalefactor: number;
    rotation: number;
    isprimary: boolean;
}

interface ElectronUpdateInfo {
    version: string;
    releaseDate: string;
}

interface ElectronUpdateProgress {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
}

interface ElectronShellInfo {
    isShellMode: boolean;
    isLowMem: boolean;
    totalMemMB: number;
    disableGPU: boolean;
}

interface ElectronSessionInfo extends ElectronShellInfo {
    isDesktopSession: boolean;
    isUltraLowMem: boolean;
    platform: string;
    displayServer: 'x11' | 'wayland' | 'quartz' | 'win32' | 'unknown';
    isPackaged: boolean;
    execPath: string;
    appPath: string;
}

interface ElectronDisplayMode {
    width: number;
    height: number;
    refreshRate: number;
    active: boolean;
    preferred: boolean;
}

interface ElectronDisplayConfig {
    name: string;
    connected: boolean;
    primary: boolean;
    currentWidth: number;
    currentHeight: number;
    x: number;
    y: number;
    modes: ElectronDisplayMode[];
}

interface ElectronDisplayChangeEvent {
    event: 'added' | 'removed' | 'metrics-changed';
    display: any;
    changedMetrics?: string[];
}

interface ElectronDialogFileFilter {
    name: string;
    extensions: string[];
}

interface ElectronOpenFileOptions {
    title?: string;
    defaultPath?: string;
    filters?: ElectronDialogFileFilter[];
    multiSelections?: boolean;
    showHiddenFiles?: boolean;
}

interface ElectronOpenDirectoryOptions {
    title?: string;
    defaultPath?: string;
    createDirectory?: boolean;
}

interface ElectronSaveFileOptions {
    title?: string;
    defaultPath?: string;
    filters?: ElectronDialogFileFilter[];
}

interface ElectronMessageBoxOptions {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message?: string;
    detail?: string;
    buttons?: string[];
    defaultId?: number;
    cancelId?: number;
    checkboxLabel?: string;
    checkboxChecked?: boolean;
}

interface ElectronMessageBoxResult {
    response: number;
    checkboxChecked: boolean;
}

interface ElectronScreenSource {
    id: string;
    name: string;
    thumbnail: string;
    display_id: string;
    appIcon: string | null;
}

interface ElectronWatchEvent {
    id: number;
    eventType: string;
    filename: string;
    path: string;
}

interface ElectronWatchError {
    id: number;
    error: string;
    path: string;
}

interface ElectronPtySpawnOptions {
    shell?: string;
    args?: string[];
    cols?: number;
    rows?: number;
    cwd?: string;
    env?: Record<string, string>;
}

interface ElectronPtyData {
    id: number;
    data: string;
}

interface ElectronPtyExit {
    id: number;
    exitCode: number;
    signal: number;
}

interface ElectronPrinter {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
}

interface ElectronLoginItemSettings {
    openAtLogin: boolean;
    openAsHidden?: boolean;
    wasOpenedAtLogin?: boolean;
    wasOpenedAsHidden?: boolean;
    restoreState?: boolean;
}

interface ElectronDisplayInfo {
    name: string;
    primary?: boolean;
    width: number;
    height: number;
}

interface ElectronAPI {
    iselectron: boolean;

    platform: {
        get: () => Promise<ElectronPlatform>;
        getsysteminfo: () => Promise<ElectronSystemInfo>;
        getpowerstate: () => Promise<{ onbattery: boolean }>;
    };

    app: {
        getversion: () => Promise<string>;
        getconfig: () => Promise<Record<string, any>>;
        setconfig: (config: Record<string, any>) => Promise<boolean>;
    };

    notifications: {
        show: (title: string, body: string, options?: { silent?: boolean; icon?: string }) => Promise<boolean>;
    };

    filesystem: {
        readfile: (filepath: string) => Promise<ElectronFileResult>;
        writefile: (filepath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        readdir: (dirpath: string) => Promise<ElectronDirResult>;
        getstats: (filepath: string) => Promise<ElectronStatsResult>;
        mkdir: (dirpath: string) => Promise<{ success: boolean; error?: string }>;
        remove: (targetpath: string, recursive?: boolean) => Promise<{ success: boolean; error?: string }>;
        rename: (oldpath: string, newpath: string) => Promise<{ success: boolean; error?: string }>;
        copy: (source: string, dest: string) => Promise<{ success: boolean; error?: string }>;
        trash: (filepath: string) => Promise<{ success: boolean; error?: string }>;
        watchstart: (path: string, options?: { recursive?: boolean }) => Promise<{ success: boolean; id?: number; error?: string }>;
        watchstop: (id: number) => Promise<{ success: boolean; error?: string }>;
        watchstopall: () => Promise<{ success: boolean }>;
        onwatchchange: (callback: (data: ElectronWatchEvent) => void) => void;
        onwatcherror: (callback: (data: ElectronWatchError) => void) => void;
    };

    shell: {
        openexternal: (url: string) => Promise<boolean>;
        openpath: (filepath: string) => Promise<boolean>;
        showinfolder: (filepath: string) => Promise<boolean>;
        openwith: (filepath: string, appname: string) => Promise<{ success: boolean; error?: string }>;
    };

    clipboard: {
        readtext: () => Promise<string>;
        writetext: (text: string) => Promise<boolean>;
        readimage: () => Promise<string | null>;
    };

    window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        ismaximized: () => Promise<boolean>;
        setfullscreen: (fullscreen: boolean) => Promise<void>;
        isfullscreen: () => Promise<boolean>;
    };

    display: {
        getall: () => Promise<ElectronDisplay[]>;
        gettheme: () => Promise<'light' | 'dark'>;
    };

    updates: {
        check: () => Promise<{ available: boolean; error?: string }>;
        install: () => void;
        onavailable: (callback: (info: ElectronUpdateInfo) => void) => void;
        ondownloaded: (callback: (info: ElectronUpdateInfo) => void) => void;
        onprogress: (callback: (progress: ElectronUpdateProgress) => void) => void;
        onstatus: (callback: (status: string) => void) => void;
        onerror: (callback: (error: string) => void) => void;
    };

    events: {
        onglobalshortcut: (callback: (action: string) => void) => void;
        onpowerevent: (callback: (event: string) => void) => void;
        onmenuaction: (callback: (action: string) => void) => void;
        onprotocolurl: (callback: (url: string) => void) => void;
    };

    wifi: {
        getstatus: () => Promise<{ enabled: boolean; connected: boolean; ssid: string | null; error?: string }>;
        setenabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
        getnetworks: () => Promise<{ success: boolean; networks: any[]; error?: string }>;
        connect: (ssid: string, password?: string) => Promise<{ success: boolean; error?: string }>;
    };

    bluetooth: {
        getstatus: () => Promise<{ enabled: boolean; available: boolean; error?: string }>;
        setenabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
        getdevices: () => Promise<{ success: boolean; devices: any[]; error?: string }>;
    };

    audio: {
        getvolume: () => Promise<{ volume: number; muted: boolean; error?: string }>;
        setvolume: (volume: number) => Promise<{ success: boolean; error?: string }>;
        setmuted: (muted: boolean) => Promise<{ success: boolean; error?: string }>;
    };

    brightness: {
        get: () => Promise<{ brightness: number; available: boolean; error?: string }>;
        set: (level: number) => Promise<{ success: boolean; error?: string }>;
    };

    battery: {
        getstatus: () => Promise<{ percentage: number; charging: boolean; pluggedin: boolean; available: boolean; error?: string }>;
    };

    processes: {
        list: () => Promise<{ success: boolean; processes: any[]; error?: string }>;
        kill: (pid: number, force?: boolean) => Promise<{ success: boolean; error?: string }>;
    };

    power: {
        shutdown: () => Promise<{ success: boolean; error?: string }>;
        restart: () => Promise<{ success: boolean; error?: string }>;
        sleep: () => Promise<{ success: boolean; error?: string }>;
        hibernate: () => Promise<{ success: boolean; error?: string }>;
        logout: () => Promise<{ success: boolean; error?: string }>;
        lock: () => Promise<{ success: boolean; error?: string }>;
    };

    apps: {
        getinstalled: () => Promise<{ success: boolean; apps: any[]; error?: string }>;
        launch: (apppath: string, args?: string[]) => Promise<{ success: boolean; pid?: number; error?: string }>;
    };

    externalwindows: {
        list: () => Promise<{ success: boolean; windows: any[]; error?: string }>;
        focus: (windowid: string) => Promise<{ success: boolean; error?: string }>;
        minimize: (windowid: string) => Promise<{ success: boolean; error?: string }>;
        close: (windowid: string) => Promise<{ success: boolean; error?: string }>;
    };

    desktop: {
        setwallpaper: (imagepath: string) => Promise<{ success: boolean; error?: string }>;
    };

    system: {
        getnetworkinfo: () => Promise<{ success: boolean; interfaces: Record<string, any[]>; error?: string }>;
        getdiskusage: () => Promise<{ success: boolean; disks: any[]; error?: string }>;
    };

    terminal: {
        execute: (command: string, cwd?: string) => Promise<{ success: boolean; stdout: string; stderr: string; code: number; error?: string }>;
        ptyspawn: (options?: ElectronPtySpawnOptions) => Promise<{ success: boolean; id?: number; pid?: number; error?: string }>;
        ptywrite: (id: number, data: string) => Promise<boolean>;
        ptyresize: (id: number, cols: number, rows: number) => Promise<boolean>;
        ptykill: (id: number) => Promise<boolean>;
        onptydata: (callback: (data: ElectronPtyData) => void) => void;
        onptyexit: (callback: (data: ElectronPtyExit) => void) => void;
    };

    shellinfo: {
        get: () => Promise<ElectronSessionInfo>;
        oninfo: (callback: (info: ElectronSessionInfo) => void) => void;
    };

    session: {
        getinfo: () => Promise<ElectronSessionInfo>;
        oninfo: (callback: (info: ElectronSessionInfo) => void) => void;
        lock: () => Promise<{ success: boolean }>;
        logout: () => Promise<{ success: boolean }>;
        install: () => Promise<{ success: boolean; path?: string; error?: string }>;
        onaction: (callback: (action: string) => void) => void;
    };

    displayconfig: {
        getconfig: () => Promise<{ success: boolean; displays: ElectronDisplayConfig[]; error?: string }>;
        setresolution: (display: string, w: number, h: number, rate?: number) => Promise<{ success: boolean; error?: string }>;
        setrotation: (display: string, rotation: string) => Promise<{ success: boolean; error?: string }>;
        onchanged: (callback: (data: ElectronDisplayChangeEvent) => void) => void;
    };

    dialogs: {
        openfile: (options?: ElectronOpenFileOptions) => Promise<{ canceled: boolean; filePaths: string[] }>;
        opendirectory: (options?: ElectronOpenDirectoryOptions) => Promise<{ canceled: boolean; filePaths: string[] }>;
        savefile: (options?: ElectronSaveFileOptions) => Promise<{ canceled: boolean; filePath?: string }>;
        messagebox: (options?: ElectronMessageBoxOptions) => Promise<ElectronMessageBoxResult>;
        errorbox: (title: string, content: string) => Promise<void>;
    };

    screencapture: {
        getsources: (options?: { types?: string[]; thumbnailSize?: { width: number; height: number } }) => Promise<ElectronScreenSource[]>;
        capture: (sourceId: string, options?: { size?: { width: number; height: number } }) => Promise<{ success: boolean; dataURL?: string; error?: string }>;
    };

    print: {
        page: (options?: any) => Promise<{ success: boolean }>;
        topdf: (options?: any) => Promise<{ success: boolean; data?: string }>;
        getprinters: () => Promise<ElectronPrinter[]>;
    };

    securestorage: {
        isavailable: () => Promise<boolean>;
        encrypt: (plaintext: string) => Promise<{ success: boolean; data?: string; error?: string }>;
        decrypt: (encrypted: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    };

    autolaunch: {
        getsettings: () => Promise<ElectronLoginItemSettings>;
        setsettings: (settings: { openAtLogin: boolean; openAsHidden?: boolean }) => Promise<{ success: boolean }>;
    };

    media: {
        checkpermission: (mediaType: 'microphone' | 'camera' | 'screen') => Promise<string>;
        requestpermission: (mediaType: 'microphone' | 'camera') => Promise<{ granted: boolean }>;
    };

    appbadge: {
        setbadge: (badge: string) => Promise<{ success: boolean; error?: string }>;
        setprogress: (progress: number) => Promise<{ success: boolean }>;
        bounce: (type?: 'critical' | 'informational') => Promise<{ success: boolean; error?: string }>;
    };

    hardware: {
        getgpu: () => Promise<any>;
        getfonts: () => Promise<{ success: boolean; fonts: string[]; error?: string }>;
        getdisplays: () => Promise<{ success: boolean; displays: ElectronDisplayInfo[]; error?: string }>;
    };

    fileassociations: {
        register: (extension: string, appName: string, appPath: string) => Promise<{ success: boolean; error?: string }>;
    };
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
