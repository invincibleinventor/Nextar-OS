/**
 * Config system — uses native config files (~/.config/nextaros/settings.json)
 * when running in Tauri, falls back to localStorage for web mode.
 */

import { tauriAPI } from './tauri-bridge';

const IS_TAURI = typeof window !== 'undefined' && '__TAURI__' in window;

// In-memory cache for sync access (populated on init)
let configCache: Record<string, any> = {};
let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initConfig(): Promise<void> {
    if (initialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (IS_TAURI) {
            try {
                const config = await tauriAPI.app.getconfig();
                if (config && typeof config === 'object') {
                    configCache = config;
                }
            } catch {
                configCache = {};
            }
        } else {
            // Web mode: read all relevant keys from localStorage into cache
            const keys = [
                'theme', 'nextaros-ui-style', 'nextaros-accent-color',
                'nextaros-dnd', 'nextaros-notif-previews', 'nextaros-notif-lockscreen',
                'wallpaper', 'dock-position', 'dock-autohide', 'dock-size',
                'nextaros-font-size', 'nextaros-font-family',
            ];
            for (const key of keys) {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    try { configCache[key] = JSON.parse(val); } catch { configCache[key] = val; }
                }
            }
        }
        initialized = true;
    })();

    return initPromise;
}

/** Get a config value synchronously from cache */
export function getConfigSync(key: string, defaultValue?: any): any {
    const val = configCache[key];
    return val !== undefined ? val : defaultValue;
}

/** Get a config value (async, reads from native file if needed) */
export async function getConfig(key: string, defaultValue?: any): Promise<any> {
    await initConfig();
    const val = configCache[key];
    return val !== undefined ? val : defaultValue;
}

/** Set a config value and persist it */
export async function setConfig(key: string, value: any): Promise<void> {
    configCache[key] = value;

    if (IS_TAURI) {
        try {
            await tauriAPI.app.setconfigvalue(key, value);
        } catch {
            // Fallback: write entire config
            try { await tauriAPI.app.setconfig(configCache); } catch {}
        }
    } else {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch {}
    }
}

/** Get the full config object */
export async function getAllConfig(): Promise<Record<string, any>> {
    await initConfig();
    return { ...configCache };
}

/** Set multiple config values at once */
export async function setMultipleConfig(values: Record<string, any>): Promise<void> {
    Object.assign(configCache, values);

    if (IS_TAURI) {
        try { await tauriAPI.app.setconfig(configCache); } catch {}
    } else {
        for (const [key, value] of Object.entries(values)) {
            try {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(key, serialized);
            } catch {}
        }
    }
}
