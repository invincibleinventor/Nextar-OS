'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usedevice } from './DeviceContext';
import { IoMdCamera, IoMdFlashlight } from "react-icons/io";
import { usenotifications } from './NotificationContext';

export default function LockScreen() {
    const { osstate, setosstate, ismobile } = usedevice();
    const [password, setpassword] = useState('');
    const [error, seterror] = useState(false);
    const [hint, sethint] = useState(false);
    const inputref = useRef<HTMLInputElement>(null);
    const [shaking, setshaking] = useState(false);
    const [time, settime] = useState(new Date());
    const [dragy, setdragy] = useState(0);
    const { notifications } = usenotifications();

    useEffect(() => {
        const timer = setInterval(() => settime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handlelogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (password === '' || password === '1234' || password === 'user') {
            setosstate('unlocked');
        } else {
            setshaking(true);
            setTimeout(() => {
                setshaking(false);
                setpassword('');
            }, 500);
        }
    };

    if (osstate === 'unlocked' || osstate === 'booting') return null;

    const formatteddate = time.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timestring = `${hours}:${minutes}`;

    return (
        <AnimatePresence>
            {osstate === 'locked' && (
                <motion.div
                    key="lockscreen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 1.02, transition: { duration: 0.4 } }}
                    className="fixed inset-0 bg-cover bg-no-repeat dark:bg-[url('/bg-dark.jpg')] bg-[url('/bg.jpg')] z-[9990] flex flex-col items-center text-white select-none"

                >
                    {!ismobile && <div className="absolute inset-0 bg-black/20 backdrop-blur-[80px]" />}

                    {!ismobile && (
                        <div className="relative z-10 flex flex-col items-center justify-between h-full pt-20 pb-20">
                            <div className="flex flex-col items-center mt-6">
                                <h1 className="text-[7rem] xl:text-[9rem] leading-none text-white/90 font-bold font-sf tracking-tight drop-shadow-2xl select-none">{timestring}</h1>
                                <h2 className="text-xl xl:text-2xl text-white/80 font-semibold mt-2 drop-shadow-lg select-none">{formatteddate}</h2>
                            </div>

                            <div className="flex flex-col items-center mb-10">
                                <div className="w-24 h-24 rounded-full mb-5 shadow-2xl relative group overflow-hidden border border-white/10">
                                    <img src="/pfp.png" className="w-full h-full object-cover" alt="User Profile" />
                                </div>
                                <div className="text-xl text-white font-semibold mb-5 drop-shadow-md tracking-wide">Administrator</div>

                                <motion.form
                                    onSubmit={handlelogin}
                                    animate={shaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                                >
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setpassword(e.target.value)}
                                            placeholder="Enter Password"
                                            className="w-48 bg-black/20 backdrop-blur-xl rounded-full px-4 py-1.5 text-white placeholder-white/30 text-center text-[13px] outline-none border border-white/5 focus:bg-black/30 transition-all shadow-inner"
                                            autoComplete="off"
                                            data-lpignore="true"
                                            autoFocus
                                            onBlur={(e) => e.target.focus()}
                                        />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </button>
                                    </div>
                                </motion.form>
                                <div className="mt-8 text-white/50 text-[11px] font-medium cursor-pointer hover:text-white transition-colors flex flex-col items-center gap-2">
                                    <span>Touch ID or Enter Password</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {ismobile && (
                        <motion.div
                            className="relative z-10 flex flex-col items-center justify-between h-full w-full pt-20 pb-4"
                            drag="y"
                            dragConstraints={{ top: -200, bottom: 0 }}
                            dragElastic={0.3}
                            onDrag={(_, info) => {
                                setdragy(info.offset.y);
                            }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y < -100) {
                                    setosstate('unlocked');
                                }
                                setdragy(0);
                            }}
                            animate={{ y: 0 }}
                            style={{ opacity: 1 - Math.abs(dragy) / 300 }}
                        >
                            <div className="flex flex-col items-center space-y-4 w-full px-4">
                                <div className="text-white text-8xl font-bold mb-2 drop-shadow-lg font-sf tracking-tight">
                                    {timestring}
                                </div>
                                <div className="text-white/80 text-xl font-medium drop-shadow-md">
                                    {formatteddate}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="w-full flex hidden flex-col items-center space-y-2 mt-4">
                                        {notifications.slice(0, 3).map(n => (
                                            <div key={n.id} className="w-full max-w-sm bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center space-x-3 shadow-sm">
                                                <img src={n.icon} className="w-8 h-8 rounded-lg" alt={n.appname} />
                                                <div className="flex-1 min-w-0 text-white text-left">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-xs font-bold">{n.appname}</span>
                                                        <span className="text-[10px] opacity-70">{n.time}</span>
                                                    </div>
                                                    <div className="text-xs opacity-90 truncate">{n.title}</div>
                                                    <div className="text-[10px] opacity-70 truncate">{n.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-3 pb-6">
                                <div className="text-[12px] font-medium uppercase tracking-[0.15em] opacity-70">
                                    Swipe up to unlock
                                </div>
                                <motion.div
                                    className="w-36 h-[5px] bg-white rounded-full"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>

                            <div className="absolute bottom-12 w-full px-10 flex justify-between pointer-events-auto">
                                <button className="w-14 h-14 bg-black/30 backdrop-blur-2xl rounded-full flex items-center justify-center active:scale-95 transition-transform">
                                    <IoMdFlashlight size={24} />
                                </button>
                                <button className="w-14 h-14 bg-black/30 backdrop-blur-2xl rounded-full flex items-center justify-center active:scale-95 transition-transform">
                                    <IoMdCamera size={24} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
