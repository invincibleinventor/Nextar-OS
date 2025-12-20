'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { personal } from '../data';
import { useDevice } from '../DeviceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoPersonOutline, IoCodeSlashOutline, IoSchoolOutline, IoMailOutline, IoLogoGithub, IoLogoLinkedin, IoGlobeOutline, IoChevronForward, IoChevronBack } from 'react-icons/io5';

type Tab = 'about' | 'projects' | 'education' | 'contact';

export default function AboutBala() {
    const { ismobile } = useDevice();
    const [activetab, setactivetab] = useState<Tab>('about');
    const [activeProject, setActiveProject] = useState<any>(null);

    const tabs = [
        { id: 'about', label: 'About', icon: IoPersonOutline },
        { id: 'projects', label: 'Projects', icon: IoCodeSlashOutline },
        { id: 'education', label: 'Education', icon: IoSchoolOutline },
        { id: 'contact', label: 'Contact', icon: IoMailOutline }
    ];

    const renderContent = () => {
        switch (activetab) {
            case 'about':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-lg">
                                <Image src="/pfp.png" alt={personal.personal.name} width={96} height={96} className="object-cover" />
                            </div>
                            <h2 className="text-2xl font-bold">{personal.personal.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{personal.personal.role}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {personal.personal.location}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                            <p className="text-sm leading-relaxed">{personal.personal.bio}</p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <a href={personal.personal.socials.github} target="_blank" rel="noreferrer" className="p-3 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                <IoLogoGithub size={24} />
                            </a>
                            <a href={personal.personal.socials.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                <IoLogoLinkedin size={24} className="text-[#0077b5]" />
                            </a>
                            <a href={`mailto:${personal.personal.email}`} className="p-3 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                <IoMailOutline size={24} />
                            </a>
                        </div>
                    </div>
                );

            case 'projects':
                return (
                    <div className="space-y-3">
                        <AnimatePresence mode="wait">
                            {activeProject ? (
                                <motion.div
                                    key="project-detail"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex flex-col h-full"
                                >
                                    <button
                                        onClick={() => setActiveProject(null)}
                                        className="flex items-center gap-1 text-sm text-accent mb-4 hover:opacity-80 transition-opacity"
                                    >
                                        <IoChevronBack size={16} />
                                        Back to Projects
                                    </button>

                                    <div className="flex flex-col items-center mb-6">
                                        <div className="w-24 h-24 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                            {activeProject.icon}
                                        </div>
                                        <h2 className="text-xl font-bold text-center">{activeProject.title}</h2>
                                        <p className="text-sm text-gray-500">{activeProject.date}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                                            <h3 className="font-semibold text-sm mb-2">About</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {activeProject.desc}
                                            </p>
                                        </div>

                                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                                            <h3 className="font-semibold text-sm mb-2">Tech Stack</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {activeProject.stack.map((item: string, idx: number) => (
                                                    <span key={idx} className="px-2 py-1 bg-white dark:bg-white/10 rounded text-xs text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/5">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {activeProject.link && activeProject.link !== '#' && (
                                                <a
                                                    href={activeProject.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
                                                >
                                                    <IoGlobeOutline size={18} />
                                                    Visit Website
                                                </a>
                                            )}
                                            {activeProject.github && activeProject.github !== '#' && (
                                                <a
                                                    href={activeProject.github}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-white/10 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors text-black dark:text-white"
                                                >
                                                    <IoLogoGithub size={18} />
                                                    Source Code
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="project-list"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    {personal.projects.map((proj, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveProject(proj)}
                                            className="bg-gray-100 dark:bg-white/5 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group active:scale-[0.98]"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-black/30 flex items-center justify-center shrink-0 shadow-sm">
                                                {proj.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">{proj.title}</h3>
                                                    <IoChevronForward className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{proj.desc}</p>
                                                <div className="flex gap-2 mt-1.5 overflow-hidden">
                                                    {proj.stack.slice(0, 3).map((tech: string, i: number) => (
                                                        <span key={i} className="text-[10px] bg-white dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                    {proj.stack.length > 3 && (
                                                        <span className="text-[10px] text-gray-400">+{proj.stack.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );

            case 'education':
                return (
                    <div className="space-y-4">
                        {(personal.education || []).map((edu: any, idx: number) => (
                            <div key={idx} className="bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <IoSchoolOutline size={20} className="text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">{edu.degree}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{edu.institution}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-400">{edu.year}</span>
                                            <span className="text-xs text-green-500">{edu.grade}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl p-4">
                            <h3 className="font-semibold text-sm mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(personal.skills || []).map((skill: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-accent/10 text-blue-500 rounded-full text-xs font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden">
                            <a href={`mailto:${personal.personal.email}`} className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <IoMailOutline size={20} />
                                    <span className="text-sm">Email</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{personal.personal.email}</span>
                                    <IoChevronForward size={16} className="text-gray-400" />
                                </div>
                            </a>
                            <a href={personal.personal.socials.github} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <IoLogoGithub size={20} />
                                    <span className="text-sm">GitHub</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">@{personal.personal.username}</span>
                                    <IoChevronForward size={16} className="text-gray-400" />
                                </div>
                            </a>
                            <a href={personal.personal.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <IoLogoLinkedin size={20} className="text-[#0077b5]" />
                                    <span className="text-sm">LinkedIn</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Connect</span>
                                    <IoChevronForward size={16} className="text-gray-400" />
                                </div>
                            </a>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full w-full pt-[50px] bg-white dark:bg-[#1e1e1e] text-black dark:text-white font-sf rounded-b-xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activetab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex justify-around border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#2a2a2a] p-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setactivetab(tab.id as Tab)}
                        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${activetab === tab.id ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <tab.icon size={20} />
                        <span className="text-xs">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
