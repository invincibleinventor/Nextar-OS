'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { personal } from './data';
import { useDevice } from './DeviceContext';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoDownload, IoPlay, IoGlobe, IoBriefcase, IoCalendar, IoArrowForward } from 'react-icons/io5';

const BG = '#f0edf5';
const INK = '#2e2e3a';
const PINK = '#f5bde6';
const GRAY = '#8087a2';
const LIGHTGRAY = '#d0cfe0';



const TranslatableName = () => {
    const [hovered, sethovered] = useState(false);

    return (
        <motion.div
            className="relative cursor-pointer"
            onMouseEnter={() => sethovered(true)}
            onMouseLeave={() => sethovered(false)}
        >
            <AnimatePresence mode="wait">
                {hovered ? (
                    <motion.span
                        key="english"
                        className="font-black text-lg leading-tight block"
                        style={{ color: INK }}
                        initial={{ opacity: 0, y: 10, rotateX: -90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, y: -10, rotateX: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        BALA
                    </motion.span>
                ) : (
                    <motion.span
                        key="japanese"
                        className="font-black text-lg leading-tight block"
                        style={{ color: INK }}
                        initial={{ opacity: 0, y: 10, rotateX: -90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, y: -10, rotateX: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        バラ
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TranslatableText = ({ japanese, english, className = '', style = {} }: { japanese: string; english: string; className?: string; style?: React.CSSProperties }) => {
    const [hovered, sethovered] = useState(false);

    return (
        <motion.div
            className={`relative cursor-pointer inline-block ${className}`}
            onMouseEnter={() => sethovered(true)}
            onMouseLeave={() => sethovered(false)}
            style={style}
        >
            <AnimatePresence mode="wait">
                {hovered ? (
                    <motion.span
                        key="english"
                        className="block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {english}
                    </motion.span>
                ) : (
                    <motion.span
                        key="japanese"
                        className="block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                    >
                        {japanese}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const PROJECTS = [
    { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation with window management and installable apps', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', tags: ['Next.js', 'React'] },
    { name: 'SASTracker', desc: 'Question paper archive for SASTRA students with AI solutions', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', tags: ['React', 'Supabase'] },
    { name: 'SquadSearch', desc: 'Anonymous hiring platform verifying skills via GitHub', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', tags: ['Next.js'] },
    { name: 'Falar', desc: 'Social media platform with posts and messaging', url: 'https://github.com/invincibleinventor/falarapp', live: 'https://falarapp.vercel.app', tags: ['React'] },
    { name: 'AIButton', desc: 'Crowdsourced AI content detection for LinkedIn posts', url: 'https://github.com/invincibleinventor/aibutton', live: null, tags: ['Chrome'] },

    { name: 'CleanMyLinkedIn', desc: 'Chrome extension filtering LinkedIn engagement bait', url: 'https://github.com/invincibleinventor/cleanmylinkedin', live: null, tags: ['Chrome'] },
    { name: 'EzyPing', desc: 'Website change monitoring tool', url: 'https://github.com/invincibleinventor/ezyping', live: 'https://ezyping.vercel.app', tags: ['Python'] },
];

const seededrandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

const RainEffect = () => {
    const [m, setM] = useState(false);
    useEffect(() => { setM(true); }, []);
    if (!m) return null;
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            {[...Array(80)].map((_, i) => {
                const r1 = seededrandom(i);
                const r2 = seededrandom(i + 100);
                const r3 = seededrandom(i + 200);
                const r4 = seededrandom(i + 300);
                return (
                    <motion.div
                        key={i}
                        className="absolute w-px"
                        style={{
                            left: `${Math.round(r1 * 100)}%`,
                            height: Math.round(40 + r2 * 80),
                            top: -100,
                            background: `linear-gradient(180deg, transparent, ${GRAY}60, transparent)`
                        }}
                        animate={{ y: ['0vh', '120vh'] }}
                        transition={{ duration: 0.5 + r3 * 0.3, repeat: Infinity, delay: r4 * 1.5, ease: 'linear' }}
                    />
                );
            })}
        </div>
    );
};

const FloatingEmbers = () => {
    const [m, setM] = useState(false);
    useEffect(() => { setM(true); }, []);
    if (!m) return null;
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => {
                const r1 = seededrandom(i + 500);
                const r2 = seededrandom(i + 600);
                const r3 = seededrandom(i + 700);
                const r4 = seededrandom(i + 800);
                const r5 = seededrandom(i + 900);
                const r6 = seededrandom(i + 1000);
                return (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                            left: `${Math.round(20 + r1 * 60)}%`,
                            bottom: `${Math.round(r2 * 30)}%`,
                            background: PINK,
                            boxShadow: `0 0 10px ${PINK}, 0 0 20px ${PINK}50`
                        }}
                        animate={{
                            y: [0, -200 - r3 * 300],
                            x: [0, (r4 - 0.5) * 100],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.3]
                        }}
                        transition={{ duration: 4 + r5 * 3, repeat: Infinity, delay: r6 * 5, ease: 'easeOut' }}
                    />
                );
            })}
        </div>
    );
};

const InkSplatter = ({ className = '' }: { className?: string }) => (
    <motion.div
        className={`absolute pointer-events-none ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.03 }}
        transition={{ duration: 0.5 }}
    >
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="60" fill={INK} />
            <ellipse cx="160" cy="90" rx="30" ry="20" fill={INK} />
            <ellipse cx="50" cy="120" rx="25" ry="15" fill={INK} />
            <circle cx="80" cy="40" r="20" fill={INK} />
            <circle cx="140" cy="150" r="15" fill={INK} />
        </svg>
    </motion.div>
);

const TextureOverlay = () => (
    <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }} />
);

const PastelSun = ({ size = 200, className = '' }: { size?: number; className?: string }) => (
    <motion.div
        className={`absolute lg:static bottom-5 -left-24  rounded-full ${className}`}
        style={{ width: size, height: size, background: PINK }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
    />
);

const GrassLine = () => {
    const [m, setM] = useState(false);
    useEffect(() => { setM(true); }, []);
    if (!m) return null;
    return (
        <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden z-0">
            <svg viewBox="0 0 1200 80" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grassgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={INK} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={INK} />
                    </linearGradient>
                </defs>
                {[...Array(60)].map((_, i) => {
                    const r1 = seededrandom(i + 1100);
                    const r2 = seededrandom(i + 1200);
                    const r3 = seededrandom(i + 1300);
                    const r4 = seededrandom(i + 1400);
                    const x = Math.round(i * 20 + r1 * 10);
                    const h = Math.round(20 + r2 * 40);
                    const w = Math.round((2 + r3 * 3) * 10) / 10;
                    const bend = Math.round((r4 - 0.5) * 15 * 10) / 10;
                    return <path key={i} d={`M${x},80 Q${x + bend},${80 - h / 2} ${x + bend * 0.5},${80 - h}`} stroke="url(#grassgrad)" strokeWidth={w} fill="none" />;
                })}
                <rect x="0" y="70" width="1200" height="10" fill={INK} />
            </svg>
        </div>
    );
};

const SamuraiSilhouette = () => (
    <motion.div
        className="absolute  md:block top-[8%] md:bottom-0 md:top-auto left-4 md:-right-48 lg:right-[12%] h-[20%] lg:top-auto md:left-auto  md:h-[70%] flex items-end z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
    >
        <Image
            src="/vecteezy_samurai-silhouette-vector_11395758-Photoroom.png"
            alt="Samurai"
            width={400}
            height={500}
            className="h-full w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.2))' }}
            priority
        />
    </motion.div>
);

const JpButton = ({ children, primary = false, onClick, href }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; href?: string }) => {
    const Component = href ? motion.a : motion.button;
    return (
        <Component
            onClick={onClick}
            href={href}
            target={href ? '_blank' : undefined}
            className="px-6 md:px-8 py-2.5 md:py-3 font-bold text-xs md:text-sm uppercase tracking-wider rounded-md"
            style={{
                background: primary ? PINK : 'transparent',
                color: primary ? INK : INK,
                border: `2px solid ${primary ? PINK : `${INK}30`}`
            }}
            whileHover={{ scale: 1.02, background: primary ? '#f0b0dd' : `${PINK}15` }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </Component>
    );
};

const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setprogress] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setprogress(p => p < 100 ? p + 10 : p), 50);
        const complete = setTimeout(onComplete, 600);
        return () => { clearInterval(interval); clearTimeout(complete); };
    }, [onComplete]);
    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: BG }} exit={{ opacity: 0 }}>
            <div className="text-center">
                <motion.div className="text-4xl font-black mb-6" style={{ color: INK }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>
                    起動中
                </motion.div>
                <div className="w-48 h-1" style={{ background: LIGHTGRAY }}>
                    <motion.div className="h-full" style={{ background: PINK, width: `${progress}%` }} />
                </div>
            </div>
        </motion.div>
    );
};

const HeroSection = ({ onBoot, embedded }: { onBoot: () => void; embedded?: boolean }) => {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);
    const y = useTransform(scrollY, [0, 400], [0, 100]);
    const sunscale = useTransform(scrollY, [0, 300], [1, 1.3]);
    const samuraix = useTransform(scrollY, [0, 300], [0, 50]);


    return (
        <motion.section className="min-h-screen relative overflow-hidden flex items-center" style={{ background: BG, opacity }}>
            <RainEffect />
            <FloatingEmbers />

            <motion.div className="absolute right-[10%] md:right-[22%] top-[40%] -translate-y-1/2 z-0 hidden md:block" style={{ scale: sunscale }}>
                <PastelSun size={320} />
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${PINK}40 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            </motion.div>

            <div className="absolute right-[5%] top-[15%] z-0 block md:hidden">
                <PastelSun size={120} className="opacity-60" />
            </div>

            <motion.div className="hidden md:block" style={{ x: samuraix }}>
                <SamuraiSilhouette />
            </motion.div>
            <GrassLine />

            <motion.div
                className="absolute right-[2%] top-[20%] text-[6rem] md:text-[12rem] lg:text-[18rem] font-black leading-none select-none pointer-events-none"
                style={{ color: `${LIGHTGRAY}25`, writingMode: 'vertical-rl' }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
            >
                開発
            </motion.div>

            <motion.div className="relative z-20 max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20" style={{ y }}>
                <nav className={`${embedded ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 md:py-5 flex items-center justify-between`} style={{ background: BG }}>
                    <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center font-black text-sm md:text-lg" style={{ background: PINK, color: INK }}>B</div>
                        <div className="flex flex-col">
                            <TranslatableName />
                            <span className="text-[10px] tracking-widest" style={{ color: GRAY }}>DEVELOPER</span>
                        </div>
                    </motion.div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: GRAY }}>
                        <motion.a href="#projects" className="hover:text-anime-text transition-colors relative group" whileHover={{ y: -2 }}>
                            PROJECTS
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all" style={{ background: PINK }} />
                        </motion.a>
                        <motion.a href="#skills" className="hover:text-anime-text transition-colors relative group" whileHover={{ y: -2 }}>
                            SKILLS
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all" style={{ background: PINK }} />
                        </motion.a>
                        <motion.a href="#about" className="hover:text-anime-text transition-colors relative group" whileHover={{ y: -2 }}>
                            ABOUT
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all" style={{ background: PINK }} />
                        </motion.a>
                        {!embedded && <JpButton primary onClick={onBoot}>NEXTAR OS</JpButton>}
                    </div>
                </nav>

                <div className="mt-16 md:mt-20">
                    <TranslatableText
                        japanese="自分自身の戦いを戦う開発者"
                        english="A Dev Fighting His Own Wars"
                        className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black leading-[1.05] mb-4 md:mb-6"
                        style={{ color: INK }}
                    />

                    <motion.div
                        className="flex items-center gap-3 mb-4 md:mb-6"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div className="h-px flex-1 max-w-[60px]" style={{ background: PINK }} />
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.3em]" style={{ color: PINK }}>FULL STACK DEVELOPER</span>
                    </motion.div>

                    <motion.p
                        className="text-sm md:text-lg max-w-md mb-8 md:mb-10 leading-relaxed"
                        style={{ color: GRAY }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        Engineering student from {personal.personal.location} crafting production-ready web applications. 4+ years shipping real products.
                    </motion.p>

                    <motion.div
                        className="flex flex-wrap gap-3 md:gap-4 mb-8 md:mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        {!embedded && <JpButton primary onClick={onBoot}>LAUNCH OS</JpButton>}
                        <JpButton href={personal.personal.socials.github}>GITHUB</JpButton>
                        <JpButton href="/Balasubramanian TBR.pdf">RESUME</JpButton>
                    </motion.div>

                    <motion.div
                        className="flex gap-6 md:gap-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        {[{ n: '7+', l: 'Projects' }, { n: '4+', l: 'Years' }, { n: '15+', l: 'Technologies' }].map((stat, i) => (
                            <motion.div
                                key={i}
                                className="text-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.3 + i * 0.1, type: 'spring' }}
                            >
                                <div className="text-xl md:text-3xl font-black" style={{ color: INK }}>{stat.n}</div>
                                <div className="text-[10px] uppercase tracking-widest" style={{ color: GRAY }}>{stat.l}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>
        </motion.section>
    );
};

const ProjectsSection = () => {
    const [hoveredidx, sethoveredidx] = useState<number | null>(null);

    return (
        <section id="projects" className="py-32 px-8 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${BG} 0%, #d8d4cf 50%, ${BG} 100%)` }}>
            <RainEffect />
            <FloatingEmbers />

            <InkSplatter className="w-[600px] h-[600px] -right-[200px] -top-[100px]" />
            <InkSplatter className="w-[400px] h-[400px] -left-[100px] bottom-[10%]" />

            <motion.div
                className="absolute left-[5%] top-20 text-[8rem] md:text-[12rem] font-black leading-none select-none pointer-events-none"
                style={{ color: `${LIGHTGRAY}15`, writingMode: 'vertical-rl' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
            >
                作品集
            </motion.div>

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div className="flex items-center gap-6 mb-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3">
                        <motion.div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ background: PINK }} whileHover={{ rotate: 5 }}>
                            <span className="text-3xl font-black" style={{ color: BG }}>壱</span>
                        </motion.div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black" style={{ color: INK }}>PROJECTS</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-px w-12" style={{ background: PINK }} />
                                <span className="text-xs tracking-[0.3em]" style={{ color: GRAY }}>FEATURED WORK</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PROJECTS.map((p, i) => (
                        <motion.div
                            key={i}
                            className="group relative"
                            initial={{ opacity: 0, y: 50, rotate: i % 2 === 0 ? -1 : 1 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
                            onHoverStart={() => sethoveredidx(i)}
                            onHoverEnd={() => sethoveredidx(null)}
                        >
                            <motion.div
                                className="absolute inset-0 -z-10"
                                style={{ background: PINK }}
                                initial={{ x: 0, y: 0 }}
                                animate={{ x: hoveredidx === i ? 8 : 0, y: hoveredidx === i ? 8 : 0 }}
                            />

                            <motion.div
                                className="relative p-6 overflow-hidden"
                                style={{
                                    background: BG,
                                    border: `2px solid ${INK}`,
                                    boxShadow: hoveredidx === i ? '0 20px 40px rgba(0,0,0,0.15)' : 'none'
                                }}
                                whileHover={{ x: -4, y: -4 }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 -z-10 opacity-5" style={{
                                    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%231a1a1e' stroke-width='2'/%3E%3C/svg%3E")`
                                }} />

                                <div className="flex items-start justify-between mb-4">
                                    <motion.span
                                        className="text-5xl font-black"
                                        style={{ color: `${LIGHTGRAY}30` }}
                                        animate={{ color: hoveredidx === i ? `${PINK}40` : `${LIGHTGRAY}30` }}
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </motion.span>
                                    <div className="flex gap-2">
                                        {p.live && (
                                            <motion.a
                                                href={p.live}
                                                target="_blank"
                                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                                style={{ background: PINK, color: INK }}
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <IoPlay className="w-3 h-3" />
                                            </motion.a>
                                        )}
                                        <motion.a
                                            href={p.url}
                                            target="_blank"
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ background: INK, color: BG }}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <IoLogoGithub className="w-4 h-4" />
                                        </motion.a>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black mb-2" style={{ color: INK }}>{p.name}</h3>
                                <p className="text-sm leading-relaxed mb-4" style={{ color: GRAY }}>{p.desc}</p>

                                <div className="flex flex-wrap gap-1">
                                    {p.tags.map((tag, ti) => (
                                        <motion.span
                                            key={tag}
                                            className="text-[10px] px-2 py-1 uppercase tracking-wider font-bold"
                                            style={{ background: `${INK}08`, color: INK, border: `1px solid ${INK}15` }}
                                            initial={{ opacity: 0, scale: 0 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.08 + ti * 0.05 }}
                                        >
                                            {tag}
                                        </motion.span>
                                    ))}
                                </div>

                                <motion.div
                                    className="absolute bottom-0 left-0 h-1 w-full origin-left"
                                    style={{ background: PINK }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: hoveredidx === i ? 1 : 0 }}
                                />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const SkillsStars = () => {
    const [m, setM] = useState(false);
    useEffect(() => { setM(true); }, []);
    if (!m) return null;
    return (
        <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => {
                const r1 = seededrandom(i + 2000);
                const r2 = seededrandom(i + 2100);
                const r3 = seededrandom(i + 2200);
                const r4 = seededrandom(i + 2300);
                return (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                            background: BG,
                            left: `${Math.round(r1 * 100)}%`,
                            top: `${Math.round(r2 * 100)}%`,
                            opacity: 0.1
                        }}
                        animate={{
                            scale: [0.5, 1.5, 0.5],
                            opacity: [0.05, 0.2, 0.05]
                        }}
                        transition={{ duration: 3 + r3 * 3, repeat: Infinity, delay: r4 * 3 }}
                    />
                );
            })}
        </div>
    );
};

const SkillsSection = () => {
    const [activecat, setactivecat] = useState(0);
    const categories = [
        { jp: '前端', en: 'FRONTEND', icon: '⚡', skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'GSAP'] },
        { jp: '後端', en: 'BACKEND', icon: '⚙️', skills: ['Node.js', 'Python', 'Express', 'Django', 'FastAPI'] },
        { jp: 'データ', en: 'DATA', icon: '💾', skills: ['PostgreSQL', 'MongoDB', 'Supabase', 'Redis'] },
        { jp: 'ツール', en: 'TOOLS', icon: '🔧', skills: ['Docker', 'Git', 'Linux', 'GCP', 'Selenium'] },
    ];

    return (
        <section id="skills" className="py-32 px-8 relative overflow-hidden" style={{ background: '#2a2a3e' }}>
            <SkillsStars />

            <motion.div
                className="absolute right-[5%] top-1/2 -translate-y-1/2 text-[15rem] font-black leading-none select-none pointer-events-none opacity-5"
                style={{ color: BG, writingMode: 'vertical-rl' }}
            >
                技術
            </motion.div>

            <div className="absolute right-[15%] top-1/3">
                <PastelSun size={150} className="opacity-30" />
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${PINK}30 0%, transparent 70%)` }}
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div className="flex items-center gap-6 mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
                    <motion.div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ background: PINK }} whileHover={{ rotate: -5 }}>
                        <span className="text-3xl font-black" style={{ color: BG }}>弐</span>
                    </motion.div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black" style={{ color: BG }}>SKILLS</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-px w-12" style={{ background: PINK }} />
                            <span className="text-xs tracking-[0.3em]" style={{ color: GRAY }}>TECH STACK</span>
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-wrap gap-3 mb-12">
                    {categories.map((cat, i) => (
                        <motion.button
                            key={cat.jp}
                            className="px-6 py-3 font-bold text-sm uppercase tracking-wider relative overflow-hidden"
                            style={{
                                background: activecat === i ? PINK : 'transparent',
                                color: activecat === i ? BG : LIGHTGRAY,
                                border: `2px solid ${activecat === i ? PINK : LIGHTGRAY}40`
                            }}
                            onClick={() => setactivecat(i)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="mr-2">{cat.icon}</span>
                            {cat.en}
                            <span className="ml-3 text-xs opacity-60">{cat.jp}</span>
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activecat}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {categories[activecat].skills.map((skill, i) => (
                            <motion.div
                                key={skill}
                                className="group relative p-6 overflow-hidden"
                                style={{ background: `${BG}08`, border: `1px solid ${BG}15` }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.02, background: `${BG}15` }}
                            >
                                <motion.div
                                    className="absolute top-2 right-2 text-4xl opacity-10"
                                    animate={{ rotate: [0, 10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    {categories[activecat].icon}
                                </motion.div>

                                <div className="text-lg font-black" style={{ color: BG }}>{skill}</div>
                                <motion.div
                                    className="h-0.5 mt-3 origin-left"
                                    style={{ background: PINK }}
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
};

const AboutSection = () => {
    const experiences = [
        { role: 'Software Engineering Intern', company: 'For Real', period: 'Jan 2026 - Present', current: true },
        { role: 'Technical Lead', company: 'The TVS School', period: 'Aug 2022 - May 2024', current: false },
    ];

    return (
        <section id="about" className="py-32 px-8 relative overflow-hidden" style={{ background: BG }}>
            <RainEffect />
            <FloatingEmbers />

            <InkSplatter className="w-[500px] h-[500px] -left-[150px] top-[20%]" />
            <InkSplatter className="w-[300px] h-[300px] right-[5%] bottom-[10%]" />

            <motion.div
                className="absolute right-[3%] top-20 text-[10rem] font-black leading-none select-none pointer-events-none"
                style={{ color: `${LIGHTGRAY}10`, writingMode: 'vertical-rl' }}
            >
                私について
            </motion.div>

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div className="flex items-center gap-6 mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
                    <motion.div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ background: PINK }} whileHover={{ rotate: 5 }}>
                        <span className="text-3xl font-black" style={{ color: BG }}>参</span>
                    </motion.div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black" style={{ color: INK }}>ABOUT</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-px w-12" style={{ background: PINK }} />
                            <span className="text-xs tracking-[0.3em]" style={{ color: GRAY }}>THE DEVELOPER</span>
                        </div>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-[auto_1fr] gap-12 items-start">
                    <motion.div
                        className="relative group"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 -z-10"
                            style={{ background: PINK }}
                            initial={{ x: 0, y: 0 }}
                            whileHover={{ x: 12, y: 12 }}
                        />
                        <div className="w-56 h-72 relative overflow-hidden" style={{ border: `3px solid ${INK}` }}>
                            <Image src="/bala.jpeg" alt="Bala" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <motion.div
                            className="absolute -bottom-4 -right-4 px-4 py-2 font-black text-sm"
                            style={{ background: INK, color: BG }}
                        >
                            侍開発者
                        </motion.div>
                    </motion.div>

                    <div>
                        <motion.p
                            className="text-xl md:text-2xl font-bold leading-relaxed mb-8"
                            style={{ color: INK }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                        >
                            Engineering undergrad with a passion for building. Started coding in 9th grade, never stopped shipping.
                        </motion.p>

                        <motion.p
                            className="text-base leading-relaxed mb-10"
                            style={{ color: GRAY }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            4+ years of full-stack development experience. Currently seeking software engineering internships where I can contribute to meaningful products and grow as a developer.
                        </motion.p>

                        <div className="space-y-4">
                            <div className="text-xs font-bold tracking-[0.3em] mb-4" style={{ color: PINK }}>EXPERIENCE</div>
                            {experiences.map((exp, i) => (
                                <motion.div
                                    key={i}
                                    className="relative p-5 overflow-hidden group"
                                    style={{ background: exp.current ? `${PINK}08` : `${INK}05`, border: `2px solid ${exp.current ? PINK : INK}20` }}
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ x: 5 }}
                                >
                                    <motion.div
                                        className="absolute left-0 top-0 bottom-0 w-1"
                                        style={{ background: exp.current ? PINK : LIGHTGRAY }}
                                    />

                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-black text-lg" style={{ color: INK }}>{exp.role}</div>
                                            <div className="text-sm font-medium" style={{ color: exp.current ? PINK : GRAY }}>{exp.company}</div>
                                            <div className="text-xs mt-2 flex items-center gap-2" style={{ color: LIGHTGRAY }}>
                                                <IoCalendar className="w-3 h-3" /> {exp.period}
                                            </div>
                                        </div>
                                        {exp.current && (
                                            <motion.span
                                                className="px-3 py-1 text-xs font-black"
                                                style={{ background: PINK, color: INK }}
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                NOW
                                            </motion.span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactParticles = () => {
    const [m, setM] = useState(false);
    useEffect(() => { setM(true); }, []);
    if (!m) return null;
    return (
        <div className="absolute inset-0 overflow-hidden">
            {[...Array(40)].map((_, i) => {
                const r1 = seededrandom(i + 3000);
                const r2 = seededrandom(i + 3100);
                const r3 = seededrandom(i + 3200);
                const r4 = seededrandom(i + 3300);
                const r5 = seededrandom(i + 3400);
                const r6 = seededrandom(i + 3500);
                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            width: Math.round(2 + r1 * 3),
                            height: Math.round(2 + r2 * 3),
                            borderRadius: '50%',
                            background: i % 3 === 0 ? PINK : BG,
                            left: `${Math.round(r3 * 100)}%`,
                            top: `${Math.round(r4 * 100)}%`,
                            opacity: 0.1
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.05, 0.15, 0.05]
                        }}
                        transition={{ duration: 4 + r5 * 4, repeat: Infinity, delay: r6 * 4 }}
                    />
                );
            })}
        </div>
    );
};

const ContactSection = ({ onBoot, embedded }: { onBoot: () => void; embedded?: boolean }) => {
    return (
        <section className="py-32 px-8 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #2a2a3e 0%, #363650 100%)` }}>
            <ContactParticles />

            <div className="absolute right-[10%] top-1/2 -translate-y-1/2">
                <PastelSun size={250} className="opacity-50" />
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${PINK}50 0%, transparent 60%)` }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            </div>

            <motion.div
                className="absolute left-[5%] top-1/2 -translate-y-1/2 text-[12rem] font-black leading-none select-none pointer-events-none opacity-5"
                style={{ color: BG, writingMode: 'vertical-rl' }}
            >
                連絡
            </motion.div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div className="flex items-center gap-6 mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
                    <motion.div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ background: PINK }} whileHover={{ rotate: -5 }}>
                        <span className="text-3xl font-black" style={{ color: BG }}>四</span>
                    </motion.div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black" style={{ color: BG }}>CONTACT</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-px w-12" style={{ background: PINK }} />
                            <span className="text-xs tracking-[0.3em]" style={{ color: GRAY }}>GET IN TOUCH</span>
                        </div>
                    </div>
                </motion.div>

                <motion.p
                    className="text-xl md:text-2xl font-bold mb-4 max-w-lg"
                    style={{ color: BG }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                >
                    Ready to build something amazing together?
                </motion.p>

                <motion.p
                    className="text-base mb-10 max-w-lg"
                    style={{ color: LIGHTGRAY }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    Open to internship opportunities and exciting projects. Let&apos;s connect and create something extraordinary.
                </motion.p>

                <motion.div
                    className="flex flex-wrap gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.a
                        href={`mailto:${personal.personal.email}`}
                        className="group relative px-8 py-4 font-black text-sm uppercase tracking-wider flex items-center gap-3 overflow-hidden"
                        style={{ background: PINK, color: INK }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <IoMail className="w-5 h-5" />
                        <span>SEND EMAIL</span>
                        <motion.div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    </motion.a>

                    <motion.a
                        href={personal.personal.socials.linkedin}
                        target="_blank"
                        className="px-8 py-4 font-black text-sm uppercase tracking-wider flex items-center gap-3"
                        style={{ background: 'transparent', color: BG, border: `2px solid ${BG}40` }}
                        whileHover={{ borderColor: BG, scale: 1.02 }}
                    >
                        <IoLogoLinkedin className="w-5 h-5" />
                        <span>LINKEDIN</span>
                    </motion.a>

                    <motion.a
                        href={personal.personal.socials.github}
                        target="_blank"
                        className="px-8 py-4 font-black text-sm uppercase tracking-wider flex items-center gap-3"
                        style={{ background: 'transparent', color: BG, border: `2px solid ${BG}40` }}
                        whileHover={{ borderColor: BG, scale: 1.02 }}
                    >
                        <IoLogoGithub className="w-5 h-5" />
                        <span>GITHUB</span>
                    </motion.a>
                </motion.div>

                {!embedded && (
                    <motion.div
                        className="mt-16 pt-8 flex items-center gap-6"
                        style={{ borderTop: `1px solid ${BG}15` }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="text-xs tracking-widest" style={{ color: GRAY }}>OR EXPLORE</span>
                        <motion.button
                            onClick={onBoot}
                            className="px-6 py-3 font-black text-sm uppercase tracking-wider flex items-center gap-2"
                            style={{ background: `${BG}10`, color: BG, border: `1px solid ${BG}30` }}
                            whileHover={{ background: `${BG}20` }}
                        >
                            <IoPlay className="w-4 h-4" />
                            LAUNCH NEXTAR OS
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

const scrollstyles = `
.portfolio-scroll::-webkit-scrollbar { width: 6px; }
.portfolio-scroll::-webkit-scrollbar-track { background: ${BG}; }
.portfolio-scroll::-webkit-scrollbar-thumb { background: ${LIGHTGRAY}; border-radius: 3px; }
.portfolio-scroll::-webkit-scrollbar-thumb:hover { background: ${PINK}; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap');
`;

export default function Portfolio({ embedded }: { embedded?: boolean } = {}) {
    const { setappmode, setosstate } = useDevice();
    const [booting, setbooting] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    const handleboot = useCallback(() => setbooting(true), []);
    const handlecomplete = useCallback(() => { setbooting(false); setosstate('booting'); setappmode('os'); }, [setosstate, setappmode]);

    return (
        <>
            <style>{scrollstyles}</style>
            {!embedded && <TextureOverlay />}
            {!embedded && <AnimatePresence>{booting && <BootSequence onComplete={handlecomplete} />}</AnimatePresence>}

            <div ref={containerref} className={`portfolio-scroll ${embedded ? 'w-full h-full' : 'fixed inset-0'} overflow-y-auto overflow-x-hidden`} style={{ fontFamily: '"Zen Kaku Gothic New", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                <HeroSection onBoot={handleboot} embedded={embedded} />
                <ProjectsSection />
                <SkillsSection />
                <AboutSection />
                <ContactSection onBoot={handleboot} embedded={embedded} />

                <footer className="py-6 px-8 flex items-center justify-between text-xs" style={{ background: INK, color: LIGHTGRAY }}>
                    <div>© {new Date().getFullYear()} {personal.personal.name}</div>
                    <div className="flex gap-4">
                        <motion.a href={personal.personal.socials.github} target="_blank" whileHover={{ color: BG }}><IoLogoGithub className="w-4 h-4" /></motion.a>
                        <motion.a href={personal.personal.socials.linkedin} target="_blank" whileHover={{ color: BG }}><IoLogoLinkedin className="w-4 h-4" /></motion.a>
                        <motion.a href={`mailto:${personal.personal.email}`} whileHover={{ color: BG }}><IoMail className="w-4 h-4" /></motion.a>
                    </div>
                </footer>
            </div>
        </>
    );
}
