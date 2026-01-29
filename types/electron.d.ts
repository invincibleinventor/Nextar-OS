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
    };

    shell: {
        openexternal: (url: string) => Promise<boolean>;
        openpath: (filepath: string) => Promise<boolean>;
        showinfolder: (filepath: string) => Promise<boolean>;
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
    };
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
