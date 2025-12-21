'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { apps, openSystemItem, appdata } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useFileSystem } from './FileSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch, IoClose } from 'react-icons/io5';
import { useExternalApps } from './ExternalAppsContext';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const { launchApp } = useExternalApps();
    const [openfolder, setopenfolder] = useState<string | null>(null);

    const allApps = useMemo(() => {
        const installedAppFiles = files.filter(f => f.parent === 'root-apps' && f.name.endsWith('.app'));
        const installedApps = installedAppFiles.map(f => {
            try {
                const data = JSON.parse(f.content || '{}');
                return {
                    id: data.id,
                    appname: data.name,
                    icon: data.icon || '/python.png',
                    isInstalledApp: true,
                    category: data.category,
                    maximizeable: true,
                    componentname: '',
                    additionaldata: {},
                    multiwindow: true,
                    titlebarblurred: false,
                    pinned: false
                } as appdata;
            } catch {
                return null;
            }
        }).filter((a): a is NonNullable<typeof a> => a !== null);
        return [...apps, ...installedApps];
    }, [files]);

    const allcategories = Array.from(new Set(allApps.filter(a => a.category).map(a => a.category!)));

    const getcategoryapps = (category: string) => {
        return allApps.filter(app => app.category === category);
    };

    const openapp = (app: appdata) => {
        setopenfolder(null);
        if ((app as any).isInstalledApp) {
            launchApp(app.id);
            return;
        }
        openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
    };

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-14 px-5 pb-32 scrollbar-hide select-none [&::-webkit-scrollbar]:hidden"
            style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
        >
            <div className="relative w-full text-center mb-6">
                <div className="relative w-full mx-auto bg-neutral-200/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-xl h-10 flex items-center px-3">
                    <IoSearch className="text-neutral-800 dark:text-neutral-300" size={20} />
                    <span className="ml-2 text-neutral-800 dark:text-neutral-300 text-lg">App Library</span>
                </div>
            </div>

            <div className="grid grid-cols-2 3xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 w-full mx-auto pb-10">
                {allcategories.map((category) => {
                    const categoryapps = getcategoryapps(category);
                    if (categoryapps.length === 0) return null;

                    const hasoverflow = categoryapps.length > 4;
                    const displayapps = hasoverflow ? categoryapps.slice(0, 3) : categoryapps.slice(0, 4);
                    const overflowcount = categoryapps.length - 3;

                    return (
                        <div key={category} className="flex flex-col gap-2 relative">
                            <div
                                className={`bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-3xl p-4 w-auto aspect-square shrink-0 h-auto ${hasoverflow ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                                style={{ aspectRatio: '1/1' }}
                                onClick={() => hasoverflow && setopenfolder(category)}
                            >
                                <div className="grid grid-cols-2 grid-rows-2 gap-3 w-auto h-auto">
                                    {displayapps.map((app) => (
                                        <div
                                            key={app.id}
                                            onClick={(e) => {
                                                if (!hasoverflow) {
                                                    e.stopPropagation();
                                                    openapp(app);
                                                }
                                            }}
                                            className={`relative w-full h-full flex items-center justify-center ${!hasoverflow ? 'cursor-pointer active:scale-90' : ''} transition-transform`}
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
                                    {hasoverflow && (
                                        <div className="relative w-full h-full flex items-center justify-center bg-white/20 dark:bg-white/10 rounded-xl">
                                            <span className="text-white font-bold text-lg drop-shadow-md">+{overflowcount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-center mt-1 text-neutral-200 text-[13px] font-semibold leading-none px-1 truncate">
                                {category}
                            </span>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {openfolder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setopenfolder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white/90 dark:bg-[#2c2c2e]/90 backdrop-blur-xl rounded-3xl p-6 w-[90%] max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-black dark:text-white">{openfolder}</h2>
                                <button
                                    onClick={() => setopenfolder(null)}
                                    className="p-2 rounded-full bg-black/10 dark:bg-white/10 active:scale-90 transition-transform"
                                >
                                    <IoClose size={20} className="text-black dark:text-white" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {getcategoryapps(openfolder).map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => openapp(app)}
                                        className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                                    >
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                                            <Image
                                                src={app.icon}
                                                alt={app.appname}
                                                width={64}
                                                height={64}
                                                className="object-cover w-full h-full"
                                                draggable={false}
                                            />
                                        </div>
                                        <span className="text-xs text-center text-black dark:text-white font-medium truncate w-full">
                                            {app.appname}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppLibrary;
