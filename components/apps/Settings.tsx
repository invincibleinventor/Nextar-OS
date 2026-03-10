'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { IoChevronForward, IoChevronBack, IoColorPaletteOutline, IoNotificationsOutline, IoSettingsOutline, IoWifi, IoBluetooth, IoGlobeOutline, IoMoon, IoAccessibilityOutline, IoSearch, IoImageOutline, IoVolumeHigh, IoCheckmark, IoRefresh, IoServerOutline, IoCloudOutline, IoKeypadOutline, IoHandLeftOutline, IoLanguageOutline, IoTimeOutline, IoBatteryChargingOutline, IoAppsOutline, IoPrintOutline, IoDesktopOutline, IoRocketOutline, IoFlashOutline } from 'react-icons/io5';
import { useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useAuth } from '../AuthContext';
import { personal, openSystemItem } from '../data';
import { motion, AnimatePresence } from 'framer-motion'
import UserManagement from './Settings/UserManagement';
import { IoPeopleOutline } from 'react-icons/io5';
import { iselectron, wifi as wifiapi, bluetooth as bluetoothapi, audio as audioapi, keyboard as keyboardapi, mouse as mouseapi, locale as localeapi, datetime as datetimeapi, defaultapps as defaultappsapi, printers as printersapi } from '@/utils/platform';
import { useCheerpXSafe } from '../CheerpXContext';
import { useNotifications } from '../NotificationContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, glassSidebar, glassInput, clayClasses } from '../hooks/useClayStyles';

const sidebaritems = [
    { id: 'wifi', label: 'Wi-Fi', icon: IoWifi, color: 'var(--pastel-blue)' },
    { id: 'bluetooth', label: 'Bluetooth', icon: IoBluetooth, color: 'var(--pastel-blue)' },
    { id: 'network', label: 'Network', icon: IoGlobeOutline, color: 'var(--pastel-blue)' },
    { type: 'spacer' },
    { id: 'notifications', label: 'Notifications', icon: IoNotificationsOutline, color: 'var(--pastel-red)' },
    { id: 'sound', label: 'Sound', icon: IoVolumeHigh, color: 'var(--pastel-pink)' },
    { id: 'focus', label: 'Focus', icon: IoMoon, color: 'var(--pastel-mauve)' },
    { type: 'spacer' },
    { id: 'general', label: 'General', icon: IoSettingsOutline, color: 'var(--text-muted)' },
    { id: 'appearance', label: 'Appearance', icon: IoColorPaletteOutline, color: 'var(--pastel-peach)' },
    { id: 'accessibility', label: 'Accessibility', icon: IoAccessibilityOutline, color: 'var(--pastel-teal)' },
    { type: 'spacer' },
    { id: 'displays', label: 'Displays', icon: IoDesktopOutline, color: 'var(--pastel-blue)' },
    { id: 'keyboard', label: 'Keyboard', icon: IoKeypadOutline, color: 'var(--pastel-yellow)' },
    { id: 'mouse', label: 'Mouse & Touchpad', icon: IoHandLeftOutline, color: 'var(--pastel-peach)' },
    { type: 'spacer' },
    { id: 'language', label: 'Language & Region', icon: IoLanguageOutline, color: 'var(--pastel-mauve)' },
    { id: 'datetime', label: 'Date & Time', icon: IoTimeOutline, color: 'var(--pastel-teal)' },
    { id: 'power', label: 'Power', icon: IoBatteryChargingOutline, color: 'var(--pastel-green)' },
    { type: 'spacer' },
    { id: 'defaultapps', label: 'Default Apps', icon: IoAppsOutline, color: 'var(--pastel-pink)' },
    { id: 'startup', label: 'Startup Apps', icon: IoRocketOutline, color: 'var(--pastel-peach)' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: IoFlashOutline, color: 'var(--pastel-yellow)' },
    { id: 'printers', label: 'Printers', icon: IoPrintOutline, color: 'var(--text-muted)' },
    { id: 'storage', label: 'Storage', icon: IoServerOutline, color: 'var(--pastel-green)' },
];

export default function Settings({ initialPage, windowId }: { initialPage?: string, windowId?: string }) {
    const [activetab, setactivetab] = useState(initialPage || "general");
    const [showsidebar, setshowsidebar] = useState(true);
    const { reducemotion, setreducemotion, reducetransparency, setreducetransparency, soundeffects, setsoundeffects, wallpaperurl, setwallpaperurl, accentcolor, setaccentcolor, inverselabelcolor, setinverselabelcolor, icontintmode, seticontintmode, iconpack, seticonpack, accentmode, setaccentmode, wallpaperdominantcolor } = useSettings();
    const { theme, toggletheme } = useTheme();
    const { activewindow } = useWindows();
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const containerref = useRef<HTMLDivElement>(null);
    const [isnarrow, setisnarrow] = useState(false);
    const cheerpx = useCheerpXSafe();
    const clay = useIsClay();
    const { dnd, setdnd, showpreviews, setshowpreviews, showonlockscreen, setshowonlockscreen } = useNotifications();
    const [storageInfo, setStorageInfo] = useState<{ projectCount: number; cxCacheSize: string } | null>(null);
    const [clearingCache, setClearingCache] = useState(false);

    const [wifienabled, setwifienabled] = useState(false);
    const [wificonnected, setwificonnected] = useState(false);
    const [wifissid, setwifissid] = useState<string | null>(null);
    const [wifinetworks, setwifinetworks] = useState<any[]>([]);
    const [wifiloading, setwifiloading] = useState(false);

    const [btenabled, setbtenabled] = useState(false);
    const [btdevices, setbtdevices] = useState<any[]>([]);
    const [btloading, setbtloading] = useState(false);

    const [volume, setvolume] = useState(50);
    const [muted, setmuted] = useState(false);


    const [kbLayout, setKbLayout] = useState('');
    const [kbLayouts, setKbLayouts] = useState<string[]>([]);
    const [kbRepeatDelay, setKbRepeatDelay] = useState(500);
    const [kbRepeatInterval, setKbRepeatInterval] = useState(30);

    const [mouseSpeed, setMouseSpeed] = useState(0);
    const [naturalScroll, setNaturalScroll] = useState(false);

    const [currentLocale, setCurrentLocale] = useState('');
    const [availableLocales, setAvailableLocales] = useState<string[]>([]);

    const [dtTimezone, setDtTimezone] = useState('');
    const [dtNtp, setDtNtp] = useState(true);
    const [dtLocalTime, setDtLocalTime] = useState('');
    const [dtTimezones, setDtTimezones] = useState<string[]>([]);

    const [defaultBrowser, setDefaultBrowser] = useState('');

    const [printerList, setPrinterList] = useState<any[]>([]);
    const [defaultPrinter, setDefaultPrinter] = useState('');

    const fetchwifistatus = useCallback(async () => {
        if (!iselectron) return;
        const status = await wifiapi.getstatus();
        setwifienabled(status.enabled || false);
        setwificonnected(status.connected || false);
        setwifissid(status.ssid || null);
    }, []);

    const fetchwifinetworks = useCallback(async () => {
        if (!iselectron) return;
        setwifiloading(true);
        const result = await wifiapi.getnetworks();
        if (result.success && result.networks) {
            setwifinetworks(result.networks);
        }
        setwifiloading(false);
    }, []);

    const fetchbtstatus = useCallback(async () => {
        if (!iselectron) return;
        const status = await bluetoothapi.getstatus();
        setbtenabled(status.enabled || false);
    }, []);

    const fetchbtdevices = useCallback(async () => {
        if (!iselectron) return;
        setbtloading(true);
        const result = await bluetoothapi.getdevices();
        if (result.success && result.devices) {
            setbtdevices(result.devices);
        }
        setbtloading(false);
    }, []);

    const fetchaudiostatus = useCallback(async () => {
        if (!iselectron) return;
        const status = await audioapi.getvolume();
        setvolume(status.volume || 50);
        setmuted(status.muted || false);
    }, []);

    const fetchkeyboard = useCallback(async () => {
        if (!iselectron) return;
        const layout = await keyboardapi.getlayout();
        if (layout.success) setKbLayout(layout.layout || '');
        const layouts = await keyboardapi.getlayouts();
        if (layouts.success) setKbLayouts(layouts.layouts || []);
        const repeat = await keyboardapi.getrepeatrate();
        if (repeat.success) { setKbRepeatDelay(repeat.delay || 500); setKbRepeatInterval(repeat.interval || 30); }
    }, []);

    const fetchmouse = useCallback(async () => {
        if (!iselectron) return;
        const speed = await mouseapi.getspeed();
        if (speed.success) setMouseSpeed(speed.speed || 0);
        const ns = await mouseapi.getnaturalscroll();
        if (ns.success) setNaturalScroll(ns.enabled || false);
    }, []);

    const fetchlocale = useCallback(async () => {
        if (!iselectron) return;
        const loc = await localeapi.getlocale();
        if (loc.success) setCurrentLocale(loc.locale || '');
        const locs = await localeapi.getlocales();
        if (locs.success) setAvailableLocales(locs.locales || []);
    }, []);

    const fetchdatetime = useCallback(async () => {
        if (!iselectron) return;
        const status = await datetimeapi.getstatus();
        if (status.success) {
            setDtTimezone(status.timezone || '');
            setDtNtp(status.ntp ?? true);
            setDtLocalTime(status.localtime || '');
        }
        const tzs = await datetimeapi.gettimezones();
        if (tzs.success) setDtTimezones(tzs.timezones || []);
    }, []);

    const fetchdefaultapps = useCallback(async () => {
        if (!iselectron) return;
        const browser = await defaultappsapi.getbrowser();
        if (browser.success) setDefaultBrowser(browser.browser || '');
    }, []);

    const fetchprinters = useCallback(async () => {
        if (!iselectron) return;
        const result = await printersapi.getprinters();
        if (result.success) setPrinterList(result.printers || []);
        const def = await printersapi.getdefault();
        if (def.success) setDefaultPrinter(def.printer || '');
    }, []);

    useEffect(() => {
        if (activetab === 'wifi') {
            fetchwifistatus();
            fetchwifinetworks();
        } else if (activetab === 'bluetooth') {
            fetchbtstatus();
            fetchbtdevices();
        } else if (activetab === 'sound') {
            fetchaudiostatus();
        } else if (activetab === 'keyboard') {
            fetchkeyboard();
        } else if (activetab === 'mouse') {
            fetchmouse();
        } else if (activetab === 'language') {
            fetchlocale();
        } else if (activetab === 'datetime') {
            fetchdatetime();
        } else if (activetab === 'defaultapps') {
            fetchdefaultapps();
        } else if (activetab === 'printers') {
            fetchprinters();
        } else if (activetab === 'storage') {
            (async () => {
                try {
                    const { getAllProjects } = await import('../../utils/projectDB');
                    const projects = await getAllProjects();
                    let cxSize = 'Not cached';
                    try {
                        const estimate = await navigator.storage?.estimate();
                        if (estimate?.usage) {
                            const mb = (estimate.usage / (1024 * 1024)).toFixed(1);
                            cxSize = `~${mb} MB total`;
                        }
                    } catch {
                    }
                    setStorageInfo({ projectCount: projects.length, cxCacheSize: cxSize });
                } catch {
                    setStorageInfo({ projectCount: 0, cxCacheSize: 'Unknown' });
                }
            })();
        }
    }, [activetab, fetchwifistatus, fetchwifinetworks, fetchbtstatus, fetchbtdevices, fetchaudiostatus, fetchkeyboard, fetchmouse, fetchlocale, fetchdatetime, fetchdefaultapps, fetchprinters]);

    useEffect(() => {
        if (!containerref.current) return;
        let prevNarrow: boolean | null = null;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width;
            const narrow = width < 600;
            if (narrow !== prevNarrow) {
                prevNarrow = narrow;
                setisnarrow(narrow);
                if (!narrow) setshowsidebar(true);
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!windowId || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (!showsidebar) {
                e.preventDefault();
                setshowsidebar(true);
            }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, ismobile, activewindow, showsidebar]);

    const Toggle = ({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!value)}
            className={`w-[51px] h-[31px] p-[2px] transition-colors ${clay ? 'rounded-full' : ''} ${value ? 'bg-pastel-green' : clay ? '' : 'bg-[--border-color]'}`}
            style={clay ? (value
                ? { boxShadow: '0 0 8px color-mix(in srgb, var(--pastel-green) 40%, transparent)' }
                : { boxShadow: 'var(--shadow-inset)', background: 'var(--bg-glass-active)' }
            ) : undefined}
        >
            <div className={`w-[27px] h-[27px] bg-[--bg-base] transition-transform ${clay ? 'rounded-full' : ''} ${value ? 'translate-x-5' : 'translate-x-0'}`}
                style={clay ? { boxShadow: 'var(--shadow-xs)' } : undefined}
            />
        </button>
    );

    const WALLPAPERS = ['/bg.jpg', '/bg-dark.jpg', '/wallpaper-1.jpg', '/wallpaper-2.jpg', '/wallpaper-3.jpg', '/wallpaper-4.jpg'];
    const WallpaperGrid = React.memo(function WallpaperGrid({ wallpaperurl, setwallpaperurl, clay }: { wallpaperurl: string; setwallpaperurl: (v: string) => void; clay: boolean }) {
        return (
            <div className="p-4 grid grid-cols-3 gap-3">
                {WALLPAPERS.map((wp) => (
                    <button
                        key={wp}
                        onClick={() => setwallpaperurl(wp)}
                        className={`aspect-video bg-cover bg-center border-2 transition-all ${clay ? 'rounded-[10px]' : ''} ${wallpaperurl === wp ? 'border-accent ring-2' : 'border-[--border-color] hover:border-[--text-muted]'}`}
                        style={{ backgroundImage: `url('${wp}')`, ...(wallpaperurl === wp && clay ? { boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 30%, transparent)' } : {}) }}
                    />
                ))}
            </div>
        );
    });

    const WallpaperUrlInput = React.memo(function WallpaperUrlInput({ wallpaperurl, setwallpaperurl, clay }: { wallpaperurl: string; setwallpaperurl: (v: string) => void; clay: boolean }) {
        const [val, setVal] = useState(wallpaperurl);
        useEffect(() => { setVal(wallpaperurl); }, [wallpaperurl]);
        return (
            <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={() => { if (val !== wallpaperurl) setwallpaperurl(val); }}
                onKeyDown={(e) => { if (e.key === 'Enter') setwallpaperurl(val); }}
                placeholder="Custom wallpaper URL..."
                className={`w-full px-3 py-2 bg-overlay outline-none text-[13px] text-[--text-color] border border-[--border-color] focus:border-accent ${clay ? 'rounded-[8px] border-[--glass-border] bg-[--bg-glass-active] focus:border-accent' : ''}`}
            />
        );
    });

    const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
        <div className={`overflow-hidden mb-6 ${clay ? `${clayClasses.card}` : 'bg-overlay border border-[--border-color]'}`}
            style={clay ? glassCard : undefined}
        >
            {children}
        </div>
    );

    const SettingsRow = ({ label, value, onClick, toggle, toggleValue, onToggle, last }: any) => (
        <div
            className={`flex items-center justify-between px-4 ${ismobile ? 'py-3.5' : clay ? 'py-3' : 'py-2.5'} ${!last ? clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]' : ''} ${onClick ? clay ? 'active:bg-[--bg-glass-hover] active:scale-[0.99] transition-all' : 'active:bg-overlay' : ''}`}
            onClick={onClick}
        >
            <span className={`text-[--text-color] ${ismobile ? 'text-[16px]' : 'text-[13px] font-medium'}`}>{label}</span>
            <div className="flex items-center gap-2">
                {value && <span className={`${ismobile ? 'text-[16px]' : 'text-[13px]'} text-[--text-muted]`}>{value}</span>}
                {toggle && <Toggle value={toggleValue} onChange={onToggle} />}
                {onClick && <IoChevronForward className="text-[--text-muted]" size={ismobile ? 20 : 14} />}
            </div>
        </div>
    );

    const ContentView = () => (
        <div className={`flex-1 h-full overflow-y-auto bg-[--bg-base] ${ismobile ? '' : 'p-0 md:p-8 md:pt-10'}`}>
            <div className={`max-w-[640px] mx-auto ${ismobile ? '' : 'md:px-4'}`}>
                {!ismobile && (
                    <div className={`flex items-center gap-3 mb-5 px-4 md:px-0 ${clay ? 'pb-4' : ''}`}
                        style={clay ? { borderBottom: '1px solid var(--glass-border)' } : undefined}
                    >
                        <div className={`w-7 h-7 flex items-center justify-center text-[--bg-base] ${clay ? 'rounded-[6px]' : ''}`} style={{ backgroundColor: sidebaritems.find(i => i.id === activetab)?.color || '#6e738d' }}>
                            {(() => {
                                const item = sidebaritems.find(i => i.id === activetab);
                                if (item && 'icon' in item && item.icon) {
                                    const Icon = item.icon;
                                    return <Icon size={16} />;
                                }
                                return <IoSettingsOutline size={16} />;
                            })()}
                        </div>
                        <h1 className="text-[20px] font-bold text-[--text-color]">{sidebaritems.find(i => i.id === activetab)?.label || 'Settings'}</h1>
                    </div>
                )}

                <div className={`${ismobile ? 'p-4' : ''}`}>
                    {activetab === 'general' && (
                        <>
                            <div className={`flex flex-col items-center mb-6 p-5 ${clay ? `${clayClasses.card}` : 'bg-overlay border border-[--border-color]'}`}
                                style={clay ? glassCard : undefined}
                            >
                                <div className={`w-14 h-14 bg-accent mb-3 flex items-center justify-center text-[--bg-base] ${clay ? 'rounded-[12px]' : ''}`}>
                                    <IoSettingsOutline size={28} />
                                </div>
                                <h2 className="text-lg font-bold text-[--text-color]">NextarOS</h2>
                                <p className="text-[12px] text-[--text-muted] mt-0.5">Version 14.5 (23A5212a)</p>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3">About</div>
                                <SettingsGroup>
                                    <SettingsRow label="Name" value="NextarOS" onClick={() => { }} />
                                    <SettingsRow label="Software Update" value="Up to date" onClick={() => { }} />
                                    <SettingsRow label="Storage" value="256 GB" onClick={() => { }} last />
                                </SettingsGroup>

                                {user?.role === 'admin' && (
                                    <>
                                        <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3">Snapshots (Admin)</div>
                                        <SettingsGroup>
                                            <SettingsRow
                                                label="Create Snapshot"
                                                onClick={async () => {
                                                    try {
                                                        const { getAllFiles, getUsers } = await import('../../utils/db');
                                                        const files = await getAllFiles();
                                                        const users = await getUsers();
                                                        const data = {
                                                            files,
                                                            users,
                                                            settings: {
                                                                theme: localStorage.getItem('theme'),
                                                                reduceMotion: localStorage.getItem('reduceMotion'),
                                                                reduceTransparency: localStorage.getItem('reduceTransparency'),
                                                                soundEffects: localStorage.getItem('soundEffects'),
                                                                wallpaperUrl: localStorage.getItem('wallpaperUrl'),
                                                                accentColor: localStorage.getItem('accentColor'),
                                                            },
                                                            timestamp: new Date().toISOString()
                                                        };
                                                        const snapshots = JSON.parse(localStorage.getItem('nextaros-snapshots') || '[]');
                                                        snapshots.push(data);
                                                        localStorage.setItem('nextaros-snapshots', JSON.stringify(snapshots));
                                                        alert(`Snapshot created! ${files.length} files, ${users.length} users saved.`);
                                                    } catch (e) {
                                                        alert('Error creating snapshot: ' + e);
                                                    }
                                                }}
                                            />
                                            <SettingsRow
                                                label="Restore Last Snapshot"
                                                onClick={async () => {
                                                    const snapshots = JSON.parse(localStorage.getItem('nextaros-snapshots') || '[]');
                                                    if (snapshots.length === 0) {
                                                        alert('No snapshots available');
                                                        return;
                                                    }
                                                    if (confirm('Restore last snapshot? This will overwrite ALL current data.')) {
                                                        try {
                                                            const { resetDB, initDB, saveAllFiles, createUser } = await import('../../utils/db');
                                                            const last = snapshots[snapshots.length - 1];

                                                            await resetDB();
                                                            await new Promise(r => setTimeout(r, 100));
                                                            await initDB();

                                                            if (last.files?.length > 0) {
                                                                await saveAllFiles(last.files);
                                                            }

                                                            if (last.users?.length > 0) {
                                                                for (const u of last.users) {
                                                                    try { await createUser(u); } catch { }
                                                                }
                                                            }

                                                            if (last.settings) {
                                                                Object.entries(last.settings).forEach(([key, value]) => {
                                                                    if (value !== null) localStorage.setItem(key, value as string);
                                                                });
                                                            }

                                                            alert('Snapshot restored! Reloading...');
                                                            window.location.reload();
                                                        } catch (e) {
                                                            alert('Error restoring: ' + e);
                                                        }
                                                    }
                                                }}
                                            />
                                            <SettingsRow
                                                label="Export Snapshot"
                                                onClick={async () => {
                                                    try {
                                                        const { getAllFiles, getUsers } = await import('../../utils/db');
                                                        const files = await getAllFiles();
                                                        const users = await getUsers();
                                                        const data = {
                                                            files,
                                                            users,
                                                            settings: {
                                                                theme: localStorage.getItem('theme'),
                                                                reduceMotion: localStorage.getItem('reduceMotion'),
                                                                reduceTransparency: localStorage.getItem('reduceTransparency'),
                                                                soundEffects: localStorage.getItem('soundEffects'),
                                                                wallpaperUrl: localStorage.getItem('wallpaperUrl'),
                                                                accentColor: localStorage.getItem('accentColor'),
                                                            },
                                                            timestamp: new Date().toISOString()
                                                        };
                                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `nextaros-snapshot-${new Date().toISOString().split('T')[0]}.json`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    } catch (e) {
                                                        alert('Error exporting: ' + e);
                                                    }
                                                }}
                                            />
                                            <SettingsRow
                                                label="Import from File"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = '.json';
                                                    input.onchange = async (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (!file) return;

                                                        try {
                                                            const text = await file.text();
                                                            const data = JSON.parse(text);

                                                            if (!data.files || !Array.isArray(data.files)) {
                                                                alert('Invalid snapshot file');
                                                                return;
                                                            }

                                                            if (confirm(`Import snapshot?\n\nFiles: ${data.files.length}\nUsers: ${data.users?.length || 0}\n\nThis will REPLACE all current data.`)) {
                                                                const { resetDB, initDB, saveAllFiles, createUser } = await import('../../utils/db');

                                                                await resetDB();
                                                                await new Promise(r => setTimeout(r, 100));
                                                                await initDB();

                                                                if (data.files.length > 0) {
                                                                    await saveAllFiles(data.files);
                                                                }

                                                                if (data.users?.length > 0) {
                                                                    for (const u of data.users) {
                                                                        try { await createUser(u); } catch { }
                                                                    }
                                                                }

                                                                if (data.settings) {
                                                                    Object.entries(data.settings).forEach(([key, value]) => {
                                                                        if (value !== null) localStorage.setItem(key, value as string);
                                                                    });
                                                                }

                                                                alert('Snapshot imported! Reloading...');
                                                                window.location.reload();
                                                            }
                                                        } catch (err) {
                                                            alert('Error reading file: ' + err);
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                            />
                                            <SettingsRow
                                                label="View Snapshots"
                                                onClick={() => {
                                                    const snapshots = JSON.parse(localStorage.getItem('nextaros-snapshots') || '[]');
                                                    const snapshotDetails = snapshots.map((s: any, i: number) =>
                                                        `${i + 1}. ${new Date(s.timestamp).toLocaleString()}\n   Files: ${s.files?.length || 0}, Users: ${s.users?.length || 0}`
                                                    ).join('\n\n');
                                                    alert(snapshots.length === 0
                                                        ? 'No snapshots saved'
                                                        : `${snapshots.length} snapshot(s):\n\n${snapshotDetails}`);
                                                }}
                                            />
                                            <SettingsRow
                                                label="Clear All Snapshots"
                                                onClick={() => {
                                                    if (confirm('Delete all snapshots?')) {
                                                        localStorage.removeItem('nextaros-snapshots');
                                                        alert('All snapshots deleted');
                                                    }
                                                }}
                                                last
                                            />
                                        </SettingsGroup>
                                    </>
                                )}

                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3">Reset</div>
                                <SettingsGroup>
                                    <SettingsRow label="Reset Notifications" onClick={() => { localStorage.removeItem('clearedNotifications'); window.location.reload(); }} />
                                    <SettingsRow
                                        label="Reset System"
                                        onClick={async () => {
                                            if (confirm('This will delete ALL data including files, users, and settings. Are you sure?')) {
                                                if (confirm('This cannot be undone. Proceed with reset?')) {
                                                    const { resetDB } = await import('../../utils/db');
                                                    await resetDB();
                                                    localStorage.clear();
                                                    sessionStorage.clear();
                                                    window.location.reload();
                                                }
                                            }
                                        }}
                                        last
                                    />
                                </SettingsGroup>
                            </div>
                        </>
                    )}

                    {activetab === 'appearance' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Wallpaper</div>
                            <SettingsGroup>
                                <WallpaperGrid wallpaperurl={wallpaperurl} setwallpaperurl={setwallpaperurl} clay={clay} />
                                <div className="px-4 pb-3">
                                    <WallpaperUrlInput wallpaperurl={wallpaperurl} setwallpaperurl={setwallpaperurl} clay={clay} />
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Accent Color</div>
                            <SettingsGroup>
                                <div className="p-4 flex gap-3 flex-wrap">
                                    {['#e78284', '#ef9f76', '#e5c890', '#a6d189', '#81c8be', '#8caaee', '#babbf1', '#f4b8e4', '#ca9ee6'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setaccentcolor(color)}
                                            className={`w-8 h-8 transition-all ${clay ? 'rounded-full' : ''} ${accentcolor === color ? 'ring-2 ring-offset-2 ring-[--text-muted] scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </SettingsGroup>

                            {clay && (
                                <>
                                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Accent Mode</div>
                                    <SettingsGroup>
                                        <div className="p-3 flex gap-2">
                                            {([
                                                { id: 'light', label: 'Light', desc: 'Lighter accent' },
                                                { id: 'dark', label: 'Dark', desc: 'Deeper accent' },
                                                { id: 'twilight', label: 'Twilight', desc: 'As chosen' },
                                                { id: 'adaptive', label: 'Adaptive', desc: 'From wallpaper' },
                                            ] as const).map((mode) => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => setaccentmode(mode.id)}
                                                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-[10px] transition-all text-center active:scale-[0.97] ${accentmode === mode.id ? 'text-white shadow-sm' : 'bg-[--bg-glass-active] text-[--text-color] hover:bg-[--bg-glass-hover]'}`}
                                                    style={accentmode === mode.id ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    <span className="text-[12px] font-semibold">{mode.label}</span>
                                                    <span className={`text-[10px] leading-tight ${accentmode === mode.id ? 'text-white/70' : 'text-[--text-muted]'}`}>{mode.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {accentmode === 'adaptive' && (
                                            <div className="px-4 py-2.5 flex items-center gap-3 border-t border-[--text-muted]/10">
                                                <span className="text-[13px] text-[--text-muted]">Detected color</span>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <div className="w-5 h-5 rounded-full border border-[--glass-border]" style={{ backgroundColor: wallpaperdominantcolor }} />
                                                    <span className="text-[12px] text-[--text-muted] font-mono">{wallpaperdominantcolor}</span>
                                                </div>
                                            </div>
                                        )}
                                    </SettingsGroup>
                                </>
                            )}

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Icon Pack</div>
                            <SettingsGroup>
                                <div className="p-3 flex gap-2">
                                    {([
                                        { id: 'phosphor' as const, label: 'Phosphor', desc: 'Minimal symbols' },
                                        { id: 'papirus' as const, label: 'Papirus', desc: 'Full-color icons' },
                                    ]).map((pack) => (
                                        <button
                                            key={pack.id}
                                            onClick={() => seticonpack(pack.id)}
                                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-[10px] transition-all text-center active:scale-[0.97] ${iconpack === pack.id ? 'text-white shadow-sm' : 'bg-[--bg-glass-active] text-[--text-color] hover:bg-[--bg-glass-hover]'}`}
                                            style={iconpack === pack.id ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                        >
                                            <span className="text-[12px] font-semibold">{pack.label}</span>
                                            <span className={`text-[10px] leading-tight ${iconpack === pack.id ? 'text-white/70' : 'text-[--text-muted]'}`}>{pack.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </SettingsGroup>

                            {clay && (
                                <>
                                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Icon Tint</div>
                                    <SettingsGroup>
                                        <div className="p-3 flex flex-wrap gap-2">
                                            {([
                                                { id: 'light' as const, label: 'Light', desc: 'Mono light' },
                                                { id: 'dark' as const, label: 'Dark', desc: 'Mono dark' },
                                                { id: 'twilight' as const, label: 'Twilight', desc: 'Follows theme' },
                                                { id: 'adaptive' as const, label: 'Adaptive', desc: 'From wallpaper' },
                                                { id: 'coloured-light' as const, label: 'Color Light', desc: 'Individual light' },
                                                { id: 'coloured-dark' as const, label: 'Color Dark', desc: 'Individual dark' },
                                            ]).map((mode) => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => seticontintmode(mode.id)}
                                                    className={`flex-1 min-w-[30%] flex flex-col items-center gap-1 py-2.5 px-2 rounded-[10px] transition-all text-center active:scale-[0.97] ${icontintmode === mode.id ? 'text-white shadow-sm' : 'bg-[--bg-glass-active] text-[--text-color] hover:bg-[--bg-glass-hover]'}`}
                                                    style={icontintmode === mode.id ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    <span className="text-[12px] font-semibold">{mode.label}</span>
                                                    <span className={`text-[10px] leading-tight ${icontintmode === mode.id ? 'text-white/70' : 'text-[--text-muted]'}`}>{mode.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {icontintmode === 'adaptive' && (
                                            <div className="px-4 py-2.5 flex items-center gap-3 border-t border-[--text-muted]/10">
                                                <span className="text-[13px] text-[--text-muted]">Detected color</span>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <div className="w-5 h-5 rounded-full border border-[--glass-border]" style={{ backgroundColor: wallpaperdominantcolor }} />
                                                    <span className="text-[12px] text-[--text-muted] font-mono">{wallpaperdominantcolor}</span>
                                                </div>
                                            </div>
                                        )}
                                    </SettingsGroup>
                                </>
                            )}

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Colors</div>
                            <SettingsGroup>
                                <div className="p-5 flex justify-center gap-8">
                                    <button onClick={() => theme !== 'light' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div
                                            className={`w-32 h-20 border flex overflow-hidden transition-all ${clay ? 'rounded-[10px]' : ''} ${theme === 'light' ? 'border-accent ring-2' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}
                                            style={theme === 'light' ? { boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent)' } : undefined}
                                        >
                                            <div className="w-1/3 bg-[#e6e9ef]" />
                                            <div className="w-2/3 bg-[#eff1f5] relative">
                                                <div className="absolute top-2 left-2 w-10 h-2" style={{ background: 'var(--accent-color)', opacity: 0.2 }} />
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-[#bcc0cc]"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'light' ? 'text-accent' : 'text-[--text-muted]'}`}>Light</span>
                                    </button>
                                    <button onClick={() => theme !== 'dark' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div
                                            className={`w-32 h-20 border flex overflow-hidden transition-all ${clay ? 'rounded-[10px]' : ''} ${theme === 'dark' ? 'border-accent ring-2' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}
                                            style={theme === 'dark' ? { boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent)' } : undefined}
                                        >
                                            <div className="w-1/3 bg-[#1e2030]" />
                                            <div className="w-2/3 bg-[#161822] relative">
                                                <div className="absolute top-2 left-2 w-10 h-2" style={{ background: 'var(--accent-color)', opacity: 0.5 }} />
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-[#363a4f]"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-accent' : 'text-[--text-muted]'}`}>Dark</span>
                                    </button>
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">UI Style</div>
                            <SettingsGroup>
                                <div className="p-5 flex justify-center gap-8">
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('nextaros-ui-style', 'neo');
                                            document.documentElement.classList.add('clay');
                                            window.location.reload();
                                        }}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`w-32 h-20 border flex items-center justify-center transition-all overflow-hidden ${clay ? 'border-accent ring-2' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}
                                            style={{ borderRadius: 12, background: 'linear-gradient(145deg, #F2F1F3 0%, #E0DFE1 100%)', ...(clay ? { boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent)' } : {}) }}
                                        >
                                            <div className="w-14 h-8 rounded-[8px]" style={{ background: 'linear-gradient(145deg, #F8F7F9 0%, #E4E3E5 100%)', boxShadow: '2px 2px 5px rgba(160,160,170,0.3), -2px -2px 5px rgba(255,255,255,0.65)' }} />
                                        </div>
                                        <span className={`text-[12px] font-medium ${clay ? 'text-accent' : 'text-[--text-muted]'}`}>Neo-Glass</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('nextaros-ui-style', 'classic');
                                            document.documentElement.classList.remove('clay');
                                            window.location.reload();
                                        }}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`w-32 h-20 border flex items-center justify-center transition-all overflow-hidden ${clay ? 'rounded-[10px]' : ''} ${!clay ? 'border-accent ring-2' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}
                                            style={{ background: 'var(--bg-surface)', ...(!clay ? { boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent)' } : {}) }}
                                        >
                                            <div className="w-14 h-8 border border-[--border-color]" style={{ background: 'var(--bg-overlay)' }} />
                                        </div>
                                        <span className={`text-[12px] font-medium ${!clay ? 'text-accent' : 'text-[--text-muted]'}`}>Classic</span>
                                    </button>
                                </div>
                                <div className="px-4 pb-3">
                                    <p className="text-[10px] text-[--text-muted] text-center">Switching style will reload the page</p>
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Accessibility</div>
                            <SettingsGroup>
                                <SettingsRow label="Reduce Transparency" toggle toggleValue={reducetransparency} onToggle={setreducetransparency} />
                                <SettingsRow label="Reduce Motion" toggle toggleValue={reducemotion} onToggle={setreducemotion} />
                                <SettingsRow label="Sound Effects" toggle toggleValue={soundeffects} onToggle={setsoundeffects} />
                                <SettingsRow label="Adapt Wallpaper Colors" toggle toggleValue={inverselabelcolor} onToggle={setinverselabelcolor} last />
                            </SettingsGroup>
                        </>
                    )}

                    {activetab === 'users' && (

                        <div className={`h-full -m-8 md:-m-0 overflow-hidden ${clay ? 'border border-[--glass-border] rounded-[16px]' : 'border border-[--border-color]'}`}>
                            <UserManagement />
                        </div>
                    )}


                    {activetab === 'wifi' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Wi-Fi</div>
                            <SettingsGroup>
                                <SettingsRow
                                    label="Wi-Fi"
                                    toggle
                                    toggleValue={wifienabled}
                                    onToggle={async (v: boolean) => {
                                        setwifienabled(v);
                                        if (iselectron) await wifiapi.setenabled(v);
                                    }}
                                />
                                {wificonnected && wifissid && (
                                    <SettingsRow label="Connected to" value={wifissid} last />
                                )}
                            </SettingsGroup>

                            {wifienabled && (
                                <>
                                    <div className="flex items-center justify-between text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">
                                        <span>Available Networks</span>
                                        <button onClick={fetchwifinetworks} className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                            <IoRefresh className={wifiloading ? 'animate-spin' : ''} size={14} />
                                        </button>
                                    </div>
                                    <SettingsGroup>
                                        {wifiloading ? (
                                            <div className="p-4 text-center text-[--text-muted] text-[13px]">Scanning...</div>
                                        ) : wifinetworks.length === 0 ? (
                                            <div className="p-4 text-center text-[--text-muted] text-[13px]">No networks found</div>
                                        ) : (
                                            wifinetworks.map((net, i) => (
                                                <SettingsRow
                                                    key={net.ssid || i}
                                                    label={net.ssid || 'Hidden Network'}
                                                    value={net.signal ? `${net.signal}%` : ''}
                                                    onClick={async () => {
                                                        if (net.ssid === wifissid) return;
                                                        const pass = net.security !== 'open' ? prompt(`Enter password for ${net.ssid}`) : undefined;
                                                        if (net.security !== 'open' && !pass) return;
                                                        await wifiapi.connect(net.ssid, pass || undefined);
                                                        fetchwifistatus();
                                                    }}
                                                    last={i === wifinetworks.length - 1}
                                                />
                                            ))
                                        )}
                                    </SettingsGroup>
                                </>
                            )}

                            {!iselectron && (
                                <div className={`mt-4 p-4 text-[13px] ${clay ? 'text-[--text-muted] rounded-[12px]' : 'bg-pastel-yellow/10 border border-pastel-yellow/30 text-pastel-yellow'}`} style={clay ? glassCard : undefined}>
                                    Wi-Fi controls require native mode (Electron)
                                </div>
                            )}
                        </>
                    )}

                    {activetab === 'bluetooth' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Bluetooth</div>
                            <SettingsGroup>
                                <SettingsRow
                                    label="Bluetooth"
                                    toggle
                                    toggleValue={btenabled}
                                    onToggle={async (v: boolean) => {
                                        setbtenabled(v);
                                        if (iselectron) await bluetoothapi.setenabled(v);
                                    }}
                                    last
                                />
                            </SettingsGroup>

                            {btenabled && (
                                <>
                                    <div className="flex items-center justify-between text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">
                                        <span>Devices</span>
                                        <button onClick={fetchbtdevices} className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                            <IoRefresh className={btloading ? 'animate-spin' : ''} size={14} />
                                        </button>
                                    </div>
                                    <SettingsGroup>
                                        {btloading ? (
                                            <div className="p-4 text-center text-[--text-muted] text-[13px]">Scanning...</div>
                                        ) : btdevices.length === 0 ? (
                                            <div className="p-4 text-center text-[--text-muted] text-[13px]">No devices found</div>
                                        ) : (
                                            btdevices.map((dev, i) => (
                                                <SettingsRow
                                                    key={dev.mac || i}
                                                    label={dev.name || dev.mac || 'Unknown Device'}
                                                    value={dev.connected ? 'Connected' : ''}
                                                    last={i === btdevices.length - 1}
                                                />
                                            ))
                                        )}
                                    </SettingsGroup>
                                </>
                            )}

                            {!iselectron && (
                                <div className={`mt-4 p-4 text-[13px] ${clay ? 'text-[--text-muted] rounded-[12px]' : 'bg-pastel-yellow/10 border border-pastel-yellow/30 text-pastel-yellow'}`} style={clay ? glassCard : undefined}>
                                    Bluetooth controls require native mode (Electron)
                                </div>
                            )}
                        </>
                    )}

                    {activetab === 'sound' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Output</div>
                            <SettingsGroup>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[13px] font-medium text-[--text-color]">Volume</span>
                                        <span className="text-[13px] text-[--text-muted]">{volume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={async (e) => {
                                            const v = parseInt(e.target.value);
                                            setvolume(v);
                                            if (iselectron) await audioapi.setvolume(v);
                                        }}
                                        className={`w-full h-2 appearance-none cursor-pointer accent-accent ${clay ? 'bg-[--bg-glass-active] rounded-full' : 'bg-[--border-color]'}`}
                                    />
                                </div>
                                <SettingsRow
                                    label="Mute"
                                    toggle
                                    toggleValue={muted}
                                    onToggle={async (v: boolean) => {
                                        setmuted(v);
                                        if (iselectron) await audioapi.setmuted(v);
                                    }}
                                    last
                                />
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Sound Effects</div>
                            <SettingsGroup>
                                <SettingsRow
                                    label="UI Sound Effects"
                                    toggle
                                    toggleValue={soundeffects}
                                    onToggle={setsoundeffects}
                                    last
                                />
                            </SettingsGroup>

                            {!iselectron && (
                                <div className={`mt-4 p-4 text-[13px] ${clay ? 'text-[--text-muted] rounded-[12px]' : 'bg-pastel-yellow/10 border border-pastel-yellow/30 text-pastel-yellow'}`} style={clay ? glassCard : undefined}>
                                    System volume controls require native mode (Electron)
                                </div>
                            )}
                        </>
                    )}

                    {activetab === 'network' && (
                        <>
                            {!iselectron && (
                                <>
                                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">CheerpX Network (Tailscale)</div>
                                    <SettingsGroup>
                                        <SettingsRow
                                            label="Status"
                                            value={
                                                !cheerpx ? 'VM not running' :
                                                cheerpx.networkState === 'connected' ? 'Connected' :
                                                cheerpx.networkState === 'connecting' ? 'Connecting...' :
                                                cheerpx.networkState === 'login-ready' ? 'Login Required' :
                                                'Disconnected'
                                            }
                                        />
                                        {cheerpx && cheerpx.networkState === 'disconnected' && (
                                            <div className={`px-4 py-3 ${clay ? 'border-t border-[--text-muted]/10 flex justify-center' : 'border-t border-[--border-color]'}`}>
                                                <button
                                                    onClick={() => cheerpx.connectNetwork()}
                                                    className={`text-xs font-medium transition-all ${clay ? 'px-5 py-2.5 rounded-[12px] text-white active:scale-[0.97]' : 'w-full py-2 bg-accent text-[--bg-base] hover:opacity-90'}`}
                                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    Connect to Tailscale
                                                </button>
                                            </div>
                                        )}
                                        {cheerpx && cheerpx.networkState === 'connecting' && (
                                            <div className={`px-4 py-3 text-center ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                                <div className="flex items-center justify-center gap-2 text-xs text-[--text-muted]">
                                                    <IoRefresh className="animate-spin" size={14} />
                                                    Establishing connection...
                                                </div>
                                            </div>
                                        )}
                                        {cheerpx && cheerpx.networkState === 'login-ready' && cheerpx.networkLoginUrl && (
                                            <div className={`px-4 py-3 space-y-2 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                                <p className="text-xs text-[--text-muted]">
                                                    Tailscale requires authentication. Click below to open the login page.
                                                </p>
                                                <div className={clay ? 'flex justify-center pt-1' : ''}>
                                                    <button
                                                        onClick={() => window.open(cheerpx.networkLoginUrl!, '_blank')}
                                                        className={`text-xs font-medium transition-all ${clay ? 'px-5 py-2.5 rounded-[12px] text-white active:scale-[0.97]' : 'w-full py-2 bg-pastel-blue text-white hover:opacity-90'}`}
                                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                    >
                                                        Open Tailscale Login
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {cheerpx && cheerpx.networkState === 'connected' && (
                                            <SettingsRow label="Network" value="Tailscale VPN" last />
                                        )}
                                    </SettingsGroup>

                                    {!cheerpx && (
                                        <div className={`mt-4 p-4 text-[13px] ${clay ? 'text-[--text-muted] rounded-[12px]' : 'bg-pastel-yellow/10 border border-pastel-yellow/30 text-pastel-yellow'}`} style={clay ? glassCard : undefined}>
                                            CheerpX network requires the Linux VM to be running. Open Terminal first.
                                        </div>
                                    )}
                                </>
                            )}

                            {iselectron && (
                                <div className={`flex flex-col items-center justify-center py-20 text-center ${clay ? '' : 'opacity-50'}`}>
                                    <IoGlobeOutline size={48} className={`mb-4 ${clay ? 'text-[--text-muted]' : ''}`} />
                                    <h3 className={`text-lg font-semibold ${clay ? 'text-[--text-color]' : ''}`}>Network</h3>
                                    <p className={`text-[13px] ${clay ? 'text-[--text-muted] max-w-[300px]' : ''}`}>Network settings available in web mode via CheerpX Tailscale.</p>
                                </div>
                            )}
                        </>
                    )}

                    {activetab === 'storage' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Storage Overview</div>
                            <SettingsGroup>
                                <SettingsRow label="Projects" value={storageInfo?.projectCount !== undefined ? `${storageInfo.projectCount} projects` : 'Loading...'} />
                                <SettingsRow label="CheerpX Cache" value={storageInfo?.cxCacheSize || 'Unknown'} />
                                <SettingsRow label="Git Data" value="IndexedDB (nextaros-git)" />
                                <SettingsRow label="Secure Storage" value="IndexedDB (nextaros-secure)" last />
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Manage</div>
                            <SettingsGroup>
                                <div className={`px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[--text-color] ${ismobile ? 'text-[16px]' : 'text-[13px] font-medium'}`}>Clear CheerpX Cache</span>
                                    </div>
                                    <p className="text-[10px] text-[--text-muted] mb-2">Deletes the CheerpX disk image cache. The VM will re-download on next boot.</p>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Clear CheerpX cache? The VM will need to re-download files on next boot.')) return;
                                            setClearingCache(true);
                                            try {
                                                await new Promise<void>((resolve, reject) => {
                                                    const req = indexedDB.deleteDatabase('nextaros-cx');
                                                    req.onsuccess = () => resolve();
                                                    req.onerror = () => reject(req.error);
                                                });
                                                alert('CheerpX cache cleared');
                                            } catch (e) {
                                                alert('Failed to clear cache: ' + e);
                                            } finally {
                                                setClearingCache(false);
                                            }
                                        }}
                                        disabled={clearingCache}
                                        className={`text-xs hover:opacity-90 disabled:opacity-50 transition-opacity ${clay ? 'px-5 py-2.5 rounded-[12px] text-white active:scale-[0.97]' : 'px-3 py-1.5 bg-pastel-red text-white'}`}
                                        style={clay ? { background: 'var(--pastel-red)' } : undefined}
                                    >
                                        {clearingCache ? 'Clearing...' : 'Clear Cache'}
                                    </button>
                                </div>
                                <div className={`px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[--text-color] ${ismobile ? 'text-[16px]' : 'text-[13px] font-medium'}`}>Export All Projects</span>
                                    </div>
                                    <p className="text-[10px] text-[--text-muted] mb-2">Download all project files as a single zip archive.</p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { getAllProjects, getProjectFiles } = await import('../../utils/projectDB');
                                                const JSZip = (await import('jszip')).default;
                                                const zip = new JSZip();
                                                const projects = await getAllProjects();
                                                for (const proj of projects) {
                                                    const folder = zip.folder(proj.name);
                                                    if (folder) {
                                                        const files = await getProjectFiles(proj.id);
                                                        for (const f of files) {
                                                            if (!f.isDirectory) folder.file(f.path, f.content);
                                                        }
                                                    }
                                                }
                                                const blob = await zip.generateAsync({ type: 'blob' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `nextaros-projects-${new Date().toISOString().split('T')[0]}.zip`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            } catch (e) {
                                                alert('Export failed: ' + e);
                                            }
                                        }}
                                        className={`text-xs text-white hover:opacity-90 transition-opacity ${clay ? 'px-5 py-2.5 rounded-[12px] active:scale-[0.97]' : 'px-3 py-1.5'}`}
                                        style={{ background: clay ? 'var(--accent-color)' : 'var(--accent-color)' }}
                                    >
                                        Export Projects
                                    </button>
                                </div>
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[--text-color] ${ismobile ? 'text-[16px]' : 'text-[13px] font-medium'}`}>Clear Saved Tokens</span>
                                    </div>
                                    <p className="text-[10px] text-[--text-muted] mb-2">Removes all saved Google OAuth tokens and Git PATs from secure storage.</p>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Clear all saved authentication tokens?')) return;
                                            try {
                                                const { deleteSecret } = await import('../../utils/secureStorage');
                                                await deleteSecret('google-access-token');
                                                await deleteSecret('google-user-info');
                                                await deleteSecret('git-pat');
                                                alert('All tokens cleared');
                                            } catch (e) {
                                                alert('Failed: ' + e);
                                            }
                                        }}
                                        className={`text-xs text-white hover:opacity-90 transition-opacity ${clay ? 'px-5 py-2.5 rounded-[12px] active:scale-[0.97]' : 'px-3 py-1.5 bg-pastel-peach'}`}
                                        style={clay ? { background: 'var(--pastel-peach)' } : undefined}
                                    >
                                        Clear Tokens
                                    </button>
                                </div>
                            </SettingsGroup>
                        </>
                    )}

                    {activetab === 'displays' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Display</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Display Settings" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <SettingsGroup>
                                    <SettingsRow label="Resolution" value="System managed" />
                                    <SettingsRow label="Refresh Rate" value="System managed" />
                                    <SettingsRow label="Scale" value="System managed" last />
                                </SettingsGroup>
                            )}
                            <p className="text-[10px] text-[--text-muted] pl-3 mt-2">Display configuration is managed by the Wayland compositor.</p>
                        </>
                    )}

                    {activetab === 'keyboard' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Keyboard</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Keyboard Settings" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <>
                                    <SettingsGroup>
                                        <SettingsRow label="Layout" value={kbLayout || 'Loading...'} />
                                        <div className={`px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-[--text-color]">Change Layout</span>
                                            </div>
                                            <select
                                                value={kbLayout}
                                                onChange={async (e) => {
                                                    const layout = e.target.value;
                                                    await keyboardapi.setlayout(layout);
                                                    setKbLayout(layout);
                                                }}
                                                className={`mt-2 w-full text-[--text-color] text-[13px] px-2 py-1.5 outline-none ${clay ? 'rounded-[10px] bg-[--bg-glass-active] border border-[--glass-border]' : 'bg-overlay border border-[--border-color]'}`}
                                            >
                                                {kbLayouts.slice(0, 100).map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </SettingsGroup>
                                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Key Repeat</div>
                                    <SettingsGroup>
                                        <div className={`px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[13px] font-medium text-[--text-color]">Delay (ms)</span>
                                                <span className="text-[12px] text-[--text-muted]">{kbRepeatDelay}</span>
                                            </div>
                                            <input type="range" min="100" max="2000" step="50" value={kbRepeatDelay}
                                                onChange={(e) => setKbRepeatDelay(Number(e.target.value))}
                                                onMouseUp={() => keyboardapi.setrepeatrate(kbRepeatDelay, kbRepeatInterval)}
                                                className="w-full accent-accent" />
                                        </div>
                                        <div className="px-4 py-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[13px] font-medium text-[--text-color]">Interval (ms)</span>
                                                <span className="text-[12px] text-[--text-muted]">{kbRepeatInterval}</span>
                                            </div>
                                            <input type="range" min="10" max="200" step="5" value={kbRepeatInterval}
                                                onChange={(e) => setKbRepeatInterval(Number(e.target.value))}
                                                onMouseUp={() => keyboardapi.setrepeatrate(kbRepeatDelay, kbRepeatInterval)}
                                                className="w-full accent-accent" />
                                        </div>
                                    </SettingsGroup>
                                </>
                            )}
                        </>
                    )}

                    {activetab === 'mouse' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Mouse & Touchpad</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Mouse Settings" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <>
                                    <SettingsGroup>
                                        <div className={`px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[13px] font-medium text-[--text-color]">Pointer Speed</span>
                                                <span className="text-[12px] text-[--text-muted]">{mouseSpeed.toFixed(2)}</span>
                                            </div>
                                            <input type="range" min="-1" max="1" step="0.05" value={mouseSpeed}
                                                onChange={(e) => setMouseSpeed(Number(e.target.value))}
                                                onMouseUp={() => mouseapi.setspeed(mouseSpeed)}
                                                className="w-full accent-accent" />
                                        </div>
                                        <SettingsRow label="Natural Scrolling" toggle toggleValue={naturalScroll} onToggle={async (v: boolean) => { setNaturalScroll(v); await mouseapi.setnaturalscroll(v); }} last />
                                    </SettingsGroup>
                                </>
                            )}
                        </>
                    )}

                    {activetab === 'language' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Language & Region</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Language" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <SettingsGroup>
                                    <SettingsRow label="Current Locale" value={currentLocale || 'Loading...'} />
                                    <div className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-medium text-[--text-color]">Change Locale</span>
                                        </div>
                                        <select
                                            value={currentLocale}
                                            onChange={async (e) => {
                                                const loc = e.target.value;
                                                await localeapi.setlocale(loc);
                                                setCurrentLocale(loc);
                                            }}
                                            className={`mt-2 w-full text-[--text-color] text-[13px] px-2 py-1.5 outline-none ${clay ? 'rounded-[10px] bg-[--bg-glass-active] border border-[--glass-border]' : 'bg-overlay border border-[--border-color]'}`}
                                        >
                                            {availableLocales.slice(0, 200).map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <p className="text-[10px] text-[--text-muted] mt-2">Changes require a session restart to take full effect.</p>
                                    </div>
                                </SettingsGroup>
                            )}
                        </>
                    )}

                    {activetab === 'datetime' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Date & Time</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Date & Time" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <>
                                    <SettingsGroup>
                                        <SettingsRow label="Local Time" value={dtLocalTime || 'Loading...'} />
                                        <SettingsRow label="Timezone" value={dtTimezone || 'Loading...'} />
                                        <SettingsRow label="Automatic Date & Time (NTP)" toggle toggleValue={dtNtp} onToggle={async (v: boolean) => { setDtNtp(v); await datetimeapi.setntp(v); }} last />
                                    </SettingsGroup>
                                    <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Timezone</div>
                                    <SettingsGroup>
                                        <div className="px-4 py-3">
                                            <select
                                                value={dtTimezone}
                                                onChange={async (e) => {
                                                    const tz = e.target.value;
                                                    await datetimeapi.settimezone(tz);
                                                    setDtTimezone(tz);
                                                }}
                                                className={`w-full text-[--text-color] text-[13px] px-2 py-1.5 outline-none ${clay ? 'rounded-[10px] bg-[--bg-glass-active] border border-[--glass-border]' : 'bg-overlay border border-[--border-color]'}`}
                                            >
                                                {dtTimezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                            </select>
                                        </div>
                                    </SettingsGroup>
                                </>
                            )}
                        </>
                    )}

                    {activetab === 'power' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Power</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Power Settings" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <SettingsGroup>
                                    <SettingsRow label="Power Management" value="Managed by system" />
                                    <SettingsRow label="Suspend" value="Automatic" last />
                                </SettingsGroup>
                            )}
                        </>
                    )}

                    {activetab === 'defaultapps' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Default Applications</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Default Apps" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : (
                                <SettingsGroup>
                                    <SettingsRow label="Web Browser" value={defaultBrowser || 'Loading...'} />
                                    <div className="px-4 py-3">
                                        <p className="text-[10px] text-[--text-muted]">Default applications are managed via xdg-settings on the host system.</p>
                                    </div>
                                </SettingsGroup>
                            )}
                        </>
                    )}

                    {activetab === 'printers' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Printers</div>
                            {!iselectron ? (
                                <SettingsGroup>
                                    <SettingsRow label="Printers" value="Requires native mode" last />
                                </SettingsGroup>
                            ) : printerList.length === 0 ? (
                                <SettingsGroup>
                                    <SettingsRow label="No printers found" value="" last />
                                </SettingsGroup>
                            ) : (
                                <SettingsGroup>
                                    {printerList.map((p: any, i: number) => (
                                        <SettingsRow key={i} label={p.name || p} value={p.name === defaultPrinter ? 'Default' : ''} last={i === printerList.length - 1} />
                                    ))}
                                </SettingsGroup>
                            )}
                        </>
                    )}

                    {activetab === 'notifications' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Notifications</div>
                            <SettingsGroup>
                                <SettingsRow label="Do Not Disturb" toggle toggleValue={dnd} onToggle={setdnd} />
                                <SettingsRow label="Show Previews" toggle toggleValue={showpreviews} onToggle={setshowpreviews} />
                                <SettingsRow label="Show in Lock Screen" toggle toggleValue={showonlockscreen} onToggle={setshowonlockscreen} last />
                            </SettingsGroup>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Application Notifications</div>
                            <SettingsGroup>
                                <SettingsRow label="All apps can send notifications" value="" last />
                            </SettingsGroup>
                        </>
                    )}

                    {activetab === 'focus' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Focus</div>
                            <SettingsGroup>
                                <SettingsRow label="Do Not Disturb" toggle toggleValue={dnd} onToggle={setdnd} />
                                <SettingsRow label="Schedule" toggle toggleValue={false} onToggle={() => {}} last />
                            </SettingsGroup>
                        </>
                    )}

                    {activetab === 'accessibility' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Vision</div>
                            <SettingsGroup>
                                <SettingsRow label="High Contrast" toggle toggleValue={false} onToggle={() => {}} />
                                <SettingsRow label="Large Text" toggle toggleValue={false} onToggle={() => {}} />
                                <SettingsRow label="Reduce Motion" toggle toggleValue={reducemotion} onToggle={setreducemotion} />
                                <SettingsRow label="Reduce Transparency" toggle toggleValue={reducetransparency} onToggle={setreducetransparency} last />
                            </SettingsGroup>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Hearing</div>
                            <SettingsGroup>
                                <SettingsRow label="Visual Alerts" toggle toggleValue={false} onToggle={() => {}} />
                                <SettingsRow label="Mono Audio" toggle toggleValue={false} onToggle={() => {}} last />
                            </SettingsGroup>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Motor</div>
                            <SettingsGroup>
                                <SettingsRow label="Sticky Keys" toggle toggleValue={false} onToggle={() => {}} />
                                <SettingsRow label="Slow Keys" toggle toggleValue={false} onToggle={() => {}} />
                                <SettingsRow label="Bounce Keys" toggle toggleValue={false} onToggle={() => {}} last />
                            </SettingsGroup>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Pointer</div>
                            <SettingsGroup>
                                <SettingsRow label="Cursor Size" value="Default" last />
                            </SettingsGroup>
                        </>
                    )}

                    {!['general','appearance','users','wifi','bluetooth','sound','network','storage','displays','keyboard','mouse','language','datetime','power','defaultapps','printers','notifications','focus','accessibility'].includes(activetab) && (
                        <div className={`flex flex-col items-center justify-center py-20 text-center ${clay ? '' : 'opacity-50'}`}>
                            <IoSettingsOutline size={48} className={`mb-4 ${clay ? 'text-[--text-muted]' : ''}`} />
                            <h3 className={`text-lg font-semibold ${clay ? 'text-[--text-color]' : ''}`}>Settings for {sidebaritems.find(i => i.id === activetab)?.label}</h3>
                            <p className={`text-[13px] ${clay ? 'text-[--text-muted] max-w-[300px]' : ''}`}>This section is under development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (ismobile) {
        return (
            <div className={`relative h-full w-full bg-[--bg-base] ${clay ? 'font-sans' : 'font-mono'} text-[--text-color] overflow-hidden`}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {showsidebar ? (
                        <motion.div
                            key="sidebar"
                            initial={{ x: '-30%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-30%', opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`absolute pb-10 inset-0 z-30 flex flex-col ${clay ? 'bg-[--bg-base]' : 'bg-surface'}`}
                        >
                            <div className="px-4 pt-12 pb-2">
                                <h1 className="text-[32px] font-bold text-[--text-color]">Settings</h1>
                            </div>
                            <div className="px-4 py-2">
                                <div className={`relative ${clay ? 'rounded-full' : ''}`}
                                    style={clay ? glassInput : undefined}>
                                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                    <input placeholder="Search" className={`w-full pl-9 pr-3 py-2 text-[16px] outline-none text-[--text-color] placeholder-[--text-muted] ${clay ? 'bg-transparent' : 'bg-overlay'}`} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                                <div
                                    className={`flex items-center gap-3 p-4 cursor-pointer ${clay ? `${clayClasses.card} active:scale-[0.99]` : 'bg-overlay border border-[--border-color]'}`}
                                    style={clay ? glassCard : undefined}
                                    onClick={() => { setactivetab('users'); setshowsidebar(false); }}
                                >
                                    <div className={`w-14 h-14 overflow-hidden shrink-0 ${clay ? 'rounded-full' : 'border border-[--border-color]'}`}>
                                        <Image src={user?.avatar || '/me.png'} alt="Profile" width={56} height={56} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[18px] font-semibold truncate text-[--text-color]">{user?.name || 'Guest'}</div>
                                        <div className="text-[14px] text-[--text-muted] truncate">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</div>
                                    </div>
                                    <IoChevronForward className="text-[--text-muted]" size={24} />
                                </div>

                                <div className={`overflow-hidden ${clay ? `${clayClasses.card}` : 'bg-overlay border border-[--border-color]'}`}
                                    style={clay ? glassCard : undefined}
                                >
                                    {sidebaritems.filter((i: any) => i.type !== 'spacer').map((item: any, i: number, arr: any[]) => (
                                        <div
                                            key={item.id}
                                            onClick={() => { setactivetab(item.id); setshowsidebar(false); }}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${clay ? 'active:bg-[--bg-glass-hover]' : 'active:bg-overlay'} ${i !== arr.length - 1 ? (clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]') : ''}`}
                                        >
                                            <div className={`w-7 h-7 flex items-center justify-center text-[--bg-base] shrink-0 ${clay ? 'rounded-[7px]' : ''}`} style={{ backgroundColor: item.color }}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-[16px] font-medium flex-1 text-[--text-color]">{item.label}</span>
                                            <IoChevronForward className="text-[--text-muted]" size={20} />
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
                            className="absolute inset-0 z-30 bg-[--bg-base] flex flex-col"
                        >
                            <div className={`h-14 flex items-center px-2 ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color] bg-surface'}`}>
                                <button
                                    onClick={() => setshowsidebar(true)}
                                    className="flex items-center text-accent px-2"
                                >
                                    <IoChevronBack size={26} />
                                    <span className="text-[16px]">Settings</span>
                                </button>
                                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[16px] text-[--text-color]">
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
        <div ref={containerref} className={`flex h-full w-full ${clay ? 'font-sans' : 'font-mono'} text-[--text-color] overflow-hidden`}>
            <div className={`w-[260px] flex flex-col pt-3 h-full ${clay ? '' : 'border-r border-[--border-color] bg-surface anime-gradient-top'}`}
                style={clay ? glassSidebar : undefined}
            >
                <div className="px-4 py-2 mb-2">
                    <div className={`relative ${clay ? 'rounded-full' : ''}`}
                        style={clay ? glassInput : undefined}>
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
                        <input placeholder="Search" className={`w-full pl-8 pr-3 py-1 text-[13px] outline-none text-[--text-color] placeholder-[--text-muted] transition-all ${clay ? 'bg-transparent' : 'bg-overlay border border-[--border-color] focus:border-accent'}`}
                        />
                    </div>
                </div>

                <div className="px-3 pb-2">
                    <div
                        className={`flex items-center gap-3 p-2 cursor-pointer transition-all ${clay ? `${clayClasses.radiusSm} hover:bg-[--bg-glass-hover]` : 'hover:bg-overlay'}`}
                        onClick={() => setactivetab('users')}
                    >
                        <div className={`w-10 h-10 overflow-hidden shrink-0 ${clay ? 'rounded-full' : 'border border-[--border-color]'}`}>
                            <Image src={user?.avatar || '/me.png'} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold truncate leading-tight text-[--text-color]">{user?.name || 'Guest'}</div>
                            <div className="text-[11px] text-[--text-muted] truncate">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</div>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto px-2 ${clay ? 'space-y-1' : 'space-y-0.5'}`}>
                    {sidebaritems.map((item: any, i) => {
                        if (item.type === 'spacer') return <div key={i} className={clay ? 'h-3' : 'h-2'} />;
                        return (
                            <div
                                key={item.id}
                                onClick={() => setactivetab(item.id)}
                                className={`flex items-center cursor-pointer mx-1 transition-all ${clay ? 'gap-3 px-3 py-2.5 rounded-[12px] active:scale-[0.97]' : 'gap-2.5 px-3 py-1.5'} ${activetab === item.id
                                    ? clay ? 'text-white' : 'bg-accent text-[--bg-base]'
                                    : clay
                                        ? 'text-[--text-color] hover:bg-[--bg-glass-hover]'
                                        : 'text-[--text-color] hover:bg-overlay'
                                }`}
                                style={activetab === item.id && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <div className={`${clay ? 'w-6 h-6 rounded-[7px]' : 'w-5 h-5'} flex items-center justify-center shrink-0`} style={{ backgroundColor: activetab === item.id ? 'rgba(255,255,255,0.25)' : item.color }}>
                                    <item.icon size={clay ? 14 : 12} className="text-white" />
                                </div>
                                <span className={`${clay ? 'text-[14px] font-medium' : 'text-[13px]'} leading-none`}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <ContentView />
        </div>
    );
}
