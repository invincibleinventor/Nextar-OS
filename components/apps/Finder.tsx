'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    IoCloseOutline, IoFolderOutline, IoDocumentTextOutline, IoAppsOutline,
    IoGridOutline, IoListOutline, IoChevronBack, IoChevronForward,
    IoSearch, IoGlobeOutline, IoInformationCircleOutline, IoChevronDown, IoChevronUp, IoFolderOpenOutline, IoLockClosed
} from "react-icons/io5";
import Image from 'next/image';
import { useWindows } from '../WindowContext';
import { apps, sidebaritems, filesystemitem, openSystemItem, getFileIcon } from '../data';
import { useDevice } from '../DeviceContext';

import { IoTrashOutline, IoAddCircleOutline } from "react-icons/io5";
import { useFileSystem } from '../FileSystemContext';
import ContextMenu from '../ui/ContextMenu';
import FileModal from '../ui/FileModal';
import { SelectionArea } from '../ui/SelectionArea';

export default function Finder({ initialpath, istrash }: { initialpath?: string[], istrash?: boolean }) {
    const [selected, setselected] = useState(istrash ? 'Trash' : 'Projects');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [showsidebar, setshowsidebar] = useState(true);
    const [showpreview, setshowpreview] = useState(true);
    const { addwindow, windows, updatewindow, setactivewindow, activewindow } = useWindows();
    const { ismobile } = useDevice();
    const { files, deleteItem, createFolder, createFile, moveToTrash, emptyTrash, restoreFromTrash, moveItem, copyItem, cutItem, pasteItem, clipboard, renameItem } = useFileSystem();

    const [currentpath, setcurrentpath] = useState<string[]>(initialpath || ['Macintosh HD', 'Users', 'Bala', 'Projects']);
    const [searchquery, setsearchquery] = useState("");

    const [isnarrow, setisnarrow] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);
    const fileViewRef = useRef<HTMLDivElement>(null);
    const [isTrashView, setIsTrashView] = useState(istrash || false);

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

    const handlesidebarclick = (itemname: string, path: string[]) => {
        setselected(itemname);
        setcurrentpath(path);
        if (isnarrow) setshowsidebar(false);
        setSelectedFileIds([]);
        setIsTrashView(itemname === 'Trash');
    };

    const getcurrentfiles = (): filesystemitem[] => {
        if (isTrashView) {
            return files.filter(f => f.parent === 'root-trash' && f.id !== 'root-trash');
        }

        let currentparentid = 'root';

        for (const foldername of currentpath) {
            const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid && !i.isTrash);
            if (folder) {
                currentparentid = folder.id;
            } else if (currentpath.length > 0 && currentparentid === 'root') {
            }
        }

        let currentFiles = files.filter(i => i.parent === currentparentid && !i.isTrash);

        if (searchquery) {
            currentFiles = files.filter(f => f.name.toLowerCase().includes(searchquery.toLowerCase()) && !f.isTrash);
        }

        return currentFiles;
    };



    const filesList = getcurrentfiles();
    const activefile = selectedFileIds.length > 0 ? files.find(f => f.id === selectedFileIds[0]) : null;

    const handlefileopen = (file: filesystemitem) => {
        if (file.mimetype === 'inode/directory') {
            setcurrentpath([...currentpath, file.name]);
            setsearchquery("");
            setSelectedFileIds([]);
        } else if (file.mimetype === 'inode/shortcut') {
            if (isTrashView) return;
            openSystemItem(file, { addwindow, windows, updatewindow, setactivewindow, ismobile, files });
        } else {
            if (isTrashView) return;
            openSystemItem(file, { addwindow, windows, updatewindow, setactivewindow, ismobile, files });
        }
    };

    const [fileModal, setFileModal] = useState<{ isOpen: boolean, type: 'create-folder' | 'create-file' | 'rename', initialValue?: string }>({ isOpen: false, type: 'create-folder' });

    useEffect(() => {
        const handleGlobalMenu = (e: CustomEvent) => {
            if (!activewindow) return;

            const activeApp = windows.find((w: any) => w.id === activewindow)?.appname;
            if (activeApp !== 'Finder') return;

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
    }, [activewindow, windows]);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId?: string } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, fileId?: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, fileId });
    };

    const handleModalConfirm = (inputValue: string) => {
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

    const getContextMenuItems = () => {
        const activeFileItem = contextMenu?.fileId ? files.find(f => f.id === contextMenu?.fileId) : null;

        if (activeFileItem) {
            const targets = (selectedFileIds.includes(activeFileItem.id)) ? selectedFileIds : [activeFileItem.id];
            const hasReadOnly = targets.some(id => files.find(f => f.id === id)?.isReadOnly || files.find(f => f.id === id)?.isSystem);
            const isMulti = targets.length > 1;

            if (isTrashView) {
                return [
                    { label: isMulti ? `Put Back ${targets.length} Items` : 'Put Back', action: () => targets.forEach(id => restoreFromTrash(id)) },
                    { label: isMulti ? `Delete ${targets.length} Items Immediately` : 'Delete Immediately', action: () => targets.forEach(id => deleteItem(id)), danger: true }
                ];
            }

            const canRename = !isMulti && !activeFileItem.isReadOnly;

            const baseItems: any[] = [
                {
                    label: 'Open', action: () => targets.forEach(id => {
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
            if (!isMulti) baseItems.push({ label: 'Get Info', action: () => openSystemItem(activeFileItem, { addwindow, windows, updatewindow, setactivewindow, ismobile }, 'getinfo') });

            if (!isMulti) {
                baseItems.push({
                    label: 'Rename',
                    action: () => setFileModal({ isOpen: true, type: 'rename', initialValue: activeFileItem.name }),
                    disabled: !canRename
                });
            }

            baseItems.push({ separator: true, label: '' });
            baseItems.push({ label: isMulti ? `Copy ${targets.length} Items` : 'Copy', action: () => copyItem(targets) });
            baseItems.push({ label: isMulti ? `Cut ${targets.length} Items` : 'Cut', action: () => cutItem(targets), disabled: hasReadOnly });

            return [
                ...baseItems,
                { separator: true, label: '' },
                { label: isMulti ? `Move ${targets.length} Items to Trash` : 'Move to Trash', action: () => targets.forEach(id => moveToTrash(id)), danger: true, disabled: hasReadOnly }
            ];
        } else {
            return [
                { label: 'New Folder', action: () => setFileModal({ isOpen: true, type: 'create-folder', initialValue: '' }) },
                { label: 'New File', action: () => setFileModal({ isOpen: true, type: 'create-file', initialValue: '' }) },
                { separator: true, label: '' },
                {
                    label: 'Paste', action: () => {
                        let currentParentId = 'root';
                        for (const folderName of currentpath) {
                            const folder = files.find(f => f.name === folderName && f.parent === currentParentId && !f.isTrash);
                            if (folder) currentParentId = folder.id;
                        }
                        pasteItem(currentParentId);
                    }, disabled: !clipboard
                },
                { separator: true, label: '' },
                {
                    label: 'Get Info', action: () => {
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
                }
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

    const handleDrop = (e: React.DragEvent, targetParentId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = e.dataTransfer.getData('sourceId');
        if (!sourceId) return;

        let destinationId = targetParentId;

        if (!destinationId) {
            let currentparentid = 'root';
            for (const foldername of currentpath) {
                const folder = files.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid && !i.isTrash);
                if (folder) {
                    currentparentid = folder.id;
                }
            }
            destinationId = currentparentid;
        }

        if (sourceId === destinationId) return;

        moveItem(sourceId, destinationId);
    };

    return (
        <div
            ref={containerref}
            onContextMenu={(e) => handleContextMenu(e)}
            className="flex h-full w-full bg-transparent text-black dark:text-white font-sf text-[13px] overflow-hidden rounded-b-xl relative select-none"
            onClick={() => {
                if (isnarrow && showsidebar) setshowsidebar(false);
                setContextMenu(null);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e)}
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

            <div className={`
                ${showsidebar
                    ? isnarrow ? 'absolute inset-y-0 left-0 z-30 w-[220px] shadow-2xl bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur border-r border-black/5 dark:border-white/5'
                        : 'relative w-[200px] border-r border-black/5 dark:border-white/5 bg-transparent backdrop-blur-xl'
                    : '-translate-x-full w-0 border-none'
                } 
                transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] 
                flex flex-col pt-4 h-full transform
            `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`flex-1 overflow-y-auto ${ismobile ? '' : 'pt-[36px]'} px-2 ${showsidebar ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                    {sidebaritems.map((group, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500/80 dark:text-gray-400/80 uppercase tracking-wide mb-1 px-3">
                                {group.title}
                            </div>
                            <div className="space-y-[1px]">
                                {group.items.map((item) => (
                                    <div
                                        key={item.name}
                                        onClick={() => handlesidebarclick(item.name, item.path)}
                                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                                            ${selected === item.name
                                                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
                                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <item.icon className={`text-[16px] ${selected === item.name ? 'text-[#007AFF]' : 'text-[#007AFF]/80'}`} />
                                        <span className="truncate leading-none pb-[2px] block">{item.name}</span>
                                    </div>
                                ))}
                                {idx === sidebaritems.length - 1 && (
                                    <div
                                        key="Trash"
                                        onClick={() => handlesidebarclick('Trash', [])}
                                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 mt-2
                                            ${selected === 'Trash'
                                                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
                                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <IoTrashOutline className={`text-[16px] ${selected === 'Trash' ? 'text-red-500' : 'text-gray-500'}`} />
                                        <span className="truncate leading-none pb-[2px] block">Trash</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex ${isnarrow ? 'flex-col' : 'flex-row'} min-w-0 dark:bg-neutral-900 bg-white relative overflow-hidden`}>

                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    <div className={`${!ismobile && !showsidebar ? 'ps-20' : ''} h-[50px] shrink-0 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/5`}>
                        <div className="flex items-center gap-2 text-gray-500">
                            {isnarrow && (
                                <button onClick={() => setshowsidebar(!showsidebar)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors mr-2">
                                    <IoListOutline className="text-xl text-black dark:text-white" />
                                </button>
                            )}
                            <div className={(isnarrow && !ismobile) ? "flex items-center gap-1" : "flex items-center gap-1"}>
                                <IoChevronBack className={`text-xl ${currentpath.length > 1 ? 'text-black dark:text-white cursor-pointer rounded' : 'opacity-20'}`} onClick={() => currentpath.length > 1 && setcurrentpath(currentpath.slice(0, -1))} />
                                <IoChevronForward className="text-xl opacity-20" />
                            </div>
                            <span className="text-[14px] font-semibold text-black dark:text-white ml-2">
                                {isTrashView ? 'Trash' : currentpath[currentpath.length - 1]}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isTrashView && (
                                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                                    <button
                                        onClick={() => setFileModal({ isOpen: true, type: 'create-folder' })}
                                        className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                                        title="New Folder"
                                    >
                                        <IoFolderOpenOutline className="text-lg" />
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    <button
                                        onClick={() => setFileModal({ isOpen: true, type: 'create-file' })}
                                        className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-300"
                                        title="New File"
                                    >
                                        <IoDocumentTextOutline className="text-lg" />
                                    </button>
                                </div>
                            )}

                            <div className="relative w-40 sm:w-48 ml-2">
                                <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="w-full bg-black/5 dark:bg-white/10 rounded-md pl-7 pr-2 py-1 text-xs outline-none focus:ring-1 ring-blue-500/50 transition-all placeholder-gray-500 text-black dark:text-white"
                                    placeholder="Search"
                                    value={searchquery}
                                    onChange={(e) => setsearchquery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setshowpreview(!showpreview)}
                                className={`p-1 rounded-md transition-colors ${showpreview ? 'bg-black/10 dark:bg-white/10 text-[#007AFF]' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                                title="Toggle Preview"
                            >
                                <IoInformationCircleOutline className="text-lg" />
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
                                    const items = fileViewRef.current?.querySelectorAll('.finder-item');
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
                        <div className="grid grid-cols-2 min-[450px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                            {filesList.map((file, i) => {
                                const isSelected = selectedFileIds.includes(file.id);
                                return (
                                    <div
                                        key={i}
                                        data-id={file.id}
                                        className={`finder-item group flex flex-col items-center gap-2 p-2 rounded-lg transition-colors cursor-default
                                        ${isSelected
                                                ? 'bg-black/10 dark:bg-white/10'
                                                : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
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
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex items-center justify-center">
                                            {getFileIcon(file.mimetype, file.name, file.icon)}
                                        </div>
                                        <span className={`text-[12px] text-center leading-tight px-2 py-0.5 rounded break-words w-full line-clamp-2
                                        ${isSelected ? 'bg-[#007AFF] text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {file.name}
                                        </span>
                                        {file.isReadOnly && (
                                            <div className="absolute top-1 right-1 bg-white/80 dark:bg-black/80 rounded-full p-0.5 shadow-sm">
                                                <IoLockClosed className="text-[8px] text-black dark:text-white" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {filesList.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <span className="text-4xl mb-2 opacity-50">¯\_(ツ)_/¯</span>
                                <span className="text-sm">No items found</span>
                                {!isTrashView && <span className="text-xs opacity-50 mt-1">Right click to create new items</span>}
                            </div>
                        )}
                    </div>

                    <div className="h-[24px] bg-[#f8f8f8] dark:bg-[#282828] border-t border-black/5 dark:border-white/5 flex items-center px-4 justify-center shrink-0">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            {filesList.length} item{filesList.length !== 1 && 's'}
                        </span>
                    </div>
                </div>

                {showpreview && (
                    <div className={`
                        ${isnarrow
                            ? 'h-[30%] w-full border-t border-black/10 dark:border-white/10'
                            : 'w-[250px] border-l border-black/5 dark:border-white/5'
                        }
                        bg-white/50 dark:bg-[#2d2d2d]/50 backdrop-blur-md flex flex-col transition-all duration-300 overflow-y-auto shrink-0
                    `}>
                        {activefile ? (
                            <div className="flex flex-col items-center p-6 text-center animate-in fade-in duration-300">
                                <div className="w-24 object-cover h-24 mb-4 drop-shadow-xl relative">
                                    {getFileIcon(activefile.mimetype, activefile.name, activefile.icon)}
                                </div>
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-1 break-words w-full">{activefile.name}</h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">{activefile.mimetype}</p>

                                <div className="w-full space-y-3 text-left">
                                    <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-[11px]">
                                        <span className="text-gray-500 text-right">Modified</span>
                                        <span className="text-black dark:text-white">{activefile.date}</span>

                                        <span className="text-gray-500 text-right">Size</span>
                                        <span className="text-black dark:text-white">{activefile.size}</span>
                                    </div>

                                    {activefile.description && (
                                        <div className="pt-2">
                                            <div className="text-xs font-semibold text-gray-500 mb-1">Information</div>
                                            <p className="text-[12px] text-black/80 dark:text-white/80 leading-relaxed">
                                                {activefile.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => handlefileopen(activefile)}
                                            className="bg-[#007AFF] hover:bg-[#007afe] text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all"
                                        >
                                            Open
                                        </button>
                                        {activefile.isTrash && (
                                            <button
                                                onClick={() => restoreFromTrash(activefile.id)}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all"
                                            >
                                                Put Back
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        {(activefile.isTrash || !activefile.isSystem) && (
                                            <button
                                                onClick={() => activefile.isTrash ? deleteItem(activefile.id) : moveToTrash(activefile.id)}
                                                className="text-red-500 hover:text-red-600 text-[10px] font-medium transition-colors"
                                            >
                                                {activefile.isTrash ? 'Delete Immediately' : 'Move to Trash'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            isTrashView ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
                                    <IoTrashOutline className="text-4xl mb-2 opacity-20" />
                                    <span className="text-xs mb-4">Items in Trash are deleted after 30 days</span>
                                    <button
                                        onClick={emptyTrash}
                                        className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        Empty Trash
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
                                    <IoInformationCircleOutline className="text-4xl mb-2 opacity-20" />
                                    <span className="text-xs">Select an item to view details</span>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
