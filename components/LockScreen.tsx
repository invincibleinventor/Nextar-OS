'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from './AuthContext';
import { getUsers, User } from '../utils/db';
import { hashPassword } from '../utils/crypto';
import { useDevice } from './DeviceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowForward, IoLockClosed, IoPerson, IoInformationCircleOutline } from 'react-icons/io5';

export default function LockScreen() {
    const { login, user, isLoading: authLoading, guestLogin } = useAuth();
    const { setosstate, osstate, ismobile } = useDevice();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);

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
            } catch (err) {
                console.error("Failed to fetch users", err);
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

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmitting || !selectedUser) return;

        setIsSubmitting(true);
        setError(false);

        setTimeout(async () => {
             const hashedInput = await hashPassword(password);
            const isValid = selectedUser.passwordHash === hashedInput;

            if (!isValid) {
                setError(true);
                setIsSubmitting(false);
                setTimeout(() => setError(false), 500);
            } else {
              
                const success = await login(password);
                if (!success) {
                    setError(true);
                    setIsSubmitting(false);
                } else {
                    if (selectedUser?.username) {
                        localStorage.setItem('lastLoggedInUser', selectedUser.username);
                    }
                }
            }
        }, 600);
    };

    if (user && osstate === 'unlocked') return null;
    if (authLoading || loadingUsers) return null;
    if (osstate === 'booting') return null;

    if (ismobile) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center bg-black overflow-hidden font-sf">
                <div className="absolute inset-0 z-0 bg-[url('/bg.jpg')] bg-cover bg-center filter blur-md brightness-75"></div>

                <div className="h-12 w-full z-10"></div>

                <div className="z-10 mt-8 mb-4">
                    <IoLockClosed className="text-white text-3xl opacity-80" />
                </div>

                <div className="z-10 flex flex-col items-center mb-8">
                    <h1 className="text-7xl font-semibold text-white tracking-wide drop-shadow-lg">
                        {currentTime?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
                    </h1>
                    <p className="text-lg text-white font-semibold mt-2 drop-shadow-md">
                        {currentTime?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="z-20 w-full px-8 flex flex-col items-center gap-6 flex-1 justify-center">
                    <div className="flex items-center gap-6 overflow-x-auto w-full justify-center py-4 no-scrollbar">
                        {users.map(u => (
                            <div
                                key={u.username}
                                onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                                className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 shrink-0
                                    ${selectedUser?.username === u.username ? 'scale-110 opacity-100' : 'scale-90 opacity-60'}`}
                            >
                                <div className={`relative w-20 h-20 rounded-full overflow-hidden shadow-xl border-2 ${selectedUser?.username === u.username ? 'border-white' : 'border-transparent'}`}>
                                    <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                                </div>
                                <span className="text-sm font-medium text-white">{u.name}</span>
                            </div>
                        ))}
                        <div
                            onClick={() => guestLogin()}
                            className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 shrink-0 scale-90 opacity-60"
                        >
                            <div className="relative w-20 h-20 rounded-full bg-gray-600/50 backdrop-blur-md flex items-center justify-center shadow-xl border-2 border-transparent">
                                <IoPerson size={32} className="text-white/80" />
                            </div>
                            <span className="text-sm font-medium text-white">Guest</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedUser && (
                            <motion.form
                                key={selectedUser.username}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleLogin}
                                className="w-full max-w-[280px] relative mt-4"
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
                                        className="w-full bg-white/10 hover:bg-white/20 focus:bg-white/20 transition-colors backdrop-blur-xl border border-white/20 rounded-full py-3 px-4 outline-none placeholder-white/40 text-white"
                                    />
                                </motion.div>
                                <button type="submit" className="hidden" />
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full flex flex-col items-center pb-8 z-10 gap-6 mt-auto">
                    <div className="w-32 h-1 bg-white rounded-full opacity-50"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black text-white font-sf">
            <div className="absolute inset-0 z-0 bg-[url('/bg.jpg')] bg-cover bg-center">
                <div className="absolute inset-0 backdrop-blur-2xl bg-black/20"></div>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-md">
                <div className="flex items-center gap-8 mt-32 mb-10 overflow-x-auto p-4 mask-fade">
                    {users.map(u => (
                        <div
                            key={u.username}
                            onClick={() => { setSelectedUser(u); setPassword(''); setError(false); }}
                            className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300
                                ${selectedUser?.username === u.username ? 'scale-110 opacity-100' : 'scale-90 opacity-60 hover:opacity-80'}`}
                        >
                            <div className={`relative w-24 h-24 rounded-full overflow-hidden  border-2 transition-colors ${selectedUser?.username === u.username ? 'border-white' : 'border-transparent'}`}>
                                <Image src={u.avatar || "/pfp.png"} alt={u.name} fill className="object-cover" />
                            </div>
                            <span className="text-lg font-medium drop-shadow-md">{u.name}</span>
                        </div>
                    ))}

                    <div
                        onClick={() => {
                            guestLogin();
                        }}
                        className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 scale-90 opacity-60 hover:opacity-80`}
                    >
                        <div className="w-24 h-24 rounded-full bg-gray-500/50 backdrop-blur-md flex items-center justify-center border-2 border-transparent shadow-2xl">
                            <IoPerson size={40} className="text-white/80" />
                        </div>
                        <span className="text-lg font-medium drop-shadow-md">Guest User</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {selectedUser && (
                        <motion.form
                            key={selectedUser.username}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleLogin}
                            className="w-full max-w-[240px] relative flex flex-col items-center"
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
                                    className="w-full bg-white/20 hover:bg-white/25 focus:bg-white/25 transition-colors backdrop-blur-md border border-white/10 rounded-full py-1.5  outline-none placeholder-white/50 shadow-inner text-sm pl-4 appearance-none"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!password || isSubmitting}
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all
                                        ${password ? 'bg-white text-black' : 'bg-transparent text-transparent'}`}
                                >
                                    {!isSubmitting && <IoArrowForward size={14} />}
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                                </button>
                            </motion.div>

                            <div className="h-6 mt-2">
                                {error && <span className="text-xs font-medium text-red-300 drop-shadow-md">Incorrect password</span>}
                                {!error && <span className="text-[10px] text-white/40">Touch ID or Enter Password</span>}
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute top-32 flex flex-col items-center gap-1">
                <span className="text-8xl font-bold tracking-tight drop-shadow-xl text-white/90">{currentTime?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                <span className="text-xl text-white/80 font-semibold drop-shadow-md">
                    {currentTime?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-4">
                <div className="flex gap-6">
                    <div className="flex flex-col items-center gap-1 cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <IoLockClosed size={18} />
                        </div>
                        <span className="text-[10px] font-medium opacity-60">Sleep</span>
                    </div>
                    <div onClick={()=>window.location.reload()} className="flex flex-col items-center gap-1 cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <IoInformationCircleOutline size={20} />
                        </div>
                        <span className="text-[10px] font-medium opacity-60">Restart</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
