'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import { getUsers, User } from '../utils/db';
import { verifyPassword } from '../utils/crypto';
import { useDevice } from './DeviceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowForward, IoLockClosed, IoPerson, IoMoon, IoRefresh } from 'react-icons/io5';
import { iselectron, power } from '@/utils/platform';
import { useSettings } from './SettingsContext';

export default function LockScreen() {
    const { login, user, isLoading: authLoading, guestLogin } = useAuth();
    const { setosstate, osstate, ismobile } = useDevice();
    const { islightbackground, wallpaperurl } = useSettings();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
                const lastUsername = localStorage.getItem('lastLoggedInUser');
                const lastUser = lastUsername ? fetchedUsers.find(u => u.username === lastUsername) : null;
                if (lastUser) {
                    setSelectedUser(lastUser);
                } else if (fetchedUsers.length > 0) {
                    setSelectedUser(fetchedUsers[0]);
                }
            } catch {
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const maxAttempts = 5;
    const lockoutDuration = 30000;

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmitting || !selectedUser) return;

        if (lockoutUntil && Date.now() < lockoutUntil) {
            setError(true);
            setTimeout(() => setError(false), 500);
            return;
        }

        setIsSubmitting(true);
        setError(false);

        setTimeout(async () => {
            const isValid = await verifyPassword(password, selectedUser.passwordHash);

            if (!isValid) {
                const newAttempts = loginAttempts + 1;
                setLoginAttempts(newAttempts);
                setError(true);
                setIsSubmitting(false);

                if (newAttempts >= maxAttempts) {
                    setLockoutUntil(Date.now() + lockoutDuration);
                    setLoginAttempts(0);
                }

                setTimeout(() => setError(false), 500);
            } else {
                setLoginAttempts(0);
                setLockoutUntil(null);
                const success = await login(password);
                if (!success) {
                    setError(true);
                    setIsSubmitting(false);
                } else {
                    if (selectedUser?.username) {
                        localStorage.setItem('lastLoggedInUser', selectedUser.username);
                    }
                    setPassword('');
                    setIsSubmitting(false);
                }
            }
        }, 600);
    };

    if (user && osstate === 'unlocked') return null;
    if (authLoading || loadingUsers) return null;
    if (osstate === 'booting') return null;

    const timeStr = currentTime?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }) || '';
    const dateStr = currentTime?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) || '';

    if (ismobile) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center bg-[--bg-base] overflow-hidden font-mono">
                {/* Background with better visibility */}
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url('${wallpaperurl}')` }} />
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[--bg-base]/70 via-[--bg-base]/50 to-[--bg-base]/80" />

                {/* Top accent line */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px] z-20"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                />

                <div className="h-12 w-full z-10" />

                {/* Lock icon */}
                <motion.div
                    className="z-10 mt-6 mb-3"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="w-10 h-10 flex items-center justify-center border border-pastel-red/40 bg-pastel-red/10"
                        style={{ boxShadow: '0 0 20px rgba(237,135,150,0.3)' }}>
                        <IoLockClosed className="text-pastel-red text-lg" />
                    </div>
                </motion.div>

                {/* Time display - no shimmer, use text-glow */}
                <motion.div
                    className="z-10 flex flex-col items-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className={`text-7xl font-bold tracking-tight ${islightbackground ? 'text-black/80' : 'text-white'}`}
                        style={{ textShadow: islightbackground ? 'none' : '0 2px 8px rgba(0,0,0,0.5)' }}>
                        {timeStr}
                    </h1>
                    <div className="w-16 h-[2px] mt-3 mb-2" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
                    <p className={`text-base font-medium ${islightbackground ? 'text-black/60' : 'text-white/80'}`}
                        style={{ textShadow: islightbackground ? 'none' : '0 1px 4px rgba(0,0,0,0.5)' }}>{dateStr}</p>
                </motion.div>

                {/* User selection and login */}
                <div className="z-20 w-full px-8 flex flex-col items-center gap-5 flex-1 justify-center">
                    <div className="flex items-center gap-5 overflow-x-auto w-full justify-center py-3 no-scrollbar">
                        {users.map(u => (
                            <motion.div
                                key={u.username}
                                onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                                animate={{
                                    scale: selectedUser?.username === u.username ? 1.05 : 0.9,
                                    opacity: selectedUser?.username === u.username ? 1 : 0.5
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <div
                                    className={`relative w-20 h-20 overflow-hidden border-2 transition-all duration-300 ${selectedUser?.username === u.username ? 'border-pastel-red' : 'border-[--border-color]'}`}
                                    style={selectedUser?.username === u.username ? { boxShadow: '0 0 20px rgba(237,135,150,0.4), 0 0 40px rgba(237,135,150,0.15)' } : {}}
                                >
                                    <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                                </div>
                                <span className="text-sm font-medium text-[--text-color]">{u.name}</span>
                            </motion.div>
                        ))}
                        <motion.div
                            onClick={() => guestLogin()}
                            className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                            animate={{ scale: 0.9, opacity: 0.5 }}
                            whileTap={{ scale: 0.85 }}
                        >
                            <div className="relative w-20 h-20 bg-[--bg-overlay] flex items-center justify-center border-2 border-[--border-color]">
                                <IoPerson size={32} className="text-[--text-muted]" />
                            </div>
                            <span className="text-sm font-medium text-[--text-color]">Guest</span>
                        </motion.div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedUser && (
                            <motion.form
                                key={selectedUser.username}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleLogin}
                                className="w-full max-w-[280px] relative mt-2"
                            >
                                <motion.div
                                    animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                >
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-[--bg-overlay] border-2 border-[--border-color] focus:border-pastel-red py-3 px-4 outline-none placeholder-[--text-muted] text-[--text-color] transition-all duration-300"
                                        style={{ WebkitTextFillColor: 'var(--text-color)' }}
                                    />
                                </motion.div>
                                <div className="h-5 mt-2 text-center">
                                    {error && <span className="text-xs font-medium text-pastel-red">Incorrect password</span>}
                                </div>
                                <button type="submit" className="hidden" />
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom accent */}
                <div className="w-full flex flex-col items-center pb-8 z-10 gap-4 mt-auto">
                    <div className="w-16 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[--bg-base] text-[--text-color] font-mono">
            {/* Background - more visible with gradient overlay */}
            <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${wallpaperurl}')` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-[--bg-base]/75 via-[--bg-base]/60 to-[--bg-base]/80" />
            </div>

            {/* Decorative accent lines */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[2px] z-20"
                style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
            />
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
                style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
            />

            {/* Time display - no shimmer, use glow effect */}
            <motion.div
                className="z-10 absolute top-20 flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <span className={`text-8xl font-bold tracking-tight ${islightbackground ? 'text-black/80' : 'text-white'}`}
                    style={{ textShadow: islightbackground ? 'none' : '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {timeStr}
                </span>
                <div className="w-20 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
                <span className={`text-xl font-medium ${islightbackground ? 'text-black/60' : 'text-white/80'}`}
                    style={{ textShadow: islightbackground ? 'none' : '0 1px 4px rgba(0,0,0,0.5)' }}>{dateStr}</span>
            </motion.div>

            {/* User selection */}
            <motion.div
                className="z-10 flex flex-col items-center w-full max-w-md mt-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-8 mb-8 overflow-x-auto p-4">
                    {users.map(u => (
                        <motion.div
                            key={u.username}
                            onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                            className="flex flex-col items-center gap-3 cursor-pointer"
                            animate={{
                                scale: selectedUser?.username === u.username ? 1.05 : 0.9,
                                opacity: selectedUser?.username === u.username ? 1 : 0.5
                            }}
                            whileHover={{ opacity: 0.8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div
                                className={`relative w-24 h-24 overflow-hidden border-2 transition-all duration-300 ${selectedUser?.username === u.username ? 'border-pastel-red' : 'border-[--border-color]'}`}
                                style={selectedUser?.username === u.username ? { boxShadow: '0 0 25px rgba(237,135,150,0.4), 0 0 50px rgba(237,135,150,0.15)' } : {}}
                            >
                                <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                            </div>
                            <span className={`text-base font-medium ${islightbackground ? 'text-black/70' : 'text-white/90'}`}
                                style={{ textShadow: islightbackground ? 'none' : '0 1px 3px rgba(0,0,0,0.5)' }}>{u.name}</span>
                        </motion.div>
                    ))}

                    <motion.div
                        onClick={() => guestLogin()}
                        className="flex flex-col items-center gap-3 cursor-pointer"
                        animate={{ scale: 0.9, opacity: 0.5 }}
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ scale: 0.85 }}
                    >
                        <div className="w-24 h-24 bg-[--bg-overlay] flex items-center justify-center border-2 border-[--border-color]">
                            <IoPerson size={40} className="text-[--text-muted]" />
                        </div>
                        <span className={`text-base font-medium ${islightbackground ? 'text-black/70' : 'text-white/90'}`}
                            style={{ textShadow: islightbackground ? 'none' : '0 1px 3px rgba(0,0,0,0.5)' }}>Guest User</span>
                    </motion.div>
                </div>

                {/* Password form */}
                <AnimatePresence mode="wait">
                    {selectedUser && (
                        <motion.form
                            key={selectedUser.username}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleLogin}
                            className="w-full max-w-[260px] relative flex flex-col items-center"
                        >
                            <motion.div
                                animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                                transition={{ duration: 0.4 }}
                                className="w-full relative"
                            >
                                <input
                                    type="password"
                                    value={password}
                                    name="search"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Password"
                                    className="w-full bg-[--bg-overlay] border-2 border-[--border-color] focus:border-pastel-red py-2 outline-none placeholder-[--text-muted] text-sm pl-4 pr-10 appearance-none text-[--text-color] transition-all duration-300"
                                    style={{ WebkitTextFillColor: 'var(--text-color)' }}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!password || isSubmitting}
                                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center transition-all duration-300
                                        ${password ? 'bg-pastel-red text-[--bg-base]' : 'bg-transparent text-transparent'}`}
                                    style={password ? { boxShadow: '0 0 12px rgba(237,135,150,0.4)' } : {}}
                                >
                                    {!isSubmitting && <IoArrowForward size={14} />}
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-[--bg-base] border-t-transparent animate-spin" />}
                                </button>
                            </motion.div>

                            <div className="h-6 mt-2">
                                {error && <span className="text-xs font-medium text-pastel-red">Incorrect password</span>}
                                {!error && <span className="text-[10px] text-[--text-muted]">Touch ID or Enter Password</span>}
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom action buttons */}
            <motion.div
                className="absolute bottom-10 flex gap-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div onClick={async () => { if (iselectron) await power.sleep(); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className="w-11 h-11 bg-[--bg-overlay] border border-[--border-color] flex items-center justify-center group-hover:border-accent transition-all duration-300"
                        style={{ transition: 'box-shadow 0.3s, border-color 0.3s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(var(--accent-rgb, 198,160,246),0.3)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                        <IoMoon size={18} className="text-[--text-color]" />
                    </div>
                    <span className="text-[10px] font-medium text-[--text-muted]">Sleep</span>
                </div>
                <div onClick={async () => { if (iselectron) await power.restart(); else window.location.reload(); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className="w-11 h-11 bg-[--bg-overlay] border border-[--border-color] flex items-center justify-center group-hover:border-accent transition-all duration-300"
                        style={{ transition: 'box-shadow 0.3s, border-color 0.3s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(var(--accent-rgb, 198,160,246),0.3)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                        <IoRefresh size={18} className="text-[--text-color]" />
                    </div>
                    <span className="text-[10px] font-medium text-[--text-muted]">Restart</span>
                </div>
            </motion.div>
        </div>
    );
}
