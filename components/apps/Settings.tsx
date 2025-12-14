'use client';
import React from 'react';
import { IoChevronForward } from 'react-icons/io5';

const specs = [
    { label: "Processor", value: "Neural Brain 2.0 (Creative Core)" },
    { label: "Memory", value: "Unlimited Learning Capacity" },
    { label: "Graphics", value: "Pixel Perfect Vision Pro" },
    { label: "OS", value: "PortfolioOS 1.0" },
    { label: "Serial", value: "PORTFOLIO-2024-PRO" },
];

const menuitems = [
    { name: "General", active: true },
    { name: "Appearance", active: false },
    { name: "Desktop & Dock", active: false },
    { name: "Displays", active: false },
    { name: "Wallpaper", active: false },
];

export default function Settings() {
    return (
        <div className="flex h-full w-full bg-[#f5f5f5] dark:bg-[#232323] font-sf text-[13px]">
            <div className="w-[200px] bg-[#e8e8e8]/80 dark:bg-[#2a2a2a]/80 border-r border-black/5 dark:border-white/5 py-2">
                <div className="px-3 mb-4">
                    <input
                        placeholder="Search"
                        className="w-full bg-black/5 dark:bg-white/5 rounded-md px-3 py-1.5 text-[12px] outline-none placeholder-gray-400"
                    />
                </div>
                {menuitems.map((item, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-default transition-colors
                            ${item.active
                                ? 'bg-[#007AFF] text-white'
                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <span>{item.name}</span>
                        {!item.active && <IoChevronForward className="text-gray-400 text-[10px]" />}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-md mx-auto">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-xl mb-4" />
                        <h1 className="text-xl font-bold text-black dark:text-white">Portfolio Pro</h1>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">Developer Experience 2024</p>
                    </div>

                    <div className="bg-white dark:bg-[#2d2d2d] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                        {specs.map((spec, i) => (
                            <div
                                key={i}
                                className={`flex justify-between items-center px-4 py-3
                                    ${i !== specs.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                            >
                                <span className="text-gray-500 dark:text-gray-400">{spec.label}</span>
                                <span className="font-medium text-black dark:text-white truncate ml-4">{spec.value}</span>
                            </div>
                        ))}
                    </div>

                    <button className="px-4 py-1.5 bg-[#007AFF] text-white rounded-md text-[12px] font-medium hover:bg-[#0066dd] transition-colors">
                        Software Update...
                    </button>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10 text-center">
                    <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Developer Options</p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('clearedNotifications');
                            alert('Signatures cleared. Refreshing...');
                            window.location.reload();
                        }}
                        className="px-4 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-md text-[11px] font-medium transition-colors"
                    >
                        Reset Notification History
                    </button>
                </div>
            </div>
        </div>
    )
}
