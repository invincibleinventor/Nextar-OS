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

