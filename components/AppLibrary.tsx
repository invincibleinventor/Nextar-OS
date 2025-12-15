'use client';
import React from 'react';
import Image from 'next/image';
import { apps } from './app';
import { usewindows } from './WindowContext';

import { IoSearch } from 'react-icons/io5';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = usewindows();
    const categories: { [key: string]: string[] } = {
        "Social & Communication": ["Mail"],
        "Productivity": ["Safari", "Calendar", "Notes", "Reminders"],
        "Utilities": ["Finder", "Settings", "Calculator", "Welcome"],
        "Creativity & Dev": ["Python IDE", "Photos", "App Store"],
    };

    const getcategoryapps = (catapps: string[]) => {
        return apps.filter(app => catapps.includes(app.appname));
    };

    const openapp = (app: any) => {
        const existingwin = windows.find((win: any) => win.appname === app.appname);
        if (existingwin) {
            updatewindow(existingwin.id, { isMinimized: false });
            setactivewindow(existingwin.id);
            return;
        }

        const newwin = {
            id: `${app.appname}-${Date.now()}`,
            appname: app.appname,
            additionaldata: {},
            title: app.appname,
            component: app.componentname,
            props: {},
            isMinimized: false,
            isMaximized: true,
            position: { top: 0, left: 0 },
            size: { width: window.innerWidth, height: window.innerHeight },
        };
        addwindow(newwin);
        setactivewindow(newwin.id);
    };

    const startpos = React.useRef({ x: 0, y: 0 });
    const isdragging = React.useRef(false);

    const handlepointerdown = (e: React.PointerEvent) => {
        startpos.current = { x: e.clientX, y: e.clientY };
        isdragging.current = false;
    };

    const handlepointerup = (e: React.PointerEvent, app: any) => {
        const dx = Math.abs(e.clientX - startpos.current.x);
        const dy = Math.abs(e.clientY - startpos.current.y);

        if (dx < 10 && dy < 10) {
            openapp(app);
        }
    };

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-14 px-5 pb-32 scrollbar-hide select-none [&::-webkit-scrollbar]:hidden"
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="relative w-full text-center mb-6">
                <div className="relative w-full mx-auto bg-neutral-200/50 dark:bg-neutral-800/50 backdrop-blur-xl rounded-2xl h-10 flex items-center px-3">
                    <IoSearch className="text-neutral-500" size={20} />
                    <span className="ml-2 text-neutral-500 text-lg">App Library</span>
                </div>
            </div>

            <div className="grid grid-cols-2 2xs:grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 w-full mx-auto pb-10">
                {Object.keys(categories).map((category) => (
                    <div key={category} className="flex flex-col gap-2 relative">
                        <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-3xl p-4 w-auto aspect-square shrink-0 h-auto" style={{ aspectRatio: '1/1' }}>
                            <div className="grid grid-cols-2 grid-rows-2 gap-3 w-auto h-auto">
                                {getcategoryapps(categories[category]).map((app: any) => (
                                    <div
                                        key={app.appname}
                                        onClick={() => openapp(app)}
                                        className="relative w-full h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                                    >
                                        <Image
                                            src={app.icon}
                                            alt={app.appname}

                                            className="object-cover rounded-xl"
                                            width={100}
                                            height={100}
                                            draggable={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <span className="text-center text-neutral-200 text-[13px] font-semibold leading-none px-1 truncate">
                            {category}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppLibrary;
