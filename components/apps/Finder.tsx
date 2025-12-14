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

export default function Finder() {
    const [selected, setselected] = useState('Projects');
    const [selectedfile, setselectedfile] = useState<string | null>(null);
    const { addwindow } = useWindows();

    const getfiles = (): fileitem[] => {
        if (selected === 'Projects') {
            return portfolioData.projects.map(p => ({
                name: p.title,
                date: 'Today',
                size: '--',
                kind: 'Web Link',
                icon: p.icon,
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
        return [];
    };

    const files = getfiles();

    const handlefileopen = (file: any) => {
        if (file.kind === 'Web Link') {

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
        <div className="flex h-full w-full bg-white dark:bg-[#232323] text-black dark:text-white font-sf text-[13px]">
            <div className="w-[170px] bg-[#f6f6f6]/90 dark:bg-[#2d2d2d]/90 hidden md:flex flex-col border-r border-black/5 dark:border-white/5">
                <div className="flex-1 overflow-y-auto py-2 px-2">
                    {sidebaritems.map((group, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 px-2">
                                {group.title}
                            </div>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <div
                                        key={item.name}
                                        onClick={() => setselected(item.name)}
                                        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-default transition-colors
                                            ${selected === item.name
                                                ? 'bg-[#007AFF] text-white'
                                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <item.icon className={`text-[14px] ${selected === item.name ? 'text-white' : 'text-[#007AFF]'}`} />
                                        <span className="truncate text-[13px]">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col w-full">
                <div className="h-[38px] flex items-center justify-between px-3 bg-white/80 dark:bg-[#2d2d2d]/80 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <button className="w-6 h-6 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <FaChevronLeft size={10} />
                            </button>
                            <button className="w-6 h-6 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <FaChevronRight size={10} />
                            </button>
                        </div>
                        <span className="font-medium text-[13px]">{selected}</span>
                    </div>
                    <div className="flex gap-1 text-gray-400">
                        <button className="w-6 h-6 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[16px]">
                            ⋯
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-[#f6f6f6] dark:bg-[#2d2d2d] border-b border-black/5 dark:border-white/5">
                            <tr className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                <th className="text-left py-1.5 px-3 w-full md:w-1/2">Name</th>
                                <th className="text-left py-1.5 px-3 hidden md:table-cell">Date Modified</th>
                                <th className="text-left py-1.5 px-3 hidden md:table-cell">Size</th>
                                <th className="text-left py-1.5 px-3 hidden md:table-cell">Kind</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file, i) => (
                                <tr
                                    key={i}
                                    onClick={() => setselectedfile(file.name)}
                                    onDoubleClick={() => handlefileopen(file)}
                                    className={`cursor-default text-[12px] border-b border-transparent select-none
                                        ${selectedfile === file.name
                                            ? 'bg-[#007AFF] text-white'
                                            : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                                        }
                                        ${i % 2 === 1 && selectedfile !== file.name ? 'bg-black/[0.015] dark:bg-white/[0.015]' : ''}`}
                                >
                                    <td className="py-1 px-3 flex items-center gap-2">
                                        {file.kind === 'Web Link' ? (
                                            <span className="text-[16px]">{file.icon || <FaGlobe className="text-blue-500" />}</span>
                                        ) : (
                                            <FaFileAlt className={`text-[14px] ${selectedfile === file.name ? 'text-white' : 'text-gray-400'}`} />
                                        )}
                                        <span className="truncate">{file.name}</span>
                                    </td>
                                    <td className={`py-1 px-3 hidden md:table-cell ${selectedfile === file.name ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {file.date}
                                    </td>
                                    <td className={`py-1 px-3 hidden md:table-cell ${selectedfile === file.name ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {file.size}
                                    </td>
                                    <td className={`py-1 px-3 hidden md:table-cell ${selectedfile === file.name ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {file.kind}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="h-[22px] bg-[#f6f6f6] dark:bg-[#2d2d2d] border-t border-black/5 dark:border-white/5 flex items-center px-3">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {files.length} items
                    </span>
                </div>
            </div>
        </div>
    );
}
