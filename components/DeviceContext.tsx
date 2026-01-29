'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type osState = 'booting' | 'locked' | 'unlocked';
type deviceType = 'desktop' | 'mobile' | 'tablet';
type appMode = 'portfolio' | 'os';

interface DeviceContextType {
    osstate: osState;
    setosstate: (state: osState) => void;
    devicetype: deviceType;
    ismobile: boolean;
    brightness: number;
    setbrightness: (val: number) => void;
    volume: number;
    setvolume: (val: number) => void;
    appmode: appMode;
    setappmode: (mode: appMode) => void;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};

export const DeviceProvider = ({ children }: { children: React.ReactNode }) => {
    const [osstate, setosstate] = useState<osState>('booting');
    const [devicetype, setdevicetype] = useState<deviceType>('desktop');
    const [brightness, setbrightness] = useState(100);
    const [volume, setvolume] = useState(50);
    const [appmode, setappmodestate] = useState<appMode>('portfolio');

    const setappmode = (mode: appMode) => {
        setappmodestate(mode);
    };

    useEffect(() => {
        const iselectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
        if (iselectron) {
            setappmodestate('os');
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('nextaros-appmode');
        }
    }, []);

    useEffect(() => {
        const handleresize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setdevicetype('mobile');
            } else if (width < 1024) {
                setdevicetype('tablet');
            } else {
                setdevicetype('desktop');
            }
        };
        handleresize();
        window.addEventListener('resize', handleresize);
        return () => window.removeEventListener('resize', handleresize);
    }, []);

    return (
        <DeviceContext.Provider
            value={{
                osstate,
                setosstate,
                devicetype,
                ismobile: devicetype === 'mobile',
                brightness,
                setbrightness,
                volume,
                setvolume,
                appmode,
                setappmode,
            }}
        >
            {children}
        </DeviceContext.Provider>
    );
};
