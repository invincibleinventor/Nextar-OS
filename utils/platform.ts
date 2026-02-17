export const iselectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.iselectron;
export const isweb = !iselectron;

export const electronapi = iselectron ? (window as any).electronAPI : null;

export async function getplatforminfo() {
    if (iselectron) {
        return await electronapi.platform.get();
    }
    return {
        platform: 'web',
        islinux: false,
        ismac: false,
        iswindows: false,
        hostname: 'web',
        username: 'user',
        homedir: '/',
        arch: 'web',
        cpus: navigator.hardwareConcurrency || 4,
        totalmem: 0,
        freemem: 0
    };
}

export async function getsysteminfo() {
    if (iselectron) {
        return await electronapi.platform.getsysteminfo();
    }
    return null;
}

export async function shownotification(title: string, body: string, options?: { silent?: boolean; icon?: string }) {
    if (iselectron) {
        return await electronapi.notifications.show(title, body, options);
    }

    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, silent: options?.silent, icon: options?.icon });
            return true;
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, { body, silent: options?.silent, icon: options?.icon });
                return true;
            }
        }
    }
    return false;
}

export async function openexternal(url: string) {
    if (iselectron) {
        return await electronapi.shell.openexternal(url);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
}

export async function readclipboardtext(): Promise<string> {
    if (iselectron) {
        return await electronapi.clipboard.readtext();
    }
    try {
        return await navigator.clipboard.readText();
    } catch {
        return '';
    }
}

export async function writeclipboardtext(text: string): Promise<boolean> {
    if (iselectron) {
        return await electronapi.clipboard.writetext(text);
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

export const wifi = {
    async getstatus() {
        if (iselectron) return await electronapi.wifi.getstatus();
        return { enabled: false, connected: false, ssid: null, error: 'Not in Electron' };
    },
    async setenabled(enabled: boolean) {
        if (iselectron) return await electronapi.wifi.setenabled(enabled);
        return { success: false, error: 'Not in Electron' };
    },
    async getnetworks() {
        if (iselectron) return await electronapi.wifi.getnetworks();
        return { success: false, networks: [], error: 'Not in Electron' };
    },
    async connect(ssid: string, password?: string) {
        if (iselectron) return await electronapi.wifi.connect(ssid, password);
        return { success: false, error: 'Not in Electron' };
    }
};

export const bluetooth = {
    async getstatus() {
        if (iselectron) return await electronapi.bluetooth.getstatus();
        return { enabled: false, available: false };
    },
    async setenabled(enabled: boolean) {
        if (iselectron) return await electronapi.bluetooth.setenabled(enabled);
        return { success: false, error: 'Not in Electron' };
    },
    async getdevices() {
        if (iselectron) return await electronapi.bluetooth.getdevices();
        return { success: false, devices: [] };
    }
};

export const audio = {
    async getvolume() {
        if (iselectron) return await electronapi.audio.getvolume();
        return { volume: 100, muted: false };
    },
    async setvolume(volume: number) {
        if (iselectron) return await electronapi.audio.setvolume(volume);
        return { success: false, error: 'Not in Electron' };
    },
    async setmuted(muted: boolean) {
        if (iselectron) return await electronapi.audio.setmuted(muted);
        return { success: false, error: 'Not in Electron' };
    }
};

export const brightness = {
    async get() {
        if (iselectron) return await electronapi.brightness.get();
        return { brightness: 100, available: false };
    },
    async set(level: number) {
        if (iselectron) return await electronapi.brightness.set(level);
        return { success: false, error: 'Not in Electron' };
    }
};

export const battery = {
    async getstatus() {
        if (iselectron) return await electronapi.battery.getstatus();
        return { percentage: 100, charging: false, pluggedin: true, available: false };
    }
};

export const processes = {
    async list() {
        if (iselectron) return await electronapi.processes.list();
        return { success: false, processes: [] };
    },
    async kill(pid: number, force = false) {
        if (iselectron) return await electronapi.processes.kill(pid, force);
        return { success: false, error: 'Not in Electron' };
    }
};

export const power = {
    async shutdown() {
        if (iselectron) return await electronapi.power.shutdown();
        return { success: false, error: 'Not in Electron' };
    },
    async restart() {
        if (iselectron) return await electronapi.power.restart();
        return { success: false, error: 'Not in Electron' };
    },
    async sleep() {
        if (iselectron) return await electronapi.power.sleep();
        return { success: false, error: 'Not in Electron' };
    },
    async hibernate() {
        if (iselectron) return await electronapi.power.hibernate();
        return { success: false, error: 'Not in Electron' };
    },
    async logout() {
        if (iselectron) return await electronapi.power.logout();
        return { success: false, error: 'Not in Electron' };
    },
    async lock() {
        if (iselectron) return await electronapi.power.lock();
        return { success: false, error: 'Not in Electron' };
    }
};

export const apps = {
    async getinstalled() {
        if (iselectron) return await electronapi.apps.getinstalled();
        return { success: false, apps: [] };
    },
    async launch(apppath: string, args: string[] = []) {
        if (iselectron) return await electronapi.apps.launch(apppath, args);
        return { success: false, error: 'Not in Electron' };
    }
};

export const externalwindows = {
    async list() {
        if (iselectron) return await electronapi.externalwindows.list();
        return { success: false, windows: [] };
    },
    async focus(windowid: string) {
        if (iselectron) return await electronapi.externalwindows.focus(windowid);
        return { success: false, error: 'Not in Electron' };
    },
    async minimize(windowid: string) {
        if (iselectron) return await electronapi.externalwindows.minimize(windowid);
        return { success: false, error: 'Not in Electron' };
    },
    async close(windowid: string) {
        if (iselectron) return await electronapi.externalwindows.close(windowid);
        return { success: false, error: 'Not in Electron' };
    }
};

export const desktop = {
    async setwallpaper(imagepath: string) {
        if (iselectron) return await electronapi.desktop.setwallpaper(imagepath);
        return { success: false, error: 'Not in Electron' };
    }
};

export const systeminfo = {
    async getnetworkinfo() {
        if (iselectron) return await electronapi.system.getnetworkinfo();
        return { success: false, interfaces: {} };
    },
    async getdiskusage() {
        if (iselectron) return await electronapi.system.getdiskusage();
        return { success: false, disks: [] };
    }
};

export const nativefs = {
    async readfile(filepath: string): Promise<{ success: boolean; content?: string; error?: string }> {
        if (iselectron) {
            return await electronapi.filesystem.readfile(filepath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async writefile(filepath: string, content: string): Promise<{ success: boolean; error?: string }> {
        if (iselectron) {
            return await electronapi.filesystem.writefile(filepath, content);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async readdir(dirpath: string) {
        if (iselectron) {
            return await electronapi.filesystem.readdir(dirpath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async getstats(filepath: string) {
        if (iselectron) {
            return await electronapi.filesystem.getstats(filepath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async mkdir(dirpath: string) {
        if (iselectron) {
            return await electronapi.filesystem.mkdir(dirpath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async remove(targetpath: string, recursive = false) {
        if (iselectron) {
            return await electronapi.filesystem.remove(targetpath, recursive);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async rename(oldpath: string, newpath: string) {
        if (iselectron) {
            return await electronapi.filesystem.rename(oldpath, newpath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async copy(source: string, dest: string) {
        if (iselectron) {
            return await electronapi.filesystem.copy(source, dest);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async trash(filepath: string) {
        if (iselectron) {
            return await electronapi.filesystem.trash(filepath);
        }
        return { success: false, error: 'Not in Electron' };
    },

    async openpath(filepath: string) {
        if (iselectron) {
            return await electronapi.shell.openpath(filepath);
        }
        return false;
    },

    async showinfolder(filepath: string) {
        if (iselectron) {
            return await electronapi.shell.showinfolder(filepath);
        }
        return false;
    },

    async openwith(filepath: string, appname: string) {
        if (iselectron) {
            return await electronapi.shell.openwith(filepath, appname);
        }
        return { success: false, error: 'Not in Electron' };
    }
};

export function onglobalshortcut(callback: (action: string) => void) {
    if (iselectron) {
        electronapi.events.onglobalshortcut(callback);
    }
}

export function onpowerevent(callback: (event: string) => void) {
    if (iselectron) {
        electronapi.events.onpowerevent(callback);
    }
}

export async function minimizewindow() {
    if (iselectron) {
        await electronapi.window.minimize();
    }
}

export async function maximizewindow() {
    if (iselectron) {
        await electronapi.window.maximize();
    }
}

export async function closewindow() {
    if (iselectron) {
        await electronapi.window.close();
    }
}

export async function iswindowmaximized(): Promise<boolean> {
    if (iselectron) {
        return await electronapi.window.ismaximized();
    }
    return false;
}

export async function togglefullscreen() {
    if (iselectron) {
        const fullscreen = await electronapi.window.isfullscreen();
        await electronapi.window.setfullscreen(!fullscreen);
        return;
    }

    if (document.fullscreenElement) {
        await document.exitFullscreen();
    } else {
        await document.documentElement.requestFullscreen();
    }
}

export async function getdisplays() {
    if (iselectron) {
        return await electronapi.display.getall();
    }
    return [{
        id: 0,
        bounds: { x: 0, y: 0, width: window.screen.width, height: window.screen.height },
        workarea: { x: 0, y: 0, width: window.screen.availWidth, height: window.screen.availHeight },
        scalefactor: window.devicePixelRatio,
        rotation: 0,
        isprimary: true
    }];
}

export async function getnativetheme(): Promise<'light' | 'dark'> {
    if (iselectron) {
        return await electronapi.display.gettheme();
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export async function checkforupdates() {
    if (iselectron) {
        return await electronapi.updates.check();
    }
    return { available: false };
}

export async function installupdates() {
    if (iselectron) {
        electronapi.updates.install();
    }
}

export function onupdateavailable(callback: (info: any) => void) {
    if (iselectron) {
        electronapi.updates.onavailable(callback);
    }
}

export function onupdatedownloaded(callback: (info: any) => void) {
    if (iselectron) {
        electronapi.updates.ondownloaded(callback);
    }
}

export const terminal = {
    async execute(command: string, cwd?: string): Promise<{ success: boolean; stdout: string; stderr: string; code: number; error?: string }> {
        if (iselectron) {
            return await electronapi.terminal.execute(command, cwd);
        }
        return { success: false, stdout: '', stderr: '', code: 1, error: 'Not in Electron' };
    }
};

export const getplatform = () => iselectron ? 'electron' : 'web';

export async function getshellinfo() {
    if (iselectron && electronapi?.session) {
        return await electronapi.session.getinfo();
    }
    if (iselectron && electronapi?.shellinfo) {
        return await electronapi.shellinfo.get();
    }
    return { isShellMode: false, isDesktopSession: false, isLowMem: false, isUltraLowMem: false, totalMemMB: 0, disableGPU: false, platform: 'web', displayServer: 'unknown' as const, isPackaged: false, execPath: '', appPath: '' };
}

// --- Session Management (DE-level) ---

export const desktopsession = {
    async getinfo() {
        if (iselectron && electronapi?.session) return await electronapi.session.getinfo();
        return getshellinfo();
    },

    async lock(): Promise<{ success: boolean }> {
        if (iselectron && electronapi?.session) return await electronapi.session.lock();
        return { success: false };
    },

    async logout(): Promise<{ success: boolean }> {
        if (iselectron && electronapi?.session) return await electronapi.session.logout();
        return { success: false };
    },

    async install(): Promise<{ success: boolean; path?: string; error?: string }> {
        if (iselectron && electronapi?.session) return await electronapi.session.install();
        return { success: false, error: 'Not in Electron' };
    },

    onaction(callback: (action: string) => void) {
        if (iselectron && electronapi?.session) electronapi.session.onaction(callback);
    }
};

// --- Display Configuration (DE-level) ---

export const displayconfig = {
    async getconfig(): Promise<{ success: boolean; displays: any[]; error?: string }> {
        if (iselectron && electronapi?.displayconfig) return await electronapi.displayconfig.getconfig();
        return { success: false, displays: [], error: 'Not in Electron' };
    },

    async setresolution(display: string, w: number, h: number, rate?: number): Promise<{ success: boolean; error?: string }> {
        if (iselectron && electronapi?.displayconfig) return await electronapi.displayconfig.setresolution(display, w, h, rate);
        return { success: false, error: 'Not in Electron' };
    },

    async setrotation(display: string, rotation: string): Promise<{ success: boolean; error?: string }> {
        if (iselectron && electronapi?.displayconfig) return await electronapi.displayconfig.setrotation(display, rotation);
        return { success: false, error: 'Not in Electron' };
    },

    onchanged(callback: (data: any) => void) {
        if (iselectron && electronapi?.displayconfig) electronapi.displayconfig.onchanged(callback);
    }
};

// =============================================================================
//  CAPABILITY APIS — Web-fallback wrappers
// =============================================================================

// --- 1. Native Dialogs -------------------------------------------------------

export const dialogs = {
    async openfile(options?: { title?: string; filters?: { name: string; extensions: string[] }[]; multiSelections?: boolean; defaultPath?: string }): Promise<{ canceled: boolean; filePaths: string[] }> {
        if (iselectron) return await electronapi.dialogs.openfile(options);
        // Web fallback: use file input
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            if (options?.multiSelections) input.multiple = true;
            if (options?.filters?.length) {
                input.accept = options.filters.flatMap(f => f.extensions.map(e => `.${e}`)).join(',');
            }
            input.onchange = () => {
                const files = Array.from(input.files || []);
                resolve({ canceled: files.length === 0, filePaths: files.map(f => f.name) });
            };
            input.oncancel = () => resolve({ canceled: true, filePaths: [] });
            input.click();
        });
    },

    async opendirectory(options?: { title?: string; defaultPath?: string }): Promise<{ canceled: boolean; filePaths: string[] }> {
        if (iselectron) return await electronapi.dialogs.opendirectory(options);
        // Web: directory picker if available
        if ('showDirectoryPicker' in window) {
            try {
                const handle = await (window as any).showDirectoryPicker();
                return { canceled: false, filePaths: [handle.name] };
            } catch {
                return { canceled: true, filePaths: [] };
            }
        }
        return { canceled: true, filePaths: [] };
    },

    async savefile(options?: { title?: string; filters?: { name: string; extensions: string[] }[]; defaultPath?: string }): Promise<{ canceled: boolean; filePath?: string }> {
        if (iselectron) return await electronapi.dialogs.savefile(options);
        // Web: showSaveFilePicker if available
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: options?.defaultPath,
                    types: options?.filters?.map(f => ({
                        description: f.name,
                        accept: { 'application/octet-stream': f.extensions.map(e => `.${e}`) }
                    }))
                });
                return { canceled: false, filePath: handle.name };
            } catch {
                return { canceled: true };
            }
        }
        return { canceled: true };
    },

    async messagebox(options?: { type?: string; title?: string; message?: string; detail?: string; buttons?: string[] }): Promise<{ response: number; checkboxChecked: boolean }> {
        if (iselectron) return await electronapi.dialogs.messagebox(options);
        // Web fallback: confirm/alert
        const msg = `${options?.message || ''}\n${options?.detail || ''}`.trim();
        if (options?.buttons && options.buttons.length > 1) {
            const result = window.confirm(msg);
            return { response: result ? 0 : 1, checkboxChecked: false };
        }
        window.alert(msg);
        return { response: 0, checkboxChecked: false };
    },

    async errorbox(title: string, content: string): Promise<void> {
        if (iselectron) { await electronapi.dialogs.errorbox(title, content); return; }
        window.alert(`${title}\n\n${content}`);
    }
};

// --- 2. Screen Capture -------------------------------------------------------

export const screencapture = {
    async getsources(options?: { types?: string[]; thumbnailSize?: { width: number; height: number } }): Promise<any[]> {
        if (iselectron) return await electronapi.screencapture.getsources(options);
        return [];
    },

    async capture(sourceId: string, options?: { size?: { width: number; height: number } }): Promise<{ success: boolean; dataURL?: string; error?: string }> {
        if (iselectron) return await electronapi.screencapture.capture(sourceId, options);
        return { success: false, error: 'Screen capture requires Electron' };
    }
};

// --- 3. File Watchers --------------------------------------------------------

export const filewatcher = {
    async start(watchPath: string, options?: { recursive?: boolean }): Promise<{ success: boolean; id?: number; error?: string }> {
        if (iselectron) return await electronapi.filesystem.watchstart(watchPath, options);
        return { success: false, error: 'File watchers require Electron' };
    },

    async stop(id: number): Promise<{ success: boolean; error?: string }> {
        if (iselectron) return await electronapi.filesystem.watchstop(id);
        return { success: false, error: 'File watchers require Electron' };
    },

    async stopall(): Promise<{ success: boolean }> {
        if (iselectron) return await electronapi.filesystem.watchstopall();
        return { success: true };
    },

    onchange(callback: (data: { id: number; eventType: string; filename: string; path: string }) => void) {
        if (iselectron) electronapi.filesystem.onwatchchange(callback);
    },

    onerror(callback: (data: { id: number; error: string; path: string }) => void) {
        if (iselectron) electronapi.filesystem.onwatcherror(callback);
    }
};

// --- 4. PTY Terminal ---------------------------------------------------------

export const ptyterminal = {
    async spawn(options?: { shell?: string; args?: string[]; cols?: number; rows?: number; cwd?: string; env?: Record<string, string> }): Promise<{ success: boolean; id?: number; pid?: number; error?: string }> {
        if (iselectron) return await electronapi.terminal.ptyspawn(options);
        return { success: false, error: 'PTY requires Electron with node-pty' };
    },

    async write(id: number, data: string): Promise<boolean> {
        if (iselectron) return await electronapi.terminal.ptywrite(id, data);
        return false;
    },

    async resize(id: number, cols: number, rows: number): Promise<boolean> {
        if (iselectron) return await electronapi.terminal.ptyresize(id, cols, rows);
        return false;
    },

    async kill(id: number): Promise<boolean> {
        if (iselectron) return await electronapi.terminal.ptykill(id);
        return false;
    },

    ondata(callback: (data: { id: number; data: string }) => void) {
        if (iselectron) electronapi.terminal.onptydata(callback);
    },

    onexit(callback: (data: { id: number; exitCode: number; signal: number }) => void) {
        if (iselectron) electronapi.terminal.onptyexit(callback);
    }
};

// --- 5. Printing -------------------------------------------------------------

export const printing = {
    async page(options?: any): Promise<{ success: boolean }> {
        if (iselectron) return await electronapi.print.page(options);
        window.print();
        return { success: true };
    },

    async topdf(options?: any): Promise<{ success: boolean; data?: string }> {
        if (iselectron) return await electronapi.print.topdf(options);
        return { success: false };
    },

    async getprinters(): Promise<any[]> {
        if (iselectron) return await electronapi.print.getprinters();
        return [];
    }
};

// --- 6. File Associations ----------------------------------------------------

export const fileassociations = {
    async register(extension: string, appName: string, appPath: string): Promise<{ success: boolean; error?: string }> {
        if (iselectron) return await electronapi.fileassociations.register(extension, appName, appPath);
        return { success: false, error: 'File associations require Electron' };
    }
};

// --- 7. Protocol Handler -----------------------------------------------------

export const protocolhandler = {
    onurl(callback: (url: string) => void) {
        if (iselectron) electronapi.events.onprotocolurl(callback);
    }
};

// --- 8. Secure Storage (OS Keychain) -----------------------------------------

export const securestorage = {
    async isavailable(): Promise<boolean> {
        if (iselectron) return await electronapi.securestorage.isavailable();
        return false;
    },

    async encrypt(plaintext: string): Promise<{ success: boolean; data?: string; error?: string }> {
        if (iselectron) return await electronapi.securestorage.encrypt(plaintext);
        return { success: false, error: 'Secure storage requires Electron' };
    },

    async decrypt(encrypted: string): Promise<{ success: boolean; data?: string; error?: string }> {
        if (iselectron) return await electronapi.securestorage.decrypt(encrypted);
        return { success: false, error: 'Secure storage requires Electron' };
    }
};

// --- 9. Launch at Login ------------------------------------------------------

export const autolaunch = {
    async getsettings(): Promise<{ openAtLogin: boolean; openAsHidden?: boolean }> {
        if (iselectron) return await electronapi.autolaunch.getsettings();
        return { openAtLogin: false };
    },

    async setsettings(settings: { openAtLogin: boolean; openAsHidden?: boolean }): Promise<{ success: boolean }> {
        if (iselectron) return await electronapi.autolaunch.setsettings(settings);
        return { success: false };
    }
};

// --- 10. Media Permissions ---------------------------------------------------

export const mediapermissions = {
    async check(mediaType: 'microphone' | 'camera' | 'screen'): Promise<string> {
        if (iselectron) return await electronapi.media.checkpermission(mediaType);
        // Web fallback: check via Permissions API
        try {
            const name = mediaType === 'camera' ? 'camera' : 'microphone';
            const result = await navigator.permissions.query({ name: name as PermissionName });
            return result.state;
        } catch {
            return 'unknown';
        }
    },

    async request(mediaType: 'microphone' | 'camera'): Promise<{ granted: boolean }> {
        if (iselectron) return await electronapi.media.requestpermission(mediaType);
        // Web fallback: request via getUserMedia
        try {
            const constraints = mediaType === 'camera' ? { video: true } : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(t => t.stop());
            return { granted: true };
        } catch {
            return { granted: false };
        }
    }
};

// --- 11. Dock Badge / Taskbar Progress ---------------------------------------

export const appbadge = {
    async setbadge(badge: string): Promise<{ success: boolean; error?: string }> {
        if (iselectron) return await electronapi.appbadge.setbadge(badge);
        // Web fallback: Badge API
        try {
            if ('setAppBadge' in navigator) {
                const count = parseInt(badge);
                if (isNaN(count) || count === 0) {
                    await (navigator as any).clearAppBadge();
                } else {
                    await (navigator as any).setAppBadge(count);
                }
                return { success: true };
            }
        } catch { }
        return { success: false, error: 'Not supported' };
    },

    async setprogress(progress: number): Promise<{ success: boolean }> {
        if (iselectron) return await electronapi.appbadge.setprogress(progress);
        return { success: false };
    },

    async bounce(type?: 'critical' | 'informational'): Promise<{ success: boolean; error?: string }> {
        if (iselectron) return await electronapi.appbadge.bounce(type);
        return { success: false, error: 'Not supported' };
    }
};

// --- 12. Hardware Info -------------------------------------------------------

export const hardwareinfo = {
    async getgpu(): Promise<any> {
        if (iselectron) return await electronapi.hardware.getgpu();
        // Web fallback: WebGL renderer info
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    return {
                        vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                        renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                    };
                }
            }
        } catch { }
        return { error: 'Not available' };
    },

    async getfonts(): Promise<{ success: boolean; fonts: string[]; error?: string }> {
        if (iselectron) return await electronapi.hardware.getfonts();
        // Web: no reliable way to enumerate fonts
        return { success: false, fonts: [], error: 'Font enumeration requires Electron' };
    },

    async getdisplays(): Promise<{ success: boolean; displays: any[]; error?: string }> {
        if (iselectron) return await electronapi.hardware.getdisplays();
        // Web fallback: screen info
        return {
            success: true,
            displays: [{
                name: 'Primary Display',
                width: window.screen.width,
                height: window.screen.height,
                primary: true
            }]
        };
    }
};

// --- 13. Menu Actions --------------------------------------------------------

export const menuactions = {
    onaction(callback: (action: string) => void) {
        if (iselectron) electronapi.events.onmenuaction(callback);
    }
};

