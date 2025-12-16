'use client';
import React, { useState, useEffect } from 'react';
import { IoDocumentTextOutline, IoFolderOutline, IoChevronBack, IoChevronForward, IoGridOutline, IoListOutline, IoSearch } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import { filesystem, filesystemitem, apps } from '../data';
import Image from 'next/image';

interface fileviewerprops {
    content?: string;
    title?: string;
    type?: string;
}

const getfileicon = (mimetype: string, name: string, itemicon?: React.ReactNode) => {
    if (itemicon) return itemicon;
    if (mimetype === 'inode/directory') return <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />;
    if (mimetype === 'application/x-executable') return null;
    if (mimetype === 'image/png' || mimetype === 'image/jpeg') return <Image src="/photos.png" alt="image" width={64} height={64} className="w-full h-full object-contain" />;
    if (mimetype === 'application/pdf') return <Image src="/pdf.png" alt="pdf" width={64} height={64} className="w-full h-full object-contain" />;
    return <IoDocumentTextOutline className="w-full h-full text-gray-500" />;
};

export default function FileViewer({ content: initialContent = '', title: initialTitle = 'Untitled', type: initialType = 'text/plain' }: fileviewerprops) {
    const [viewingContent, setViewingContent] = useState<string | null>(initialContent || null);
    const [viewingTitle, setViewingTitle] = useState<string>(initialTitle);
    const [viewingType, setViewingType] = useState<string>(initialType);
    const [history, setHistory] = useState<string[]>(['root-projects']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const currentFolderId = history[historyIndex];
    useEffect(() => {
        if (initialContent) {
            setViewingContent(initialContent);
            setViewingTitle(initialTitle);
        }
    }, [initialContent, initialTitle]);

    const getFolderContents = (parentId: string) => {
        return filesystem.filter(item => item.parent === parentId);
    };

    const navigateTo = (folderId: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(folderId);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setSelectedId(null);
    };

    const navigateBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setSelectedId(null);
        }
    };

    const navigateForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setSelectedId(null);
        }
    };

    const fileViewerApp = apps.find(a => a.id === 'fileviewer');
    const acceptedTypes = fileViewerApp?.acceptedMimeTypes || [];

    const isFileSupported = (item: filesystemitem) => {
        return acceptedTypes.includes(item.mimetype);
    };

    const handleItemClick = (item: filesystemitem) => {
        setSelectedId(item.id);
    };

    const handleItemDoubleClick = (item: filesystemitem) => {
        if (item.mimetype === 'inode/directory') {
            navigateTo(item.id);
        } else if (isFileSupported(item)) {
            setViewingContent(item.content || '');
            setViewingTitle(item.name);
            setViewingType(item.mimetype);
        }
    };

    const handleOpenClick = () => {
        setViewingContent(null);
        setViewingTitle('Open File');
    }

    if (viewingContent !== null) {
        return (
            <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sf">
                <div className="h-[50px] border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 bg-gray-50/50 dark:bg-[#282828] draggable-region">
                    <div className="flex items-center gap-2 ps-20">
                        <IoDocumentTextOutline className="text-gray-500" />
                        <span className="text-sm font-semibold truncate">{viewingTitle}</span>
                    </div>
                    <button
                        onClick={handleOpenClick}
                        className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-white/10 rounded-md hover:bg-gray-300 dark:hover:bg-white/20 transition"
                    >
                        Open...
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto w-full h-full bg-[#525659]">
                    {viewingType === 'application/pdf' ? (
                        <iframe
                            src={viewingContent}
                            className="w-full h-full border-none block"
                            title={viewingTitle}
                        />
                    ) : (
                        <div className="max-w-3xl mx-auto prose dark:prose-invert prose-sm p-8 bg-white dark:bg-[#1e1e1e] min-h-full">
                            <ReactMarkdown>{viewingContent}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const sidebarLocations = [
        { name: 'Projects', id: 'root-projects', icon: IoFolderOutline },
        { name: 'Documents', id: 'root-docs', icon: IoDocumentTextOutline },
        { name: 'Desktop', id: 'root-desktop', icon: IoGridOutline },
    ];

    const currentItems = getFolderContents(currentFolderId);

    return (
        <div className="flex h-full w-full bg-[#f5f5f5] dark:bg-[#1e1e1e] text-black dark:text-white font-sf overflow-hidden">
            <div className={`w-[200px] bg-[#e3e3e3]/50 dark:bg-[#252526] border-r border-black/10 dark:border-white/10 flex flex-col pt-10`}>
                <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase">Favorites</div>
                {sidebarLocations.map(loc => (
                    <div
                        key={loc.id}
                        onClick={() => {
                            setHistory([loc.id]);
                            setHistoryIndex(0);
                            setSelectedId(null);
                        }}
                        className={`mx-2 px-3 py-1.5 flex items-center gap-2 rounded-md cursor-pointer transition-colors ${currentFolderId === loc.id ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <loc.icon className="text-blue-500" />
                        <span className="text-sm">{loc.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e]">
                <div className="h-[50px] border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-4 bg-[#f6f6f6] dark:bg-[#252526]">
                    <div className="flex gap-2">
                        <button
                            onClick={navigateBack}
                            disabled={historyIndex <= 0}
                            className="text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                        >
                            <IoChevronBack size={18} />
                        </button>
                        <button
                            onClick={navigateForward}
                            disabled={historyIndex >= history.length - 1}
                            className="text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                        >
                            <IoChevronForward size={18} />
                        </button>
                    </div>
                    <div className="flex-1 font-semibold text-sm text-center">
                        {filesystem.find(i => i.id === currentFolderId)?.name || 'Unknown'}
                    </div>
                    <div className="w-[60px]"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4" onClick={() => setSelectedId(null)}>
                    {currentItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-4xl mb-2 opacity-50">folder_open</span>
                            <span className="text-sm">Empty Folder</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                            {currentItems.map(item => {
                                const supported = item.mimetype === 'inode/directory' || isFileSupported(item);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleItemClick(item);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            handleItemDoubleClick(item);
                                        }}
                                        className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-default
                                            ${selectedId === item.id
                                                ? 'bg-[#007AFF] text-white'
                                                : 'hover:bg-black/5 dark:hover:bg-white/5'}
                                            ${!supported ? 'opacity-50 grayscale' : ''}
                                        `}
                                    >
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 mb-1 relative flex items-center justify-center">
                                            {getfileicon(item.mimetype, item.name, item.icon)}
                                        </div>
                                        <span className={`text-[12px] text-center leading-tight px-1 py-0.5 rounded break-words w-full line-clamp-2
                                            ${selectedId === item.id ? 'text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 text-xs text-gray-500 flex justify-end gap-3 items-center bg-gray-50 dark:bg-[#252526]">
                    <button
                        onClick={() => setSelectedId(null)}
                        className="px-4 py-1.5 rounded-md bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-700 font-medium min-w-[80px]"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedId || (() => {
                            const item = filesystem.find(i => i.id === selectedId);
                            return !item || (item.mimetype !== 'inode/directory' && !isFileSupported(item)) || item.mimetype === 'inode/directory';
                        })()}
                        onClick={() => {
                            const item = filesystem.find(i => i.id === selectedId);
                            if (item) handleItemDoubleClick(item);
                        }}
                        className="px-4 py-1.5 rounded-md bg-[#007AFF] text-white font-medium shadow-sm hover:bg-[#007afe] disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                    >
                        Open
                    </button>

                </div>
            </div>
        </div>
    );
}
