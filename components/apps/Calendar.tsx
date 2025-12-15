'use client';
import React, { useState } from 'react';
import { portfoliodata } from '../portfolioData';
import { usewindows } from '../WindowContext';
import { IoCalendarOutline, IoTimeOutline, IoGolfOutline, IoRocketOutline } from "react-icons/io5";

const today = new Date();
const daynum = today.getDate();
const weekday = today.toLocaleDateString('en-US', { weekday: 'short' });

export default function Calendar() {
    const { addwindow } = usewindows();
    const [view, setview] = useState<'timeline' | 'grid'>('timeline');

    // Map projects to events for the timeline
    const events = portfoliodata.projects.map((proj, i) => ({
        id: i,
        year: proj.date,
        title: proj.title,
        desc: proj.desc,
        color: i % 2 === 0 ? "#007AFF" : "#34C759",
        icon: proj.icon,
        tech: proj.stack
    }));

    return (
        <div className="h-full w-full bg-white dark:bg-[#1e1e1e] flex font-sf text-black dark:text-white">

            <div className="w-[220px] border-r border-black/5 dark:border-white/5 bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl hidden md:flex flex-col pt-4">
                <div className="px-4 mb-6">
                    <div className="w-full aspect-square bg-white dark:bg-[#363636] rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col items-center justify-center mb-4">
                        <div className="text-[14px] font-semibold text-[#FF3B30] uppercase mb-1">{weekday}</div>
                        <div className="text-[48px] font-light text-black dark:text-white leading-none tracking-tighter">{daynum}</div>
                    </div>
                </div>

                <div className="space-y-1 px-2">
                    <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-[13px] font-medium text-black dark:text-white flex justify-between items-center cursor-pointer">
                        <span>All Projects</span>
                        <span className="bg-black/10 dark:bg-white/10 px-1.5 rounded text-[11px] text-black/50 dark:text-white/50">{events.length}</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex justify-between items-center cursor-pointer transition-colors">
                        <span>Web Apps</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex justify-between items-center cursor-pointer transition-colors">
                        <span>Tools</span>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] text-gray-500 text-center">Project Timeline Sync Active</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
                <div className="h-[52px] flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5">
                    <span className="font-bold text-[18px]">Project Roadmap</span>
                    <div className="flex bg-neutral-100 dark:bg-[#2d2d2d] rounded-lg p-0.5">
                        <button
                            onClick={() => setview('timeline')}
                            className={`px-3 py-1 text-[12px] font-medium transition-all rounded-md ${view === 'timeline' ? 'bg-white dark:bg-[#3d3d3d] shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setview('grid')}
                            className={`px-3 py-1 text-[12px] font-medium transition-all rounded-md ${view === 'grid' ? 'bg-white dark:bg-[#3d3d3d] shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                        >
                            Grid
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-0 overflow-y-auto">
                    <div className="relative min-h-full">

                        {view === 'timeline' && <div className="absolute left-6 md:left-10 top-0 bottom-0 w-px bg-black/5 dark:bg-white/5 z-0" />}

                        <div className="p-6 space-y-8 overflow-x-hidden md:overflow-x-visible">
                            {view === 'timeline' ? (
                                events.map((e, i) => (
                                    <div key={i} className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 group">
                                        <div className="w-8 md:w-16 flex-shrink-0 flex flex-col items-center pt-1">
                                            <div className="w-3 h-3 rounded-full border-2 border-white dark:border-[#1e1e1e] shadow-sm z-20" style={{ backgroundColor: e.color }} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="bg-white dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-all duration-300 relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: e.color }} />
                                                <div className="pl-3">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="text-[16px] font-semibold text-black dark:text-white">{e.title}</h3>
                                                        <div className="flex gap-1">
                                                            {e.tech.slice(0, 3).map((t, ti) => (
                                                                <span key={ti} className="text-[10px] px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-gray-500">{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">{e.desc}</p>

                                                    <div className="mt-3 flex gap-4 items-center">
                                                        <button
                                                            onClick={() => {
                                                                addwindow({
                                                                    id: `finder-${e.title}-${Date.now()}`,
                                                                    appname: 'Finder',
                                                                    title: `Project: ${e.title}`,
                                                                    component: 'apps/Finder',
                                                                    icon: '/finder.png',
                                                                    isminimized: false,
                                                                    ismaximized: false,
                                                                    position: { top: 100, left: 100 },
                                                                    size: { width: 800, height: 600 },
                                                                    props: { initialpath: ['Projects', e.title] }
                                                                });
                                                            }}
                                                            className="text-[11px] px-3 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-black/70 dark:text-white/70 transition-colors flex items-center gap-1"
                                                        >
                                                            <IoRocketOutline /> View Project
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {events.map((e, i) => (
                                        <div key={i} className="bg-white dark:bg-[#262626] border border-black/5 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: e.color }} />
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-xl">
                                                    {e.icon}
                                                </div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium bg-opacity-10`} style={{ backgroundColor: `${e.color}20`, color: e.color }}>
                                                    {e.year}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">{e.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug mb-4 flex-1">{e.desc}</p>

                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {e.tech.slice(0, 3).map((t, ti) => (
                                                    <span key={ti} className="text-[10px] px-2 py-1 bg-neutral-100 dark:bg-black/20 rounded-md text-gray-500">{t}</span>
                                                ))}
                                                {e.tech.length > 3 && <span className="text-[10px] px-2 py-1 bg-neutral-100 dark:bg-black/20 rounded-md text-gray-500">+{e.tech.length - 3}</span>}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    addwindow({
                                                        id: `finder-${e.title}-${Date.now()}`,
                                                        appname: 'Finder',
                                                        title: `Project: ${e.title}`,
                                                        component: 'apps/Finder',
                                                        icon: '/finder.png',
                                                        isminimized: false,
                                                        ismaximized: false,
                                                        position: { top: 100, left: 100 },
                                                        size: { width: 800, height: 600 },
                                                        props: { initialpath: ['Projects', e.title] }
                                                    });
                                                }}
                                                className="w-full mt-auto text-xs py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <IoRocketOutline /> View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="h-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
