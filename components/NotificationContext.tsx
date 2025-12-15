'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, initialnotifications } from './notifications';
import { usewindows } from './WindowContext';
import { usedevice } from './DeviceContext';

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
    const { addwindow, setactivewindow, windows, updatewindow } = usewindows();
    const { osstate } = usedevice();
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
            w.appname.toLowerCase() === notif.appname.toLowerCase() ||
            w.id.startsWith(notif.appid)
        );

        if (existing) {
            updatewindow(existing.id, { isMinimized: false });
            setactivewindow(existing.id);
        } else {
            import('./app').then(({ apps }) => {
                const appdata = apps.find(a => a.id === notif.appid || a.appname === notif.appname);
                if (appdata) {
                    addwindow({
                        id: `${appdata.appname}-${Date.now()}`,
                        appname: appdata.appname,
                        additionaldata: {},
                        title: appdata.appname,
                        component: appdata.componentname,
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

export function usenotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
