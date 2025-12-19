import React, { useState, useEffect } from 'react';
import { IoSearch, IoRocketOutline, IoGlobeOutline, IoOpenOutline, IoLogoGithub, IoCodeSlashOutline, IoServerOutline, IoPhonePortraitOutline, IoLayersOutline, IoChevronBack } from "react-icons/io5";
import Image from 'next/image';
import { personal, openSystemItem } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { useMenuAction } from './hooks/useMenuAction';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppStore({ appId = 'appstore', id }: { appId?: string, id?: string }) {
    const [selectedcategory, setselectedcategory] = useState('All');
    const [selectedproject, setselectedproject] = useState<any>(null);
    const { addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();

    const menuActions = useMemo(() => ({
        'reload': () => setselectedcategory('All'),
        'search': () => {
            const el = document.querySelector<HTMLInputElement>('input[placeholder="Search projects"]') || document.querySelector<HTMLInputElement>('input[placeholder="Search"]');
            el?.focus();
        }
    }), []);

    useMenuAction(appId, menuActions, id);

    const projects = personal.projects.map((proj, i) => ({
        id: i,
        year: proj.date,
        title: proj.title,
        desc: proj.desc,
        color: proj.type === 'Open Source' ? "#007AFF" : "#34C759",
        icon: proj.icon,
        tech: proj.stack,
        type: proj.type,
    }));

    projects.sort((a, b) => b.year - a.year);

    const allcategories = ['All', ...Array.from(new Set(projects.flatMap(p => p.tech.slice(0, 2))))];

    const filteredprojects = selectedcategory === 'All'
        ? projects
        : projects.filter(p => p.tech.includes(selectedcategory));

    const categoryicons: { [key: string]: React.ReactNode } = {
        'All': <IoLayersOutline size={20} />,
        'React': <IoCodeSlashOutline size={20} />,
        'Next.js': <IoGlobeOutline size={20} />,
        'TypeScript': <IoCodeSlashOutline size={20} />,
        'Supabase': <IoServerOutline size={20} />,
        'Firebase': <IoServerOutline size={20} />,
        'TailwindCSS': <IoPhonePortraitOutline size={20} />,
    };

    if (ismobile) {
        return (
            <div className="relative flex flex-col h-full w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] font-sf text-black dark:text-white overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    {!selectedproject ? (
                        <motion.div
                            key="list"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 z-30 flex flex-col"
                        >
                            <div className="px-4 pt-4 pb-2">
                                <h1 className="text-[34px] font-bold">Projects</h1>
                            </div>

                            <div className="px-4 py-2">
                                <div className="relative">
                                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        className="w-full bg-white dark:bg-[#2c2c2e] rounded-xl pl-10 pr-4 py-3 text-[17px] outline-none placeholder-gray-400"
                                        placeholder="Search projects"
                                    />
                                </div>
                            </div>

                            <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
                                <div className="flex gap-2">
                                    {allcategories.slice(0, 8).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setselectedcategory(cat)}
                                            className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${selectedcategory === cat
                                                ? 'bg-[#007AFF] text-white'
                                                : 'bg-white dark:bg-[#2c2c2e] text-black dark:text-white'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {filteredprojects.map((proj) => (
                                    <motion.div
                                        key={proj.id}
                                        layoutId={`project-${proj.id}`}
                                        className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
                                        onClick={() => setselectedproject(proj)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-3xl shrink-0">
                                                {proj.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-[17px] font-semibold truncate">{proj.title}</h3>
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${proj.color}20`, color: proj.color }}>{proj.year}</span>
                                                </div>
                                                <p className="text-[15px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-snug">{proj.desc}</p>
                                                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                                                    {proj.tech.slice(0, 3).map((t, ti) => (
                                                        <span key={ti} className="text-[11px] px-2 py-1 bg-black/5 dark:bg-white/10 rounded-lg text-gray-500">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="absolute inset-0 z-30 bg-white dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="h-14 flex items-center px-2 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl shrink-0">
                                <button
                                    onClick={() => setselectedproject(null)}
                                    className="flex items-center text-[#007AFF] px-2"
                                >
                                    <IoChevronBack size={26} />
                                    <span className="text-[17px]">Projects</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-5">
                                    <div className="flex flex-col items-center mb-8">
                                        <motion.div layoutId={`project-${selectedproject.id}-icon`} className="w-24 h-24 rounded-[22px] bg-white dark:bg-[#2c2c2e] shadow-sm border border-black/5 flex items-center justify-center text-5xl mb-4">
                                            {selectedproject.icon}
                                        </motion.div>
                                        <h1 className="text-[22px] font-bold text-center mb-2">{selectedproject.title}</h1>
                                        <p className="text-gray-500 text-center text-[15px] leading-relaxed max-w-xs">{selectedproject.desc}</p>

                                        <div className="flex gap-3 mt-6 w-full max-w-sm">
                                            <a href={selectedproject.link || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#007AFF] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-[15px]">
                                                <IoOpenOutline size={18} />
                                                View
                                            </a>
                                            <a href={selectedproject.github || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#F2F2F7] dark:bg-white/10 text-[#007AFF] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#e5e5ea] dark:hover:bg-white/20 transition-colors text-[15px]">
                                                <IoLogoGithub size={18} />
                                                Code
                                            </a>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/5 mb-8" />

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-[17px] font-bold mb-3">About</h3>
                                            <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {selectedproject.desc} This project showcases advanced implementation of {selectedproject.tech.join(', ')}.
                                                It was built in {selectedproject.year} and demonstrates core competencies in full-stack development.
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-[17px] font-bold mb-3">Technologies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedproject.tech.map((t: string) => (
                                                    <span key={t} className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-200">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#2c2c2e] rounded-xl p-4 shadow-sm border border-black/5 dark:border-transparent">
                                            <h3 className="font-semibold mb-3 text-center text-gray-400 uppercase tracking-wide text-[11px]">Preview</h3>
                                            <div className="aspect-video bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden relative">
                                                <Image
                                                    src={`/appimages/${selectedproject.title.toLowerCase()}.png`}
                                                    alt={selectedproject.title}
                                                    width={800}
                                                    height={450}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden">
            <div className="w-[220px] shrink-0 flex-col pt-[50px] pb-4 px-2 border-r border-black/5 dark:border-white/5 bg-[#fbfbfd]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl hidden md:flex">
                <div className="px-4 mb-6">
                    <div className="relative">
                        <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none placeholder-gray-500"
                            placeholder="Search"
                        />
                    </div>
                </div>

                <div className="space-y-0.5 flex-1 overflow-y-auto px-2">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase px-3 mb-2">Categories</div>
                    {allcategories.slice(0, 12).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setselectedcategory(cat)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                                ${selectedcategory === cat
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            {categoryicons[cat] || <IoCodeSlashOutline size={18} />}
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="px-4 py-4 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] text-gray-500 text-center">{projects.length} Projects</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-[#1e1e1e] relative">
                <AnimatePresence mode="wait">
                    {selectedproject ? (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-white dark:bg-[#1e1e1e] z-20 flex flex-col"
                        >
                            <div className="flex items-center px-4 h-[50px] border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#1c1c1e] pl-20 shrink-0">
                                <button
                                    onClick={() => setselectedproject(null)}
                                    className={`flex items-center gap-1 text-[#007AFF] font-medium hover:opacity-70 transition-opacity text-[14px]`}
                                >
                                    <IoChevronBack size={20} />
                                    Back
                                </button>
                                <span className="flex-1 text-center font-semibold mr-8 text-[15px]">Project Details</span>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6 max-w-4xl mx-auto space-y-8">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-[22px] bg-white dark:bg-[#2c2c2e] shadow-sm border border-black/5 flex items-center justify-center text-5xl p-2 shrink-0">
                                            {selectedproject.icon}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h1 className="text-2xl font-bold mb-2">{selectedproject.title}</h1>
                                            <p className="text-gray-500 text-base mb-4 max-w-xl">{selectedproject.desc}</p>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                                <a href={selectedproject.link || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-[#007AFF] text-white rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity text-sm">
                                                    <IoOpenOutline size={16} />
                                                    View Project
                                                </a>
                                                <a href={selectedproject.github || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-[#F2F2F7] dark:bg-white/10 text-[#007AFF] rounded-full font-semibold flex items-center gap-2 hover:bg-[#e5e5ea] dark:hover:bg-white/20 transition-colors text-sm">
                                                    <IoLogoGithub size={16} />
                                                    Source Code
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200 dark:bg-white/10" />

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-bold">About</h3>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px]">
                                                {selectedproject.desc} This project showcases advanced implementation of {selectedproject.tech.join(', ')}.
                                                It was built in {selectedproject.year} and demonstrates core competencies in full-stack development.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-bold">Technologies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedproject.tech.map((t: string) => (
                                                    <span key={t} className="px-2.5 py-1 bg-white dark:bg-white/10 rounded-md text-[13px] font-medium shadow-sm border border-black/5 dark:border-transparent">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#2c2c2e] rounded-xl p-4 shadow-sm border border-black/5 dark:border-transparent">
                                        <h3 className="font-semibold mb-3 text-center text-gray-500 uppercase tracking-wide text-[11px]">Preview</h3>
                                        <div className="aspect-video bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden relative">
                                            <Image
                                                src={`/appimages/${selectedproject.title.toLowerCase()}.png`}
                                                alt={selectedproject.title}
                                                width={800}
                                                height={450}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full flex flex-col"
                        >
                            <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-10 mt-6"></div>
                            <div className="p-6 md:p-10 pt-6 max-w-7xl mx-auto w-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold">{selectedcategory !== 'All' ? selectedcategory : 'All'} Projects</h3>
                                    <span className="text-[#007AFF] text-sm font-semibold">{filteredprojects.length} items</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredprojects.map((proj) => (
                                        <div
                                            key={proj.id}
                                            className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-neutral-100 dark:border-white/5 cursor-pointer group"
                                            onClick={() => setselectedproject(proj)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-2xl">
                                                    {proj.icon}
                                                </div>
                                                <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: `${proj.color}20`, color: proj.color }}>
                                                    {proj.year}
                                                </span>
                                            </div>
                                            <h4 className="text-[17px] font-semibold mb-1">{proj.title}</h4>
                                            <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{proj.desc}</p>
                                            <div className="flex gap-1.5 flex-wrap mb-3">
                                                {proj.tech.slice(0, 3).map((t, ti) => (
                                                    <span key={ti} className="text-[10px] px-2 py-1 bg-black/5 dark:bg-white/10 rounded-md text-gray-500">{t}</span>
                                                ))}
                                            </div>
                                            <button className="w-full py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl text-[13px] font-semibold group-hover:bg-[#007AFF] group-hover:text-white transition-all flex items-center justify-center gap-2">
                                                <IoOpenOutline size={16} />
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
