'use client';
import React, { useState, useEffect } from 'react';
import { IoDocumentTextOutline, IoFolderOutline, IoChevronBack, IoChevronForward, IoGridOutline, IoListOutline, IoSearch } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import { useFileSystem } from '../FileSystemContext';
import { apps, filesystemitem, getFileIcon, sidebaritems } from '../data';
import Image from 'next/image';
import { useDevice } from '../DeviceContext';
import ContextMenu from '../ui/ContextMenu';
import FileModal from '../ui/FileModal';
import { useWindows } from '../WindowContext';
import { IoFolderOpenOutline } from "react-icons/io5";
import Sidebar from '../ui/Sidebar';


import { useAuth } from '../AuthContext';

interface fileviewerprops {
    content?: string;
    title?: string;
    type?: string;
}

export default function FileViewer({ content: initialContent, title: initialTitle = 'Untitled', type: initialType = 'text/plain' }: fileviewerprops) {
    const { files, createFolder, createFile, deleteItem, moveToTrash } = useFileSystem();
    const { activewindow } = useWindows();
    const [viewingContent, setViewingContent] = useState<string | null>(initialContent !== undefined ? initialContent : null);
    const [viewingTitle, setViewingTitle] = useState<string>(initialTitle);
    const [viewingType, setViewingType] = useState<string>(initialType);



    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
    const [currentPath, setCurrentPath] = useState<string[]>(['System', 'Users', homeDir, 'Projects']);
    const [history, setHistory] = useState<string[][]>([['System', 'Users', homeDir, 'Projects']]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const { ismobile } = useDevice();

    const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file' | 'rename', initialValue?: string }>({ isOpen: false, type: 'create-folder' });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string } | null>(null);

    useEffect(() => {
        if (initialContent !== undefined) {
            setViewingContent(initialContent);
            setViewingTitle(initialTitle);
        }
    }, [initialContent, initialTitle]);

    useEffect(() => {
        const handleGlobalMenu = (e: CustomEvent) => {
            if (activewindow !== 'File Viewer') return;

            const action = e.detail.action;
            switch (action) {
                case 'New Folder':
                    setFileModal({ isOpen: true, type: 'create-folder' });
                    break;
                case 'New File':
                    setFileModal({ isOpen: true, type: 'create-file' });
                    break;
            }
        };

        window.addEventListener('menu-action' as any, handleGlobalMenu);
        return () => window.removeEventListener('menu-action' as any, handleGlobalMenu);
    }, [activewindow]);

    const getCurrentFiles = () => {
        let currentParentId = 'root';

        for (const folderName of currentPath) {
            const folder = files.find(f => f.name === folderName && f.parent === currentParentId && !f.isTrash);
            if (folder) currentParentId = folder.id;
        }

        return files.filter(f => f.parent === currentParentId && !f.isTrash);
    };

    const currentFiles = getCurrentFiles();

    const navigateTo = (path: string[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(path);
        setSelectedFile(null);
    };

    const navigateBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setCurrentPath(history[historyIndex - 1]);
            setSelectedFile(null);
        }
    };

    const navigateForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setCurrentPath(history[historyIndex + 1]);
            setSelectedFile(null);
        }
    };

    const fileViewerApp = apps.find(a => a.id === 'fileviewer');
    const acceptedTypes = fileViewerApp?.acceptedMimeTypes || [];

    const isFileSupported = (item: filesystemitem) => {
        return acceptedTypes.includes(item.mimetype);
    };

    const handleItemDoubleClick = (item: filesystemitem) => {
        if (item.mimetype === 'inode/directory') {
            navigateTo([...currentPath, item.name]);
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

    const handleContextMenu = (e: React.MouseEvent, fileId?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    };

    const handleModalConfirm = (inputValue: string) => {
        let currentParentId = 'root';
        for (const folderName of currentPath) {
            const folder = files.find(f => f.name === folderName && f.parent === currentParentId && !f.isTrash);
            if (folder) currentParentId = folder.id;
        }

        if (fileModal.type === 'create-folder') {
            createFolder(inputValue, currentParentId);
        } else if (fileModal.type === 'create-file') {
            createFile(inputValue, currentParentId);
        }
        setFileModal({ ...fileModal, isOpen: false });
    };

    const getContextMenuItems = () => {
        const activeFileItem = contextMenu?.fileId ? files.find(f => f.id === contextMenu?.fileId) : null;

        if (activeFileItem) {
            return [
                { label: 'Open', action: () => handleItemDoubleClick(activeFileItem) },
                { separator: true, label: '' },
                { label: 'Move to Trash', action: () => moveToTrash(activeFileItem.id), danger: true }
            ];
        } else {
            return [
                { label: 'New Folder', action: () => setFileModal({ isOpen: true, type: 'create-folder' }) },
                { label: 'New File', action: () => setFileModal({ isOpen: true, type: 'create-file' }) },
                { separator: true, label: '' },
                { label: 'Get Info', action: () => { } }
            ];
        }
    };


    if (viewingContent !== null) {
        return (
            <div className="flex flex-col h-full w-full bg-[--bg-base] text-[--text-color] font-mono">
                <div className="h-[50px] border-b border-[--border-color] flex items-center justify-between px-4 bg-surface draggable-region">
                    <div className={`flex items-center gap-2 `}>
                        <IoDocumentTextOutline className="text-[--text-muted]" />
                        <span className="text-sm font-semibold truncate">{viewingTitle}</span>
                    </div>
                    <button
                        onClick={handleOpenClick}
                        className="px-3 py-1 text-xs font-medium bg-overlay hover:bg-overlay transition"
                    >
                        Open...
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto w-full h-full bg-overlay">
                    {viewingType === 'application/pdf' ? (
                        <iframe
                            src={viewingContent}
                            className="w-full h-full border-none block"
                            title={viewingTitle}
                        />
                    ) : (
                        <div className="max-w-3xl mx-auto prose prose-sm p-8 bg-[--bg-base] min-h-full">
                            <ReactMarkdown>{viewingContent}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        );
    }



    return (
        <div
            className="flex h-full w-full bg-[--bg-base] text-[--text-color] font-mono overflow-hidden"
            onContextMenu={handleContextMenu}
            onClick={() => { setContextMenu(null); setSelectedFile(null); }}
        >
            <FileModal
                isOpen={fileModal.isOpen}
                type={fileModal.type}
                initialValue={fileModal.initialValue}
                onConfirm={handleModalConfirm}
                onCancel={() => setFileModal({ ...fileModal, isOpen: false })}
            />

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={getContextMenuItems()}
                    onClose={() => setContextMenu(null)}
                />
            )}

            <Sidebar
                currentPath={currentPath}
                onNavigate={navigateTo}
                className="hidden md:flex"
            />

            <div className="flex-1 flex flex-col min-w-0 bg-[--bg-base]">
                <div className="h-[50px] border-b border-[--border-color] flex items-center px-4 gap-4 bg-surface">
                    <div className="flex gap-2">
                        <button
                            onClick={navigateBack}
                            disabled={historyIndex <= 0}
                            className="text-[--text-muted] hover:text-[--text-color] disabled:opacity-30 disabled:hover:text-[--text-muted] transition-colors"
                        >
                            <IoChevronBack size={18} />
                        </button>
                        <button
                            onClick={navigateForward}
                            disabled={historyIndex >= history.length - 1}
                            className="text-[--text-muted] hover:text-[--text-color] disabled:opacity-30 disabled:hover:text-[--text-muted] transition-colors"
                        >
                            <IoChevronForward size={18} />
                        </button>
                    </div>

                    <div className="flex items-center bg-overlay p-0.5 border border-[--border-color]">
                        <button
                            onClick={() => setFileModal({ isOpen: true, type: 'create-folder' })}
                            className="p-1 hover:bg-overlay transition-colors text-[--text-muted]"
                            title="New Folder"
                        >
                            <IoFolderOpenOutline className="text-lg" />
                        </button>
                        <div className="w-[1px] h-4 bg-[--border-color] mx-1"></div>
                        <button
                            onClick={() => setFileModal({ isOpen: true, type: 'create-file' })}
                            className="p-1 hover:bg-overlay transition-colors text-[--text-muted]"
                            title="New File"
                        >
                            <IoDocumentTextOutline className="text-lg" />
                        </button>
                    </div>

                    <div className="flex-1 font-semibold text-sm text-center truncate px-2">
                        {currentPath[currentPath.length - 1]}
                    </div>
                    <div className="w-[60px]"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-0" onClick={() => setSelectedFile(null)}>
                    <div className="flex flex-col w-full">
                        <div className="flex items-center px-4 py-2 border-b border-[--border-color] text-xs text-[--text-muted] font-medium bg-surface">
                            <span className="flex-1">Name</span>
                            <span className="w-24 text-right">Date</span>
                            <span className="w-20 text-right">Size</span>
                            <span className="w-24 text-right">Kind</span>
                        </div>
                        {currentFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[--text-muted]">
                                <span className="text-4xl mb-2 opacity-50">folder_open</span>
                                <span className="text-sm">Empty Folder</span>
                            </div>
                        ) : (
                            currentFiles.map((item) => {
                                const supported = item.mimetype === 'inode/directory' || isFileSupported(item);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(item.name); }}
                                        onDoubleClick={(e) => { e.stopPropagation(); handleItemDoubleClick(item); }}
                                        onContextMenu={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e, item.id);
                                        }}
                                        className={`flex items-center px-4 py-1.5 border-b border-[--border-color] cursor-default text-xs
                                            ${selectedFile === item.name
                                                ? 'bg-accent text-[--text-color]'
                                                : 'hover:bg-overlay odd:bg-surface'
                                            }
                                            ${!supported ? 'opacity-50 grayscale' : ''}
                                        `}
                                    >
                                        <div className="w-5 h-5 mr-3 shrink-0 relative">
                                            {getFileIcon(item.mimetype, item.name, item.icon, item.id)}
                                        </div>
                                        <span className="flex-1 truncate font-medium">{item.name}</span>
                                        <span className={`w-24 text-right truncate ${selectedFile === item.name ? 'text-[--text-color]/80' : 'text-[--text-muted]'}`}>{item.date}</span>
                                        <span className={`w-20 text-right truncate ${selectedFile === item.name ? 'text-[--text-color]/80' : 'text-[--text-muted]'}`}>{item.size}</span>
                                        <span className={`w-24 text-right truncate ${selectedFile === item.name ? 'text-[--text-color]/80' : 'text-[--text-muted]'}`}>
                                            {item.mimetype === 'inode/directory' ? 'Folder' : item.mimetype.split('/')[1] || 'File'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-[--border-color] text-xs text-[--text-muted] flex justify-end gap-3 items-center bg-surface">
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="px-4 py-1.5 bg-overlay border border-[--border-color] hover:bg-overlay text-[--text-color] font-medium min-w-[80px]"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedFile || (() => {
                            const item = currentFiles.find(i => i.name === selectedFile);
                            return !item || (item.mimetype !== 'inode/directory' && !isFileSupported(item));
                        })()}
                        onClick={() => {
                            const item = currentFiles.find(i => i.name === selectedFile);
                            if (item) handleItemDoubleClick(item);
                        }}
                        className="px-4 py-1.5 bg-accent text-[--text-color] font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                    >
                        Open
                    </button>

                </div>
            </div>
        </div>
    );
}
