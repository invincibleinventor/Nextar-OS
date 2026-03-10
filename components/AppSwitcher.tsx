'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { apps } from './data';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassCard } from './hooks/useClayStyles';

export default function AppSwitcher({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { windows, setactivewindow, updatewindow, nativeWindows, focusNativeWindow } = useWindows();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const switcherRef = useRef<HTMLDivElement>(null);
    const clay = useIsClay();

    const openwindows = windows.filter((w: any) => !w.isminimized);
    const minimizedwindows = windows.filter((w: any) => w.isminimized);
    const nativeItems = (nativeWindows || []).filter((w: any) => !w.isHidden && w.title).map((w: any) => ({
        id: `native-${w.windowId}`,
        appname: w.wmClass || w.title,
        title: w.title,
        isminimized: false,
        isNative: true,
        windowId: w.windowId,
        icon: '/icons/appstore.svg',
    }));
    const allwindows = [...openwindows, ...minimizedwindows, ...nativeItems];

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
                    if ((selectedWindow as any).isNative) {
                        focusNativeWindow?.((selectedWindow as any).windowId);
                    } else {
                        if (selectedWindow.isminimized) {
                            updatewindow(selectedWindow.id, { isminimized: false });
                        }
                        setactivewindow(selectedWindow.id);
                    }
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
                className={`fixed inset-0 z-[500] flex items-center justify-center pointer-events-none ${clay ? 'bg-black/10' : ''}`}
            >
                <motion.div
                    ref={switcherRef}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={clay ? { type: 'spring', stiffness: 400, damping: 28 } : undefined}
                    className={`p-6 flex items-center gap-3 pointer-events-auto ${clay
                        ? 'rounded-[28px] font-sans'
                        : 'bg-surface border border-[--border-color]'
                    }`}
                    style={clay ? {
                        ...glassPanel,
                        backdropFilter: 'blur(var(--glass-blur-heavy))',
                        WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                        boxShadow: 'var(--shadow-xl)',
                    } : undefined}
                >
                    {allwindows.map((win, idx) => {
                        const appData = apps.find(a => a.appname === win.appname);
                        const isSelected = idx === selectedIndex;

                        return (
                            <div
                                key={win.id}
                                onClick={() => {
                                    if ((win as any).isNative) {
                                        focusNativeWindow?.((win as any).windowId);
                                    } else {
                                        if (win.isminimized) {
                                            updatewindow(win.id, { isminimized: false });
                                        }
                                        setactivewindow(win.id);
                                    }
                                    onClose();
                                }}
                                className={`flex flex-col items-center gap-2 p-3 cursor-pointer transition-all duration-150 ${clay ? 'rounded-[16px] active:scale-[0.97]' : ''} ${isSelected
                                    ? clay
                                        ? 'scale-110'
                                        : 'bg-overlay scale-110'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                                style={isSelected && clay ? glassCard : undefined}
                            >
                                <div className={`relative w-16 h-16 overflow-hidden ${clay ? 'rounded-[14px]' : ''} ${win.isminimized ? 'opacity-40' : ''}`}>
                                    <Image
                                        src={appData?.icon || '/app-default.png'}
                                        alt={win.appname}
                                        width={64}
                                        height={64}
                                        className="object-cover"
                                    />
                                    {win.isminimized && (
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 text-[8px] text-center py-[1px] ${clay ? 'rounded-b-lg text-[--text-color] font-sans font-medium' : 'text-white font-mono'}`}
                                            style={{ background: clay ? 'var(--bg-glass-active)' : 'color-mix(in srgb, var(--text-muted) 80%, transparent)' }}
                                        >
                                            MIN
                                        </div>
                                    )}
                                </div>
                                <span className="text-[--text-color] text-[11px] font-medium text-center max-w-[90px] truncate">
                                    {win.title || win.appname}
                                </span>
                                {win.title && win.title !== win.appname && (
                                    <span className="text-[--text-muted] text-[9px] text-center max-w-[90px] truncate -mt-1">
                                        {win.appname}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </motion.div>

                <div className={`absolute bottom-8 text-[--text-muted] text-[13px] ${clay ? 'font-sans' : ''}`}>
                    Hold {'\u2318'} and press ` to switch {'\u2022'} Release {'\u2318'} to select
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
