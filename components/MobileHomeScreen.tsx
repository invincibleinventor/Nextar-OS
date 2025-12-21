'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useDevice } from './DeviceContext';
import { apps, filesystemitem, openSystemItem, getFileIcon } from './data';
import { useSettings } from './SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AppLibrary from './AppLibrary';
import { useWindows } from './WindowContext';
import { useFileSystem } from './FileSystemContext';
import ContextMenu from './ui/ContextMenu';

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { reducemotion } = useSettings();
    const { ismobile } = useDevice();
    const { files, moveToTrash, createFolder, createFile, currentUserDesktopId } = useFileSystem();
    const [page, setpage] = useState(0);
    const [editmode, seteditmode] = useState(false);
    const [contextmenu, setcontextmenu] = useState<{ x: number; y: number; item?: filesystemitem } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const longpresstimer = useRef<NodeJS.Timeout | null>(null);
    const touchstartpos = useRef<{ x: number; y: number } | null>(null);
    const [iconorder, seticonorder] = useState<string[]>([]);

    const desktopItems = files.filter(item => item.parent === currentUserDesktopId && !item.isTrash);

    React.useEffect(() => {
        const savedorder = localStorage.getItem('mobile-icon-order');
        if (savedorder) {
            seticonorder(JSON.parse(savedorder));
        }
    }, []);

    const dockAppIds = ['finder', 'safari', 'mail', 'settings'];

    const isDockItem = (item: filesystemitem) => {
        if (item.mimetype !== 'application/x-executable') return false;
        const appId = item.id.replace('desktop-app-', '');
        return dockAppIds.includes(appId);
    };

    const getorderedgriditems = useCallback(() => {
        const griditems = desktopItems.filter(item => !isDockItem(item));

        if (iconorder.length === 0) return griditems;

        const orderedItems: filesystemitem[] = [];
        const remainingItems = [...griditems];

        iconorder.forEach(id => {
            const index = remainingItems.findIndex(item => item.id === id);
            if (index !== -1) {
                orderedItems.push(remainingItems[index]);
                remainingItems.splice(index, 1);
            }
        });

        return [...orderedItems, ...remainingItems];
    }, [desktopItems, iconorder]);

    const griditems = getorderedgriditems();

    const handleItemClick = (item: filesystemitem) => {
        if (editmode) {
            seteditmode(false);
            return;
        }
        openSystemItem(item, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
    };

    const dockapps = apps.filter(a =>
        a.id === 'finder' || a.id === 'safari' || a.id === 'mail' || a.id === 'settings'
    ).slice(0, 4);

    const handlelongpressstart = (item: filesystemitem | null, e: React.TouchEvent | React.MouseEvent) => {
        const touch = 'touches' in e ? e.touches[0] : e;
        touchstartpos.current = { x: touch.clientX, y: touch.clientY };
        longpresstimer.current = setTimeout(() => {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
            setcontextmenu({ x: touch.clientX, y: touch.clientY, item: item || undefined });
        }, 500);
    };

    const handlelongpressmove = (e: React.TouchEvent) => {
        if (!touchstartpos.current || !longpresstimer.current) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchstartpos.current.x);
        const dy = Math.abs(touch.clientY - touchstartpos.current.y);
        if (dx > 10 || dy > 10) {
            handlelongpressend();
        }
    };

    const handlelongpressend = () => {
        if (longpresstimer.current) {
            clearTimeout(longpresstimer.current);
            longpresstimer.current = null;
        }
        touchstartpos.current = null;
    };

    const handlereorder = (draggedId: string, targetIndex: number) => {
        const currentItems = getorderedgriditems();
        const currentIndex = currentItems.findIndex(item => item.id === draggedId);
        if (currentIndex === -1 || currentIndex === targetIndex) return;

        const newItems = [...currentItems];
        const [removed] = newItems.splice(currentIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        const neworderids = newItems.map(item => item.id);
        seticonorder(neworderids);
        localStorage.setItem('mobile-icon-order', JSON.stringify(neworderids));
    };

    const getcontextmenuitems = () => {
        if (!contextmenu) return [];

        if (contextmenu.item) {
            const item = contextmenu.item;
            const items: any[] = [
                {
                    label: 'Open',
                    action: () => {
                        openSystemItem(item, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
                    }
                }
            ];

            if (item.mimetype === 'application/x-executable') {
                const appid = item.id.replace('desktop-app-', '');
                const app = apps.find(a => a.id === appid);
                if (app?.multiwindow) {
                    items.push({
                        label: 'Open New Window',
                        action: () => {
                            openSystemItem(item, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
                        }
                    });
                }
            }

            items.push({ separator: true, label: '' });

            items.push({
                label: 'Edit Home Screen',
                action: () => seteditmode(true)
            });

            items.push({
                label: 'Show in Finder',
                action: () => openSystemItem('finder', { addwindow, windows, setactivewindow, updatewindow, ismobile, files }, undefined, { openPath: item.parent || currentUserDesktopId, selectItem: item.id })
            });

            if (!item.isReadOnly && !item.isSystem) {
                items.push({ separator: true, label: '' });
                items.push({
                    label: 'Move to Trash',
                    action: () => {
                        if (contextmenu.item?.mimetype === 'application/x-executable' || contextmenu.item?.id.startsWith('desktop-app-')) {
                            moveToTrash(contextmenu.item?.id || '');
                        } else if (contextmenu.item?.id) {
                            setConfirmDelete(contextmenu.item.id);
                        }
                    },
                    separator: true
                });
            }

            return items;
        } else {
            return [
                {
                    label: 'New Folder',
                    action: () => createFolder('New Folder', currentUserDesktopId)
                },
                {
                    label: 'New File',
                    action: () => createFile('Untitled.txt', currentUserDesktopId)
                },
                { separator: true, label: '' },
                {
                    label: 'Edit Home Screen',
                    action: () => seteditmode(true)
                }
            ];
        }
    };

    const [draggeditem, setdraggeditem] = useState<string | null>(null);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-transparent"
            onClick={() => editmode && seteditmode(false)}
            onTouchStart={(e) => {
                if ((e.target as HTMLElement).closest('.app-icon')) return;
                handlelongpressstart(null, e);
            }}
            onTouchMove={handlelongpressmove}
            onTouchEnd={handlelongpressend}
            onTouchCancel={handlelongpressend}
            onContextMenu={(e) => {
                e.preventDefault();
                if ((e.target as HTMLElement).closest('.app-icon')) return;
                setcontextmenu({ x: e.clientX, y: e.clientY });
            }}
        >
            {contextmenu && (
                <ContextMenu
                    x={contextmenu.x}
                    y={contextmenu.y}
                    items={getcontextmenuitems()}
                    onClose={() => setcontextmenu(null)}
                />
            )}

            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px]"
                        onClick={() => setConfirmDelete(null)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-sm m-4 mb-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-xl rounded-[14px] overflow-hidden">
                                    <div className="p-4 text-center border-b border-black/5 dark:border-white/5">
                                        <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Delete Item?</h3>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Are you sure you want to remove this item from the home screen?</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirmDelete) moveToTrash(confirmDelete);
                                            setConfirmDelete(null);
                                        }}
                                        className="w-full py-4 text-[20px] text-red-500 font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="w-full py-4 bg-white dark:bg-[#1e1e1e] rounded-[14px] text-[20px] text-accent font-semibold active:scale-[0.98] transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.offsetWidth;
                    const newPage = Math.round(scrollLeft / width);
                    if (newPage !== page) {
                        setpage(newPage);
                    }
                }}
            >
                <div className="w-[100vw] h-full flex flex-col pt-14 relative snap-center flex-shrink-0">
                    <div className="flex-1 px-4">
                        <div data-tour="ios-apps" className="grid grid-cols-4 gap-x-2 gap-y-5">
                            {griditems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    layoutId={item.id}
                                    className="app-icon flex flex-col items-center gap-1 touch-none"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={editmode ? {
                                        opacity: 1,
                                        scale: 1,
                                        rotate: [-2, 2, -2]
                                    } : {
                                        opacity: 1,
                                        scale: 1,
                                        rotate: 0
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        rotate: editmode ? {
                                            repeat: Infinity,
                                            repeatType: "mirror",
                                            duration: 0.25,
                                            ease: "easeInOut"
                                        } : { duration: 0 },
                                        scale: { duration: 0.2 },
                                        default: { type: 'spring', damping: 25, stiffness: 300 }
                                    } as any}
                                    draggable={editmode}
                                    onDragStart={() => setdraggeditem(item.id)}
                                    onDragEnd={() => setdraggeditem(null)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggeditem && draggeditem !== item.id) {
                                            handlereorder(draggeditem, index);
                                        }
                                    }}
                                    onClick={() => !editmode && handleItemClick(item)}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        if (!editmode) handlelongpressstart(item, e);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.stopPropagation();
                                        handlelongpressend();
                                    }}
                                    onTouchCancel={(e) => {
                                        e.stopPropagation();
                                        handlelongpressend();
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setcontextmenu({ x: e.clientX, y: e.clientY, item });
                                    }}
                                    whileTap={editmode ? {} : { scale: 0.9 }}
                                >
                                    <div className="relative">
                                        {editmode && (
                                            <button
                                                className="absolute -top-1 -left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.mimetype === 'application/x-executable' || item.id.startsWith('desktop-app-')) {
                                                        moveToTrash(item.id);
                                                    } else {
                                                        setConfirmDelete(item.id);
                                                    }
                                                }}
                                            >
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden dark:bg-black/10 bg-white/10 shadow-sm ring-1 ring-white/5 relative">
                                            <div className="w-full my-auto h-full flex flex-col">
                                                {getFileIcon(item.mimetype, item.name, item.icon)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-white/90 text-center leading-tight drop-shadow-md truncate w-full tracking-tight">
                                        {item.name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {editmode && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-[165px] left-0 right-0 mx-auto w-max z-30 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                seteditmode(false);
                            }}
                        >
                            Done
                        </motion.button>
                    )}

                    <div data-tour="ios-dock" className={`mx-auto mb-7 p-3 rounded-[25px] w-max flex items-center justify-between gap-4 transition-all duration-300 ${isoverlayopen ? 'bg-transparent' : 'dark:bg-black/10 bg-white/10 backdrop-blur-sm shadow-lg border border-white/10'}`}>
                        {dockapps.map(app => (
                            <motion.button
                                key={app.id}
                                onClick={() => {
                                    openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
                                }}
                                whileTap={{ scale: 0.85 }}
                                className="w-[65px] h-[65px] aspect-square rounded-[18px] overflow-hidden relative"
                            >
                                <Image
                                    src={app.icon}
                                    alt={app.appname}
                                    fill
                                    sizes="65px"
                                    className="object-cover"
                                    draggable={false}
                                />
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="w-[100vw] h-full pt-0 snap-center flex-shrink-0">
                    <AppLibrary />
                </div>
            </div>

            <div className={`absolute bottom-[140px] left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none transition-opacity duration-300 ${isoverlayopen || page === 1 ? 'opacity-0' : 'opacity-100'}`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 0 ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 1 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
        </div>
    );
}
