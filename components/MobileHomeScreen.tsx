'use client';
import React, { useState } from 'react';
import { useDevice } from './DeviceContext';
import { apps, filesystem, filesystemitem, openSystemItem, getFileIcon } from './data';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AppLibrary from './AppLibrary';
import { useWindows } from './WindowContext';

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { reducemotion } = useSettings();
    const { ismobile } = useDevice();
    const [page, setpage] = useState(0);

    const desktopItems = filesystem.filter(item => item.parent === 'root-desktop');

    const handleItemClick = (item: filesystemitem) => {
        openSystemItem(item, { addwindow, windows, setactivewindow, updatewindow, ismobile });
    };
const dockAppIds = ['finder', 'safari', 'mail', 'settings'];
   
    const isDockItem = (item: filesystemitem) => {
        if (item.mimetype !== 'application/x-executable') return false;
        const appId = item.id.replace('desktop-app-', '');
        return dockAppIds.includes(appId);
    };

    const gridItems = desktopItems.filter(item => !isDockItem(item));

    const dockapps = apps.filter(a =>
        a.id === 'finder' || a.id === 'safari' || a.id === 'mail' || a.id === 'settings'
    ).slice(0, 4);


    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent">
            <div
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.offsetWidth;
                    const newPage = Math.round(scrollLeft / width);
                    if (newPage !== page) {
                        setpage(newPage);
                    }
                }}
            >
                <div className="w-[100vw] h-full flex flex-col pt-14 relative snap-center flex-shrink-0">
                    <div className="flex-1 px-4">
                        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                            {gridItems.map(item => (
                                <motion.button
                                    key={item.id}
                                    className="flex flex-col items-center gap-1"
                                    onClick={() => handleItemClick(item)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden dark:bg-black/10 bg-white/10 shadow-sm ring-1 ring-white/5 relative">
                                        <div className="w-full my-auto h-full flex flex-col">
                                            {getFileIcon(item.mimetype, item.name, item.icon)}
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-white/90 text-center leading-tight drop-shadow-md truncate w-full tracking-tight">
                                        {item.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className={`mx-auto mb-7 p-3 rounded-[25px] w-max flex items-center justify-between gap-4 transition-all duration-300 ${isoverlayopen ? 'bg-transparent' : 'dark:bg-black/10 bg-white/10 backdrop-blur-sm shadow-lg border border-white/10'}`}>
                        {dockapps.map(app => (
                            <motion.button
                                key={app.id}
                                onClick={() => {
                                    openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
                                }}
                                whileTap={{ scale: 0.85 }}
                                className="w-[65px] h-[65px] aspect-square rounded-[18px] overflow-hidden relative"
                            >
                                <Image
                                    src={app.icon}
                                    alt={app.appname}
                                    fill
                                    sizes="65px"
                                    className="object-cover"
                                    draggable={false}
                                />
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="w-[100vw] h-full pt-0 snap-center flex-shrink-0">
                    <AppLibrary />
                </div>
            </div>

            <div className={`absolute bottom-[140px] left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none transition-opacity duration-300 ${isoverlayopen ? 'opacity-0' : 'opacity-100'}`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 0 ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 1 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
        </div>
    );
}
