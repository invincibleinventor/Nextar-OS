'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, initialnotifications } from './notifications';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';

interface NotificationContextType {
    notifications: Notification[];
    toast: Notification | null;
    clearnotification: (id: string) => void;
    clearallnotifications: () => void;
    handlenotificationclick: (notif: Notification) => void;
    addnotification: (n: Notification) => void;
    hidetoast: () => void;
    markasviewed: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setnotifications] = useState<Notification[]>([]);
    const { addwindow, setactivewindow, windows, updatewindow } = useWindows();
    const { osstate } = useDevice();
    const [isloaded, setisloaded] = useState(false);
    const [hasshownwelcome, sethasshownwelcome] = useState(false);

    const [toast, settoast] = useState<Notification | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('clearedNotifications');
        const clearedids = stored ? JSON.parse(stored) : [];

        const active = initialnotifications.filter((n: any) => !clearedids.includes(n.id));
        setnotifications(active);
        setisloaded(true);
    }, []);

    useEffect(() => {
        if (!hasshownwelcome && !osstate && isloaded) {
            sethasshownwelcome(true);
            setTimeout(() => {
                addnotification({
                    id: 'demo-welcome',
                    appId: 'finder',
                    appName: 'Finder',
                    title: 'Welcome to macOS',
                    description: 'Experience the new immersive full screen mode and notifications.',
                    time: 'Now',
                    icon: '/finder.png'
                });
            }, 1000);
        }
    }, [osstate, isloaded, hasshownwelcome]);

    const addnotification = (n: Notification) => {
        setnotifications(prev => [n, ...prev]);
        settoast(n);
        setTimeout(() => settoast(null), 5000);
    };

    const hidetoast = () => settoast(null);

    const clearnotification = (id: string) => {
        setnotifications(prev => prev.filter(n => n.id !== id));
        if (toast?.id === id) settoast(null);

        const stored = localStorage.getItem('clearedNotifications');
        const clearedids = stored ? JSON.parse(stored) : [];
        if (!clearedids.includes(id)) {
            clearedids.push(id);
            localStorage.setItem('clearedNotifications', JSON.stringify(clearedids));
        }
    };

    const clearallnotifications = () => {
        notifications.forEach(n => {
            clearnotification(n.id);
        });
        setnotifications([]);
    };

    const handlenotificationclick = (notif: Notification) => {
        const existing = windows.find((w: any) =>
            w.appName.toLowerCase() === notif.appName.toLowerCase() ||
            w.id.startsWith(notif.appId)
        );

        if (existing) {
            updatewindow(existing.id, { isMinimized: false });
            setactivewindow(existing.id);
        } else {
            import('./app').then(({ apps }) => {
                const appdata = apps.find(a => a.id === notif.appId || a.appName === notif.appName);
                if (appdata) {
                    addwindow({
                        id: `${appdata.appName}-${Date.now()}`,
                        appName: appdata.appName,
                        additionalData: {},
                        title: appdata.appName,
                        component: appdata.componentName,
                        props: {},
                        isMinimized: false,
                        isMaximized: true,
                        position: { top: 0, left: 0 },
                        size: { width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight : 600 },
                    });
                }
            });
        }
    };

    const markasviewed = (id: string) => {
        setnotifications(prev => prev.map(n => n.id === id ? { ...n, viewed: true } : n));
        if (toast?.id === id) settoast(null);
    };

    if (!isloaded) return null;

    return (
        <NotificationContext.Provider value={{
            notifications,
            toast,
            clearnotification,
            clearallnotifications,
            handlenotificationclick,
            addnotification,
            hidetoast,
            markasviewed
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
