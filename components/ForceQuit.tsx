'use client';
import React from 'react';
import Image from 'next/image';
import { useWindows } from './WindowContext';
import { apps } from './data';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseCircle } from 'react-icons/io5';

interface ForceQuitProps {
    isopen: boolean;
    onclose: () => void;
}

export default function ForceQuit({ isopen, onclose }: ForceQuitProps) {
    const { windows, removewindow } = useWindows();

    const handleForceQuit = (windowId: string) => {
        removewindow(windowId);
    };

    const openWindows = windows.filter((w: any) => !w.isminimized);

    return (
        <AnimatePresence>
            {isopen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99998]"
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[350px] bg-[#f5f5f5] dark:bg-[#2a2a2a] rounded-xl shadow-2xl z-[99999] font-sf overflow-hidden"
                    >
                        <div className="p-4 border-b border-black/10 dark:border-white/10">
                            <h2 className="text-base font-semibold text-center dark:text-white">Force Quit Applications</h2>
                            <p className="text-xs text-gray-500 text-center mt-1">Select an application to force quit</p>
                        </div>

                        <div className="max-h-[250px] overflow-y-auto">
                            {openWindows.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No applications running
                                </div>
                            ) : (
                                openWindows.map((win: any) => {
                                    const appData = apps.find(a => a.appname === win.appname);
                                    return (
                                        <div
                                            key={win.id}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                                            onClick={() => handleForceQuit(win.id)}
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                <Image
                                                    src={appData?.icon || '/app-default.png'}
                                                    alt={win.appname}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm dark:text-white truncate">{win.appname}</div>
                                                <div className="text-xs text-gray-500 truncate">{win.title || 'Window'}</div>
                                            </div>
                                            <IoCloseCircle
                                                size={24}
                                                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-3 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
                            <button
                                onClick={onclose}
                                className="px-4 py-1.5 text-sm font-medium bg-gray-200 dark:bg-white/10 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors dark:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
