import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { useSettings } from './SettingsContext';

/* ── SVG stroke-drawing "welcome" text ── */
function WelcomeText() {
    const textRef = useRef<SVGTextElement>(null);
    const [showFill, setShowFill] = useState(false);

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const totalLength = 4000;
        el.style.strokeDasharray = `${totalLength}`;
        el.style.strokeDashoffset = `${totalLength}`;

        const start = performance.now();
        const duration = 2200;

        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            el.style.strokeDashoffset = `${totalLength * (1 - eased)}`;

            if (t < 1) requestAnimationFrame(tick);
            else setTimeout(() => setShowFill(true), 150);
        };

        requestAnimationFrame(tick);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <svg
                viewBox="0 0 900 250"
                style={{ width: 'clamp(320px, 80vw, 650px)', overflow: 'visible' }}
            >
                <text
                    ref={textRef}
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
    const [ready, setReady] = useState(false);

    useEffect(() => {
        osstateref.current = osstate;
    }, [osstate]);

    // After welcome animation, transition to lock screen
    useEffect(() => {
        if (osstate === 'booting') {
            setReady(false);
            const timer = setTimeout(() => {
                setReady(true);
                setTimeout(() => {
                    if (osstateref.current === 'booting') setosstate('locked');
                }, 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [osstate, setosstate]);

    return (
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
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `url(${wallpaperurl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(40px) saturate(1.3)',
                                    transform: 'scale(1.15)',
                                }}
                            />
                            <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.35)' }} />
                        </>
                    ) : (
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0a0a0f 0%, #141420 50%, #0d0d16 100%)' }} />
                    )}

                    {/* Welcome text */}
                    <div className="relative z-10">
                        <WelcomeText />
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
    );
}
