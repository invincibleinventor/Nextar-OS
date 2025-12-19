'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { IoChevronForward, IoChevronBack, IoColorPaletteOutline, IoNotificationsOutline, IoSettingsOutline, IoWifi, IoBluetooth, IoGlobeOutline, IoMoon, IoAccessibilityOutline, IoSearch, IoImageOutline } from 'react-icons/io5';
import { useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { personal, openSystemItem } from '../data';
import { motion, AnimatePresence } from 'framer-motion';

const sidebaritems = [
    { id: 'wifi', label: 'Wi-Fi', icon: IoWifi, color: '#007AFF' },
    { id: 'bluetooth', label: 'Bluetooth', icon: IoBluetooth, color: '#007AFF' },
    { id: 'network', label: 'Network', icon: IoGlobeOutline, color: '#007AFF' },
    { type: 'spacer' },
    { id: 'notifications', label: 'Notifications', icon: IoNotificationsOutline, color: '#FF3B30' },
    { id: 'focus', label: 'Focus', icon: IoMoon, color: '#5856D6' },
    { type: 'spacer' },
    { id: 'general', label: 'General', icon: IoSettingsOutline, color: '#8E8E93' },
    { id: 'appearance', label: 'Appearance', icon: IoColorPaletteOutline, color: '#FF9500' },
    { id: 'accessibility', label: 'Accessibility', icon: IoAccessibilityOutline, color: '#007AFF' },
    { id: 'wallpaper', label: 'Wallpaper', icon: IoImageOutline, color: '#32ADE6' },
];

export default function Settings() {
    const [activetab, setactivetab] = useState("general");
    const [showsidebar, setshowsidebar] = useState(true);
    const { reducemotion, setreducemotion, reducetransparency, setreducetransparency } = useSettings();
    const { theme, toggletheme } = useTheme();
    const { addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();
    const containerref = useRef<HTMLDivElement>(null);
    const [isnarrow, setisnarrow] = useState(false);

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width;
            const narrow = width < 600;
            setisnarrow(narrow);
            if (!narrow) setshowsidebar(true);
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, []);

    const Toggle = ({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!value)}
            className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors ${value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <div className={`w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden mb-6">
            {children}
        </div>
    );

    const SettingsRow = ({ label, value, onClick, toggle, toggleValue, onToggle, last }: any) => (
        <div
            className={`flex items-center justify-between px-4 ${ismobile ? 'py-3.5' : 'py-2.5'} ${!last ? 'border-b border-black/5 dark:border-white/5' : ''} ${onClick ? 'active:bg-black/5 dark:active:bg-white/5' : ''}`}
            onClick={onClick}
        >
            <span className={`${ismobile ? 'text-[16px]' : 'text-[13px] font-medium'}`}>{label}</span>
            <div className="flex items-center gap-2">
                {value && <span className={`${ismobile ? 'text-[16px]' : 'text-[13px]'} text-gray-500`}>{value}</span>}
                {toggle && <Toggle value={toggleValue} onChange={onToggle} />}
                {onClick && <IoChevronForward className="text-gray-400" size={ismobile ? 20 : 14} />}
            </div>
        </div>
    );

    const ContentView = () => (
        <div className={`flex-1 h-full overflow-y-auto bg-white dark:bg-[#1c1c1e] ${ismobile ? '' : 'p-0 md:p-8 md:pt-10'}`}>
            <div className={`max-w-[640px] mx-auto ${ismobile ? '' : 'md:px-4'}`}>
                {!ismobile && (
                    <div className="flex items-center gap-3 mb-5 px-4 md:px-0">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: sidebaritems.find(i => i.id === activetab)?.color || '#8E8E93' }}>
                            {(() => {
                                const item = sidebaritems.find(i => i.id === activetab);
                                if (item && 'icon' in item && item.icon) {
                                    const Icon = item.icon;
                                    return <Icon size={16} />;
                                }
                                return <IoSettingsOutline size={16} />;
                            })()}
                        </div>
                        <h1 className="text-[20px] font-bold">{sidebaritems.find(i => i.id === activetab)?.label}</h1>
                    </div>
                )}

                <div className={`${ismobile ? 'p-4' : ''}`}>
                    {activetab === 'general' && (
                        <>
                            <div className="flex flex-col items-center mb-6 bg-gray-50 dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-xl mb-3 shadow-md flex items-center justify-center text-white">
                                    <IoSettingsOutline size={28} />
                                </div>
                                <h2 className="text-lg font-bold">MacOS-Next</h2>
                                <p className="text-[12px] text-gray-500 mt-0.5">Version 14.5 (23A5212a)</p>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[11px] uppercase font-semibold text-gray-400 pl-3">About</div>
                                <SettingsGroup>
                                    <SettingsRow label="Name" value="MacBook Pro" onClick={() => { }} />
                                    <SettingsRow label="Software Update" value="Up to date" onClick={() => { }} />
                                    <SettingsRow label="Storage" value="256 GB" onClick={() => { }} last />
                                </SettingsGroup>

                                <div className="text-[11px] uppercase font-semibold text-gray-400 pl-3">Reset</div>
                                <SettingsGroup>
                                    <SettingsRow label="Reset Notifications" onClick={() => { localStorage.removeItem('clearedNotifications'); window.location.reload(); }} last />
                                </SettingsGroup>
                            </div>
                        </>
                    )}

                    {activetab === 'appearance' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-gray-400 pl-3 mb-2">Theme</div>
                            <SettingsGroup>
                                <div className="p-5 flex justify-center gap-8">
                                    <button onClick={() => theme !== 'light' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-28 h-18 rounded-lg border flex overflow-hidden shadow-sm transition-all ${theme === 'light' ? 'border-[#007AFF] ring-2 ring-[#007AFF]/20' : 'border-gray-200 dark:border-white/10 group-hover:border-gray-300'}`}>
                                            <div className="w-1/3 bg-[#f5f5f7]" />
                                            <div className="w-2/3 bg-white relative">
                                                <div className="absolute top-2 left-2 w-10 h-2 bg-blue-500 rounded-full opacity-20"></div>
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-gray-200 rounded-full"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'light' ? 'text-blue-600' : 'text-gray-500'}`}>Light</span>
                                    </button>
                                    <button onClick={() => theme !== 'dark' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-28 h-18 rounded-lg border flex overflow-hidden shadow-sm transition-all ${theme === 'dark' ? 'border-[#007AFF] ring-2 ring-[#007AFF]/20' : 'border-gray-200 dark:border-white/10 group-hover:border-gray-300'}`}>
                                            <div className="w-1/3 bg-[#2d2d2d]" />
                                            <div className="w-2/3 bg-[#1e1e1e] relative">
                                                <div className="absolute top-2 left-2 w-10 h-2 bg-blue-500 rounded-full opacity-50"></div>
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-gray-700 rounded-full"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-blue-500' : 'text-gray-500'}`}>Dark</span>
                                    </button>
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-gray-400 pl-3 mb-2">Accessibility</div>
                            <SettingsGroup>
                                <SettingsRow label="Reduce Transparency" toggle toggleValue={reducetransparency} onToggle={setreducetransparency} />
                                <SettingsRow label="Reduce Motion" toggle toggleValue={reducemotion} onToggle={setreducemotion} last />
                            </SettingsGroup>
                        </>
                    )}

                    {activetab !== 'general' && activetab !== 'appearance' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <IoSettingsOutline size={48} className="mb-4" />
                            <h3 className="text-lg font-semibold">Settings for {sidebaritems.find(i => i.id === activetab)?.label}</h3>
                            <p className="text-sm">This section is under development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (ismobile) {
        return (
            <div className="relative h-full w-full bg-white dark:bg-[#1c1c1e] font-sf text-black dark:text-white overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    {showsidebar ? (
                        <motion.div
                            key="sidebar"
                            initial={{ x: '-30%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-30%', opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="absolute pb-10 inset-0 z-30 bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="px-4 pt-12 pb-2">
                                <h1 className="text-[32px] font-bold">Settings</h1>
                            </div>
                            <div className="px-4 py-2">
                                <div className="relative">
                                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input placeholder="Search" className="w-full bg-white dark:bg-[#2c2c2e] rounded-xl pl-9 pr-3 py-2 text-[16px] outline-none placeholder-gray-500" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                                <div
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-[#2c2c2e] rounded-2xl cursor-pointer"
                                    onClick={() => openSystemItem('mail', { addwindow, windows, updatewindow, setactivewindow, ismobile })}
                                >
                                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-black/5">
                                        <Image src="/pfp.png" alt="Profile" width={56} height={56} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[18px] font-semibold truncate">{personal.personal.name}</div>
                                        <div className="text-[14px] text-gray-500 truncate">Apple ID, iCloud+</div>
                                    </div>
                                    <IoChevronForward className="text-gray-400" size={24} />
                                </div>

                                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl overflow-hidden">
                                    {sidebaritems.filter(i => i.type !== 'spacer').map((item: any, i, arr) => (
                                        <div
                                            key={item.id}
                                            onClick={() => { setactivetab(item.id); setshowsidebar(false); }}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-black/5 dark:active:bg-white/10 ${i !== arr.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                                        >
                                            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0" style={{ backgroundColor: item.color }}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-[16px] font-medium flex-1">{item.label}</span>
                                            <IoChevronForward className="text-gray-400" size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', stiffness: 300, damping: 30 }}
                            className="absolute inset-0 z-30 bg-white dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="h-14 flex items-center px-2 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl">
                                <button
                                    onClick={() => setshowsidebar(true)}
                                    className="flex items-center text-[#007AFF] px-2"
                                >
                                    <IoChevronBack size={26} />
                                    <span className="text-[16px]">Settings</span>
                                </button>
                                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[16px]">
                                    {sidebaritems.find(i => i.id === activetab)?.label}
                                </span>
                            </div>
                            <ContentView />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={containerref} className="flex h-full w-full font-sf text-black dark:text-white overflow-hidden">
            <div className="w-[260px] border-r border-black/5 dark:border-white/10 bg-gray-100/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl flex flex-col pt-10 h-full">
                <div className="px-4 py-2 mb-2">
                    <div className="relative">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input placeholder="Search" className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-8 pr-3 py-1 text-[13px] outline-none placeholder-gray-500 transition-all focus:bg-white dark:focus:bg-[#2c2c2e] focus:shadow-sm" />
                    </div>
                </div>

                <div className="px-3 pb-2">
                    <div
                        className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                        onClick={() => openSystemItem('mail', { addwindow, windows, updatewindow, setactivewindow, ismobile })}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/5">
                            <Image src="/pfp.png" alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold truncate leading-tight">{personal.personal.name}</div>
                            <div className="text-[11px] text-gray-500 truncate">Apple ID, iCloud, Media & Purchases</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                    {sidebaritems.map((item: any, i) => {
                        if (item.type === 'spacer') return <div key={i} className="h-2" />;
                        return (
                            <div
                                key={item.id}
                                onClick={() => setactivetab(item.id)}
                                className={`flex items-center gap-2.5 px-3 py-1 rounded-md cursor-pointer mx-1 transition-colors ${activetab === item.id ? 'bg-[#007AFF] text-white' : 'text-black dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <div className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0 text-[12px]" style={{ backgroundColor: activetab === item.id ? 'transparent' : item.color }}>
                                    <item.icon size={12} className={activetab === item.id ? 'text-white' : ''} />
                                </div>
                                <span className="text-[13px] leading-none pb-[1px]">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <ContentView />
        </div>
    );
}
