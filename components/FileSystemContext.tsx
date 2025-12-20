'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { filesystemitem, generateGuestFilesystem, generateUserFilesystem, generateSystemFilesystem, getMimeTypeFromExtension } from './data';
import { useNotifications } from './NotificationContext';
import { initDB, getAllFiles, saveFile, deleteFile, getUsers } from '../utils/db';
import { useAuth } from './AuthContext';

interface FileSystemContextType {
    files: filesystemitem[];
    createFolder: (name: string, parentId: string) => Promise<string>;
    createFile: (name: string, parentId: string, content?: string) => Promise<string>;
    deleteItem: (id: string) => Promise<void>;
    moveToTrash: (id: string) => Promise<void>;
    restoreFromTrash: (id: string) => Promise<void>;
    emptyTrash: () => Promise<void>;
    renameItem: (id: string, newName: string) => Promise<void>;
    moveItem: (id: string, newParentId: string) => Promise<void>;
    refreshFileSystem: () => void;
    copyItem: (id: string | string[]) => void;
    cutItem: (id: string | string[]) => void;
    pasteItem: (parentId: string) => Promise<void>;
    clipboard: { fileIds: string[]; operation: 'copy' | 'cut' } | null;
    updateFileContent: (id: string, content: string) => Promise<void>;
    isLocked: (id: string) => boolean;
    isLoading: boolean;
    currentUserDesktopId: string;
    currentUserDocsId: string;
    currentUserDownloadsId: string;
    currentUserTrashId: string;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<filesystemitem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useNotifications();
    const { user, isLoading: authLoading } = useAuth();

    const isGuest = user?.username === 'guest';
    const isAdmin = user?.role === 'admin';
    const username = user?.username || 'guest';

    const currentUserDesktopId = isGuest ? 'guest-desktop' : `user-${username}-desktop`;
    const currentUserDocsId = isGuest ? 'guest-docs' : `user-${username}-docs`;
    const currentUserDownloadsId = isGuest ? 'guest-downloads' : `user-${username}-downloads`;
    const currentUserTrashId = isGuest ? 'guest-trash' : `user-${username}-trash`;

    useEffect(() => {
        const initializeFS = async () => {
            if (authLoading) return;

            setIsLoading(true);

            if (isGuest) {
                setFiles(generateGuestFilesystem());
                setIsLoading(false);
                return;
            }

            try {
                await initDB();
                const systemFiles = generateSystemFilesystem();
                const dbFiles = await getAllFiles();

                let visibleFiles: filesystemitem[] = [...systemFiles];

                if (isAdmin) {
                    const allUsers = await getUsers();
                    for (const u of allUsers) {
                        const userBaseFs = generateUserFilesystem(u.username);
                        const userDbFiles = dbFiles.filter(f => f.owner === u.username);
                        const uniqueUserDb = userDbFiles.filter(dbf => !userBaseFs.some(sf => sf.id === dbf.id));
                        visibleFiles = [...visibleFiles, ...userBaseFs, ...uniqueUserDb];
                    }
                    const guestFs = generateGuestFilesystem().filter(f => f.owner === 'guest');
                    visibleFiles = [...visibleFiles, ...guestFs];
                } else {
                    const userBaseFs = generateUserFilesystem(username);
                    const userDbFiles = dbFiles.filter(f => f.owner === username);
                    const uniqueUserDb = userDbFiles.filter(dbf => !userBaseFs.some(sf => sf.id === dbf.id));
                    visibleFiles = [...visibleFiles, ...userBaseFs, ...uniqueUserDb];
                }

                setFiles(visibleFiles);
            } catch (error) {
                console.error("Failed to initialize filesystem:", error);
                setFiles(generateGuestFilesystem());
            } finally {
                setIsLoading(false);
            }
        };

        initializeFS();
    }, [user, authLoading, isGuest, isAdmin, username]);

    const persistFile = async (file: filesystemitem) => {
        if (isGuest) return;
        await saveFile(file);
    };

    const persistDelete = async (id: string) => {
        if (isGuest) return;
        await deleteFile(id);
    };


    const isLocked = useCallback((id: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(id)) return false;
        visited.add(id);

        const item = files.find(f => f.id === id);
        if (!item) return false;

        if (isAdmin) {
            return false;
        }

        if (isGuest) {
            if (item.owner && item.owner !== 'guest' && item.owner !== 'system') {
                return true;
            }
            return false;
        }

        if (item.owner && item.owner !== username && item.owner !== 'system') {
            return true;
        }

        return false;
    }, [files, isGuest, isAdmin, username]);

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

    const createFolder = useCallback(async (name: string, parentId: string) => {
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
            isReadOnly: false,
            owner: username
        };

        await persistFile(newFolder);
        setFiles(prev => [...prev, newFolder]);
        return newFolder.id;
    }, [isLocked, addToast, getUniqueName, username]);

    const createFile = useCallback(async (name: string, parentId: string, content: string = '') => {
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
            isReadOnly: false,
            owner: username
        };

        await persistFile(newFile);
        setFiles(prev => [...prev, newFile]);
        return newFile.id;
    }, [isLocked, addToast, getUniqueName, username]);

    const renameItem = useCallback(async (id: string, newName: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isReadOnly || item.isSystem) {
            addToast("Cannot rename a read-only or system item.", "error");
            return;
        }

        if (!newName || newName.trim() === '') return;

        if (checkDuplicate(newName, item.parent || '', id)) {
            addToast("Name already exists in this folder.", "error");
            return;
        }

        const updatedItem = { ...item, name: newName };
        await persistFile(updatedItem);

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return updatedItem;
            }
            return f;
        }));
    }, [files, addToast, checkDuplicate]);

    const deleteItem = useCallback(async (id: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isSystem || isLocked(id)) {
            addToast("Cannot delete system or locked files.", "error");
            return;
        }

        await persistDelete(id);
        setFiles(prev => prev.filter(f => f.id !== id));
    }, [files, addToast, isLocked]);

    const moveToTrash = useCallback(async (id: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.isSystem || isLocked(id)) {
            addToast("Cannot move system/locked files to trash.", "error");
            return;
        }

        const updatedItem = { ...item, parent: currentUserTrashId, isTrash: true, originalParent: item.parent || currentUserDesktopId };
        await persistFile(updatedItem);

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return updatedItem;
            }
            return f;
        }));
    }, [files, addToast, isLocked, currentUserTrashId, currentUserDesktopId]);

    const restoreFromTrash = useCallback(async (id: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        const targetParent = item.originalParent || currentUserDesktopId;
        const { isTrash, originalParent, ...rest } = item;
        const updatedItem = { ...rest, parent: targetParent, isTrash: false };

        await persistFile(updatedItem);

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return updatedItem;
            }
            return f;
        }));
    }, [files, currentUserDesktopId]);

    const emptyTrash = useCallback(async () => {
        const trashItems = files.filter(f => f.parent === currentUserTrashId);
        for (const item of trashItems) {
            await persistDelete(item.id);
        }
        setFiles(prev => prev.filter(f => f.parent !== currentUserTrashId));
    }, [files, currentUserTrashId]);

    const moveItem = useCallback(async (id: string, newParentId: string) => {
        const item = files.find(f => f.id === id);
        if (!item) return;

        if (item.parent === newParentId) return;

        if (item.isSystem || isLocked(id)) {
            addToast("Cannot move system or locked file.", "error");
            return;
        }
        if (isLocked(newParentId)) {
            addToast("Cannot move into a read-only directory.", "error");
            return;
        }

        const newName = getUniqueName(item.name, newParentId);
        const updatedItem = { ...item, parent: newParentId, name: newName };

        await persistFile(updatedItem);

        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                return updatedItem;
            }
            return f;
        }));
    }, [files, addToast, isLocked, getUniqueName]);

    const [clipboard, setClipboard] = useState<{ fileIds: string[]; operation: 'copy' | 'cut' } | null>(null);

    const copyItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        setClipboard({ fileIds: ids, operation: 'copy' });
    }, []);

    const cutItem = useCallback((id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        const lockedItems = ids.filter(fileId => isLocked(fileId) || files.find(f => f.id === fileId)?.isSystem);

        if (lockedItems.length > 0) {
            addToast(`Cannot cut locked/system file(s).`, "error");
            return;
        }
        setClipboard({ fileIds: ids, operation: 'cut' });
    }, [addToast, isLocked, files]);

    const pasteItem = useCallback(async (parentId: string) => {
        if (!clipboard) return;

        const { fileIds, operation } = clipboard;

        const filesToPaste = fileIds.map(id => files.find(f => f.id === id)).filter(Boolean) as filesystemitem[];
        if (filesToPaste.length === 0) return;

        if (isLocked(parentId)) {
            addToast("Cannot paste into a locked directory.", "error");
            return;
        }

        if (operation === 'cut') {
            for (const item of filesToPaste) {
                const updatedItem = { ...item, parent: parentId };
                await persistFile(updatedItem);
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

            const recursiveCopy = async (sourceId: string, targetParentId: string, isRoot: boolean = false) => {
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

                await persistFile(newItem);
                allNewFiles.push(newItem);

                if (sourceItem.mimetype === 'inode/directory') {
                    const children = files.filter(f => f.parent === sourceId && !f.isTrash);
                    for (const child of children) {
                        await recursiveCopy(child.id, newId, false);
                    }
                }
            };

            for (const fileToPaste of filesToPaste) {
                await recursiveCopy(fileToPaste.id, parentId, true);
            }

            setFiles(prev => [...prev, ...allNewFiles]);
            setClipboard(null);
        }
    }, [clipboard, files, isLocked, addToast]);

    const updateFileContent = useCallback(async (id: string, content: string) => {
        if (isLocked(id)) {
            addToast("Cannot modify locked file.", "error");
            return;
        }

        const item = files.find(f => f.id === id);
        if (item) {
            const updatedItem = { ...item, content: content };
            await persistFile(updatedItem);

            setFiles(prev => prev.map(f => {
                if (f.id === id) {
                    return updatedItem;
                }
                return f;
            }));
        }
    }, [addToast, isLocked, files]);

    const refreshFileSystem = useCallback(async () => {
        try {
            const dbFiles = await getAllFiles();
            const systemFiles = generateSystemFilesystem();
            let visibleFiles: filesystemitem[] = [...systemFiles];

            if (isAdmin) {
                const allUsers = await getUsers();
                for (const u of allUsers) {
                    const userBaseFs = generateUserFilesystem(u.username);
                    const userDbFiles = dbFiles.filter((f: filesystemitem) => f.owner === u.username);
                    const uniqueUserDb = userDbFiles.filter((dbf: filesystemitem) => !userBaseFs.some((sf: filesystemitem) => sf.id === dbf.id));
                    visibleFiles = [...visibleFiles, ...userBaseFs, ...uniqueUserDb];
                }
                const guestFs = generateGuestFilesystem().filter((f: filesystemitem) => f.owner === 'guest');
                visibleFiles = [...visibleFiles, ...guestFs];
            } else if (!isGuest) {
                const userBaseFs = generateUserFilesystem(username);
                const userDbFiles = dbFiles.filter((f: filesystemitem) => f.owner === username);
                const uniqueUserDb = userDbFiles.filter((dbf: filesystemitem) => !userBaseFs.some((sf: filesystemitem) => sf.id === dbf.id));
                visibleFiles = [...visibleFiles, ...userBaseFs, ...uniqueUserDb];
            } else {
                visibleFiles = generateGuestFilesystem();
            }

            setFiles(visibleFiles);
        } catch (e) {
            console.error("Refresh failed", e);
        }
    }, [isGuest, isAdmin, username]);

    return (
        <FileSystemContext.Provider value={{
            files,
            createFolder,
            createFile,
            deleteItem,
            moveToTrash,
            restoreFromTrash,
            emptyTrash,
            renameItem,
            moveItem,
            refreshFileSystem,
            copyItem,
            cutItem,
            pasteItem,
            clipboard,
            updateFileContent,
            isLocked,
            isLoading,
            currentUserDesktopId,
            currentUserDocsId,
            currentUserDownloadsId,
            currentUserTrashId
        }}>
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
