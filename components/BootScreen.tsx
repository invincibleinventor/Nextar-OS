import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';

const BG = '#08080e';
const SURFACE = '#0e0e18';
const GLOW_PRIMARY = '#a78bfa';
const GLOW_SECONDARY = '#7c3aed';
const ACCENT = '#c4b5fd';
const TEXT_DIM = '#6b6b8a';
const TEXT_BRIGHT = '#e8e4f0';

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
        return [...Array(12)].map((_, i) => ({
            r1: seededrandom(i + 500),
            r2: seededrandom(i + 600),
            r3: seededrandom(i + 700),
            r4: seededrandom(i + 800),
            r5: seededrandom(i + 900),
            r6: seededrandom(i + 1000),
        }));
    }, []);

    const sakura = useMemo(() => {
        return [...Array(15)].map((_, i) => ({
            x: seededrandom(i + 2000) * 100,
            delay: seededrandom(i + 2100) * 8,
            duration: 6 + seededrandom(i + 2200) * 6,
            size: 6 + seededrandom(i + 2300) * 10,
            drift: (seededrandom(i + 2400) - 0.5) * 200,
            rotation: seededrandom(i + 2500) * 360,
        }));
    }, []);

    const rain = useMemo(() => {
        return [...Array(25)].map((_, i) => ({
            x: seededrandom(i + 3000) * 100,
            h: 30 + seededrandom(i + 3100) * 60,
            delay: seededrandom(i + 3200) * 1.5,
            speed: 0.4 + seededrandom(i + 3300) * 0.3,
        }));
    }, []);

    const particles = useMemo(() => {
        return [...Array(30)].map((_, i) => ({
            x: seededrandom(i + 4000) * 100,
            y: seededrandom(i + 4100) * 100,
            size: 1 + seededrandom(i + 4200) * 2,
            delay: seededrandom(i + 4300) * 3,
            duration: 2 + seededrandom(i + 4400) * 3,
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
                    className="fixed inset-0 z-[900] flex flex-col items-center justify-center cursor-none overflow-hidden"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 50% 45%, ${SURFACE} 0%, ${BG} 100%)` }}
                    exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: 'easeInOut' } }}
                    initial={{ opacity: 1 }}
                >
                    {/* Subtle grid overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(200,180,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,180,255,0.3) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                        }}
                    />

                    {/* Rain streaks */}
                    {mounted && <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
                        {rain.map((r, i) => (
                            <motion.div
                                key={`rain-${i}`}
                                className="absolute w-px"
                                style={{
                                    left: `${r.x}%`,
                                    height: r.h,
                                    top: -100,
                                    background: `linear-gradient(180deg, transparent, rgba(180,180,220,0.5), transparent)`
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
                                    width: 2 + e.r1 * 3,
                                    height: 2 + e.r1 * 3,
                                    left: `${Math.round(10 + e.r1 * 80)}%`,
                                    bottom: `${Math.round(e.r2 * 40)}%`,
                                    background: i % 3 === 0 ? GLOW_PRIMARY : GLOW_SECONDARY,
                                    boxShadow: `0 0 ${6 + e.r3 * 10}px ${i % 3 === 0 ? GLOW_PRIMARY : GLOW_SECONDARY}80`
                                }}
                                animate={{
                                    y: [0, -250 - e.r3 * 300],
                                    x: [0, (e.r4 - 0.5) * 120],
                                    opacity: [0, 0.7, 0],
                                    scale: [0.3, 1.2, 0.2]
                                }}
                                transition={{ duration: 3 + e.r5 * 3, repeat: Infinity, delay: e.r6 * 4, ease: 'easeOut' }}
                            />
                        ))}
                    </div>}

                    {/* Ghost petals */}
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
                                    background: `linear-gradient(135deg, rgba(200,180,240,0.25), rgba(200,180,240,0.05))`,
                                }}
                                animate={{
                                    y: ['-5vh', '110vh'],
                                    x: [0, p.drift],
                                    rotate: [p.rotation, p.rotation + 360],
                                    opacity: [0, 0.5, 0.3, 0],
                                }}
                                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                            />
                        ))}
                    </div>}

                    {/* Static star particles */}
                    {mounted && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {particles.map((p, i) => (
                            <motion.div
                                key={`particle-${i}`}
                                className="absolute rounded-full"
                                style={{
                                    width: p.size,
                                    height: p.size,
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    background: ACCENT,
                                }}
                                animate={{ opacity: [0, 0.6, 0] }}
                                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                            />
                        ))}
                    </div>}

                    {/* Dual ambient orbs */}
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: 350,
                            height: 350,
                            right: '5%',
                            top: '20%',
                            background: `radial-gradient(circle, ${GLOW_SECONDARY}18 0%, ${GLOW_PRIMARY}08 50%, transparent 70%)`,
                            filter: 'blur(40px)',
                        }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute rounded-full"
                        style={{
                            width: 250,
                            height: 250,
                            left: '3%',
                            bottom: '15%',
                            background: `radial-gradient(circle, ${GLOW_PRIMARY}15 0%, ${GLOW_SECONDARY}08 50%, transparent 70%)`,
                            filter: 'blur(30px)',
                        }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    />

                    {/* Center content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Animated logo mark */}
                        <motion.div
                            className="w-16 h-16 mb-6 flex items-center justify-center relative"
                            style={{ background: `linear-gradient(135deg, ${GLOW_SECONDARY}, ${GLOW_PRIMARY})` }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <motion.span
                                className="text-2xl font-black"
                                style={{ color: BG }}
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                N
                            </motion.span>
                            {/* Logo glow */}
                            <motion.div
                                className="absolute inset-0"
                                style={{ boxShadow: `0 0 40px ${GLOW_PRIMARY}40, 0 0 80px ${GLOW_SECONDARY}20` }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>

                        <motion.div
                            className="text-4xl md:text-5xl font-black mb-2 tracking-tight"
                            style={{ color: TEXT_BRIGHT }}
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            起動中
                        </motion.div>

                        <motion.div
                            className="text-xs font-bold tracking-[0.3em] uppercase mb-8"
                            style={{ color: ACCENT }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: [0.6, 1, 0.6], y: 0 }}
                            transition={{ delay: 0.3, opacity: { duration: 2, repeat: Infinity } } as any}
                        >
                            NextarOS
                        </motion.div>

                        {/* Progress bar with glow */}
                        <div className="relative">
                            <div className="w-52 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${GLOW_SECONDARY}, ${GLOW_PRIMARY}, ${ACCENT})`,
                                        backgroundSize: '200% 100%'
                                    }}
                                    animate={{ width: `${progress}%`, backgroundPosition: ['0% 0%', '200% 0%'] }}
                                    transition={{ width: { duration: 0.05, ease: 'linear' }, backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' } } as any}
                                />
                            </div>
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ boxShadow: `0 0 20px ${GLOW_PRIMARY}30, 0 0 40px ${GLOW_SECONDARY}15` }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </div>
                    </div>

                    {/* Bottom decorative kanji */}
                    <motion.div
                        className="absolute bottom-[15%] right-[8%] text-[8rem] md:text-[12rem] font-black leading-none select-none pointer-events-none"
                        style={{ color: `rgba(200,180,240,0.04)`, writingMode: 'vertical-rl' }}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        桜
                    </motion.div>

                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
                        className="absolute bottom-10 p-2 text-xs uppercase tracking-widest z-[901] transition-colors border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    >
                        Go Full Screen
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
