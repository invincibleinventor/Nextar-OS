'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Notification, initialnotifications } from './notifications';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useAuth } from './AuthContext';
import { apps, openSystemItem } from './data';
import { playSound } from './SoundEffects';
import { isnative, electronapi } from '@/utils/platform';

interface NotificationContextType {
    notifications: Notification[];
    toast: Notification | null;
    clearnotification: (id: string) => void;
    clearallnotifications: () => void;
    handlenotificationclick: (notif: Notification) => void;
    addnotification: (n: Notification) => void;
    hidetoast: () => void;
    markasviewed: (id: string) => void;
    addToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning', actions?: { label: string; actionId: string }[]) => void;
    handleactionclick: (notif: Notification, actionId: string) => void;
    version: number;
    dnd: boolean;
    setdnd: (val: boolean) => void;
    showpreviews: boolean;
    setshowpreviews: (val: boolean) => void;
    showonlockscreen: boolean;
    setshowonlockscreen: (val: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setnotifications] = useState<Notification[]>([]);
    const { addwindow, setactivewindow, windows, updatewindow } = useWindows();
    const { osstate, ismobile } = useDevice();
    const [isloaded, setisloaded] = useState(false);
    const [hasshownwelcome, sethasshownwelcome] = useState(false);
    const [version, setversion] = useState(0);

    const [toast, settoast] = useState<Notification | null>(null);
    const [dnd, setdnd] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('nextaros-dnd') === 'true' : false);
    const [showpreviews, setshowpreviews] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('nextaros-notif-previews') !== 'false' : true);
    const [showonlockscreen, setshowonlockscreen] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('nextaros-notif-lockscreen') !== 'false' : true);

    useEffect(() => { localStorage.setItem('nextaros-dnd', String(dnd)); }, [dnd]);
    useEffect(() => { localStorage.setItem('nextaros-notif-previews', String(showpreviews)); }, [showpreviews]);
    useEffect(() => { localStorage.setItem('nextaros-notif-lockscreen', String(showonlockscreen)); }, [showonlockscreen]);

    const { isGuest } = useAuth();

    useEffect(() => {
        if (isGuest) {
            setnotifications(initialnotifications);
            setversion(v => v + 1);
            setisloaded(true);
            return;
        }

        const stored = localStorage.getItem('clearedNotifications');
        const clearedids = stored ? JSON.parse(stored) : [];

        const active = initialnotifications.filter((n: any) => !clearedids.includes(n.id));
        setnotifications(active);
        setversion(v => v + 1);
        setisloaded(true);
    }, [isGuest]);

    // Subscribe to native notification daemon (D-Bus org.freedesktop.Notifications)
    useEffect(() => {
        if (!isnative || !electronapi?.notificationdaemon) return;

        const unlisten = electronapi.notificationdaemon.onreceived((notif: any) => {
            const n: Notification = {
                id: `native-${notif.id || Date.now()}`,
                title: notif.summary || notif.app_name || 'Notification',
                description: notif.body || '',
                time: 'Now',
                type: 'system',
                appname: notif.app_name || 'System',
                icon: notif.app_icon || '/icons/settings.png',
                appid: 'system',
                actions: notif.actions?.map((a: any) => ({
                    label: a.label || a,
                    actionId: a.id || a,
                })),
            };
            addnotificationRef.current(n);
        });

        return () => { unlisten?.then?.((fn: any) => fn?.()); };
    }, []);

    const addnotificationRef = useRef((_n: Notification) => {});

    const addnotification = (n: Notification) => {
        setnotifications(prev => [n, ...prev]);
        setversion(v => v + 1);
        if (!dnd) {
            settoast(n);
            playSound('notification');
            setTimeout(() => settoast(null), 3000);
        }
    };

    addnotificationRef.current = addnotification;

    const addToast = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', actions?: { label: string; actionId: string }[]) => {
        if (type === 'error') playSound('error');
        else if (type === 'success') playSound('success');
        else playSound('notification');

        addnotification({
            id: Math.random().toString(36).substring(2, 11),
            title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notification',
            description: message,
            time: 'Now',
            type: 'system',
            appname: 'System',
            icon: '/icons/settings.png',
            appid: 'system',
            actions,
        });
    };

    const handleactionclick = (notif: Notification, actionId: string) => {
        if (actionId === 'open-help') {
            openSystemItem('aboutnextaros', { addwindow, windows, updatewindow, setactivewindow, ismobile });
        }
        markasviewed(notif.id);
    };

    const hidetoast = () => settoast(null);

    const clearnotification = (id: string) => {
        setnotifications(prev => prev.filter(n => n.id !== id));
        if (toast?.id === id) settoast(null);

        if (isGuest) return;

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
        setversion(v => v + 1);
        if (toast?.id === id) settoast(null);
    };

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
            addToast,
            handleactionclick,
            version,
            dnd,
            setdnd,
            showpreviews,
            setshowpreviews,
            showonlockscreen,
            setshowonlockscreen,
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
