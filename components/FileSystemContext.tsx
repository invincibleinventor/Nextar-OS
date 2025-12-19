'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { filesystemitem, generatefilesystem, getMimeTypeFromExtension } from './data';
import { useNotifications } from './NotificationContext';

interface FileSystemContextType {
    files: filesystemitem[];
    createFolder: (name: string, parentId: string) => string;
    createFile: (name: string, parentId: string, content?: string) => string;
    deleteItem: (id: string) => void;
    moveToTrash: (id: string) => void;
    restoreFromTrash: (id: string) => void;
    emptyTrash: () => void;
    renameItem: (id: string, newName: string) => void;
    moveItem: (id: string, newParentId: string) => void;
    refreshFileSystem: () => void;
    copyItem: (id: string | string[]) => void;
    cutItem: (id: string | string[]) => void;
    pasteItem: (parentId: string) => void;
    clipboard: { fileIds: string[]; operation: 'copy' | 'cut' } | null;
    updateFileContent: (id: string, content: string) => void;
    isLocked: (id: string) => boolean;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

const EDITABLE_ROOTS = ['user-desktop', 'user-bala', 'user-docs', 'user-downloads', 'root-trash'];

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<filesystemitem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { addToast } = useNotifications();
    const toastQueue = useRef<{ message: string; type: 'error' | 'success' }[]>([]);

    useEffect(() => {
        if (toastQueue.current.length > 0) {
            toastQueue.current.forEach(({ message, type }) => addToast(message, type));
            toastQueue.current = [];
        }
    });

    const queueToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
        toastQueue.current.push({ message, type });
    }, []);

    useEffect(() => {
        const savedFS = localStorage.getItem('macos-filesystem');
        const systemFiles = generatefilesystem();

        if (savedFS) {
            try {
                const parsedUserFiles: filesystemitem[] = JSON.parse(savedFS);
                const systemIds = new Set(systemFiles.map(f => f.id));
                const userFiles = parsedUserFiles
                    .filter(f => !f.isSystem && !systemIds.has(f.id))
                    .map(f => ({
                        ...f,
                        icon: typeof f.icon === 'string' ? f.icon : undefined
                    }));
                setFiles([...systemFiles, ...userFiles]);
            } catch (e) {
                console.error("Failed to parse filesystem from local storage", e);
                setFiles(systemFiles);
            }
        } else {
            setFiles(systemFiles);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        const userFiles = files
            .filter(f => !f.isSystem)
            .map(f => ({
                ...f,
                icon: typeof f.icon === 'string' ? f.icon : undefined
            }));

        localStorage.setItem('macos-filesystem', JSON.stringify(userFiles));
    }, [files, isInitialized]);

    const isLocked = useCallback((id: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(id)) return false;
        visited.add(id);

        const item = files.find(f => f.id === id);
        if (!item) return false;
        if (item.isReadOnly) return true;
        if (EDITABLE_ROOTS.includes(id)) return false;
        if (item.parent && !EDITABLE_ROOTS.includes(item.parent)) {
            return isLocked(item.parent, visited);
        }
        return false;
    }, [files]);

    const checkDuplicate = useCallback((name: string, parentId: string, excludeId?: string) => {
        return files.some(f => f.parent === parentId && f.name === name && f.id !== excludeId && !f.isTrash);
    }, [files]);

    const getUniqueName = useCallback((baseName: string, parentId: string) => {
        let name = baseName;
        let counter = 2;
        while (files.some(f => f.parent === parentId && f.name === name && !f.isTrash)) {
            name = `${baseName} ${counter}`;
            counter++;
        }
        return name;
    }, [files]);

    const createFolder = useCallback((name: string, parentId: string) => {
        if (isLocked(parentId)) {
            queueToast("Cannot create folder in a read-only directory.", "error");
            return "";
        }
        const finalName = getUniqueName(name, parentId);

        const newFolder: filesystemitem = {
            id: `folder-${Date.now()}`,
            name: finalName,
            parent: parentId,
            mimetype: 'inode/directory',
            date: 'Today',
            size: '--',
            isSystem: false,
            isReadOnly: false
        };
        setFiles(prev => [...prev, newFolder]);
        return newFolder.id;
    }, [isLocked, queueToast, getUniqueName]);

    const createFile = useCallback((name: string, parentId: string, content: string = '') => {
        if (isLocked(parentId)) {
            queueToast("Cannot create file in a read-only directory.", "error");
            return "";
        }

        const finalName = getUniqueName(name, parentId);
        const mimetype = getMimeTypeFromExtension(finalName);

        const newFile: filesystemitem = {
            id: `file-${Date.now()}`,
            name: finalName,
            parent: parentId,
            mimetype: mimetype,
            date: 'Today',
            size: '0 KB',
            content: content,
            isSystem: false,
            isReadOnly: false
        };
        setFiles(prev => [...prev, newFile]);
        return newFile.id;
    }, [isLocked, queueToast, getUniqueName]);

    const renameItem = useCallback((id: string, newName: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isReadOnly || item.isSystem) {
            queueToast("Cannot rename a read-only or system item.", "error");
            return;
        }

        if (!newName || newName.trim() === '') return;

        if (checkDuplicate(newName, item.parent || '', id)) {
            queueToast("Name already exists in this folder.", "error");
            return;
        }

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, name: newName };
            }
            return f;
        }));
    }, [files, queueToast, checkDuplicate]);

    const deleteItem = useCallback((id: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isSystem || isLocked(id)) {
            queueToast("Cannot delete system or locked files.", "error");
            return;
        }
        setFiles(prev => prev.filter(f => f.id !== id));
    }, [files, queueToast, isLocked]);

    const moveToTrash = useCallback((id: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isSystem || isLocked(id)) {
            queueToast("Cannot move system/locked files to trash.", "error");
            return;
        }

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, parent: 'root-trash', isTrash: true, originalParent: f.parent || 'user-desktop' };
            }
            return f;
        }));
    }, [files, queueToast, isLocked]);

    const restoreFromTrash = useCallback((id: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const targetParent = (f as any).originalParent || 'user-desktop';
                const { isTrash, originalParent, ...rest } = f as any;
                return { ...rest, parent: targetParent };
            }
            return f;
        }));
    }, []);

    const emptyTrash = useCallback(() => {
        setFiles(prev => prev.filter(f => f.parent !== 'root-trash'));
    }, []);

    const moveItem = useCallback((id: string, newParentId: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isSystem || isLocked(id)) {
            queueToast("Cannot move system or locked file.", "error");
            return;
        }
        if (isLocked(newParentId)) {
            queueToast("Cannot move into a read-only directory.", "error");
            return;
        }

        const newName = getUniqueName(item.name, newParentId);

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, parent: newParentId, name: newName };
            }
            return f;
        }));
    }, [files, queueToast, isLocked, getUniqueName]);

    const [clipboard, setClipboard] = useState<{ fileIds: string[]; operation: 'copy' | 'cut' } | null>(null);

    const copyItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        setClipboard({ fileIds: ids, operation: 'copy' });
    }, []);

    const cutItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        const lockedItems = ids.filter(fileId => isLocked(fileId) || files.find(f => f.id === fileId)?.isSystem);

        if (lockedItems.length > 0) {
            queueToast(`Cannot cut locked/system file(s).`, "error");
            return;
        }
        setClipboard({ fileIds: ids, operation: 'cut' });
    }, [queueToast, isLocked, files]);

    const pasteItem = useCallback((parentId: string) => {
        if (!clipboard) return;

        const { fileIds, operation } = clipboard;

        const filesToPaste = fileIds.map(id => files.find(f => f.id === id)).filter(Boolean) as filesystemitem[];
        if (filesToPaste.length === 0) return;

        if (isLocked(parentId)) {
            queueToast("Cannot paste into a locked directory.", "error");
            return;
        }

        if (operation === 'cut') {
            setFiles(prev => {
                return prev.map(f => {
                    if (fileIds.includes(f.id)) {
                        return { ...f, parent: parentId };
                    }
                    return f;
                });
            });
            setClipboard(null);
        } else if (operation === 'copy') {
            const allNewFiles: filesystemitem[] = [];

            const recursiveCopy = (sourceId: string, targetParentId: string, isRoot: boolean = false) => {
                const sourceItem = files.find(f => f.id === sourceId);
                if (!sourceItem) return;

                let newName = sourceItem.name;
                if (isRoot) {
                    const existingNames = [...files.filter(f => f.parent === parentId && !f.isTrash).map(f => f.name), ...allNewFiles.filter(f => f.parent === parentId).map(f => f.name)];
                    while (existingNames.includes(newName)) {
                        const match = newName.match(/^(.+) \((\d+)\)(\.[^.]+)?$/);
                        if (match) {
                            newName = `${match[1]} (${parseInt(match[2]) + 1})${match[3] || ''}`;
                        } else {
                            const extMatch = newName.match(/^(.+)(\.[^.]+)$/);
                            if (extMatch) {
                                newName = `${extMatch[1]} (2)${extMatch[2]}`;
                            } else {
                                newName = `${newName} (2)`;
                            }
                        }
                    }
                }

                const newId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const iconToUse = typeof sourceItem.icon === 'string' ? sourceItem.icon : undefined;

                const newItem: filesystemitem = {
                    ...sourceItem,
                    id: newId,
                    name: newName,
                    parent: targetParentId,
                    date: 'Today',
                    isSystem: false,
                    isReadOnly: false,
                    isTrash: false,
                    originalParent: undefined,
                    icon: iconToUse,
                };

                allNewFiles.push(newItem);

                if (sourceItem.mimetype === 'inode/directory') {
                    const children = files.filter(f => f.parent === sourceId && !f.isTrash);
                    children.forEach(child => recursiveCopy(child.id, newId, false));
                }
            };

            filesToPaste.forEach(fileToPaste => recursiveCopy(fileToPaste.id, parentId, true));

            setFiles(prev => [...prev, ...allNewFiles]);
            setClipboard(null);
        }
    }, [clipboard, files, isLocked, queueToast]);

    const updateFileContent = useCallback((id: string, content: string) => {
        if (isLocked(id)) {
            queueToast("Cannot modify locked file.", "error");
            return;
        }
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, content: content };
            }
            return f;
        }));
    }, [queueToast, isLocked]);

    const refreshFileSystem = useCallback(() => {
        const savedFS = localStorage.getItem('macos-filesystem');
        if (savedFS) {
            try {
                const parsedUserFiles: filesystemitem[] = JSON.parse(savedFS);
                const systemFiles = generatefilesystem();
                const systemIds = new Set(systemFiles.map(f => f.id));
                const userFiles = parsedUserFiles
                    .filter(f => !f.isSystem && !systemIds.has(f.id))
                    .map(f => ({
                        ...f,
                        icon: typeof f.icon === 'string' ? f.icon : undefined
                    }));
                setFiles([...systemFiles, ...userFiles]);
            } catch (e) { console.error(e); }
        } else {
            setFiles(generatefilesystem());
        }
    }, []);

    return (
        <FileSystemContext.Provider value={{ files, createFolder, createFile, deleteItem, moveToTrash, restoreFromTrash, emptyTrash, renameItem, moveItem, refreshFileSystem, copyItem, cutItem, pasteItem, clipboard, updateFileContent, isLocked }}>
            {children}
        </FileSystemContext.Provider>
    );
};

export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (context === undefined) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
};
