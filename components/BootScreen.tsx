import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';

const BG = '#f0edf5';
const INK = '#2e2e3a';
const PINK = '#f5bde6';
const GRAY = '#8087a2';
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

    const floatingblocks = useMemo(() => {
        return [...Array(18)].map((_, i) => ({
            x: seededrandom(i + 100) * 100,
            y: seededrandom(i + 200) * 100,
            size: 4 + seededrandom(i + 300) * 20,
            delay: seededrandom(i + 400) * 3,
            duration: 3 + seededrandom(i + 500) * 4,
            rotate: seededrandom(i + 600) * 45 - 22,
            color: i % 4 === 0 ? PINK : i % 4 === 1 ? INK : i % 4 === 2 ? GRAY : LIGHTGRAY,
            opacity: 0.06 + seededrandom(i + 700) * 0.1,
        }));
    }, []);

    const gridlines = useMemo(() => {
        return [...Array(8)].map((_, i) => ({
            pos: 10 + i * 11.5,
            delay: i * 0.08,
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
                    style={{ background: BG }}
                    exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: 'easeInOut' } }}
                    initial={{ opacity: 1 }}
                >
                    {/* Solid grid lines */}
                    {mounted && gridlines.map((line, i) => (
                        <React.Fragment key={`grid-${i}`}>
                            <motion.div
                                className="absolute left-0 right-0"
                                style={{ top: `${line.pos}%`, height: 1, background: LIGHTGRAY }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.6, delay: line.delay, ease: 'easeOut' }}
                            />
                            <motion.div
                                className="absolute top-0 bottom-0"
                                style={{ left: `${line.pos}%`, width: 1, background: LIGHTGRAY }}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.6, delay: line.delay + 0.04, ease: 'easeOut' }}
                            />
                        </React.Fragment>
                    ))}

                    {/* Floating geometric blocks */}
                    {mounted && floatingblocks.map((b, i) => (
                        <motion.div
                            key={`block-${i}`}
                            className="absolute"
                            style={{
                                width: b.size,
                                height: b.size,
                                left: `${b.x}%`,
                                top: `${b.y}%`,
                                background: b.color,
                                opacity: b.opacity,
                                rotate: b.rotate,
                            }}
                            animate={{
                                y: [0, -15, 0],
                                rotate: [b.rotate, b.rotate + 8, b.rotate],
                            }}
                            transition={{
                                duration: b.duration,
                                repeat: Infinity,
                                delay: b.delay,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}

                    {/* Corner accent blocks */}
                    <motion.div
                        className="absolute top-8 left-8 md:top-12 md:left-12"
                        style={{ width: 40, height: 40, background: PINK }}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute top-8 right-8 md:top-12 md:right-12"
                        style={{ width: 24, height: 24, background: INK }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.35 }}
                    />
                    <motion.div
                        className="absolute bottom-24 left-8 md:bottom-28 md:left-12"
                        style={{ width: 16, height: 16, background: GRAY }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
                    />
                    <motion.div
                        className="absolute bottom-24 right-8 md:bottom-28 md:right-12"
                        style={{ width: 32, height: 8, background: PINK }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    />

                    {/* Decorative side stripe */}
                    <motion.div
                        className="absolute top-[20%] right-[6%] hidden md:block"
                        style={{ width: 3, height: 120, background: LIGHTGRAY }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    />
                    <motion.div
                        className="absolute bottom-[25%] left-[6%] hidden md:block"
                        style={{ width: 80, height: 3, background: LIGHTGRAY }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    />

                    {/* Center content */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo mark — solid square with letter */}
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
                            style={{ color: GRAY }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            Booting
                        </motion.div>

                        {/* Progress bar — solid, no glow */}
                        <div className="relative">
                            <div className="w-52 h-1.5 overflow-hidden" style={{ background: LIGHTGRAY }}>
                                <motion.div
                                    className="h-full"
                                    style={{ background: INK }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.05, ease: 'linear' }}
                                />
                            </div>
                            {/* Tick marks */}
                            <div className="flex justify-between mt-1.5 w-52">
                                {[0, 25, 50, 75, 100].map(tick => (
                                    <motion.div
                                        key={tick}
                                        style={{ width: 1, height: 4, background: progress >= tick ? INK : LIGHTGRAY }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + tick * 0.003 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom decorative text */}
                    <motion.div
                        className="absolute bottom-[12%] right-[6%] text-[7rem] md:text-[10rem] font-black leading-none select-none pointer-events-none"
                        style={{ color: LIGHTGRAY, writingMode: 'vertical-rl' }}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 0.3, x: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                    >
                        N
                    </motion.div>

                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
                        className="absolute bottom-10 p-2 text-xs uppercase tracking-widest z-[901] transition-colors border"
                        style={{ borderColor: LIGHTGRAY, color: GRAY }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = INK; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = GRAY; e.currentTarget.style.borderColor = LIGHTGRAY; }}
                    >
                        Go Full Screen
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
