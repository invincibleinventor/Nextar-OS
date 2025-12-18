import React, { useState } from 'react';
import { IoSearch, IoPersonCircleOutline, IoGameControllerOutline, IoRocketOutline, IoBrushOutline, IoConstructOutline, IoCodeSlashOutline, IoGlobeOutline } from "react-icons/io5";
import Image from 'next/image';
import { FaApple } from "react-icons/fa";
import { apps, openSystemItem } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';

export default function AppStore() {
    const [activetab, setactivetab] = useState('Discover');
    const { addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();

    const sidebaritems = [
        { name: 'Discover', icon: IoRocketOutline },
        { name: 'Arcade', icon: IoGameControllerOutline },
        { name: 'Create', icon: IoBrushOutline },
        { name: 'Work', icon: IoConstructOutline },
        { name: 'Develop', icon: IoCodeSlashOutline },
    ];

    const featuredapps = apps.filter(a => ['finder', 'safari', 'photos', 'settings', 'messsages', 'mail'].includes(a.id));

    const freeapps = apps.length > 5 ? apps.slice(3, 8) : apps.slice(0, 5);

    return (
        <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden relative">

            <div className={`w-[200px] shrink-0 flex-col pt-[50px] pb-4 px-2 border-r border-black/5 dark:border-white/5 bg-[#fbfbfd]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl hidden md:flex`}>
                <div className="px-4 mb-6">
                    <div className="relative">
                        <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none placeholder-gray-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium text-black dark:text-white"
                            placeholder="Search"
                        />
                    </div>
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto">
                    {sidebaritems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setactivetab(item.name)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activetab === item.name
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <item.icon className="text-xl" />
                            {item.name}
                        </button>
                    ))}
                </div>

                <div className="mt-auto px-4 py-4 border-t border-black/5 dark:border-white/5">
                    <button className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                        <IoPersonCircleOutline className="text-2xl" />
                        <span>Account</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-y-auto relative pb-24 md:pb-0 scroll-smooth bg-[#ffffff] dark:bg-[#1e1e1e]">

                <div className="p-6 md:p-10 pb-4 max-w-7xl mx-auto w-full">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 md:mb-10 px-2 tracking-tight text-black dark:text-white">{activetab}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12 px-2">
                        <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-8 text-white flex flex-col justify-end shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            <div className="z-10 transform translate-y-0 transition-transform duration-300">
                                <span className="uppercase text-xs font-bold opacity-80 mb-3 block tracking-widest">Editor&apos;s Choice</span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">The Future of Portfolios</h2>
                                <p className="opacity-90 max-w-md text-base md:text-lg font-medium leading-relaxed">Experience a fully functional macOS simulation directly in your browser. Built with Next.js.</p>
                            </div>
                            <IoRocketOutline className="absolute top-8 right-8 text-white/20 text-9xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        </div>

                        <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-[#30D158] to-[#00C7BE] p-8 text-white flex flex-col justify-end shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            <div className="z-10">
                                <span className="uppercase text-xs font-bold opacity-80 mb-3 block tracking-widest">New Release</span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">Global Connectivity</h2>
                                <p className="opacity-90 max-w-md text-base md:text-lg font-medium leading-relaxed">Stay connected with integrated Mail and Safari apps. Explore the web within the web.</p>
                            </div>
                            <IoGlobeOutline className="absolute top-8 right-8 text-white/20 text-9xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-8 md:mx-12 my-2"></div>

                <div className="p-6 md:p-10 pt-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white">Top Free Apps</h3>
                        <button className="text-[#007AFF] text-base font-semibold hover:opacity-70 transition-opacity">See All</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
                        {freeapps.map((app, i) => (
                            <div key={app.id}
                                className="flex items-center gap-4 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all cursor-pointer group bg-white dark:bg-[#2c2c2e] shadow-sm hover:shadow-md border border-neutral-200/50 dark:border-white/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openSystemItem(app.id, { addwindow, windows, updatewindow, setactivewindow, ismobile });
                                }}
                            >
                                <div className="relative w-16 h-16 shrink-0 transition-transform duration-200 group-hover:scale-105">
                                    <Image src={app.icon} alt={app.appname} fill className="object-contain drop-shadow-md rounded-[14px]" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="font-semibold text-base truncate text-black dark:text-white leading-tight mb-1">{app.appname}</h4>
                                    <p className="text-xs text-neutral-500 font-medium">Productivity</p>
                                </div>
                                <div className="px-5 py-1.5 bg-[#f0f0f0] dark:bg-[#3d3d3d] rounded-full text-[#007AFF] text-xs font-bold group-hover:bg-[#007AFF] group-hover:text-white transition-all uppercase tracking-wide">
                                    Open
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="absolute bottom-0 left-0 right-0 h-[80px] pb-[16px] bg-[#fbfbfd]/90 dark:bg-[#2d2d2d]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/5 flex items-start pt-2 justify-around z-50 md:hidden">
                {sidebaritems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => setactivetab(item.name)}
                        className={`flex flex-col items-center justify-center space-y-1 w-full
                            ${activetab === item.name
                                ? 'text-[#007AFF]'
                                : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <item.icon className="text-2xl" />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </button>
                ))}
                <button className="flex flex-col items-center justify-center space-y-1 w-full text-gray-500 dark:text-gray-400">
                    <IoSearch className="text-2xl" />
                    <span className="text-[10px] font-medium">Search</span>
                </button>
            </div>

        </div>
    );
}
