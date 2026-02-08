'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { personal, openSystemItem, generateFullFilesystemForUser, generateUserFilesystem } from '../data';
import { IoArrowForward, IoCheckmarkCircle, IoSparkles, IoAppsOutline, IoDesktopOutline, IoPhonePortraitOutline, IoLogoGithub, IoFolderOpenOutline, IoTerminalOutline, IoDocumentTextOutline, IoLogoLinkedin, IoPersonAdd, IoMail, IoCloudDownloadOutline } from "react-icons/io5";
import { useAuth } from '../AuthContext';
import { createUser, getUsers, User, saveAllFiles, isFilesystemInstalled, resetDB, initDB } from '../../utils/db';
import { hashPassword } from '../../utils/crypto';

export default function Welcome(props: any) {
    const { removewindow, addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();
    const [step, setstep] = useState(0);
    const [isnarrow, setisnarrow] = useState(false);
    const [dontshowagain, setdontshowagain] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    const { user, login, logout } = useAuth();

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

    if (!isReady) return <div className="w-full h-full bg-[--bg-base]" />;


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
            const users = await getUsers();
            const existingUser = users.find(u => u.username === username);
            if (existingUser) {
                setCreateError('Username already taken');
                setIsCreating(false);
                return;
            }
            const role = users.length === 0 ? 'admin' : 'user';
            const isFirstUser = users.length === 0;

            const hashedPassword = await hashPassword(password);

            const newUser: User = {
                username,
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
                    const fullFs = generateFullFilesystemForUser(username);
                    await saveAllFiles(fullFs);
                }
            } else {
                const userFs = generateUserFilesystem(username);
                await saveAllFiles(userFs);
            }

            await login(password);

            alert(`Account created! You are now logged in as ${name} (${role}).`);
            setView('welcome');

        } catch {
            setCreateError('Failed to create account');
        } finally {
            setIsCreating(false);
        }
    };

    const steps = [
        {
            title: "Welcome",
            content: (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-accent flex items-center justify-center">
                        <IoSparkles size={40} className="text-[--text-color]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">NextarOS</h2>
                        <p className="text-sm text-[--text-muted] max-w-sm mx-auto">
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
                                    className="p-1 hover:bg-overlay transition-colors"
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
                                        className="w-full px-3 py-2 bg-overlay border border-[--border-color] outline-none focus:ring-2 ring-accent/50 transition-all font-medium placeholder-[--text-muted]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Username</label>
                                    <input
                                        type="text" placeholder="john" value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 bg-overlay border border-[--border-color] outline-none focus:ring-2 ring-accent/50 transition-all font-medium placeholder-[--text-muted]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Password</label>
                                    <input
                                        type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-overlay border border-[--border-color] outline-none focus:ring-2 ring-accent/50 transition-all font-medium placeholder-[--text-muted]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[13px] font-medium ml-1 text-[--text-muted]">Confirm Password</label>
                                    <input
                                        type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-overlay border border-[--border-color] outline-none focus:ring-2 ring-accent/50 transition-all font-medium placeholder-[--text-muted]"
                                    />
                                </div>

                                <div className="pt-2">
                                    {createError && (
                                        <div className="text-pastel-red text-[13px] font-medium bg-pastel-red/10 px-3 py-2 mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-pastel-red" />
                                            {createError}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full py-2.5 bg-accent hover:bg-accent/80 text-[--text-color] font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
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
                                    className="p-1 hover:bg-overlay transition-colors"
                                >
                                    <IoArrowForward className="rotate-180 text-xl text-[--text-muted]" />
                                </button>
                                <div className="text-xl font-bold tracking-tight">Restore Snapshot</div>
                            </div>

                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-overlay flex items-center justify-center">
                                    <IoCloudDownloadOutline size={32} className="text-accent" />
                                </div>
                                <p className="text-sm text-[--text-muted]">
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
                                    className="inline-block w-full py-3 bg-accent hover:bg-accent/80 text-[--text-color] font-semibold text-[15px] transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    Select Snapshot File
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 overflow-hidden border-2 border-[--border-color]">
                                    <Image src="/pfp.png" alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                                </div>
                                {user?.username === 'guest' && (
                                    <div className="absolute -bottom-1 -right-1 bg-accent text-[--text-color] text-[10px] font-bold px-1.5 py-0.5 border border-[--border-color]">
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
                                        <div className="space-y-3">
                                            <div className="p-4 bg-accent/10 border border-accent/20">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-accent text-[--text-color]">
                                                        <IoPersonAdd size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-sm">Create Admin Account</div>
                                                        <div className="text-xs text-[--text-muted]">First time setup</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setView('create-account')}
                                                    className="w-full py-2 bg-accent hover:bg-accent/80 text-[--text-color] text-sm font-medium transition-colors"
                                                >
                                                    Set up System
                                                </button>
                                            </div>

                                            <div className="p-4 bg-overlay border border-[--border-color]">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-accent text-[--text-color]">
                                                        <IoCloudDownloadOutline size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-sm">Restore from Snapshot</div>
                                                        <div className="text-xs text-[--text-muted]">Import previous setup</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setView('restore-snapshot')}
                                                    className="w-full py-2 bg-accent hover:bg-accent/80 text-[--text-color] text-sm font-medium transition-colors"
                                                >
                                                    Restore Snapshot
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-overlay border border-[--border-color]">
                                            <div className="text-center">
                                                <div className="font-semibold text-sm mb-1">Standard User Access</div>
                                                <div className="text-xs text-[--text-muted]">
                                                    Please ask an administrator to create an account for you via Settings.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={logout}
                                        className="w-full py-2 text-accent text-sm font-medium hover:bg-overlay transition-colors"
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
                        <div key={i} className="flex items-center gap-3 p-3 bg-overlay">
                            <item.icon size={24} className="text-accent shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{item.label}</div>
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
                    <div className="w-16 h-16 mx-auto bg-accent flex items-center justify-center">
                        <IoCheckmarkCircle size={36} className="text-[--text-color]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Ready to explore</h3>
                        <p className="text-sm text-[--text-muted] max-w-xs mx-auto">
                            Click Get Started to begin, or take a guided tour.
                        </p>
                    </div>
                    <div className={`flex ${isnarrow ? 'flex-col' : 'flex-row'} justify-center gap-2`}>
                        <button onClick={() => {
                            if (props.windowId) removewindow(props.windowId);
                            setTimeout(() => window.dispatchEvent(new Event('start-tour')), 300);
                        }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-[--text-color] text-sm font-medium hover:bg-accent/80 transition-colors">
                            <IoCheckmarkCircle size={18} />
                            Take a Tour
                        </button>
                        <button onClick={() => openSystemItem('finder', context)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-overlay text-sm font-medium hover:bg-overlay transition-colors">
                            <Image src="/explorer.png" alt="" width={20} height={20} className="w-5 h-5" />
                            Open Explorer
                        </button>
                    </div>
                    <a
                        href="https://github.com/invincibleinventor/nextar-os"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[--text-muted] hover:text-[--text-color] transition-colors"
                    >
                        <IoLogoGithub size={18} />
                        View on GitHub
                    </a>
                    {user?.username !== 'guest' && (
                        <label className="flex items-center justify-center gap-2 text-sm text-[--text-muted] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={dontshowagain}
                                onChange={(e) => setdontshowagain(e.target.checked)}
                                className="w-4 h-4 border-[--border-color] text-accent focus:ring-accent"
                            />
                            Don&apos;t show this again
                        </label>
                    )}
                </div>
            )
        }
    ];

    return (
        <div ref={containerref} className="flex flex-col h-full w-full bg-[--bg-base] font-mono text-[--text-color] overflow-hidden">
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

            <div className="h-24 lg:h-16 shrink-0 relative flex items-center justify-between px-6 border-t border-[--border-color]">
                <button
                    onClick={() => step > 0 && setstep(step - 1)}
                    className={`text-accent text-sm font-medium px-3 py-1.5 hover:bg-overlay transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    Go Back
                </button>

                <div className="flex gap-1.5 absolute top-[50%]  w-max h-max mx-auto  left-0 right-0 bottom-[50%]">
                    {steps.map((_, i) => (
                        <button key={i} onClick={() => setstep(i)}
                            className={`w-2 h-2 transition-colors ${i === step ? 'bg-accent' : 'bg-overlay'}`} />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) {
                            setstep(step + 1);
                        } else {
                            if (dontshowagain && user?.username !== 'guest') {
                                localStorage.setItem('nextaros-hide-welcome', 'true');
                            }
                            removewindow(props.windowId || 'welcome');
                        }
                    }}
                    className="flex items-center gap-1.5 bg-accent text-[--text-color] px-4 py-1.5 text-sm font-medium hover:bg-accent/80 transition-colors"
                >
                    {step < steps.length - 1 ? 'Continue' : 'Get Started'}
                </button>
            </div>
        </div>
    );
}