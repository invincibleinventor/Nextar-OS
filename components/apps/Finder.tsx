'use client';
import React, { useState } from 'react';
import { FaFolder, FaFileAlt, FaClock, FaDesktop, FaDownload, FaCloud, FaHdd, FaChevronLeft, FaChevronRight, FaGlobe } from "react-icons/fa";
import { IoApps, IoDocumentText } from "react-icons/io5";
import { portfolioData } from '../portfolioData';
import { useWindows } from '../WindowContext';
import { apps } from '../app';

const sidebaritems = [
    {
        title: 'Favorites', items: [
            { name: 'Projects', icon: FaFolder },
            { name: 'About Me', icon: IoDocumentText },
            { name: 'Recents', icon: FaClock },
            { name: 'Applications', icon: IoApps },
            { name: 'Desktop', icon: FaDesktop },
            { name: 'Downloads', icon: FaDownload },
        ]
    },
    {
        title: 'iCloud', items: [
            { name: 'iCloud Drive', icon: FaCloud },
        ]
    },
    {
        title: 'Locations', items: [
            { name: 'Macintosh HD', icon: FaHdd },
        ]
    }
];

interface fileitem {
    name: string;
    date: string;
    size: string;
    kind: string;
    isFolder?: boolean;
    icon?: any;
    link?: string;
    content?: string;
}

import { IoGrid, IoList } from "react-icons/io5";

export default function Finder() {
    const [selected, setselected] = useState('Projects');
    const [selectedfile, setselectedfile] = useState<string | null>(null);
    const [viewmode, setviewmode] = useState<'list' | 'grid'>('grid');
    const [showSidebar, setShowSidebar] = useState(true);
    const { addwindow } = useWindows();

    // Toggle sidebar visibility
    const toggleSidebar = () => setShowSidebar(!showSidebar);

    const getfiles = (): fileitem[] => {
        if (selected === 'Projects') {
            return portfolioData.projects.map(p => ({
                name: p.title,
                date: 'Today',
                size: '--',
                kind: 'Folder', // Treat projects as Folders in Finder
                // Using a high-quality macOS folder icon image
                icon: <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Mac_OS_X_Folder_Icon.png" alt="folder" className="w-full h-full object-contain drop-shadow-md" />,
                link: p.link
            }));
        }
        if (selected === 'About Me') {
            return [
                { name: 'Bio.txt', date: 'Today', size: '2 KB', kind: 'Text Document', content: portfolioData.personal.bio },
                { name: 'Skills.md', date: 'Today', size: '4 KB', kind: 'Markdown', content: portfolioData.skills.join(', ') },
                { name: 'Resume.pdf', date: 'Yesterday', size: '2.4 MB', kind: 'PDF', link: '#' }
            ];
        }
        if (selected === 'Applications') {
            return apps.filter(a => a.id !== 'finder').map(a => ({
                appName: a.appName,
                name: a.appName,
                date: 'Today',
                size: 'App',
                kind: 'Application',
                icon: <img src={a.icon} className="w-full h-full object-contain drop-shadow-md" alt={a.appName} />,
                link: '#'
            }));
        }
        return [];
    };

    const files = getfiles();

    const handlefileopen = (file: any) => {
        if (file.link) {
            const safariapp = apps.find(a => a.id === 'safari');
            if (safariapp) {
                addwindow({
                    id: `safari-${Date.now()}`,
                    appName: safariapp.appName,
                    title: safariapp.appName,
                    component: safariapp.componentName,
                    icon: safariapp.icon,
                    isMinimized: false,
                    isMaximized: false,
                    position: { top: 50, left: 50 },
                    size: { width: 1024, height: 768 },
                    props: { initialurl: file.link }
                });
            }
        }
    };

    return (
        <div className="flex h-full w-full bg-[#fcfcfc] dark:bg-[#1e1e1e] text-black dark:text-white font-sf text-[13px] overflow-hidden rounded-b-xl relative">

            {/* Sidebar (Responsive) */}
            <div className={`
                ${showSidebar ? 'translate-x-0 w-[200px] border-r' : '-translate-x-full w-0 border-none'} 
                transition-all duration-300 ease-in-out bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl 
                flex flex-col border-black/5 dark:border-white/5 pt-12 absolute md:relative z-20 h-full
            `}>
                <div className={`flex-1 overflow-y-auto px-2 ${showSidebar ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                    {sidebaritems.map((group, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="text-[11px] font-bold text-gray-500/80 dark:text-gray-400/80 uppercase tracking-wide mb-1 px-3">
                                {group.title}
                            </div>
                            <div className="space-y-[1px]">
                                {group.items.map((item) => (
                                    <div
                                        key={item.name}
                                        onClick={() => { setselected(item.name); if (window.innerWidth < 768) setShowSidebar(false); }}
                                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-100
                                            ${selected === item.name
                                                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium'
                                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <item.icon className={`text-[16px] ${selected === item.name ? 'text-[#007AFF]' : 'text-[#007AFF]/80'}`} />
                                        <span className="truncate leading-none pb-[1px]">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full bg-white dark:bg-[#1e1e1e] min-w-0">
                {/* Modern Toolbar */}
                <div className="h-[52px] flex items-center justify-between px-4 bg-[#f3f4f6]/80 dark:bg-[#282828]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shadow-sm z-10">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex gap-2 shrink-0">
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-black dark:hover:text-white transition-colors" onClick={() => { }}>
                                <FaChevronLeft size={12} />
                            </button>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-black dark:hover:text-white transition-colors" onClick={() => { }}>
                                <FaChevronRight size={12} />
                            </button>
                        </div>
                        <h1 className="font-semibold text-[15px] truncate">{selected}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="p-1.5 rounded transition-all hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                            <IoApps size={18} title="Toggle Sidebar" />
                        </button>
                        <div className="flex bg-gray-200/50 dark:bg-white/5 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                            <button
                                onClick={() => setviewmode('grid')}
                                className={`p-1.5 rounded-md transition-all shadow-sm ${viewmode === 'grid' ? 'bg-white dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <IoGrid size={14} />
                            </button>
                            <button
                                onClick={() => setviewmode('list')}
                                className={`p-1.5 rounded-md transition-all shadow-sm ${viewmode === 'list' ? 'bg-white dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <IoList size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* File View Area */}
                <div className="flex-1 overflow-auto p-2 md:p-4 @container" onClick={() => setselectedfile(null)}>
                    {viewmode === 'grid' ? (
                        <div className="grid grid-cols-2 @[360px]:grid-cols-3 @[520px]:grid-cols-4 @[700px]:grid-cols-5 @[900px]:grid-cols-6 gap-2 md:gap-4 content-start">
                            {files.map((file, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setselectedfile(file.name); }}
                                    onDoubleClick={() => handlefileopen(file)}
                                    className={`flex flex-col items-center gap-1 p-2 md:p-4 rounded-lg cursor-default transition-all group border border-transparent
                                        ${selectedfile === file.name ? 'bg-[#007AFF]/10 dark:bg-[#007AFF]/20 border-[#007AFF]/30' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[40px] drop-shadow-md transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
                                        {/* Render Icon logic */}
                                        {file.kind === 'Folder' ? (
                                            file.icon
                                        ) : file.kind === 'Application' ? (
                                            file.icon
                                        ) : file.kind === 'Web Link' && !file.icon ? (
                                            <FaGlobe className="text-[#007AFF]" />
                                        ) : (
                                            /* Fallback for others */
                                            file.icon || <FaFileAlt className="text-gray-400" />
                                        )}
                                    </div>
                                    <span className={`text-[12px] font-medium text-center leading-tight line-clamp-2 px-1.5 py-0.5 rounded ${selectedfile === file.name ? 'bg-[#007AFF] text-white' : 'text-black dark:text-white'}`}>
                                        {file.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white dark:bg-[#1e1e1e] z-10 shadow-sm">
                                <tr className="text-[11px] text-gray-500 dark:text-gray-400 font-medium border-b border-black/5 dark:border-white/5">
                                    <th className="text-left py-2 px-4 w-1/2">Name</th>
                                    <th className="text-left py-2 px-4 hidden sm:table-cell">Date Modified</th>
                                    <th className="text-left py-2 px-4 hidden md:table-cell">Kind</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file, i) => (
                                    <tr
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setselectedfile(file.name); }}
                                        onDoubleClick={() => handlefileopen(file)}
                                        className={`cursor-default text-[13px] border-b border-transparent select-none group
                                            ${selectedfile === file.name
                                                ? 'bg-[#007AFF] text-white'
                                                : 'text-black/90 dark:text-white/90 hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/20 odd:bg-gray-50/50 dark:odd:bg-white/[0.02]'
                                            }`}
                                    >
                                        <td className="py-1.5 px-4 flex items-center gap-3">
                                            <div className="w-5 h-5 flex justify-center items-center">
                                                {file.kind === 'Folder' || file.kind === 'Application' ? (
                                                    <div className="w-4 h-4">{file.icon}</div>
                                                ) : (
                                                    <FaFileAlt className={`text-[14px] ${selectedfile === file.name ? 'text-white' : 'text-gray-400'}`} />
                                                )}
                                            </div>
                                            <span className="truncate font-medium">{file.name}</span>
                                        </td>
                                        <td className={`py-1.5 px-4 hidden sm:table-cell ${selectedfile === file.name ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {file.date}
                                        </td>
                                        <td className={`py-1.5 px-4 hidden md:table-cell ${selectedfile === file.name ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {file.kind}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Status Bar - Mac Style */}
                <div className="h-[28px] bg-[#f8f8f8] dark:bg-[#282828] border-t border-black/5 dark:border-white/5 flex items-center px-4 justify-between select-none">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        {files.length} items • 145 GB available
                    </span>
                    <span className="w-4"></span>
                </div>
            </div>
        </div>
    );
}
