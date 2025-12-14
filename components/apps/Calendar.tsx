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
        <div className="h-full w-full bg-white dark:bg-[#232323] flex font-sf">
            <div className="w-[200px] border-r border-black/5 dark:border-white/5 bg-[#f6f6f6] dark:bg-[#2a2a2a] hidden md:flex flex-col">
                <div className="p-4 flex flex-col items-center border-b border-black/5 dark:border-white/5">
                    <div className="text-[11px] font-semibold text-[#FF3B30] uppercase">{weekday}</div>
                    <div className="text-[40px] font-light text-black dark:text-white leading-tight">{daynum}</div>
                </div>
                <div className="p-3 space-y-1">
                    <div className="px-3 py-1.5 bg-[#007AFF] text-white rounded-md text-[12px] font-medium">Today</div>
                    <div className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-[12px]">Upcoming</div>
                    <div className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-[12px]">All Events</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="h-[44px] flex items-center justify-between px-4 bg-[#f6f6f6]/80 dark:bg-[#2a2a2a]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
                    <span className="font-semibold text-[15px] text-black dark:text-white">Career Timeline</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 text-[11px] bg-black/5 dark:bg-white/10 rounded-md">Day</button>
                        <button className="px-3 py-1 text-[11px] bg-black/5 dark:bg-white/10 rounded-md">Week</button>
                        <button className="px-3 py-1 text-[11px] bg-[#007AFF] text-white rounded-md font-medium">Year</button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-0">
                        {events.map((e, i) => (
                            <div key={i} className="flex gap-6">
                                <div className="w-16 text-right">
                                    <span className="text-[20px] font-light text-gray-400">{e.year}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-3 h-3 rounded-full border-[3px] border-white dark:border-[#232323] shadow-sm"
                                        style={{ backgroundColor: e.color }}
                                    />
                                    {i !== events.length - 1 && (
                                        <div className="w-0.5 h-20 bg-gray-200 dark:bg-gray-700" />
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="p-4 bg-[#f6f6f6] dark:bg-[#2d2d2d] rounded-xl">
                                        <h3 className="font-semibold text-[15px] text-black dark:text-white mb-1">{e.title}</h3>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400">{e.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
