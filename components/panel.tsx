'use client'

import React, { useState, useEffect } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { apps, mainmenu, openSystemItem } from './data';
import Control from './controlcenter';
import Logo from './mainlogo';
import { useAppMenus } from './AppMenuContext';

import { IoWifi, IoBatteryFull, IoToggle, IoSettingsOutline, IoSparkles } from 'react-icons/io5';
import { BsToggles2 } from "react-icons/bs";
import { useDevice } from './DeviceContext';
import { IoIosBatteryFull } from 'react-icons/io';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { iselectron, power, battery, wifi } from '@/utils/platform';

export default function Panel({ ontogglenotifications }: { ontogglenotifications?: () => void }) {
    const { activewindow, windows, updatewindow, removewindow, setactivewindow, addwindow } = useWindows();
    const { ismobile, setappmode } = useDevice();
    const { setosstate } = useDevice();

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
    const [currentdate, setcurrentdate] = useState<string>('');
    const [currenttime, setcurrenttime] = useState<string>('');
    const [showcontrolcenter, setshowcontrolcenter] = useState(false);
    const [batterystatus, setbatterystatus] = useState({ percentage: 100, charging: false, available: false });
    const [wifistatus, setwifistatus] = useState({ connected: false, ssid: null as string | null, available: false });

    useEffect(() => {
        if (!iselectron) return;
        const fetchstatus = async () => {
            try {
                const batresult = await battery.getstatus();
                if (batresult.percentage !== undefined) {
                    setbatterystatus({ percentage: batresult.percentage, charging: batresult.charging || false, available: true });
                }
                const wifiresult = await wifi.getstatus();
                if (wifiresult.connected !== undefined) {
                    setwifistatus({ connected: wifiresult.connected, ssid: wifiresult.ssid, available: true });
                }
            } catch { }
        };
        fetchstatus();
        const interval = setInterval(fetchstatus, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const date = now.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
            const time = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
            setcurrentdate(`${date.replace(',', '').replace(',', '')}`);
            setcurrenttime(`${time.toUpperCase()}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const defaultWindowMenu = [
        { title: "Minimize", actionId: "minimize", disabled: false },
        { title: "Zoom", actionId: "zoom", disabled: false },
        { separator: true },
        { title: "Bring All to Front", disabled: false }
    ];

    const defaultHelpMenu = [
        { title: "HackathOS Help", disabled: false },
        { title: "About " + activeappname, disabled: false }
    ];

    if (!appmenus) {
        appmenus = {
            Window: defaultWindowMenu,
            Help: defaultHelpMenu
        };
    } else {
        if (!appmenus.Window) appmenus.Window = defaultWindowMenu;
        if (!appmenus.Help) appmenus.Help = defaultHelpMenu;
    }

    const handletogglemenu = (id: string | null) => {
        setactivemenu(id);
        sethoverenabled(id !== null);
    };

    const handlehovermenu = (id: string) => {
        if (hoverenabled) {
            setactivemenu(id);
        }
    };

    const { user, logout, isGuest } = useAuth();
    const { addToast } = useNotifications();

    const hasShownGuestToast = React.useRef(false);

    useEffect(() => {
        if (isGuest && !hasShownGuestToast.current) {
            addToast("Guest Mode Enabled. No data will be preserved.", "info");
            hasShownGuestToast.current = true;
        }
        if (!isGuest) {
            hasShownGuestToast.current = false;
        }
    }, [isGuest, addToast]);

    const dynamicmainmenu = [
        { title: `About HackathOS`, actionId: 'about' },
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
            case 'about':
                addwindow({
                    id: `abouthackathos-${Date.now()}`,
                    appname: 'About HackathOS',
                    component: 'apps/AboutNextarOS',
                    props: {},
                    isminimized: false,
                    ismaximized: false
                });
                break;
            case 'forcequit':
                window.dispatchEvent(new CustomEvent('show-force-quit'));
                break;
            case 'settings':
                addwindow({
                    id: `settings-${Date.now()}`,
                    appname: 'Settings',
                    component: 'apps/Settings',
                    props: {},
                    isminimized: false,
                    ismaximized: false
                });
                break;
            case 'appstore':
                addwindow({
                    id: `appstore-${Date.now()}`,
                    appname: 'App Store',
                    component: 'apps/AppStore',
                    props: {},
                    isminimized: false,
                    ismaximized: false
                });
                break;
            case 'sleep':
                if (iselectron) {
                    await power.sleep();
                } else {
                    setosstate('locked');
                }
                break;
            case 'logout':
                if (iselectron) {
                    await power.logout();
                }
                logout();
                break;
            case 'restart':
                if (iselectron) {
                    await power.restart();
                } else {
                    setosstate('booting');
                }
                break;
            case 'shutdown':
                if (iselectron) {
                    await power.shutdown();
                } else {
                    setosstate('booting');
                }
                break;
            default:
                break;
        }
    };

    const handleMenuAction = (item: any) => {
        if (!item || item.disabled) return;

        const actionId = item.actionId || item.title;

        if (actionId === 'minimize') {
            if (activewindow) {
                updatewindow(activewindow, { isminimized: true });
                setactivewindow(null);
            }
        } else if (actionId === 'zoom') {
            if (activewindow) {
                const win = windows.find((w: any) => w.id === activewindow);
                if (win) {
                    updatewindow(activewindow, { ismaximized: !win.ismaximized });
                }
            }
        } else if (actionId.startsWith('Quit ') || actionId === 'close-window') {
            if (activewindow) {
                removewindow(activewindow);
            }
        } else if (actionId === 'new-window') {
            const explorerApp = apps.find(a => a.id === 'explorer');
            if (explorerApp) {
                addwindow({
                    id: `explorer-${Date.now()}`,
                    appname: explorerApp.appname,
                    component: explorerApp.componentname,
                    props: {},
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 80, left: 80 },
                    size: explorerApp.defaultsize || { width: 900, height: 600 }
                });
            }
        } else if (actionId.startsWith('About ')) {
            const app = apps.find(a => a.appname === activeappname);
            if (app) {
                const appItem: any = {
                    id: app.id,
                    name: app.appname,
                    mimetype: 'application/x-executable',
                    isSystem: true,
                    date: 'Today',
                    size: 'Application',
                    icon: app.icon
                };
                openSystemItem(appItem, { addwindow, windows, updatewindow, setactivewindow, ismobile }, 'getinfo');
            }
        } else {
            triggerAction(actionId);
        }

        const event = new CustomEvent('menu-action', {
            detail: {
                appId: activeapp?.id || 'explorer',
                actionId: actionId,
                title: item.title
            }
        });
        window.dispatchEvent(event);
        setactivemenu(null);
        sethoverenabled(false);
    };

    return (
        <div>
            <div
                data-tour="menubar"
                className="fixed h-[35px] z-[300] top-0 w-screen py-[6px] flex px-4 justify-between items-center content-center bg-[--bg-surface] border-b border-[--border-color] anime-gradient-top"
            >
                <div className="relative flex flex-row items-center content-center space-x-0">
                    <div className="flex items-center justify-center h-full mr-2" data-tour="dynamic-main-menu">
                        <Menu
                            id="dynamicMainMenu"
                            title={<div className="flex items-center justify-center h-full"><Logo /></div>}
                            data={dynamicmainmenu}
                            visible={activemenu === 'dynamicMainMenu'}
                            ontoggle={handletogglemenu}
                            onhover={handlehovermenu}
                            onaction={handledynamicmainmenu}
                        />
                    </div>
                    <Menu
                        id="titleMenu"
                        title={activeappname}
                        data={apptitlemenu}
                        visible={activemenu === 'titleMenu'}
                        ontoggle={handletogglemenu}
                        bold={true}
                        onhover={handlehovermenu}
                        onaction={handleMenuAction}
                    />
                    <div className='hidden md:inline-flex'>
                        {Object.entries(appmenus).map(([menukey, menuitems]) => {
                            if (menukey === 'windowMenu' && activeappname !== 'Explorer') return null;

                            return (
                                <Menu
                                    key={menukey}
                                    id={menukey}
                                    title={menukey.charAt(0).toUpperCase() + menukey.slice(1)}
                                    data={menuitems as any}
                                    visible={activemenu === menukey}
                                    ontoggle={handletogglemenu}
                                    onhover={handlehovermenu}
                                    onaction={handleMenuAction}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className='flex space-x-3 flex-row items-center content-center'>
                    <div className='hidden md:flex flex-row space-x-4 items-center pl-2'>
                        {!iselectron && (
                            <button
                                onClick={() => setappmode('portfolio')}
                                className="px-2 py-1 text-xs font-medium bg-pastel-red/15 hover:bg-pastel-red/25 text-pastel-red border border-pastel-red/30 transition-colors"
                            >
                                Exit HackathOS
                            </button>
                        )}
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-desktop-effects'))}
                            className="hover:bg-pastel-lavender/10 transition-colors p-0.5"
                            title="Toggle Desktop Effects"
                        >
                            <IoSparkles className="w-4 h-4 text-pastel-pink" />
                        </button>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-next'))}
                            className="hover:bg-pastel-lavender/10 transition-colors"
                            title="Next (⌘K)"
                        >
                            <svg className="w-4 h-4 text-[--text-color]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <IoWifi className={`w-[18px] h-[18px] ${wifistatus.connected ? 'text-pastel-blue' : 'text-pastel-lavender'}`} />
                        <div className='flex items-center space-x-1'>
                            {batterystatus.available && (
                                <span className="text-[11px] font-medium text-[--text-color]">{batterystatus.percentage}%</span>
                            )}
                            <IoIosBatteryFull className={`w-[24px] h-[24px] ${batterystatus.charging ? 'text-pastel-green' : 'text-pastel-yellow'}`} />
                        </div>
                    </div>
                    <div className="relative">
                        <div
                            className={`p-1 flex flex-row items-center content-center space-x-2 cursor-pointer transition-all duration-200 active:opacity-50 ${showcontrolcenter ? 'bg-pastel-lavender/20' : 'hover:bg-pastel-lavender/10'}`}
                            onClick={() => setshowcontrolcenter(!showcontrolcenter)}
                        >
                            <div className={`px-1 py-[2px] ${showcontrolcenter ? 'bg-pastel-lavender/15' : ''}`}>
                                <svg className="w-4 h-4 text-[--text-color]" color="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" id="control-centre">
                                    <path d="M7.5 13h14a5.5 5.5 0 0 0 0-11h-14a5.5 5.5 0 0 0 0 11Zm0-9h14a3.5 3.5 0 0 1 0 7h-14a3.5 3.5 0 0 1 0-7Zm0 6A2.5 2.5 0 1 0 5 7.5 2.5 2.5 0 0 0 7.5 10Zm14 6h-14a5.5 5.5 0 0 0 0 11h14a5.5 5.5 0 0 0 0-11Zm1.434 8a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" fill="currentColor"></path>
                                </svg>
                            </div>
                        </div>


                        {showcontrolcenter && (
                            <>
                                <div className="fixed inset-0 z-[499]" onClick={() => setshowcontrolcenter(false)} />
                                <div className="absolute top-8 right-0 z-[500]">
                                    <Control
                                        isopen={showcontrolcenter}
                                        onclose={() => setshowcontrolcenter(false)}
                                        ismobile={false}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div
                        className='flex flex-row items-center content-center space-x-2 text-[14px] font-mono font-semibold text-[--text-color] cursor-pointer hover:opacity-70 transition-opacity'
                        onClick={ontogglenotifications}
                    >
                        <h1 className=''>{currentdate}</h1>
                        <h1 className=''>{currenttime}</h1>
                    </div>
                </div>

            </div>

        </div>
    );
}
