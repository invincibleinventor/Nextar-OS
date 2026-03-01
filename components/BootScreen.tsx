import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { useSettings } from './SettingsContext';

export default function BootScreen() {
    const { osstate, setosstate } = useDevice();
    const [progress, setprogress] = useState(0);
    const osstateref = useRef(osstate);
    const clay = useIsClay();
    const { wallpaperurl } = useSettings();

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
                clay ? (
                    /* ── Neo-Glass / Clay Mode ── */
                    <motion.div
                        key="bootscreen"
                        className="fixed inset-0 z-[900] flex flex-col items-center justify-center cursor-none overflow-hidden"
                        exit={{
                            opacity: 0,
                            scale: 1.08,
                            transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
                        }}
                        initial={{ opacity: 1, scale: 1 }}
                    >
                        {/* Wallpaper background */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${wallpaperurl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />

                        {/* Heavy frosted glass overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backdropFilter: 'blur(60px) saturate(1.6)',
                                WebkitBackdropFilter: 'blur(60px) saturate(1.6)',
                                background: 'rgba(0, 0, 0, 0.25)',
                            }}
                        />

                        {/* Center content */}
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Circular glass container with pulsing glow */}
                            <motion.div
                                className="relative flex items-center justify-center"
                                style={{ width: 120, height: 120 }}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Pulsing glow behind the circle */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                                    }}
                                    animate={{
                                        scale: [1, 1.25, 1],
                                        opacity: [0.6, 1, 0.6],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />

                                {/* Glass circle */}
                                <div
                                    className="relative flex items-center justify-center rounded-full"
                                    style={{
                                        width: 120,
                                        height: 120,
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255, 255, 255, 0.18)',
                                        boxShadow:
                                            '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                                    }}
                                >
                                    <Image
                                        src="/logo.svg"
                                        alt="NextarOS"
                                        width={56}
                                        height={56}
                                        className="brightness-0 invert opacity-90"
                                    />
                                </div>
                            </motion.div>

                            {/* Thin progress line */}
                            <motion.div
                                className="mt-10 overflow-hidden"
                                style={{
                                    width: 160,
                                    height: 3,
                                    borderRadius: 999,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                }}
                                initial={{ opacity: 0, scaleX: 0.5 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <motion.div
                                    style={{
                                        height: '100%',
                                        borderRadius: 999,
                                        background: 'rgba(255, 255, 255, 0.55)',
                                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                                    }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.05, ease: 'linear' }}
                                />
                            </motion.div>

                            {/* NextarOS text */}
                            <motion.p
                                className="mt-5 text-[11px] font-medium uppercase"
                                style={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    letterSpacing: '0.25em',
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                            >
                                NextarOS
                            </motion.p>
                        </div>

                        {/* Fullscreen button — subtle transparent pill */}
                        <motion.button
                            onClick={() =>
                                document.documentElement.requestFullscreen().catch(() => {})
                            }
                            className="absolute bottom-10 z-[901] active:scale-95 transition-transform"
                            style={{
                                padding: '8px 24px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase' as const,
                                color: 'rgba(255, 255, 255, 0.4)',
                                background: 'rgba(255, 255, 255, 0.06)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                            whileHover={{
                                background: 'rgba(255, 255, 255, 0.12)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.7)',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                        >
                            Go Full Screen
                        </motion.button>
                    </motion.div>
                ) : (
                    /* ── Classic Mode ── */
                    <motion.div
                        key="bootscreen"
                        className="fixed inset-0 z-[900] flex flex-col items-center justify-center cursor-none overflow-hidden"
                        style={{
                            background: 'linear-gradient(145deg, #0a0a0f 0%, #141420 50%, #0d0d16 100%)',
                        }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                        }}
                        initial={{ opacity: 1 }}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Logo */}
                            <motion.div
                                className="w-16 h-16 mb-10 flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Image
                                    src="/logo.svg"
                                    alt="NextarOS"
                                    width={64}
                                    height={64}
                                    className="w-full h-full brightness-0 invert opacity-80"
                                />
                            </motion.div>

                            {/* Thin progress bar */}
                            <motion.div
                                className="overflow-hidden"
                                style={{
                                    width: 180,
                                    height: 2,
                                    borderRadius: 999,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                }}
                                initial={{ opacity: 0, scaleX: 0.6 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <motion.div
                                    style={{
                                        height: '100%',
                                        borderRadius: 999,
                                        background: 'linear-gradient(90deg, #a0a0b0, #d0d0e0)',
                                        boxShadow: '0 0 8px rgba(180, 180, 210, 0.3)',
                                    }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.05, ease: 'linear' }}
                                />
                            </motion.div>
                        </div>

                        {/* Fullscreen button */}
                        <motion.button
                            onClick={() =>
                                document.documentElement.requestFullscreen().catch(() => {})
                            }
                            className="absolute bottom-10 px-5 py-2 text-[11px] font-medium uppercase z-[901] transition-all active:scale-95 rounded-full"
                            style={{
                                letterSpacing: '0.2em',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: 'rgba(255, 255, 255, 0.35)',
                            }}
                            whileHover={{
                                borderColor: 'rgba(255, 255, 255, 0.25)',
                                color: 'rgba(255, 255, 255, 0.6)',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            Go Full Screen
                        </motion.button>
                    </motion.div>
                )
            )}
        </AnimatePresence>
    );
}
