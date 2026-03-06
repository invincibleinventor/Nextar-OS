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
import { useIsClay } from './hooks/useIsClay';

export default function LockScreen() {
    const { login, user, isLoading: authLoading, guestLogin } = useAuth();
    const { setosstate, osstate, ismobile } = useDevice();
    const { islightbackground, wallpaperurl } = useSettings();
    const clay = useIsClay();
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

    const textColor = islightbackground ? 'text-black/80' : 'text-white';
    const textMutedColor = islightbackground ? 'text-black/60' : 'text-white/80';
    const textShadow = islightbackground ? '0 1px 4px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.5)';
    const textShadowSm = islightbackground ? 'none' : '0 1px 4px rgba(0,0,0,0.5)';

    // ====================================================================
    // NEO-GLASS / CLAY LOCK SCREEN  --  Premium glassmorphic design
    // ====================================================================
    if (clay) {
        const isDark = !islightbackground;

        // Adaptive text colors for wallpaper readability
        const primaryText = islightbackground ? 'text-gray-800' : 'text-white';
        const secondaryText = islightbackground ? 'text-gray-600' : 'text-white/70';
        const tertiaryText = islightbackground ? 'text-gray-500' : 'text-white/50';

        // Strong text shadows for wallpaper legibility
        const clockShadow = islightbackground
            ? '0 1px 8px rgba(255,255,255,0.3)'
            : '0 2px 24px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.3)';
        const dateShadow = islightbackground
            ? '0 1px 4px rgba(255,255,255,0.2)'
            : '0 1px 12px rgba(0,0,0,0.5)';
        const subtleShadow = islightbackground
            ? '0 1px 4px rgba(255,255,255,0.15)'
            : '0 1px 6px rgba(0,0,0,0.4)';

        // Avatar ring
        const avatarRing = isDark
            ? '0 0 0 3px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.35)'
            : '0 0 0 3px rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.12)';

        // User-switcher dot styles
        const dotActive = isDark
            ? 'rgba(255,255,255,0.9)'
            : 'rgba(0,0,0,0.7)';
        const dotInactive = isDark
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(0,0,0,0.15)';

        // Greeting based on time of day
        const greeting = currentTime ? (currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 17 ? 'Good Afternoon' : 'Good Evening') : '';

        // ---- MOBILE CLAY — iOS style ----
        if (ismobile) {
            return (
                <div className="fixed inset-0 z-[800] flex flex-col items-center overflow-hidden font-sans select-none">
                    {/* Full wallpaper — visible, not heavily blurred */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${wallpaperurl}')` }}
                    />
                    <div className="absolute inset-0 z-[1]" style={{ background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)' }} />

                    {/* Top: Large clock + date (iOS style) */}
                    <motion.div
                        className="z-10 flex flex-col items-center mt-16"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1
                            className={`text-[82px] font-bold ${primaryText} leading-none tracking-tight`}
                            style={{ textShadow: clockShadow }}
                        >
                            {timeStr}
                        </h1>
                        <p
                            className={`text-[15px] font-medium ${secondaryText} mt-1 tracking-wide`}
                            style={{ textShadow: dateShadow }}
                        >
                            {dateStr}
                        </p>
                    </motion.div>

                    {/* Center: Avatar + name + password — no glass card, direct on wallpaper */}
                    <div className="z-10 flex-1 flex flex-col items-center justify-center w-full px-8">
                        <motion.div
                            className="flex flex-col items-center w-full max-w-[300px]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Avatar */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedUser?.username || 'guest'}
                                    className="flex flex-col items-center"
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                >
                                    <div
                                        className="relative w-[72px] h-[72px] rounded-full overflow-hidden flex items-center justify-center"
                                        style={{ boxShadow: avatarRing, background: isDark ? '#2C2C2E' : '#E5E5EA' }}
                                    >
                                        {selectedUser ? (
                                            <Image src={selectedUser.avatar || "/pfp.png"} alt={selectedUser.name} fill className="object-cover" />
                                        ) : (
                                            <IoPerson size={32} className={isDark ? 'text-white/50' : 'text-gray-400'} />
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Name */}
                            <motion.p
                                className={`text-[17px] font-semibold ${primaryText} mt-3`}
                                style={{ textShadow: dateShadow }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                {selectedUser ? selectedUser.name : greeting}
                            </motion.p>

                            {/* User switcher dots */}
                            {users.length > 1 && (
                                <div className="flex items-center gap-2 mt-3">
                                    {users.map(u => (
                                        <motion.button
                                            key={u.username}
                                            onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                                            className="rounded-full"
                                            style={{
                                                width: selectedUser?.username === u.username ? 20 : 8,
                                                height: 8,
                                                background: selectedUser?.username === u.username ? dotActive : dotInactive,
                                            }}
                                            whileTap={{ scale: 0.85 }}
                                            layout
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Password — frosted pill on wallpaper */}
                            <AnimatePresence mode="wait">
                                {selectedUser && (
                                    <motion.form
                                        key={selectedUser.username}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        onSubmit={handleLogin}
                                        className="flex flex-col items-center w-full mt-4"
                                    >
                                        <motion.div
                                            animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                                            transition={{ duration: 0.4 }}
                                            className="w-full relative"
                                        >
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password"
                                                className={`w-full h-11 outline-none rounded-full text-[13px] pl-5 pr-12 font-sans ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-700/50'}`}
                                                style={{
                                                    background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                                                    backdropFilter: 'blur(40px) saturate(1.4)',
                                                    WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
                                                    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                                                    caretColor: isDark ? '#fff' : '#333',
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!password || isSubmitting}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300"
                                                style={password
                                                    ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)', color: '#fff' }
                                                    : { background: 'transparent', color: 'transparent' }
                                                }
                                            >
                                                {!isSubmitting && <IoArrowForward size={14} />}
                                                {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                                            </button>
                                        </motion.div>

                                        <div className="h-5 mt-2 text-center">
                                            {error && lockoutUntil && Date.now() < lockoutUntil && (
                                                <motion.span className="text-[11px] font-medium text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Too many attempts. Try again shortly.</motion.span>
                                            )}
                                            {error && !(lockoutUntil && Date.now() < lockoutUntil) && (
                                                <motion.span className="text-[11px] font-medium text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Incorrect password</motion.span>
                                            )}
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            {/* Guest */}
                            <motion.button
                                onClick={() => guestLogin()}
                                className={`flex items-center gap-2 mt-2 px-5 py-2 rounded-full text-[12px] font-medium ${secondaryText} active:scale-95`}
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
                                    textShadow: subtleShadow,
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <IoPerson size={13} />
                                <span>Continue as Guest</span>
                            </motion.button>
                        </motion.div>
                    </div>

                    {/* Bottom: power buttons */}
                    <motion.div
                        className="z-10 pb-10 shrink-0 flex items-center gap-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <div onClick={async () => { if (iselectron) await power.sleep(); }} className="group cursor-pointer">
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center group-active:scale-90 transition-transform"
                                style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)' }}
                            >
                                <IoMoon size={16} className={isDark ? 'text-white' : 'text-black/70'} />
                            </div>
                        </div>
                        <div onClick={async () => { if (iselectron) await power.restart(); else window.location.reload(); }} className="group cursor-pointer">
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center group-active:scale-90 transition-transform"
                                style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.1)' }}
                            >
                                <IoRefresh size={16} className={isDark ? 'text-white' : 'text-black/70'} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        // ---- DESKTOP CLAY — macOS style ----
        return (
            <div className="fixed inset-0 z-[800] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
                {/* Blurred wallpaper */}
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${wallpaperurl}')`, filter: 'blur(60px) saturate(1.3) brightness(0.85)', transform: 'scale(1.2)' }} />
                <div className="absolute inset-0 z-[1]" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }} />

                {/* Centered content — no glass card, clean macOS style */}
                <motion.div
                    className="z-10 flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Avatar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 28 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedUser?.username || 'guest'}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            >
                                <div
                                    className="relative w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center"
                                    style={{ boxShadow: avatarRing, background: isDark ? '#2C2C2E' : '#E5E5EA' }}
                                >
                                    {selectedUser ? (
                                        <Image src={selectedUser.avatar || "/pfp.png"} alt={selectedUser.name} fill className="object-cover" />
                                    ) : (
                                        <IoPerson size={40} className={isDark ? 'text-white/50' : 'text-gray-400'} />
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Name + greeting */}
                    <motion.p
                        className={`text-xl font-semibold ${primaryText} mt-4`}
                        style={{ textShadow: dateShadow }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {selectedUser ? selectedUser.name : greeting}
                    </motion.p>

                    {/* User switcher dots */}
                    {users.length > 1 && (
                        <motion.div className="flex items-center gap-2.5 mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            {users.map(u => (
                                <motion.button
                                    key={u.username}
                                    onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                                    className="rounded-full cursor-pointer"
                                    style={{ width: selectedUser?.username === u.username ? 24 : 8, height: 8, background: selectedUser?.username === u.username ? dotActive : dotInactive }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.85 }}
                                    layout
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    title={u.name}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Password form — frosted pill */}
                    <AnimatePresence mode="wait">
                        {selectedUser && (
                            <motion.form
                                key={selectedUser.username}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                onSubmit={handleLogin}
                                className="flex flex-col items-center w-[280px] mt-5"
                            >
                                <motion.div
                                    animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className="w-full relative"
                                >
                                    <input
                                        type="password"
                                        value={password}
                                        name="search"
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter Password"
                                        className={`w-full h-[46px] outline-none rounded-full text-[14px] pl-6 pr-14 appearance-none font-sans ${isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-700/50'}`}
                                        style={{
                                            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                                            backdropFilter: 'blur(40px) saturate(1.4)',
                                            WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
                                            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
                                            caretColor: isDark ? '#fff' : '#333',
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!password || isSubmitting}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300"
                                        style={password
                                            ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)', color: '#fff' }
                                            : { background: 'transparent', color: 'transparent' }
                                        }
                                    >
                                        {!isSubmitting && <IoArrowForward size={15} />}
                                        {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                                    </button>
                                </motion.div>

                                <div className="h-6 mt-3 text-center">
                                    {error && lockoutUntil && Date.now() < lockoutUntil && (
                                        <motion.span className="text-xs font-medium text-red-400" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Too many attempts. Try again shortly.</motion.span>
                                    )}
                                    {error && !(lockoutUntil && Date.now() < lockoutUntil) && (
                                        <motion.span className="text-xs font-medium text-red-400" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Incorrect password</motion.span>
                                    )}
                                    {!error && (
                                        <span className={`text-[11px] ${tertiaryText}`} style={{ textShadow: subtleShadow }}>Touch ID or Enter Password</span>
                                    )}
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Guest */}
                    <motion.button
                        onClick={() => guestLogin()}
                        className={`flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full text-[13px] font-medium ${secondaryText} hover:scale-[1.03] active:scale-[0.97]`}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
                            textShadow: subtleShadow,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <IoPerson size={14} />
                        <span>Continue as Guest</span>
                    </motion.button>
                </motion.div>

                {/* Bottom power buttons */}
                <motion.div
                    className="absolute bottom-8 z-10 flex items-center gap-8"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <div onClick={async () => { if (iselectron) await power.sleep(); }} className="group cursor-pointer">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all"
                            style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <IoMoon size={16} className={isDark ? 'text-white' : 'text-black/70'} />
                        </div>
                    </div>
                    <div onClick={async () => { if (iselectron) await power.restart(); else window.location.reload(); }} className="group cursor-pointer">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-all"
                            style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <IoRefresh size={16} className={isDark ? 'text-white' : 'text-black/70'} />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ====================================================================
    // CLASSIC LOCK SCREEN (unchanged from original)
    // ====================================================================
    if (ismobile) {
        const greeting = currentTime ? (
            currentTime.getHours() < 12 ? 'Good Morning' :
            currentTime.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
        ) : '';

        return (
            <div className="fixed inset-0 z-[800] flex flex-col items-center overflow-hidden font-mono">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${wallpaperurl}')` }} />
                <div className="absolute inset-0 z-[1] backdrop-blur-xl" style={{ background: islightbackground ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />

                <motion.div
                    className="absolute top-0 left-0 right-0 h-[2px] z-20"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                />

                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                />

                <motion.div className="absolute top-4 left-4 z-10" style={{ width: 20, height: 20, borderLeft: '2px solid var(--accent-color)', borderTop: '2px solid var(--accent-color)' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} />
                <motion.div className="absolute top-4 right-4 z-10" style={{ width: 20, height: 20, borderRight: '2px solid var(--accent-color)', borderTop: '2px solid var(--accent-color)' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />
                <motion.div className="absolute bottom-4 left-4 z-10" style={{ width: 20, height: 20, borderLeft: '2px solid var(--accent-color)', borderBottom: '2px solid var(--accent-color)' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} />
                <motion.div className="absolute bottom-4 right-4 z-10" style={{ width: 20, height: 20, borderRight: '2px solid var(--accent-color)', borderBottom: '2px solid var(--accent-color)' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ delay: 0.9, type: 'spring' }} />

                <motion.div
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0.25, x: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <div style={{ width: 2, height: 30, background: 'var(--accent-color)' }} />
                    <div style={{ width: 5, height: 5, background: 'var(--accent-color)' }} />
                    <div style={{ width: 2, height: 20, background: 'var(--accent-color)' }} />
                </motion.div>
                <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 0.25, x: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <div style={{ width: 2, height: 20, background: 'var(--accent-color)' }} />
                    <div style={{ width: 5, height: 5, background: 'var(--accent-color)' }} />
                    <div style={{ width: 2, height: 30, background: 'var(--accent-color)' }} />
                </motion.div>

                <div className="h-12 w-full z-10" />

                <motion.div
                    className="z-10 mt-4 mb-2 relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute inset-0 border border-pastel-red/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="w-10 h-10 flex items-center justify-center border border-pastel-red/40 bg-pastel-red/10"
                        style={{ boxShadow: '0 4px 20px rgba(237,135,150,0.4), 0 0 40px rgba(237,135,150,0.15)' }}>
                        <IoLockClosed className="text-pastel-red text-lg" />
                    </div>
                </motion.div>

                <motion.div
                    className="z-10 flex flex-col items-center mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className={`text-8xl font-bold tracking-tighter ${textColor}`}
                        style={{ textShadow: islightbackground ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 16px rgba(0,0,0,0.6), 0 4px 32px rgba(0,0,0,0.3)' }}>
                        {timeStr}
                    </h1>
                    <div className="w-20 h-[2px] mt-3 mb-2" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
                    <p className={`text-base font-medium ${textMutedColor}`}
                        style={{ textShadow: islightbackground ? 'none' : '0 1px 8px rgba(0,0,0,0.5)' }}>{dateStr}</p>
                </motion.div>

                <motion.p
                    className={`z-10 text-sm font-medium tracking-wider uppercase mb-4 ${textMutedColor}`}
                    style={{ textShadow: textShadowSm }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.4 }}
                >
                    {greeting}
                </motion.p>

                <div className="z-20 w-full px-8 flex flex-col items-center gap-4 flex-1 justify-center">
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
                                    className={`relative w-20 h-20 overflow-hidden border-2 transition-all duration-300 ${selectedUser?.username === u.username ? 'border-pastel-red' : 'border-white/30'}`}
                                    style={{
                                        boxShadow: selectedUser?.username === u.username
                                            ? '0 8px 32px rgba(237,135,150,0.5), 0 0 60px rgba(237,135,150,0.2)'
                                            : '0 4px 20px rgba(0,0,0,0.3)',
                                        background: islightbackground ? '#E5E5EA' : '#2C2C2E',
                                    }}
                                >
                                    <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                                </div>
                                <span className={`text-[13px] font-medium ${textColor}`}
                                    style={{ textShadow: textShadowSm }}>{u.name}</span>
                            </motion.div>
                        ))}
                        <motion.div
                            onClick={() => guestLogin()}
                            className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                            animate={{ scale: 0.9, opacity: 0.5 }}
                            whileTap={{ scale: 0.85 }}
                        >
                            <div className="relative w-20 h-20 bg-black/20 flex items-center justify-center border-2 border-white/20"
                                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                                <IoPerson size={32} className={islightbackground ? 'text-black/50' : 'text-white/70'} />
                            </div>
                            <span className={`text-[13px] font-medium ${textColor}`}
                                style={{ textShadow: textShadowSm }}>Guest</span>
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
                                    className="relative"
                                >
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-black/20 border-2 border-white/20 focus:border-pastel-red py-3 px-4 pr-12 outline-none text-white placeholder-white/50 transition-all duration-300"
                                        style={{
                                            WebkitTextFillColor: 'white',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                            caretColor: 'white'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!password || isSubmitting}
                                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-all duration-300
                                            ${password ? 'bg-pastel-red text-white' : 'bg-transparent text-transparent'}`}
                                        style={password ? { boxShadow: '0 0 16px rgba(237,135,150,0.5)' } : {}}
                                    >
                                        {!isSubmitting && <IoArrowForward size={16} />}
                                        {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />}
                                    </button>
                                </motion.div>
                                <div className="h-5 mt-2 text-center">
                                    {error && <span className="text-xs font-medium text-pastel-red" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Incorrect password</span>}
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full flex flex-col items-center pb-8 z-10 gap-3 mt-auto">
                    <motion.p
                        className={`text-[10px] tracking-[0.2em] uppercase font-medium ${textMutedColor}`}
                        style={{ textShadow: textShadowSm }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1 }}
                    >
                        NextarOS
                    </motion.p>
                    <div className="w-20 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[800] flex flex-col items-center justify-center text-[--text-color] font-mono overflow-hidden">
            <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${wallpaperurl}')` }} />
            <div className="absolute inset-0 z-[1] backdrop-blur-xl" style={{ background: islightbackground ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />

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

            <motion.div className="absolute top-6 left-6 z-10" style={{ width: 32, height: 32, borderLeft: '2px solid var(--accent-color)', borderTop: '2px solid var(--accent-color)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} />
            <motion.div className="absolute top-6 right-6 z-10" style={{ width: 32, height: 32, borderRight: '2px solid var(--accent-color)', borderTop: '2px solid var(--accent-color)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />
            <motion.div className="absolute bottom-6 left-6 z-10" style={{ width: 32, height: 32, borderLeft: '2px solid var(--accent-color)', borderBottom: '2px solid var(--accent-color)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} />
            <motion.div className="absolute bottom-6 right-6 z-10" style={{ width: 32, height: 32, borderRight: '2px solid var(--accent-color)', borderBottom: '2px solid var(--accent-color)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ delay: 0.9, type: 'spring' }} />

            <motion.div
                className="absolute left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.3, x: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div style={{ width: 2, height: 60, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
                <div style={{ width: 8, height: 8, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
                <div style={{ width: 2, height: 40, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
            </motion.div>
            <motion.div
                className="absolute right-8 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.3, x: 0 }}
                transition={{ delay: 0.9 }}
            >
                <div style={{ width: 2, height: 40, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
                <div style={{ width: 8, height: 8, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
                <div style={{ width: 2, height: 60, background: 'var(--accent-color)', filter: 'drop-shadow(0 0 6px rgba(237,135,150,0.4))' }} />
            </motion.div>

            <motion.div
                className="z-10 absolute top-16 flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <span className={`text-8xl font-bold tracking-tight ${textColor}`}
                    style={{ textShadow: islightbackground ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 16px rgba(0,0,0,0.6), 0 4px 32px rgba(0,0,0,0.3)' }}>
                    {timeStr}
                </span>
                <div className="w-20 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)', filter: 'drop-shadow(0 0 4px rgba(237,135,150,0.4))' }} />
                <span className={`text-xl font-medium ${textMutedColor}`}
                    style={{ textShadow: islightbackground ? '0 1px 4px rgba(0,0,0,0.08)' : '0 1px 8px rgba(0,0,0,0.5)' }}>{dateStr}</span>
            </motion.div>

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
                                className={`relative w-24 h-24 overflow-hidden border-2 transition-all duration-300 ${selectedUser?.username === u.username ? 'border-pastel-red' : 'border-white/30'}`}
                                style={{
                                    boxShadow: selectedUser?.username === u.username
                                        ? '0 8px 32px rgba(237,135,150,0.5), 0 0 60px rgba(237,135,150,0.2)'
                                        : '0 4px 20px rgba(0,0,0,0.3)',
                                    background: islightbackground ? '#E5E5EA' : '#2C2C2E',
                                }}
                            >
                                <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                            </div>
                            <span className={`text-base font-medium ${textColor}`}
                                style={{ textShadow }}>{u.name}</span>
                        </motion.div>
                    ))}

                    <motion.div
                        onClick={() => guestLogin()}
                        className="flex flex-col items-center gap-3 cursor-pointer"
                        animate={{ scale: 0.9, opacity: 0.5 }}
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ scale: 0.85 }}
                    >
                        <div className="w-24 h-24 bg-black/20 flex items-center justify-center border-2 border-white/20"
                            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                            <IoPerson size={40} className={islightbackground ? 'text-black/50' : 'text-white/70'} />
                        </div>
                        <span className={`text-base font-medium ${textColor}`}
                            style={{ textShadow }}>Guest User</span>
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
                                    className="w-full bg-black/20 border-2 border-white/20 focus:border-pastel-red py-2 outline-none text-[13px] pl-4 pr-10 appearance-none text-white placeholder-white/50 transition-all duration-300"
                                    style={{
                                        WebkitTextFillColor: 'white',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                        caretColor: 'white'
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!password || isSubmitting}
                                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center transition-all duration-300
                                        ${password ? 'bg-pastel-red text-white' : 'bg-transparent text-transparent'}`}
                                    style={password ? { boxShadow: '0 0 16px rgba(237,135,150,0.5)' } : {}}
                                >
                                    {!isSubmitting && <IoArrowForward size={14} />}
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin" />}
                                </button>
                            </motion.div>

                            <div className="h-6 mt-2">
                                {error && <span className="text-xs font-medium text-pastel-red" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Incorrect password</span>}
                                {!error && <span className="text-[10px]" style={{ color: islightbackground ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)', textShadow: textShadowSm }}>Touch ID or Enter Password</span>}
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div
                className="absolute bottom-10 flex gap-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div onClick={async () => { if (iselectron) await power.sleep(); }} className="cursor-pointer group">
                    <div className="w-11 h-11 bg-black/20 border border-white/20 flex items-center justify-center group-hover:border-accent transition-all duration-300"
                        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(237,135,150,0.4)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                    >
                        <IoMoon size={18} className={islightbackground ? 'text-black/70' : 'text-white/90'} />
                    </div>
                </div>
                <div onClick={async () => { if (iselectron) await power.restart(); else window.location.reload(); }} className="cursor-pointer group">
                    <div className="w-11 h-11 bg-black/20 border border-white/20 flex items-center justify-center group-hover:border-accent transition-all duration-300"
                        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(237,135,150,0.4)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                    >
                        <IoRefresh size={18} className={islightbackground ? 'text-black/70' : 'text-white/90'} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
