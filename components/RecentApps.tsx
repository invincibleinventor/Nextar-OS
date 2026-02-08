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
    const { wallpaperurl, islightbackground } = useSettings();
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
                        className={`absolute inset-0  bg-center  bg-cover bg-no-repeat`}
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
                            <div className="w-full max-w-lg bg-surface border border-[--border-color] shadow-pastel overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-[--border-color]">
                                    <IoSearch className="text-[--text-muted] text-xl shrink-0" />
                                    <input
                                        ref={searchinputref}
                                        type="text"
                                        value={searchquery}
                                        onChange={(e) => setsearchquery(e.target.value)}
                                        placeholder="Next Search"
                                        autoFocus
                                        className="flex-1 bg-transparent text-[--text-color] text-base font-medium outline-none placeholder:text-[--text-muted]"
                                        style={{ color: 'var(--text-color)', WebkitTextFillColor: 'var(--text-color)', caretColor: 'var(--text-color)' }}
                                    />
                                    {searchquery && (
                                        <button onClick={() => setsearchquery('')} className="p-1 hover:bg-overlay ">
                                            <IoClose className="text-[--text-muted] text-lg" />
                                        </button>
                                    )}
                                </div>

                                {searchquery.trim() && (
                                    <div className="max-h-[50vh] overflow-y-auto">
                                        {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).length > 0 && (
                                            <div className="p-2">
                                                <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-wide px-2 py-1">Apps</div>
                                                {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).slice(0, 5).map(app => (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => {
                                                            openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
                                                            setsearchquery('');
                                                            onclose();
                                                        }}
                                                        className="flex items-center gap-3 px-2 py-2 hover:bg-overlay cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 shrink-0">
                                                            <TintedAppIcon appId={app.id} appName={app.appname} originalIcon={app.icon} size={32} useFill={false} />
                                                        </div>
                                                        <span className="text-[--text-color] font-medium text-sm">{app.appname}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).length > 0 && (
                                            <div className="p-2 border-t border-[--border-color]">
                                                <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-wide px-2 py-1">Files</div>
                                                {files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).slice(0, 5).map(file => (
                                                    <div
                                                        key={file.id}
                                                        onClick={() => {
                                                            openSystemItem(file, { addwindow, windows, setactivewindow, updatewindow, ismobile, files });
                                                            setsearchquery('');
                                                            onclose();
                                                        }}
                                                        className="flex items-center gap-3 px-2 py-2 hover:bg-overlay cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center text-2xl shrink-0">
                                                            {file.mimetype === 'inode/directory' ? '📁' : '📄'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[--text-color] font-medium text-sm truncate">{file.name}</div>
                                                            <div className="text-[--text-muted] text-xs truncate">{file.mimetype}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {apps.filter(app => app.appname.toLowerCase().includes(searchquery.toLowerCase())).length === 0 &&
                                            files.filter(f => !f.isTrash && f.name.toLowerCase().includes(searchquery.toLowerCase())).length === 0 && (
                                                <div className="p-6 text-center text-[--text-muted]">
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
                            <div className={`text-lg font-medium tracking-wide ${islightbackground ? 'text-black/60' : 'text-white/60'}`}
                                style={{ textShadow: islightbackground ? 'none' : '0 1px 4px rgba(0,0,0,0.5)' }}>No Recent Apps</div>
                        </div>
                    )}

                    <motion.div
                        ref={containerref}
                        className={`${searchquery == '' ? '' : 'hidden'} relative w-full h-full flex items-center overflow-x-auto scrollbar-hide px-[10vw] py-8 z-[9991]`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: (searchquery == '' ? 0.2 : 0), ease: "easeOut" }}
                        onClick={(e) => { if (!ignoreclickref.current && e.target === e.currentTarget) onclose(); }}
                        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
                    >
                        <div className="flex flex-row gap-6 md:gap-10 h-[65vh] items-center">
                            <AnimatePresence>
                                {[...windows].sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0)).map((win: any) => {
                                    const appdata = apps.find(a => a.appname === win.appname);

                                    return (
                                        <AppCard
                                            key={win.id}
                                            win={win}
                                            appdata={appdata}
                                            islightbackground={islightbackground}
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


const AppCard = ({ win, appdata, onkill, onopen, islightbackground }: any) => {
    const isdragging = useRef(false);

    return (
        <motion.div
            className="relative flex-shrink-0 w-[75vw] md:w-[45vw] lg:w-[350px] h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.95, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{
                opacity: 0,
                scale: 0.8,
                y: -200,
                transition: { duration: 0.25, ease: "easeOut" }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragDirectionLock={true}
            dragMomentum={true}
            onDragStart={() => { isdragging.current = true; }}
            onDragEnd={(_, info) => {
                setTimeout(() => { isdragging.current = false; }, 100);

                const swipedistance = info.offset.y;
                const swipevelocity = info.velocity.y;

                if (swipedistance < -100 || swipevelocity < -400) {
                    onkill();
                } else if (swipedistance > 100 || swipevelocity > 400) {
                    onopen();
                }
            }}
            onClick={(e) => {
                if (isdragging.current) return;
                e.stopPropagation();
                onopen();
            }}
            style={{
                touchAction: 'pan-x',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)'
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 35
            }}
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
                <span className={`font-semibold text-sm tracking-wide ${islightbackground ? 'text-black' : 'text-white'}`}
                    style={{ textShadow: islightbackground ? 'none' : '0 1px 3px rgba(0,0,0,0.6)' }}>{win.title}</span>
            </div>

            <div className="flex-1 w-full bg-surface border-2 border-[--border-color] shadow-pastel overflow-hidden relative group anime-accent-top">
                <div className="absolute inset-0 z-[99999] bg-transparent cursor-grab active:cursor-grabbing" />

                <div id={`recent-app-slot-${win.id}`} className="w-full h-full" />
            </div>
        </motion.div>
    );
};

RecentApps.displayName = 'RecentApps';
export default RecentApps;
