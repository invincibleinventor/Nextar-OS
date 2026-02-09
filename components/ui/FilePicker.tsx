
import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { apps, filesystemitem, getFileIcon, sidebaritems } from '../data';
import { useAuth } from '../AuthContext';
import { IoFolderOutline, IoChevronBack, IoClose, IoChevronForward } from 'react-icons/io5';
import Sidebar from './Sidebar';

interface FilePickerProps {
    mode: 'open' | 'save';
    initialPath?: string[];
    onSelect: (item: filesystemitem | null, saveName?: string) => void;
    onCancel: () => void;
    acceptedMimeTypes?: string[];
}

export default function FilePicker({ mode, initialPath, onSelect, onCancel, acceptedMimeTypes }: FilePickerProps) {
    const { files, createFolder } = useFileSystem();
    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
    const [currentPath, setCurrentPath] = useState<string[]>(initialPath || ['System', 'Users', homeDir, 'Projects']);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState('');

    const getCurrentFiles = () => {
        let currentParentId = 'root';
        for (const folderName of currentPath) {
            const folder = files.find(i => i.name === folderName && i.parent === currentParentId && !i.isTrash);
            if (folder) currentParentId = folder.id;
        }

        return files.filter(f => f.parent === currentParentId && !f.isTrash);
    };

    const currentFiles = getCurrentFiles();

    const handleNavigate = (folder: filesystemitem) => {
        setCurrentPath([...currentPath, folder.name]);
        setSelectedFile(null);
    };

    const handleBack = () => {
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
            setSelectedFile(null);
        }
    };

    const handleConfirm = () => {
        if (mode === 'open') {
            if (selectedFile) {
                const file = currentFiles.find(f => f.name === selectedFile);
                if (file) onSelect(file);
            }
        } else {
            let currentParentId = 'root';
            let currentParentItem: filesystemitem | null = null;
            for (const folderName of currentPath) {
                const folder = files.find(i => i.name === folderName && i.parent === currentParentId && !i.isTrash);
                if (folder) {
                    currentParentId = folder.id;
                    currentParentItem = folder;
                }
            }

            onSelect(currentParentItem, saveFileName);
        }
    };

    const isConfirmDisabled = () => {
        if (mode === 'open') return !selectedFile;
        if (mode === 'save') return !saveFileName;
        return false;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[--bg-base]/80 p-4">
            <div className="w-[600px] h-[400px] bg-surface flex flex-col font-mono overflow-hidden border border-[--border-color] animate-in zoom-in-95 duration-200">
                <div className="h-10 border-b border-[--border-color] flex items-center justify-between px-3 bg-overlay">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button onClick={handleBack} disabled={currentPath.length === 0} className="p-1 hover:bg-overlay disabled:opacity-30">
                                <IoChevronBack />
                            </button>
                        </div>
                        <span className="font-semibold text-sm ml-2">{currentPath[currentPath.length - 1] || 'Home'}</span>
                    </div>
                    <span className="text-xs font-medium text-[--text-muted]">{mode === 'open' ? 'Open File' : 'Save File'}</span>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <Sidebar
                        currentPath={currentPath}
                        onNavigate={(path) => {
                            setCurrentPath(path);
                            setSelectedFile(null);
                        }}
                        className="!w-[140px] text-xs"
                        isOverlay={false}
                    />
                    <div className="flex-1 overflow-y-auto p-0 bg-[--bg-base]">
                        <div className="flex flex-col w-full">
                            <div className="sticky top-0 z-10 flex items-center px-4 py-2 border-b border-[--border-color] text-xs text-[--text-muted] font-medium bg-overlay">
                                <span className="flex-1">Name</span>
                                <span className="w-24 text-right">Date</span>
                                <span className="w-20 text-right">Size</span>
                                <span className="w-24 text-right">Kind</span>
                            </div>
                            <div className="flex flex-col">
                                {currentFiles.map((file) => {
                                    const isFolder = file.mimetype === 'inode/directory';
                                    const isSelected = selectedFile === file.name;
                                    const isDimmed = !isFolder && mode === 'open' && acceptedMimeTypes && !acceptedMimeTypes.includes(file.mimetype);

                                    return (
                                        <div
                                            key={file.id}
                                            onClick={() => {
                                                if (isDimmed) return;
                                                if (isSelected && isFolder) {
                                                    handleNavigate(file);
                                                } else {
                                                    setSelectedFile(file.name);
                                                    if (mode === 'save' && !isFolder) {
                                                        setSaveFileName(file.name);
                                                    }
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (isFolder) handleNavigate(file);
                                                else if (!isDimmed && mode === 'open') {
                                                    setSelectedFile(file.name);
                                                    handleConfirm();
                                                }
                                            }}
                                            className={`flex items-center px-4 py-1.5 border-b border-[--border-color] cursor-default text-xs
                                                ${isSelected ? 'bg-accent text-[--bg-base]' : 'hover:bg-overlay'}
                                                ${isDimmed ? 'opacity-30' : ''}
                                            `}
                                        >
                                            <div className="w-5 h-5 mr-3 shrink-0 flex items-center justify-center text-lg">
                                                {getFileIcon(file.mimetype, file.name, file.icon, file.id, file.content || file.link)}
                                            </div>
                                            <span className="flex-1 truncate font-medium">{file.name}</span>
                                            <span className={`w-24 text-right truncate ${isSelected ? 'text-[--bg-base]/80' : 'text-[--text-muted]'}`}>{file.date}</span>
                                            <span className={`w-20 text-right truncate ${isSelected ? 'text-[--bg-base]/80' : 'text-[--text-muted]'}`}>{file.size}</span>
                                            <span className={`w-24 text-right truncate ${isSelected ? 'text-[--bg-base]/80' : 'text-[--text-muted]'}`}>
                                                {file.mimetype === 'inode/directory' ? 'Folder' : file.mimetype.split('/')[1] || 'File'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="p-3 border-t border-[--border-color] bg-overlay flex items-center gap-3">
                    {mode === 'save' && (
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-medium">Name:</span>
                            <input
                                className="flex-1 bg-overlay border border-[--border-color] px-2 py-1 text-sm outline-none focus:border-accent"
                                value={saveFileName}
                                onChange={e => setSaveFileName(e.target.value)}
                                placeholder="Untitled"
                                autoFocus
                            />
                        </div>
                    )}
                    {mode === 'open' && <div className="flex-1"></div>}

                    <div className="flex items-center gap-2">
                        <button onClick={onCancel} className="px-3 py-1 bg-overlay border border-[--border-color] text-xs font-medium hover:bg-overlay text-[--text-color]">Cancel</button>
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirmDisabled()}
                            className="px-3 py-1 bg-accent text-[--bg-base] text-xs font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mode === 'open' ? 'Open' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
