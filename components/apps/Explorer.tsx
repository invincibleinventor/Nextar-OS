'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import JSZip from 'jszip';
import {
    IoCloseOutline, IoFolderOutline, IoDocumentTextOutline, IoAppsOutline,
    IoGridOutline, IoListOutline, IoChevronBack, IoChevronForward,
    IoSearch, IoInformationCircleOutline, IoChevronDown, IoChevronUp, IoFolderOpenOutline, IoLockClosed,
    IoDesktopOutline,
    IoDownloadOutline
} from "react-icons/io5";
import Sidebar from '../ui/Sidebar';
import Image from 'next/image';
import { useWindows } from '../WindowContext';
import { apps, filesystemitem, openSystemItem, getFileIcon, getMimeTypeFromExtension } from '../data';
import { useDevice } from '../DeviceContext';
import { useExternalApps } from '../ExternalAppsContext';

import { IoTrashOutline, IoTrash, IoAddCircleOutline, IoServerOutline, IoHomeOutline, IoRefreshOutline, IoSwapHorizontalOutline } from "react-icons/io5";
import { useFileSystem } from '../FileSystemContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import ContextMenu from '../ui/ContextMenu';
import FileModal from '../ui/FileModal';
import { SelectionArea } from '../ui/SelectionArea';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useProjects } from '../ProjectContext';
import { iselectron, nativefs } from '@/utils/platform';
import { LuExternalLink, LuPenLine, LuTrash2, LuFolderPlus, LuFilePlus, LuUpload, LuArchive, LuPackageOpen, LuInfo, LuCopy, LuScissors, LuClipboardPaste, LuRefreshCw, LuEye, LuArrowUpDown, LuUndo2, LuPlus, LuX, LuRedo2, LuMousePointerClick, LuGrid2X2, LuList, LuColumns3, LuPanelLeft } from 'react-icons/lu';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassSidebar, glassInput, glassButton, clayClasses } from '../hooks/useClayStyles';

export default function Explorer({ windowId, initialpath, istrash, openPath, selectItem, isDesktopBackend }: { windowId?: string, initialpath?: string[], istrash?: boolean, openPath?: string, selectItem?: string, isDesktopBackend?: boolean }) {
    const [selected, setselected] = useState(istrash ? 'Trash' : 'Desktop');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>(selectItem ? [selectItem] : []);
    const [showsidebar, setshowsidebar] = useState(true);
    const [showpreview, setshowpreview] = useState(true);
    const { addwindow, windows, updatewindow, setactivewindow, activewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files, deleteItem, createFolder, createFile, uploadFile, moveToTrash, emptyTrash, restoreFromTrash, moveItem, copyItem, cutItem, pasteItem, clipboard, renameItem, isLoading, currentUserDesktopId, currentUserDocsId, currentUserDownloadsId, currentUserTrashId, isLocked } = useFileSystem();
    const { user, isGuest } = useAuth();
    const { launchApp } = useExternalApps();

    const { createProjectFromRawFiles } = useProjects();
    const clay = useIsClay();

    const username = user?.username || 'guest';
    const userhome = isGuest ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));

    const [fsMode, setFsMode] = useState<'vfs' | 'native'>(iselectron ? 'native' : 'vfs');
    const [nativePath, setNativePath] = useState('/home');
    const [nativeFiles, setNativeFiles] = useState<filesystemitem[]>([]);
    const [nativeLoading, setNativeLoading] = useState(false);
    const [nativeError, setNativeError] = useState<string | null>(null);
    const [nativeHistory, setNativeHistory] = useState<string[]>(['/home']);
    const [nativeHistoryIdx, setNativeHistoryIdx] = useState(0);

    const formatNativeSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };

    const loadNativeDirectory = useCallback(async (dirpath: string) => {
        setNativeLoading(true);
        setNativeError(null);
        try {
            const result = await nativefs.readdir(dirpath);
            if (result.success && result.items) {
                const sorted = result.items.sort((a: any, b: any) => {
                    if (a.isdir && !b.isdir) return -1;
                    if (!a.isdir && b.isdir) return 1;
                    return a.name.localeCompare(b.name);
                });
                const mapped: filesystemitem[] = sorted.map((item: any) => ({
                    id: `native:${dirpath}/${item.name}`.replace(/\/+/g, '/'),
                    name: item.name,
                    parent: `native:${dirpath}`,
                    mimetype: item.isdir ? 'inode/directory' : getMimeTypeFromExtension(item.name),
                    date: item.modified ? new Date(item.modified).toLocaleDateString() : '--',
                    size: item.isdir ? '--' : formatNativeSize(item.size || 0),
                    isSystem: false,
                    isReadOnly: false,
                }));
                setNativeFiles(mapped);
            } else {
                setNativeError(result.error || 'Failed to read directory');
                setNativeFiles([]);
            }
        } catch (e: any) {
            setNativeError(e.message || 'Unknown error');
            setNativeFiles([]);
        }
        setNativeLoading(false);
    }, []);

    const nativeNavigate = useCallback((path: string) => {
        const newHistory = nativeHistory.slice(0, nativeHistoryIdx + 1);
        newHistory.push(path);
        setNativeHistory(newHistory);
        setNativeHistoryIdx(newHistory.length - 1);
        setNativePath(path);
        setSelectedFileIds([]);
    }, [nativeHistory, nativeHistoryIdx]);

    useEffect(() => {
        if (fsMode === 'native' && iselectron) {
            loadNativeDirectory(nativePath);
        }
    }, [nativePath, fsMode, loadNativeDirectory]);

    const sidebaritems = useMemo(() => [
        {
            title: 'Favorites',
            items: [
                { name: 'Desktop', icon: IoDesktopOutline, path: ['Disk Drive', 'Users', userhome, 'Desktop'], color: 'var(--pastel-blue)' },
                { name: 'Documents', icon: IoDocumentTextOutline, path: ['Disk Drive', 'Users', userhome, 'Documents'], color: 'var(--pastel-green)' },
                { name: 'Downloads', icon: IoDownloadOutline, path: ['Disk Drive', 'Users', userhome, 'Downloads'], color: 'var(--pastel-peach)' },
                { name: 'Projects', icon: IoFolderOutline, path: ['Disk Drive', 'Users', userhome, 'Projects'], color: 'var(--pastel-mauve)' },
                { name: 'Applications', icon: IoAppsOutline, path: ['Disk Drive', 'Applications'], color: 'var(--pastel-red)' },
            ]
        },
        ...(iselectron ? [{
            title: 'Host System',
            items: [
                { name: 'Home', icon: IoHomeOutline, path: ['_native_', '/home'], color: 'var(--pastel-teal)' },
                { name: 'Root (/)', icon: IoServerOutline, path: ['_native_', '/'], color: 'var(--text-muted)' },
            ]
        }] : []),
        {
            title: 'Locations',
            items: [
                { name: 'Disk Drive', icon: IoAppsOutline, path: ['Disk Drive'], color: 'var(--text-muted)' },
            ]
        },
    ], [userhome, isGuest]);

    const getPathFromId = (folderId: string): string[] => {
        const pathsegments: string[] = [];
        let currentId: string | null = folderId;
        while (currentId) {
            const item = files.find(f => f.id === currentId);
            if (!item) break;
            pathsegments.unshift(item.name);
            currentId = item.parent;
        }
        return pathsegments.length > 0 ? pathsegments : ['Disk Drive', 'Users', userhome, 'Desktop'];
    };

    const initialPathFromOpen = openPath ? getPathFromId(openPath) : null;
    const [currentpath, setcurrentpath] = useState<string[]>(initialPathFromOpen || initialpath || ['Disk Drive', 'Users', userhome, 'Desktop']);
    const [searchquery, setsearchquery] = useState("");


    const [isnarrow, setisnarrow] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);
    const fileViewRef = useRef<HTMLDivElement>(null);
    const [isTrashView, setIsTrashView] = useState(istrash || false);
    const [sortby, setsortby] = useState<'name' | 'date' | 'size' | 'type'>('name');
    const [sortasc, setsortasc] = useState(true);
    const [showhidden, setshowhidden] = useState(false);
    const [viewmode, setviewmode] = useState<'grid' | 'list'>('grid');
    const [quicklook, setquicklook] = useState<filesystemitem | null>(null);

    const trashHasItems = useMemo(() => {
        return files.some(f => f.parent === currentUserTrashId);
    }, [files, currentUserTrashId]);

    const [mobileview, setmobileview] = useState<'sidebar' | 'files' | 'preview'>('files');

    const longpresstimer = useRef<NodeJS.Timeout | null>(null);
    const fileinputref = useRef<HTMLInputElement>(null);

    const getcurrentparentid = () => {
        let currentparentid = 'root';
        for (const foldername of currentpath) {
            const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid && !i.isTrash);
            if (folder) currentparentid = folder.id;
        }
        return currentparentid;
    };

    const handlefileupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filelist = e.target.files;
        if (!filelist) return;
        const parentid = getcurrentparentid();
        for (let i = 0; i < filelist.length; i++) {
            await uploadFile(filelist[i], parentid);
        }
        if (fileinputref.current) fileinputref.current.value = '';
    };

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const isnownarrow = width < 768;
                setisnarrow(isnownarrow);

                if (!isnownarrow) {
                    setshowsidebar(true);
                }
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, [isnarrow]);

    useEffect(() => {
        if (windowId && !isDesktopBackend) {
            const currentTitle = windows.find((w: any) => w.id === windowId)?.title;
            const newTitle = currentpath[currentpath.length - 1];
            if (currentTitle !== newTitle) {
                updatewindow(windowId, { title: newTitle });
            }
        }
    }, [currentpath, windowId, updatewindow, isDesktopBackend, windows]);

    useEffect(() => {
        if (!windowId || isDesktopBackend || ismobile) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activewindow !== windowId) return;
            if (e.key === ' ' && !quicklook) {
                e.preventDefault();
                if (selectedFileIds.length === 1) {
                    const file = files.find(f => f.id === selectedFileIds[0]);
                    if (file && file.mimetype !== 'inode/directory') setquicklook(file);
                }
            } else if ((e.key === ' ' || e.key === 'Escape') && quicklook) {
                e.preventDefault();
                setquicklook(null);
            } else if (e.key === 'ArrowDown' && quicklook) {
                e.preventDefault();
                const idx = filesList.findIndex(f => f.id === quicklook.id);
                for (let i = idx + 1; i < filesList.length; i++) {
                    if (filesList[i].mimetype !== 'inode/directory') {
                        setquicklook(filesList[i]);
                        setSelectedFileIds([filesList[i].id]);
                        break;
                    }
                }
            } else if (e.key === 'ArrowUp' && quicklook) {
                e.preventDefault();
                const idx = filesList.findIndex(f => f.id === quicklook.id);
                for (let i = idx - 1; i >= 0; i--) {
                    if (filesList[i].mimetype !== 'inode/directory') {
                        setquicklook(filesList[i]);
                        setSelectedFileIds([filesList[i].id]);
                        break;
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [windowId, isDesktopBackend, ismobile, activewindow, quicklook, selectedFileIds, files, currentpath, searchquery, isTrashView, sortby, sortasc, showhidden]);

    useEffect(() => {
        const saved = localStorage.getItem('nextaros-explorer-viewmode');
        if (saved === 'list' || saved === 'grid') setviewmode(saved);
    }, []);

    const toggleViewMode = () => {
        const next = viewmode === 'grid' ? 'list' : 'grid';
        setviewmode(next);
        localStorage.setItem('nextaros-explorer-viewmode', next);
    };

    useEffect(() => {
        if (!windowId || isDesktopBackend) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (currentpath.length > 1) {
                e.preventDefault();
                setcurrentpath(currentpath.slice(0, -1));
            } else if (ismobile && mobileview === 'preview') {
                e.preventDefault();
                setmobileview('files');
            }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, isDesktopBackend, activewindow, currentpath, ismobile, mobileview]);

    const handlesidebarclick = (itemname: string, path: string[]) => {
        setselected(itemname);
        if (path[0] === '_native_' && iselectron) {
            setFsMode('native');
            nativeNavigate(path[1]);
        } else {
            setFsMode('vfs');
            setcurrentpath(path);
        }
        if (ismobile) setmobileview('files');
        else if (isnarrow) setshowsidebar(false);
        setSelectedFileIds([]);
        setIsTrashView(itemname === 'Trash');
    };

    const getcurrentfiles = (): filesystemitem[] => {
        if (fsMode === 'native' && iselectron) {
            let result = nativeFiles;
            if (searchquery) {
                result = result.filter(f => f.name.toLowerCase().includes(searchquery.toLowerCase()));
            }
            if (!showhidden) {
                result = result.filter(f => !f.name.startsWith('.'));
            }
            return result;
        }

        let result: filesystemitem[] = [];

        if (isTrashView) {
            result = files.filter(f => f.parent === currentUserTrashId && f.id !== currentUserTrashId);
        } else {
            let currentparentid = 'root';

            for (const foldername of currentpath) {
                const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid && !i.isTrash);
                if (folder) {
                    currentparentid = folder.id;
                }
            }

            result = files.filter(i => i.parent === currentparentid && !i.isTrash);

            if (searchquery) {
                result = files.filter(f => f.name.toLowerCase().includes(searchquery.toLowerCase()) && !f.isTrash);
            }
        }

        if (!showhidden) {
            result = result.filter(f => !f.name.startsWith('.'));
        }

        const isfolder = (f: filesystemitem) => f.mimetype === 'folder' || f.mimetype?.startsWith('inode/directory');
        const folders = result.filter(f => isfolder(f));
        const filesonly = result.filter(f => !isfolder(f));

        const sortfn = (a: filesystemitem, b: filesystemitem) => {
            let cmp = 0;
            switch (sortby) {
                case 'name':
                    cmp = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    cmp = (a.date || '').localeCompare(b.date || '');
                    break;
                case 'size':
                    const sizea = parseInt(a.size || '0', 10) || 0;
                    const sizeb = parseInt(b.size || '0', 10) || 0;
                    cmp = sizea - sizeb;
                    break;
                case 'type':
                    cmp = (a.mimetype || '').localeCompare(b.mimetype || '');
                    break;
            }
            return sortasc ? cmp : -cmp;
        };

        return [...folders.sort(sortfn), ...filesonly.sort(sortfn)];
    };



    const filesList = getcurrentfiles();
    const activefile = selectedFileIds.length > 0
        ? (fsMode === 'native' ? nativeFiles.find(f => f.id === selectedFileIds[0]) : files.find(f => f.id === selectedFileIds[0]))
        : null;

    const handlefileopen = (file: filesystemitem) => {
        if (fsMode === 'native' && file.id.startsWith('native:')) {
            const fullpath = file.id.replace('native:', '');
            if (file.mimetype === 'inode/directory') {
                nativeNavigate(fullpath);
                setsearchquery("");
                setSelectedFileIds([]);
            } else {
                nativefs.openpath(fullpath);
            }
            return;
        }

        if (file.mimetype === 'inode/directory') {
            setcurrentpath([...currentpath, file.name]);
            setsearchquery("");
            setSelectedFileIds([]);
        } else if (file.mimetype === 'inode/shortcut') {
            if (isTrashView) return;
            openSystemItem(file, { addwindow, windows, updatewindow, setactivewindow, ismobile, files });
        } else if (file.mimetype === 'application/x-nextaros-app' || file.name.endsWith('.app')) {
            if (isTrashView) return;
            try {
                const appData = JSON.parse(file.content || '{}');
                if (appData.id) {
                    launchApp(appData.id);
                }
            } catch { }
        } else {
            if (isTrashView) return;
            openSystemItem(file, { addwindow, windows, updatewindow, setactivewindow, ismobile, files });
        }
    };

    const getDisplayName = (file: filesystemitem) => {
        if (file.name.endsWith('.app') && file.content) {
            try {
                const data = JSON.parse(file.content);
                if (data.name) return data.name;
            } catch { }
        }
        return file.name;
    };

    const extractZipToVfs = useCallback(async (zipFileItem: filesystemitem, parentId: string) => {
        if (!zipFileItem.content) return;
        try {
            let arrayBuf: ArrayBuffer;
            if (zipFileItem.content.startsWith('data:')) {
                const resp = await fetch(zipFileItem.content);
                arrayBuf = await resp.arrayBuffer();
            } else {
                const enc = new TextEncoder();
                arrayBuf = enc.encode(zipFileItem.content).buffer as ArrayBuffer;
            }
            const zip = await JSZip.loadAsync(arrayBuf);
            const folderMap: Record<string, string> = { '': parentId };

            const entries = Object.entries(zip.files).sort((a, b) => a[0].localeCompare(b[0]));
            for (const [path, entry] of entries) {
                const parts = path.replace(/\/$/, '').split('/');
                const name = parts[parts.length - 1];
                if (!name) continue;
                const parentPath = parts.slice(0, -1).join('/');
                const parentFolderId = folderMap[parentPath] || parentId;

                if (entry.dir) {
                    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                    await createFolder(name, parentFolderId);
                    const created = files.find(f => f.name === name && f.parent === parentFolderId);
                    folderMap[path.replace(/\/$/, '')] = created?.id || folderId;
                } else {
                    const blob = await entry.async('blob');
                    const file = new File([blob], name);
                    await uploadFile(file, parentFolderId);
                }
            }
        } catch {
        }
    }, [createFolder, uploadFile, files]);

    const compressToZip = useCallback(async (itemIds: string[]) => {
        const zip = new JSZip();

        const addToZip = (folder: JSZip, itemId: string) => {
            const item = files.find(f => f.id === itemId);
            if (!item) return;
            if (item.mimetype === 'inode/directory' || item.mimetype === 'folder') {
                const subFolder = folder.folder(item.name);
                if (!subFolder) return;
                files.filter(f => f.parent === itemId && !f.isTrash).forEach(child => addToZip(subFolder, child.id));
            } else if (item.content) {
                if (item.content.startsWith('data:')) {
                    const base64 = item.content.split(',')[1];
                    zip.file(item.name, base64, { base64: true });
                } else {
                    folder.file(item.name, item.content);
                }
            }
        };

        itemIds.forEach(id => addToZip(zip, id));
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const firstName = files.find(f => f.id === itemIds[0])?.name || 'archive';
        a.href = url;
        a.download = itemIds.length === 1 ? `${firstName}.zip` : 'archive.zip';
        a.click();
        URL.revokeObjectURL(url);
    }, [files]);

    const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file' | 'rename', initialValue?: string }>({ isOpen: false, type: 'create-folder' });

    const menuActions = React.useMemo(() => ({
        'new-folder': () => setFileModal({ isOpen: true, type: 'create-folder' }),
        'new-file': () => setFileModal({ isOpen: true, type: 'create-file' }),
        'select-all': () => {
            const items = fileViewRef.current?.querySelectorAll('.explorer-item');
            const allIds: string[] = [];
            items?.forEach((el) => {
                const id = el.getAttribute('data-id');
                if (id) allIds.push(id);
            });
            setSelectedFileIds(allIds);
        },
        'toggle-sidebar': () => setshowsidebar(prev => !prev),
        'toggle-preview': () => setshowpreview(prev => !prev),
        'view-icons': () => { },
        'view-list': () => { },
        'go-back': () => currentpath.length > 1 && setcurrentpath(currentpath.slice(0, -1)),
        'go-up': () => currentpath.length > 1 && setcurrentpath(currentpath.slice(0, -1)),
        'go-desktop': () => setcurrentpath(['Disk Drive', 'Users', userhome, 'Desktop']),
        'go-documents': () => setcurrentpath(['Disk Drive', 'Users', userhome, 'Documents']),
        'go-downloads': () => setcurrentpath(['Disk Drive', 'Users', userhome, 'Downloads']),
        'cut': () => {
            if (selectedFileIds.length > 0) cutItem(selectedFileIds);
        },
        'copy': () => {
            if (selectedFileIds.length > 0) copyItem(selectedFileIds);
        },
        'paste': () => {
            let currentParentId = 'root';
            files.forEach(f => {
                if (f.name === currentpath[currentpath.length - 1] && !f.isTrash) currentParentId = f.id;
            });
            for (const foldername of currentpath) {
                const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentParentId && !i.isTrash);
                if (folder) currentParentId = folder.id;
            }
            if (clipboard) pasteItem(currentParentId);
        },
        'move-to-trash': () => {
            selectedFileIds.forEach(id => moveToTrash(id));
            setSelectedFileIds([]);
        },
        'get-info': () => {
            if (selectedFileIds.length > 0) {
                const f = files.find(file => file.id === selectedFileIds[0]);
                if (f) openSystemItem(f, { addwindow, windows, updatewindow, setactivewindow, ismobile }, 'getinfo');
            }
        },
        'rename': () => {
            if (selectedFileIds.length === 1) {
                const f = files.find(file => file.id === selectedFileIds[0]);
                if (f) setFileModal({ isOpen: true, type: 'rename', initialValue: f.name });
                setContextMenu({ x: 0, y: 0, fileId: selectedFileIds[0] });
            }
        }
    }), [currentpath, selectedFileIds, clipboard, files, windowId]);

    useMenuAction('explorer', menuActions, windowId);

    const isActiveWindow = activewindow === windowId;

    const explorerMenus = useMemo(() => ({
        File: [
            { title: "New Explorer Window", actionId: "new-window", shortcut: "⌘N", icon: <LuPlus size={14} /> },
            { title: "New Folder", actionId: "new-folder", shortcut: "⇧⌘N", icon: <LuFolderPlus size={14} /> },
            { separator: true },
            { title: "Open", actionId: "open", icon: <LuExternalLink size={14} /> },
            { title: "Close Window", actionId: "close-window", shortcut: "⌘W", icon: <LuX size={14} /> },
            { separator: true },
            { title: "Move to Trash", actionId: "move-to-trash", shortcut: "⌘⌫", icon: <LuTrash2 size={14} /> },
            { separator: true },
            { title: "Get Info", actionId: "get-info", shortcut: "⌘I", icon: <LuInfo size={14} /> },
            { title: "Rename", actionId: "rename", icon: <LuPenLine size={14} /> }
        ],
        Edit: [
            { title: "Cut", actionId: "cut", shortcut: "⌘X", icon: <LuScissors size={14} /> },
            { title: "Copy", actionId: "copy", shortcut: "⌘C", icon: <LuCopy size={14} /> },
            { title: "Paste", actionId: "paste", shortcut: "⌘V", icon: <LuClipboardPaste size={14} /> },
            { title: "Select All", actionId: "select-all", shortcut: "⌘A", icon: <LuMousePointerClick size={14} /> }
        ],
        View: [
            { title: "As Icons", actionId: "view-icons", icon: <LuGrid2X2 size={14} /> },
            { title: "As List", actionId: "view-list", icon: <LuList size={14} /> },
            { separator: true },
            { title: "Toggle Sidebar", actionId: "toggle-sidebar", icon: <LuPanelLeft size={14} /> },
            { title: "Toggle Preview", actionId: "toggle-preview", icon: <LuEye size={14} /> }
        ],
        Go: [
            { title: "Back", actionId: "go-back", shortcut: "⌘[", icon: <LuUndo2 size={14} /> },
            { title: "Enclosing Folder", actionId: "go-up", shortcut: "⌘↑", icon: <LuArrowUpDown size={14} /> },
            { separator: true },
            { title: "Desktop", actionId: "go-desktop", icon: <LuColumns3 size={14} /> },
            { title: "Documents", actionId: "go-documents", icon: <LuFolderPlus size={14} /> },
            { title: "Downloads", actionId: "go-downloads", icon: <LuArchive size={14} /> }
        ]
    }), []);

    useMenuRegistration(explorerMenus, isActiveWindow);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, fileId?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    };

    const handlelongpress = (fileId: string, e: React.TouchEvent) => {
        longpresstimer.current = setTimeout(() => {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
            const touch = e.touches[0];
            setContextMenu({ x: touch.clientX, y: touch.clientY, fileId });
        }, 500);
    };

    const cancellongpress = () => {
        if (longpresstimer.current) {
            clearTimeout(longpresstimer.current);
            longpresstimer.current = null;
        }
    };

    const handleModalConfirm = async (inputValue: string) => {
        if (fsMode === 'native' && iselectron) {
            if (fileModal.type === 'create-folder') {
                await nativefs.mkdir(`${nativePath}/${inputValue}`.replace(/\/+/g, '/'));
            } else if (fileModal.type === 'rename' && contextMenu?.fileId) {
                const oldPath = contextMenu.fileId.replace('native:', '');
                const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
                await nativefs.rename(oldPath, `${parentDir}/${inputValue}`.replace(/\/+/g, '/'));
            }
            setFileModal({ ...fileModal, isOpen: false });
            loadNativeDirectory(nativePath);
            return;
        }

        let currentparentid = 'root';
        for (const foldername of currentpath) {
            const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid && !i.isTrash);
            if (folder) currentparentid = folder.id;
        }

        if (fileModal.type === 'create-folder') {
            createFolder(inputValue, currentparentid);
        } else if (fileModal.type === 'create-file') {
            createFile(inputValue, currentparentid);
        } else if (fileModal.type === 'rename' && contextMenu?.fileId) {
            renameItem(contextMenu.fileId, inputValue);
        }
        setFileModal({ ...fileModal, isOpen: false });
    };

    const SOURCE_FILE_REGEX = /\.(py|js|ts|tsx|jsx|html|css|json|md|txt|yml|yaml|xml|sh|bash|c|cpp|h|hpp|java|rb|php|go|rs|swift|kt|r|lua|pl|ex|exs|dart)$/i;

    const getContextMenuItems = () => {
        if (fsMode === 'native' && iselectron) {
            const nativeItem = contextMenu?.fileId ? nativeFiles.find(f => f.id === contextMenu.fileId) : null;
            if (nativeItem) {
                const fullpath = nativeItem.id.replace('native:', '');
                return [
                    { label: 'Open', icon: <LuExternalLink size={14} />, action: () => handlefileopen(nativeItem) },
                    { separator: true, label: '' },
                    { label: 'Rename', icon: <LuPenLine size={14} />, action: () => setFileModal({ isOpen: true, type: 'rename', initialValue: nativeItem.name }) },
                    { separator: true, label: '' },
                    { label: 'Move to Trash', icon: <LuTrash2 size={14} />, action: async () => { await nativefs.trash(fullpath); loadNativeDirectory(nativePath); }, danger: true },
                ];
            } else {
                return [
                    { label: 'New Folder', icon: <LuFolderPlus size={14} />, action: () => setFileModal({ isOpen: true, type: 'create-folder', initialValue: '' }) },
                    { separator: true, label: '' },
                    { label: 'Refresh', icon: <LuRefreshCw size={14} />, action: () => loadNativeDirectory(nativePath) },
                    { label: 'Show Hidden Files', icon: <LuEye size={14} />, action: () => setshowhidden(!showhidden) },
                ];
            }
        }

        const activeFileItem = contextMenu?.fileId ? files.find(f => f.id === contextMenu?.fileId) : null;

        if (activeFileItem) {
            const targets = (selectedFileIds.includes(activeFileItem.id)) ? selectedFileIds : [activeFileItem.id];
            const hasReadOnly = targets.some(id => files.find(f => f.id === id)?.isReadOnly || files.find(f => f.id === id)?.isSystem);
            const isMulti = targets.length > 1;

            if (isTrashView) {
                return [
                    { label: isMulti ? `Put Back ${targets.length} Items` : 'Put Back', icon: <LuUndo2 size={14} />, action: () => targets.forEach(id => restoreFromTrash(id)) },
                    { label: isMulti ? `Delete ${targets.length} Items Immediately` : 'Delete Immediately', icon: <LuTrash2 size={14} />, action: () => targets.forEach(id => deleteItem(id)), danger: true }
                ];
            }

            const canRename = !isMulti && !activeFileItem.isReadOnly;

            const baseItems: any[] = [
                {
                    label: 'Open', icon: <LuExternalLink size={14} />, action: () => targets.forEach(id => {
                        const f = files.find(x => x.id === id);
                        if (f) handlefileopen(f);
                    })
                }
            ];

            if (!isMulti) {
                const compatibleApps = apps.filter(app => app.acceptedMimeTypes && app.acceptedMimeTypes.includes(activeFileItem.mimetype));
                if (compatibleApps.length > 0) {
                    compatibleApps.forEach(app => {
                        baseItems.push({
                            label: `Open with ${app.appname}`,
                            action: () => openSystemItem(activeFileItem, { addwindow, windows, updatewindow, setactivewindow, ismobile }, app.id)
                        });
                    });
                }
            }

            baseItems.push({ separator: true, label: '' });
            if (!isMulti) baseItems.push({ label: 'Get Info', icon: <LuInfo size={14} />, action: () => openSystemItem(activeFileItem, { addwindow, windows, updatewindow, setactivewindow, ismobile }, 'getinfo') });

            if (!isMulti) {
                baseItems.push({
                    label: 'Rename',
                    icon: <LuPenLine size={14} />,
                    action: () => setFileModal({ isOpen: true, type: 'rename', initialValue: activeFileItem.name }),
                    disabled: !canRename
                });
            }

            baseItems.push({ separator: true, label: '' });
            baseItems.push({ label: isMulti ? `Copy ${targets.length} Items` : 'Copy', icon: <LuCopy size={14} />, action: () => copyItem(targets) });
            baseItems.push({ label: isMulti ? `Cut ${targets.length} Items` : 'Cut', icon: <LuScissors size={14} />, action: () => cutItem(targets), disabled: hasReadOnly });

            baseItems.push({ separator: true, label: '' });

            if (!isMulti && activeFileItem.name.match(/\.(zip|jar|war)$/i) && activeFileItem.content) {
                baseItems.push({
                    label: 'Extract Here',
                    icon: <LuPackageOpen size={14} />,
                    action: () => {
                        const pid = getcurrentparentid();
                        extractZipToVfs(activeFileItem, pid);
                    }
                });
            }

            baseItems.push({
                label: isMulti ? `Compress ${targets.length} Items` : 'Compress',
                icon: <LuArchive size={14} />,
                action: () => compressToZip(targets)
            });

            return [
                ...baseItems,
                { separator: true, label: '' },
                { label: isMulti ? `Move ${targets.length} Items to Trash` : 'Move to Trash', icon: <LuTrash2 size={14} />, action: () => targets.forEach(id => moveToTrash(id)), danger: true, disabled: hasReadOnly }
            ];
        } else {
            const parentid = getcurrentparentid();
            const isReadOnlyDir = isLocked(parentid);
            return [
                { label: 'New Folder', icon: <LuFolderPlus size={14} />, action: () => setFileModal({ isOpen: true, type: 'create-folder', initialValue: '' }), disabled: isReadOnlyDir },
                { label: 'New File', icon: <LuFilePlus size={14} />, action: () => setFileModal({ isOpen: true, type: 'create-file', initialValue: '' }), disabled: isReadOnlyDir },
                { label: 'Upload File', icon: <LuUpload size={14} />, action: () => fileinputref.current?.click(), disabled: isReadOnlyDir },
                { separator: true, label: '' },
                {
                    label: 'Upload & Extract Zip',
                    icon: <LuPackageOpen size={14} />,
                    action: () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.zip';
                        input.onchange = async (ev: any) => {
                            const f = ev.target?.files?.[0];
                            if (!f) return;
                            const arrayBuf = await f.arrayBuffer();
                            const zip = await JSZip.loadAsync(arrayBuf);
                            const pid = getcurrentparentid();
                            const entries = Object.entries(zip.files).sort((a, b) => a[0].localeCompare(b[0]));
                            for (const [path, entry] of entries) {
                                const parts = path.replace(/\/$/, '').split('/');
                                const name = parts[parts.length - 1];
                                if (!name) continue;
                                if (entry.dir) {
                                    await createFolder(name, pid);
                                } else {
                                    const blob = await entry.async('blob');
                                    const file = new File([blob], name);
                                    await uploadFile(file, pid);
                                }
                            }
                        };
                        input.click();
                    },
                    disabled: isReadOnlyDir
                },
                { separator: true, label: '' },
                {
                    label: 'Paste', icon: <LuClipboardPaste size={14} />, action: () => {
                        let currentParentId = 'root';
                        for (const folderName of currentpath) {
                            const folder = files.find(f => f.name === folderName && f.parent === currentParentId && !f.isTrash);
                            if (folder) currentParentId = folder.id;
                        }
                        pasteItem(currentParentId);
                    }, disabled: !clipboard || isReadOnlyDir
                },
                { separator: true, label: '' },
                {
                    label: 'Get Info', icon: <LuInfo size={14} />, action: () => {
                        let currentParentId = 'root';
                        let currentFolderItem: filesystemitem | undefined;
                        for (const folderName of currentpath) {
                            const folder = files.find(f => f.name === folderName && f.parent === currentParentId && !f.isTrash);
                            if (folder) {
                                currentParentId = folder.id;
                                currentFolderItem = folder;
                            }
                        }
                        if (currentFolderItem) {
                            openSystemItem(currentFolderItem, { addwindow, windows, updatewindow, setactivewindow, ismobile }, 'getinfo');
                        }
                    }
                },
                { separator: true, label: '' },
                {
                    label: `Sort by: ${sortby.charAt(0).toUpperCase() + sortby.slice(1)}`,
                    icon: <LuArrowUpDown size={14} />,
                    children: [
                        { label: `Name ${sortby === 'name' ? (sortasc ? '↑' : '↓') : ''}`, action: () => { if (sortby === 'name') setsortasc(!sortasc); else { setsortby('name'); setsortasc(true); } } },
                        { label: `Date ${sortby === 'date' ? (sortasc ? '↑' : '↓') : ''}`, action: () => { if (sortby === 'date') setsortasc(!sortasc); else { setsortby('date'); setsortasc(true); } } },
                        { label: `Size ${sortby === 'size' ? (sortasc ? '↑' : '↓') : ''}`, action: () => { if (sortby === 'size') setsortasc(!sortasc); else { setsortby('size'); setsortasc(true); } } },
                        { label: `Type ${sortby === 'type' ? (sortasc ? '↑' : '↓') : ''}`, action: () => { if (sortby === 'type') setsortasc(!sortasc); else { setsortby('type'); setsortasc(true); } } },
                    ]
                },
                { label: showhidden ? '✓ Show Hidden Files' : 'Show Hidden Files', icon: <LuEye size={14} />, action: () => setshowhidden(!showhidden) }
            ];
        }
    };

    const handleDragStart = (e: React.DragEvent, fileId: string) => {
        e.stopPropagation();
        e.dataTransfer.setData('sourceId', fileId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetParentId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        let destinationId = targetParentId;
        if (!destinationId) {
            destinationId = getcurrentparentid();
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                await uploadFile(e.dataTransfer.files[i], destinationId);
            }
            return;
        }

        const sourceId = e.dataTransfer.getData('sourceId');
        if (!sourceId) return;
        if (sourceId === destinationId) return;
        moveItem(sourceId, destinationId);
    };

    if (ismobile) {
        return (
            <div
                ref={containerref}
                className={`flex flex-col h-full w-full text-[--text-color] text-[15px] overflow-hidden relative select-none ${clay ? 'bg-[--bg-base] font-sans' : 'bg-[--bg-base] font-mono'}`}
            >
                <input
                    type="file"
                    ref={fileinputref}
                    onChange={handlefileupload}
                    multiple
                    className="hidden"
                />
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

                <AnimatePresence mode="wait">
                    {mobileview === 'sidebar' && (
                        <motion.div
                            key="sidebar"
                            initial={{ x: '-105%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-105%' }}
                            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                            className={`absolute inset-0 z-20 pt-2 ${clay ? 'bg-[--bg-surface]' : 'bg-surface'}`}
                        >
                            <div className={`h-12 flex items-center justify-between px-4 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                <span className="font-semibold text-lg text-[--text-color]">Browse</span>
                                <button
                                    onClick={() => setmobileview('files')}
                                    className="text-accent font-medium"
                                >
                                    Done
                                </button>
                            </div>
                            <div className="overflow-y-auto h-full pb-20 pt-2 px-2">
                                {sidebaritems.map((group, idx) => (
                                    <div key={idx} className="mb-6">
                                        <div className="text-[13px] font-bold text-[--text-muted] uppercase tracking-wide mb-2 px-3">
                                            {group.title}
                                        </div>
                                        <div className="space-y-1">
                                            {group.items.map((item) => (
                                                <div
                                                    key={item.name}
                                                    onClick={() => handlesidebarclick(item.name, item.path)}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                                                        ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}
                                                        ${selected === item.name
                                                            ? 'text-white'
                                                            : clay ? 'text-[--text-color] active:bg-[--bg-glass-hover]' : 'text-[--text-color] active:bg-overlay'}`}
                                                    style={selected === item.name ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    <item.icon className={`text-xl ${selected === item.name ? 'text-white' : 'text-accent'}`} />
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                            ))}
                                            {idx === sidebaritems.length - 1 && (
                                                <div
                                                    key="Trash"
                                                    onClick={() => handlesidebarclick('Trash', [])}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 mt-4
                                                        ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}
                                                        ${selected === 'Trash'
                                                            ? 'text-white'
                                                            : clay ? 'text-[--text-color] active:bg-[--bg-glass-hover]' : 'text-[--text-color] active:bg-overlay'}`}
                                                    style={selected === 'Trash' ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    {trashHasItems
                                                        ? <IoTrash className={`text-xl ${selected === 'Trash' ? 'text-white' : 'text-pastel-red'}`} />
                                                        : <IoTrashOutline className={`text-xl ${selected === 'Trash' ? 'text-white' : 'text-pastel-red'}`} />
                                                    }
                                                    <span className="font-medium">Trash</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {mobileview === 'files' && (
                        <motion.div
                            key="files"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className={`h-14 shrink-0 flex items-center justify-between px-4 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-surface'}`}>
                                <div className="flex items-center gap-3">
                                    {currentpath.length > 1 ? (
                                        <button
                                            onClick={() => setcurrentpath(currentpath.slice(0, -1))}
                                            className="text-accent flex items-center gap-0.5"
                                        >
                                            <IoChevronBack className="text-xl" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setmobileview('sidebar')}
                                            className="text-accent flex items-center gap-0.5"
                                        >
                                            <IoListOutline className="text-xl" />
                                            <span className="text-[16px]">Browse</span>
                                        </button>
                                    )}
                                </div>
                                <span className="font-semibold text-[16px] absolute left-1/2 -translate-x-1/2">
                                    {isTrashView ? 'Trash' : currentpath[currentpath.length - 1]}
                                </span>
                                <div className="flex items-center gap-1">
                                    {!isTrashView && (
                                        <>
                                            <button
                                                onClick={() => setFileModal({ isOpen: true, type: 'create-file' })}
                                                className="text-accent p-2"
                                            >
                                                <IoDocumentTextOutline className="text-xl" />
                                            </button>
                                            <button
                                                onClick={() => setFileModal({ isOpen: true, type: 'create-folder' })}
                                                className="text-accent p-2"
                                            >
                                                <IoFolderOpenOutline className="text-xl" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={`px-4 py-2 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                <div className={`relative ${clay ? 'rounded-full' : ''}`}
                                    style={clay ? glassInput : undefined}>
                                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                                    <input
                                        className={`w-full pl-10 pr-4 py-2.5 text-[15px] outline-none placeholder-[--text-muted] text-[--text-color] ${clay ? 'bg-transparent' : 'bg-overlay'}`}
                                        placeholder="Search"
                                        value={searchquery}
                                        onChange={(e) => setsearchquery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto"
                                onContextMenu={(e) => handleContextMenu(e)}
                            >
                                {(isLoading || nativeLoading) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                        <div className="animate-spin h-8 w-8 border-b-2 border-[--text-muted] mb-2"></div>
                                        <span className="text-[13px]">Loading Files...</span>
                                    </div>
                                ) : nativeError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                        <span className="text-4xl mb-2 opacity-50">!</span>
                                        <span className="text-[13px] text-pastel-red">{nativeError}</span>
                                        <button onClick={() => nativeNavigate('/home')} className={`mt-3 px-3 py-1.5 text-xs transition-colors ${clay ? 'bg-[--bg-glass-hover] hover:bg-[--bg-glass-active] rounded-[8px]' : 'bg-overlay hover:bg-surface'}`}>Go Home</button>
                                    </div>
                                ) : filesList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                        <span className="text-4xl mb-2 opacity-50">¯\_(ツ)_/¯</span>
                                        <span className="text-[13px]">No items found</span>
                                    </div>
                                ) : (
                                    <div className={`divide-y ${clay ? 'divide-[--text-muted]/10' : 'divide-[--border-color]'}`}>
                                        {filesList.map((file) => (
                                            <div
                                                key={file.id}
                                                className={`flex items-center gap-4 px-4 py-3 ${clay ? 'active:bg-[--bg-glass-hover]' : 'active:bg-overlay'}`}
                                                onClick={() => handlefileopen(file)}
                                                onTouchStart={(e) => handlelongpress(file.id, e)}
                                                onTouchEnd={cancellongpress}
                                                onTouchCancel={cancellongpress}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleContextMenu(e, file.id);
                                                }}
                                            >
                                                <div className="w-12 h-12 relative flex-shrink-0 overflow-hidden rounded-[8px]">
                                                    {getFileIcon(file.mimetype, file.name, file.icon, file.id, file.content || file.link)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-[17px] truncate">{getDisplayName(file)}</div>
                                                    <div className="text-[13px] text-[--text-muted]">
                                                        {file.mimetype === 'inode/directory' ? 'Folder' : file.size || '--'}
                                                    </div>
                                                </div>
                                                {isLocked(file.id) && (
                                                    <IoLockClosed className="text-[--text-muted] text-[13px]" />
                                                )}
                                                {file.mimetype === 'inode/directory' && (
                                                    <IoChevronForward className="text-[--text-muted]" />
                                                )}
                                            </div>
                                        ))}
                                        <div
                                            className="h-32 w-full"
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleContextMenu(e);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {isTrashView && (
                                <div className={`p-4 border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-[--bg-base]'}`}>
                                    <button
                                        onClick={emptyTrash}
                                        className={`w-full py-3 text-pastel-red font-medium text-[15px] ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`}
                                        style={{ background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' }}
                                    >
                                        Empty Trash
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >
        );
    }

    return (
        <div
            ref={containerref}
            onContextMenu={(e) => handleContextMenu(e)}
            className={`flex h-full w-full text-[--text-color] text-[13px] overflow-hidden relative select-none ${clay ? 'bg-[--bg-base]' : 'bg-transparent font-mono'}`}
            onClick={() => {
                if (isnarrow && showsidebar) setshowsidebar(false);
                setContextMenu(null);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e)}
        >
            <input
                type="file"
                ref={fileinputref}
                onChange={handlefileupload}
                multiple
                className="hidden"
            />
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
                currentPath={isTrashView ? [] : currentpath}
                onNavigate={(path: string[]) => handlesidebarclick(path[path.length - 1], path)}
                show={showsidebar}
                isOverlay={isnarrow}
                items={sidebaritems}
                header={undefined}
            >
                <div
                    onClick={() => handlesidebarclick('Trash', [])}
                    className={`flex items-center cursor-pointer transition-colors mt-4 mx-1
                        ${clay ? 'gap-3 px-3 py-2.5 rounded-[12px]' : 'gap-3 px-3 py-1.5'}
                        ${selected === 'Trash'
                            ? clay ? 'text-white' : 'bg-overlay text-[--text-color]'
                            : clay ? 'text-[--text-muted] hover:bg-[--bg-glass-hover] active:scale-[0.98]' : 'text-[--text-muted] hover:bg-overlay'}`}
                    style={selected === 'Trash' && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                >
                    {trashHasItems
                        ? <IoTrash className={`${clay ? 'text-xl' : 'text-lg'} ${selected === 'Trash' ? (clay ? 'text-white' : 'text-accent') : 'text-[--text-muted]'}`} />
                        : <IoTrashOutline className={`${clay ? 'text-xl' : 'text-lg'} ${selected === 'Trash' ? (clay ? 'text-white' : 'text-accent') : 'text-[--text-muted]'}`} />
                    }
                    <span className={`${clay ? 'text-[14px]' : 'text-[13px]'} font-medium leading-none`}>Trash</span>
                </div>
            </Sidebar>

            <div className={`flex-1 flex ${isnarrow ? 'flex-col' : 'flex-row'} min-w-0 relative overflow-hidden ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>

                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    <div className={`${clay ? 'h-[40px]' : 'h-[34px]'} shrink-0 flex items-center px-3 border-b gap-2 ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}
                        style={clay ? { background: 'var(--bg-glass)' } : undefined}
                    >
                        {isnarrow && (
                            <button onClick={() => setshowsidebar(!showsidebar)} className="p-1 hover:bg-overlay transition-colors mr-1 shrink-0">
                                <IoListOutline className="text-lg text-[--text-color]" />
                            </button>
                        )}
                        <div className={`flex items-center shrink-0 ${clay ? 'gap-1' : 'gap-0.5'}`}>
                            <button onClick={() => {
                                if (fsMode === 'native') {
                                    if (nativeHistoryIdx > 0) {
                                        setNativeHistoryIdx(nativeHistoryIdx - 1);
                                        setNativePath(nativeHistory[nativeHistoryIdx - 1]);
                                    }
                                } else {
                                    if (currentpath.length > 1) setcurrentpath(currentpath.slice(0, -1));
                                }
                            }} className={`p-1 ${clay ? 'rounded-[8px] transition-all active:scale-[0.95]' : ''} ${(fsMode === 'native' ? nativeHistoryIdx > 0 : currentpath.length > 1) ? `text-[--text-color] cursor-pointer ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}` : 'text-[--text-muted] opacity-30'}`}
                            >
                                <IoChevronBack className="text-[16px]" />
                            </button>
                            <button onClick={() => {
                                if (fsMode === 'native' && nativeHistoryIdx < nativeHistory.length - 1) {
                                    setNativeHistoryIdx(nativeHistoryIdx + 1);
                                    setNativePath(nativeHistory[nativeHistoryIdx + 1]);
                                }
                            }} className={`p-1 ${clay ? 'rounded-[8px] transition-all active:scale-[0.95]' : ''} ${(fsMode === 'native' && nativeHistoryIdx < nativeHistory.length - 1) ? `text-[--text-color] cursor-pointer ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}` : 'text-[--text-muted] opacity-30'}`}
                            >
                                <IoChevronForward className="text-[16px]" />
                            </button>
                        </div>
                        {isTrashView ? (
                            <span className="text-[13px] font-semibold text-[--text-color] ml-1">Trash</span>
                        ) : fsMode === 'native' ? (
                            <div className={`flex items-center gap-0.5 ml-1 min-w-0 overflow-hidden flex-1 ${clay ? 'rounded-[12px] px-2 py-0.5' : ''}`}
                                style={clay ? { ...glassInput, boxShadow: 'none' } : undefined}
                            >
                                {nativePath.split('/').filter(Boolean).map((seg, i, arr) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-[--text-muted] text-xs opacity-40 shrink-0">/</span>}
                                        <button
                                            onClick={() => nativeNavigate('/' + arr.slice(0, i + 1).join('/'))}
                                            className={`text-[13px] shrink-0 px-1.5 py-0.5 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} hover:text-accent transition-colors truncate max-w-[120px] ${i === arr.length - 1 ? 'font-semibold text-[--text-color]' : 'text-[--text-muted]'}`}
                                        >
                                            {seg}
                                        </button>
                                    </React.Fragment>
                                ))}
                                {nativePath === '/' && <span className="text-[12px] font-semibold text-[--text-color] px-1">/</span>}
                            </div>
                        ) : (
                            <div className={`flex items-center gap-0.5 ml-1 min-w-0 overflow-hidden flex-1 ${clay ? 'rounded-[12px] px-2 py-0.5' : ''}`}
                                style={clay ? { ...glassInput, boxShadow: 'none' } : undefined}
                            >
                                {currentpath.map((seg, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-[--text-muted] text-xs opacity-40 shrink-0">/</span>}
                                        <button
                                            onClick={() => setcurrentpath(currentpath.slice(0, i + 1))}
                                            className={`text-[13px] shrink-0 px-1.5 py-0.5 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} hover:text-accent transition-colors truncate max-w-[120px] ${i === currentpath.length - 1 ? 'font-semibold text-[--text-color]' : 'text-[--text-muted]'}`}
                                        >
                                            {seg}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={`${clay ? 'h-[38px]' : 'h-[34px]'} shrink-0 flex items-center justify-between px-3 border-b gap-2 ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`} style={{ color: 'var(--text-color)', ...(clay ? { background: 'var(--bg-glass)' } : {}) }}>
                        <div className="flex items-center gap-1.5">
                            <div className={`flex items-center p-0.5 border ${clay ? 'rounded-[8px] border-[--glass-border]' : 'bg-overlay border-[--border-color]'}`}
                                style={clay ? { background: 'var(--bg-glass)' } : undefined}
                            >
                                <button
                                    onClick={() => { setviewmode('grid'); localStorage.setItem('nextaros-explorer-viewmode', 'grid'); }}
                                    className={`p-1.5 transition-colors ${clay ? 'rounded-[6px]' : ''} ${viewmode === 'grid' ? (clay ? 'bg-[--bg-glass-active] text-[--text-color]' : 'bg-[--bg-base] text-[--text-color]') : (clay ? 'text-[--text-muted] hover:bg-[--bg-glass-hover] hover:text-[--text-color]' : 'text-[--text-muted] hover:bg-[--bg-base] hover:text-[--text-color]')}`}
                                    title="Grid View"
                                >
                                    <IoGridOutline className="text-[14px]" />
                                </button>
                                <button
                                    onClick={() => { setviewmode('list'); localStorage.setItem('nextaros-explorer-viewmode', 'list'); }}
                                    className={`p-1.5 transition-colors ${clay ? 'rounded-[6px]' : ''} ${viewmode === 'list' ? (clay ? 'bg-[--bg-glass-active] text-[--text-color]' : 'bg-[--bg-base] text-[--text-color]') : (clay ? 'text-[--text-muted] hover:bg-[--bg-glass-hover] hover:text-[--text-color]' : 'text-[--text-muted] hover:bg-[--bg-base] hover:text-[--text-color]')}`}
                                    title="List View"
                                >
                                    <IoListOutline className="text-[14px]" />
                                </button>
                            </div>
                            {!isTrashView && (
                                <div className={`flex items-center p-0.5 border ${clay ? 'rounded-[8px] border-[--glass-border]' : 'bg-overlay border-[--border-color]'}`}
                                    style={clay ? { background: 'var(--bg-glass)' } : undefined}
                                >
                                    <button
                                        onClick={() => setFileModal({ isOpen: true, type: 'create-folder' })}
                                        className={`p-1.5 text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-base] transition-colors ${clay ? 'rounded-[6px] active:scale-[0.97]' : ''}`}
                                        title="New Folder"
                                    >
                                        <IoFolderOpenOutline className="text-[14px]" />
                                    </button>
                                    <div className={`w-px h-3.5 mx-0.5 ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`}></div>
                                    <button
                                        onClick={() => setFileModal({ isOpen: true, type: 'create-file' })}
                                        className={`p-1.5 text-[--text-muted] hover:text-[--text-color] hover:bg-[--bg-base] transition-colors ${clay ? 'rounded-[6px] active:scale-[0.97]' : ''}`}
                                        title="New File"
                                    >
                                        <IoDocumentTextOutline className="text-[14px]" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`relative w-40 sm:w-48 ${clay ? 'rounded-[8px]' : ''}`}
                                style={clay ? { ...glassInput, color: 'var(--text-color)' } : undefined}>
                                <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-muted]" size={12} />
                                <input
                                    className={`w-full pl-7 pr-2 py-1 text-xs outline-none transition-all placeholder-[--text-muted] ${clay ? 'bg-transparent text-[--text-color]' : 'bg-overlay focus:ring-1'}`}
                                    style={clay ? undefined : { color: 'var(--text-color)', '--tw-ring-color': 'color-mix(in srgb, var(--accent-color) 50%, transparent)' } as React.CSSProperties}
                                    placeholder="Search"
                                    value={searchquery}
                                    onChange={(e) => setsearchquery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setshowpreview(!showpreview)}
                                className={`p-1 transition-colors ${clay ? 'rounded-[6px] active:scale-[0.97]' : ''} ${showpreview ? (clay ? '' : 'bg-overlay') : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay')} ${showpreview ? 'text-accent' : 'text-[--text-muted]'}`}
                                style={showpreview && clay ? glassButton : undefined}
                                title="Toggle Preview"
                            >
                                <IoInformationCircleOutline className="text-[15px]" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 relative"
                        ref={fileViewRef}
                        onClick={() => {
                        }}
                    >
                        <SelectionArea
                            containerRef={fileViewRef as React.RefObject<HTMLElement>}
                            onSelectionChange={(rect) => {
                                if (rect) {
                                    const newSelectedIds: string[] = [];
                                    const items = fileViewRef.current?.querySelectorAll('.explorer-item');
                                    items?.forEach((el) => {
                                        const itemRect = el.getBoundingClientRect();
                                        if (
                                            rect.x < itemRect.x + itemRect.width &&
                                            rect.x + rect.width > itemRect.x &&
                                            rect.y < itemRect.y + itemRect.height &&
                                            rect.y + rect.height > itemRect.y
                                        ) {
                                            const id = el.getAttribute('data-id');
                                            if (id) newSelectedIds.push(id);
                                        }
                                    });
                                    setSelectedFileIds(newSelectedIds);
                                }
                            }}
                            onSelectionEnd={(rect) => {
                                if (!rect || (rect.width < 5 && rect.height < 5)) {
                                    setSelectedFileIds([]);
                                }
                            }}
                        />
                        {viewmode === 'grid' ? (
                            <div className="grid grid-cols-2 min-[450px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                                {filesList.map((file, i) => {
                                    const isSelected = selectedFileIds.includes(file.id);
                                    return (
                                        <div
                                            key={i}
                                            data-id={file.id}
                                            className={`explorer-item group flex flex-col items-center gap-2 p-2 cursor-default
                                        ${clay ? `${clayClasses.radiusSm} transition-all` : 'transition-colors'}
                                        ${isSelected
                                                    ? clay ? '' : 'bg-overlay'
                                                    : clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                            style={isSelected && clay ? { ...glassCard, background: 'var(--bg-glass-active)' } : undefined}
                                            onDoubleClick={() => handlefileopen(file)}
                                            onContextMenu={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e, file.id);
                                                if (!isSelected) {
                                                    setSelectedFileIds([file.id]);
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (e.shiftKey) {
                                                    if (selectedFileIds.includes(file.id)) {
                                                        setSelectedFileIds(prev => prev.filter(id => id !== file.id));
                                                    } else {
                                                        setSelectedFileIds(prev => [...prev, file.id]);
                                                    }
                                                } else {
                                                    setSelectedFileIds([file.id]);
                                                }
                                            }}
                                            draggable={!isTrashView}
                                            onDragStart={(e) => handleDragStart(e, file.id)}
                                            onDragOver={(e) => {
                                                if (file.mimetype === 'inode/directory' && !isTrashView) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }
                                            }}
                                            onDrop={(e) => {
                                                if (file.mimetype === 'inode/directory' && !isTrashView) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDrop(e, file.id);
                                                }
                                            }}
                                        >
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 relative flex items-center justify-center overflow-hidden ${clay ? 'rounded-[10px]' : ''}`}>
                                                {getFileIcon(file.mimetype, file.name, file.icon, file.id, file.content || file.link)}
                                            </div>
                                            <span
                                                className={`text-[12px] text-center leading-tight px-2 py-0.5 break-words w-full line-clamp-2
                                        ${isSelected ? `font-medium ${clay ? 'rounded-[6px] text-white' : 'text-[--bg-base]'}` : 'text-[--text-muted]'}`}
                                                style={isSelected ? { background: 'var(--accent-color)' } : undefined}
                                            >
                                                {getDisplayName(file)}
                                            </span>
                                            {isLocked(file.id) && (
                                                <div className={`absolute top-1 right-1 p-0.5 ${clay ? 'bg-[--bg-glass] rounded-[4px]' : 'bg-surface'}`}>
                                                    <IoLockClosed className="text-[8px] text-[--text-muted]" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="w-full">
                                <div className={`flex items-center border-b text-[10px] uppercase tracking-wider text-[--text-muted] font-semibold sticky top-0 z-[5] ${clay ? 'border-[--glass-border] rounded-t-[10px]' : 'border-[--border-color] bg-[--bg-base]'}`}
                                    style={clay ? { background: 'var(--bg-glass-active)' } : undefined}
                                >
                                    <button onClick={() => { if (sortby === 'name') setsortasc(!sortasc); else { setsortby('name'); setsortasc(true); } }} className={`flex items-center gap-1 flex-1 min-w-0 px-2 py-2 ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                        Name {sortby === 'name' && (sortasc ? <IoChevronUp size={10} /> : <IoChevronDown size={10} />)}
                                    </button>
                                    <button onClick={() => { if (sortby === 'date') setsortasc(!sortasc); else { setsortby('date'); setsortasc(true); } }} className={`flex items-center gap-1 w-32 px-2 py-2 ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} shrink-0 hidden sm:flex`}>
                                        Date Modified {sortby === 'date' && (sortasc ? <IoChevronUp size={10} /> : <IoChevronDown size={10} />)}
                                    </button>
                                    <button onClick={() => { if (sortby === 'size') setsortasc(!sortasc); else { setsortby('size'); setsortasc(true); } }} className={`flex items-center gap-1 w-20 px-2 py-2 ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} shrink-0`}>
                                        Size {sortby === 'size' && (sortasc ? <IoChevronUp size={10} /> : <IoChevronDown size={10} />)}
                                    </button>
                                    <button onClick={() => { if (sortby === 'type') setsortasc(!sortasc); else { setsortby('type'); setsortasc(true); } }} className={`flex items-center gap-1 w-24 px-2 py-2 ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} shrink-0 hidden md:flex`}>
                                        Kind {sortby === 'type' && (sortasc ? <IoChevronUp size={10} /> : <IoChevronDown size={10} />)}
                                    </button>
                                </div>
                                {filesList.map((file, i) => {
                                    const isSelected = selectedFileIds.includes(file.id);
                                    return (
                                        <div
                                            key={i}
                                            data-id={file.id}
                                            className={`explorer-item flex items-center cursor-default ${clay ? 'rounded-[12px] mx-1 transition-all' : 'border-b border-[--border-color]/50 transition-colors'} ${isSelected ? (clay ? '' : 'bg-[--bg-glass-hover]') : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay')}`}
                                            style={isSelected && clay ? { ...glassCard, background: 'var(--bg-glass-active)' } : undefined}
                                            onDoubleClick={() => handlefileopen(file)}
                                            onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, file.id); if (!isSelected) setSelectedFileIds([file.id]); }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (e.shiftKey) {
                                                    setSelectedFileIds(prev => prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]);
                                                } else { setSelectedFileIds([file.id]); }
                                            }}
                                            draggable={!isTrashView}
                                            onDragStart={(e) => handleDragStart(e, file.id)}
                                            onDragOver={(e) => { if (file.mimetype === 'inode/directory' && !isTrashView) { e.preventDefault(); e.stopPropagation(); } }}
                                            onDrop={(e) => { if (file.mimetype === 'inode/directory' && !isTrashView) { e.preventDefault(); e.stopPropagation(); handleDrop(e, file.id); } }}
                                        >
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-1.5">
                                                <div className="w-5 h-5 relative shrink-0 flex items-center justify-center overflow-hidden rounded-[3px]">
                                                    {getFileIcon(file.mimetype, file.name, file.icon, file.id, file.content || file.link)}
                                                </div>
                                                <span className={`text-[12px] truncate ${isSelected ? 'text-accent font-medium' : 'text-[--text-color]'}`}>
                                                    {getDisplayName(file)}
                                                </span>
                                                {isLocked(file.id) && <IoLockClosed className="text-[8px] text-[--text-muted] shrink-0" />}
                                            </div>
                                            <span className="w-32 px-2 text-[11px] text-[--text-muted] truncate shrink-0 hidden sm:block">{file.date || '--'}</span>
                                            <span className="w-20 px-2 text-[11px] text-[--text-muted] shrink-0">{file.mimetype === 'inode/directory' ? '--' : (file.size || '--')}</span>
                                            <span className="w-24 px-2 text-[11px] text-[--text-muted] truncate shrink-0 hidden md:block">{file.mimetype === 'inode/directory' ? 'Folder' : (file.mimetype?.split('/').pop() || '--')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {nativeLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                <div className="animate-spin h-8 w-8 border-b-2 border-[--text-muted] mb-2"></div>
                                <span className="text-[13px]">Loading Files...</span>
                            </div>
                        )}
                        {nativeError && (
                            <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                <span className="text-2xl mb-2 opacity-50">!</span>
                                <span className="text-[13px] text-pastel-red">{nativeError}</span>
                                <button onClick={() => nativeNavigate('/home')} className="mt-3 px-3 py-1.5 text-xs bg-overlay hover:bg-surface transition-colors">Go Home</button>
                            </div>
                        )}
                        {filesList.length === 0 && !nativeLoading && !nativeError && (
                            <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                <span className="text-4xl mb-2 opacity-50">¯\_(ツ)_/¯</span>
                                <span className="text-[13px]">No items found</span>
                                {!isTrashView && <span className="text-xs opacity-50 mt-1">Right click to create new items</span>}
                            </div>
                        )}
                    </div>

                    <div className={`h-[24px] border-t flex items-center px-4 justify-between shrink-0 ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-surface'}`}
                        style={clay ? { background: 'var(--bg-glass)' } : undefined}
                    >
                        <span className="text-[10px] text-[--text-muted] font-medium">
                            {filesList.length} item{filesList.length !== 1 && 's'}
                        </span>
                        {fsMode === 'native' && (
                            <span className="text-[10px] text-[--text-muted] opacity-60">{nativePath}</span>
                        )}
                    </div>
                </div>

                {showpreview && (
                    <div className={`
                        ${isnarrow
                            ? `h-[30%] w-full border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`
                            : `w-[250px] border-l ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`
                        }
                        flex flex-col transition-all duration-300 overflow-y-auto shrink-0
                        ${clay ? '' : 'bg-surface'}
                    `}
                        style={clay ? { ...glassSidebar, borderRight: 'none', borderLeft: isnarrow ? 'none' : '1px solid var(--glass-border)', borderTop: isnarrow ? '1px solid var(--glass-border)' : 'none' } : undefined}
                    >
                        {activefile ? (
                            <div className="flex flex-col items-center p-6 text-center animate-in fade-in duration-300">
                                <div className={`w-24 object-cover h-24 mb-4 drop-shadow-xl relative overflow-hidden ${clay ? 'rounded-[14px]' : ''}`}>
                                    {getFileIcon(activefile.mimetype, activefile.name, activefile.icon, activefile.id, activefile.content || activefile.link)}
                                </div>
                                <h3 className="text-lg font-semibold text-[--text-color] mb-1 break-words w-full">{getDisplayName(activefile)}</h3>
                                <p className="text-[11px] text-[--text-muted] mb-4">{activefile.mimetype}</p>

                                <div className="w-full space-y-3 text-left">
                                    <div className={`h-px w-full ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`}></div>

                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-[11px]">
                                        <span className="text-[--text-muted] text-right">Modified</span>
                                        <span className="text-[--text-color]">{activefile.date}</span>

                                        <span className="text-[--text-muted] text-right">Size</span>
                                        <span className="text-[--text-color]">{activefile.size}</span>
                                    </div>

                                    {activefile.description && (
                                        <div className="pt-2">
                                            <div className="text-xs font-semibold text-[--text-muted] mb-1">Information</div>
                                            <p className="text-[12px] text-[--text-color] leading-relaxed">
                                                {activefile.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => handlefileopen(activefile)}
                                            className={`text-white px-4 py-1.5 text-xs font-medium active:scale-95 transition-all hover:opacity-80 ${clay ? 'rounded-[8px]' : ''}`}
                                            style={{ background: 'var(--accent-color)' }}
                                        >
                                            Open
                                        </button>
                                        {activefile.isTrash && (
                                            <button
                                                onClick={() => restoreFromTrash(activefile.id)}
                                                className={`text-[--text-color] px-4 py-1.5 text-xs font-medium active:scale-95 transition-all ${clay ? 'rounded-[8px] bg-[--bg-glass-hover]' : 'bg-overlay hover:bg-overlay'}`}
                                            >
                                                Put Back
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        {(activefile.isTrash || !activefile.isSystem) && (
                                            <button
                                                onClick={() => activefile.isTrash ? deleteItem(activefile.id) : moveToTrash(activefile.id)}
                                                className="text-pastel-red hover:opacity-80 text-[10px] font-medium transition-colors"
                                            >
                                                {activefile.isTrash ? 'Delete Immediately' : 'Move to Trash'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            isTrashView ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[--text-muted]">
                                    <IoTrashOutline className="text-4xl mb-2 opacity-20" />
                                    <span className="text-xs mb-4">Items in Trash are deleted after 30 days</span>
                                    <button
                                        onClick={emptyTrash}
                                        className={`px-4 py-1.5 border text-[--text-muted] text-xs font-medium hover:bg-overlay ${clay ? 'border-[--glass-border] rounded-[10px]' : 'border-[--border-color]'}`}
                                    >
                                        Empty Trash
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[--text-muted]">
                                    <IoInformationCircleOutline className="text-4xl mb-2 opacity-20" />
                                    <span className="text-xs">Select an item to view details</span>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {quicklook && (
                    <motion.div
                        key="quicklook-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setquicklook(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className={`flex flex-col max-w-[80%] max-h-[80%] min-w-[300px] overflow-hidden ${clay ? 'rounded-[16px]' : 'bg-surface border border-[--border-color] shadow-2xl'}`}
                            style={clay ? {
                                ...glassCard,
                                boxShadow: 'var(--shadow-xl)',
                            } : undefined}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`h-9 shrink-0 flex items-center justify-between px-3 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}>
                                <span className="text-[12px] font-semibold text-[--text-color] truncate">{quicklook.name}</span>
                                <button onClick={() => setquicklook(null)} className={`p-1 hover:bg-overlay transition-colors text-[--text-muted] hover:text-[--text-color] ${clay ? 'rounded-[6px]' : ''}`}>
                                    <IoCloseOutline size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[200px]">
                                {quicklook.mimetype?.startsWith('image/') ? (
                                    quicklook.content?.startsWith('data:') ? (
                                        <img src={quicklook.content} alt={quicklook.name} className="max-w-full max-h-[60vh] object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-[--text-muted]">
                                            <div className="w-20 h-20">{getFileIcon(quicklook.mimetype, quicklook.name, quicklook.icon, quicklook.id, quicklook.content || quicklook.link)}</div>
                                            <span className="text-xs">Image preview unavailable</span>
                                        </div>
                                    )
                                ) : quicklook.mimetype?.startsWith('audio/') ? (
                                    quicklook.content?.startsWith('data:') ? (
                                        <audio controls src={quicklook.content} className="w-full max-w-sm" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-[--text-muted]">
                                            <div className="w-20 h-20">{getFileIcon(quicklook.mimetype, quicklook.name, quicklook.icon, quicklook.id, quicklook.content || quicklook.link)}</div>
                                            <span className="text-xs">Audio preview unavailable</span>
                                        </div>
                                    )
                                ) : quicklook.mimetype?.startsWith('video/') ? (
                                    quicklook.content?.startsWith('data:') ? (
                                        <video controls src={quicklook.content} className="max-w-full max-h-[60vh]" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-[--text-muted]">
                                            <div className="w-20 h-20">{getFileIcon(quicklook.mimetype, quicklook.name, quicklook.icon, quicklook.id, quicklook.content || quicklook.link)}</div>
                                            <span className="text-xs">Video preview unavailable</span>
                                        </div>
                                    )
                                ) : quicklook.mimetype?.startsWith('text/') || quicklook.mimetype === 'application/json' || quicklook.mimetype === 'application/javascript' || quicklook.mimetype === 'application/xml' ? (
                                    <pre className={`w-full h-full overflow-auto bg-[--bg-base] border p-3 text-[11px] text-[--text-color] font-mono whitespace-pre-wrap break-words max-h-[60vh] ${clay ? 'border-[--glass-border] rounded-[10px]' : 'border-[--border-color]'}`}>
                                        {quicklook.content || '(empty)'}
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-center py-4">
                                        <div className="w-20 h-20">{getFileIcon(quicklook.mimetype, quicklook.name, quicklook.icon, quicklook.id, quicklook.content || quicklook.link)}</div>
                                        <div>
                                            <div className="text-[13px] font-semibold text-[--text-color] mb-1">{quicklook.name}</div>
                                            <div className="text-[11px] text-[--text-muted]">{quicklook.mimetype || 'Unknown type'}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                                            <span className="text-[--text-muted] text-right">Size</span>
                                            <span className="text-[--text-color]">{quicklook.size || '--'}</span>
                                            <span className="text-[--text-muted] text-right">Modified</span>
                                            <span className="text-[--text-color]">{quicklook.date || '--'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={`h-7 shrink-0 flex items-center justify-between px-3 border-t text-[10px] text-[--text-muted] ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-overlay'}`}>
                                <span>{quicklook.mimetype || 'Unknown'}</span>
                                <span>{quicklook.size || '--'}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
