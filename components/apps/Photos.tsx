'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { personal, apps } from '../data';
import { useWindows } from '../WindowContext';
import { IoImagesOutline, IoHeartOutline, IoAlbumsOutline, IoTrashOutline, IoMenu, IoArrowBack, IoInformationCircleOutline, IoShareOutline, IoChevronBack, IoGlobeOutline, IoFolderOpenOutline } from "react-icons/io5";

interface photosprops {
    singleview?: boolean;
    src?: string;
    title?: string;
}

export default function Photos({ singleview, src, title }: photosprops) {
    const [selecteditem, setselecteditem] = useState("all");
    const [isnarrow, setisnarrow] = useState(false);
    const [showsidebar, setshowsidebar] = useState(true);
    const [viewingimage, setviewingimage] = useState<{ src: string, title?: string, desc?: string, link?: string } | null>(
        singleview && src ? { src, title } : null
    );

    const containerref = React.useRef<HTMLDivElement>(null);
    const { ismobile, addwindow } = useWindows();

    const openInFinder = (path: string) => {
        const finderapp = apps.find(a => a.id === 'finder');
        if (finderapp) {
            addwindow({
                id: `finder-photo-${Date.now()}`,
                appname: 'Finder',
                title: 'Finder',
                component: finderapp.componentname,
                icon: finderapp.icon,
                isminimized: false,
                ismaximized: false,
                position: { top: 150, left: 150 },
                size: { width: 900, height: 600 },
                props: { initialpath: ['Projects', path] }
            });
        }
    };

    const allcategories = Array.from(new Set(personal.projects.map(p => p.stack[0].trim() || 'Uncategorized')));

    const sidebaritems = [
        { id: 'all', label: 'Library', icon: IoImagesOutline },
        { id: 'fav', label: 'Favorites', icon: IoHeartOutline },
        ...allcategories.map((cat, idx) => ({ id: cat.toLowerCase(), label: cat, icon: IoAlbumsOutline })),
        { id: 'deleted', label: 'Recently Deleted', icon: IoTrashOutline },
    ];

    const projectphotos = personal.projects
        .filter(proj => {
            if (selecteditem === 'all') return true;
            if (selecteditem === 'fav') return false;
            if (selecteditem === 'deleted') return false;
            return (proj.stack[0].trim() || 'Uncategorized').toLowerCase() === selecteditem.toLowerCase();
        })
        .map((proj, i) => ({
            id: i,
            src: `/appimages/${proj.title.toLowerCase()}.png`,
            title: proj.title,
            desc: proj.desc,
            link: proj.link,
            defaultsize: { width: 1000, height: 600 }
        }));

    useEffect(() => {
        if (viewingimage && (!viewingimage.desc || !viewingimage.link) && viewingimage.title) {
            const project = personal.projects.find(p => p.title === viewingimage.title);
            if (project) {
                setviewingimage(prev => ({ ...prev!, desc: project.desc, link: project.link }));
            }
        }
    }, [viewingimage?.title]);

    const [showInspector, setShowInspector] = useState(false);

    if (viewingimage) {
        return (
            <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white relative items-center justify-center overflow-hidden animate-in fade-in duration-300">
                <div
                    className="flex-1 w-full h-full relative flex items-center justify-center p-0 md:p-4"
                    onClick={() => setShowInspector(false)}
                >
                    <Image
                        src={viewingimage.src}
                        alt={viewingimage.title || 'Photo'}
                        fill
                        className="object-contain"
                        draggable={false}
                    />
                </div>

                <div className={`absolute top-0 left-0 right-0 h-12 md:h-14 bg-[#2d2d2d]/50 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4 ${!ismobile ? 'pt-0' : ''}`}>
                    <div className="flex items-center flex-1">
                        <button
                            onClick={() => setviewingimage(null)}
                            className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                        >
                            <IoChevronBack size={20} className="text-[#007AFF]" />
                            <span className="text-[#007AFF] text-[15px] font-medium">Library</span>
                        </button>
                    </div>

                    <div className="hidden md:flex flex-col items-center flex-1 opacity-90">
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                        <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <IoHeartOutline size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowInspector(prev => !prev); }}
                            className={`p-2 rounded-full transition-colors ${showInspector ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                        >
                            <IoInformationCircleOutline size={20} />
                        </button>
                        {!ismobile && (
                            <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                                <IoShareOutline size={20} />
                            </button>
                        )}
                        <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <IoTrashOutline size={20} />
                        </button>
                    </div>
                </div>

                {showInspector && (
                    <div
                        className={`absolute top-16 right-4 w-[320px] bg-[#2d2d2d]/90 backdrop-blur-xl shadow-2xl border border-white/10 rounded-xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-right-4 fade-in duration-200 ${ismobile ? 'left-4 right-4 top-14 w-auto' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-semibold text-sm">Info</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">{viewingimage.title}</h2>
                                <p className="text-white/50 text-xs">Recently Added</p>
                            </div>

                            <div className="py-3 border-y border-white/10">
                                <p className="text-sm text-white/80 leading-relaxed font-light">
                                    {viewingimage.desc || "No description available for this project."}
                                </p>
                            </div>

                            <div className="space-y-2 pt-1">
                                {viewingimage.link && (
                                    <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3 text-sm text-white/80">
                                            <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center">
                                                <IoGlobeOutline size={16} />
                                            </div>
                                            <span>Project Link</span>
                                        </div>
                                        <a href={viewingimage.link} target="_blank" rel="noreferrer" className="text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors">
                                            Open
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                                            <IoFolderOpenOutline size={16} />
                                        </div>
                                        <span>Location</span>
                                    </div>
                                    <button
                                        onClick={() => viewingimage.title && openInFinder(viewingimage.title)}
                                        className="text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Finder
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] text-white/40">
                                <div>
                                    <span className="block font-semibold mb-0.5">Dimensions</span>
                                    1920 × 1080
                                </div>
                                <div>
                                    <span className="block font-semibold mb-0.5">Size</span>
                                    2.4 MB
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={containerref} className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white relative overflow-hidden">
            <div className={`
                ${showsidebar
                    ? isnarrow ? 'absolute inset-y-0 left-0 z-30 w-[220px] shadow-2xl bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur border-r border-black/5 dark:border-white/5'
                        : 'relative w-[200px] border-r border-black/5 dark:border-white/5 bg-transparent backdrop-blur-2xl'
                    : '-translate-x-full w-0 border-none overflow-hidden absolute'
                }
                transition-all duration-300 flex flex-col pt-4 ${ismobile ? '' : 'pt-[50px]'} h-full bg-white/95 dark:bg-[#1e1e1e]/95
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

            <div className={`flex-1 overflow-y-auto p-4 z-10 w-full min-w-0 ${!ismobile ? 'pt-8' : ''}`}>
                <div className="flex justify-between items-center mb-6 px-2 sticky top-0 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md z-10 py-2 border-b border-transparent">
                    <div className="flex items-center gap-3">
                        {!showsidebar && (
                            <button onClick={() => setshowsidebar(true)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5" title="Show Sidebar">
                                <IoMenu className="text-xl" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold leading-none">{sidebaritems.find(i => i.id === selecteditem)?.label}</h1>
                            <span className="text-xs text-gray-500">{projectphotos.length} Items</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="text-[12px] font-medium bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full">Select</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                    {projectphotos.map((photo, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                setviewingimage({ src: photo.src, title: photo.title, desc: photo.desc, link: photo.link });
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
