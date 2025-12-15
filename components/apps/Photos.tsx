'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { portfoliodata } from '../portfolioData';
import { useWindows } from '../WindowContext';
import { IoImagesOutline, IoHeartOutline, IoTimeOutline, IoAlbumsOutline, IoTrashOutline, IoMenu } from "react-icons/io5";

export default function Photos() {
    const [selecteditem, setselecteditem] = useState("all");
    const [isnarrow, setisnarrow] = useState(false);
    const [showsidebar, setshowsidebar] = useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const isNowNarrow = width < 768;
                setisnarrow(isNowNarrow);
                if (isNowNarrow && !isnarrow) {
                    setshowsidebar(false);
                }
                if (!isNowNarrow) {
                    setshowsidebar(true);
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allCategories = Array.from(new Set(portfoliodata.projects.map(p => p.stack[0] || 'Uncategorized')));

    const sidebaritems = [
        { id: 'all', label: 'Library', icon: IoImagesOutline },
        { id: 'fav', label: 'Favorites', icon: IoHeartOutline },
        ...allCategories.map((cat, idx) => ({ id: cat.toLowerCase(), label: cat, icon: IoAlbumsOutline })),
        { id: 'deleted', label: 'Recently Deleted', icon: IoTrashOutline },
    ];

    const projectPhotos = portfoliodata.projects
        .filter(proj => {
            if (selecteditem === 'all') return true;
            if (selecteditem === 'fav') return false;
            if (selecteditem === 'deleted') return false;
            return (proj.stack[0] || 'Uncategorized').toLowerCase() === selecteditem;
        })
        .map((proj, i) => ({
            id: i,
            src: `/appimages/${proj.title.toLowerCase()}.png`,
            title: proj.title,
            desc: proj.desc
        }));



    const { addwindow } = useWindows();

    return (
        <div ref={containerRef} className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white relative overflow-hidden">
            <div className={`
                ${showsidebar
                    ? isnarrow ? 'absolute inset-y-0 left-0 z-30 w-[220px] shadow-2xl bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur border-r border-black/5 dark:border-white/5'
                        : 'relative w-[200px] border-r border-black/5 dark:border-white/5 bg-transparent backdrop-blur-2xl'
                    : 'w-0 border-none overflow-hidden'
                }
                transition-all duration-300 flex flex-col pt-4
            `}>
                <div className="px-4 mb-4 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Photos</span>
                    {isnarrow && (
                        <button onClick={() => setshowsidebar(false)} className="text-gray-500 hover:text-black dark:hover:text-white">
                            <IoMenu />
                        </button>
                    )}
                </div>
                {sidebaritems.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        onClick={() => {
                            setselecteditem(item.id);
                            if (isnarrow) setshowsidebar(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-1.5 mx-2 rounded-md cursor-pointer transition-colors
                            ${selecteditem === item.id
                                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <item.icon className="text-lg" />
                        <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 z-10 w-full min-w-0">
                <div className="flex justify-between items-center mb-6 px-2 sticky top-0 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md z-10 py-2 border-b border-transparent">
                    <div className="flex items-center gap-3">
                        {!showsidebar && (
                            <button onClick={() => setshowsidebar(true)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5" title="Show Sidebar">
                                <IoMenu className="text-xl" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold leading-none">{sidebaritems.find(i => i.id === selecteditem)?.label}</h1>
                            <span className="text-xs text-gray-500">{projectPhotos.length} Items</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="text-[12px] font-medium bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full">Select</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                    {projectPhotos.map((photo, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                addwindow({
                                    id: `finder-${photo.title}-${Date.now()}`,
                                    appname: 'Finder',
                                    title: `Project: ${photo.title}`,
                                    component: 'apps/Finder',
                                    icon: '/finder.png',
                                    isminimized: false,
                                    ismaximized: false,
                                    position: { top: 100, left: 100 },
                                    size: { width: 800, height: 600 },
                                    props: { initialpath: ['Projects', photo.title] }
                                });
                            }}
                            className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group cursor-pointer shadow-sm"
                        >
                            <Image
                                src={photo.src}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt={photo.title}
                            />

                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                                <span className="text-white text-sm font-semibold truncate">{photo.title}</span>
                                <span className="text-gray-200 text-[10px] truncate">{photo.desc}</span>
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <IoHeartOutline className="text-white hover:text-red-500 drop-shadow-md text-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
