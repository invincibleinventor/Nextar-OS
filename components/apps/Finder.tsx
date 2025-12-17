'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    IoCloseOutline, IoFolderOutline, IoDocumentTextOutline, IoAppsOutline,
    IoGridOutline, IoListOutline, IoChevronBack, IoChevronForward,
    IoSearch, IoGlobeOutline, IoInformationCircleOutline, IoChevronDown, IoChevronUp
} from "react-icons/io5";
import Image from 'next/image';
import { useWindows } from '../WindowContext';
import { apps, filesystem, sidebaritems, filesystemitem } from '../data';
import { useDevice } from '../DeviceContext';

const getfileicon = (mimetype: string, name: string, itemicon?: React.ReactNode) => {
    if (itemicon) return itemicon;
    if (mimetype === 'inode/directory') return <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />;
    if (mimetype === 'application/x-executable') return null;
    if (mimetype === 'image/png' || mimetype === 'image/jpeg') return <Image src="/photos.png" alt="image" width={64} height={64} className="w-full h-full object-contain" />;
    if (mimetype === 'application/pdf') return <Image src="/pdf.png" alt="pdf" width={64} height={64} className="w-full h-full object-contain" />;
    return <IoDocumentTextOutline className="w-full h-full text-gray-500" />;
};

export default function Finder({ initialpath }: { initialpath?: string[] }) {
    const [selected, setselected] = useState('Projects');
    const [selectedfile, setselectedfile] = useState<string | null>(null);
    const [showsidebar, setshowsidebar] = useState(true);
    const [showpreview, setshowpreview] = useState(true);
    const { addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();

    const [currentpath, setcurrentpath] = useState<string[]>(initialpath || ['Projects']);
    const [searchquery, setsearchquery] = useState("");

    const [isnarrow, setisnarrow] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const isnownarrow = width < 768;
                setisnarrow(isnownarrow);
               
                if (!isnownarrow) {
                    setshowsidebar(true);
                }
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, [isnarrow]);

    const handlesidebarclick = (itemname: string, path: string[]) => {
        setselected(itemname);
        setcurrentpath(path);
        if (isnarrow) setshowsidebar(false);
        setselectedfile(null);
    };

    const getcurrentfiles = (): filesystemitem[] => {
        let currentparentid = 'root';

        for (const foldername of currentpath) {
            const folder = filesystem.find(i => i.name.trim() === foldername.trim() && i.parent === currentparentid);
            if (folder) {
                currentparentid = folder.id;
            }
        }

        let files = filesystem.filter(i => i.parent === currentparentid);

        if (searchquery) {
            files = files.filter(f => f.name.toLowerCase().includes(searchquery.toLowerCase()));
        }

        return files;
    };

    const files = getcurrentfiles();
    const activefile = files.find(f => f.name === selectedfile);

    const handlefileopen = (file: filesystemitem) => {
        if (file.mimetype === 'inode/directory') {
            setcurrentpath([...currentpath, file.name]);
            setsearchquery("");
            setselectedfile(null);
        } else if (file.mimetype === 'application/x-executable') {
            const app = apps.find(a => a.appname === file.appname);
            if (app) {
                const existingwin = windows.find((w: any) => w.appname === app.appname);
                if (existingwin) {
                    updatewindow(existingwin.id, { isminimized: false });
                    setactivewindow(existingwin.id);
                } else {
                    addwindow({
                        id: `${app.appname}-${Date.now()}`,
                        appname: app.appname,
                        additionaldata: {},
                        title: app.appname,
                        component: app.componentname,
                        props: {},
                        isminimized: false,
                        ismaximized: false,
                        position: { top: 100, left: 100 },
                        size: { width: 1024, height: 500 },
                    });
                }
            }
        } else if (file.mimetype === 'text/markdown') {
            const fileviewerapp = apps.find(a => a.id === 'fileviewer');
            if (fileviewerapp) {
                addwindow({
                    id: `fileviewer-${Date.now()}`,
                    appname: fileviewerapp.appname,
                    title: file.name,
                    component: fileviewerapp.componentname,
                    icon: fileviewerapp.icon,
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 100, left: 100 },
                    size: { width: 600, height: 400 },
                    props: { content: file.content, title: file.name, type: 'text/markdown' }
                });
            }
        } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
            const photosapp = apps.find(a => a.id === 'photos');
            if (photosapp) {
                addwindow({
                    id: `photos-${Date.now()}`,
                    appname: photosapp.appname,
                    title: photosapp.appname,
                    component: photosapp.componentname,
                    icon: photosapp.icon,
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 50, left: 50 },
                    size: { width: 1024, height: 768 },
                    props: { singleview: true, src: file.content, title: file.name }
                });
            }
        } else if (file.mimetype === 'application/pdf') {
            const fileviewerapp = apps.find(a => a.id === 'fileviewer');
            if (fileviewerapp) {
                addwindow({
                    id: `fileviewer-${Date.now()}`,
                    appname: fileviewerapp.appname,
                    title: file.name,
                    component: fileviewerapp.componentname,
                    icon: fileviewerapp.icon,
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 100, left: 100 },
                    size: { width: 700, height: 800 },
                    props: { content: file.content, title: file.name, type: 'application/pdf' }
                });
            }
        } else if (file.mimetype === 'text/x-uri' && file.link) {
            const safariapp = apps.find(a => a.id === 'safari');

            if ((file.name === 'Source Code' || file.name === 'Github' || file.name === 'LinkedIn' || file.name === 'Threads') && file.link) {
                window.open(file.link, '_blank');
            } else if (safariapp) {
                addwindow({
                    id: `safari-${Date.now()}`,
                    appname: safariapp.appname,
                    title: safariapp.appname,
                    component: safariapp.componentname,
                    icon: safariapp.icon,
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 50, left: 50 },
                    size: { width: 1024, height: 768 },
                    props: { initialurl: file.link }
                });
            }
        }
    };

    return (
        <div
            ref={containerref}
            className="flex h-full w-full bg-transparent text-black dark:text-white font-sf text-[13px] overflow-hidden rounded-b-xl relative select-none"
            onClick={() => {
                if (isnarrow && showsidebar) setshowsidebar(false);
            }}
        >

            <div className={`
                ${showsidebar
                    ? isnarrow ? 'absolute inset-y-0 left-0 z-30 w-[220px] shadow-2xl bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur border-r border-black/5 dark:border-white/5'
                        : 'relative w-[200px] border-r border-black/5 dark:border-white/5 bg-transparent backdrop-blur-xl'
                    : '-translate-x-full w-0 border-none'
                } 
                transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] 
                flex flex-col pt-4 h-full transform
            `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`flex-1 overflow-y-auto ${ismobile ? '' : 'pt-[36px]'} px-2 ${showsidebar ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                    {sidebaritems.map((group, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500/80 dark:text-gray-400/80 uppercase tracking-wide mb-1 px-3">
                                {group.title}
                            </div>
                            <div className="space-y-[1px]">
                                {group.items.map((item) => (
                                    <div
                                        key={item.name}
                                        onClick={() => handlesidebarclick(item.name, item.path)}
                                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                                            ${selected === item.name
                                                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
                                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <item.icon className={`text-[16px] ${selected === item.name ? 'text-[#007AFF]' : 'text-[#007AFF]/80'}`} />
                                        <span className="truncate leading-none pb-[2px] block">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex ${isnarrow ? 'flex-col' : 'flex-row'} min-w-0 dark:bg-neutral-900 bg-white relative overflow-hidden`}>

                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    <div className={`${!ismobile && !showsidebar?'ps-20':''} h-[50px] shrink-0 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/5`}>
                        <div className="flex items-center gap-2 text-gray-500">
                            {isnarrow && (
                                <button onClick={() => setshowsidebar(!showsidebar)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors mr-2">
                                    <IoListOutline className="text-xl text-black dark:text-white" />
                                </button>
                            )}
                            <div className={(isnarrow && !ismobile) ? "flex items-center gap-1" : "flex items-center gap-1"}>
                                <IoChevronBack className={`text-xl ${currentpath.length > 1 ? 'text-black dark:text-white cursor-pointer rounded' : 'opacity-20'}`} onClick={() => currentpath.length > 1 && setcurrentpath(currentpath.slice(0, -1))} />
                                <IoChevronForward className="text-xl opacity-20" />
                            </div>
                            <span className="text-[14px] font-semibold text-black dark:text-white ml-2">
                                {currentpath[currentpath.length - 1]}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-40 sm:w-48">
                                <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    className="w-full bg-black/5 dark:bg-white/10 rounded-md pl-7 pr-2 py-1 text-xs outline-none focus:ring-1 ring-blue-500/50 transition-all placeholder-gray-500 text-black dark:text-white"
                                    placeholder="Search"
                                    value={searchquery}
                                    onChange={(e) => setsearchquery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setshowpreview(!showpreview)}
                                className={`p-1 rounded-md transition-colors ${showpreview ? 'bg-black/10 dark:bg-white/10 text-[#007AFF]' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                                title="Toggle Preview"
                            >
                                <IoInformationCircleOutline className="text-lg" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4" onClick={() => setselectedfile(null)}>
                        <div className="grid grid-cols-2 min-[450px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                            {files.map((file, i) => (
                                <div
                                    key={i}
                                    onDoubleClick={() => handlefileopen(file)}
                                    onClick={(e) => { e.stopPropagation(); setselectedfile(file.name); }}
                                    className={`group flex flex-col items-center gap-2 p-2 rounded-lg transition-colors cursor-default
                                        ${selectedfile === file.name
                                            ? 'bg-black/10 dark:bg-white/10'
                                            : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex items-center justify-center">
                                        {getfileicon(file.mimetype, file.name, file.icon)}
                                    </div>
                                    <span className={`text-[12px] text-center leading-tight px-2 py-0.5 rounded break-words w-full line-clamp-2
                                        ${selectedfile === file.name ? 'bg-[#007AFF] text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {file.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {files.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <span className="text-4xl mb-2 opacity-50">¯\_(ツ)_/¯</span>
                                <span>No items found</span>
                            </div>
                        )}
                    </div>

                    <div className="h-[24px] bg-[#f8f8f8] dark:bg-[#282828] border-t border-black/5 dark:border-white/5 flex items-center px-4 justify-center shrink-0">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            {files.length} item{files.length !== 1 && 's'}
                        </span>
                    </div>
                </div>

                {showpreview && (
                    <div className={`
                        ${isnarrow
                            ? 'h-[30%] w-full border-t border-black/10 dark:border-white/10'
                            : 'w-[250px] border-l border-black/5 dark:border-white/5'
                        }
                        bg-white/50 dark:bg-[#2d2d2d]/50 backdrop-blur-md flex flex-col transition-all duration-300 overflow-y-auto shrink-0
                    `}>
                        {activefile ? (
                            <div className="flex flex-col items-center p-6 text-center animate-in fade-in duration-300">
                                <div className="w-24 object-cover h-24 mb-4 drop-shadow-xl relative">
                                    {getfileicon(activefile.mimetype, activefile.name, activefile.icon)}
                                </div>
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-1 break-words w-full">{activefile.name}</h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">{activefile.mimetype}</p>

                                <div className="w-full space-y-3 text-left">
                                    <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-[11px]">
                                        <span className="text-gray-500 text-right">Modified</span>
                                        <span className="text-black dark:text-white">{activefile.date}</span>

                                        <span className="text-gray-500 text-right">Size</span>
                                        <span className="text-black dark:text-white">{activefile.size}</span>
                                    </div>

                                    {activefile.description && (
                                        <div className="pt-2">
                                            <div className="text-xs font-semibold text-gray-500 mb-1">Information</div>
                                            <p className="text-[12px] text-black/80 dark:text-white/80 leading-relaxed">
                                                {activefile.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-center">
                                        <button
                                            onClick={() => handlefileopen(activefile)}
                                            className="bg-[#007AFF] hover:bg-[#007afe] text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all"
                                        >
                                            Open
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
                                <IoInformationCircleOutline className="text-4xl mb-2 opacity-20" />
                                <span className="text-xs">Select an item to view details</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
