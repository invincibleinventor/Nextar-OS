'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { apps } from './data';

export default function AppSwitcher({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { windows, setactivewindow, updatewindow } = useWindows();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const switcherRef = useRef<HTMLDivElement>(null);

    const openwindows = windows.filter((w: any) => !w.isminimized);
    const minimizedwindows = windows.filter((w: any) => w.isminimized);
    const allwindows = [...openwindows, ...minimizedwindows];

    useEffect(() => {
        if (isOpen && allwindows.length > 0) {
            setSelectedIndex(allwindows.length > 1 ? 1 : 0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === '`' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (e.shiftKey) {
                    setSelectedIndex(prev => prev <= 0 ? allwindows.length - 1 : prev - 1);
                } else {
                    setSelectedIndex(prev => (prev + 1) % allwindows.length);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Meta' || e.key === 'Control') {
                const selectedWindow = allwindows[selectedIndex];
                if (selectedWindow) {
                    if (selectedWindow.isminimized) {
                        updatewindow(selectedWindow.id, { isminimized: false });
                    }
                    setactivewindow(selectedWindow.id);
                }
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isOpen, selectedIndex, allwindows, setactivewindow, updatewindow, onClose]);

    if (!isOpen || allwindows.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            >
                <motion.div
                    ref={switcherRef}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-black/70 backdrop-blur-2xl rounded-3xl p-6 flex items-center gap-3 pointer-events-auto shadow-2xl border border-white/10"
                >
                    {allwindows.map((win, idx) => {
                        const appData = apps.find(a => a.appname === win.appname);
                        const isSelected = idx === selectedIndex;

                        return (
                            <div
                                key={win.id}
                                onClick={() => {
                                    if (win.isminimized) {
                                        updatewindow(win.id, { isminimized: false });
                                    }
                                    setactivewindow(win.id);
                                    onClose();
                                }}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-150 ${isSelected ? 'bg-white/20 scale-110' : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <div className={`w-16 h-16 rounded-xl overflow-hidden shadow-lg ${win.isminimized ? 'opacity-50' : ''}`}>
                                    <Image
                                        src={appData?.icon || '/app-default.png'}
                                        alt={win.appname}
                                        width={64}
                                        height={64}
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-white text-xs font-medium text-center max-w-[80px] truncate">
                                    {win.appname}
                                </span>
                            </div>
                        );
                    })}
                </motion.div>

                <div className="absolute bottom-8 text-white/60 text-sm">
                    Hold ⌘ and press ` to switch • Release ⌘ to select
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
