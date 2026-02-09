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
                        className="fixed inset-0"
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
                        style={{ zIndex: 2147483647 }}
                        className="fixed inset-0 flex flex-col w-full pointer-events-auto"
                    >
                        <div
                            className="flex flex-col w-full h-full"
                            style={{ backgroundColor: 'var(--bg-surface)' }}
                        >
                            <div className="flex flex-col items-center mt-16 mb-6 shrink-0">
                                <h1 className="text-7xl font-medium text-[--text-color] tracking-tight">{time.split(' ')[0]}</h1>
                                <div className="text-xl text-[--text-muted] font-medium mt-1">{date}</div>
                            </div>

                            <div className="w-full px-4 flex-1 min-h-0 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="text-center text-[--text-muted] mt-8 mb-4 text-lg font-medium">No Notifications</div>
                                ) : (
                                    <div className="flex flex-col gap-3 max-w-md mx-auto pt-2 pb-8">
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
                                                    className="w-full bg-overlay border border-[--border-color] anime-accent-left p-4 active:scale-[0.98] transition-transform relative overflow-hidden"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-[42px] h-[42px] overflow-hidden shrink-0">
                                                            <Image src={n.icon} width={42} height={42} className="w-full h-full object-cover" alt={n.appname} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex justify-between items-baseline mb-0.5">
                                                                <span className="text-[15px] font-semibold text-[--text-color] truncate">{n.appname}</span>
                                                                <span className="text-[13px] text-[--text-muted]">{n.time}</span>
                                                            </div>
                                                            <h3 className="text-[15px] font-semibold text-[--text-color] leading-tight mb-0.5">{n.title}</h3>
                                                            <p className="text-[15px] text-[--text-color] opacity-80 leading-snug line-clamp-3">{n.description}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            <div className="w-16 h-1.5 bg-[--text-muted]/40 mx-auto mb-3 mt-2 rounded-full shrink-0" />
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
                            className="w-full max-w-[400px] bg-overlay border border-[--border-color] p-3 cursor-pointer select-none pointer-events-auto"
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 50) markasviewed(n.id); }}
                        >
                            <div className="flex items-start gap-3">
                                <Image src={n.icon} width={36} height={36} className="w-9 h-9 object-cover" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-[13px] text-[--text-color] leading-tight">{n.appname}</h4>
                                        <span className="text-[10px] text-[--text-muted]">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[13px] text-[--text-color] leading-tight">{n.title}</h4>
                                    <p className="text-[12px] text-[--text-muted] leading-snug mt-0.5 line-clamp-2">{n.description}</p>
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
            <div style={{ zIndex: 2147483647 }} className="fixed top-14 right-4 flex flex-col items-end space-y-2 pointer-events-none">
                <AnimatePresence>
                    {unviewednotifications.slice(0, 4).map((n) => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.15 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="group relative w-[340px] bg-overlay border border-[--border-color] anime-accent-left anime-glow-sm p-4 cursor-pointer select-none pointer-events-auto"
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); markasviewed(n.id); }}
                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-overlay hover:bg-[--border-color] text-[--text-color]  flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <IoClose size={14} />
                            </button>

                            <div className="flex items-start gap-3">
                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 object-cover" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-[11px] uppercase tracking-wide text-[--text-muted]">{n.appname}</span>
                                        <span className="text-[10px] text-[--text-muted]">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[14px] text-[--text-color] leading-tight">{n.title}</h4>
                                    <p className="text-[13px] text-[--text-color] leading-snug mt-0.5 line-clamp-2">{n.description}</p>
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
                            className="fixed top-0 right-0 bottom-0 z-[999999] w-[380px] h-full bg-surface border-l-2 border-accent/30 overflow-hidden flex flex-col"
                        >
                            <div className="px-5 pt-12 pb-4  shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold text-[--text-color]">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => clearallnotifications()}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[--text-muted] hover:text-[--text-color] hover:bg-overlay transition-colors"
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
                                        <div className="w-16 h-16  bg-overlay flex items-center justify-center mb-4">
                                            <IoNotificationsOutline size={28} className="text-pastel-lavender" />
                                        </div>
                                        <p className="text-[--text-muted] font-medium">No Notifications</p>
                                        <p className="text-[--text-muted] text-sm mt-1">You&apos;re all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <motion.div
                                            key={n.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="group relative w-full bg-overlay border border-[--border-color] anime-accent-left p-4 transition-all cursor-pointer"
                                            onClick={() => handlenotificationclick(n)}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearnotification(n.id); }}
                                                className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-overlay transition-all"
                                            >
                                                <IoClose size={14} className="text-[--text-muted]" />
                                            </button>

                                            <div className="flex items-start gap-3">
                                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 shrink-0" alt={n.appname} />
                                                <div className="flex-1 min-w-0 text-left pr-6">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold text-[11px] uppercase tracking-wide text-[--text-muted]">{n.appname}</span>
                                                        <span className="text-[10px] text-[--text-muted]">{n.time}</span>
                                                    </div>
                                                    <h4 className="font-semibold text-[14px] text-[--text-color] leading-tight">{n.title}</h4>
                                                    <p className="text-[13px] text-[--text-color] leading-snug mt-1">{n.description}</p>
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
