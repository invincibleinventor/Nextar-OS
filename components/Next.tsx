'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch, IoFolderOutline, IoDocumentOutline, IoAppsOutline, IoSettingsOutline, IoGlobeOutline, IoCalculator } from 'react-icons/io5';
import { useFileSystem } from './FileSystemContext';
import { apps, getFileIcon } from './data';
import { useWindows } from './WindowContext';
import TintedAppIcon from './ui/TintedAppIcon';

interface NextResult {
    type: 'app' | 'file' | 'folder' | 'setting' | 'calculation';
    id: string;
    name: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
}

export default function Next({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { files } = useFileSystem();
    const { addwindow } = useWindows();

    const results = useMemo((): NextResult[] => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();
        const allResults: NextResult[] = [];

        const calcMatch = query.match(/^[\d\s+\-*/().]+$/);
        if (calcMatch) {
            try {
                const result = Function('"use strict"; return (' + query + ')')();
                if (typeof result === 'number' && !isNaN(result)) {
                    allResults.push({
                        type: 'calculation',
                        id: 'calc',
                        name: `${result}`,
                        subtitle: query,
                        icon: <IoCalculator className="text-2xl text-orange-500" />,
                        action: () => {
                            navigator.clipboard.writeText(String(result));
                        }
                    });
                }
            } catch { }
        }

        const matchingApps = apps.filter(app =>
            app.appname.toLowerCase().includes(q) ||
            app.category?.toLowerCase().includes(q)
        ).slice(0, 5);

        matchingApps.forEach(app => {
            allResults.push({
                type: 'app',
                id: app.id,
                name: app.appname,
                subtitle: app.category || 'Application',
                icon: <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} useFill={true} />,
                action: () => {
                    addwindow({
                        id: `${app.id}-${Date.now()}`,
                        appname: app.appname,
                        component: app.componentname,
                        props: {},
                        isminimized: false,
                        ismaximized: false,
                    });
                }
            });
        });

        const matchingFiles = files.filter(f =>
            f.name.toLowerCase().includes(q) &&
            !f.id.startsWith('system-')
        ).slice(0, 8);

        matchingFiles.forEach(file => {
            const isFolder = file.mimetype === 'inode/directory';
            const parentFile = files.find(f => f.id === file.parent);
            const pathInfo = parentFile ? ` — ${parentFile.name}` : '';
            allResults.push({
                type: isFolder ? 'folder' : 'file',
                id: file.id,
                name: file.name,
                subtitle: isFolder ? `Folder${pathInfo}` : `${file.mimetype}${pathInfo}`,
                icon: <div className="w-8 h-8">{getFileIcon(file.mimetype, file.name, file.icon, file.id)}</div>,
                action: () => {
                    if (isFolder) {
                        addwindow({
                            id: `explorer-${Date.now()}`,
                            appname: 'Explorer',
                            component: 'apps/Explorer',
                            props: { openPath: file.id },
                            isminimized: false,
                            ismaximized: false,
                        });
                    } else if (file.mimetype === 'application/x-executable') {
                        const app = apps.find(a => a.appname === file.name || a.id === file.id);
                        if (app) {
                            addwindow({
                                id: `${app.id}-${Date.now()}`,
                                appname: app.appname,
                                component: app.componentname,
                                props: {},
                                isminimized: false,
                                ismaximized: false,
                            });
                        }
                    } else {
                        const app = apps.find(a => a.acceptedMimeTypes?.includes(file.mimetype));
                        if (app) {
                            addwindow({
                                id: `${app.id}-${Date.now()}`,
                                appname: app.appname,
                                component: app.componentname,
                                props: { file },
                                isminimized: false,
                                ismaximized: false,
                            });
                        }
                    }
                }
            });
        });

        return allResults.slice(0, 10);
    }, [query, files, addwindow]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                results[selectedIndex].action();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, results, onClose]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    onClick={e => e.stopPropagation()}
                    className="w-[600px] max-w-[90vw] bg-white/40 dark:bg-[#1e1e1e]/40 backdrop-blur-2xl rounded-xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
                >
                    <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
                        <IoSearch className="text-xl text-gray-600 dark:text-gray-200" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Next Search"
                            className="flex-1 dark:text-white bg-transparent text-lg outline-none placeholder-gray-600 dark:placeholder-gray-200"
                            autoFocus
                        />
                    </div>

                    {results.length > 0 && (
                        <div className="max-h-[400px] overflow-auto">
                            {results.map((result, idx) => (
                                <div
                                    key={result.id}
                                    onClick={() => {
                                        result.action();
                                        onClose();
                                    }}
                                    className={`flex items-center text-white gap-3 px-4 py-3 cursor-pointer transition-colors ${idx === selectedIndex
                                        ? 'bg-accent text-white'
                                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center shrink-0 relative">
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium truncate ${idx === selectedIndex ? 'text-white' : 'dark:text-gray-100 text-gray-800'}`}>
                                            {result.name}
                                        </div>
                                        {result.subtitle && (
                                            <div className={`text-xs truncate ${idx === selectedIndex ? 'text-white/70' : 'dark:text-gray-300 text-gray-500'}`}>
                                                {result.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-xs px-2 py-0.5 rounded ${idx === selectedIndex ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                                        }`}>
                                        {result.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No results for &ldquo;{query}&rdquo;
                        </div>
                    )}

                    <div className="px-4 hidden py-2 border-t border-black/5 dark:border-white/5 text-xs text-gray-400 flex items-center justify-between">
                        <span>⌘K to open</span>
                        <span>↑↓ navigate • ↵ open • esc close</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
