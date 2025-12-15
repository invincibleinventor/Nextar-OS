'use client';
import React from 'react';

const events = [
    { year: "2024", title: "Senior Developer", desc: "Leading frontend architecture at a startup", color: "#007AFF" },
    { year: "2023", title: "Full Stack Engineer", desc: "Building scalable web applications", color: "#34C759" },
    { year: "2022", title: "Frontend Developer", desc: "Crafting pixel-perfect user interfaces", color: "#FF9500" },
    { year: "2021", title: "Graduated", desc: "Computer Science Degree", color: "#AF52DE" },
];

const today = new Date();
const daynum = today.getDate();
const weekday = today.toLocaleDateString('en-US', { weekday: 'short' });

export default function Calendar() {
    return (
        <div className="h-full w-full bg-white dark:bg-[#1e1e1e] flex font-sf">
            {/* Sidebar - Translucent */}
            <div className="w-[220px] border-r border-black/5 dark:border-white/5 bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl hidden md:flex flex-col pt-4">
                <div className="px-4 mb-6">
                    <div className="w-full aspect-square bg-white dark:bg-[#363636] rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col items-center justify-center mb-4">
                        <div className="text-[14px] font-semibold text-[#FF3B30] uppercase mb-1">{weekday}</div>
                        <div className="text-[48px] font-light text-black dark:text-white leading-none tracking-tighter">{daynum}</div>
                    </div>
                </div>

                <div className="space-y-1 px-2">
                    <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-[13px] font-medium text-black dark:text-white flex justify-between items-center cursor-pointer">
                        <span>General</span>
                        <span className="bg-black/10 dark:bg-white/10 px-1.5 rounded text-[11px] text-black/50 dark:text-white/50">{events.length}</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex justify-between items-center cursor-pointer transition-colors">
                        <span>Work</span>
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex justify-between items-center cursor-pointer transition-colors">
                        <span>Personal</span>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] text-gray-500 text-center">Calendar Sync Active</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e]">
                <div className="h-[52px] flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5">
                    <span className="font-bold text-[18px] text-black dark:text-white">December 2024</span>
                    <div className="flex bg-neutral-100 dark:bg-[#2d2d2d] rounded-lg p-0.5">
                        <button className="px-3 py-1 text-[12px] font-medium text-black dark:text-white bg-white dark:bg-[#3d3d3d] shadow-sm rounded-md">Day</button>
                        <button className="px-3 py-1 text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition">Week</button>
                        <button className="px-3 py-1 text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition">Month</button>
                        <button className="px-3 py-1 text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition">Year</button>
                    </div>
                </div>

                <div className="flex-1 p-0 overflow-y-auto">
                    <div className="relative min-h-full">
                        {/* Timeline ruler */}
                        <div className="absolute left-16 top-0 bottom-0 w-px bg-black/5 dark:bg-white/5 z-0" />

                        <div className="p-6 space-y-6">
                            {events.map((e, i) => (
                                <div key={i} className="relative z-10 flex group">
                                    <div className="w-16 flex-shrink-0 text-right pr-6 pt-4">
                                        <span className="text-[14px] font-bold text-gray-500 dark:text-gray-400">{e.year}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="bg-white dark:bg-[#262626] border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: e.color }} />
                                            <div className="pl-3">
                                                <h3 className="text-[16px] font-semibold text-black dark:text-white mb-1">{e.title}</h3>
                                                <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">{e.desc}</p>

                                                <div className="mt-3 flex gap-2">
                                                    <span className="text-[11px] px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-gray-500 dark:text-gray-400">All Day</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty state filler */}
                            <div className="h-40"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
