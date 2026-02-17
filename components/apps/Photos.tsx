'use client';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWindows } from '../WindowContext';
import { useAuth } from '../AuthContext';
import { useDevice } from '../DeviceContext';
import { useFileSystem } from '../FileSystemContext';
import { IoImagesOutline, IoChevronBack, IoGridOutline, IoAddOutline, IoRemoveOutline, IoRefreshOutline, IoDownloadOutline, IoColorFilterOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface photosprops {
    singleview?: boolean;
    src?: string;
    title?: string;
    windowId?: string;
}

const photomimetypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];

export default function Photos({ singleview, src, title, windowId }: photosprops) {
    const { files } = useFileSystem();
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const { activewindow } = useWindows();
    const containerref = useRef<HTMLDivElement>(null);
    const [isnarrow, setisnarrow] = useState(false);
    const [viewingimage, setviewingimage] = useState<{ src: string, title: string, id: string } | null>(
        singleview && src ? { src, title: title || 'Image', id: 'single' } : null
    );
    const [mobileview, setmobileview] = useState<'grid' | 'photo'>(singleview && src ? 'photo' : 'grid');
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [showFilters, setShowFilters] = useState(false);

    const photos = useMemo(() => {
        if (!user) return [];
        const icloudFolder = files.find(f => f.name === 'iCloud Drive' && f.owner === user.username);
        const icloudId = icloudFolder ? icloudFolder.id : (user.username === 'guest' ? 'guest-icloud' : `user-${user.username}-icloud`);

        return files.filter(f =>
            (photomimetypes.some(mt => f.mimetype.startsWith('image/') || f.mimetype === mt)) &&
            (f.parent === icloudId)
        )
            .map(f => ({
                id: f.id,
                src: f.link || f.content || `/appimages/${f.name.toLowerCase()}`,
                title: f.name,
                date: f.date,
                owner: f.owner
            }));
    }, [files, user]);

    useEffect(() => {
        if (singleview && src && viewingimage) {
            const targetFile = files.find(f =>
                f.link === src ||
                f.content === src ||
                `/appimages/${f.name.toLowerCase()}` === src
            );

            if (targetFile) {
                const isAdmin = user?.role === 'admin' || user?.username === 'admin';
                const isSystem = !targetFile.owner || targetFile.owner === 'system';
                const isOwner = targetFile.owner === user?.username;

                let allowed = false;

                if (isAdmin) {
                    allowed = true;
                } else if (user?.username === 'guest') {
                    if (targetFile.owner === 'guest') allowed = true;
                } else {
                    if (isOwner) allowed = true;
                }

                if (!allowed && !isSystem && targetFile.owner) {
                    setviewingimage(null);
                    setmobileview('grid');
                }
            }
        }
    }, [singleview, src, user, files, viewingimage]);

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setisnarrow(entry.contentRect.width < 768);
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!windowId) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (mobileview === 'photo') {
                e.preventDefault();
                setmobileview('grid');
                setviewingimage(null);
            }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, activewindow, mobileview]);

    const handlePhotoClick = (photo: typeof photos[0]) => {
        setviewingimage(photo);
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        if (ismobile) setmobileview('photo');
    };

    const resetFilters = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    const handleDownload = () => {
        if (!viewingimage) return;
        const a = document.createElement('a');
        a.href = viewingimage.src;
        a.download = viewingimage.title;
        a.click();
    };

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-[--bg-base] font-mono overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {mobileview === 'grid' && (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-14 flex items-center justify-between px-4 border-b border-[--border-color]">
                                <span className="text-[26px] text-[--text-color] font-bold">Photos</span>
                                <div className="flex gap-4 text-accent">
                                    <IoGridOutline size={22} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {photos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                        <IoImagesOutline size={48} className="mb-4 opacity-50" />
                                        <span className="text-[13px]">No photos in file system</span>
                                        <span className="text-xs mt-1">Add image files to see them here</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1">
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="aspect-square relative cursor-pointer"
                                                onClick={() => handlePhotoClick(photo)}
                                            >
                                                <Image
                                                    src={photo.src}
                                                    alt={photo.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="33vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {mobileview === 'photo' && viewingimage && (
                        <motion.div
                            key="photo"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black flex flex-col"
                        >
                            <div className="h-14 flex items-center justify-between px-4 bg-surface">
                                <button
                                    onClick={() => { setviewingimage(null); setmobileview('grid'); resetFilters(); setShowFilters(false); }}
                                    className="text-[--text-color] flex items-center gap-1"
                                >
                                    <IoChevronBack size={24} />
                                    <span>Photos</span>
                                </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-4">
                                <Image
                                    src={viewingimage.src}
                                    alt={viewingimage.title}
                                    width={800}
                                    height={600}
                                    className="max-w-full max-h-full object-contain"
                                    style={{ filter: filterStyle }}
                                />
                            </div>
                            <div className="flex flex-col bg-surface border-t border-[--border-color]">
                                <div className="h-12 flex items-center justify-between px-4">
                                    <span className="text-[--text-color] text-[13px]">{viewingimage.title}</span>
                                    <button
                                        onClick={() => setShowFilters(f => !f)}
                                        className={`p-1.5 transition-colors ${showFilters ? 'bg-accent text-[--bg-base]' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                                        title="Filters"
                                    >
                                        <IoColorFilterOutline size={18} />
                                    </button>
                                </div>
                                {showFilters && (
                                    <div className="px-4 pb-3 flex flex-col gap-2 border-t border-[--border-color]">
                                        <div className="flex items-center gap-3 pt-2">
                                            <span className="text-[11px] text-[--text-muted] w-16 shrink-0">Brightness</span>
                                            <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                            <span className="text-[11px] text-[--text-muted] w-8 text-right">{brightness}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] text-[--text-muted] w-16 shrink-0">Contrast</span>
                                            <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                            <span className="text-[11px] text-[--text-muted] w-8 text-right">{contrast}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] text-[--text-muted] w-16 shrink-0">Saturation</span>
                                            <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                            <span className="text-[11px] text-[--text-muted] w-8 text-right">{saturation}%</span>
                                        </div>
                                        <button
                                            onClick={resetFilters}
                                            className="self-end mt-1 px-3 py-1 text-[11px] bg-overlay border border-[--border-color] text-[--text-muted] hover:text-[--text-color] transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={containerref} className="flex h-full w-full bg-[--bg-base] font-mono text-[--text-color] overflow-hidden">
            <div className={`${viewingimage ? 'hidden' : ''} w-[200px] flex flex-col pt-4 border-r border-[--border-color] bg-surface shrink-0 anime-gradient-top`}>
                <div className="px-4 mb-2 text-[11px] font-semibold text-[--text-muted] uppercase tracking-wide">Library</div>
                <div className="px-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent">
                        <IoImagesOutline size={16} />
                        <span className="text-[13px] font-medium">All Photos</span>
                        <span className="ml-auto text-[11px] opacity-70">{photos.length}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AnimatePresence mode="wait">
                    {viewingimage ? (
                        <motion.div
                            key="viewer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col bg-surface"
                        >
                            <div className="h-12 px-4 pl-20 flex items-center justify-between border-b border-[--border-color]">
                                <button
                                    onClick={() => { setviewingimage(null); setZoom(1); setRotation(0); resetFilters(); setShowFilters(false); }}
                                    className="text-accent flex items-center gap-1 text-[13px] font-medium"
                                >
                                    <IoChevronBack size={18} />
                                    All Photos
                                </button>
                                <span className="text-[--text-muted] text-[13px]">{viewingimage.title}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 hover:bg-overlay text-[--text-muted] hover:text-[--text-color] transition-colors" title="Zoom Out"><IoRemoveOutline size={16} /></button>
                                    <span className="text-xs text-[--text-muted] w-10 text-center">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 hover:bg-overlay text-[--text-muted] hover:text-[--text-color] transition-colors" title="Zoom In"><IoAddOutline size={16} /></button>
                                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-overlay text-[--text-muted] hover:text-[--text-color] transition-colors" title="Rotate"><IoRefreshOutline size={16} /></button>
                                    <button onClick={handleDownload} className="p-1.5 hover:bg-overlay text-[--text-muted] hover:text-[--text-color] transition-colors" title="Download"><IoDownloadOutline size={16} /></button>
                                    <div className="w-px h-4 bg-[--border-color] mx-1" />
                                    <button
                                        onClick={() => setShowFilters(f => !f)}
                                        className={`p-1.5 transition-colors ${showFilters ? 'bg-accent text-[--bg-base]' : 'hover:bg-overlay text-[--text-muted] hover:text-[--text-color]'}`}
                                        title="Filters"
                                    >
                                        <IoColorFilterOutline size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 flex overflow-auto items-center justify-center p-8 bg-surface">
                                <Image
                                    src={viewingimage.src}
                                    alt={viewingimage.title}
                                    width={1000}
                                    height={700}
                                    className="max-h-auto max-w-auto object-contain transition-transform"
                                    style={{
                                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                        filter: filterStyle,
                                    }}
                                />
                            </div>
                            {showFilters && (
                                <div className="px-4 py-3 flex items-center gap-6 border-t border-[--border-color] bg-surface">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-[11px] text-[--text-muted] w-16 shrink-0">Brightness</span>
                                        <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                        <span className="text-[11px] text-[--text-muted] w-8 text-right">{brightness}%</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-[11px] text-[--text-muted] w-14 shrink-0">Contrast</span>
                                        <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                        <span className="text-[11px] text-[--text-muted] w-8 text-right">{contrast}%</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-[11px] text-[--text-muted] w-16 shrink-0">Saturation</span>
                                        <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="flex-1 accent-[--accent-color]" />
                                        <span className="text-[11px] text-[--text-muted] w-8 text-right">{saturation}%</span>
                                    </div>
                                    <button
                                        onClick={resetFilters}
                                        className="px-3 py-1 text-[11px] bg-overlay border border-[--border-color] text-[--text-muted] hover:text-[--text-color] transition-colors shrink-0"
                                    >
                                        Reset
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-[50px] flex items-center justify-between px-4 border-b border-[--border-color] bg-surface">
                                <span className="font-semibold">All Photos</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {photos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                                        <IoImagesOutline size={64} className="mb-4 opacity-50" />
                                        <span className="text-lg">No Photos</span>
                                        <span className="text-[13px] mt-1">Add image files to your file system to see them here</span>
                                    </div>
                                ) : (
                                    <div className={`grid ${isnarrow ? 'grid-cols-3' : 'grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'} gap-2`}>
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="aspect-square relative overflow-hidden cursor-pointer group"
                                                onClick={() => handlePhotoClick(photo)}
                                            >
                                                <Image
                                                    src={photo.src}
                                                    alt={photo.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform"
                                                    sizes="(max-width: 768px) 33vw, 20vw"
                                                />
                                                <div className="absolute inset-0 bg-transparent group-hover:bg-overlay transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
