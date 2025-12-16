import React, { useState } from 'react';
import { IoSearch, IoPersonCircleOutline, IoGameControllerOutline, IoRocketOutline, IoBrushOutline, IoConstructOutline, IoCodeSlashOutline } from "react-icons/io5";
import Image from 'next/image';
import { FaApple } from "react-icons/fa";
import { apps } from './app';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';

export default function AppStore() {
    const [activetab, setactivetab] = useState('Discover');
    const { addwindow } = useWindows();
    const { ismobile } = useDevice();

    const sidebaritems = [
        { name: 'Discover', icon: IoRocketOutline },
        { name: 'Arcade', icon: IoGameControllerOutline },
        { name: 'Create', icon: IoBrushOutline },
        { name: 'Work', icon: IoConstructOutline },
        { name: 'Develop', icon: IoCodeSlashOutline },
    ];

    const featuredapps = apps.filter(a => ['finder', 'safari', 'photos', 'settings', 'messsages', 'mail'].includes(a.id));

    const freeApps = apps.length > 5 ? apps.slice(3, 8) : apps.slice(0, 5);

    return (
        <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden relative">

            <div className={`w-[200px] shrink-0 flex flex-col pt-8 pb-4 px-2 border-r border-black/5 dark:border-white/5 bg-[#fbfbfd]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl ${ismobile ? 'hidden' : 'pt-[50px] flex'}`}>
                <div className="px-4 mb-6">
                    <div className="relative">
                        <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none placeholder-gray-500"
                            placeholder="Search"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    {sidebaritems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setactivetab(item.name)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${activetab === item.name
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <item.icon className="text-lg" />
                            {item.name}
                        </button>
                    ))}
                </div>

                <div className="mt-auto px-4 py-4 border-t border-black/5 dark:border-white/5">
                    <button className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                        <IoPersonCircleOutline className="text-xl" />
                        <span>Account</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-y-auto relative pb-20 md:pb-0">

                <div className="p-4 md:p-8 pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 px-2">{activetab}</h1>

                    <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x px-2">
                        <div className="snap-center min-w-[85%] md:min-w-[60%] h-[240px] md:h-[300px] rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 md:p-8 text-white flex flex-col justify-end shadow-xl cursor-pointer hover:scale-[1.01] transition-transform">
                            <span className="uppercase text-xs font-bold opacity-80 mb-2">Editor&apos;s Choice</span>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">The Future of Portfolios</h2>
                            <p className="opacity-90 max-w-md text-sm md:text-base">Experience a fully functional macOS simulation directly in your browser. Built with Next.js.</p>
                        </div>
                        <div className="snap-center min-w-[85%] md:min-w-[60%] h-[240px] md:h-[300px] rounded-2xl bg-gradient-to-br from-green-400 to-teal-600 p-6 md:p-8 text-white flex flex-col justify-end shadow-xl cursor-pointer hover:scale-[1.01] transition-transform">
                            <span className="uppercase text-xs font-bold opacity-80 mb-2">New Release</span>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">Global Connectivity</h2>
                            <p className="opacity-90 max-w-md text-sm md:text-base">Stay connected with integrated Mail and Safari apps. Explore the web within the web.</p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-black/5 dark:bg-white/5 mx-4 md:mx-8"></div>

             
                <div className="p-4 md:p-8 pt-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-lg md:text-xl font-bold">Top Free Apps</h3>
                        <button className="text-[#007AFF] text-sm font-medium">See All</button>
                    </div>
                    <div className="space-y-4">
                        {freeApps.map((app, i) => (
                            <div key={app.id} className="flex items-center gap-4 px-2 py-2 border-b border-dashed border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                                <span className="font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                                <Image src={app.icon} alt={app.appname} width={48} height={48} className="w-12 h-12 object-contain drop-shadow-sm rounded-[12px]" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{app.appname}</h4>
                                    <p className="text-xs text-gray-500">Utilities</p>
                                </div>
                                <button onClick={() => {
                                    addwindow({
                                        id: `${app.id}-${Date.now()}`,
                                        appname: app.appname,
                                        title: app.appname,
                                        component: app.componentname,
                                        icon: app.icon,
                                        isminimized: false,
                                        ismaximized: false,
                                        position: { top: 100, left: 100 },
                                        size: app.defaultsize || { width: 900, height: 600 },
                                        props: {}
                                    });
                                }}
                                    className="p-2 bg-[#f0f0f0] dark:bg-[#3d3d3d] rounded-full text-[#007AFF] hover:bg-[#007AFF] hover:text-white transition-all">
                                    <IoRocketOutline className="text-lg" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {ismobile && (
                <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-[#fbfbfd]/90 dark:bg-[#2d2d2d]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/5 flex items-center justify-around z-50">
                    {sidebaritems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setactivetab(item.name)}
                            className={`flex flex-col items-center justify-center space-y-1 w-full h-full
                                ${activetab === item.name
                                    ? 'text-[#007AFF]'
                                    : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <item.icon className="text-xl" />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </button>
                    ))}
                    <button className="flex flex-col items-center justify-center space-y-1 w-full h-full text-gray-500 dark:text-gray-400">
                        <IoSearch className="text-xl" />
                        <span className="text-[10px] font-medium">Search</span>
                    </button>
                </div>
            )}

        </div>
    );
}
