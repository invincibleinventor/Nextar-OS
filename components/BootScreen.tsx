import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { useSettings } from './SettingsContext';

/* ── CSS-animated stroke-drawing "welcome" text ── */
function WelcomeText({ onComplete }: { onComplete: () => void }) {
    const [showFill, setShowFill] = useState(false);
    const [startDraw, setStartDraw] = useState(false);
    const completedRef = useRef(false);

    useEffect(() => {
        // Wait for the component to be painted before starting the stroke animation.
        // requestAnimationFrame fires before the next paint, the second rAF ensures
        // the first frame has actually been committed to screen.
        let raf1: number, raf2: number;
        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                setStartDraw(true);
            });
        });
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }, []);

    useEffect(() => {
        if (!startDraw) return;
        const drawDuration = 2200; // matches CSS animation-duration
        const timer1 = setTimeout(() => {
            setShowFill(true);
        }, drawDuration + 100);
        const timer2 = setTimeout(() => {
            if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
            }
        }, drawDuration + 700);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, [startDraw, onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <style>{`
                @keyframes strokeDraw {
                    from { stroke-dashoffset: 4000; }
                    to { stroke-dashoffset: 0; }
                }
                .welcome-stroke-active {
                    stroke-dasharray: 4000;
                    stroke-dashoffset: 4000;
                    animation: strokeDraw 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    will-change: stroke-dashoffset;
                }
                .welcome-stroke-idle {
                    stroke-dasharray: 4000;
                    stroke-dashoffset: 4000;
                }
            `}</style>
            <svg
                viewBox="0 0 900 250"
                style={{ width: 'clamp(280px, 70vw, 650px)', overflow: 'visible' }}
            >
                <text
                    className={startDraw ? 'welcome-stroke-active' : 'welcome-stroke-idle'}
                    x="450"
                    y="185"
                    textAnchor="middle"
                    style={{
                        fontFamily: "'Snell Roundhand', 'Segoe Script', 'Dancing Script', cursive",
                        fontSize: 140,
                        fontWeight: 700,
                        fontStyle: 'italic',
                        fill: showFill ? 'rgba(255,255,255,0.9)' : 'none',
                        stroke: 'rgba(255,255,255,0.8)',
                        strokeWidth: showFill ? 0 : 1.2,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        transition: 'fill 0.6s ease, stroke-width 0.6s ease',
                    }}
                >
                    welcome
                </text>
            </svg>
        </motion.div>
    );
}

export default function BootScreen() {
    const { osstate, setosstate } = useDevice();
    const osstateref = useRef(osstate);
    const clay = useIsClay();
    const { wallpaperurl } = useSettings();
    const { ismobile } = useDevice();

    useEffect(() => {
        osstateref.current = osstate;
    }, [osstate]);

    const handleAnimationComplete = React.useCallback(() => {
        setTimeout(() => {
            if (osstateref.current === 'booting') setosstate('locked');
        }, 300);
    }, [setosstate]);

    return (
        <>
            {/* Pure CSS black screen — visible immediately before React mounts, prevents flash */}
            {osstate === 'booting' && (
                <div className="fixed inset-0 z-[899] bg-black" />
            )}

            <AnimatePresence>
                {osstate === 'booting' && (
                    <motion.div
                        key="bootscreen"
                        className="fixed inset-0 z-[900] flex flex-col items-center justify-center cursor-none overflow-hidden"
                        exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
                        initial={{ opacity: 1 }}
                    >
                        {/* Background */}
                        {clay ? (
                            <>
                                <div className="absolute inset-0 bg-black" />
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `url(${wallpaperurl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: ismobile ? 'blur(24px) saturate(1.2)' : 'blur(40px) saturate(1.3)',
                                        transform: 'scale(1.15)',
                                    }}
                                />
                                <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.35)' }} />
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0a0a0f 0%, #141420 50%, #0d0d16 100%)' }} />
                                {wallpaperurl && (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `url(${wallpaperurl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(30px) saturate(1.1) brightness(0.3)',
                                            transform: 'scale(1.15)',
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {/* Welcome text */}
                        <div className="relative z-10">
                            <WelcomeText onComplete={handleAnimationComplete} />
                        </div>

                        {/* Fullscreen button */}
                        <motion.button
                            onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
                            className="absolute bottom-10 z-[901] active:scale-95 transition-transform"
                            style={{
                                padding: '8px 24px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase' as const,
                                color: 'rgba(255, 255, 255, 0.35)',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                            whileHover={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.6)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.4 }}
                        >
                            Go Full Screen
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
