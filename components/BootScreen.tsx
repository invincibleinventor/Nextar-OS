import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';

const BG = '#f0edf5';
const INK = '#2e2e3a';
const LIGHTGRAY = '#d0cfe0';

export default function BootScreen() {
    const { osstate, setosstate } = useDevice();
    const [progress, setprogress] = useState(0);
    const osstateref = useRef(osstate);

    useEffect(() => {
        osstateref.current = osstate;
    }, [osstate]);

    useEffect(() => {
        if (osstate === 'booting') {
            setprogress(0);
            const interval = setInterval(() => {
                setprogress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            if (osstateref.current === 'booting') setosstate('locked');
                        }, 400);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [osstate, setosstate]);

    return (
        <AnimatePresence>
            {osstate === 'booting' && (
                <motion.div
                    key="bootscreen"
                    className="fixed inset-0 z-[900] flex flex-col items-center justify-center cursor-none overflow-hidden"
                    style={{ background: BG }}
                    exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
                    initial={{ opacity: 1 }}
                >
                    {/* Center content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo mark */}
                        <motion.div
                            className="w-16 h-16 mb-6 flex items-center justify-center"
                            style={{ background: INK }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <span className="text-2xl font-black" style={{ color: BG }}>N</span>
                        </motion.div>

                        <motion.div
                            className="text-4xl md:text-5xl font-black mb-2 tracking-tight"
                            style={{ color: INK }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            NextarOS
                        </motion.div>

                        <motion.div
                            className="text-xs font-bold tracking-[0.3em] uppercase mb-8"
                            style={{ color: '#8087a2' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            Booting
                        </motion.div>

                        {/* Progress bar */}
                        <div className="relative">
                            <div className="w-52 h-1.5 overflow-hidden" style={{ background: LIGHTGRAY }}>
                                <motion.div
                                    className="h-full"
                                    style={{ background: INK }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.05, ease: 'linear' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
                        className="absolute bottom-10 p-2 text-xs uppercase tracking-widest z-[901] transition-colors border"
                        style={{ borderColor: LIGHTGRAY, color: '#8087a2' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = INK; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#8087a2'; e.currentTarget.style.borderColor = LIGHTGRAY; }}
                    >
                        Go Full Screen
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
