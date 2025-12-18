'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, initialnotifications } from './notifications';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { apps, openSystemItem } from './data';

interface NotificationContextType {
    notifications: Notification[];
    toast: Notification | null;
    clearnotification: (id: string) => void;
    clearallnotifications: () => void;
    handlenotificationclick: (notif: Notification) => void;
    addnotification: (n: Notification) => void;
    hidetoast: () => void;
    markasviewed: (id: string) => void;
    addToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setnotifications] = useState<Notification[]>([]);
    const { addwindow, setactivewindow, windows, updatewindow } = useWindows();
    const { osstate, ismobile } = useDevice();
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
        setTimeout(() => settoast(null), 3000);
    };

    const addToast = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        addnotification({
            id: Math.random().toString(36).substr(2, 9),
            title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notification',
            description: message,
            time: 'Now',
            type: 'system',
            appname: 'System',
            icon: '/icons/system.png',
            appid: 'system'
        });
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
        openSystemItem(notif.appid, { addwindow, windows, updatewindow, setactivewindow, ismobile });
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
            markasviewed,
            addToast
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
