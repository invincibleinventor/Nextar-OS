'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface SettingsContextType {
    reducemotion: boolean;
    setreducemotion: (value: boolean) => void;
    reducetransparency: boolean;
    setreducetransparency: (value: boolean) => void;
    soundeffects: boolean;
    setsoundeffects: (value: boolean) => void;
    wallpaperurl: string;
    setwallpaperurl: (value: string) => void;
    accentcolor: string;
    setaccentcolor: (value: string) => void;
    islightbackground: boolean;
    inverselabelcolor: boolean;
    setinverselabelcolor: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [reducemotion, setreducemotion] = useState(false);
    const [reducetransparency, setreducetransparency] = useState(false);
    const [soundeffects, setsoundeffects] = useState(false);
    const [wallpaperurl, setwallpaperurl] = useState('/bg.jpg');
    const [accentcolor, setaccentcolor] = useState('#ed8796');
    const [islightbackground, setislightbackground] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            const cached = localStorage.getItem('bgBrightnessMap');
            if (cached) {
                const map = JSON.parse(cached);
                const val = map['/bg.jpg'];
                if (val !== undefined) return val;
            }
        } catch {}
        return false;
    });
    const [inverselabelcolor, setinverselabelcolor] = useState(true);

    const { isGuest } = useAuth();

    const analyzebrightness = useCallback((url: string) => {
        if (typeof window === 'undefined') return;

        const trycanvasanalysis = (imgel: HTMLImageElement): boolean => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return false;

                const samplesize = 50;
                canvas.width = samplesize;
                canvas.height = samplesize;
                ctx.drawImage(imgel, 0, 0, samplesize, samplesize);

                const imagedata = ctx.getImageData(0, 0, samplesize, samplesize);
                const data = imagedata.data;

                let totalluminance = 0;
                const pixelcount = data.length / 4;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
                    totalluminance += luminance;
                }

                const avgbrightness = totalluminance / pixelcount;
                const islight = avgbrightness > 128;
                setislightbackground(islight);
                try {
                    const map = JSON.parse(localStorage.getItem('bgBrightnessMap') || '{}');
                    map[url] = islight;
                    localStorage.setItem('bgBrightnessMap', JSON.stringify(map));
                } catch {}
                return true;
            } catch {
                return false;
            }
        };

        const usecached = () => {
            try {
                const map = JSON.parse(localStorage.getItem('bgBrightnessMap') || '{}');
                if (map[url] !== undefined) {
                    setislightbackground(map[url]);
                    return;
                }
            } catch {}
            setislightbackground(false);
        };

        // For same-origin images, try without crossOrigin first (works in WebViews)
        const issameorigin = url.startsWith('/') || url.startsWith(window.location.origin);

        if (issameorigin) {
            const img = new Image();
            img.onload = () => {
                if (!trycanvasanalysis(img)) {
                    usecached();
                }
            };
            img.onerror = () => usecached();
            img.src = url;
        } else {
            // External URL: try with crossOrigin, fall back to cache
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (!trycanvasanalysis(img)) {
                    usecached();
                }
            };
            img.onerror = () => {
                // Retry without crossOrigin - image may load but canvas will be tainted
                const img2 = new Image();
                img2.onload = () => {
                    if (!trycanvasanalysis(img2)) {
                        usecached();
                    }
                };
                img2.onerror = () => usecached();
                img2.src = url;
            };
            img.src = url;
        }
    }, []);

    useEffect(() => {
        analyzebrightness(wallpaperurl);
    }, [wallpaperurl, analyzebrightness]);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
        const defaultWallpaper = isDark ? '/bg-dark.jpg' : '/bg.jpg';
        setwallpaperurl(defaultWallpaper);

        if (isGuest) return;

        const storedMotion = localStorage.getItem('reduceMotion');
        const storedTransparency = localStorage.getItem('reduceTransparency');
        const storedSounds = localStorage.getItem('soundEffects');
        const storedWallpaper = localStorage.getItem('wallpaperUrl');
        const storedAccent = localStorage.getItem('accentColor');
        const storedInverse = localStorage.getItem('inverseLabelColor');

        if (storedMotion) setreducemotion(JSON.parse(storedMotion));
        if (storedTransparency) setreducetransparency(JSON.parse(storedTransparency));
        if (storedSounds) setsoundeffects(JSON.parse(storedSounds));
        if (storedWallpaper) setwallpaperurl(storedWallpaper);
        if (storedAccent) setaccentcolor(storedAccent);
        if (storedInverse) setinverselabelcolor(JSON.parse(storedInverse));
    }, [isGuest]);

    const updatereducemotion = (value: boolean) => {
        setreducemotion(value);
        if (!isGuest) localStorage.setItem('reduceMotion', JSON.stringify(value));
    };

    const updatereducetransparency = (value: boolean) => {
        setreducetransparency(value);
        if (!isGuest) localStorage.setItem('reduceTransparency', JSON.stringify(value));
    };

    const updatesoundeffects = (value: boolean) => {
        setsoundeffects(value);
        if (!isGuest) localStorage.setItem('soundEffects', JSON.stringify(value));
    };

    const updatewallpaperurl = (value: string) => {
        setwallpaperurl(value);
        if (!isGuest) localStorage.setItem('wallpaperUrl', value);
    };

    const updateaccentcolor = (value: string) => {
        setaccentcolor(value);
        if (!isGuest) localStorage.setItem('accentColor', value);
    };

    const updateinverselabelcolor = (value: boolean) => {
        setinverselabelcolor(value);
        if (!isGuest) localStorage.setItem('inverseLabelColor', JSON.stringify(value));
    };

    useEffect(() => {
        document.documentElement.style.setProperty('--accent-color', accentcolor);
    }, [accentcolor]);

    return (
        <SettingsContext.Provider value={{
            reducemotion,
            setreducemotion: updatereducemotion,
            reducetransparency,
            setreducetransparency: updatereducetransparency,
            soundeffects,
            setsoundeffects: updatesoundeffects,
            wallpaperurl,
            setwallpaperurl: updatewallpaperurl,
            accentcolor,
            setaccentcolor: updateaccentcolor,
            islightbackground,
            inverselabelcolor,
            setinverselabelcolor: updateinverselabelcolor
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
