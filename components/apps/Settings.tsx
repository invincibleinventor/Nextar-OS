'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { IoChevronForward, IoChevronBack, IoColorPaletteOutline, IoNotificationsOutline, IoSettingsOutline, IoWifi, IoBluetooth, IoGlobeOutline, IoMoon, IoAccessibilityOutline, IoSearch, IoImageOutline, IoVolumeHigh, IoCheckmark, IoRefresh } from 'react-icons/io5';
import { useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useAuth } from '../AuthContext';
import { personal, openSystemItem } from '../data';
import { motion, AnimatePresence } from 'framer-motion'
import UserManagement from './Settings/UserManagement';
import { IoPeopleOutline } from 'react-icons/io5';
import { iselectron, wifi as wifiapi, bluetooth as bluetoothapi, audio as audioapi } from '@/utils/platform';

const sidebaritems = [
    { id: 'wifi', label: 'Wi-Fi', icon: IoWifi, color: '#8aadf4' },
    { id: 'bluetooth', label: 'Bluetooth', icon: IoBluetooth, color: '#8aadf4' },
    { id: 'network', label: 'Network', icon: IoGlobeOutline, color: '#8aadf4' },
    { type: 'spacer' },
    { id: 'notifications', label: 'Notifications', icon: IoNotificationsOutline, color: '#ed8796' },
    { id: 'sound', label: 'Sound', icon: IoVolumeHigh, color: '#f5bde6' },
    { id: 'focus', label: 'Focus', icon: IoMoon, color: '#c6a0f6' },
    { type: 'spacer' },
    { id: 'general', label: 'General', icon: IoSettingsOutline, color: '#6e738d' },
    { id: 'appearance', label: 'Appearance', icon: IoColorPaletteOutline, color: '#f5a97f' },
    { id: 'accessibility', label: 'Accessibility', icon: IoAccessibilityOutline, color: '#8bd5ca' },
    { id: 'wallpaper', label: 'Wallpaper', icon: IoImageOutline, color: '#8aadf4' },
];

export default function Settings({ initialPage, windowId }: { initialPage?: string, windowId?: string }) {
    const [activetab, setactivetab] = useState(initialPage || "general");
    const [showsidebar, setshowsidebar] = useState(true);
    const { reducemotion, setreducemotion, reducetransparency, setreducetransparency, soundeffects, setsoundeffects, wallpaperurl, setwallpaperurl, accentcolor, setaccentcolor, inverselabelcolor, setinverselabelcolor } = useSettings();
    const { theme, toggletheme } = useTheme();
    const { addwindow, windows, updatewindow, setactivewindow, activewindow } = useWindows();
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const containerref = useRef<HTMLDivElement>(null);
    const [isnarrow, setisnarrow] = useState(false);

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

    const [wallpaperinput, setwallpaperinput] = useState(wallpaperurl);
    useEffect(() => { setwallpaperinput(wallpaperurl); }, [wallpaperurl]);

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

    useEffect(() => {
        if (activetab === 'wifi') {
            fetchwifistatus();
            fetchwifinetworks();
        } else if (activetab === 'bluetooth') {
            fetchbtstatus();
            fetchbtdevices();
        } else if (activetab === 'sound') {
            fetchaudiostatus();
        }
    }, [activetab, fetchwifistatus, fetchwifinetworks, fetchbtstatus, fetchbtdevices, fetchaudiostatus]);

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
            className={`w-[51px] h-[31px] p-[2px] transition-colors ${value ? 'bg-pastel-green' : 'bg-[--border-color]'}`}
        >
            <div className={`w-[27px] h-[27px]  bg-[--bg-base] transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-overlay border border-[--border-color] overflow-hidden mb-6">
            {children}
        </div>
    );

    const SettingsRow = ({ label, value, onClick, toggle, toggleValue, onToggle, last }: any) => (
        <div
            className={`flex items-center justify-between px-4 ${ismobile ? 'py-3.5' : 'py-2.5'} ${!last ? 'border-b border-[--border-color]' : ''} ${onClick ? 'active:bg-overlay' : ''}`}
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
                    <div className="flex items-center gap-3 mb-5 px-4 md:px-0">
                        <div className="w-7 h-7 flex items-center justify-center text-[--bg-base]" style={{ backgroundColor: sidebaritems.find(i => i.id === activetab)?.color || '#6e738d' }}>
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
                            <div className="flex flex-col items-center mb-6 bg-overlay p-5 border border-[--border-color]">
                                <div className="w-14 h-14 bg-accent mb-3 flex items-center justify-center text-[--bg-base]">
                                    <IoSettingsOutline size={28} />
                                </div>
                                <h2 className="text-lg font-bold text-[--text-color]">HackathOS</h2>
                                <p className="text-[12px] text-[--text-muted] mt-0.5">Version 14.5 (23A5212a)</p>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3">About</div>
                                <SettingsGroup>
                                    <SettingsRow label="Name" value="HackathOS" onClick={() => { }} />
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
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Colors</div>
                            <SettingsGroup>
                                <div className="p-5 flex justify-center gap-8">
                                    <button onClick={() => theme !== 'light' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-32 h-20 border flex overflow-hidden transition-all ${theme === 'light' ? 'border-accent ring-2 ring-accent/20' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}>
                                            <div className="w-1/3 bg-[#e6e9ef]" />
                                            <div className="w-2/3 bg-[#eff1f5] relative">
                                                <div className="absolute top-2 left-2 w-10 h-2 bg-accent opacity-20"></div>
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-[#bcc0cc]"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'light' ? 'text-accent' : 'text-[--text-muted]'}`}>Light</span>
                                    </button>
                                    <button onClick={() => theme !== 'dark' && toggletheme()} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-32 h-20 border flex overflow-hidden transition-all ${theme === 'dark' ? 'border-accent ring-2 ring-accent/20' : 'border-[--border-color] group-hover:border-[--text-muted]'}`}>
                                            <div className="w-1/3 bg-[#1e2030]" />
                                            <div className="w-2/3 bg-[#161822] relative">
                                                <div className="absolute top-2 left-2 w-10 h-2 bg-accent opacity-50"></div>
                                                <div className="absolute top-5 left-2 w-6 h-2 bg-[#363a4f]"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[12px] font-medium ${theme === 'dark' ? 'text-accent' : 'text-[--text-muted]'}`}>Dark</span>
                                    </button>
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Accessibility</div>
                            <SettingsGroup>
                                <SettingsRow label="Reduce Transparency" toggle toggleValue={reducetransparency} onToggle={setreducetransparency} />
                                <SettingsRow label="Reduce Motion" toggle toggleValue={reducemotion} onToggle={setreducemotion} />
                                <SettingsRow label="Sound Effects" toggle toggleValue={soundeffects} onToggle={setsoundeffects} />
                                <SettingsRow label="Inverse Label Color" toggle toggleValue={inverselabelcolor} onToggle={setinverselabelcolor} last />
                            </SettingsGroup>
                        </>
                    )}

                    {activetab === 'users' && (

                        <div className="h-full -m-8 md:-m-0 border border-[--border-color] overflow-hidden">
                            <UserManagement />
                        </div>
                    )}

                    {activetab === 'wallpaper' && (
                        <>
                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2">Wallpaper URL</div>
                            <SettingsGroup>
                                <div className="p-4">
                                    <input
                                        type="text"
                                        value={wallpaperinput}
                                        onChange={(e) => setwallpaperinput(e.target.value)}
                                        onBlur={() => setwallpaperurl(wallpaperinput)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setwallpaperurl(wallpaperinput); }}
                                        placeholder="https://example.com/wallpaper.jpg"
                                        className="w-full px-3 py-2 bg-overlay outline-none text-[14px] text-[--text-color] border border-[--border-color] focus:border-accent"
                                    />
                                    <p className="text-[11px] text-[--text-muted] mt-2">Enter a URL and press Enter or click away to apply</p>
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Preset Wallpapers</div>
                            <SettingsGroup>
                                <div className="p-4 grid grid-cols-3 gap-3">
                                    {['/bg.jpg', '/bg-dark.jpg', '/wallpaper-1.jpg', '/wallpaper-2.jpg', '/wallpaper-3.jpg', '/wallpaper-4.jpg'].map((wp) => (
                                        <button
                                            key={wp}
                                            onClick={() => setwallpaperurl(wp)}
                                            className={`aspect-video bg-cover bg-center border-2 transition-all ${wallpaperurl === wp ? 'border-accent ring-2 ring-accent/30' : 'border-[--border-color] hover:border-[--text-muted]'}`}
                                            style={{ backgroundImage: `url('${wp}')` }}
                                        />
                                    ))}
                                </div>
                            </SettingsGroup>

                            <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 mt-4">Accent Color</div>
                            <SettingsGroup>
                                <div className="p-4 flex gap-3 flex-wrap">
                                    {['#ed8796', '#f5a97f', '#eed49f', '#a6da95', '#8bd5ca', '#8aadf4', '#b7bdf8', '#f5bde6', '#c6a0f6'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setaccentcolor(color)}
                                            className={`w-8 h-8  transition-all ${accentcolor === color ? 'ring-2 ring-offset-2 ring-[--text-muted] scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </SettingsGroup>
                        </>
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
                                        <button onClick={fetchwifinetworks} className="p-1 hover:bg-overlay">
                                            <IoRefresh className={wifiloading ? 'animate-spin' : ''} size={14} />
                                        </button>
                                    </div>
                                    <SettingsGroup>
                                        {wifiloading ? (
                                            <div className="p-4 text-center text-[--text-muted] text-sm">Scanning...</div>
                                        ) : wifinetworks.length === 0 ? (
                                            <div className="p-4 text-center text-[--text-muted] text-sm">No networks found</div>
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
                                <div className="mt-4 p-4 bg-pastel-yellow/10 border border-pastel-yellow/30 text-sm text-pastel-yellow">
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
                                        <button onClick={fetchbtdevices} className="p-1 hover:bg-overlay">
                                            <IoRefresh className={btloading ? 'animate-spin' : ''} size={14} />
                                        </button>
                                    </div>
                                    <SettingsGroup>
                                        {btloading ? (
                                            <div className="p-4 text-center text-[--text-muted] text-sm">Scanning...</div>
                                        ) : btdevices.length === 0 ? (
                                            <div className="p-4 text-center text-[--text-muted] text-sm">No devices found</div>
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
                                <div className="mt-4 p-4 bg-pastel-yellow/10 border border-pastel-yellow/30 text-sm text-pastel-yellow">
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
                                        <span className="text-sm font-medium text-[--text-color]">Volume</span>
                                        <span className="text-sm text-[--text-muted]">{volume}%</span>
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
                                        className="w-full h-2 bg-[--border-color] appearance-none cursor-pointer accent-accent"
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
                                <div className="mt-4 p-4 bg-pastel-yellow/10 border border-pastel-yellow/30 text-sm text-pastel-yellow">
                                    System volume controls require native mode (Electron)
                                </div>
                            )}
                        </>
                    )}

                    {activetab !== 'general' && activetab !== 'appearance' && activetab !== 'users' && activetab !== 'wallpaper' && activetab !== 'wifi' && activetab !== 'bluetooth' && activetab !== 'sound' && (
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
            <div className="relative h-full w-full bg-[--bg-base] font-mono text-[--text-color] overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    {showsidebar ? (
                        <motion.div
                            key="sidebar"
                            initial={{ x: '-30%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-30%', opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="absolute pb-10 inset-0 z-30 bg-surface flex flex-col"
                        >
                            <div className="px-4 pt-12 pb-2">
                                <h1 className="text-[32px] font-bold text-[--text-color]">Settings</h1>
                            </div>
                            <div className="px-4 py-2">
                                <div className="relative">
                                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={16} />
                                    <input placeholder="Search" className="w-full bg-overlay pl-9 pr-3 py-2 text-[16px] outline-none text-[--text-color] placeholder-[--text-muted]" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                                <div
                                    className="flex items-center gap-3 p-4 bg-overlay border border-[--border-color] cursor-pointer"
                                    onClick={() => { setactivetab('users'); setshowsidebar(false); }}
                                >
                                    <div className="w-14 h-14  overflow-hidden shrink-0 border border-[--border-color]">
                                        <Image src={user?.avatar || '/me.png'} alt="Profile" width={56} height={56} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[18px] font-semibold truncate text-[--text-color]">{user?.name || 'Guest'}</div>
                                        <div className="text-[14px] text-[--text-muted] truncate">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</div>
                                    </div>
                                    <IoChevronForward className="text-[--text-muted]" size={24} />
                                </div>

                                <div className="bg-overlay border border-[--border-color] overflow-hidden">
                                    {sidebaritems.filter((i: any) => i.type !== 'spacer').map((item: any, i: number, arr: any[]) => (
                                        <div
                                            key={item.id}
                                            onClick={() => { setactivetab(item.id); setshowsidebar(false); }}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-overlay ${i !== arr.length - 1 ? 'border-b border-[--border-color]' : ''}`}
                                        >
                                            <div className="w-7 h-7 flex items-center justify-center text-[--bg-base] shrink-0" style={{ backgroundColor: item.color }}>
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
                            <div className="h-14 flex items-center px-2 border-b border-[--border-color] bg-surface">
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
        <div ref={containerref} className="flex h-full w-full font-mono text-[--text-color] overflow-hidden">
            <div className="w-[260px] border-r border-[--border-color] bg-surface flex flex-col pt-3 h-full anime-gradient-top">
                <div className="px-4 py-2 mb-2">
                    <div className="relative">
                        <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
                        <input placeholder="Search" className="w-full bg-overlay border border-[--border-color] pl-8 pr-3 py-1 text-[13px] outline-none text-[--text-color] placeholder-[--text-muted] transition-all focus:border-accent" />
                    </div>
                </div>

                <div className="px-3 pb-2">
                    <div
                        className="flex items-center gap-3 p-2 hover:bg-overlay cursor-pointer transition-colors"
                        onClick={() => setactivetab('users')}
                    >
                        <div className="w-10 h-10  overflow-hidden shrink-0 border border-[--border-color]">
                            <Image src={user?.avatar || '/me.png'} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold truncate leading-tight text-[--text-color]">{user?.name || 'Guest'}</div>
                            <div className="text-[11px] text-[--text-muted] truncate">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</div>
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
                                className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer mx-1 transition-colors ${activetab === item.id ? 'bg-accent text-[--bg-base]' : 'text-[--text-color] hover:bg-overlay'}`}
                            >
                                <div className="w-5 h-5 flex items-center justify-center text-[--bg-base] shrink-0 text-[12px]" style={{ backgroundColor: activetab === item.id ? 'transparent' : item.color }}>
                                    <item.icon size={12} className={activetab === item.id ? 'text-[--bg-base]' : ''} />
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
