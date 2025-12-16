'use client';
import React, { useState } from 'react';
import { apps } from './app';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AppLibrary from './AppLibrary';
import { useWindows } from './WindowContext';

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { reducemotion } = useSettings();
    const [page, setpage] = useState(0);

    const handleappclick = (app: any) => {
        windows.forEach((w: any) => {
            if (!w.isminimized) {
                updatewindow(w.id, { isminimized: true });
            }
        });

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

    const allapps = apps.filter(a => a.id !== 'launchpad' && a.id !== 'settings');
    const gridapps = allapps.slice(0, 8);
    const dockapps = apps.filter(a =>
        a.id === 'finder' || a.id === 'safari' || a.id === 'mail' || a.id === 'settings'
    ).slice(0, 4);

    const [width, setwidth] = useState(0);

    React.useEffect(() => {
        setwidth(window.innerWidth);
        const handleResize = () => setwidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent">
            <motion.div
                className="flex w-[200vw] h-full"
                style={{ willChange: 'transform', touchAction: 'pan-y' }}
                animate={{ x: `-${page * 100}vw` }}
                initial={{ x: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
                drag="x"
                dragConstraints={{ left: -width, right: 0 }}
                dragElastic={0.2}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                    const swipeThreshold = 50;
                    const velocityThreshold = 500;

                    if (Math.abs(info.offset.y) > 40) return;

                    if (page === 0) {
                        if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                            setpage(1);
                        }
                    } else if (page === 1) {
                        if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                            setpage(0);
                        }
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

                    <div className={`mx-auto mb-7 p-3 rounded-[25px] w-max flex items-center justify-between gap-4 transition-all duration-300 ${isoverlayopen ? 'bg-transparent' : 'dark:bg-black/10 bg-white/10 backdrop-blur-sm shadow-lg border border-white/10'}`}>
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
