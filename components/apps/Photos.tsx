'use client';
import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWindows } from '../WindowContext';
import { useAuth } from '../AuthContext';
import { useDevice } from '../DeviceContext';
import { useFileSystem } from '../FileSystemContext';
import { IoImagesOutline, IoChevronBack, IoGridOutline, IoListOutline, IoInformationCircleOutline, IoClose, IoTrashOutline } from 'react-icons/io5';
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
    const containerref = useRef<HTMLDivElement>(null);
    const [isnarrow, setisnarrow] = useState(false);
    const [viewingimage, setviewingimage] = useState<{ src: string, title: string, id: string } | null>(
        singleview && src ? { src, title: title || 'Image', id: 'single' } : null
    );
    const [mobileview, setmobileview] = useState<'grid' | 'photo'>(singleview && src ? 'photo' : 'grid');

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

                if (!allowed && !isSystem) {       if (targetFile.owner && targetFile.owner !== 'system' && !allowed) {
                        setviewingimage(null);
                        setmobileview('grid');
                    }
                }
            } else {
                    }
        }
    }, [singleview, src, user, files]);

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

    const handlePhotoClick = (photo: typeof photos[0]) => {
        setviewingimage(photo);
        if (ismobile) setmobileview('photo');
    };

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-white dark:bg-[#1c1c1e] font-sf overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {mobileview === 'grid' && (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-14 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10">
                                <span className="text-[26px] font-bold">Photos</span>
                                <div className="flex gap-4 text-accent">
                                    <IoGridOutline size={22} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {photos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <IoImagesOutline size={48} className="mb-4 opacity-50" />
                                        <span className="text-sm">No photos in file system</span>
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
                            <div className="h-14 flex items-center justify-between px-4 bg-black/80 backdrop-blur-xl">
                                <button
                                    onClick={() => { setviewingimage(null); setmobileview('grid'); }}
                                    className="text-white flex items-center gap-1"
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
                                />
                            </div>
                            <div className="h-16 flex items-center justify-center px-4 bg-black/80 backdrop-blur-xl">
                                <span className="text-white text-sm">{viewingimage.title}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={containerref} className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden">
            <div className={`${viewingimage ? 'hidden' : ''} w-[200px] flex flex-col pt-[50px] border-r border-black/5 dark:border-white/10 bg-[#f5f5f7]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl shrink-0`}>
                <div className="px-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Library</div>
                <div className="px-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent">
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
                            className="flex-1 flex flex-col bg-[#1e1e1e]"
                        >
                            <div className="h-12 px-4 flex items-center justify-between  border-b border-white/10 ">
                                <button
                                    onClick={() => setviewingimage(null)}
                                    className="text-accent flex items-center gap-1 text-sm font-medium"
                                >
                                    <IoChevronBack size={18} />
                                    All Photos
                                </button>
                                <span className="text-white/60 text-sm">{viewingimage.title}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-8 bg-black">
                                <Image
                                    src={viewingimage.src}
                                    alt={viewingimage.title}
                                    width={1000}
                                    height={700}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-[50px] flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20">
                                <span className="font-semibold">All Photos</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {photos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <IoImagesOutline size={64} className="mb-4 opacity-50" />
                                        <span className="text-lg">No Photos</span>
                                        <span className="text-sm mt-1">Add image files to your file system to see them here</span>
                                    </div>
                                ) : (
                                    <div className={`grid ${isnarrow ? 'grid-cols-3' : 'grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'} gap-2`}>
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group"
                                                onClick={() => handlePhotoClick(photo)}
                                            >
                                                <Image
                                                    src={photo.src}
                                                    alt={photo.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform"
                                                    sizes="(max-width: 768px) 33vw, 20vw"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
