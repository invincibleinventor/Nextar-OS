'use client';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useNotifications } from './NotificationContext';
import { useDevice } from './DeviceContext';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { IoClose, IoNotificationsOutline } from 'react-icons/io5';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassCard, glassButton } from './hooks/useClayStyles';
import { useWindows } from './WindowContext';

export default function NotificationCenter({ isopen, onclose }: { isopen: boolean; onclose: () => void }) {
    const { handlenotificationclick, handleactionclick, notifications, clearnotification, clearallnotifications, markasviewed, version } = useNotifications();
    const { ismobile, osstate } = useDevice();
    const clay = useIsClay();
    const { windows } = useWindows();
    const hasOpenApp = windows.some((w: any) => !w.isminimized);
    const [mounted, setmounted] = useState(false);

    useEffect(() => {
        setmounted(true);
        return () => { setmounted(false); }
    }, []);

    const unviewednotifications = notifications.filter(n => !n.viewed);

    // Group notifications by app for desktop panel
    const groupednotifications = useMemo(() => {
        const groups: { appname: string; icon: string; items: typeof notifications }[] = [];
        const map = new Map<string, typeof notifications>();
        for (const n of notifications) {
            if (!map.has(n.appname)) map.set(n.appname, []);
            map.get(n.appname)!.push(n);
        }
        for (const [appname, items] of map) {
            groups.push({ appname, icon: items[0].icon, items });
        }
        return groups;
    }, [notifications]);

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

    const dragControls = useDragControls();
    const contentscrollref = useRef<HTMLDivElement>(null);

    const handlecontentpointerdown = useCallback((e: React.PointerEvent) => {
        const el = contentscrollref.current;
        if (el && el.scrollTop <= 0) {
            dragControls.start(e);
        }
    }, [dragControls]);

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
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ zIndex: 700 }}
                        className={`fixed inset-0 ${clay ? (hasOpenApp ? 'bg-black/30' : 'bg-black/20 backdrop-blur-sm') : 'bg-black'}`}
                        onClick={onclose}
                        onPointerDown={(e) => dragControls.start(e)}
                    />

                    {/* Notch — visible above notification center */}
                    <div className="fixed top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] rounded-full bg-black"
                        style={{ zIndex: 702, boxShadow: '0 0 8px 2px rgba(0,0,0,0.4), inset 0 0 3px rgba(0,0,0,0.3)' }} />

                    <motion.div
                        key="notification-center"
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 40, mass: 1 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: -1000, bottom: 0 }}
                        dragElastic={0.05}
                        onDragEnd={(_, info) => {
                            if (info.offset.y < -100 || info.velocity.y < -500) {
                                onclose();
                            }
                        }}
                        style={{ zIndex: 700 }}
                        className="fixed top-0 left-0 right-0 flex flex-col w-full pointer-events-auto max-h-[85vh]"
                    >
                        <div
                            className="flex flex-col w-full h-full"
                            style={clay ? {
                                background: hasOpenApp ? 'var(--bg-base)' : 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 35%, transparent))',
                                ...(!hasOpenApp ? { backdropFilter: 'blur(var(--glass-blur-heavy))', WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))' } : {}),
                                borderRadius: '0 0 28px 28px',
                            } : {
                                background: 'var(--bg-surface)',
                                borderRadius: '0 0 28px 28px',
                            }}
                        >
                            {/* Header with time/date */}
                            <div className="px-5 pt-14 pb-3 shrink-0 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
                                <h1 className={`font-bold text-[--text-color] tracking-tight leading-none ${clay ? 'text-[42px] font-semibold' : 'text-[48px]'}`}>
                                    {time.split(' ')[0]}
                                </h1>
                                <p className="text-[14px] font-medium mt-1.5 text-[--text-color]">{date}</p>
                            </div>

                            {/* Section label + clear */}
                            <div className="px-5 pb-2 flex items-center justify-between shrink-0">
                                <span className="text-[13px] font-semibold text-[--text-color]">
                                    {notifications.length > 0 ? `${notifications.length} Notification${notifications.length > 1 ? 's' : ''}` : 'Notifications'}
                                </span>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => clearallnotifications()}
                                        className="text-[12px] font-semibold active:scale-95 transition-all text-[--text-color]"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Notification list — grouped by app */}
                            <div
                                ref={contentscrollref}
                                onPointerDown={handlecontentpointerdown}
                                className="w-full px-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', scrollbarWidth: 'none' as any }}
                            >
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 text-center">
                                        <div
                                            className="w-14 h-14 flex items-center justify-center mb-3 rounded-full"
                                            style={clay
                                                ? { background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)', border: '1px solid var(--glass-border)' }
                                                : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }
                                            }
                                        >
                                            <IoNotificationsOutline size={24} className="text-[--text-muted]" />
                                        </div>
                                        <p className="text-[15px] font-semibold text-[--text-color] mb-1">No Notifications</p>
                                        <p className="text-[13px] text-[--text-muted]">You&apos;re all caught up</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2.5 sm:max-w-md sm:mx-auto pb-4">
                                        {groupednotifications.map(group => (
                                            <div
                                                key={group.appname}
                                                className="overflow-hidden rounded-2xl"
                                                style={clay
                                                    ? { background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)', border: '1px solid var(--glass-border)' }
                                                    : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }
                                                }
                                            >
                                                {/* Group header */}
                                                <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-1.5">
                                                    <Image src={group.icon} width={22} height={22} className="w-[22px] h-[22px] rounded-md shrink-0" alt={group.appname} />
                                                    <span className="text-[12px] font-bold flex-1 uppercase tracking-wide text-[--text-color]">
                                                        {group.appname}
                                                    </span>
                                                    {group.items.length > 1 && (
                                                        <span className="text-[10px] font-bold text-[--text-color] opacity-50 px-2 py-0.5 rounded-full"
                                                            style={{ background: clay ? 'var(--bg-glass)' : 'var(--bg-surface)' }}>
                                                            {group.items.length}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Notifications in this group */}
                                                <AnimatePresence mode="popLayout">
                                                    {group.items.map((n, idx) => (
                                                        <motion.div
                                                            key={n.id}
                                                            layout
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            drag="x"
                                                            dragConstraints={{ left: -200, right: 200 }}
                                                            dragElastic={0.15}
                                                            onDragEnd={(_, info) => {
                                                                if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
                                                                    clearnotification(n.id);
                                                                }
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlenotificationclick(n);
                                                                onclose();
                                                            }}
                                                            className="active:bg-[--bg-glass-hover] cursor-pointer"
                                                            whileDrag={{ opacity: 0.8 }}
                                                        >
                                                            {idx > 0 && (
                                                                <div className="mx-3.5" style={{ borderTop: `1px solid ${clay ? 'var(--glass-border)' : 'var(--border-color)'}` }} />
                                                            )}
                                                            <div className="px-3.5 py-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <h3 className="text-[13px] font-semibold text-[--text-color] leading-tight truncate flex-1 mr-2">{n.title}</h3>
                                                                    <span className="text-[10px] text-[--text-color] opacity-50 shrink-0">{n.time}</span>
                                                                </div>
                                                                <p className="text-[12px] text-[--text-color] opacity-70 leading-snug line-clamp-2">{n.description}</p>
                                                                {n.actions && n.actions.length > 0 && (
                                                                    <div className="flex gap-2 mt-2.5">
                                                                        {n.actions.slice(0, 3).map(a => (
                                                                            <button
                                                                                key={a.actionId}
                                                                                onClick={(e) => { e.stopPropagation(); handleactionclick(n, a.actionId); }}
                                                                                className={`px-3.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.97] ${clay
                                                                                    ? 'rounded-full border border-[--glass-border]'
                                                                                    : 'rounded-lg border border-[--border-color]'
                                                                                }`}
                                                                                style={{ color: clay ? 'var(--accent-color)' : 'var(--pastel-blue)' }}
                                                                            >
                                                                                {a.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bottom drag handle */}
                            <div
                                className="py-3 pb-4 shrink-0 cursor-grab active:cursor-grabbing"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className="w-10 h-1 mx-auto rounded-full" style={{ background: 'color-mix(in srgb, var(--text-muted) 30%, transparent)' }} />
                            </div>
                        </div>
                    </motion.div>
                </>,
                document.body
            );
        }

        // Dynamic Island — notifications emerge from the notch, stack vertically
        const visibleNotifs = unviewednotifications.slice(0, 3);

        return createPortal(
            <div style={{ zIndex: 700 }} className="fixed top-0 left-0 right-0 flex flex-col items-center pointer-events-none">
                <AnimatePresence>
                    {visibleNotifs.map((n, idx) => (
                        <motion.div
                            key={n.id}
                            initial={{
                                width: 100,
                                height: 32,
                                borderRadius: 50,
                                opacity: 1,
                                y: 5,
                                marginBottom: 0,
                            }}
                            animate={{
                                width: 'calc(100vw - 16px)',
                                height: 'auto',
                                borderRadius: 22,
                                opacity: 1,
                                y: idx === 0 ? 5 : 0,
                                marginBottom: 6,
                            }}
                            exit={{
                                width: 100,
                                height: 32,
                                borderRadius: 50,
                                opacity: 0,
                                y: 5,
                                marginBottom: 0,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 380,
                                damping: 32,
                                mass: 0.8,
                            }}
                            className="pointer-events-auto cursor-pointer select-none overflow-hidden"
                            style={{
                                background: '#1C1C1E',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.08)',
                                maxWidth: 400,
                            }}
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            drag
                            dragConstraints={{ left: 0, right: 0, top: -100, bottom: 0 }}
                            dragElastic={{ left: 0.3, right: 0.3, top: 0.5, bottom: 0 }}
                            dragSnapToOrigin
                            onDragEnd={(_, info) => {
                                if (info.offset.y < -40 || info.velocity.y < -300 ||
                                    info.offset.x > 60 || info.velocity.x > 400) {
                                    markasviewed(n.id);
                                }
                            }}
                            whileDrag={{ scale: 0.98 }}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.1, duration: 0.15 }}
                                className="p-3 flex items-start gap-3"
                            >
                                <Image src={n.icon} width={36} height={36} className="w-[36px] h-[36px] rounded-[10px] object-cover shrink-0" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-[13px] text-white/90 leading-tight">{n.appname}</h4>
                                        <span className="text-[10px] text-white/40">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[13px] text-white leading-tight">{n.title}</h4>
                                    <p className="text-[12px] text-white/60 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>,
            document.body
        );
    }

    return createPortal(
        <>
            <div style={{ zIndex: 700 }} className="fixed bottom-24 right-4 flex flex-col-reverse items-end space-y-2 space-y-reverse pointer-events-none">
                <AnimatePresence>
                    {unviewednotifications.slice(0, 4).map((n) => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.15 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`group relative w-[340px] p-4 cursor-pointer select-none pointer-events-auto ${clay
                                ? 'rounded-[16px]'
                                : 'bg-overlay border border-[--border-color] anime-accent-left anime-glow-sm'
                            }`}
                            style={clay ? { background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 45%, transparent))', backdropFilter: 'blur(var(--glass-blur-heavy))', WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' } : undefined}
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); markasviewed(n.id); }}
                                className={`absolute -top-1.5 -right-1.5 w-6 h-6 text-[--text-color] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${clay ? 'rounded-full' : ''}`}
                                style={clay ? glassButton : { background: 'var(--bg-overlay)' }}
                            >
                                <IoClose size={14} />
                            </button>

                            <div className="flex items-start gap-3">
                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 object-cover" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-[11px] uppercase tracking-wide text-[--text-color]">{n.appname}</span>
                                        <span className="text-[10px] text-[--text-color] opacity-50">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[14px] text-[--text-color] leading-tight">{n.title}</h4>
                                    <p className="text-[13px] text-[--text-color] opacity-70 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                </div>
                            </div>
                            {n.actions && n.actions.length > 0 && (
                                <div className={`flex gap-2 mt-2 pt-2 ${clay ? 'border-t border-[--glass-border]' : 'border-t border-[--border-color]'}`}>
                                    {n.actions.slice(0, 3).map(a => (
                                        <button
                                            key={a.actionId}
                                            onClick={(e) => { e.stopPropagation(); handleactionclick(n, a.actionId); }}
                                            className={`flex-1 px-2 py-1 text-[11px] font-medium transition-colors active:scale-[0.97] ${clay
                                                ? 'rounded-[8px] border border-[--glass-border] hover:bg-[--bg-glass-hover]'
                                                : 'text-pastel-blue hover:bg-[--bg-overlay] border border-[--border-color]'
                                            }`}
                                            style={clay ? { color: 'var(--accent-color)' } : undefined}
                                        >
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Backdrops — non-animated to prevent DOM leak */}
            {isopen && clay && (
                <div className="fixed inset-0 w-screen h-screen z-[699]" onClick={onclose} />
            )}
            {isopen && !clay && (
                <div className="fixed inset-0 w-screen h-screen z-[699] bg-black/30" onClick={onclose} />
            )}

            <AnimatePresence>
                {isopen && clay && (
                    <motion.div
                        key="clay-panel"
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed z-[700] bottom-[72px] right-3 w-[360px] max-h-[70vh] overflow-hidden flex flex-col rounded-[22px]"
                        style={{
                            background: 'color-mix(in srgb, var(--accent-source) 6%, color-mix(in srgb, var(--bg-glass) 35%, transparent))',
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                            {/* Header */}
                            <div className="px-5 pt-4 pb-2 shrink-0 flex items-center justify-between">
                                <h3 className="text-[15px] font-semibold text-[--text-color]">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => clearallnotifications()}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[--text-color] hover:text-[--text-color] active:scale-95 transition-all rounded-full"
                                        style={{ background: 'color-mix(in srgb, var(--bg-glass) 50%, transparent)', border: '1px solid var(--glass-border)' }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Notifications — grouped by app */}
                            <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5"
                                            style={{ background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)', border: '1px solid var(--glass-border)' }}
                                        >
                                            <IoNotificationsOutline size={20} className="text-[--text-muted]" />
                                        </div>
                                        <p className="text-[13px] font-medium text-[--text-color]">No Notifications</p>
                                        <p className="text-[11px] text-[--text-muted] mt-0.5">You&apos;re all caught up</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {groupednotifications.map(group => (
                                            <div key={group.appname} className="rounded-[16px] overflow-hidden" style={{ background: 'color-mix(in srgb, var(--bg-glass) 50%, transparent)', border: '1px solid var(--glass-border)' }}>
                                                {/* App group header */}
                                                <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                                                    <Image src={group.icon} width={16} height={16} className="w-4 h-4 rounded-[4px]" alt={group.appname} />
                                                    <span className="text-[11px] font-semibold text-[--text-color] uppercase tracking-wide flex-1">{group.appname}</span>
                                                    {group.items.length > 1 && (
                                                        <span className="text-[10px] font-semibold text-[--text-muted] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)' }}>
                                                            {group.items.length}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Notifications in group */}
                                                <AnimatePresence mode="popLayout">
                                                    {group.items.map((n, idx) => (
                                                        <motion.div
                                                            key={n.id}
                                                            layout
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="group relative cursor-pointer"
                                                            onClick={() => handlenotificationclick(n)}
                                                        >
                                                            {idx > 0 && (
                                                                <div className="mx-3 border-t" style={{ borderColor: 'var(--glass-border)' }} />
                                                            )}
                                                            <div className="px-3 py-2.5 hover:bg-[--bg-glass-hover] transition-colors relative">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); clearnotification(n.id); }}
                                                                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                                    style={{ background: 'color-mix(in srgb, var(--bg-glass-active) 65%, transparent)' }}
                                                                >
                                                                    <IoClose size={11} className="text-[--text-muted]" />
                                                                </button>
                                                                <div className="flex justify-between items-center mb-0.5 pr-5">
                                                                    <h4 className="font-semibold text-[13px] text-[--text-color] leading-tight truncate">{n.title}</h4>
                                                                    <span className="text-[10px] text-[--text-color] opacity-50 shrink-0 ml-2">{n.time}</span>
                                                                </div>
                                                                <p className="text-[12px] text-[--text-color] opacity-70 leading-snug line-clamp-2">{n.description}</p>
                                                                {n.actions && n.actions.length > 0 && (
                                                                    <div className="flex gap-1.5 mt-2">
                                                                        {n.actions.slice(0, 3).map(a => (
                                                                            <button
                                                                                key={a.actionId}
                                                                                onClick={(e) => { e.stopPropagation(); handleactionclick(n, a.actionId); }}
                                                                                className="px-2.5 py-1 text-[10px] font-semibold rounded-full border border-[--glass-border] hover:bg-[--bg-glass-active] transition-colors"
                                                                                style={{ color: 'var(--accent-color)' }}
                                                                            >
                                                                                {a.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                {isopen && !clay && (
                    <motion.div
                        key="classic-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        className="fixed top-0 right-0 bottom-0 z-[700] w-[380px] h-full bg-surface border-l-2 border-[--border-color] overflow-hidden flex flex-col"
                    >
                            <div className="px-5 pt-12 pb-4 shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-bold text-[--text-color]">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => clearallnotifications()}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[--text-muted] hover:text-[--text-color] hover:bg-overlay transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-16 h-16 bg-overlay flex items-center justify-center mb-4">
                                            <IoNotificationsOutline size={28} className="text-pastel-lavender" />
                                        </div>
                                        <p className="text-[--text-muted] font-medium">No Notifications</p>
                                        <p className="text-[--text-muted] text-[13px] mt-1">You&apos;re all caught up!</p>
                                    </div>
                                ) : (
                                    groupednotifications.map(group => (
                                        <div key={group.appname}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Image src={group.icon} width={18} height={18} className="w-[18px] h-[18px]" alt={group.appname} />
                                                <span className="text-[11px] font-semibold text-[--text-muted] uppercase tracking-wide">{group.appname}</span>
                                            </div>
                                            <AnimatePresence mode="popLayout">
                                                {group.items.map(n => (
                                                    <motion.div
                                                        key={n.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: 50 }}
                                                        className="group relative w-full bg-overlay border border-[--border-color] anime-accent-left p-4 mb-2 cursor-pointer"
                                                        onClick={() => handlenotificationclick(n)}
                                                    >
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); clearnotification(n.id); }}
                                                            className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-overlay transition-all"
                                                        >
                                                            <IoClose size={14} className="text-[--text-muted]" />
                                                        </button>
                                                        <div className="pr-6">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <h4 className="font-semibold text-[14px] text-[--text-color] leading-tight">{n.title}</h4>
                                                                <span className="text-[10px] text-[--text-color] opacity-50 shrink-0 ml-2">{n.time}</span>
                                                            </div>
                                                            <p className="text-[13px] text-[--text-color] opacity-70 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                                        </div>
                                                        {n.actions && n.actions.length > 0 && (
                                                            <div className="flex gap-2 mt-2 pt-2 border-t border-[--border-color]">
                                                                {n.actions.slice(0, 3).map(a => (
                                                                    <button
                                                                        key={a.actionId}
                                                                        onClick={(e) => { e.stopPropagation(); handleactionclick(n, a.actionId); }}
                                                                        className="flex-1 px-2 py-1 text-[11px] font-medium text-pastel-blue hover:bg-[--bg-overlay] transition-colors border border-[--border-color]"
                                                                    >
                                                                        {a.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </>,
        document.body
    );
}
