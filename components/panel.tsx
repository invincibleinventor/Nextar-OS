'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { apps, openSystemItem } from './data';
import Control from './controlcenter';
import Logo from './mainlogo';
import { useAppMenus } from './AppMenuContext';
import { IoSparkles, IoNotificationsOutline } from 'react-icons/io5';
import { LuWifi, LuBatteryFull, LuBatteryMedium, LuBatteryLow, LuBatteryCharging } from 'react-icons/lu';
import { useDevice } from './DeviceContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { iselectron, power, battery, wifi } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel } from './hooks/useClayStyles';

export default function Panel({ ontogglenotifications, ontogglecalendar }: { ontogglenotifications?: () => void; ontogglecalendar?: () => void }) {
    const { activewindow, windows, updatewindow, removewindow, setactivewindow, addwindow } = useWindows();
    const { setappmode, setosstate } = useDevice();
    const clay = useIsClay();

    // Auto-hide panel when a window is maximized/tiled
    const [panelhovered, setpanelhovered] = useState(false);
    const panelhidetimer = useRef<NodeJS.Timeout | null>(null);
    const shouldautohide = windows.some((w: any) => !w.isminimized && (w.ismaximized || w.istiled));

    const handlepanelenter = useCallback(() => {
        if (panelhidetimer.current) { clearTimeout(panelhidetimer.current); panelhidetimer.current = null; }
        setpanelhovered(true);
    }, []);
    const handlepanelleave = useCallback(() => {
        panelhidetimer.current = setTimeout(() => setpanelhovered(false), 300);
    }, []);
    const panelvisible = !shouldautohide || panelhovered;

    const activeappname =
        windows.find((window: any) => window.id === activewindow)?.appname || 'Explorer';

    const activeapp = apps.find(a => a.appname === activeappname);
    const apptitlemenu = activeapp?.titlemenu || [
        { title: "About " + activeappname, disabled: false, actionId: "About " + activeappname },
        { title: "Quit " + activeappname, disabled: false, actionId: "Quit " + activeappname },
    ];

    const { activeAppMenus, triggerAction } = useAppMenus();
    const hasDynamicMenus = Object.keys(activeAppMenus).length > 0;
    let appmenus: any = hasDynamicMenus ? activeAppMenus : activeapp?.menus;
    const [activemenu, setactivemenu] = useState<string | null>(null);
    const [hoverenabled, sethoverenabled] = useState(false);

    // ─── Status tray state ───
    const [currentdate, setcurrentdate] = useState<string>('');
    const [currenttime, setcurrenttime] = useState<string>('');
    const [showcontrolcenter, setshowcontrolcenter] = useState(false);
    const [batterystatus, setbatterystatus] = useState({ percentage: 100, charging: false, available: false });
    const [wifistatus, setwifistatus] = useState({ connected: false, ssid: null as string | null, available: false });
    const [isOnline, setIsOnline] = useState(true);
    const { notifications: panelnotifications } = useNotifications();

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    useEffect(() => {
        if (!iselectron || clay) return;
        const fetchstatus = async () => {
            try {
                const batresult = await battery.getstatus();
                if (batresult.percentage !== undefined) setbatterystatus({ percentage: batresult.percentage, charging: batresult.charging || false, available: true });
                const wifiresult = await wifi.getstatus();
                if (wifiresult.connected !== undefined) setwifistatus({ connected: wifiresult.connected, ssid: wifiresult.ssid, available: true });
            } catch { }
        };
        fetchstatus();
        const interval = setInterval(fetchstatus, 30000);
        return () => clearInterval(interval);
    }, [clay]);

    useEffect(() => {
        if (clay) return;
        const update = () => {
            const now = new Date();
            setcurrentdate(now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).replace(',', '').replace(',', ''));
            setcurrenttime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase());
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [clay]);

    const { user, logout, isGuest } = useAuth();
    const { addToast } = useNotifications();

    const hasShownGuestToast = React.useRef(false);

    useEffect(() => {
        if (isGuest && !hasShownGuestToast.current) {
            addToast("Guest Mode Enabled. No data will be preserved.", "success");
            hasShownGuestToast.current = true;
        }
        if (!isGuest) hasShownGuestToast.current = false;
    }, [isGuest, addToast]);

    const defaultWindowMenu = [
        { title: "Minimize", actionId: "minimize", disabled: false },
        { title: "Zoom", actionId: "zoom", disabled: false },
        { separator: true },
        { title: "Bring All to Front", disabled: false }
    ];

    const defaultHelpMenu = [
        { title: "NextarOS Help", disabled: false },
        { title: "About " + activeappname, disabled: false }
    ];

    if (!appmenus) {
        appmenus = { Window: defaultWindowMenu, Help: defaultHelpMenu };
    } else {
        if (!appmenus.Window) appmenus.Window = defaultWindowMenu;
        if (!appmenus.Help) appmenus.Help = defaultHelpMenu;
    }

    const handletogglemenu = (id: string | null) => {
        setactivemenu(id);
        sethoverenabled(id !== null);
    };

    const handlehovermenu = (id: string) => {
        if (hoverenabled) setactivemenu(id);
    };

    const dynamicmainmenu = [
        { title: 'Help', actionId: 'about' },
        { separator: true },
        { title: 'System Settings...', actionId: 'settings' },
        { title: 'App Store...', actionId: 'appstore' },
        { separator: true },
        { title: 'Force Quit...', actionId: 'forcequit' },
        { separator: true },
        { title: 'Sleep', actionId: 'sleep' },
        { title: 'Restart...', actionId: 'restart' },
        { title: 'Shut Down...', actionId: 'shutdown' },
        { separator: true },
        { title: `Log Out ${user?.name || 'User'}...`, actionId: 'logout' }
    ];

    const handledynamicmainmenu = async (item: any) => {
        if (!item || item.disabled) return;
        const action = item.actionId || item.title;
        switch (action) {
            case 'about': addwindow({ id: `aboutnextaros-${Date.now()}`, appname: 'Help', component: 'apps/AboutNextarOS', props: {}, isminimized: false, ismaximized: false }); break;
            case 'forcequit': window.dispatchEvent(new CustomEvent('show-force-quit')); break;
            case 'settings': addwindow({ id: `settings-${Date.now()}`, appname: 'Settings', component: 'apps/Settings', props: {}, isminimized: false, ismaximized: false }); break;
            case 'appstore': addwindow({ id: `appstore-${Date.now()}`, appname: 'App Store', component: 'apps/AppStore', props: {}, isminimized: false, ismaximized: false }); break;
            case 'sleep': if (iselectron) { await power.sleep(); } else { setosstate('locked'); } break;
            case 'logout': if (iselectron) { await power.logout(); } logout(); break;
            case 'restart': if (iselectron) { await power.restart(); } else { setosstate('booting'); } break;
            case 'shutdown': if (iselectron) { await power.shutdown(); } else { setosstate('booting'); } break;
            default: break;
        }
    };

    const handleMenuAction = (item: any) => {
        if (!item || item.disabled) return;
        const actionId = item.actionId || item.title;

        if (actionId === 'minimize') {
            if (activewindow) { updatewindow(activewindow, { isminimized: true }); setactivewindow(null); }
        } else if (actionId === 'zoom') {
            if (activewindow) {
                const win = windows.find((w: any) => w.id === activewindow);
                if (win) updatewindow(activewindow, { ismaximized: !win.ismaximized });
            }
        } else if (actionId.startsWith('Quit ') || actionId === 'close-window') {
            if (activewindow) removewindow(activewindow);
        } else if (actionId === 'new-window') {
            const explorerApp = apps.find(a => a.id === 'explorer');
            if (explorerApp) addwindow({ id: `explorer-${Date.now()}`, appname: explorerApp.appname, component: explorerApp.componentname, props: {}, isminimized: false, ismaximized: false, position: { top: 80, left: 80 }, size: explorerApp.defaultsize || { width: 900, height: 600 } });
        } else if (actionId.startsWith('About ')) {
            const app = apps.find(a => a.appname === activeappname);
            if (app) {
                const appItem: any = { id: app.id, name: app.appname, mimetype: 'application/x-executable', isSystem: true, date: 'Today', size: 'Application', icon: app.icon };
                openSystemItem(appItem, { addwindow, windows, updatewindow, setactivewindow, ismobile: false }, 'getinfo');
            }
        } else {
            triggerAction(actionId);
        }

        const event = new CustomEvent('menu-action', { detail: { appId: activeapp?.id || 'explorer', actionId, title: item.title } });
        window.dispatchEvent(event);
        setactivemenu(null);
        sethoverenabled(false);
    };

    /* ═══════════════════════════════════════════════════
       CLAY MODE — Floating centered glass pill
       ═══════════════════════════════════════════════════ */
    const unreadcount = panelnotifications.filter(n => !n.viewed).length;

    if (clay) {
        return (
            <>
                {/* Hover trigger zone — outside animated wrapper so it stays at viewport top */}
                {shouldautohide && !panelhovered && (
                    <div className="fixed z-[401] top-0 left-0 right-0 h-2" onMouseEnter={handlepanelenter} />
                )}
                <div
                    data-tour="menubar"
                    className="fixed z-[400] top-0 left-0 right-0 flex items-center justify-center pointer-events-none"
                    onMouseEnter={handlepanelenter}
                    onMouseLeave={handlepanelleave}
                    style={{ transition: 'opacity 0.25s ease, transform 0.25s ease', opacity: panelvisible ? 1 : 0, transform: panelvisible ? 'translateY(0)' : 'translateY(-100%)', pointerEvents: panelvisible ? undefined : 'none' }}
                >
                    <div
                        className="h-[38px] mt-[4px] px-2 flex items-center space-x-0.5 pointer-events-auto rounded-[16px]"
                        style={{
                            ...glassPanel,
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                        }}
                    >
                        <div className="flex items-center justify-center h-full" data-tour="dynamic-main-menu">
                            <Menu id="dynamicMainMenu" title={<div className="flex items-center justify-center h-full"><Logo /></div>} data={dynamicmainmenu} visible={activemenu === 'dynamicMainMenu'} ontoggle={handletogglemenu} onhover={handlehovermenu} onaction={handledynamicmainmenu} clay={clay} />
                        </div>
                        <Menu id="titleMenu" title={activeappname} data={apptitlemenu} visible={activemenu === 'titleMenu'} ontoggle={handletogglemenu} bold={true} onhover={handlehovermenu} onaction={handleMenuAction} clay={clay} />
                        <div className='hidden md:inline-flex'>
                            {Object.entries(appmenus).map(([menukey, menuitems]) => {
                                if (menukey === 'windowMenu' && activeappname !== 'Explorer') return null;
                                return <Menu key={menukey} id={menukey} title={menukey.charAt(0).toUpperCase() + menukey.slice(1)} data={menuitems as any} visible={activemenu === menukey} ontoggle={handletogglemenu} onhover={handlehovermenu} onaction={handleMenuAction} clay={clay} />;
                            })}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* ═══════════════════════════════════════════════════
       CLASSIC MODE — Full-width bar with status tray
       ═══════════════════════════════════════════════════ */
    return (
        <>
            {shouldautohide && !panelhovered && (
                <div className="fixed z-[401] top-0 left-0 right-0 h-2" onMouseEnter={handlepanelenter} />
            )}
            <div
                data-tour="menubar"
                className={`fixed h-[35px] z-[400] top-0 w-screen py-[6px] flex px-4 justify-between items-center content-center bg-[--bg-surface] border-b border-[--border-color] ${!clay ? 'anime-gradient-top' : ''}`}
                onMouseEnter={handlepanelenter}
                onMouseLeave={handlepanelleave}
                style={{ transition: 'opacity 0.25s ease, transform 0.25s ease', opacity: panelvisible ? 1 : 0, transform: panelvisible ? 'translateY(0)' : 'translateY(-100%)', pointerEvents: panelvisible ? undefined : 'none' }}
            >
                <div className="relative flex flex-row items-center content-center space-x-0">
                    <div className="flex items-center justify-center h-full mr-2" data-tour="dynamic-main-menu">
                        <Menu id="dynamicMainMenu" title={<div className="flex items-center justify-center h-full"><Logo /></div>} data={dynamicmainmenu} visible={activemenu === 'dynamicMainMenu'} ontoggle={handletogglemenu} onhover={handlehovermenu} onaction={handledynamicmainmenu} />
                    </div>
                    <Menu id="titleMenu" title={activeappname} data={apptitlemenu} visible={activemenu === 'titleMenu'} ontoggle={handletogglemenu} bold={true} onhover={handlehovermenu} onaction={handleMenuAction} />
                    <div className='hidden md:inline-flex'>
                        {Object.entries(appmenus).map(([menukey, menuitems]) => {
                            if (menukey === 'windowMenu' && activeappname !== 'Explorer') return null;
                            return <Menu key={menukey} id={menukey} title={menukey.charAt(0).toUpperCase() + menukey.slice(1)} data={menuitems as any} visible={activemenu === menukey} ontoggle={handletogglemenu} onhover={handlehovermenu} onaction={handleMenuAction} />;
                        })}
                    </div>
                </div>
                <div className='flex space-x-3 flex-row items-center content-center'>
                    <div className='hidden md:flex flex-row space-x-4 items-center pl-2'>
                        {!iselectron && (
                            <button onClick={() => setappmode('portfolio')} className={`px-2 py-1 text-xs font-medium transition-colors ${clay ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-pastel-red/15 hover:bg-pastel-red/25 text-pastel-red border border-pastel-red/30'}`}>Exit NextarOS</button>
                        )}
                        <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-desktop-effects'))} className={`transition-colors ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-pastel-lavender/10'}`} title="Toggle Desktop Effects">
                            <IoSparkles className={`w-4 h-4 ${clay ? 'text-[--text-muted]' : 'text-pastel-pink'}`} />
                        </button>
                        <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-next'))} className={`transition-colors ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-pastel-lavender/10'}`} title="Next (⌘K)">
                            <svg className="w-4 h-4 text-[--text-color]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                        {!isOnline && <span className={`text-[9px] font-bold px-1 py-0.5 ${clay ? 'text-red-500 bg-red-500/10' : 'text-pastel-red bg-pastel-red/15'}`}>OFFLINE</span>}
                        <div className="relative group">
                            <LuWifi className={`w-[16px] h-[16px] ${clay ? (!isOnline ? 'text-red-500' : wifistatus.connected ? 'text-[--text-color]' : 'text-[--text-muted]') : (!isOnline ? 'text-pastel-red' : wifistatus.connected ? 'text-pastel-blue' : 'text-pastel-lavender')}`} />
                            {wifistatus.connected && wifistatus.ssid && (
                                <div className="absolute top-full mt-1 right-0 bg-overlay text-[--text-color] text-[10px] px-2 py-1 border border-[--border-color] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[600]">{wifistatus.ssid}</div>
                            )}
                        </div>
                        <div className='flex items-center space-x-1'>
                            {batterystatus.available && <span className="text-[11px] font-medium text-[--text-color]">{batterystatus.percentage}%</span>}
                            {batterystatus.charging ? (
                                <LuBatteryCharging className={`w-[22px] h-[22px] ${clay ? 'text-[--text-color]' : 'text-pastel-green'}`} />
                            ) : batterystatus.percentage > 60 ? (
                                <LuBatteryFull className={`w-[20px] h-[20px] ${clay ? 'text-[--text-color]' : 'text-pastel-green'}`} />
                            ) : batterystatus.percentage > 20 ? (
                                <LuBatteryMedium className={`w-[20px] h-[20px] ${clay ? 'text-[--text-muted]' : 'text-pastel-yellow'}`} />
                            ) : (
                                <LuBatteryLow className={`w-[20px] h-[20px] ${clay ? 'text-[--text-muted]' : 'text-pastel-red'}`} />
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <div
                            className={`p-1 flex flex-row items-center content-center space-x-2 cursor-pointer transition-all duration-200 active:opacity-50 ${clay ? (showcontrolcenter ? 'bg-[--bg-glass-hover]' : 'hover:bg-[--bg-glass-hover]') : (showcontrolcenter ? 'bg-pastel-lavender/20' : 'hover:bg-pastel-lavender/10')}`}
                            onClick={() => setshowcontrolcenter(!showcontrolcenter)}
                        >
                            <div className={`px-1 py-[2px] ${showcontrolcenter ? (clay ? 'bg-[--bg-glass-hover]' : 'bg-pastel-lavender/15') : ''}`}>
                                <svg className="w-4 h-4 text-[--text-color]" color="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" id="control-centre">
                                    <path d="M7.5 13h14a5.5 5.5 0 0 0 0-11h-14a5.5 5.5 0 0 0 0 11Zm0-9h14a3.5 3.5 0 0 1 0 7h-14a3.5 3.5 0 0 1 0-7Zm0 6A2.5 2.5 0 1 0 5 7.5 2.5 2.5 0 0 0 7.5 10Zm14 6h-14a5.5 5.5 0 0 0 0 11h14a5.5 5.5 0 0 0 0-11Zm1.434 8a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" fill="currentColor"></path>
                                </svg>
                            </div>
                        </div>
                        {showcontrolcenter && (
                            <>
                                <div className="fixed inset-0 z-[499]" onClick={() => setshowcontrolcenter(false)} />
                                <div className="absolute top-10 right-0 z-[500]">
                                    <Control isopen={showcontrolcenter} onclose={() => setshowcontrolcenter(false)} ismobile={false} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className='flex flex-row items-center content-center space-x-2 text-[14px] font-semibold text-[--text-color] cursor-pointer hover:opacity-70 transition-opacity font-mono' onClick={ontogglecalendar}>
                        <h1>{currentdate}</h1>
                        <h1>{currenttime}</h1>
                    </div>
                    <button
                        onClick={ontogglenotifications}
                        className="relative p-1 cursor-pointer hover:opacity-70 transition-opacity"
                    >
                        <IoNotificationsOutline size={17} className="text-[--text-color]" />
                        {unreadcount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold text-white bg-red-500 px-0.5">
                                {unreadcount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
