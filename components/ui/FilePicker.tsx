
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="w-[600px] h-[400px] bg-white dark:bg-[#282828] rounded-xl shadow-2xl flex flex-col font-sf overflow-hidden border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
                <div className="h-10 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-3 bg-gray-50 dark:bg-[#333]">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button onClick={handleBack} disabled={currentPath.length === 0} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded disabled:opacity-30">
                                <IoChevronBack />
                            </button>
                        </div>
                        <span className="font-semibold text-sm ml-2">{currentPath[currentPath.length - 1] || 'Home'}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{mode === 'open' ? 'Open File' : 'Save File'}</span>
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
                    <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-[#1e1e1e]">
                        <div className="flex flex-col w-full">
                            <div className="sticky top-0 z-10 flex items-center px-4 py-2 border-b border-gray-200 dark:border-white/10 text-xs text-gray-500 font-medium bg-gray-50 dark:bg-[#333]">
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
                                            className={`flex items-center px-4 py-1.5 border-b border-gray-100 dark:border-white/5 cursor-default text-xs
                                                ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5'}
                                                ${isDimmed ? 'opacity-30' : ''}
                                            `}
                                        >
                                            <div className="w-5 h-5 mr-3 shrink-0 flex items-center justify-center text-lg">
                                                {getFileIcon(file.mimetype, file.name, file.icon, file.id)}
                                            </div>
                                            <span className="flex-1 truncate font-medium">{file.name}</span>
                                            <span className={`w-24 text-right truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{file.date}</span>
                                            <span className={`w-20 text-right truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{file.size}</span>
                                            <span className={`w-24 text-right truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                                {file.mimetype === 'inode/directory' ? 'Folder' : file.mimetype.split('/')[1] || 'File'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="p-3 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#333] flex items-center gap-3">
                    {mode === 'save' && (
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-medium">Name:</span>
                            <input
                                className="flex-1 bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                                value={saveFileName}
                                onChange={e => setSaveFileName(e.target.value)}
                                placeholder="Untitled"
                                autoFocus
                            />
                        </div>
                    )}
                    {mode === 'open' && <div className="flex-1"></div>}

                    <div className="flex items-center gap-2">
                        <button onClick={onCancel} className="px-3 py-1 bg-gray-200 dark:bg-white/10 rounded text-xs font-medium hover:bg-gray-300 dark:hover:bg-white/20">Cancel</button>
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirmDisabled()}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mode === 'open' ? 'Open' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
