import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';

const BG = '#f0edf5';
const INK = '#2e2e3a';
const PINK = '#f5bde6';
const LAVENDER = '#c6a0f6';
const LIGHTGRAY = '#d0cfe0';

const seededrandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

export default function BootScreen() {
    const { osstate, setosstate } = useDevice();
    const [progress, setprogress] = useState(0);
    const [mounted, setmounted] = useState(false);
    const osstateref = useRef(osstate);

    useEffect(() => { setmounted(true); }, []);

    useEffect(() => {
        osstateref.current = osstate;
    }, [osstate]);

    const embers = useMemo(() => {
        return [...Array(20)].map((_, i) => ({
            r1: seededrandom(i + 500),
            r2: seededrandom(i + 600),
            r3: seededrandom(i + 700),
            r4: seededrandom(i + 800),
            r5: seededrandom(i + 900),
            r6: seededrandom(i + 1000),
        }));
    }, []);

    const sakura = useMemo(() => {
        return [...Array(25)].map((_, i) => ({
            x: seededrandom(i + 2000) * 100,
            delay: seededrandom(i + 2100) * 8,
            duration: 6 + seededrandom(i + 2200) * 6,
            size: 6 + seededrandom(i + 2300) * 10,
            drift: (seededrandom(i + 2400) - 0.5) * 200,
            rotation: seededrandom(i + 2500) * 360,
        }));
    }, []);

    const rain = useMemo(() => {
        return [...Array(40)].map((_, i) => ({
            x: seededrandom(i + 3000) * 100,
            h: 30 + seededrandom(i + 3100) * 60,
            delay: seededrandom(i + 3200) * 1.5,
            speed: 0.4 + seededrandom(i + 3300) * 0.3,
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
                    style={{ background: `linear-gradient(160deg, ${BG} 0%, #e8e0f0 40%, #ddd5eb 70%, ${BG} 100%)` }}
                    exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: 'easeInOut' } }}
                    initial={{ opacity: 1 }}
                >
                    {/* Rain streaks */}
                    {mounted && <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                        {rain.map((r, i) => (
                            <motion.div
                                key={`rain-${i}`}
                                className="absolute w-px"
                                style={{
                                    left: `${r.x}%`,
                                    height: r.h,
                                    top: -100,
                                    background: `linear-gradient(180deg, transparent, ${LIGHTGRAY}60, transparent)`
                                }}
                                animate={{ y: ['0vh', '120vh'] }}
                                transition={{ duration: r.speed, repeat: Infinity, delay: r.delay, ease: 'linear' }}
                            />
                        ))}
                    </div>}

                    {/* Floating embers */}
                    {mounted && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {embers.map((e, i) => (
                            <motion.div
                                key={`ember-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: 2 + e.r1 * 4,
                                    height: 2 + e.r1 * 4,
                                    left: `${Math.round(10 + e.r1 * 80)}%`,
                                    bottom: `${Math.round(e.r2 * 40)}%`,
                                    background: i % 3 === 0 ? LAVENDER : PINK,
                                    boxShadow: `0 0 ${8 + e.r3 * 12}px ${i % 3 === 0 ? LAVENDER : PINK}, 0 0 ${16 + e.r3 * 20}px ${i % 3 === 0 ? LAVENDER : PINK}40`
                                }}
                                animate={{
                                    y: [0, -250 - e.r3 * 300],
                                    x: [0, (e.r4 - 0.5) * 120],
                                    opacity: [0, 0.9, 0],
                                    scale: [0.3, 1.2, 0.2]
                                }}
                                transition={{ duration: 3 + e.r5 * 3, repeat: Infinity, delay: e.r6 * 4, ease: 'easeOut' }}
                            />
                        ))}
                    </div>}

                    {/* Sakura petals */}
                    {mounted && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {sakura.map((p, i) => (
                            <motion.div
                                key={`sakura-${i}`}
                                className="absolute"
                                style={{
                                    left: `${p.x}%`,
                                    top: -20,
                                    width: p.size,
                                    height: p.size * 0.6,
                                    borderRadius: '50% 0 50% 0',
                                    background: `linear-gradient(135deg, ${PINK}cc, ${PINK}40)`,
                                }}
                                animate={{
                                    y: ['-5vh', '110vh'],
                                    x: [0, p.drift],
                                    rotate: [p.rotation, p.rotation + 360],
                                    opacity: [0, 0.7, 0.5, 0],
                                }}
                                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                            />
                        ))}
                    </div>}

                    {/* Dual orbs */}
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: 280,
                            height: 280,
                            right: '10%',
                            top: '25%',
                            background: `radial-gradient(circle, ${PINK}30 0%, ${LAVENDER}15 50%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: 180,
                            height: 180,
                            left: '8%',
                            bottom: '20%',
                            background: `radial-gradient(circle, ${LAVENDER}25 0%, ${PINK}10 50%, transparent 70%)`,
                        }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    />

                    {/* Center content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Animated logo mark */}
                        <motion.div
                            className="w-16 h-16 mb-6 flex items-center justify-center"
                            style={{ background: PINK }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <motion.span
                                className="text-2xl font-black"
                                style={{ color: BG }}
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                N
                            </motion.span>
                        </motion.div>

                        <motion.div
                            className="text-4xl md:text-5xl font-black mb-2 tracking-tight"
                            style={{ color: INK }}
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            起動中
                        </motion.div>

                        <motion.div
                            className="text-xs font-bold tracking-[0.3em] uppercase mb-8"
                            style={{ color: PINK }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            NextarOS
                        </motion.div>

                        {/* Progress bar with glow */}
                        <div className="relative">
                            <div className="w-52 h-1.5 rounded-full overflow-hidden" style={{ background: `${LIGHTGRAY}40` }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${PINK}, ${LAVENDER}, ${PINK})`, backgroundSize: '200% 100%' }}
                                    animate={{ width: `${progress}%`, backgroundPosition: ['0% 0%', '200% 0%'] }}
                                    transition={{ width: { duration: 0.05, ease: 'linear' }, backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' } } as any}
                                />
                            </div>
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ boxShadow: `0 0 20px ${PINK}40, 0 0 40px ${LAVENDER}20` }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </div>
                    </div>

                    {/* Bottom decorative kanji */}
                    <motion.div
                        className="absolute bottom-[15%] right-[8%] text-[8rem] md:text-[12rem] font-black leading-none select-none pointer-events-none"
                        style={{ color: `${LIGHTGRAY}12`, writingMode: 'vertical-rl' }}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        桜
                    </motion.div>

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
