'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoFolderOutline, IoDocumentOutline, IoChevronBack, IoChevronForward,
    IoHomeOutline, IoRefresh, IoTrashOutline, IoOpenOutline,
    IoSearch, IoGridOutline, IoListOutline, IoTerminal
} from 'react-icons/io5';
import { iselectron, nativefs, istauri } from '@/utils/platform';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassSidebar, glassInput } from '../hooks/useClayStyles';

interface NativeFile {
    name: string;
    isdir: boolean;
    isfile: boolean;
    issymlink: boolean;
    size?: number;
    modified?: Date;
}

interface NativeFileBrowserProps {
    isFocused?: boolean;
    initialPath?: string;
}

export default function NativeFileBrowser({ isFocused, initialPath }: NativeFileBrowserProps) {
    const clay = useIsClay();
    const isMacOS = typeof window !== 'undefined' && /Mac/i.test(navigator.userAgent);
    const homeDir = isMacOS ? '/Users' : '/home';
    const [currentpath, setcurrentpath] = useState(initialPath || homeDir);
    const [files, setfiles] = useState<NativeFile[]>([]);
    const [loading, setloading] = useState(false);
    const [error, seterror] = useState<string | null>(null);
    const [selectedfile, setselectedfile] = useState<string | null>(null);
    const [viewmode, setviewmode] = useState<'grid' | 'list'>('list');
    const [searchquery, setsearchquery] = useState('');
    const [history, sethistory] = useState<string[]>([]);
    const [historyindex, sethistoryindex] = useState(-1);

    const loaddir = useCallback(async (path: string) => {
        if (!iselectron) {
            seterror('Native file browsing only available in Electron mode');
            return;
        }

        setloading(true);
        seterror(null);

        try {
            const result = await nativefs.readdir(path);
            if (result.success && result.items) {
                const sorted = result.items.sort((a: NativeFile, b: NativeFile) => {
                    if (a.isdir && !b.isdir) return -1;
                    if (!a.isdir && b.isdir) return 1;
                    return a.name.localeCompare(b.name);
                });
                setfiles(sorted);
            } else {
                seterror(result.error || 'Failed to read directory');
                setfiles([]);
            }
        } catch (e: any) {
            seterror(e.message || 'Unknown error');
            setfiles([]);
        }
        setloading(false);
    }, []);

    useEffect(() => {
        loaddir(currentpath);
    }, [currentpath, loaddir]);

    const navigate = (path: string) => {
        const newhistory = history.slice(0, historyindex + 1);
        newhistory.push(path);
        sethistory(newhistory);
        sethistoryindex(newhistory.length - 1);
        setcurrentpath(path);
        setselectedfile(null);
    };

    const goback = () => {
        if (historyindex > 0) {
            sethistoryindex(historyindex - 1);
            setcurrentpath(history[historyindex - 1]);
        }
    };

    const goforward = () => {
        if (historyindex < history.length - 1) {
            sethistoryindex(historyindex + 1);
            setcurrentpath(history[historyindex + 1]);
        }
    };

    const goup = () => {
        const parent = currentpath.split('/').slice(0, -1).join('/') || '/';
        navigate(parent);
    };

    const openfile = async (file: NativeFile) => {
        const fullpath = `${currentpath}/${file.name}`.replace(/\/+/g, '/');
        if (file.isdir) {
            navigate(fullpath);
        } else {
            await nativefs.openpath(fullpath);
        }
    };

    const trashfile = async (filename: string) => {
        const fullpath = `${currentpath}/${filename}`.replace(/\/+/g, '/');
        await nativefs.trash(fullpath);
        loaddir(currentpath);
    };

    const showinfolder = async (filename: string) => {
        const fullpath = `${currentpath}/${filename}`.replace(/\/+/g, '/');
        await nativefs.showinfolder(fullpath);
    };

    const formatsize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };

    const filteredfiles = searchquery
        ? files.filter(f => f.name.toLowerCase().includes(searchquery.toLowerCase()))
        : files;

    const userName = typeof process !== 'undefined' ? process.env.USER || 'user' : 'user';
    const userHome = isMacOS ? `/Users/${userName}` : `/home/${userName}`;
    const quicknav = [
        { name: 'Home', path: userHome, icon: IoHomeOutline },
        { name: 'Desktop', path: userHome + '/Desktop', icon: IoGridOutline },
        { name: 'Documents', path: userHome + '/Documents', icon: IoDocumentOutline },
        { name: 'Downloads', path: userHome + '/Downloads', icon: IoDocumentOutline },
        { name: 'Root', path: '/', icon: IoTerminal },
    ];

    if (!iselectron) {
        return (
            <div className={`h-full flex flex-col items-center justify-center text-[--text-color] ${clay ? 'bg-[--bg-base]' : 'bg-surface'}`}>
                <IoFolderOutline size={64} className="text-[--text-muted] mb-4" />
                <p className="text-xl font-medium mb-2">Native File Browser</p>
                <p className="text-[--text-muted]">Only available in Electron mode</p>
                <p className="text-[--text-muted] text-[13px] mt-4">Run with: npm run electron:dev</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col text-[--text-color] bg-[--bg-base]">
            {/* Toolbar */}
            <div className={`h-12 flex items-center px-4 shrink-0 gap-2 border-b ${clay ? 'border-[--glass-border] bg-transparent' : 'bg-surface border-[--border-color]'}`}>
                <div className="flex items-center gap-1 ml-16">
                    <button
                        onClick={goback}
                        disabled={historyindex <= 0}
                        className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} ${historyindex <= 0 ? 'opacity-30' : ''}`}
                    >
                        <IoChevronBack size={18} />
                    </button>
                    <button
                        onClick={goforward}
                        disabled={historyindex >= history.length - 1}
                        className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'} ${historyindex >= history.length - 1 ? 'opacity-30' : ''}`}
                    >
                        <IoChevronForward size={18} />
                    </button>
                    <button
                        onClick={goup}
                        className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                        title="Go up"
                    >
                        ↑
                    </button>
                </div>

                <div className={`flex-1 flex items-center px-3 py-1.5 mx-4 ${clay ? 'rounded-full' : 'bg-overlay'}`}
                    style={clay ? glassInput : undefined}
                >
                    <span className="text-[--text-muted] text-[13px] truncate">{currentpath}</span>
                </div>

                <button
                    onClick={() => loaddir(currentpath)}
                    className={`p-1.5 ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                >
                    <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
                </button>

                <div className={`flex p-0.5 ${clay ? 'rounded-[10px] bg-[--bg-glass-active]' : 'bg-overlay'}`}>
                    <button
                        onClick={() => setviewmode('list')}
                        className={`p-1.5 ${clay ? 'rounded-[8px]' : ''} ${viewmode === 'list' ? (clay ? 'bg-[--bg-glass]' : 'bg-surface') : ''}`}
                    >
                        <IoListOutline size={16} />
                    </button>
                    <button
                        onClick={() => setviewmode('grid')}
                        className={`p-1.5 ${clay ? 'rounded-[8px]' : ''} ${viewmode === 'grid' ? (clay ? 'bg-[--bg-glass]' : 'bg-surface') : ''}`}
                    >
                        <IoGridOutline size={16} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className={`w-48 p-2 overflow-y-auto shrink-0 border-r ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-surface'}`}
                    style={clay ? glassSidebar : undefined}
                >
                    <div className="text-xs text-[--text-muted] uppercase mb-2 px-2 font-semibold tracking-wide">Quick Access</div>
                    {quicknav.map((item) => {
                        const isActive = currentpath === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-all ${clay
                                    ? `rounded-[12px] ${isActive ? 'text-white' : 'hover:bg-[--bg-glass-hover] active:scale-[0.98]'}`
                                    : `${isActive ? 'bg-accent text-[--bg-base]' : 'hover:bg-overlay'}`
                                }`}
                                style={isActive && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <item.icon size={16} />
                                {item.name}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Search */}
                    <div className={`p-2 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                        <div className={`relative ${clay ? 'rounded-full' : ''}`}
                            style={clay ? glassInput : undefined}>
                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                            <input
                                type="text"
                                value={searchquery}
                                onChange={(e) => setsearchquery(e.target.value)}
                                placeholder="Search files..."
                                className={`w-full pl-9 pr-4 py-2 text-[13px] outline-none placeholder-[--text-muted] text-[--text-color] ${clay ? 'bg-transparent' : 'bg-overlay'}`}
                            />
                        </div>
                    </div>

                    {/* File listing */}
                    <div className="flex-1 overflow-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <IoRefresh size={32} className="animate-spin text-[--text-muted]" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-pastel-red">
                                <p className="text-lg mb-2">Error</p>
                                <p className="text-[13px] text-[--text-muted]">{error}</p>
                                <button
                                    onClick={() => navigate('/home')}
                                    className={`mt-4 px-4 py-2 transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'bg-overlay hover:bg-surface'}`}
                                    style={clay ? glassCard : undefined}
                                >
                                    Go Home
                                </button>
                            </div>
                        ) : filteredfiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                <IoFolderOutline size={48} className="mb-2 opacity-50" />
                                <p>No files found</p>
                            </div>
                        ) : viewmode === 'list' ? (
                            <table className="w-full text-[13px]">
                                <thead className={`text-[--text-muted] text-xs uppercase sticky top-0 ${clay ? 'bg-[--bg-glass]' : 'bg-[--bg-base]'}`}>
                                    <tr>
                                        <th className="text-left py-2 px-3">Name</th>
                                        <th className="text-left py-2 px-3 w-24">Size</th>
                                        <th className="text-right py-2 px-3 w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredfiles.map((file) => {
                                        const isSelected = selectedfile === file.name;
                                        return (
                                            <tr
                                                key={file.name}
                                                className={`cursor-pointer transition-colors ${clay
                                                    ? `${isSelected ? 'text-white' : 'hover:bg-[--bg-glass-hover]'}`
                                                    : `${isSelected ? 'bg-accent text-[--bg-base]' : 'hover:bg-overlay'}`
                                                }`}
                                                style={isSelected && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)', borderRadius: '10px' } : undefined}
                                                onClick={() => setselectedfile(file.name)}
                                                onDoubleClick={() => openfile(file)}
                                            >
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {file.isdir ? (
                                                            <IoFolderOutline className={isSelected && clay ? 'text-white' : 'text-accent'} size={18} />
                                                        ) : (
                                                            <IoDocumentOutline className={isSelected && clay ? 'text-white/70' : 'text-[--text-muted]'} size={18} />
                                                        )}
                                                        <span className={file.name.startsWith('.') && !isSelected ? 'text-[--text-muted]' : ''}>
                                                            {file.name}
                                                        </span>
                                                        {file.issymlink && <span className={`text-xs ${isSelected && clay ? 'text-white/60' : 'text-[--text-muted]'}`}>→</span>}
                                                    </div>
                                                </td>
                                                <td className={`py-2 px-3 ${isSelected && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>
                                                    {file.isdir ? '--' : formatsize(file.size || 0)}
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openfile(file); }}
                                                            className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                                            title="Open"
                                                        >
                                                            <IoOpenOutline size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); showinfolder(file.name); }}
                                                            className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                                            title="Show in folder"
                                                        >
                                                            <IoFolderOutline size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); trashfile(file.name); }}
                                                            className={`p-1 text-pastel-red ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                                            title="Move to trash"
                                                        >
                                                            <IoTrashOutline size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 p-2">
                                {filteredfiles.map((file) => {
                                    const isSelected = selectedfile === file.name;
                                    return (
                                        <div
                                            key={file.name}
                                            className={`flex flex-col items-center p-3 cursor-pointer transition-all ${clay
                                                ? `rounded-[12px] ${isSelected ? 'text-white' : 'hover:bg-[--bg-glass-hover]'}`
                                                : `${isSelected ? 'bg-accent text-[--bg-base] ring-1 ring-accent' : 'hover:bg-overlay'}`
                                            }`}
                                            style={isSelected && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                            onClick={() => setselectedfile(file.name)}
                                            onDoubleClick={() => openfile(file)}
                                        >
                                            {file.isdir ? (
                                                <IoFolderOutline className={isSelected && clay ? 'text-white' : 'text-accent'} size={40} />
                                            ) : (
                                                <IoDocumentOutline className={isSelected && clay ? 'text-white/70' : 'text-[--text-muted]'} size={40} />
                                            )}
                                            <span className={`text-xs mt-2 text-center truncate w-full ${file.name.startsWith('.') && !isSelected ? 'text-[--text-muted]' : ''}`}>
                                                {file.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className={`h-8 flex items-center px-4 text-xs text-[--text-muted] shrink-0 border-t ${clay ? 'border-[--glass-border] bg-transparent' : 'bg-surface border-[--border-color]'}`}>
                <span>{filteredfiles.length} items</span>
                {selectedfile && <span className="ml-4">Selected: {selectedfile}</span>}
                <span className="ml-auto">Native File Browser</span>
            </div>
        </div>
    );
}
