'use client'

import React, { useState, useEffect } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { menus, titleMenu, appleMenu } from './menus';
import Control from './controlcenter';
import Logo from './applelogo';
import { useDevice } from './DeviceContext';

export default function Panel({ ontogglenotifications }: { ontogglenotifications?: () => void }) {
    const { activewindow, windows } = useWindows();
    const { setosstate } = useDevice();

    const activeappname =
        windows.find((window: any) => window.id === activewindow)?.appName || 'Finder';
    let apptitlemenu: any = titleMenu.find((menu) => menu.title === activeappname);
    let appmenus: any = menus.find((app) => app.appName === activeappname)?.menus;
    const [activemenu, setactivemenu] = useState<string | null>(null);
    const [hoverenabled, sethoverenabled] = useState(false);
    const [currentdate, setcurrentdate] = useState<string>('');
    const [currenttime, setcurrenttime] = useState<string>('');

    useEffect(() => {
        if (activemenu !== null) {
            document.addEventListener('mousedown', handleclickoutside);
        } else {
            document.removeEventListener('mousedown', handleclickoutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleclickoutside);
        };
    }, [activemenu]);

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

    if (!apptitlemenu) {
        const menuslist = [
            {
                title: activeappname,
                menu: [
                    { title: "About " + activeappname, disabled: false },

                    { title: "Quit " + activeappname, disabled: false },
                ]
            },
        ]
        apptitlemenu = menuslist[0];
    }

    if (!appmenus) {
        const menuslist = [
            {
                appName: activeappname,
                menus: {

                    Window: [
                        { title: "Minimize", disabled: false },
                        { title: "Zoom", disabled: true },
                        { separator: true },
                        { title: "Bring All to Front", disabled: true }
                    ],
                    Help: [
                        { title: "macOS Help", disabled: false },
                        { title: "About " + activeappname, disabled: false }
                    ]
                }
            },

        ];
        appmenus = menuslist[0]?.menus;
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

    const handleclickoutside = () => {
        setactivemenu(null);
        sethoverenabled(false);
    };

    const handleapplemenuaction = (action: string) => {
        switch (action) {
            case 'Sleep':
            case 'Lock Screen':
                setosstate('locked');
                break;
            case 'Restart...':
            case 'Shut Down...':
            case 'Log Out User...':
                setosstate('booting');
                break;
            default:
                break;
        }
    };

    return (
        <div>
            <div
                style={{ zIndex: 9999 }}
                className="relative h-full z-0 before:absolute before:inset-0 before:bg-transparent before:content-[''] before:backdrop-blur-[12px] before:webkit-backdrop-blur-[12px] before:z-[-1] top-0 w-screen py-[6px] flex px-4 justify-between items-center content-center bg-white bg-opacity-30 dark:bg-black dark:bg-opacity-10 transition-colors duration-500"
            >
                <div className="relative flex flex-row items-center content-center space-x-0">
                    <div className="flex items-center justify-center h-full mr-2">
                        <Menu
                            id="appleMenu"
                            title={<div className="flex items-center justify-center h-full"><Logo /></div>}
                            data={appleMenu}
                            visible={activemenu === 'appleMenu'}
                            onToggle={handletogglemenu}
                            onHover={handlehovermenu}
                            onAction={handleapplemenuaction}
                        />
                    </div>
                    {apptitlemenu && (
                        <Menu
                            id="titleMenu"
                            title={apptitlemenu.title}
                            data={apptitlemenu.menu}
                            visible={activemenu === 'titleMenu'}
                            onToggle={handletogglemenu}
                            bold={true}
                            onHover={handlehovermenu}
                        />
                    )}
                    <div className='hidden md:inline-flex'>
                        {Object.entries(appmenus).map(([menukey, menuitems]) => {
                            if (menukey === 'windowMenu' && activeappname !== 'Finder') return null;

                            return (
                                <Menu
                                    key={menukey}
                                    id={menukey}
                                    title={menukey.charAt(0).toUpperCase() + menukey.slice(1)}
                                    data={menuitems as any}
                                    visible={activemenu === menukey}
                                    onToggle={handletogglemenu}
                                    onHover={handlehovermenu}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className='flex space-x-4 flex-row items-center content-center'>
                    <Control />
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
