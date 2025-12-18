'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<filesystemitem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { addToast } = useNotifications();



    useEffect(() => {
        const savedFS = localStorage.getItem('macos-filesystem');
        const systemFiles = generatefilesystem();

        if (savedFS) {
            try {
                const parsedUserFiles: filesystemitem[] = JSON.parse(savedFS);

                const systemIds = new Set(systemFiles.map(f => f.id));

                const userFiles = parsedUserFiles
                    .filter(f => !f.isSystem && !systemIds.has(f.id))
                    .map(f => {
                        const { icon, ...rest } = f;
                        return rest as filesystemitem;
                    });

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
            .map(f => {
                const { icon, ...rest } = f;
                return rest;
            });

        localStorage.setItem('macos-filesystem', JSON.stringify(userFiles));
    }, [files, isInitialized]);



    const isLocked = useCallback((id: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(id)) return false;
        visited.add(id);

        const item = files.find(f => f.id === id);
        if (!item) return false;
        if (item.isReadOnly) return true;
        if (item.parent) {
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
            addToast("Cannot create folder in a read-only directory.", "error");
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
    }, [isLocked, addToast, getUniqueName]);

    const createFile = useCallback((name: string, parentId: string, content: string = '') => {
        if (isLocked(parentId)) {
            addToast("Cannot create file in a read-only directory.", "error");
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
    }, [isLocked, addToast, getUniqueName]);

    const renameItem = useCallback((id: string, newName: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isReadOnly) {
            addToast("Cannot rename a read-only item.", "error");
            return;
        }

        if (!newName || newName.trim() === '') return;

        if (checkDuplicate(newName, item.parent || '', id)) {
            addToast("Name already exists in this folder.", "error");
            return;
        }

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, name: newName };
            }
            return f;
        }));
    }, [files, addToast, checkDuplicate]);

    const deleteItem = useCallback((id: string) => {
        setFiles(prev => {
            const item = prev.find(f => f.id === id);
            if (!item) return prev;

            if (item.isSystem || isLocked(id)) {
                addToast("Cannot delete system or locked files.", "error");
                return prev;
            }
            return prev.filter(f => f.id !== id);
        });
    }, [addToast, isLocked]);

    const moveToTrash = useCallback((id: string) => {
        setFiles(prev => {
            const item = prev.find(f => f.id === id);
            if (!item) return prev;

            if (item.isSystem || isLocked(id)) {
                addToast("Cannot move key system/locked files to trash.", "error");
                return prev;
            }

            return prev.map(f => {
                if (f.id === id) {
                    return { ...f, parent: 'root-trash', isTrash: true, originalParent: f.parent || 'root-desktop' };
                }
                return f;
            });
        });
    }, [addToast, isLocked]);


    const restoreFromTrash = useCallback((id: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                const targetParent = (f as any).originalParent || 'root-desktop';
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
        setFiles(prev => {
            const item = prev.find(f => f.id === id);
            if (!item) return prev;

            if (item.isSystem || isLocked(id)) {
                addToast("Cannot move system or locked file.", "error");
                return prev;
            }
            if (isLocked(newParentId)) {
                addToast("Cannot move into a read-only directory.", "error");
                return prev;
            }
            return prev.map(f => {
                if (f.id === id) {
                    return { ...f, parent: newParentId };
                }
                return f;
            });
        });
    }, [addToast, isLocked]);



    const [clipboard, setClipboard] = useState<{ fileIds: string[]; operation: 'copy' | 'cut' } | null>(null);

    const copyItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        setClipboard({ fileIds: ids, operation: 'copy' });
    }, []);

    const cutItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        const lockedItems = ids.filter(fileId => isLocked(fileId));

        if (lockedItems.length > 0) {
            addToast(`Cannot cut locked file(s): ${lockedItems.length} item(s) locked.`, "error");
            return;
        }
        setClipboard({ fileIds: ids, operation: 'cut' });
    }, [addToast, isLocked]);

    const pasteItem = useCallback((parentId: string) => {
        if (!clipboard) return;

        const { fileIds, operation } = clipboard;

        const filesToPaste = fileIds.map(id => files.find(f => f.id === id)).filter(Boolean) as filesystemitem[];
        if (filesToPaste.length === 0) return;

        if (operation === 'cut') {
            if (isLocked(parentId)) {
                addToast("Cannot move into a locked directory.", "error");
                return;
            }

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
                    const exists = files.some(f => f.parent === parentId && f.name === newName && !f.isTrash) || allNewFiles.some(f => f.parent === parentId && f.name === newName);
                    if (exists) {
                        newName = `Copy of ${newName}`;
                    }
                }

                const newId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const newItem: filesystemitem = {
                    ...sourceItem,
                    id: newId,
                    parent: targetParentId,
                    name: newName,
                    date: 'Today',
                    isSystem: false,
                    isReadOnly: false,
                    isTrash: false,
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
    }, [clipboard, files, isLocked, addToast]);

    const updateFileContent = useCallback((id: string, content: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                if (isLocked(id)) {
                    addToast("Cannot modify locked file.", "error");
                    return f;
                }
                return { ...f, content: content };
            }
            return f;
        }));
    }, [addToast, isLocked]);

    const refreshFileSystem = useCallback(() => {
        const savedFS = localStorage.getItem('macos-filesystem');
        if (savedFS) {
            try {
                const parsedUserFiles: filesystemitem[] = JSON.parse(savedFS);
                const systemFiles = generatefilesystem();
                const systemIds = new Set(systemFiles.map(f => f.id));
                const userFiles = parsedUserFiles.filter(f => !f.isSystem && !systemIds.has(f.id)).map(f => {
                    const { icon, ...rest } = f;
                    return rest as filesystemitem;
                });
                setFiles([...systemFiles, ...userFiles]);
            } catch (e) { console.error(e); }
        } else {
            setFiles(generatefilesystem());
        }
    }, []);

    return (
        <FileSystemContext.Provider value={{ files, createFolder, createFile, deleteItem, moveToTrash, restoreFromTrash, emptyTrash, renameItem, moveItem, refreshFileSystem, copyItem, cutItem, pasteItem, clipboard, updateFileContent }}>
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
