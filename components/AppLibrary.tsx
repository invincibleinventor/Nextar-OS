'use client';
import React from 'react';
import Image from 'next/image';
import { apps } from './data';
import { useWindows } from './WindowContext';

import { IoSearch } from 'react-icons/io5';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const categories: { [key: string]: string[] } = {
        "Social": ["Mail"],
        "Productivity": ["Safari", "Calendar", "Notes", "Reminders"],
        "Utilities": ["Finder", "Settings", "Calculator", "Welcome"],
        "Creativity": ["Python IDE", "Photos", "App Store"],
    };

    const getcategoryapps = (catapps: string[]) => {
        return apps.filter(app => catapps.includes(app.appname));
    };

    const openapp = (app: any) => {
        const existingwin = windows.find((win: any) => win.appname === app.appname);
        if (existingwin) {
            updatewindow(existingwin.id, { isminimized: false });
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
            isminimized: false,
            ismaximized: true,
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
            style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="relative w-full text-center mb-6">
                <div className="relative w-full mx-auto bg-neutral-200/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-xl h-10 flex items-center px-3">
                    <IoSearch className="text-neutral-800 dark:text-neutral-300" size={20} />
                    <span className="ml-2 text-neutral-800 dark:text-neutral-300 text-lg">App Library</span>
                </div>
            </div>

            <div className="grid grid-cols-2 3xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 w-full mx-auto pb-10">
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
                        <span className="text-center mt-1 text-neutral-200 text-[13px] font-semibold leading-none px-1 truncate">
                            {category}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppLibrary;
