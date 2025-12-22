'use client'

import React, { useState, useEffect } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { apps, mainmenu, openSystemItem } from './data';
import Control from './controlcenter';
import Logo from './mainlogo';
import { useAppMenus } from './AppMenuContext';

import { IoWifi, IoBatteryFull, IoToggle, IoSettingsOutline } from 'react-icons/io5';
import { BsToggles2 } from "react-icons/bs";
import { useDevice } from './DeviceContext';
import { IoIosBatteryFull, IoIosSettings, IoIosWifi } from 'react-icons/io';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export default function Panel({ ontogglenotifications }: { ontogglenotifications?: () => void }) {
    const { activewindow, windows, updatewindow, removewindow, setactivewindow, addwindow } = useWindows();
    const { ismobile } = useDevice();
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
        { title: "NextarOS Help", disabled: false },
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
        { title: `About Nextar`, actionId: 'about' },
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

    const handledynamicmainmenu = (item: any) => {
        if (!item || item.disabled) return;
        const action = item.actionId || item.title;
        switch (action) {
            case 'about':
                window.dispatchEvent(new CustomEvent('show-about-mac'));
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
                setosstate('locked');
                break;
            case 'logout':
                logout();
                break;
            case 'restart':
            case 'shutdown':
                setosstate('booting');
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
                style={{ zIndex: 99999 }}
                data-tour="menubar"
                className="fixed h-[35px] z-[99999] before:absolute before:inset-0 before:bg-transparent before:content-[''] before:backdrop-blur-[250px] before:webkit-backdrop-blur-[250px] before:z-[-1] top-0 w-screen py-[6px] flex px-4 justify-between items-center content-center bg-white bg-opacity-30 dark:bg-black dark:bg-opacity-10 transition-colors duration-500"
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
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-next'))}
                            className=" rounded hover:bg-white/10 transition-colors"
                            title="Next (⌘K)"
                        >
                            <svg className="w-4 h-4 dark:text-white text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <IoIosWifi className="text-black dark:text-white w-[20px] h-[20px]" />
                        <div className='flex items-center space-x-2'>
                            <IoIosBatteryFull className="text-black dark:text-white w-[24px] h-[24px]" />
                        </div>
                    </div>
                    <div className="relative">
                        <div
                            className={`p-1 rounded flex flex-row items-center content-center space-x-2 cursor-pointer transition-all duration-200 active:opacity-50 ${showcontrolcenter ? 'bg-white/20 dark:bg-white/10' : 'hover:bg-white/10'}`}
                            onClick={() => setshowcontrolcenter(!showcontrolcenter)}
                        >
                            <div className={`px-1 rounded-md py-[2px] ${showcontrolcenter ? 'bg-white/20' : ''}`}>
                                <svg className="w-4 h-4 dark:text-white text-black" color="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" id="control-centre">
                                    <path d="M7.5 13h14a5.5 5.5 0 0 0 0-11h-14a5.5 5.5 0 0 0 0 11Zm0-9h14a3.5 3.5 0 0 1 0 7h-14a3.5 3.5 0 0 1 0-7Zm0 6A2.5 2.5 0 1 0 5 7.5 2.5 2.5 0 0 0 7.5 10Zm14 6h-14a5.5 5.5 0 0 0 0 11h14a5.5 5.5 0 0 0 0-11Zm1.434 8a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5Z" fill="currentColor"></path>
                                </svg>
                            </div>
                        </div>


                        {showcontrolcenter && (
                            <>
                                <div className="fixed inset-0 z-[9998]" onClick={() => setshowcontrolcenter(false)} />
                                <div className="absolute top-8 right-0 z-[9999]">
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
                        className='flex flex-row items-center content-center space-x-2 text-[14px] font-sf font-semibold dark:text-white text-black cursor-pointer hover:opacity-70 transition-opacity'
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
