'use client';

import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { apps, openSystemItem } from './data';
import { useDevice } from './DeviceContext';
import { useSettings } from './SettingsContext';
import TintedAppIcon from './ui/TintedAppIcon';
import { IoSearch, IoClose, IoFolderOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { useFileSystem } from './FileSystemContext';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel } from './hooks/useClayStyles';



const RecentApps = React.memo(({ isopen, onclose }: { isopen: boolean, onclose: () => void }) => {
    const { windows, removewindow, setactivewindow, updatewindow, addwindow } = useWindows();
    const containerref = useRef<HTMLDivElement>(null);
    const ignoreclickref = useRef(false);
    const { wallpaperurl, islightbackground } = useSettings();
    const { ismobile } = useDevice();
    const { files } = useFileSystem();
    const clay = useIsClay();
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
                    className="fixed inset-0 z-[490] flex flex-col pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
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
                        className={`absolute inset-0 bg-center bg-cover bg-no-repeat`}
                        onClick={onclose}
                        style={{ backgroundImage: `url('${wallpaperurl}')` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    <motion.div
                        className="fixed left-0 top-0 w-full z-[492] pointer-events-none overflow-hidden"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative pt-[52px] px-6 flex flex-col items-center pointer-events-auto" style={{ maxWidth: '100vw', boxSizing: 'border-box' }}>
                            <div className={`w-full max-w-lg overflow-hidden ${clay ? (searchquery.trim() ? 'rounded-[16px]' : 'rounded-full') : 'bg-surface border border-[--border-color] shadow-pastel'}`}
                                style={clay ? {
                                    background: 'color-mix(in srgb, var(--bg-glass) 65%, transparent)',
                                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                                } : undefined}
                            >
                                <div className={`flex items-center gap-3 px-4 py-3 ${clay ? (searchquery.trim() ? 'border-b border-[--glass-border]' : '') : 'border-b border-[--border-color]'}`}>
                                    <IoSearch className="text-[--text-color] opacity-50 text-xl shrink-0" />
                                    <input
                                        ref={searchinputref}
                                        type="text"
                                        value={searchquery}
                                        onChange={(e) => setsearchquery(e.target.value)}
                                        placeholder="Next Search"
                                        autoFocus
                                        className="flex-1 min-w-0 bg-transparent text-[--text-color] text-base font-medium outline-none placeholder:text-[--text-muted]"
                                        style={{ color: 'var(--text-color)', WebkitTextFillColor: 'var(--text-color)', caretColor: 'var(--text-color)', fontSize: '16px' }}
                                    />
                                    {searchquery && (
                                        <button onClick={() => setsearchquery('')} className="p-1">
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
                                                        <span className="text-[--text-color] font-medium text-[13px]">{app.appname}</span>
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
                                                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                            {file.mimetype === 'inode/directory' ? <IoFolderOutline className="w-6 h-6 text-pastel-blue" /> : <IoDocumentTextOutline className="w-6 h-6 text-pastel-peach" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[--text-color] font-medium text-[13px] truncate">{file.name}</div>
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
                                                    <div className="text-[13px]">No results found</div>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {windows.length === 0 && !searchquery && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className={`text-lg font-medium tracking-wide ${islightbackground ? 'text-black/50' : 'text-white/60'}`}
                                style={{ textShadow: islightbackground ? 'none' : '0 1px 4px rgba(0,0,0,0.5)' }}>No Recent Apps</div>
                        </div>
                    )}

                    <motion.div
                        ref={containerref}
                        data-recent-scroll
                        className={`${searchquery == '' ? '' : 'hidden'} relative w-full h-full flex items-center overflow-x-auto scrollbar-hide px-[10vw] py-8 z-[491]`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: (searchquery == '' ? 0.15 : 0) }}
                        onClick={(e) => { if (!ignoreclickref.current && e.target === e.currentTarget) onclose(); }}
                        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
                    >
                        <div className="flex flex-row gap-6 md:gap-10 h-[65vh] items-end pb-[6vh]">
                            <AnimatePresence>
                                {[...windows].sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0)).map((win: any) => {
                                    const appdata = apps.find(a => a.appname === win.appname);

                                    return (
                                        <AppCard
                                            key={win.id}
                                            win={win}
                                            appdata={appdata}
                                            islightbackground={islightbackground}
                                            clay={clay}
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

                    {/* Close All button — mobile */}
                    {ismobile && windows.length > 1 && !searchquery && (
                        <motion.div
                            className="absolute bottom-8 left-0 right-0 flex justify-center z-[492] pointer-events-auto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.25 }}
                        >
                            <button
                                onClick={() => {
                                    windows.forEach((w: any) => removewindow(w.id));
                                }}
                                className={`px-5 py-2 rounded-full text-[13px] font-semibold active:scale-95 transition-transform ${islightbackground ? 'text-black/60' : 'text-white/70'}`}
                                style={{
                                    background: islightbackground ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    borderRadius: '9999px',
                                }}
                            >
                                Close All
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
});


const AppCard = ({ win, appdata, onkill, onopen, islightbackground, clay }: any) => {
    const isdragging = useRef(false);

    return (
        <motion.div
            className="relative flex-shrink-0 w-[75vw] md:w-[45vw] lg:w-[350px] h-full flex flex-col"
            initial={{ opacity: 0, y: 300, scale: 1.15 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, y: -400, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            layout={false}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            dragDirectionLock={true}
            dragMomentum={false}
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
        >
            <div className="flex items-center gap-2 mb-3 px-1 pointer-events-none">
                {appdata && (
                    <TintedAppIcon
                        appId={appdata.id}
                        appName={appdata.appname}
                        originalIcon={appdata.icon}
                        size={32}
                        useFill={false}
                    />
                )}
                <span className={`font-semibold text-[13px] tracking-wide ${islightbackground ? 'text-black' : 'text-white'}`}
                    style={{ textShadow: islightbackground ? 'none' : '0 1px 3px rgba(0,0,0,0.6)' }}>{win.title}</span>
            </div>

            <div className={`flex-1 w-full overflow-hidden relative group ${clay ? 'rounded-[16px] border border-[--glass-border]' : 'border-2 border-[--border-color] shadow-pastel anime-accent-top'}`}
                style={clay ? { boxShadow: 'var(--shadow-xs)' } : undefined}
            >
                <div className="absolute inset-0 z-[500] bg-transparent cursor-grab active:cursor-grabbing" />
                {appdata?.hidePreview ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[--bg-base]">
                        <div className="w-16 h-16">
                            <TintedAppIcon appId={appdata.id} appName={appdata.appname} originalIcon={appdata.icon} size={64} useFill={false} />
                        </div>
                        <span className="text-[13px] font-semibold text-[--text-muted]">{win.title}</span>
                    </div>
                ) : (
                    <div className="w-full h-full overflow-hidden">
                        <div id={`recent-app-slot-${win.id}`} className="origin-top-left" style={{ transform: 'scale(0.82)', width: '121.95%', height: '121.95%' }} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

RecentApps.displayName = 'RecentApps';
export default RecentApps;
