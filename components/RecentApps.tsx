'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useWindows } from './WindowContext';
import { apps } from './app';


const MemoizedDynamicComponent = memo(
    ({ icon, component, appprops }: { icon: string, component: string; appname?: string, appprops: any }) => {
        const [dynamiccomponent, setdynamiccomponent] = useState<any>(null);

        useEffect(() => {
            const loadcomponent = async () => {
                try {

                    const importedmodule = await import(`./${component}`);
                    setdynamiccomponent(() => importedmodule.default || null);
                } catch {
                    try {

                        const importedmodule = await import(`../components/${component}`);
                        setdynamiccomponent(() => importedmodule.default || null);
                    } catch {
                        setdynamiccomponent(null);
                    }
                }
            };
            loadcomponent();
        }, [component]);

        if (!dynamiccomponent) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-white/50 dark:bg-neutral-800/50">
                    {icon ? <Image src={icon} width={64} height={64} className="w-16 h-16 opacity-50 grayscale" alt="App Icon" /> : <div className="text-xs opacity-50">Loading...</div>}
                </div>
            );
        }

        const Component = dynamiccomponent;

        return (
            <div className="w-full h-full pointer-events-none select-none overflow-hidden relative">
                <div className="absolute inset-0 z-10" />
                <Component {...appprops} isFocused={false} />
            </div>
        );
    }
);
MemoizedDynamicComponent.displayName = 'MemoizedDynamicComponent';

const RecentApps = React.memo(({ isopen, onclose }: { isopen: boolean, onclose: () => void }) => {
    const { windows, removewindow, setactivewindow, updatewindow } = useWindows();
    const containerref = useRef<HTMLDivElement>(null);
    const ignoreclickref = useRef(false);

    useEffect(() => {
        if (isopen) {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            if (containerref.current) {
                setTimeout(() => {
                    if (containerref.current) {
                        containerref.current.scrollLeft = 0;
                    }
                }, 10);
            }
        }
    }, [isopen]);


    return (
        <AnimatePresence>
            {isopen && (
                <motion.div
                    className="fixed inset-0 z-[9990] flex flex-col pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute backdrop-blur-sm inset-0 bg-[url('/bg.jpg')] dark:bg-[url('/bg-dark.jpg')] bg-cover bg-no-repeat"
                        onClick={onclose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {windows.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className="text-white/40 text-lg font-medium tracking-wide">No Recent Apps</div>
                        </div>
                    )}

                    <motion.div
                        ref={containerref}
                        layoutScroll
                        className="relative w-full h-full flex items-center overflow-x-auto scrollbar-hide px-[10vw] py-8 z-[9991]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => { if (!ignoreclickref.current && e.target === e.currentTarget) onclose(); }}
                        style={{ willChange: 'opacity' }}
                    >
                        <div className="flex flex-row gap-6 md:gap-10 h-[65vh] items-center">
                            <AnimatePresence mode='popLayout'>
                                {[...windows].sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0)).map((win: any) => {
                                    const appdata = apps.find(a => a.appname === win.appname);
                                    const icon = appdata?.icon || '';

                                    return (
                                        <AppCard
                                            key={win.id}
                                            win={win}
                                            icon={icon}
                                            onclose={onclose}
                                            onkill={() => {
                                                ignoreclickref.current = true;
                                                setTimeout(() => ignoreclickref.current = false, 500);
                                                removewindow(win.id);
                                            }}
                                            onopen={() => {
                                                updatewindow(win.id, { isminimized: false });
                                                setactivewindow(win.id);
                                                onclose();
                                            }}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});


const AppCard = ({ win, icon, onkill, onopen }: any) => {
    const isdragging = useRef(false);

    return (
        <motion.div
            layout="position"
            className="relative flex-shrink-0 w-[75vw] md:w-[45vw] lg:w-[350px] h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
                opacity: 0,
                scale: 0.9,
                y: -50,
                transition: { duration: 0.2 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragDirectionLock={true}
            onDragStart={() => { isdragging.current = true; }}
            onDragEnd={(_, info) => {
                setTimeout(() => { isdragging.current = false; }, 100);

                const swipedistance = info.offset.y;
                const swipevelocity = info.velocity.y;


                if (swipedistance < -150 || swipevelocity < -600) {
                    onkill();
                } else if (swipedistance > 150 || swipevelocity > 600) {
                    onopen();
                }
            }}
            onClick={(e) => {
                if (isdragging.current) return;
                e.stopPropagation();
                onopen();
            }}
            style={{ touchAction: 'pan-x', willChange: 'transform' }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
            }}
        >
            <div className="flex items-center gap-2 mb-3 px-1 pointer-events-none">
                {icon && <Image src={icon} width={32} height={32} className="w-8 h-8 drop-shadow-md" alt={win.title} />}
                <span className="text-white font-semibold text-sm tracking-wide drop-shadow-md">{win.title}</span>
            </div>

            <div className="flex-1 w-full bg-white dark:bg-[#1c1c1e] rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-[24px] z-20" />

                <MemoizedDynamicComponent
                    icon={icon}
                    component={win.component}
                    appname={win.appname}
                    appprops={win.props}
                />
            </div>
        </motion.div>
    );
};

RecentApps.displayName = 'RecentApps';
export default RecentApps;
