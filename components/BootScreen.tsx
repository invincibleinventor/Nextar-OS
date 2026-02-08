import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';

const BG = '#f0edf5';
const INK = '#2e2e3a';
const PINK = '#f5bde6';
const LIGHTGRAY = '#d0cfe0';

const seededrandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

export default function BootScreen() {
    const { osstate, setosstate } = useDevice();
    const [progress, setprogress] = useState(0);
    const osstateref = useRef(osstate);

    useEffect(() => {
        osstateref.current = osstate;
    }, [osstate]);

    const embers = useMemo(() => {
        return [...Array(12)].map((_, i) => ({
            r1: seededrandom(i + 500),
            r2: seededrandom(i + 600),
            r3: seededrandom(i + 700),
            r4: seededrandom(i + 800),
            r5: seededrandom(i + 900),
            r6: seededrandom(i + 1000),
        }));
    }, []);

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
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center cursor-none overflow-hidden"
                    style={{ background: BG }}
                    exit={{ opacity: 0, transition: { duration: 0.6 } }}
                    initial={{ opacity: 1 }}
                >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {embers.map((e, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{
                                    left: `${Math.round(20 + e.r1 * 60)}%`,
                                    bottom: `${Math.round(e.r2 * 30)}%`,
                                    background: PINK,
                                    boxShadow: `0 0 8px ${PINK}, 0 0 16px ${PINK}50`
                                }}
                                animate={{
                                    y: [0, -200 - e.r3 * 200],
                                    x: [0, (e.r4 - 0.5) * 80],
                                    opacity: [0, 0.8, 0],
                                    scale: [0.5, 1, 0.3]
                                }}
                                transition={{ duration: 3 + e.r5 * 2, repeat: Infinity, delay: e.r6 * 3, ease: 'easeOut' }}
                            />
                        ))}
                    </div>

                    <motion.div
                        className="absolute right-[15%] top-[35%] -translate-y-1/2 rounded-full"
                        style={{ width: 200, height: 200, background: `linear-gradient(135deg, ${PINK}, #c6a0f6)`, opacity: 0.2 }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />

                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            className="text-5xl md:text-6xl font-black mb-3 tracking-tight"
                            style={{ color: INK }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            起動中
                        </motion.div>

                        <motion.div
                            className="text-xs font-bold tracking-[0.3em] uppercase mb-8"
                            style={{ color: PINK }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            NextarOS
                        </motion.div>

                        <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: `${LIGHTGRAY}60` }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${PINK}, #c6a0f6)` }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.05, ease: 'linear' }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
                        className="absolute bottom-10 p-2 text-xs uppercase tracking-widest z-[10001] transition-colors"
                        style={{ color: `${LIGHTGRAY}80` }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = `${LIGHTGRAY}80`)}
                    >
                        Go Full Screen
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
