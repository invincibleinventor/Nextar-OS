'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    IoChevronForward, IoColorPaletteOutline, IoNotificationsOutline, IoPerson, IoSettingsOutline,
    IoWifi, IoBluetooth, IoGlobeOutline, IoMoon, IoHourglassOutline, IoAccessibilityOutline, IoToggle,
    IoMicOutline, IoHandLeftOutline, IoDesktopOutline, IoImageOutline, IoSearch
} from 'react-icons/io5';
import { useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { portfoliodata } from '../portfolioData';
const specs = [
    { label: "Processor", value: "Silicon yumm4 Pro" },
    { label: "Memory", value: "16 GB" },
    { label: "Graphics", value: "1920px1080p@60HZ" },
    { label: "OS", value: "MacOS-Next 1.0" },
    { label: "Serial", value: "MacOS-2025-BALATBR" },
];

const sidebaritems = [
    { type: 'header', label: 'Connectivity' },
    { id: 'wifi', label: 'Wi-Fi', icon: IoWifi, color: '#007AFF' },
    { id: 'bluetooth', label: 'Bluetooth', icon: IoBluetooth, color: '#007AFF' },
    { id: 'network', label: 'Network', icon: IoGlobeOutline, color: '#007AFF' },

    { type: 'spacer' },

    { id: 'notifications', label: 'Notifications', icon: IoNotificationsOutline, color: '#FF3B30' },
    { id: 'sound', label: 'Sound', icon: IoNotificationsOutline, color: '#FF2D55' },
    { id: 'focus', label: 'Focus', icon: IoMoon, color: '#5856D6' },
    { id: 'screentime', label: 'Screen Time', icon: IoHourglassOutline, color: '#5856D6' },

    { type: 'spacer' },

    { id: 'general', label: 'General', icon: IoSettingsOutline, color: '#8E8E93' },
    { id: 'appearance', label: 'Appearance', icon: IoColorPaletteOutline, color: '#A2A2A2' },
    { id: 'accessibility', label: 'Accessibility', icon: IoAccessibilityOutline, color: '#007AFF' },

    { type: 'spacer' },

    { id: 'controlcenter', label: 'Control Center', icon: IoToggle, color: '#8E8E93' },
    { id: 'siri', label: 'Siri & Spotlight', icon: IoMicOutline, color: '#000000' },
    { id: 'privacy', label: 'Privacy & Security', icon: IoHandLeftOutline, color: '#007AFF' },

    { type: 'spacer' },

    { id: 'desktop', label: 'Desktop & Dock', icon: IoDesktopOutline, color: '#000000' },
    { id: 'displays', label: 'Displays', icon: IoDesktopOutline, color: '#007AFF' },
    { id: 'wallpaper', label: 'Wallpaper', icon: IoImageOutline, color: '#32ADE6' },
    { id: 'users', label: 'Users', icon: IoPerson, color: '#8E8E93' },
];

const accentcolors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#28CD41', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93'
];

export default function Settings() {
    const [searchquery, setsearchquery] = useState("");
    const [activetab, setactivetab] = useState("general");
    const { reducemotion, setreducemotion, reducetransparency, setreducetransparency } = useSettings();
    const { theme, toggletheme } = useTheme();
    const { addwindow } = useWindows();
    const { ismobile } = useDevice();
    const [isnarrow, setisnarrow] = useState(false);
    const [showsidebar, setshowsidebar] = useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;

                if (width === 0) return;

                const isNowNarrow = width < 768;
                setisnarrow(isNowNarrow);

                if (isNowNarrow && !isnarrow) {
                    setshowsidebar(true);
                }
                if (!isNowNarrow) {
                    setshowsidebar(true);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleitemclick = (id: string) => {
        setactivetab(id);
        if (isnarrow) {
            setshowsidebar(false);
        }
    };

    const filtereditems = sidebaritems.filter((item: any) => {
        if (item.type === 'spacer') return true;
        if (item.type === 'header') return false;
        if (!searchquery) return true;
        return item.label && item.label.toLowerCase().includes(searchquery.toLowerCase());
    });

    const SettingsSection = ({ children, title }: { children: React.ReactNode, title?: string }) => (
        <div className="mb-6">
            {title && <h3 className="text-[13px] text-gray-500 mb-2 px-3 uppercase tracking-wide font-medium">{title}</h3>}
            <div className="bg-white dark:bg-[#2d2d2d] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
                {children}
            </div>
        </div>
    );

    const SettingsRow = ({ label, value, onclick, icon, istoggle, togglevalue, ontoggle }: any) => (
        <div
            className={`flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 last:border-0 ${onclick ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors' : ''}`}
            onClick={onclick}
        >
            <div className="flex items-center gap-3">
                {icon && <div className="text-xl">{icon}</div>}
                <span className="text-[13px] font-medium text-black dark:text-white">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-[13px] text-gray-500">{value}</span>}
                {istoggle && (
                    <input
                        type="checkbox"
                        checked={togglevalue}
                        onChange={(e) => ontoggle && ontoggle(e.target.checked)}
                        className="toggle"
                    />
                )}
                {onclick && <IoChevronForward className="text-gray-400" />}
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="flex h-full w-full  font-sf text-[13px] text-black dark:text-white overflow-hidden relative">

            <div className={`
                ${isnarrow ? 'absolute inset-y-0 left-0 z-30 w-full transition-transform duration-300 dark:bg-neutral-900 bg-white' : 'relative w-[240px] shrink-0 bg-transparent'}
                ${isnarrow && !showsidebar ? '-translate-x-full pointer-events-none' : 'translate-x-0'}
                border-r border-black/5 dark:border-white/5 flex flex-col
                [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full
           ${ismobile ? '' : 'pt-[36px]'} `}>
                <div className="px-3 mb-2 mt-4 shrink-0">
                    <div className="relative">
                        <IoSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="Search"
                            value={searchquery}
                            onChange={(e) => setsearchquery(e.target.value)}
                            className="w-full bg-black/5 dark:bg-white/10 rounded-md pl-8 pr-3 py-1.5 text-[13px] outline-none placeholder-gray-500 dark:placeholder-gray-400 text-black dark:text-white border border-transparent focus:border-black/10 dark:focus:border-white/10 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div
                        className="mx-1 mb-4 flex items-center gap-3 p-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => {
                            addwindow({
                                id: `mail-${Date.now()}`,
                                appname: 'Mail',
                                title: 'Mail',
                                component: 'Mail',
                                icon: '/mail.png',
                                isminimized: false,
                                ismaximized: false,
                                position: { top: 100, left: 100 },
                                size: { width: 900, height: 600 },
                                props: {}
                            });
                        }}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                            <Image src="/pfp.png" alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="font-semibold text-[13px] leading-tight truncate">{portfoliodata.personal.name}</span>
                            <span className="text-[11px] text-gray-500 truncate">{portfoliodata.personal.username}</span>
                        </div>
                    </div>

                    {filtereditems.map((item: any, index: number) => {
                        if (item.type === 'spacer') {
                            return <div key={`spacer-${index}`} className="my-1" />;
                        }
                        if (item.type === 'header') return null;

                        return (
                            <div key={item.id || index}>
                                <div
                                    onClick={() => {
                                        setactivetab(item.id);
                                        if (isnarrow) setshowsidebar(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-1.5 mx-1 rounded-md cursor-pointer transition-colors
                                                ${activetab === item.id
                                            ? 'bg-[#007AFF] text-white'
                                            : 'hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[12px] shadow-sm`}
                                        style={{ backgroundColor: item.color }}>
                                        {item.icon && <item.icon />}
                                    </div>
                                    <span className="text-[13px] font-medium leading-none">{item.label}</span>
                                    {activetab === item.id && !isnarrow && <IoChevronForward className="ml-auto text-white/50" />}
                                    {isnarrow && <IoChevronForward className="ml-auto text-gray-400" />}
                                </div>
                            </div>
                        );
                    })}
                    {filtereditems.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col bg-[#f5f5f7] dark:bg-[#1e1e1e] w-full min-w-0 h-full relative`}>
                {isnarrow && (
                    <div className="h-[44px] shrink-0 border-b border-black/10 dark:border-white/10 flex items-center px-2 bg-[#f5f5f7]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-20 transition-all">
                        <button
                            onClick={() => setshowsidebar(true)}
                            className="flex items-center gap-1 text-[#007AFF] font-medium text-[13px] px-2 py-1 rounded hover:bg-black/5 active:bg-black/10 transition-colors"
                        >
                            <IoChevronForward className="rotate-180 text-xl" />
                            <span>Settings</span>
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[15px]">
                            {sidebaritems.find((i: any) => i.id === activetab)?.label || 'Settings'}
                        </span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-2xl mx-auto">

                        {activetab === 'general' && (
                            <>
                                <div className="flex flex-col items-center mb-8 pt-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl mb-4" />
                                    <h1 className="text-2xl font-bold">MacOS-Next</h1>
                                    <p className="text-[13px] text-gray-500 dark:text-gray-400">Made By BalaTBR</p>
                                </div>


                                <SettingsSection title="System">
                                    <SettingsRow label="About" value="MacOS-Next 1.0" onclick={() => { }} />
                                    <SettingsRow label="Software Update" value="Up to date" onclick={() => { }} />
                                    <SettingsRow label="Storage" value="256 GB" onclick={() => { }} />
                                </SettingsSection>

                                <SettingsSection title="Hardware">
                                    {specs.map((s, i) => (
                                        <SettingsRow key={i} label={s.label} value={s.value} />
                                    ))}
                                </SettingsSection>

                                <SettingsSection>
                                    <SettingsRow label="Reset Notification History" onclick={() => {
                                        localStorage.removeItem('clearedNotifications');
                                        alert('Signatures cleared. Refreshing...');
                                        window.location.reload();
                                    }}
                                        icon={<IoSettingsOutline className="text-gray-500" />}
                                    />
                                </SettingsSection>
                            </>
                        )}

                        {activetab === 'appearance' && (
                            <>
                                <div className="space-y-6">
                                    <h2 className="text-[24px] font-bold mb-6 hidden md:block">Appearance</h2>

                                    <SettingsSection>
                                        <div className="p-4 flex justify-center gap-8">
                                            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => theme !== 'light' && toggletheme()}>
                                                <div className={`w-24 h-16 rounded-xl border-2 flex overflow-hidden shadow-sm transition-all ${theme === 'light' ? 'border-[#007AFF]' : 'border-transparent'}`}>
                                                    <div className="w-1/3 bg-gray-200" />
                                                    <div className="w-2/3 bg-white" />
                                                </div>
                                                <span className="text-[12px] font-medium">Light</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => theme !== 'dark' && toggletheme()}>
                                                <div className={`w-24 h-16 rounded-xl border-2 flex overflow-hidden shadow-sm transition-all ${theme === 'dark' ? 'border-[#007AFF]' : 'border-transparent'}`}>
                                                    <div className="w-1/3 bg-gray-700" />
                                                    <div className="w-2/3 bg-gray-900" />
                                                </div>
                                                <span className="text-[12px] font-medium">Dark</span>
                                            </div>
                                        </div>
                                    </SettingsSection>

                                    <SettingsSection title="Accent Color">
                                        <div className="p-4 flex flex-wrap gap-4 items-center">
                                            {accentcolors.map(color => (
                                                <div
                                                    key={color}
                                                    className={`w-6 h-6 rounded-full cursor-pointer shadow-sm transition-transform hover:scale-110 ${color === '#007AFF' ? 'ring-2 ring-offset-2 ring-[#007AFF] dark:ring-offset-[#1e1e1e]' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <span className="text-gray-400 text-[12px] ml-auto">Blue</span>
                                        </div>
                                    </SettingsSection>

                                    <SettingsSection title="Accessibility">
                                        <SettingsRow
                                            label="Reduce Transparency"
                                            istoggle
                                            togglevalue={reducetransparency}
                                            ontoggle={setreducetransparency}
                                        />
                                        <SettingsRow
                                            label="Reduce Motion"
                                            istoggle
                                            togglevalue={reducemotion}
                                            ontoggle={setreducemotion}
                                        />
                                    </SettingsSection>
                                </div>
                            </>
                        )}

                        {activetab !== 'general' && activetab !== 'appearance' && (
                            <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-6 flex items-center justify-center text-4xl shadow-sm">
                                    {(() => {
                                        const item = sidebaritems.find((i: any) => i.id === activetab);
                                        if (item && item.icon) {
                                            const Icon = item.icon;
                                            return <Icon />;
                                        }
                                        return <IoSettingsOutline />;
                                    })()}
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{sidebaritems.find((i: any) => i.id === activetab)?.label}</h2>
                                <p className="text-sm">This setting is not available in the preview.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
