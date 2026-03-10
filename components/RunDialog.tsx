'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTerminalOutline, IoAppsOutline, IoDesktopOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { apps as webApps, getfilteredapps, appdata } from '@/components/data';
import { useWindows } from './WindowContext';
import { useIsClay } from './hooks/useIsClay';
import { glassCard } from './hooks/useClayStyles';
import { isnative, electronapi } from '@/utils/platform';
import TintedAppIcon from './ui/TintedAppIcon';

interface RunSuggestion {
    id: string;
    name: string;
    subtitle: string;
    icon: React.ReactNode;
    type: 'nextaros' | 'native' | 'command';
    action: () => void;
}

export default function RunDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [nativeApps, setNativeApps] = useState<any[]>([]);
    const [errorToast, setErrorToast] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { addwindow } = useWindows();
    const clay = useIsClay();

    // Fetch native installed apps when dialog opens
    useEffect(() => {
        if (isOpen && isnative) {
            electronapi.apps.getinstalled().then((result: any) => {
                if (result?.success && result.apps) {
                    setNativeApps(result.apps);
                }
            }).catch(() => {});
        }
    }, [isOpen]);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setInput('');
            setSelectedIndex(0);
            setErrorToast('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Clear error toast after delay
    useEffect(() => {
        if (errorToast) {
            const t = setTimeout(() => setErrorToast(''), 3000);
            return () => clearTimeout(t);
        }
    }, [errorToast]);

    const suggestions = useMemo((): RunSuggestion[] => {
        if (!input.trim()) return [];
        const q = input.toLowerCase();
        const results: RunSuggestion[] = [];

        // NextarOS web apps
        const filteredApps = getfilteredapps(isnative);
        const matchingWebApps = filteredApps.filter(app =>
            app.appname.toLowerCase().includes(q) ||
            app.category?.toLowerCase().includes(q)
        ).slice(0, 5);

        matchingWebApps.forEach(app => {
            results.push({
                id: `web-${app.id}`,
                name: app.appname,
                subtitle: app.category || 'NextarOS App',
                icon: <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} useFill={true} />,
                type: 'nextaros',
                action: () => {
                    addwindow({
                        id: `${app.id}-${Date.now()}`,
                        appname: app.appname,
                        component: app.componentname,
                        props: {},
                        isminimized: false,
                        ismaximized: false,
                    });
                },
            });
        });

        // Native installed apps
        if (isnative && nativeApps.length > 0) {
            const matchingNative = nativeApps.filter((app: any) => {
                const name = (app.name || app.appname || '').toLowerCase();
                const keywords = (app.keywords || '').toLowerCase();
                return name.includes(q) || keywords.includes(q);
            }).slice(0, 5);

            matchingNative.forEach((app: any) => {
                const appName = app.name || app.appname || 'Unknown';
                results.push({
                    id: `native-${app.path || appName}`,
                    name: appName,
                    subtitle: app.path || 'System Application',
                    icon: <IoDesktopOutline className="text-xl text-[--text-muted]" />,
                    type: 'native',
                    action: () => {
                        electronapi.apps.launch(app.path || app.exec, []);
                    },
                });
            });
        }

        return results.slice(0, 8);
    }, [input, nativeApps, addwindow]);

    const executeInput = useCallback(() => {
        if (suggestions.length > 0 && suggestions[selectedIndex]) {
            suggestions[selectedIndex].action();
            onClose();
            return;
        }

        // No matching suggestion — try running as shell command
        if (!input.trim()) return;

        if (isnative) {
            electronapi.terminal.execute(input.trim());
            onClose();
        } else {
            setErrorToast('Shell commands are only available in native mode');
        }
    }, [input, suggestions, selectedIndex, onClose]);

    // Keyboard handling
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeInput();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, suggestions, selectedIndex, onClose, executeInput]);

    // Reset selection when input changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [input]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.children[selectedIndex] as HTMLElement;
            if (selected) selected.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const typeLabel = (type: RunSuggestion['type']) => {
        switch (type) {
            case 'nextaros': return 'App';
            case 'native': return 'System';
            case 'command': return 'Command';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[500] flex items-start justify-center pt-[30vh]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 420 }}
                        onClick={e => e.stopPropagation()}
                        className={`w-[480px] max-w-[90vw] overflow-hidden ${clay
                            ? 'rounded-[18px]'
                            : 'rounded-xl bg-[--bg-surface] shadow-pastel-active border border-[--border-color]'
                        }`}
                        style={clay ? {
                            background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 50%, transparent))',
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-lg)',
                        } : undefined}
                    >
                        {/* Input */}
                        <div className={`flex items-center gap-3 px-4 py-3 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                            <IoTerminalOutline className="text-lg text-[--text-muted] shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Run a command or app..."
                                className={`flex-1 bg-transparent text-base outline-none ${clay
                                    ? 'text-[--text-color] placeholder:text-[--text-color]/40'
                                    : 'text-[--text-color] placeholder:text-[--text-muted]'
                                }`}
                                autoFocus
                            />
                        </div>

                        {/* Suggestions list */}
                        {suggestions.length > 0 && (
                            <div ref={listRef} className="max-h-[280px] overflow-auto py-1">
                                {suggestions.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        onClick={() => { item.action(); onClose(); }}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                            idx === selectedIndex
                                                ? clay ? 'text-white' : 'bg-accent text-[--bg-base]'
                                                : clay ? 'text-[--text-color] hover:bg-white/10' : 'text-[--text-color] hover:bg-overlay'
                                        } ${clay ? 'mx-1.5 rounded-[10px]' : ''}`}
                                        style={idx === selectedIndex && clay ? {
                                            background: 'var(--accent-gradient)',
                                            boxShadow: 'var(--accent-shadow)',
                                            borderRadius: 10,
                                        } : undefined}
                                    >
                                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${
                                                idx === selectedIndex ? (clay ? 'text-white' : 'text-[--bg-base]') : 'text-[--text-color]'
                                            }`}>
                                                {item.name}
                                            </div>
                                            <div className={`text-xs truncate ${
                                                idx === selectedIndex ? (clay ? 'text-white/60' : 'opacity-60') : 'text-[--text-color] opacity-40'
                                            }`}>
                                                {item.subtitle}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            idx === selectedIndex
                                                ? clay ? 'bg-white/20 text-white' : 'bg-[--bg-base]/20'
                                                : clay ? 'bg-white/10 text-[--text-color] opacity-50' : 'bg-overlay text-[--text-color]'
                                        }`}>
                                            {typeLabel(item.type)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty state hint */}
                        {input.trim() && suggestions.length === 0 && (
                            <div className="px-4 py-3 text-xs text-[--text-muted] opacity-70 text-center">
                                Press Enter to execute as {isnative ? 'shell command' : 'command'}
                            </div>
                        )}

                        {/* Footer hint */}
                        <div className={`px-4 py-2 border-t text-[10px] text-[--text-muted] opacity-50 flex items-center justify-between ${
                            clay ? 'border-[--glass-border]' : 'border-[--border-color]'
                        }`}>
                            <span>Run Dialog</span>
                            <span>Esc close &middot; Arrow keys navigate &middot; Enter run</span>
                        </div>

                        {/* Error toast */}
                        <AnimatePresence>
                            {errorToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className={`absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                                        clay
                                            ? 'text-white'
                                            : 'bg-red-500/90 text-white'
                                    }`}
                                    style={clay ? {
                                        background: 'color-mix(in srgb, #ef4444 70%, var(--bg-glass))',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid var(--glass-border)',
                                    } : { background: 'rgba(239,68,68,0.9)' }}
                                >
                                    <IoAlertCircleOutline className="text-sm" />
                                    {errorToast}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
