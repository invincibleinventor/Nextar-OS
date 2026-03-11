'use client';

import { useEffect } from 'react';
import { istauri } from '@/utils/platform';

/**
 * ConfigSync — On startup in Tauri, reads config from native file
 * and applies theme/clay classes to <html>. Also syncs native config
 * values back to localStorage so all existing code keeps working.
 */
export function ConfigSync() {
    useEffect(() => {
        if (!istauri) return;

        (async () => {
            const { initConfig, getConfigSync } = await import('@/utils/config');
            await initConfig();

            const uiStyle = getConfigSync('nextaros-ui-style', 'neo');
            const theme = getConfigSync('theme', 'dark');

            // Apply clay class
            if (uiStyle === 'classic') {
                document.documentElement.classList.remove('clay');
            } else {
                document.documentElement.classList.add('clay');
            }

            // Apply theme class
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');

            // Sync to localStorage so all existing hooks/components work
            try {
                localStorage.setItem('nextaros-ui-style', uiStyle);
                localStorage.setItem('theme', theme);

                // Sync other config keys
                const accentColor = getConfigSync('nextaros-accent-color');
                if (accentColor) localStorage.setItem('nextaros-accent-color', accentColor);

                const dnd = getConfigSync('nextaros-dnd');
                if (dnd !== undefined) localStorage.setItem('nextaros-dnd', String(dnd));

                const wallpaper = getConfigSync('wallpaper');
                if (wallpaper) localStorage.setItem('wallpaper', wallpaper);
            } catch {}
        })();
    }, []);

    return null;
}
