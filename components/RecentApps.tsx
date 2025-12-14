'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usewindows } from './WindowContext';
import { apps } from './app';


const MemoizedDynamicComponent = memo(
    ({ icon, component, appProps }: { icon: string, component: string; appname?: string, appProps: any }) => {
        const [DynamicComponent, setDynamicComponent] = useState<any>(null);

        useEffect(() => {
            const loadcomponent = async () => {
                try {

                    const importedmodule = await import(`./${component}`);
                    setDynamicComponent(() => importedmodule.default || null);
                } catch {
                    try {

                        const importedmodule = await import(`../components/${component}`);
                        setDynamicComponent(() => importedmodule.default || null);
                    } catch {
                        setDynamicComponent(null);
                    }
                }
            };
            loadcomponent();
        }, [component]);

        if (!DynamicComponent) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-white/50 dark:bg-neutral-800/50">
                    {icon ? <img src={icon} className="w-16 h-16 opacity-50 grayscale" /> : <div className="text-xs opacity-50">Loading...</div>}
                </div>
            );
        }

        return (
            <div className="w-full h-full pointer-events-none select-none overflow-hidden relative">
                <div className="absolute inset-0 z-10" />
                <DynamicComponent {...appProps} isFocused={false} />
            </div>
        );
    }
);
MemoizedDynamicComponent.displayName = 'MemoizedDynamicComponent';

const RecentApps = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { windows, removewindow, setactivewindow, updatewindow } = usewindows();
    const containerref = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (isOpen && containerref.current) {

            setTimeout(() => {
                if (containerref.current) {
                    containerref.current.scrollLeft = 0;
                }
            }, 10);
        }
    }, [isOpen]);


    const springtransition = { type: "spring", stiffness: 350, damping: 30 };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9990] flex flex-col pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-2xl"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                    {windows.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className="text-white/40 text-lg font-medium tracking-wide">No Recent Apps</div>
                        </div>
                    )}

                    <motion.div
                        ref={containerref}
                        className="relative w-full h-full flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[10vw] py-8 z-[9991]"
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={springtransition}
                        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                    >
                        <div className="flex flex-row gap-6 md:gap-10 h-[65vh] items-center">
                            {[...windows].reverse().map((win: any) => {
                                const appdata = apps.find(a => a.appName === win.appName);
                                const icon = appdata?.icon || '';

                                return (
                                    <AppCard
                                        key={win.id}
                                        win={win}
                                        icon={icon}
                                        onClose={onClose}
                                        onKill={() => removewindow(win.id)}
                                        onOpen={() => {
                                            updatewindow(win.id, { isMinimized: false });
                                            setactivewindow(win.id);
                                            onClose();
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});


const AppCard = ({ win, icon, onKill, onOpen }: any) => {
    const isdragging = useRef(false);

    return (
        <motion.div
            layout
            layoutId={win.id}
            className="snap-center relative flex-shrink-0 w-[75vw] md:w-[45vw] lg:w-[350px] h-full flex flex-col"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.5, bottom: 0.5 }}
            dragDirectionLock={true}
            onDragStart={() => { isdragging.current = true; }}
            onDragEnd={(_, info) => {
                setTimeout(() => { isdragging.current = false; }, 100);

                const swipedistance = info.offset.y;
                const swipevelocity = info.velocity.y;


                if (swipedistance < -150 || swipevelocity < -600) {

                    onKill();
                } else if (swipedistance > 150 || swipevelocity > 600) {

                    onOpen();
                }
            }}
            onClick={(e) => {
                if (isdragging.current) return;
                e.stopPropagation();
                onOpen();
            }}



            style={{ touchAction: 'pan-x' }}
        >
            <div className="flex items-center gap-2 mb-3 px-1 pointer-events-none">
                {icon && <img src={icon} className="w-8 h-8 drop-shadow-md" />}
                <span className="text-white font-semibold text-sm tracking-wide drop-shadow-md">{win.title}</span>
            </div>

            <div className="flex-1 w-full bg-white dark:bg-[#1c1c1e] rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-[24px] z-20" />

                <MemoizedDynamicComponent
                    icon={icon}
                    component={win.component}
                    appname={win.appName}
                    appProps={win.props}
                />
            </div>
        </motion.div>
    );
};

RecentApps.displayName = 'RecentApps';
export default RecentApps;
