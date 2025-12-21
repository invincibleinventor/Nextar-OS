'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useNotifications } from './NotificationContext';
import { useDevice } from './DeviceContext';
import { useEffect, useState } from 'react';
import { IoClose, IoNotificationsOutline, IoTrashOutline } from 'react-icons/io5';

export default function NotificationCenter({ isopen, onclose }: { isopen: boolean; onclose: () => void }) {
    const { handlenotificationclick, notifications, clearnotification, clearallnotifications, markasviewed, version } = useNotifications();
    const { ismobile, osstate } = useDevice();
    const [mounted, setmounted] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        setmounted(true);
        const timer = setTimeout(() => setTick(t => t + 1), 500);
        return () => { setmounted(false); clearTimeout(timer); }
    }, []);

    useEffect(() => {
        if (!notifications) return;
        setTick(v => v + 1);
    }, [version, notifications]);

    const unviewednotifications = notifications.filter(n => !n.viewed);

    useEffect(() => {
        if (osstate !== 'unlocked' || unviewednotifications.length === 0) return;

        const timers = unviewednotifications.map(n => {
            return setTimeout(() => {
                markasviewed(n.id);
            }, 5000);
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [osstate, unviewednotifications, markasviewed]);

    if (!mounted) return null;
    if (osstate !== 'unlocked') return null;

    const formattime = () => {
        const date = new Date();
        return {
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }),
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    };

    if (ismobile) {
        const { time, date } = formattime();

        if (isopen) {
            return createPortal(
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ zIndex: 2147483647 }}
                        className="fixed inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm"
                        onClick={onclose}
                    />

                    <motion.div
                        key="notification-center"
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 40, mass: 1 }}
                        drag="y"
                        dragConstraints={{ top: -1000, bottom: 0 }}
                        dragElastic={0.05}
                        onDragEnd={(_, info) => {
                            if (info.offset.y < -100 || info.velocity.y < -500) {
                                onclose();
                            }
                        }}
                        onClick={onclose}
                        style={{ zIndex: 2147483647 }}
                        className="fixed inset-0 flex flex-col h-full w-full pointer-events-auto"
                    >
                        <div className="flex flex-col items-center mt-16 mb-8 shrink-0">
                            <h1 className="text-7xl font-medium text-neutral-700 dark:text-white tracking-tight drop-shadow-lg">{time.split(' ')[0]}</h1>
                            <div className="text-xl text-black/40 dark:text-white/90 font-medium mt-1 drop-shadow-md">{date}</div>
                        </div>

                        <div className="flex-1 w-full px-4 pb-24">
                            {notifications.length === 0 ? (
                                <div className="text-center text-black/50 dark:text-white/50 mt-10 text-lg font-medium">No Notifications</div>
                            ) : (
                                <div className="flex flex-col gap-3 max-w-md mx-auto">
                                    <AnimatePresence mode='popLayout'>
                                        {notifications.map((n) => (
                                            <motion.div
                                                key={n.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                drag="x"
                                                dragConstraints={{ left: -1000, right: 1000 }}
                                                onDragEnd={(_, info) => {
                                                    if (Math.abs(info.offset.x) > 80) {
                                                        clearnotification(n.id);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlenotificationclick(n);
                                                    onclose();
                                                }}
                                                className="w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl rounded-[20px] p-4 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-[42px] h-[42px] rounded-[10px] bg-white overflow-hidden shrink-0 shadow-sm">
                                                        <Image src={n.icon} width={42} height={42} className="w-full h-full object-cover" alt={n.appname} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <div className="flex justify-between items-baseline mb-0.5">
                                                            <span className="text-[15px] font-semibold text-black dark:text-white truncate">{n.appname}</span>
                                                            <span className="text-[13px] text-black/60 dark:text-white/60">{n.time}</span>
                                                        </div>
                                                        <h3 className="text-[15px] font-semibold text-black dark:text-white leading-tight mb-0.5">{n.title}</h3>
                                                        <p className="text-[15px] text-black/80 dark:text-white/80 leading-snug line-clamp-3">{n.description}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>,
                document.body
            );
        }

        return createPortal(
            <div style={{ zIndex: 2147483647 }} className="fixed top-12 left-2 right-2 flex flex-col items-center space-y-2 pointer-events-none">
                <AnimatePresence>
                    {unviewednotifications.slice(0, 3).map((n) => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                            className="w-full max-w-[400px] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl rounded-2xl p-3 cursor-pointer select-none pointer-events-auto"
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 50) markasviewed(n.id); }}
                        >
                            <div className="flex items-start gap-3">
                                <Image src={n.icon} width={36} height={36} className="w-9 h-9 rounded-xl object-cover" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-[13px] text-black dark:text-white leading-tight">{n.appname}</h4>
                                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[13px] text-black dark:text-white leading-tight">{n.title}</h4>
                                    <p className="text-[12px] text-neutral-600 dark:text-neutral-300 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>,
            document.body
        );
    }

    return createPortal(
        <>
            <div style={{ zIndex: 2147483647 }} className="fixed top-8 right-4 flex flex-col items-end space-y-2 pointer-events-none">
                <AnimatePresence>
                    {unviewednotifications.slice(0, 4).map((n) => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.15 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="group relative w-[340px] bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-2xl p-4 cursor-pointer select-none pointer-events-auto border border-black/5 dark:border-white/10"
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); markasviewed(n.id); }}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-600 dark:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                                <IoClose size={14} />
                            </button>

                            <div className="flex items-start gap-3">
                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{n.appname}</span>
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[14px] text-black dark:text-white leading-tight">{n.title}</h4>
                                    <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isopen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 w-screen h-screen z-[999998] pointer-events-auto"
                            onClick={onclose}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            className="fixed top-0 right-0 bottom-0 z-[999999] w-[380px] h-full bg-[#f5f5f7]/40 backdrop-blur-lg dark:bg-[#1c1c1e]/40 border-l border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="px-5 pt-12 pb-4  shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold text-black dark:text-white">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => clearallnotifications()}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-800 hover:text-neutral-700 dark:text-neutral-200 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <IoTrashOutline size={14} />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                            <IoNotificationsOutline size={28} className="text-neutral-400" />
                                        </div>
                                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">No Notifications</p>
                                        <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You&apos;re all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="group relative w-full bg-white/60 dark:bg-[#2c2c2e]/60 backdrop-blur-xl rounded-xl p-4 transition-all cursor-pointer border border-black/5 dark:border-white/5"
                                            onClick={() => handlenotificationclick(n)}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearnotification(n.id); }}
                                                className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
                                            >
                                                <IoClose size={14} className="text-neutral-500" />
                                            </button>

                                            <div className="flex items-start gap-3">
                                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 rounded-xl shrink-0" alt={n.appname} />
                                                <div className="flex-1 min-w-0 text-left pr-6">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold text-[11px] uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{n.appname}</span>
                                                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400">{n.time}</span>
                                                    </div>
                                                    <h4 className="font-semibold text-[14px] text-black dark:text-white leading-tight">{n.title}</h4>
                                                    <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-snug mt-1">{n.description}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
