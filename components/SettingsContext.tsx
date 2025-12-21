'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [reducemotion, setreducemotion] = useState(false);
    const [reducetransparency, setreducetransparency] = useState(false);
    const [soundeffects, setsoundeffects] = useState(false);
    const [wallpaperurl, setwallpaperurl] = useState('/wallpaper-1.jpg');
    const [accentcolor, setaccentcolor] = useState('#007AFF');

    const { isGuest } = useAuth();

    useEffect(() => {
        if (isGuest) return;

        const storedMotion = localStorage.getItem('reduceMotion');
        const storedTransparency = localStorage.getItem('reduceTransparency');
        const storedSounds = localStorage.getItem('soundEffects');
        const storedWallpaper = localStorage.getItem('wallpaperUrl');
        const storedAccent = localStorage.getItem('accentColor');

        if (storedMotion) setreducemotion(JSON.parse(storedMotion));
        if (storedTransparency) setreducetransparency(JSON.parse(storedTransparency));
        if (storedSounds) setsoundeffects(JSON.parse(storedSounds));
        if (storedWallpaper) setwallpaperurl(storedWallpaper);
        if (storedAccent) setaccentcolor(storedAccent);
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
            setaccentcolor: updateaccentcolor
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
