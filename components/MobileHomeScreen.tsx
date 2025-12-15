'use client';
import React, { useState } from 'react';
import { apps } from './app';
import { usetheme } from './ThemeContext';
import { usesettings } from './SettingsContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AppLibrary from './AppLibrary';
import { usewindows } from './WindowContext';

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = usewindows();
    const { reducemotion } = usesettings();
    const [page, setpage] = useState(0);

    const handleappclick = (app: any) => {
        windows.forEach((w: any) => {
            if (!w.isMinimized) {
                updatewindow(w.id, { isMinimized: true });
            }
        });

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

    const allapps = apps.filter(a => a.id !== 'launchpad' && a.id !== 'settings');
    const gridapps = allapps.slice(0, 8);
    const dockapps = apps.filter(a =>
        a.id === 'finder' || a.id === 'safari' || a.id === 'mail' || a.id === 'settings'
    ).slice(0, 4);

    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent">
            <motion.div
                className="flex w-[200vw] h-full"
                style={{ willChange: 'transform', touchAction: 'pan-y' }}
                animate={{ x: `-${page * 100}vw` }}
                initial={{ x: 0 }}
                transition={{
                    type: reducemotion ? "tween" : "spring",
                    stiffness: reducemotion ? undefined : 350,
                    damping: reducemotion ? undefined : 30,
                    mass: 1,
                    duration: reducemotion ? 0.2 : undefined
                }}
                drag="x"
                dragConstraints={{ left: -window.innerWidth, right: 0 }}
                dragElastic={0.15}
                dragMomentum={true}
                dragDirectionLock={false}
                onDragEnd={(_, info) => {

                    if (Math.abs(info.offset.y) > 40) return;


                    if ((info.offset.x < -30 || (info.offset.x < -10 && info.velocity.x < -50)) && page === 0) {
                        setpage(1);
                    }

                    else if ((info.offset.x > 30 || (info.offset.x > 10 && info.velocity.x > 50)) && page === 1) {
                        setpage(0);
                    }
                }}
            >
                <div className="w-[100vw] h-full flex flex-col pt-14 relative">
                    <div className="flex-1 px-4">
                        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                            {gridapps.map(app => (
                                <motion.button
                                    key={app.id}
                                    className="flex flex-col items-center gap-1"
                                    onClick={() => handleappclick(app)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden dark:bg-black/10 bg-white/10 shadow-sm ring-1 ring-white/5 relative">
                                        <Image
                                            src={app.icon}
                                            alt={app.appname}
                                            fill
                                            sizes="60px"
                                            className="object-cover"
                                            draggable={false}
                                        />
                                    </div>
                                    <span className="text-[11px] font-medium text-white/90 text-center leading-tight drop-shadow-md truncate w-full tracking-tight">
                                        {app.appname}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className={`mx-auto mb-6 p-3 rounded-[25px] w-max flex items-center justify-between gap-4 transition-all duration-300 ${isoverlayopen ? 'bg-transparent' : 'dark:bg-black/20 bg-white/20 backdrop-blur-md shadow-lg border border-white/10'}`}>
                        {dockapps.map(app => (
                            <motion.button
                                key={app.id}
                                onClick={() => handleappclick(app)}
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

                <div className="w-[100vw] h-full pt-0">
                    <AppLibrary />
                </div>
            </motion.div>

            <div className={`absolute bottom-[140px] left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none transition-opacity duration-300 ${isoverlayopen ? 'opacity-0' : 'opacity-100'}`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 0 ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 1 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
        </div>
    );
}
