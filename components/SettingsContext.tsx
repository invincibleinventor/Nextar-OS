'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    reducemotion: boolean;
    setreducemotion: (value: boolean) => void;
    reducetransparency: boolean;
    setreducetransparency: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [reducemotion, setreducemotion] = useState(false);
    const [reducetransparency, setreducetransparency] = useState(false);

    useEffect(() => {
        const storedMotion = localStorage.getItem('reduceMotion');
        const storedTransparency = localStorage.getItem('reduceTransparency');

        if (storedMotion) setreducemotion(JSON.parse(storedMotion));
        if (storedTransparency) setreducetransparency(JSON.parse(storedTransparency));
    }, []);

    const updatereducemotion = (value: boolean) => {
        setreducemotion(value);
        localStorage.setItem('reduceMotion', JSON.stringify(value));
    };

    const updatereducetransparency = (value: boolean) => {
        setreducetransparency(value);
        localStorage.setItem('reduceTransparency', JSON.stringify(value));
    };

    return (
        <SettingsContext.Provider value={{
            reducemotion,
            setreducemotion: updatereducemotion,
            reducetransparency,
            setreducetransparency: updatereducetransparency
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
