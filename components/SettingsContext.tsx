'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    reduceMotion: boolean;
    setReduceMotion: (value: boolean) => void;
    reduceTransparency: boolean;
    setReduceTransparency: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [reduceMotion, setReduceMotion] = useState(false);
    const [reduceTransparency, setReduceTransparency] = useState(false);

    useEffect(() => {
        const storedMotion = localStorage.getItem('reduceMotion');
        const storedTransparency = localStorage.getItem('reduceTransparency');

        if (storedMotion) setReduceMotion(JSON.parse(storedMotion));
        if (storedTransparency) setReduceTransparency(JSON.parse(storedTransparency));
    }, []);

    const updateReduceMotion = (value: boolean) => {
        setReduceMotion(value);
        localStorage.setItem('reduceMotion', JSON.stringify(value));
    };

    const updateReduceTransparency = (value: boolean) => {
        setReduceTransparency(value);
        localStorage.setItem('reduceTransparency', JSON.stringify(value));
    };

    return (
        <SettingsContext.Provider value={{
            reduceMotion,
            setReduceMotion: updateReduceMotion,
            reduceTransparency,
            setReduceTransparency: updateReduceTransparency
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
