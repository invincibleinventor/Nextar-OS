'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoFolderOutline, IoDocumentOutline, IoChevronBack, IoChevronForward,
    IoHomeOutline, IoRefresh, IoTrashOutline, IoOpenOutline,
    IoSearch, IoGridOutline, IoListOutline, IoTerminal
} from 'react-icons/io5';
import { iselectron, nativefs } from '@/utils/platform';

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
    const [currentpath, setcurrentpath] = useState(initialPath || '/home');
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

    const quicknav = [
        { name: 'Home', path: '/home', icon: IoHomeOutline },
        { name: 'Desktop', path: '/home/' + (process.env.USER || 'user') + '/Desktop', icon: IoGridOutline },
        { name: 'Documents', path: '/home/' + (process.env.USER || 'user') + '/Documents', icon: IoDocumentOutline },
        { name: 'Downloads', path: '/home/' + (process.env.USER || 'user') + '/Downloads', icon: IoDocumentOutline },
        { name: 'Root', path: '/', icon: IoTerminal },
    ];

    if (!iselectron) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-neutral-900 text-white">
                <IoFolderOutline size={64} className="text-neutral-600 mb-4" />
                <p className="text-xl font-medium mb-2">Native File Browser</p>
                <p className="text-neutral-500">Only available in Electron mode</p>
                <p className="text-neutral-600 text-sm mt-4">Run with: npm run electron:dev</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center px-4 shrink-0 gap-2">
                <div className="flex items-center gap-1 ml-16">
                    <button
                        onClick={goback}
                        disabled={historyindex <= 0}
                        className={`p-1.5 rounded hover:bg-neutral-700 ${historyindex <= 0 ? 'opacity-30' : ''}`}
                    >
                        <IoChevronBack size={18} />
                    </button>
                    <button
                        onClick={goforward}
                        disabled={historyindex >= history.length - 1}
                        className={`p-1.5 rounded hover:bg-neutral-700 ${historyindex >= history.length - 1 ? 'opacity-30' : ''}`}
                    >
                        <IoChevronForward size={18} />
                    </button>
                    <button
                        onClick={goup}
                        className="p-1.5 rounded hover:bg-neutral-700"
                        title="Go up"
                    >
                        ↑
                    </button>
                </div>

                <div className="flex-1 flex items-center bg-neutral-800 rounded-lg px-3 py-1.5 mx-4">
                    <span className="text-neutral-400 text-sm truncate">{currentpath}</span>
                </div>

                <button
                    onClick={() => loaddir(currentpath)}
                    className="p-1.5 rounded hover:bg-neutral-700"
                >
                    <IoRefresh size={18} className={loading ? 'animate-spin' : ''} />
                </button>

                <div className="flex bg-neutral-800 rounded-lg p-0.5">
                    <button
                        onClick={() => setviewmode('list')}
                        className={`p-1.5 rounded ${viewmode === 'list' ? 'bg-neutral-600' : ''}`}
                    >
                        <IoListOutline size={16} />
                    </button>
                    <button
                        onClick={() => setviewmode('grid')}
                        className={`p-1.5 rounded ${viewmode === 'grid' ? 'bg-neutral-600' : ''}`}
                    >
                        <IoGridOutline size={16} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-48 bg-neutral-900/50 border-r border-neutral-700 p-2 overflow-y-auto shrink-0">
                    <div className="text-xs text-neutral-500 uppercase mb-2 px-2">Quick Access</div>
                    {quicknav.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-neutral-700 ${currentpath === item.path ? 'bg-accent/30 text-accent' : ''}`}
                        >
                            <item.icon size={16} />
                            {item.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-2 border-b border-neutral-700">
                        <div className="relative">
                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                            <input
                                type="text"
                                value={searchquery}
                                onChange={(e) => setsearchquery(e.target.value)}
                                placeholder="Search files..."
                                className="w-full bg-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none placeholder-neutral-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <IoRefresh size={32} className="animate-spin text-neutral-500" />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-400">
                                <p className="text-lg mb-2">Error</p>
                                <p className="text-sm text-neutral-500">{error}</p>
                                <button
                                    onClick={() => navigate('/home')}
                                    className="mt-4 px-4 py-2 bg-neutral-700 rounded-lg hover:bg-neutral-600"
                                >
                                    Go Home
                                </button>
                            </div>
                        ) : filteredfiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                                <IoFolderOutline size={48} className="mb-2 opacity-50" />
                                <p>No files found</p>
                            </div>
                        ) : viewmode === 'list' ? (
                            <table className="w-full text-sm">
                                <thead className="text-neutral-500 text-xs uppercase sticky top-0 bg-[#1e1e1e]">
                                    <tr>
                                        <th className="text-left py-2 px-3">Name</th>
                                        <th className="text-left py-2 px-3 w-24">Size</th>
                                        <th className="text-right py-2 px-3 w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredfiles.map((file) => (
                                        <tr
                                            key={file.name}
                                            className={`hover:bg-neutral-800 cursor-pointer ${selectedfile === file.name ? 'bg-accent/20' : ''}`}
                                            onClick={() => setselectedfile(file.name)}
                                            onDoubleClick={() => openfile(file)}
                                        >
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    {file.isdir ? (
                                                        <IoFolderOutline className="text-accent" size={18} />
                                                    ) : (
                                                        <IoDocumentOutline className="text-neutral-400" size={18} />
                                                    )}
                                                    <span className={file.name.startsWith('.') ? 'text-neutral-500' : ''}>
                                                        {file.name}
                                                    </span>
                                                    {file.issymlink && <span className="text-xs text-neutral-500">→</span>}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-neutral-500">
                                                {file.isdir ? '--' : formatsize(file.size || 0)}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openfile(file); }}
                                                        className="p-1 hover:bg-neutral-600 rounded"
                                                        title="Open"
                                                    >
                                                        <IoOpenOutline size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); showinfolder(file.name); }}
                                                        className="p-1 hover:bg-neutral-600 rounded"
                                                        title="Show in folder"
                                                    >
                                                        <IoFolderOutline size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); trashfile(file.name); }}
                                                        className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                                                        title="Move to trash"
                                                    >
                                                        <IoTrashOutline size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 p-2">
                                {filteredfiles.map((file) => (
                                    <div
                                        key={file.name}
                                        className={`flex flex-col items-center p-3 rounded-lg hover:bg-neutral-800 cursor-pointer ${selectedfile === file.name ? 'bg-accent/20 ring-1 ring-accent' : ''}`}
                                        onClick={() => setselectedfile(file.name)}
                                        onDoubleClick={() => openfile(file)}
                                    >
                                        {file.isdir ? (
                                            <IoFolderOutline className="text-accent" size={40} />
                                        ) : (
                                            <IoDocumentOutline className="text-neutral-400" size={40} />
                                        )}
                                        <span className={`text-xs mt-2 text-center truncate w-full ${file.name.startsWith('.') ? 'text-neutral-500' : ''}`}>
                                            {file.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-8 bg-neutral-900 border-t border-neutral-700 flex items-center px-4 text-xs text-neutral-500 shrink-0">
                <span>{filteredfiles.length} items</span>
                {selectedfile && <span className="ml-4">Selected: {selectedfile}</span>}
                <span className="ml-auto">Native File Browser • Linux Host</span>
            </div>
        </div>
    );
}
