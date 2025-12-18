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

    const [currentPath, setCurrentPath] = useState<string[]>(['Macintosh HD', 'Users', 'Bala', 'Projects']);
    const [history, setHistory] = useState<string[][]>([['Macintosh HD', 'Users', 'Bala', 'Projects']]);
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
            <div className="flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sf">
                <div className="h-[50px] border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 bg-gray-50/50 dark:bg-[#282828] draggable-region">
                    <div className={`${ismobile ? 'ps-0' : 'ps-20'} flex items-center gap-2 `}>
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



    return (
        <div
            className="flex h-full w-full bg-[#f5f5f5] dark:bg-[#1e1e1e] text-black dark:text-white font-sf overflow-hidden"
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

            <div className={`w-[200px] bg-[#e3e3e3]/50 dark:bg-[#252526] border-r border-black/10 dark:border-white/10 flex flex-col pt-10 hidden md:flex`}>
                {sidebaritems.map((group, idx) => (
                    <div key={group.title || idx} className="mb-4">
                        <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase">{group.title}</div>
                        {group.items.map(loc => (
                            <div
                                key={loc.name}
                                onClick={(e) => { e.stopPropagation(); navigateTo(loc.path); }}
                                className={`mx-2 px-3 py-1.5 flex items-center gap-2 rounded-md cursor-pointer transition-colors ${JSON.stringify(currentPath) === JSON.stringify(loc.path) ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <loc.icon className="text-blue-500" />
                                <span className="text-sm">{loc.name}</span>
                            </div>
                        ))}
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

                    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                        <button
                            onClick={() => setFileModal({ isOpen: true, type: 'create-folder' })}
                            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                            title="New Folder"
                        >
                            <IoFolderOpenOutline className="text-lg" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button
                            onClick={() => setFileModal({ isOpen: true, type: 'create-file' })}
                            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-gray-600 dark:text-gray-300"
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
                        <div className="flex items-center px-4 py-2 border-b border-black/5 dark:border-white/5 text-xs text-gray-500 font-medium bg-gray-50 dark:bg-[#252526]">
                            <span className="flex-1">Name</span>
                            <span className="w-24 text-right">Date</span>
                            <span className="w-20 text-right">Size</span>
                            <span className="w-24 text-right">Kind</span>
                        </div>
                        {currentFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
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
                                        className={`flex items-center px-4 py-1.5 border-b border-black/5 dark:border-white/5 cursor-default text-xs
                                            ${selectedFile === item.name
                                                ? 'bg-[#007AFF] text-white'
                                                : 'hover:bg-black/5 dark:hover:bg-white/5 odd:bg-gray-50/50 dark:odd:bg-white/5'
                                            }
                                            ${!supported ? 'opacity-50 grayscale' : ''}
                                        `}
                                    >
                                        <div className="w-5 h-5 mr-3 shrink-0 relative">
                                            {getFileIcon(item.mimetype, item.name, item.icon)}
                                        </div>
                                        <span className="flex-1 truncate font-medium">{item.name}</span>
                                        <span className={`w-24 text-right truncate ${selectedFile === item.name ? 'text-white/80' : 'text-gray-500'}`}>{item.date}</span>
                                        <span className={`w-20 text-right truncate ${selectedFile === item.name ? 'text-white/80' : 'text-gray-500'}`}>{item.size}</span>
                                        <span className={`w-24 text-right truncate ${selectedFile === item.name ? 'text-white/80' : 'text-gray-500'}`}>
                                            {item.mimetype === 'inode/directory' ? 'Folder' : item.mimetype.split('/')[1] || 'File'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 text-xs text-gray-500 flex justify-end gap-3 items-center bg-gray-50 dark:bg-[#252526]">
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="px-4 py-1.5 rounded-md bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-700 font-medium min-w-[80px]"
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
                        className="px-4 py-1.5 rounded-md bg-[#007AFF] text-white font-medium shadow-sm hover:bg-[#007afe] disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                    >
                        Open
                    </button>

                </div>
            </div>
        </div>
    );
}
