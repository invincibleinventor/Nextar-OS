'use client'

import React, { useState, useEffect } from 'react';
import Menu from './menu';
import { useWindows } from './WindowContext';
import { menus, titlemenu, applemenu } from './data';
import Control from './controlcenter';
import Logo from './applelogo';

import { IoWifi, IoBatteryFull, IoToggle, IoSettingsOutline } from 'react-icons/io5';
import { BsToggles2 } from "react-icons/bs";
import { useDevice } from './DeviceContext';
import { IoIosBatteryFull, IoIosSettings, IoIosWifi } from 'react-icons/io';

export default function Panel({ ontogglenotifications }: { ontogglenotifications?: () => void }) {
    const { activewindow, windows } = useWindows();
    const { setosstate } = useDevice();

    const activeappname =
        windows.find((window: any) => window.id === activewindow)?.appname || 'Finder';
    let apptitlemenu: any = titlemenu.find((menu) => menu.title === activeappname);
    let appmenus: any = menus.find((app) => app.appname === activeappname)?.menus;
    const [activemenu, setactivemenu] = useState<string | null>(null);
    const [hoverenabled, sethoverenabled] = useState(false);
    const [currentdate, setcurrentdate] = useState<string>('');
    const [currenttime, setcurrenttime] = useState<string>('');
    const [showcontrolcenter, setshowcontrolcenter] = useState(false);

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
                appname: activeappname,
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
                            data={applemenu}
                            visible={activemenu === 'appleMenu'}
                            ontoggle={handletogglemenu}
                            onhover={handlehovermenu}
                            onaction={handleapplemenuaction}
                        />
                    </div>
                    {apptitlemenu && (
                        <Menu
                            id="titleMenu"
                            title={apptitlemenu.title}
                            data={apptitlemenu.menu}
                            visible={activemenu === 'titleMenu'}
                            ontoggle={handletogglemenu}
                            bold={true}
                            onhover={handlehovermenu}
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
                                    ontoggle={handletogglemenu}
                                    onhover={handlehovermenu}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className='flex space-x-6 flex-row items-center content-center'>
                    <div className='hidden md:flex flex-row space-x-7 items-center pl-2'>
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
