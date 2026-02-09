'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PINK = '#f5bde6';
const LAVENDER = '#c6a0f6';
const PEACH = '#f5a97f';

const seededrandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

export default function DesktopEffects({ active }: { active: boolean }) {
    const [mounted, setmounted] = useState(false);
    useEffect(() => { setmounted(true); }, []);

    const petals = useMemo(() => {
        return [...Array(50)].map((_, i) => ({
            x: seededrandom(i + 4000) * 100,
            delay: seededrandom(i + 4100) * 15,
            duration: 10 + seededrandom(i + 4200) * 10,
            size: 8 + seededrandom(i + 4300) * 14,
            drift: (seededrandom(i + 4400) - 0.5) * 300,
            rotation: seededrandom(i + 4500) * 360,
            color: seededrandom(i + 4600) > 0.6 ? PINK : seededrandom(i + 4600) > 0.3 ? LAVENDER : PEACH,
        }));
    }, []);

    const embers = useMemo(() => {
        return [...Array(25)].map((_, i) => ({
            r1: seededrandom(i + 5000),
            r2: seededrandom(i + 5100),
            r3: seededrandom(i + 5200),
            r4: seededrandom(i + 5300),
            r5: seededrandom(i + 5400),
            r6: seededrandom(i + 5500),
            color: seededrandom(i + 5600) > 0.5 ? PINK : LAVENDER,
        }));
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className="absolute inset-0 pointer-events-none overflow-hidden z-[1]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {petals.map((p, i) => (
                        <motion.div
                            key={`petal-${i}`}
                            className="absolute"
                            style={{
                                left: `${p.x}%`,
                                top: -20,
                                width: p.size,
                                height: p.size * 0.6,
                                borderRadius: '50% 0 50% 0',
                                background: `linear-gradient(135deg, ${p.color}dd, ${p.color}50)`,
                                boxShadow: `0 0 4px ${p.color}40`,
                            }}
                            animate={{
                                y: ['-5vh', '108vh'],
                                x: [0, p.drift],
                                rotate: [p.rotation, p.rotation + 360],
                                opacity: [0, 0.85, 0.7, 0],
                            }}
                            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                        />
                    ))}

                    {embers.map((e, i) => (
                        <motion.div
                            key={`glow-${i}`}
                            className="absolute rounded-full"
                            style={{
                                width: 3 + e.r1 * 5,
                                height: 3 + e.r1 * 5,
                                left: `${Math.round(5 + e.r2 * 90)}%`,
                                bottom: `${Math.round(e.r3 * 60)}%`,
                                background: e.color,
                                boxShadow: `0 0 8px ${e.color}, 0 0 16px ${e.color}60, 0 0 24px ${e.color}20`,
                            }}
                            animate={{
                                y: [0, -200 - e.r4 * 300],
                                x: [0, (e.r5 - 0.5) * 120],
                                opacity: [0, 0.9, 0],
                                scale: [0.5, 1.3, 0.2],
                            }}
                            transition={{ duration: 4 + e.r6 * 4, repeat: Infinity, delay: e.r1 * 5, ease: 'easeOut' }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
