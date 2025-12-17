'use client';
import React, { useState } from 'react';
import { apps, filesystem, filesystemitem } from './data';
import { useTheme } from './ThemeContext';
import { useSettings } from './SettingsContext';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AppLibrary from './AppLibrary';
import { useWindows } from './WindowContext';

export default function MobileHomeScreen({ isoverlayopen = false }: { isoverlayopen?: boolean }) {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { reducemotion } = useSettings();
    const [page, setpage] = useState(0);

    // Fetch items from 'root-desktop' in filesystem
    const desktopItems = filesystem.filter(item => item.parent === 'root-desktop');

    const handleItemClick = (item: filesystemitem) => {
        if (item.mimetype === 'application/x-executable') {
            // App Launch Logic
            const app = apps.find(a => a.appname === item.appname);
            if (!app) return;

            windows.forEach((w: any) => {
                if (!w.isminimized) {
                    updatewindow(w.id, { isminimized: true });
                }
            });

            const existingwin = windows.find((win: any) => win.appname === app.appname);
            if (existingwin) {
                updatewindow(existingwin.id, { isminimized: false });
                setactivewindow(existingwin.id);
                return;
            }

            const newwin = {
                id: `${app.appname}-${Date.now()}`,
                appname: app.appname,
                additionaldata: {},
                title: app.appname,
                component: app.componentname,
                props: {},
                isminimized: false,
                ismaximized: true,
                position: { top: 0, left: 0 },
                size: { width: window.innerWidth, height: window.innerHeight },
            };
            addwindow(newwin);
            setactivewindow(newwin.id);

        } else if (item.mimetype === 'text/x-uri' && item.link) {
            // Web Link Logic (Safari)
            const safariapp = apps.find(a => a.id === 'safari');
            if (safariapp) {
                // Minimize others
                windows.forEach((w: any) => {
                    if (!w.isminimized) updatewindow(w.id, { isminimized: true });
                });

                addwindow({
                    id: `safari-${Date.now()}`,
                    appname: safariapp.appname,
                    title: safariapp.appname,
                    component: safariapp.componentname,
                    icon: safariapp.icon,
                    isminimized: false,
                    ismaximized: true, // Mobile view
                    position: { top: 0, left: 0 },
                    size: { width: window.innerWidth, height: window.innerHeight },
                    props: { initialurl: item.link }
                });
            }
        } else if (item.mimetype === 'inode/directory' && item.link) {
            // Folder Alias Logic (MacOS-Next Project) - Open Finder
            const finderapp = apps.find(a => a.id === 'finder');
            if (finderapp) {
                // Minimize others
                windows.forEach((w: any) => {
                    if (!w.isminimized) updatewindow(w.id, { isminimized: true });
                });

                // Get the target folder name from the ID or link
                // The link property in our data.tsx for folder alias was `project-${title}` which is an ID.
                // But Finder expects a path array of Names.
                // We need to find the name of the folder with that ID.
                const targetFolderId = item.link;
                const targetFolder = filesystem.find(i => i.id === targetFolderId);
                const targetPath = targetFolder ? ['Projects', targetFolder.name] : ['Projects'];

                addwindow({
                    id: `finder-${Date.now()}`,
                    appname: 'Finder',
                    title: 'Finder',
                    component: finderapp.componentname,
                    icon: finderapp.icon,
                    isminimized: false,
                    ismaximized: true,
                    position: { top: 0, left: 0 },
                    size: { width: window.innerWidth, height: window.innerHeight },
                    props: { initialpath: targetPath }
                });
            }
        } else if (item.mimetype === 'application/pdf') {
            // PDF Logic
            const fileviewerapp = apps.find(a => a.id === 'fileviewer');
            if (fileviewerapp) {
                // Minimize others
                windows.forEach((w: any) => {
                    if (!w.isminimized) updatewindow(w.id, { isminimized: true });
                });

                addwindow({
                    id: `fileviewer-${Date.now()}`,
                    appname: fileviewerapp.appname,
                    title: item.name,
                    component: fileviewerapp.componentname,
                    icon: fileviewerapp.icon,
                    isminimized: false,
                    ismaximized: true,
                    position: { top: 0, left: 0 },
                    size: { width: window.innerWidth, height: window.innerHeight },
                    props: { content: item.content, title: item.name, type: 'application/pdf' }
                });
            }
        }
    };

    // Calculate pagination for grid items (exclude dock items if we want, or just grid all)
    // The previous code had a separate grid and dock.
    // "combine all the icons... and render them in both places thru it"
    // Usually Mobile Home Screen has a Grid and a Dock.
    // Apps like Phone, Safari, Mail, Music usually in Dock.
    // Let's keep the Dock concept but populate Grid from the rest of desktopItems.

    // Check if these are in the Dock list
    const dockAppIds = ['finder', 'safari', 'mail', 'settings'];
    // desktop-app-finder, desktop-app-safari etc.
    // Our IDs in data.tsx are `desktop-app-${id}`.

    const isDockItem = (item: filesystemitem) => {
        if (item.mimetype !== 'application/x-executable') return false;
        // Extract original app ID
        const appId = item.id.replace('desktop-app-', '');
        return dockAppIds.includes(appId);
    };

    const gridItems = desktopItems.filter(item => !isDockItem(item));

    // We might want to construct the Dock items manually from apps array to ensure they exist even if not in desktop folder?
    // User said "combine all the icons... into the desktops folder... and render them in both places thru it".
    // This implies the Desktop Folder IS the source of truth.
    // So if Finder isn't in Desktop Folder, it won't show?
    // In my data.tsx update, I excluded Finder/Launchpad from `desktop-app`.
    // So Finder won't be in `gridItems`.
    // I should probably ensure Dock items are rendered separately or added to Desktop folder if they are meant to be there.
    // Mobile Dock usually strictly has specific apps.
    // Let's stick to the previous Dock implementation regarding *which* apps are there, 
    // BUT we need to obtain them? 
    // Actually, for the Dock, since they are always pinned, let's just use the `apps` array for the Dock 
    // to guarantee they appear, OR strictly use the filesystem if the user wanted TOTAL unification.
    // "render them in both places thru it" -> strongly suggests filesystem source.
    // But I explicitly excluded Finder from Desktop folder in data.tsx.
    // I'll stick to `apps` for Dock for now to ensure consistency with the "OS" feel, 
    // or arguably I should have added Finder to Desktop folder if I wanted it purely unified.
    // Let's use `dockapps` from `apps` as before for the Dock at the bottom, 
    // and `gridItems` from `desktopItems` for the main grid.

    const dockapps = apps.filter(a =>
        a.id === 'finder' || a.id === 'safari' || a.id === 'mail' || a.id === 'settings'
    ).slice(0, 4);


    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent">
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
                        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                            {gridItems.map(item => (
                                <motion.button
                                    key={item.id}
                                    className="flex flex-col items-center gap-1"
                                    onClick={() => handleItemClick(item)}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden dark:bg-black/10 bg-white/10 shadow-sm ring-1 ring-white/5 relative">
                                        {item.icon ? (
                                            <div className="w-full h-full">{item.icon}</div>
                                        ) : (
                                            <Image
                                                src="/appstore.png" // Fallback
                                                alt={item.name}
                                                fill
                                                sizes="60px"
                                                className="object-cover"
                                                draggable={false}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[11px] font-medium text-white/90 text-center leading-tight drop-shadow-md truncate w-full tracking-tight">
                                        {item.name}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className={`mx-auto mb-7 p-3 rounded-[25px] w-max flex items-center justify-between gap-4 transition-all duration-300 ${isoverlayopen ? 'bg-transparent' : 'dark:bg-black/10 bg-white/10 backdrop-blur-sm shadow-lg border border-white/10'}`}>
                        {dockapps.map(app => (
                            <motion.button
                                key={app.id}
                                onClick={() => {
                                    // Re-use logic or manual handle
                                    // Construct a fake 'item' or just call logic
                                    // Better to call logic with specific ID/Type
                                    windows.forEach((w: any) => { if (!w.isminimized) updatewindow(w.id, { isminimized: true }); });

                                    const existingwin = windows.find((win: any) => win.appname === app.appname);
                                    if (existingwin) {
                                        updatewindow(existingwin.id, { isminimized: false });
                                        setactivewindow(existingwin.id);
                                        return;
                                    }
                                    addwindow({
                                        id: `${app.appname}-${Date.now()}`,
                                        appname: app.appname,
                                        title: app.appname,
                                        component: app.componentname,
                                        props: {},
                                        isminimized: false,
                                        ismaximized: true,
                                        position: { top: 0, left: 0 },
                                        size: { width: window.innerWidth, height: window.innerHeight },
                                    });
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

            <div className={`absolute bottom-[140px] left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none transition-opacity duration-300 ${isoverlayopen ? 'opacity-0' : 'opacity-100'}`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 0 ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${page === 1 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
        </div>
    );
}
