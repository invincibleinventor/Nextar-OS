'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from './SettingsContext';
import { useNotifications } from './NotificationContext';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { notifications, clearnotification, handlenotificationclick } = useNotifications();
    const { reducemotion, reducetransparency } = useSettings();

    const formattime = () => {
        const date = new Date();
        return {
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }),
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    };
    const { time, date } = formattime();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="notification-center"
                    initial={{ y: '-100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    transition={{
                        type: reducemotion ? "tween" : "spring",
                        stiffness: reducemotion ? undefined : 250,
                        damping: reducemotion ? undefined : 25,
                        duration: reducemotion ? 0.3 : undefined
                    }}
                    drag="y"
                    dragConstraints={{ top: -1000, bottom: 0 }}
                    dragElastic={0.05}
                    onDragEnd={(_, info) => {
                        if (info.offset.y < -100 || info.velocity.y < -500) {
                            onClose();
                        }
                    }}
                    className={`absolute inset-0 z-[60] flex flex-col h-full w-full pointer-events-auto ${reducetransparency ? 'bg-neutral-900' : 'backdrop-blur-2xl bg-white/70 dark:bg-black/60'
                        }`}
                >
                    <div className="flex flex-col items-center mt-16 mb-8 shrink-0">
                        <h1 className="text-7xl font-medium text-neutral-700 dark:text-white tracking-tight drop-shadow-lg">{time.split(' ')[0]}</h1>
                        <div className="text-xl text-black/40 dark:text-white/90 font-medium mt-1 drop-shadow-md">{date}</div>
                    </div>

                    <div className="flex-1 w-full px-4  pb-24">
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
                                            onClick={() => {
                                                handlenotificationclick(n);
                                                onClose();
                                            }}
                                            className="w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl rounded-[20px] p-4 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-[42px] h-[42px] rounded-[10px] bg-white overflow-hidden shrink-0 shadow-sm">
                                                    <img src={n.icon} className="w-full h-full object-cover" alt={n.appName} />
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="text-[15px] font-semibold text-black dark:text-white truncate">{n.appName}</span>
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
            )
            }
        </AnimatePresence >
    );
}
