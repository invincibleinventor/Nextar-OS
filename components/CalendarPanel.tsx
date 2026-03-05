'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassCard } from './hooks/useClayStyles';
import MiniCalendar from './ui/MiniCalendar';

export default function CalendarPanel({ isopen, onclose }: { isopen: boolean; onclose: () => void }) {
    const { osstate, ismobile } = useDevice();
    const clay = useIsClay();
    const [mounted, setmounted] = useState(false);
    const [now, setnow] = useState(new Date());

    useEffect(() => {
        setmounted(true);
        return () => { setmounted(false); };
    }, []);

    useEffect(() => {
        if (!isopen) return;
        setnow(new Date());
        const interval = setInterval(() => setnow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isopen]);

    if (!mounted || osstate !== 'unlocked' || ismobile) return null;

    const timestr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const datestr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return createPortal(
        <>
            {isopen && (
                <div className="fixed inset-0 z-[699]" onClick={onclose} />
            )}

            <AnimatePresence>
                {isopen && clay && (
                    <motion.div
                        key="calendar-panel"
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed z-[700] top-[46px] right-3 w-[300px] overflow-hidden flex flex-col rounded-[18px]"
                        style={{
                            ...glassPanel,
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 pt-4 pb-1">
                            <div className="text-[32px] font-semibold text-[--text-color] leading-none tracking-tight">
                                {timestr}
                            </div>
                            <div className="text-[13px] text-[--text-muted] font-medium mt-1">
                                {datestr}
                            </div>
                        </div>
                        <div className="mx-3 mb-3 p-2 rounded-[14px]" style={glassCard}>
                            <MiniCalendar />
                        </div>
                    </motion.div>
                )}

                {isopen && !clay && (
                    <motion.div
                        key="calendar-panel-classic"
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed z-[700] top-[40px] right-3 w-[280px] overflow-hidden flex flex-col bg-surface border border-[--border-color]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 pt-4 pb-2">
                            <div className="text-[28px] font-bold text-[--text-color] leading-none">
                                {timestr}
                            </div>
                            <div className="text-[13px] text-[--text-muted] font-medium mt-1">
                                {datestr}
                            </div>
                        </div>
                        <div className="mx-3 mb-3">
                            <MiniCalendar />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
