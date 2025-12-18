'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useNotifications } from './NotificationContext';
import { useDevice } from './DeviceContext';

export default function MacOSNotifications({ isopen, onclose }: { isopen: boolean; onclose: () => void }) {
    const { handlenotificationclick, notifications, clearnotification, markasviewed } = useNotifications();
    const { ismobile, osstate } = useDevice();

    if (ismobile || osstate !== 'unlocked') return null;

    return (
        <>
            <div className="fixed top-12 right-4 z-[99999] flex flex-col items-end space-y-2 pointer-events-none">
                <AnimatePresence>
                    {notifications.filter(n => !n.viewed).slice(0, 4).map((n, index) => (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.1 }}
                            className="group relative w-[340px] bg-white/10 dark:bg-neutral-800/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl p-3.5 cursor-pointer select-none pointer-events-auto hover:bg-white/40 dark:hover:bg-neutral-800/40 transition-colors"
                            onClick={() => { handlenotificationclick(n); markasviewed(n.id); }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => { if (info.offset.x > 50) markasviewed(n.id); }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div
                                onClick={(e) => { e.stopPropagation(); markasviewed(n.id); }}
                                className="absolute -top-2 -left-2 w-6 h-6 bg-neutral-500/50 hover:bg-neutral-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 backdrop-blur-md shadow-sm"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>

                            <div className="flex items-start gap-3.5">
                                <Image src={n.icon} width={40} height={40} className="w-10 h-10 rounded-xl object-cover" alt={n.appname} />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-[13px] text-black dark:text-white leading-tight">{n.appname}</h4>
                                        <span className="text-[10px] text-neutral-800 dark:text-neutral-300">{n.time}</span>
                                    </div>
                                    <h4 className="font-semibold text-[13px] text-black dark:text-white leading-tight">{n.title}</h4>
                                    <p className="text-[12px] text-neutral-800 dark:text-neutral-300 leading-snug mt-0.5 line-clamp-2">{n.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isopen && (
                    <>
                        <div className="fixed inset-0 w-screen h-screen z-[999998] bg-black/20 hidden pointer-events-auto cursor-default" onClick={onclose} onPointerDown={onclose} />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 bottom-0 z-[999999] w-[360px] h-full bg-white/10 dark:bg-black/10 backdrop-blur-2xl border-l border-white/10 shadow-2xl p-4 pt-12 overflow-y-auto scrollbar-hide"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-end mb-2 px-2">
                                    <h3 className="text-xl font-bold text-black dark:text-white">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button onClick={() => notifications.forEach(n => markasviewed(n.id))} className=" font-medium text-xs dark:text-blue-500 text-blue-900 hover:underline">
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {notifications.length === 0 && <div className="text-center text-black/80 dark:text-white/40 mt-10">No New Notifications</div>}

                                {notifications.map(n => (
                                    <div key={n.id} className="group relative w-full bg-white/40 dark:bg-neutral-800/60 backdrop-blur-xl rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start gap-3" onClick={() => handlenotificationclick(n)}>
                                            <Image src={n.icon} width={36} height={36} className="w-9 h-9 rounded-lg" alt={n.appname} />
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[12px] font-bold text-black dark:text-white/90">{n.appname}</span>
                                                    <span className="text-[10px] text-black/50 dark:text-white/50">{n.time}</span>
                                                </div>
                                                <h4 className="font-medium text-[13px] text-black dark:text-white leading-tight mt-0.5">{n.title}</h4>
                                                <p className="text-[12px] text-black/70 dark:text-white/70 leading-snug mt-0.5">{n.description}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); clearnotification(n.id); }} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 bg-black/20  rounded-full hover:bg-black/40 text-white transition-opacity">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
