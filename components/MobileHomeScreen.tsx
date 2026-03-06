'use client';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useDevice } from './DeviceContext';
import { apps, filesystemitem, openSystemItem, getFileIcon } from './data';

const extractAppId = (fileId: string): string => {
    if (fileId.includes('desktop-app-')) {
        return fileId.split('desktop-app-').pop() || '';
    } else if (fileId.includes('-app-')) {
        return fileId.split('-app-').pop() || '';
    }
    return fileId;
};
import { useSettings } from './SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import AppLibrary from './AppLibrary';
import { useWindows } from './WindowContext';
import { useFileSystem } from './FileSystemContext';
import ContextMenu from './ui/ContextMenu';
import TintedAppIcon, { squircleClip } from './ui/TintedAppIcon';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassInput } from './hooks/useClayStyles';

const GRID_COLS = 4;
const GRID_ROWS = 4;
const ITEMS_PER_PAGE = GRID_COLS * GRID_ROWS;

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { reducemotion, islightbackground, inverselabelcolor } = useSettings();
    const clay = useIsClay();
    const { ismobile } = useDevice();
    const { files, moveToTrash, createFolder, createFile, renameItem, currentUserDesktopId, copyItem, cutItem, pasteItem, clipboard } = useFileSystem();
    const [page, setpage] = useState(0);
    const [showAppLibrary, setShowAppLibrary] = useState(false);
    const [editmode, seteditmode] = useState(false);
    const [contextmenu, setcontextmenu] = useState<{ x: number; y: number; item?: filesystemitem } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const longpresstimer = useRef<NodeJS.Timeout | null>(null);
    const touchstartpos = useRef<{ x: number; y: number } | null>(null);
    const scrollcontainerref = useRef<HTMLDivElement>(null);
    const [iconorder, seticonorder] = useState<string[]>([]);
    const [hiddenAppIds, setHiddenAppIds] = useState<string[]>([]);
    const homeContainerRef = useRef<HTMLDivElement>(null);
    const showAppLibraryRef = useRef(false);
    showAppLibraryRef.current = showAppLibrary;

    const desktopItems = files.filter(item => item.parent === currentUserDesktopId && !item.isTrash);

    React.useEffect(() => {
        const savedorder = localStorage.getItem('mobile-icon-order');
        if (savedorder) {
            seticonorder(JSON.parse(savedorder));
        }
        const savedHidden = localStorage.getItem('mobile-hidden-apps');
        if (savedHidden) {
            setHiddenAppIds(JSON.parse(savedHidden));
        }
    }, []);

    useEffect(() => {
        const scrollToHome = () => {
            if (scrollcontainerref.current) {
                scrollcontainerref.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        };
        const handleAppBack = (e: Event) => {
            // Close app library on back gesture
            if (showAppLibraryRef.current) {
                e.preventDefault();
                setShowAppLibrary(false);
                return;
            }
            const currentScroll = scrollcontainerref.current?.scrollLeft || 0;
            const pageWidth = scrollcontainerref.current?.offsetWidth || 1;
            const currentPage = Math.round(currentScroll / pageWidth);
            if (currentPage > 0) {
                e.preventDefault();
                scrollcontainerref.current?.scrollTo({ left: (currentPage - 1) * pageWidth, behavior: 'smooth' });
            }
        };
        const handleHomePressed = () => {
            setShowAppLibrary(false);
            scrollToHome();
        };

        window.addEventListener('app-back', handleAppBack);
        window.addEventListener('home-pressed', handleHomePressed);
        return () => {
            window.removeEventListener('app-back', handleAppBack);
            window.removeEventListener('home-pressed', handleHomePressed);
        };
    }, []);

    const dockAppIds = ['calculator', 'notes', 'calendar', 'browser'];

    const isDockItem = (item: filesystemitem) => {
        if (item.mimetype !== 'application/x-executable') return false;
        const appId = extractAppId(item.id);
        return dockAppIds.includes(appId);
    };

    const pinnedFirstPageIds = ['portfolio', 'explorer', 'hackathonworkspace', 'photos'];

    const getorderedgriditems = useCallback(() => {
        const griditems = desktopItems.filter(item => !isDockItem(item) && !hiddenAppIds.includes(item.id));

        if (iconorder.length === 0) {
            const pinned: filesystemitem[] = [];
            const rest: filesystemitem[] = [];
            for (const item of griditems) {
                const appId = extractAppId(item.id);
                if (pinnedFirstPageIds.includes(appId)) {
                    pinned.push(item);
                } else {
                    rest.push(item);
                }
            }
            pinned.sort((a, b) => pinnedFirstPageIds.indexOf(extractAppId(a.id)) - pinnedFirstPageIds.indexOf(extractAppId(b.id)));
            return [...pinned, ...rest];
        }

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
    }, [desktopItems, iconorder, hiddenAppIds]);

    const griditems = getorderedgriditems();

    const gridPages = useMemo(() => {
        const pages: filesystemitem[][] = [];
        const firstPageCount = iconorder.length === 0 ? pinnedFirstPageIds.length : ITEMS_PER_PAGE;
        const firstPage = griditems.slice(0, firstPageCount);
        pages.push(firstPage);
        const remaining = griditems.slice(firstPageCount);
        for (let i = 0; i < remaining.length; i += ITEMS_PER_PAGE) {
            pages.push(remaining.slice(i, i + ITEMS_PER_PAGE));
        }
        return pages;
    }, [griditems, iconorder]);

    const totalPages = gridPages.length + 1;

    const handleItemClick = (item: filesystemitem) => {
        if (editmode) {
            seteditmode(false);
            return;
        }
        openSystemItem(item, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
    };

    const dockids = ['browser', 'calendar', 'calculator', 'explorer'];
    const dockapps = dockids.map(id => apps.find(a => a.id === id)).filter(Boolean) as typeof apps;

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

    const hideAppFromHomeScreen = (itemId: string) => {
        const newHidden = [...hiddenAppIds, itemId];
        setHiddenAppIds(newHidden);
        localStorage.setItem('mobile-hidden-apps', JSON.stringify(newHidden));
    };

    const handleRename = (itemId: string) => {
        const item = files.find(f => f.id === itemId);
        if (item) {
            setRenameTarget(itemId);
            setRenameValue(item.name);
        }
    };

    const submitRename = () => {
        if (renameTarget && renameValue.trim()) {
            renameItem(renameTarget, renameValue.trim());
        }
        setRenameTarget(null);
        setRenameValue('');
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
                const appid = extractAppId(item.id);
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

            if (!item.isReadOnly && !item.isSystem) {
                items.push({
                    label: 'Rename',
                    action: () => handleRename(item.id)
                });
            }

            items.push({
                label: 'Copy',
                action: () => copyItem(item.id)
            });

            if (!item.isReadOnly && !item.isSystem) {
                items.push({
                    label: 'Cut',
                    action: () => cutItem(item.id)
                });
            }

            items.push({ separator: true, label: '' });

            items.push({
                label: 'Edit Home Screen',
                action: () => seteditmode(true)
            });

            items.push({
                label: 'Show in Explorer',
                action: () => openSystemItem('explorer', { addwindow, windows, setactivewindow, updatewindow, ismobile, files }, undefined, { openPath: item.parent || currentUserDesktopId, selectItem: item.id })
            });

            if (!item.isReadOnly && !item.isSystem) {
                items.push({ separator: true, label: '' });
                items.push({
                    label: 'Move to Trash',
                    danger: true,
                    action: () => {
                        if (contextmenu.item?.mimetype === 'application/x-executable' || contextmenu.item?.id.startsWith('desktop-app-')) {
                            moveToTrash(contextmenu.item?.id || '');
                        } else if (contextmenu.item?.id) {
                            setConfirmDelete(contextmenu.item.id);
                        }
                    },
                });
            }

            return items;
        } else {
            const items: any[] = [
                {
                    label: 'New Folder',
                    action: () => createFolder('New Folder', currentUserDesktopId)
                },
                {
                    label: 'New File',
                    action: () => createFile('Untitled.txt', currentUserDesktopId)
                },
            ];

            if (clipboard) {
                items.push({
                    label: 'Paste',
                    action: () => pasteItem(currentUserDesktopId)
                });
            }

            items.push({ separator: true, label: '' });
            items.push({
                label: 'Edit Home Screen',
                action: () => seteditmode(true)
            });
            items.push({
                label: 'Change Wallpaper',
                action: () => {
                    addwindow({
                        id: `settings-${Date.now()}`,
                        appname: 'Settings',
                        component: 'apps/Settings',
                        props: { initialPage: 'appearance' },
                        isminimized: false,
                        ismaximized: false,
                    });
                }
            });

            return items;
        }
    };

    const [draggeditem, setdraggeditem] = useState<string | null>(null);

    // ── Clay-specific icon size & gap ──
    const iconSize = clay ? 66 : 60;
    const gridGapClass = clay ? 'gap-x-5 gap-y-6' : 'gap-x-4 gap-y-5';

    const renderGridPage = (pageItems: filesystemitem[], pageIndex: number) => (
        <div className={`flex-1 ${clay ? 'px-6' : 'px-5'}`}>
            <div
                data-tour={pageIndex === 0 ? "ios-apps" : undefined}
                className={`grid grid-cols-4 ${gridGapClass}`}
                style={{ gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))` }}
            >
                {pageItems.map((item, index) => {
                    const globalIndex = pageIndex * ITEMS_PER_PAGE + index;
                    const isRenaming = renameTarget === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            className="app-icon flex flex-col items-center gap-2 touch-pan-x"
                            animate={editmode ? {
                                rotate: [-2, 2, -2]
                            } : {
                                rotate: 0
                            }}
                            transition={{
                                rotate: editmode ? {
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                    duration: 0.25,
                                    ease: "easeInOut"
                                } : { duration: 0 },
                            } as any}
                            draggable={editmode}
                            onDragStart={() => setdraggeditem(item.id)}
                            onDragEnd={() => setdraggeditem(null)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (draggeditem && draggeditem !== item.id) {
                                    handlereorder(draggeditem, globalIndex);
                                }
                            }}
                            onClick={() => !editmode && !isRenaming && handleItemClick(item)}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                if (!editmode && !isRenaming) handlelongpressstart(item, e);
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
                            whileTap={editmode ? {} : { scale: clay ? 0.92 : 0.9 }}
                        >
                            <div className="relative">
                                {/* Edit-mode remove badge */}
                                {editmode && (
                                    <button
                                        className={`absolute -top-1.5 -left-1.5 w-[22px] h-[22px] flex items-center justify-center z-10 transition-transform active:scale-90 ${
                                            clay
                                                ? 'rounded-full bg-[--bg-glass] border border-[--glass-border] shadow-sm'
                                                : 'bg-overlay border border-[--border-color]'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.mimetype === 'application/x-executable' || item.id.startsWith('desktop-app-')) {
                                                hideAppFromHomeScreen(item.id);
                                            } else {
                                                setConfirmDelete(item.id);
                                            }
                                        }}
                                    >
                                        <svg className="w-3 h-3 text-[--text-color]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                {/* App icon container */}
                                <div
                                    className={`overflow-hidden shadow-sm relative`}
                                    style={{ width: iconSize, height: iconSize, ...(clay ? squircleClip : {}) }}
                                >
                                    {item.mimetype === 'application/x-executable' ? (() => {
                                        const appId = extractAppId(item.id);
                                        const appData = apps.find(a => a.id === appId);
                                        return appData ? (
                                            <TintedAppIcon
                                                appId={appData.id}
                                                appName={appData.appname}
                                                originalIcon={appData.icon}
                                                size={iconSize}
                                                useFill={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                {getFileIcon(item.mimetype, item.name, item.icon, item.id, item.content || item.link)}
                                            </div>
                                        );
                                    })() : (
                                        <div className="w-full h-full flex flex-col">
                                            {getFileIcon(item.mimetype, item.name, item.icon, item.id, item.content || item.link)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Label / rename input */}
                            {isRenaming ? (
                                <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={submitRename}
                                    onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') { setRenameTarget(null); setRenameValue(''); } }}
                                    className={`text-[11px] font-medium text-center leading-tight w-full tracking-tight px-1 outline-none ${
                                        clay
                                            ? 'font-sans rounded-[8px] text-[--text-color]'
                                            : 'font-mono bg-[--bg-overlay] text-[--text-color] border border-pastel-red/50'
                                    }`}
                                    style={clay ? glassInput : undefined}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className={`text-[11px] font-medium text-center leading-tight truncate w-full tracking-tight px-1 ${
                                        clay
                                            ? 'font-sans text-[--text-color]'
                                            : `font-mono ${inverselabelcolor && islightbackground ? 'text-black' : 'text-white'}`
                                    }`}
                                    style={clay
                                        ? undefined
                                        : { textShadow: (inverselabelcolor && islightbackground) ? 'none' : '0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)' }
                                    }
                                >
                                    {item.name}
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    // Document-level capture listeners — fires before ANY element's touch handling,
    // including before browser gesture recognition for touchAction
    useEffect(() => {
        let startY = 0, startX = 0, triggered = false;

        const onStart = (e: TouchEvent) => {
            if (showAppLibraryRef.current) return;
            const el = homeContainerRef.current;
            if (!el || !el.contains(e.target as Node)) return;
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            triggered = false;
        };

        const onMove = (e: TouchEvent) => {
            if (triggered || !startY || showAppLibraryRef.current) return;
            const dy = e.touches[0].clientY - startY;
            const dx = Math.abs(e.touches[0].clientX - startX);
            if (Math.abs(dy) > 25 && Math.abs(dy) > dx) {
                triggered = true;
                if (dy < 0) setShowAppLibrary(true);
                else window.dispatchEvent(new CustomEvent('open-notifications'));
            }
        };

        const onEnd = () => { triggered = false; startY = 0; };

        document.addEventListener('touchstart', onStart, { capture: true, passive: true });
        document.addEventListener('touchmove', onMove, { capture: true, passive: true });
        document.addEventListener('touchend', onEnd, { capture: true, passive: true });
        document.addEventListener('touchcancel', onEnd, { capture: true, passive: true });

        return () => {
            document.removeEventListener('touchstart', onStart, { capture: true });
            document.removeEventListener('touchmove', onMove, { capture: true });
            document.removeEventListener('touchend', onEnd, { capture: true });
            document.removeEventListener('touchcancel', onEnd, { capture: true });
        };
    }, []);

    return (
        <div
            ref={homeContainerRef}
            className="relative w-full h-full overflow-hidden"
            onClick={() => editmode && seteditmode(false)}
            onTouchStart={(e) => {
                if (!(e.target as HTMLElement).closest('.app-icon')) {
                    handlelongpressstart(null, e);
                }
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

            {/* ── Delete confirmation sheet ── */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 z-50 flex items-end justify-center ${
                            clay ? 'bg-black/30' : 'bg-[--bg-base]/70'
                        }`}
                        style={clay ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : undefined}
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
                            <div className="flex flex-col gap-2.5">
                                {/* Action card */}
                                <div
                                    className={`overflow-hidden ${
                                        clay ? 'rounded-[18px]' : 'bg-surface border border-[--border-color]'
                                    }`}
                                    style={clay ? {
                                        ...glassPanel,
                                        borderRadius: '18px',
                                    } : undefined}
                                >
                                    <div className={`p-5 text-center ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color]'}`}>
                                        <h3 className={`text-[14px] font-semibold ${clay ? 'font-sans text-[--text-color]' : 'text-[--text-muted]'}`}>
                                            Delete Item?
                                        </h3>
                                        <p className={`text-[13px] mt-1.5 ${clay ? 'font-sans text-[--text-muted]' : 'text-[--text-muted]'}`}>
                                            Are you sure you want to remove this item from the home screen?
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirmDelete) moveToTrash(confirmDelete);
                                            setConfirmDelete(null);
                                        }}
                                        className={`w-full py-4 text-[18px] text-pastel-red font-normal transition-colors ${
                                            clay
                                                ? 'font-sans active:bg-[--bg-glass-active] active:scale-[0.98]'
                                                : 'active:bg-overlay'
                                        }`}
                                    >
                                        Delete
                                    </button>
                                </div>
                                {/* Cancel button */}
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className={`w-full py-4 text-[18px] font-semibold active:scale-[0.98] transition-all ${
                                        clay
                                            ? 'rounded-[18px] font-sans text-accent'
                                            : 'bg-overlay border border-[--border-color] text-accent'
                                    }`}
                                    style={clay ? {
                                        ...glassPanel,
                                        borderRadius: '18px',
                                    } : undefined}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Horizontal page scroller ── */}
            <div
                ref={scrollcontainerref}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
                onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.offsetWidth;
                    const newPage = Math.round(scrollLeft / width);
                    if (newPage !== page) {
                        setpage(newPage);
                    }
                }}
            >
                {gridPages.map((pageItems, pageIndex) => (
                    <div key={`page-${pageIndex}`} className={`w-[100vw] h-full flex flex-col relative snap-start flex-shrink-0 [scroll-snap-stop:always] ${clay ? 'pt-8' : 'pt-6'}`}>
                        {renderGridPage(pageItems, pageIndex)}

                        {/* Edit-mode "Done" button */}
                        {editmode && pageIndex === 0 && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`absolute bottom-[165px] left-0 right-0 mx-auto w-max z-30 px-8 py-2.5 font-semibold text-[14px] active:scale-[0.97] transition-transform ${
                                    clay
                                        ? 'rounded-full font-sans text-[--text-color]'
                                        : 'bg-pastel-red/20 text-pastel-red border border-pastel-red/30'
                                }`}
                                style={clay ? {
                                    ...glassPanel,
                                    borderRadius: '9999px',
                                } : undefined}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    seteditmode(false);
                                }}
                            >
                                Done
                            </motion.button>
                        )}
                    </div>
                ))}

                {/* App Library removed from scroll — accessed via swipe-up */}
            </div>

            {/* ── Dock ── */}
            <div
                data-tour="ios-dock"
                className={`absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-7 pointer-events-auto transition-all duration-300 ${
                    showAppLibrary ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
            >
                <div
                    className={`flex items-center justify-between transition-all duration-300 ${
                        clay
                            ? 'rounded-[22px] p-3.5 gap-5'
                            : `p-3 gap-4 ${isoverlayopen ? '' : 'backdrop-blur-lg filter border border-[--border-color]/50'}`
                    }`}
                    style={
                        isoverlayopen
                            ? { backgroundColor: 'transparent' }
                            : clay
                                ? {
                                    background: 'color-mix(in srgb, var(--bg-glass) 60%, transparent)',
                                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: 'var(--glass-shadow)',
                                    borderRadius: '22px',
                                  }
                                : { backgroundColor: 'color-mix(in srgb, var(--bg-surface) 50%, transparent)' }
                    }
                >
                    {dockapps.map(app => (
                        <motion.button
                            key={app.id}
                            onClick={() => {
                                openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
                            }}
                            whileTap={{ scale: clay ? 0.88 : 0.85 }}
                            transition={{ duration: 0.15 }}
                            className={`aspect-square overflow-hidden relative ${clay ? 'w-[68px] h-[68px]' : 'w-[65px] h-[65px]'}`}
                            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                        >
                            <TintedAppIcon
                                appId={app.id}
                                appName={app.appname}
                                originalIcon={app.icon}
                                size={clay ? 68 : 65}
                                useFill={false}
                            />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* ── Page indicator dots ── */}
            <div
                className={`absolute left-0 right-0 flex justify-center items-center z-20 pointer-events-none transition-opacity duration-300 ${
                    clay ? 'bottom-[168px]' : 'bottom-[164px]'
                } ${isoverlayopen || showAppLibrary ? 'opacity-0' : 'opacity-100'}`}
            >
                <div className={`flex items-center gap-1.5 px-3 py-1.5 ${clay ? 'rounded-full' : 'rounded-sm'}`}
                    style={{
                        background: clay ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    {gridPages.map((_, i) => (
                        <div
                            key={`dot-${i}`}
                            className={`transition-all duration-300 rounded-full ${
                                page === i
                                    ? `w-[7px] h-[7px] ${clay ? 'bg-white' : 'bg-white'}`
                                    : `w-[6px] h-[6px] ${clay ? 'bg-white/35' : 'bg-white/30'}`
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* ── App Library swipe-up indicator (below dots, above dock) ── */}
            <motion.div
                className={`absolute left-0 right-0 flex justify-center items-center z-20 transition-opacity duration-500 ${
                    clay ? 'bottom-[128px]' : 'bottom-[124px]'
                } ${isoverlayopen || showAppLibrary ? 'opacity-0 pointer-events-none' : 'opacity-40 pointer-events-auto'}`}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y < -30 || info.velocity.y < -200) {
                        setShowAppLibrary(true);
                    }
                }}
                onClick={() => setShowAppLibrary(true)}
                whileTap={{ scale: 1.3, opacity: 0.8 }}
                style={{ cursor: 'grab', touchAction: 'none' }}
            >
                <div className="px-8 py-5">
                    <svg width="16" height="8" viewBox="0 0 16 8" fill="none" className="text-white">
                        <path d="M1 7L8 1.5L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </motion.div>

            {/* ── App Library overlay ── */}
            <AnimatePresence>
                {showAppLibrary && (
                    <motion.div
                        key="app-library-overlay"
                        className="absolute inset-0 z-30 flex flex-col"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween', duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        style={{
                            background: clay ? 'var(--bg-base)' : 'var(--bg-surface)',
                        }}
                    >
                        {/* Drag handle — only this is draggable to dismiss */}
                        <motion.div
                            className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.3}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80 || info.velocity.y > 300) {
                                    setShowAppLibrary(false);
                                }
                            }}
                            style={{ touchAction: 'none' }}
                        >
                            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
                        </motion.div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <AppLibrary />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
