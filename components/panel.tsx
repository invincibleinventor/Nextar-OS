/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { menus, titleMenu } from './menus'; 
import Control from './controlcenter';
import Logo from './applelogo';

export default function Panel() {
    const { activeWindow, windows } = useWindows();

    const activeAppName =
        windows.find((window: any) => window.id === activeWindow)?.appName || 'Finder';
    let appTitleMenu:any = titleMenu.find((menu) => menu.title === activeAppName);
    let appMenus:any = menus.find((app) => app.appName === activeAppName)?.menus;
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [hoverEnabled, setHoverEnabled] = useState(false);
    const [currentDate, setCurrentDate] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        if (activeMenu !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);

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
            setCurrentDate(`${date.replace(',','').replace(',','')}`);
            setCurrentTime(`${time.toUpperCase()}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!appTitleMenu) {
        const menus = [
            {
                title: activeAppName,
                menu: [
                    { title: "About " + activeAppName, disabled: false },

                    { title: "Quit " + activeAppName, disabled: false },
                ]
            },
        ]
        appTitleMenu = menus[0];
    }

    if (!appMenus) {
        const menus = [
            {
                appName: activeAppName,
                menus: {

                    Window: [
                        { title: "Minimize", disabled: false },
                        { title: "Zoom", disabled: true },
                        { separator: true },
                        { title: "Bring All to Front", disabled: true }
                    ],
                    Help: [
                        { title: "macOS Help", disabled: false },
                        { title: "About " + activeAppName, disabled: false }
                    ]
                }
            },

        ];
        appMenus = menus[0]?.menus;
    }

    const handleToggleMenu = (id: string | null) => {
        setActiveMenu(id);
        setHoverEnabled(id !== null);
    };

    const handleHoverMenu = (id: string) => {
        if (hoverEnabled) {
            setActiveMenu(id);
        }
    };

    const handleClickOutside = () => {
        setActiveMenu(null);
        setHoverEnabled(false);
    };

    return (
        <div>
        <div
            style={{zIndex:10}}
            className="relative h-full z-0 before:absolute before:inset-0 before:bg-transparent before:content-[''] before:backdrop-blur-[12px] before:webkit-backdrop-blur-[12px] before:z-[-1] top-0 w-screen py-1 flex px-4 justify-between items-center content-center bg-white dark:bg-black dark:bg-opacity-20 bg-opacity-20"
        >
            <div className="relative flex flex-row items-center content-center space-x-0">
                <Logo></Logo>
                {appTitleMenu && (
                    <Menu
                        id="titleMenu"
                        title={appTitleMenu.title}
                        data={appTitleMenu.menu}
                        visible={activeMenu === 'titleMenu'}
                        onToggle={handleToggleMenu}
                        bold={true}
                        onHover={handleHoverMenu}
                    />
                )}
                <div className='hidden md:inline-flex'>
                    {Object.entries(appMenus).map(([menuKey, menuItems]) => {
                        // Skip "windowMenu" if it's not needed for this app
                        if (menuKey === 'windowMenu' && activeAppName !== 'Finder') return null;

                        return (
                            <Menu
                                key={menuKey}
                                id={menuKey}
                                title={menuKey.charAt(0).toUpperCase() + menuKey.slice(1)}
                                data={menuItems}
                                visible={activeMenu === menuKey}
                                onToggle={handleToggleMenu}
                                onHover={handleHoverMenu}
                            />
                        );
                    })}
                </div>
            </div>
            <div className='flex space-x-4 flex-row items-center content-center'>
                <Control/>
                <div className='flex flex-row items-center content-center space-x-2 text-[12.5px] font-sf font-semibold dark:text-white text-black'>
                <h1 className=''>{currentDate}</h1>
                <h1 className=''>{currentTime}</h1>
                </div>
            </div>
            
        </div>

                    </div>
    );
}
