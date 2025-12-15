'use client';
import React, { useState } from 'react';
import { IoChevronForward } from 'react-icons/io5';
import { useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

const specs = [
    { label: "Processor", value: "Neural Brain 2.0 (Creative Core)" },
    { label: "Memory", value: "Unlimited Learning Capacity" },
    { label: "Graphics", value: "Pixel Perfect Vision Pro" },
    { label: "OS", value: "PortfolioOS 1.0" },
    { label: "Serial", value: "PORTFOLIO-2024-PRO" },
];

const menuitems = [
    { name: "General", id: "general" },
    { name: "Appearance", id: "appearance" },
    { name: "Desktop & Dock", id: "desktop" },
    { name: "Displays", id: "displays" },
    { name: "Wallpaper", id: "wallpaper" },
];

export default function Settings() {
    const [activetab, setactivetab] = useState("general");
    const { reducemotion, setreducemotion, reducetransparency, setreducetransparency } = useSettings();
    const { theme, toggletheme } = useTheme();

    return (
        <div className="flex h-full w-full bg-[#f5f5f5] dark:bg-[#1e1e1e] font-sf text-[13px] text-black dark:text-white">
            <div className="w-[200px] bg-[#e8e8e8]/80 dark:bg-[#2a2a2a]/80 border-r border-black/5 dark:border-white/5 py-2">
                <div className="px-3 mb-4">
                    <input
                        placeholder="Search"
                        className="w-full bg-black/5 dark:bg-white/5 rounded-md px-3 py-1.5 text-[12px] outline-none placeholder-gray-400 dark:placeholder-gray-500 text-black dark:text-white"
                    />
                </div>
                {menuitems.map((item, i) => (
                    <div
                        key={i}
                        onClick={() => setactivetab(item.id)}
                        className={`flex items-center justify-between px-3 py-1.5 mx-2 rounded-md cursor-pointer transition-colors
                            ${activetab === item.id
                                ? 'bg-[#007AFF] text-white'
                                : 'text-black/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <span>{item.name}</span>
                        {activetab !== item.id && <IoChevronForward className="text-gray-400 text-[10px]" />}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-md mx-auto">

                    {activetab === 'general' && (
                        <>
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-xl mb-4" />
                                <h1 className="text-xl font-bold">Portfolio Pro</h1>
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
                                        <span className="font-medium truncate ml-4">{spec.value}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="mt-6 px-4 py-1.5 bg-[#007AFF] text-white rounded-md text-[12px] font-medium hover:bg-[#0066dd] transition-colors w-full">
                                Software Update...
                            </button>

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
                        </>
                    )}

                    {activetab === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold mb-4">Appearance</h2>

                            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-medium">Interface Style</span>
                                </div>
                                <div className="flex gap-4">
                                    <div
                                        className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${theme === 'light' ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
                                        onClick={() => theme !== 'light' && toggletheme()}
                                    >
                                        <div className="h-16 bg-[#f5f5f5] rounded-md mb-2 border border-gray-200" />
                                        <div className="text-center text-xs font-medium">Light</div>
                                    </div>
                                    <div
                                        className={`flex-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${theme === 'dark' ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
                                        onClick={() => theme !== 'dark' && toggletheme()}
                                    >
                                        <div className="h-16 bg-[#1e1e1e] rounded-md mb-2 border border-gray-700" />
                                        <div className="text-center text-xs font-medium">Dark</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Reduce Transparency</span>
                                        <span className="text-[11px] text-gray-500">Improves contrast by reducing blur effects</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={reducetransparency}
                                        onChange={(e) => setreducetransparency(e.target.checked)}
                                        className="toggle"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium">Reduce Motion</span>
                                        <span className="text-[11px] text-gray-500">Reduces animation movement and complexity</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={reducemotion}
                                        onChange={(e) => setreducemotion(e.target.checked)}
                                        className="toggle"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
