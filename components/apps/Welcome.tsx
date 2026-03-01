'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { personal, openSystemItem, generateFullFilesystemForUser, generateUserFilesystem } from '../data';
import { IoArrowForward, IoCheckmarkCircle, IoDownloadOutline, IoAppsOutline, IoDesktopOutline, IoPhonePortraitOutline, IoLogoGithub, IoFolderOpenOutline, IoTerminalOutline, IoDocumentTextOutline, IoLogoLinkedin, IoPersonAdd, IoMail, IoCloudDownloadOutline } from "react-icons/io5";
import { useAuth } from '../AuthContext';
import { createUser, getUsers, User, saveAllFiles, isFilesystemInstalled, resetDB, initDB } from '../../utils/db';
import { hashPassword } from '../../utils/crypto';
import { useIsClay } from '../hooks/useIsClay';
import { glassPanel, glassCard, glassInput, glassButton } from '../hooks/useClayStyles';

export default function Welcome(props: any) {
    const { removewindow, addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();
    const [step, setstep] = useState(0);
    const [isnarrow, setisnarrow] = useState(false);
    const [dontshowagain, setdontshowagain] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    const { user, login, logout } = useAuth();
    const clay = useIsClay();

    const [isReady, setIsReady] = useState(false);
    const [hasUsers, setHasUsers] = useState(false);

    useEffect(() => {
        getUsers().then(u => {
            setHasUsers(u.length > 0);
            setIsReady(true);
        });
    }, []);

    useEffect(() => {
        if (user && user.username !== 'guest') {
            const hidden = localStorage.getItem('nextaros-hide-welcome');
            if (hidden === 'true' && props.windowId) {
                removewindow(props.windowId);
            }
        }
    }, [user, props.windowId, removewindow]);

    const [view, setView] = useState<'welcome' | 'create-account' | 'restore-snapshot'>('welcome');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setisnarrow(entry.contentRect.width < 500);
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, []);

    if (!isReady) return <div className={`w-full h-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`} />;


    const context = { addwindow, windows, updatewindow, setactivewindow, ismobile };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError('');

        if (!username || !password || !name) {
            setCreateError('All fields are required');
            setIsCreating(false);
            return;
        }

        if (password !== confirmPassword) {
            setCreateError('Passwords do not match');
            setIsCreating(false);
            return;
        }

        try {
            const cleanUsername = username.toLowerCase().trim();

            if (cleanUsername.length < 3) {
                setCreateError('Username must be at least 3 characters');
                setIsCreating(false);
                return;
            }

            if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
                setCreateError('Username: only lowercase letters, numbers, underscores');
                setIsCreating(false);
                return;
            }

            if (cleanUsername === 'guest') {
                setCreateError('Cannot use "guest" as username');
                setIsCreating(false);
                return;
            }

            const users = await getUsers();
            const existingUser = users.find(u => u.username === cleanUsername);
            if (existingUser) {
                setCreateError('Username already taken');
                setIsCreating(false);
                return;
            }
            const role = users.length === 0 ? 'admin' : 'user';
            const isFirstUser = users.length === 0;

            const hashedPassword = await hashPassword(password);

            const newUser: User = {
                username: cleanUsername,
                passwordHash: hashedPassword,
                name,
                role,
                avatar: '/me.png',
                bio: 'New User'
            };

            await createUser(newUser);

            if (isFirstUser) {
                const fsInstalled = await isFilesystemInstalled();
                if (!fsInstalled) {
                    const fullFs = generateFullFilesystemForUser(cleanUsername);
                    await saveAllFiles(fullFs);
                }
            } else {
                const userFs = generateUserFilesystem(cleanUsername);
                await saveAllFiles(userFs);
            }

            await login(password);
            setView('welcome');

        } catch (err: any) {
            const msg = typeof err === 'string' ? err : (err?.message || 'Failed to create account');
            setCreateError(msg);
        } finally {
            setIsCreating(false);
        }
    };

    const steps = [
        {
            title: "Get Started",
            content: (
                <div className="text-center space-y-6">
                    <div
                        className={`w-20 h-20 mx-auto flex items-center justify-center ${clay ? 'rounded-[16px]' : 'bg-accent'}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <IoDownloadOutline size={40} className={clay ? 'text-white drop-shadow-sm' : 'text-[--text-color]'} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">NextarOS Setup</h2>
                        <p className="text-[13px] text-[--text-muted] max-w-sm mx-auto">
                            A web-based operating system interface built with Next.js, featuring window management, file operations, and native-like interactions.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Account",
            content: (
                <div className="max-w-md mx-auto w-full">
                    {view === 'create-account' ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    onClick={() => setView('welcome')}
                                    className={`p-1 transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                >
                                    <IoArrowForward className="rotate-180 text-xl text-[--text-muted]" />
                                </button>
                                <div className="text-xl font-bold tracking-tight">Create Account</div>
                            </div>

                            <form onSubmit={handleCreateAccount} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Display Name</label>
                                    <input
                                        type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                                        className={`w-full px-3 py-2 outline-none transition-all font-medium placeholder-[--text-muted] ${clay ? 'rounded-[10px]' : 'bg-overlay border border-[--border-color] focus:ring-2 ring-accent/50'}`}
                                        style={clay ? glassInput : undefined}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Username</label>
                                    <input
                                        type="text" placeholder="john" value={username} onChange={e => setUsername(e.target.value)}
                                        className={`w-full px-3 py-2 outline-none transition-all font-medium placeholder-[--text-muted] ${clay ? 'rounded-[10px]' : 'bg-overlay border border-[--border-color] focus:ring-2 ring-accent/50'}`}
                                        style={clay ? glassInput : undefined}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Password</label>
                                    <input
                                        type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                        className={`w-full px-3 py-2 outline-none transition-all font-medium placeholder-[--text-muted] ${clay ? 'rounded-[10px]' : 'bg-overlay border border-[--border-color] focus:ring-2 ring-accent/50'}`}
                                        style={clay ? glassInput : undefined}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Confirm Password</label>
                                    <input
                                        type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className={`w-full px-3 py-2 outline-none transition-all font-medium placeholder-[--text-muted] ${clay ? 'rounded-[10px]' : 'bg-overlay border border-[--border-color] focus:ring-2 ring-accent/50'}`}
                                        style={clay ? glassInput : undefined}
                                    />
                                </div>

                                <div className="pt-2">
                                    {createError && (
                                        <div className={`text-pastel-red text-[13px] font-medium px-3 py-2 mb-3 flex items-center gap-2 ${clay ? 'rounded-[10px]' : ''}`}
                                            style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)' } : { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' }}>
                                            <div className={`w-1.5 h-1.5 bg-pastel-red ${clay ? 'rounded-full' : ''}`} />
                                            {createError}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className={`py-2.5 font-semibold text-[15px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${clay ? 'rounded-[12px] px-8 mx-auto block text-white hover:opacity-90' : 'w-full bg-accent text-[--text-color]'}`}
                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        {isCreating ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : view === 'restore-snapshot' ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    onClick={() => setView('welcome')}
                                    className={`p-1 transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}
                                >
                                    <IoArrowForward className="rotate-180 text-xl text-[--text-muted]" />
                                </button>
                                <div className="text-xl font-bold tracking-tight">Restore Snapshot</div>
                            </div>

                            <div className="text-center space-y-4">
                                <div className={`w-16 h-16 mx-auto flex items-center justify-center ${clay ? 'rounded-[16px]' : 'bg-overlay'}`} style={clay ? glassCard : undefined}>
                                    <IoCloudDownloadOutline size={32} className="text-accent" />
                                </div>
                                <p className="text-[13px] text-[--text-muted]">
                                    Restore your system from a previously exported snapshot file.
                                </p>

                                <input
                                    type="file"
                                    accept=".json"
                                    id="snapshot-file"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            const text = await file.text();
                                            const data = JSON.parse(text);

                                            if (!data.files || !Array.isArray(data.files)) {
                                                alert('Invalid snapshot file');
                                                return;
                                            }

                                            if (confirm(`Restore snapshot from ${new Date(data.timestamp).toLocaleString()}?\n\nFiles: ${data.files.length}\nUsers: ${data.users?.length || 0}`)) {
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

                                                alert('Snapshot restored! Reloading...');
                                                window.location.reload();
                                            }
                                        } catch (err) {
                                            alert('Error reading snapshot: ' + err);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="snapshot-file"
                                    className={`inline-block py-3 text-center font-semibold text-[15px] transition-all cursor-pointer active:scale-[0.97] ${clay ? 'rounded-[12px] px-8 text-white hover:opacity-90' : 'w-full bg-accent text-[--text-color]'}`}
                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    Select Snapshot File
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className={`absolute inset-0 overflow-hidden border-2 bg-[--bg-overlay] flex items-center justify-center ${clay ? 'rounded-[16px] border-[--glass-border]' : 'border-[--border-color]'}`}>
                                    {user?.username === 'guest' ? (
                                        <IoPersonAdd size={36} className="text-[--text-muted]" />
                                    ) : (
                                        <Image src="/pfp.png" alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                {user?.username === 'guest' && (
                                    <div className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 ${clay ? 'rounded-[6px] text-white' : 'bg-accent text-[--text-color] border border-[--border-color]'}`}
                                        style={clay ? { background: 'var(--accent-gradient)' } : undefined}>
                                        GUEST
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold">Currently logged in as</h3>
                                <p className="text-accent font-medium">@{user?.username || 'guest'}</p>
                                <p className="text-xs text-[--text-muted] mt-1">{user?.role === 'admin' ? 'Administrator' : user?.username === 'guest' ? 'Temporary Session' : 'Standard User'}</p>
                            </div>

                            {user?.username === 'guest' ? (
                                <div className="space-y-3">
                                    {!hasUsers ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className={`p-4 flex flex-col ${clay ? 'rounded-[16px]' : ''}`}
                                                style={clay ? { ...glassCard } : { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)' }}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 ${clay ? 'rounded-[10px] text-white' : 'bg-accent text-[--text-color]'}`}
                                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}>
                                                        <IoPersonAdd size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-[13px]">Create Admin Account</div>
                                                        <div className="text-xs text-[--text-muted]">First time setup</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setView('create-account')}
                                                    className={`mt-auto py-2 text-[13px] font-medium transition-colors active:scale-[0.97] ${clay ? 'rounded-[12px] px-5 text-white hover:opacity-90' : 'w-full bg-accent text-[--text-color]'}`}
                                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    Set up System
                                                </button>
                                            </div>

                                            <div className={`p-4 flex flex-col ${clay ? 'rounded-[16px]' : 'bg-overlay border border-[--border-color]'}`} style={clay ? glassCard : undefined}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`p-2 ${clay ? 'rounded-[10px] text-white' : 'bg-accent text-[--text-color]'}`}
                                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}>
                                                        <IoCloudDownloadOutline size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-[13px]">Restore from Snapshot</div>
                                                        <div className="text-xs text-[--text-muted]">Import previous setup</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setView('restore-snapshot')}
                                                    className={`mt-auto py-2 text-[13px] font-medium transition-colors active:scale-[0.97] ${clay ? 'rounded-[12px] px-5 text-white hover:opacity-90' : 'w-full bg-accent text-[--text-color]'}`}
                                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    Restore Snapshot
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-4 ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color]'}`} style={clay ? glassCard : undefined}>
                                            <div className="text-center">
                                                <div className="font-semibold text-[13px] mb-1">Standard User Access</div>
                                                <div className="text-xs text-[--text-muted]">
                                                    Please ask an administrator to create an account for you via Settings.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={logout}
                                        className={`py-2 text-accent text-[13px] font-medium hover:bg-[--bg-glass-hover] transition-colors ${clay ? 'rounded-[12px] px-5' : 'w-full hover:bg-overlay'}`}
                                        style={clay ? glassButton : undefined}
                                    >
                                        Sign in as different user
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "Features",
            content: (
                <div className={`grid ${isnarrow ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} max-w-md mx-auto`}>
                    {[
                        { icon: IoFolderOpenOutline, label: "File System", desc: "Persistent storage" },
                        { icon: IoAppsOutline, label: "Applications", desc: "Functional apps" },
                        { icon: IoTerminalOutline, label: "Terminal", desc: "Command line" },
                        { icon: IoDocumentTextOutline, label: "Text Editor", desc: "Rich text support" },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-3 ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-overlay'}`}
                            style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xs)' } : undefined}
                        >
                            <item.icon size={24} className="text-accent shrink-0" />
                            <div className="min-w-0">
                                <div className="text-[13px] font-medium truncate">{item.label}</div>
                                <div className="text-xs text-[--text-muted] truncate">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: "Get Started",
            content: (
                <div className="text-center space-y-6">
                    <div className={`w-16 h-16 mx-auto flex items-center justify-center ${clay ? 'rounded-[16px]' : 'bg-accent'}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}>
                        <IoCheckmarkCircle size={36} className={clay ? 'text-white drop-shadow-sm' : 'text-[--text-color]'} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Ready to explore</h3>
                        <p className="text-[13px] text-[--text-muted] max-w-xs mx-auto">
                            Click Get Started to begin, or take a guided tour.
                        </p>
                    </div>
                    <div className={`flex ${isnarrow ? 'flex-col' : 'flex-row'} justify-center gap-2`}>
                        <button onClick={() => {
                            if (props.windowId) removewindow(props.windowId);
                            setTimeout(() => window.dispatchEvent(new Event('start-tour')), 300);
                        }}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-medium transition-colors active:scale-[0.97] ${clay ? 'rounded-[12px] text-white hover:opacity-90' : 'bg-accent text-[--text-color]'}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}>
                            <IoCheckmarkCircle size={18} />
                            Take a Tour
                        </button>
                        <button onClick={() => openSystemItem('finder', context)}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-medium transition-colors active:scale-[0.97] ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover]' : 'bg-overlay hover:bg-overlay'}`}
                            style={clay ? glassButton : undefined}>
                            <Image src="/explorer.png" alt="" width={20} height={20} className="w-5 h-5" />
                            Open Explorer
                        </button>
                    </div>
                    <a
                        href="https://github.com/nextaros/nextaros"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[13px] text-[--text-muted] hover:text-[--text-color] transition-colors"
                    >
                        <IoLogoGithub size={18} />
                        View on GitHub
                    </a>
                    {user?.username !== 'guest' && (
                        <label className="flex items-center justify-center gap-2 text-[13px] text-[--text-muted] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={dontshowagain}
                                onChange={(e) => setdontshowagain(e.target.checked)}
                                className={`w-4 h-4 text-accent focus:ring-accent ${clay ? 'border-[--glass-border] rounded-[4px]' : 'border-[--border-color]'}`}
                            />
                            Don&apos;t show this again
                        </label>
                    )}
                </div>
            )
        }
    ];

    return (
        <div ref={containerref} className={`flex flex-col h-full w-full text-[--text-color] overflow-hidden ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'}`}>
            <div className="h-10 shrink-0" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-lg"
                    >
                        {steps[step].content}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className={`h-24 lg:h-16 shrink-0 relative flex items-center justify-between px-6 border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                <button
                    onClick={() => step > 0 && setstep(step - 1)}
                    className={`text-accent text-[13px] font-medium px-3 py-1.5 transition-colors ${clay ? 'rounded-[10px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'} ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    Go Back
                </button>

                <div className="flex gap-1.5 absolute top-[50%]  w-max h-max mx-auto  left-0 right-0 bottom-[50%]">
                    {steps.map((_, i) => (
                        <button key={i} onClick={() => setstep(i)}
                            className={`w-2 h-2 transition-colors ${clay ? 'rounded-full' : ''} ${i === step ? 'bg-accent' : clay ? 'bg-[--bg-glass-active]' : 'bg-overlay'}`} />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step === 1 && user?.username === 'guest') return;
                        if (step < steps.length - 1) {
                            setstep(step + 1);
                        } else {
                            if (dontshowagain && user?.username !== 'guest') {
                                localStorage.setItem('nextaros-hide-welcome', 'true');
                            }
                            removewindow(props.windowId || 'welcome');
                        }
                    }}
                    className={`flex items-center gap-1.5 px-5 py-2 text-[13px] font-medium transition-colors active:scale-[0.97] ${step === 1 && user?.username === 'guest' ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-90'} ${clay ? 'rounded-[12px] text-white' : 'bg-accent text-[--text-color]'}`}
                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                >
                    {step < steps.length - 1 ? 'Continue' : 'Get Started'}
                </button>
            </div>
        </div>
    );
}