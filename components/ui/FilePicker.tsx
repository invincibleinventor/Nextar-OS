
import React, { useState, useMemo } from 'react';
import { useFileSystem } from '../FileSystemContext';
import { filesystemitem, getFileIcon } from '../data';
import { useAuth } from '../AuthContext';
import {
    IoFolderOutline, IoChevronBack, IoDesktopOutline,
    IoDocumentTextOutline, IoDownloadOutline, IoAppsOutline,
    IoTrashOutline, IoTrash, IoServerOutline
} from 'react-icons/io5';
import { useIsClay } from '../hooks/useIsClay';
import { glassPanel, glassSidebar, glassInput, glassButton } from '../hooks/useClayStyles';

interface FilePickerProps {
    mode: 'open' | 'save';
    initialPath?: string[];
    onSelect: (item: filesystemitem | null, saveName?: string) => void;
    onCancel: () => void;
    acceptedMimeTypes?: string[];
}

export default function FilePicker({ mode, initialPath, onSelect, onCancel, acceptedMimeTypes }: FilePickerProps) {
    const clay = useIsClay();
    const { files, currentUserTrashId } = useFileSystem();
    const { user, isGuest } = useAuth();
    const username = user?.username || 'guest';
    const homeDir = isGuest ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

    const [currentPath, setCurrentPath] = useState<string[]>(initialPath || ['Disk Drive', 'Users', homeDir, 'Desktop']);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [saveFileName, setSaveFileName] = useState('');
    const [isTrashView, setIsTrashView] = useState(false);

    const trashHasItems = useMemo(() => {
        return files.some(f => f.parent === currentUserTrashId);
    }, [files, currentUserTrashId]);

    const sidebarItems = useMemo(() => [
        {
            title: 'Favorites',
            items: [
                { name: 'Desktop', icon: IoDesktopOutline, path: ['Disk Drive', 'Users', homeDir, 'Desktop'], color: 'var(--pastel-blue)' },
                { name: 'Documents', icon: IoDocumentTextOutline, path: ['Disk Drive', 'Users', homeDir, 'Documents'], color: 'var(--pastel-green)' },
                { name: 'Downloads', icon: IoDownloadOutline, path: ['Disk Drive', 'Users', homeDir, 'Downloads'], color: 'var(--pastel-peach)' },
                { name: 'Projects', icon: IoFolderOutline, path: ['Disk Drive', 'Users', homeDir, 'Projects'], color: 'var(--pastel-mauve)' },
                { name: 'Applications', icon: IoAppsOutline, path: ['Disk Drive', 'Applications'], color: 'var(--pastel-red)' },
            ]
        },
        {
            title: 'Locations',
            items: [
                { name: 'Disk Drive', icon: IoServerOutline, path: ['Disk Drive'], color: 'var(--text-muted)' },
            ]
        },
    ], [homeDir]);

    const isPathActive = (itemPath: string[]) => {
        if (isTrashView) return false;
        return JSON.stringify(currentPath) === JSON.stringify(itemPath);
    };

    const getCurrentFiles = () => {
        if (isTrashView) {
            return files.filter(f => f.parent === currentUserTrashId);
        }
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
        if (isTrashView) {
            setIsTrashView(false);
            setSelectedFile(null);
            return;
        }
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
            setSelectedFile(null);
        }
    };

    const handleSidebarClick = (path: string[]) => {
        setIsTrashView(false);
        setCurrentPath(path);
        setSelectedFile(null);
    };

    const handleTrashClick = () => {
        setIsTrashView(true);
        setSelectedFile(null);
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

    const currentTitle = isTrashView ? 'Trash' : (currentPath[currentPath.length - 1] || 'Home');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[--bg-base]/80 p-4">
            <div
                className={`w-[660px] h-[440px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
                    ${clay
                        ? 'rounded-[16px] border border-[--glass-border]'
                        : 'bg-surface font-mono border border-[--border-color]'
                    }`}
                style={clay ? glassPanel : undefined}
            >
                {/* Toolbar */}
                <div className={`h-10 border-b flex items-center justify-between px-3 shrink-0
                    ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}
                    style={clay ? { background: 'var(--bg-glass)' } : undefined}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBack}
                            disabled={currentPath.length === 0 && !isTrashView}
                            className={`p-1 disabled:opacity-30 transition-all
                                ${clay
                                    ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                    : 'hover:bg-overlay'
                                }`}
                        >
                            <IoChevronBack className="text-[16px]" />
                        </button>
                        {!isTrashView ? (
                            <div className={`flex items-center gap-0.5 ml-1 min-w-0 overflow-hidden ${clay ? 'rounded-[12px] px-2 py-0.5' : ''}`}
                                style={clay ? { ...glassInput, boxShadow: 'none' } : undefined}
                            >
                                {currentPath.map((seg, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-[--text-muted] text-xs opacity-40 shrink-0">/</span>}
                                        <button
                                            onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                                            className={`text-[13px] shrink-0 px-1.5 py-0.5 transition-colors truncate max-w-[120px]
                                                ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}
                                                ${i === currentPath.length - 1 ? 'font-semibold text-[--text-color]' : 'text-[--text-muted]'}`}
                                        >
                                            {seg}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <span className="font-semibold text-[13px] ml-1 text-[--text-color]">Trash</span>
                        )}
                    </div>
                    <span className="text-xs font-medium text-[--text-muted]">{mode === 'open' ? 'Open File' : 'Save File'}</span>
                </div>

                {/* Body: sidebar + file list */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Inline sidebar */}
                    <div
                        className={`relative shrink-0 flex flex-col pt-3 h-full overflow-y-auto
                            ${clay ? 'w-[170px]' : 'w-[160px] bg-surface border-r border-[--border-color]'}`}
                        style={clay ? glassSidebar : undefined}
                    >
                        <div className="px-2 flex-1">
                            {sidebarItems.map((group, idx) => (
                                <div key={idx} className="mb-3">
                                    {group.title && (
                                        <div className="px-2 mb-1 text-[10px] font-bold text-[--text-muted] uppercase tracking-wide">
                                            {group.title}
                                        </div>
                                    )}
                                    <div className={clay ? 'space-y-0.5' : 'space-y-0.5'}>
                                        {group.items.map((item, i) => {
                                            const active = isPathActive(item.path);
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => handleSidebarClick(item.path)}
                                                    className={`
                                                        group flex items-center cursor-pointer transition-all
                                                        ${clay ? 'gap-2.5 px-2.5 py-2 rounded-[10px]' : 'gap-2.5 px-2.5 py-1.5'}
                                                        ${active
                                                            ? clay ? 'text-white' : 'bg-accent text-[--bg-base]'
                                                            : clay
                                                                ? 'text-[--text-color] hover:bg-[--bg-glass-hover] active:scale-[0.98]'
                                                                : 'text-[--text-color] hover:bg-overlay'
                                                        }
                                                    `}
                                                    style={active && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    <div
                                                        className={`${clay ? 'w-[22px] h-[22px] rounded-[6px]' : 'w-[18px] h-[18px] rounded-[4px]'} flex items-center justify-center shrink-0`}
                                                        style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : item.color }}
                                                    >
                                                        <item.icon size={clay ? 12 : 11} className="text-white" />
                                                    </div>
                                                    <span className={`${clay ? 'text-[13px]' : 'text-[12px]'} font-medium leading-none truncate`}>{item.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Trash item */}
                            <div
                                onClick={handleTrashClick}
                                className={`flex items-center cursor-pointer transition-all mt-2
                                    ${clay ? 'gap-2.5 px-2.5 py-2 rounded-[10px]' : 'gap-2.5 px-2.5 py-1.5'}
                                    ${isTrashView
                                        ? clay ? 'text-white' : 'bg-accent text-[--bg-base]'
                                        : clay
                                            ? 'text-[--text-muted] hover:bg-[--bg-glass-hover] active:scale-[0.98]'
                                            : 'text-[--text-muted] hover:bg-overlay'
                                    }`}
                                style={isTrashView && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <div
                                    className={`${clay ? 'w-[22px] h-[22px] rounded-[6px]' : 'w-[18px] h-[18px] rounded-[4px]'} flex items-center justify-center shrink-0`}
                                    style={{ backgroundColor: isTrashView ? 'rgba(255,255,255,0.25)' : 'var(--pastel-red)' }}
                                >
                                    {trashHasItems
                                        ? <IoTrash size={clay ? 12 : 11} className="text-white" />
                                        : <IoTrashOutline size={clay ? 12 : 11} className="text-white" />
                                    }
                                </div>
                                <span className={`${clay ? 'text-[13px]' : 'text-[12px]'} font-medium leading-none`}>Trash</span>
                            </div>
                        </div>
                    </div>

                    {/* File list */}
                    <div className={`flex-1 overflow-y-auto ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                        <div className="flex flex-col w-full">
                            {/* Column headers */}
                            <div className={`sticky top-0 z-10 flex items-center px-4 py-2 border-b text-xs text-[--text-muted] font-medium
                                ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}
                                style={clay ? { background: 'var(--bg-glass)' } : undefined}
                            >
                                <span className="flex-1">Name</span>
                                <span className="w-24 text-right">Date</span>
                                <span className="w-16 text-right">Size</span>
                                <span className="w-20 text-right">Kind</span>
                            </div>

                            {/* File rows */}
                            <div className="flex flex-col">
                                {currentFiles.length === 0 && (
                                    <div className="flex items-center justify-center h-32 text-[--text-muted] text-xs">
                                        {isTrashView ? 'Trash is empty' : 'This folder is empty'}
                                    </div>
                                )}
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
                                            className={`flex items-center px-4 py-1.5 cursor-default text-xs transition-all
                                                ${clay ? '' : 'border-b border-[--border-color]'}
                                                ${isSelected
                                                    ? clay
                                                        ? 'text-white rounded-[8px] mx-1'
                                                        : 'bg-accent text-[--bg-base]'
                                                    : clay
                                                        ? 'hover:bg-[--bg-glass-hover] rounded-[8px] mx-1'
                                                        : 'hover:bg-overlay'
                                                }
                                                ${isDimmed ? 'opacity-30' : ''}
                                            `}
                                            style={isSelected && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                        >
                                            <div className="w-5 h-5 mr-3 shrink-0 flex items-center justify-center text-lg relative overflow-hidden rounded-[4px]">
                                                {getFileIcon(file.mimetype, file.name, file.icon, file.id, file.content || file.link)}
                                            </div>
                                            <span className="flex-1 truncate font-medium">{file.name}</span>
                                            <span className={`w-24 text-right truncate ${isSelected ? (clay ? 'text-white/70' : 'text-[--bg-base]') : 'text-[--text-muted]'}`}>{file.date}</span>
                                            <span className={`w-16 text-right truncate ${isSelected ? (clay ? 'text-white/70' : 'text-[--bg-base]') : 'text-[--text-muted]'}`}>{file.size}</span>
                                            <span className={`w-20 text-right truncate ${isSelected ? (clay ? 'text-white/70' : 'text-[--bg-base]') : 'text-[--text-muted]'}`}>
                                                {file.mimetype === 'inode/directory' ? 'Folder' : file.mimetype.split('/')[1] || 'File'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: save input + buttons */}
                <div className={`p-3 border-t flex items-center gap-3 shrink-0
                    ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}
                    style={clay ? { background: 'var(--bg-glass)' } : undefined}
                >
                    {mode === 'save' && (
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-medium text-[--text-color]">Name:</span>
                            <input
                                className={`flex-1 px-2 py-1 text-[13px] outline-none text-[--text-color]
                                    ${clay
                                        ? 'rounded-[10px] border border-[--glass-border] focus:border-accent'
                                        : 'bg-overlay border border-[--border-color] focus:border-accent'
                                    }`}
                                style={clay ? glassInput : undefined}
                                value={saveFileName}
                                onChange={e => setSaveFileName(e.target.value)}
                                placeholder="Untitled"
                                autoFocus
                            />
                        </div>
                    )}
                    {mode === 'open' && <div className="flex-1" />}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className={`px-3 py-1.5 text-xs font-medium text-[--text-color] transition-all
                                ${clay
                                    ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                    : 'bg-overlay border border-[--border-color] hover:bg-overlay'
                                }`}
                            style={clay ? glassButton : undefined}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirmDisabled()}
                            className={`px-3 py-1.5 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all
                                ${clay
                                    ? 'rounded-[12px] hover:opacity-90 active:scale-[0.97]'
                                    : 'bg-accent text-[--bg-base] hover:opacity-80'
                                }`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            {mode === 'open' ? 'Open' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
