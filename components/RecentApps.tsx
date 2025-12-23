'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { apps, openSystemItem } from './data';
import { useDevice } from './DeviceContext';
import { useSettings } from './SettingsContext';
import TintedAppIcon from './ui/TintedAppIcon';
import { IoSearch, IoClose } from 'react-icons/io5';
import { useFileSystem } from './FileSystemContext';



const RecentApps = React.memo(({ isopen, onclose }: { isopen: boolean, onclose: () => void }) => {
    const { windows, removewindow, setactivewindow, updatewindow, addwindow } = useWindows();
    const containerref = useRef<HTMLDivElement>(null);
    const ignoreclickref = useRef(false);
    const { wallpaperurl } = useSettings();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const [searchquery, setsearchquery] = useState('');
    const searchinputref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isopen) {
            if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            if (typeof window !== 'undefined') window.scrollTo(0, 0);

            if (containerref.current) {
                setTimeout(() => {
                    if (containerref.current) {
                        containerref.current.scrollLeft = 0;
                    }
                }, 10);
            }
        }
    }, [isopen]);


    return (
        <AnimatePresence>
            {isopen && (
                <motion.div
                    className="fixed inset-0 z-[9990] flex flex-col pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.2 }}
                >
                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    <motion.div
                        className={`absolute backdrop-blur-sm inset-0  bg-center  bg-cover bg-no-repeat`}
                        onClick={onclose}
                        style={{ backgroundImage: `url('${wallpaperurl}')` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className="fixed inset-x-0 top-0 z-[9992] pointer-events-none"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative pt-16 px-6 flex flex-col items-center pointer-events-auto">
                            <div className="w-full max-w-lg bg-white/20 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                                    <IoSearch className="text-white/70 text-xl shrink-0" />
                                    <input
                                        ref={searchinputref}
                                        type="text"
                                        value={searchquery}
                                        onChange={(e) => setsearchquery(e.target.value)}
                                        placeholder="Next Search"
                                        autoFocus
                                        className="flex-1 bg-transparent text-white text-base font-medium outline-none placeholder-white/50"
                                    />
                                    {searchquery && (
                                        <button onClick={() => setsearchquery('')} className="p-1 hover:bg-white/10 rounded-full">
                                            <IoClose className="text-white/60 text-lg" />
                                        </button>
                                    )}
                                </div>

                                {searchquery.trim() && (
                                    <div className="max-h-[50vh] overflow-y-auto">
                                        {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).length > 0 && (
                                            <div className="p-2">
                                                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide px-2 py-1">Apps</div>
                                                {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).slice(0, 5).map(app => (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => {
                                                            openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
                                                            setsearchquery('');
                                                            onclose();
                                                        }}
                                                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 shrink-0">
                                                            <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} size={32} useFill={false} />
                                                        </div>
                                                        <span className="text-white font-medium text-sm">{app.appname}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).length > 0 && (
                                            <div className="p-2 border-t border-white/10">
                                                <div className="text-white/40 text-xs font-semibold uppercase tracking-wide px-2 py-1">Files</div>
                                                {files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).slice(0, 5).map(file => (
                                                    <div
                                                        key={file.id}
                                                        onClick={() => {
                                                            openSystemItem(file, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
                                                            setsearchquery('');
                                                            onclose();
                                                        }}
                                                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center text-2xl shrink-0">
                                                            {file.mimetype === 'inode/directory' ? '📁' : '📄'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-white font-medium text-sm truncate">{file.name}</div>
                                                            <div className="text-white/40 text-xs truncate">{file.mimetype}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).length === 0 &&
                                            files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).length === 0 && (
                                                <div className="p-6 text-center text-white/40">
                                                    <div className="text-2xl mb-2">🔍</div>
                                                    <div className="text-sm">No results found</div>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {windows.length === 0 && !searchquery && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className="text-white/40 text-lg font-medium tracking-wide">No Recent Apps</div>
                        </div>
                    )}

                    <motion.div
                        ref={containerref}
                        layoutScroll
                        className={`${searchquery == '' ? '' : 'hidden'} relative w-full h-full flex items-center overflow-x-auto scrollbar-hide px-[10vw] py-8 z-[9991]`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: (searchquery == '' ? 0.2 : 0), ease: "easeOut" }}
                        onClick={(e) => { if (!ignoreclickref.current && e.target === e.currentTarget) onclose(); }}
                        style={{ willChange: 'opacity' }}
                    >
                        <div className="flex flex-row gap-6 md:gap-10 h-[65vh] items-center">
                            <AnimatePresence mode='popLayout'>
                                {[...windows].sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0)).map((win: any) => {
                                    const appdata = apps.find(a => a.appname === win.appname);

                                    return (
                                        <AppCard
                                            key={win.id}
                                            win={win}
                                            appdata={appdata}
                                            onclose={onclose}
                                            onkill={() => {
                                                ignoreclickref.current = true;
                                                setTimeout(() => ignoreclickref.current = false, 500);
                                                removewindow(win.id);
                                            }}
                                            onopen={() => {
                                                updatewindow(win.id, { isminimized: false });
                                                setactivewindow(win.id);
                                                onclose();
                                            }}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});


const AppCard = ({ win, appdata, onkill, onopen }: any) => {
    const isdragging = useRef(false);

    return (
        <motion.div
            className="relative flex-shrink-0 w-[75vw] md:w-[45vw] lg:w-[350px] h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragDirectionLock={true}
            onDragStart={() => { isdragging.current = true; }}
            onDragEnd={(_, info) => {
                setTimeout(() => { isdragging.current = false; }, 100);

                const swipedistance = info.offset.y;
                const swipevelocity = info.velocity.y;


                if (swipedistance < -150 || swipevelocity < -600) {
                    onkill();
                } else if (swipedistance > 150 || swipevelocity > 600) {
                    onopen();
                }
            }}
            onClick={(e) => {
                if (isdragging.current) return;
                e.stopPropagation();
                onopen();
            }}
            style={{ touchAction: 'pan-x', willChange: 'transform' }}
            transition={{
                type: "spring",
                stiffness: 350,
                damping: 30
            }}
            layout
        >
            <div className="flex items-center gap-2 mb-3 px-1 pointer-events-none">
                {appdata && (
                    <div className="w-8 h-8">
                        <TintedAppIcon
                            appId={appdata.id}
                            appName={appdata.appname}
                            originalIcon={appdata.icon}
                            size={32}
                            useFill={false}
                        />
                    </div>
                )}
                <span className="text-white font-semibold text-sm tracking-wide drop-shadow-md">{win.title}</span>
            </div>

            <div className="flex-1 w-full bg-white dark:bg-[#1c1c1e] rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/10 rounded-[24px] z-20" />

                <div className="absolute inset-0 z-[99999] bg-transparent cursor-grab active:cursor-grabbing" />

                <div id={`recent-app-slot-${win.id}`} className="w-full h-full" />
            </div>
        </motion.div>
    );
};

RecentApps.displayName = 'RecentApps';
export default RecentApps;
