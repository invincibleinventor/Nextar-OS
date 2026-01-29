'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { personal } from './data';
import { useDevice } from './DeviceContext';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoDownload, IoPlay, IoChevronDown, IoFlash, IoLaptop, IoLocation, IoSchool, IoGlobe, IoBriefcase, IoCalendar, IoCheckmark, IoArrowForward } from 'react-icons/io5';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

const NEON = '#F535AA';
const CYAN = '#00F0FF';
const YELLOW = '#FFE600';
const LIME = '#B2FF00';
const PURPLE = '#A855F7';

const PROJECTS = [
    { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation with window management, virtual file system, dock, and multiple apps', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', color: NEON },
    { name: 'SASTracker', desc: 'Question paper archive for SASTRA students with AI solutions and resume sharing', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', color: CYAN },
    { name: 'SquadSearch', desc: 'Anonymous hiring platform that verifies skills through GitHub analysis', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', color: YELLOW },
    { name: 'Falar', desc: 'Social media platform with posts, messaging, and content discovery', url: 'https://github.com/invincibleinventor/falarapp', live: 'https://falarapp.vercel.app', color: LIME },
    { name: 'CleanMyLinkedIn', desc: 'Chrome extension that scores LinkedIn posts and filters engagement bait', url: 'https://github.com/invincibleinventor/cleanmylinkedin', live: null, color: PURPLE },
    { name: 'AIButton', desc: 'Crowdsourced AI content detection for LinkedIn posts', url: 'https://github.com/invincibleinventor/aibutton', live: null, color: NEON },
    { name: 'EzyPing', desc: 'Website change monitoring tool', url: 'https://github.com/invincibleinventor/ezyping', live: 'https://ezyping.vercel.app', color: CYAN },
];

const AnimatedGrid = () => {
    const [cells, setcells] = useState<number[]>([]);
    useEffect(() => {
        const interval = setInterval(() => {
            const newcells = [];
            for (let i = 0; i < 8; i++) newcells.push(Math.floor(Math.random() * 100));
            setcells(newcells);
        }, 2000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(10, 1fr)' }}>
                {[...Array(100)].map((_, i) => (
                    <motion.div key={i} style={{ aspectRatio: '1/1', border: '1px solid #222' }} animate={{ background: cells.includes(i) ? [NEON, CYAN, YELLOW, LIME][Math.floor(Math.random() * 4)] + '40' : 'transparent', boxShadow: cells.includes(i) ? `0 0 20px ${[NEON, CYAN, YELLOW, LIME][Math.floor(Math.random() * 4)]}40` : 'none' }} transition={{ duration: 0.5 }} />
                ))}
            </div>
        </div>
    );
};

const GlowOrbs = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute w-[300px] md:w-[800px] h-[300px] md:h-[800px] rounded-full blur-[150px] md:blur-[200px] opacity-[0.15]" style={{ background: NEON, top: '-20%', left: '-10%' }} animate={{ x: [0, 100, 0], y: [0, 100, 0] }} transition={{ duration: 40, repeat: Infinity }} />
        <motion.div className="absolute w-[300px] md:w-[700px] h-[300px] md:h-[700px] rounded-full blur-[120px] md:blur-[180px] opacity-[0.12]" style={{ background: CYAN, bottom: '0%', left: '60%' }} animate={{ x: [0, -80, 0], y: [0, -60, 0] }} transition={{ duration: 35, repeat: Infinity }} />
        <motion.div className="absolute w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full blur-[100px] md:blur-[150px] opacity-[0.10]" style={{ background: PURPLE, top: '30%', left: '20%' }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 20, repeat: Infinity }} />
    </div>
);

const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [phase, setphase] = useState(0);
    const msgs = ['Loading kernel...', 'Mounting filesystem...', 'Starting UI...', 'Boot complete'];
    useEffect(() => {
        const phases = msgs.map((_, i) => setTimeout(() => setphase(i), i * 80));
        const complete = setTimeout(onComplete, msgs.length * 80 + 60);
        return () => { phases.forEach(clearTimeout); clearTimeout(complete); };
    }, [onComplete]);
    return (
        <motion.div className="fixed inset-0 z-[100] bg-black flex items-center justify-center font-mono" exit={{ opacity: 0 }}>
            <div className="text-center">
                <div className="text-2xl font-black mb-4" style={{ color: NEON }}>NEXTAROS</div>
                <div className="text-xs" style={{ color: CYAN }}>{msgs[phase]}</div>
            </div>
        </motion.div>
    );
};

const FloatingCTA = ({ onBoot }: { onBoot: () => void }) => {
    const [show, setshow] = useState(false);
    useEffect(() => { const t = setTimeout(() => setshow(true), 6000); return () => clearTimeout(t); }, []);
    return (
        <AnimatePresence>
            {show && (
                <motion.button onClick={onBoot} className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 text-black text-xs font-bold uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${NEON}, ${CYAN})` }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }}>
                    <IoLaptop className="w-3 h-3" /> Try NextarOS
                </motion.button>
            )}
        </AnimatePresence>
    );
};

const HeroSection = ({ onBoot }: { onBoot: () => void }) => {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);
    const y = useTransform(scrollY, [0, 400], [0, 80]);

    return (
        <motion.section className="min-h-screen flex items-center justify-center px-4 md:px-12 py-16 md:py-20 relative overflow-hidden" style={{ opacity, y }}>
            <AnimatedGrid />
            <GlowOrbs />
            <div className="max-w-6xl w-full relative z-10">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <motion.div className="order-2 md:order-1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                        <motion.div className="inline-block px-3 py-1 mb-3 text-xs md:text-sm font-bold uppercase tracking-widest border-2" style={{ borderColor: NEON, color: NEON }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>Full Stack Developer</motion.div>
                        <motion.h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <span style={{ color: NEON }}>Bala</span>
                            <span className="text-white">subramanian</span>
                        </motion.h1>
                        <motion.p className="text-sm md:text-lg text-gray-400 mb-4 md:mb-6 max-w-lg leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            Second-year CS student building production-ready web applications with Next.js, React &amp; TypeScript.
                        </motion.p>
                        <motion.div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <span className="flex items-center gap-2"><IoLocation style={{ color: CYAN }} /> {personal.personal.location}</span>
                            <span className="flex items-center gap-2"><IoSchool style={{ color: YELLOW }} /> SASTRA University</span>
                        </motion.div>
                        <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <motion.button onClick={onBoot} className="group flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-black text-xs font-bold uppercase tracking-wider relative overflow-hidden" style={{ background: NEON }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${NEON}, ${CYAN})` }} />
                                <span className="relative flex items-center gap-2"><IoPlay className="w-3 h-3" /> Boot NextarOS</span>
                            </motion.button>
                            <motion.a href={personal.personal.socials.github} target="_blank" className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 border-2 border-[#333] text-gray-300 text-xs uppercase tracking-wider hover:border-white hover:text-white transition-colors" whileHover={{ scale: 1.02 }}><IoLogoGithub className="w-3 h-3" /> Github</motion.a>
                            <motion.a href="/Balasubramanian TBR.pdf" target="_blank" className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 border-2 border-[#333] text-gray-300 text-xs uppercase tracking-wider hover:border-white hover:text-white transition-colors" whileHover={{ scale: 1.02 }}><IoDownload className="w-3 h-3" /> Resume</motion.a>
                        </motion.div>
                    </motion.div>
                    <motion.div className="order-1 md:order-2 flex justify-center overflow-hidden" initial={{ opacity: 0, scale: 0.8, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.6, type: 'spring' }}>
                        <div className="relative p-8 md:p-10">
                            <div className="w-36 h-36 md:w-64 md:h-64 relative overflow-hidden">
                                <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
                                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON}50, ${CYAN}30)`, mixBlendMode: 'color' }} />
                                <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }} />
                            </div>
                            <motion.div className="absolute inset-6 md:inset-4 border-2 border-dashed" style={{ borderColor: NEON }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
                            <motion.div className="absolute inset-2 md:inset-0 border border-dashed opacity-50" style={{ borderColor: CYAN }} animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }} />
                            <motion.div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 px-3 py-1 text-[10px] font-bold uppercase" style={{ background: YELLOW, color: 'black' }}>7+ Projects</motion.div>
                        </div>
                    </motion.div>
                </div>
                <motion.div className="mt-10 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    {[{ n: '7+', l: 'Projects', c: NEON }, { n: '500+', l: 'Commits', c: CYAN }, { n: '15+', l: 'Technologies', c: YELLOW }, { n: '2+', l: 'Years', c: LIME }].map((s, i) => (
                        <motion.div key={i} className="relative border-2 border-[#222] p-3 text-center bg-black/50 backdrop-blur-sm group overflow-hidden" whileHover={{ borderColor: s.c, y: -4 }}>
                            <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at center, ${s.c}15, transparent 70%)` }} />
                            <div className="relative z-10">
                                <div className="text-xl md:text-3xl font-black" style={{ color: s.c }}>{s.n}</div>
                                <div className="text-[9px] md:text-xs text-gray-500 uppercase tracking-widest mt-1">{s.l}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <IoChevronDown className="w-5 h-5" style={{ color: NEON }} />
            </motion.div>
        </motion.section>
    );
};

const ProjectsSection = ({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) => {
    const sectionref = useRef<HTMLDivElement>(null);
    const [hovered, sethovered] = useState<number | null>(null);

    useGSAP(() => {
        if (!sectionref.current || !scroller.current) return;
        gsap.fromTo('.project-row', { x: -60, opacity: 0 }, {
            x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: sectionref.current, start: 'top 70%', scroller: scroller.current }
        });
    }, { scope: sectionref, dependencies: [scroller] });

    return (
        <section ref={sectionref} className="py-16 md:py-24 px-4 md:px-12 bg-black overflow-hidden">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                    <div className="w-12 h-12 md:w-14 md:h-14 border-2 flex items-center justify-center" style={{ borderColor: PURPLE }}>
                        <span className="text-xl md:text-2xl font-black" style={{ color: PURPLE }}>P</span>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Projects</h2>
                        <div className="h-0.5 w-14 md:w-20 mt-1" style={{ background: `linear-gradient(90deg, ${PURPLE}, transparent)` }} />
                    </div>
                </div>

                <div className="space-y-3">
                    {PROJECTS.map((p, i) => (
                        <motion.div key={i} className="project-row" onMouseEnter={() => sethovered(i)} onMouseLeave={() => sethovered(null)}>
                            <div className="border-2 p-4 md:p-5 transition-all duration-300 relative overflow-hidden" style={{ borderColor: hovered === i ? p.color : '#222', background: hovered === i ? `${p.color}08` : 'transparent' }}>
                                <div className="absolute left-0 top-0 w-1 h-full transition-all duration-300" style={{ background: hovered === i ? p.color : 'transparent' }} />

                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-base md:text-lg font-black uppercase tracking-tight" style={{ color: hovered === i ? p.color : 'white' }}>{p.name}</h3>
                                            <motion.div animate={{ x: hovered === i ? 6 : 0 }} transition={{ duration: 0.2 }}>
                                                <IoArrowForward className="w-4 h-4 md:w-5 md:h-5" style={{ color: p.color, opacity: hovered === i ? 1 : 0.3 }} />
                                            </motion.div>
                                        </div>
                                        <p className="text-sm md:text-base text-gray-400 leading-relaxed">{p.desc}</p>
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        <motion.a href={p.url} target="_blank" className="flex items-center gap-1.5 px-4 py-2 border-2 text-xs md:text-sm font-bold uppercase" style={{ borderColor: p.color, color: p.color }} whileHover={{ background: p.color, color: 'black' }}>
                                            <IoLogoGithub className="w-4 h-4" /> Code
                                        </motion.a>
                                        {p.live && (
                                            <motion.a href={p.live} target="_blank" className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-bold uppercase text-black" style={{ background: p.color }} whileHover={{ filter: 'brightness(1.1)' }}>
                                                <IoGlobe className="w-4 h-4" /> Live
                                            </motion.a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const SkillsSection = ({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) => {
    const sectionref = useRef<HTMLDivElement>(null);

    const categories = [
        { name: 'Frontend', skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion'], color: NEON },
        { name: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL', 'Supabase', 'REST APIs'], color: CYAN },
        { name: 'Tools', skills: ['Git', 'Docker', 'Figma', 'Linux', 'VS Code'], color: YELLOW },
        { name: 'Other', skills: ['Electron', 'WebSockets', 'Chrome Extensions', 'OAuth', 'GSAP'], color: LIME }
    ];

    useGSAP(() => {
        if (!sectionref.current || !scroller.current) return;
        gsap.fromTo('.skill-block', { y: 40, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: sectionref.current, start: 'top 70%', scroller: scroller.current }
        });
    }, { scope: sectionref, dependencies: [scroller] });

    return (
        <section ref={sectionref} className="py-16 md:py-24 px-4 md:px-12 bg-black overflow-hidden">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
                    <div className="w-12 h-12 md:w-14 md:h-14 border-2 flex items-center justify-center" style={{ borderColor: CYAN }}>
                        <span className="text-xl md:text-2xl font-black" style={{ color: CYAN }}>S</span>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Skills</h2>
                        <div className="h-0.5 w-14 md:w-20 mt-1" style={{ background: `linear-gradient(90deg, ${CYAN}, transparent)` }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {categories.map((cat) => (
                        <motion.div key={cat.name} className="skill-block border-2 border-[#222] p-4 md:p-5 relative group overflow-hidden" whileHover={{ borderColor: cat.color }}>
                            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: cat.color }} />

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 md:w-11 md:h-11 border-2 flex items-center justify-center" style={{ borderColor: cat.color }}>
                                    <span className="text-base md:text-lg font-black" style={{ color: cat.color }}>{cat.name.charAt(0)}</span>
                                </div>
                                <h3 className="text-base md:text-lg font-black uppercase tracking-wider" style={{ color: cat.color }}>{cat.name}</h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {cat.skills.map((skill) => (
                                    <motion.div key={skill} className="px-3 py-2 border border-[#333] text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400" whileHover={{ borderColor: cat.color, color: 'white', x: 2 }}>
                                        {skill}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AboutSection = ({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) => {
    const sectionref = useRef<HTMLDivElement>(null);
    const [tab, settab] = useState<'about' | 'experience'>('about');

    useGSAP(() => {
        if (!sectionref.current || !scroller.current) return;
        gsap.fromTo('.about-content', { y: 40, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
            scrollTrigger: { trigger: sectionref.current, start: 'top 70%', scroller: scroller.current }
        });
    }, { scope: sectionref, dependencies: [scroller] });

    const experiences = [
        { role: 'Software Engineering Intern', company: 'For Real', url: 'https://www.linkedin.com/company/forreal', period: 'Jan 2025 - Present', color: NEON, current: true },
        { role: 'Technical Lead', company: 'The TVS School', url: 'https://www.tvsschool.com', period: 'Aug 2022 - May 2024', color: CYAN, current: false },
    ];

    const highlights = [
        '4+ years building with MERN + Next.js stack',
        'Frontend: React, Tailwind, shadcn/ui, Framer Motion, GSAP',
        'Backend: Node.js, Express, Django, FastAPI',
        'Databases: PostgreSQL, MongoDB, Firebase, Supabase',
        'DevOps: Docker, GCP, automation with Selenium',
        'Built multiple production apps used by real students',
        'Passionate about shipping end-to-end products',
        'Open source enthusiast, Linux & FOSS advocate',
    ];

    return (
        <section ref={sectionref} className="py-16 md:py-24 px-4 md:px-12 bg-black overflow-hidden">
            <div className="max-w-4xl mx-auto">
                <div className="about-content">
                    <div className="flex items-center gap-3 md:gap-4 mb-6">
                        <div className="w-12 h-12 md:w-14 md:h-14 border-2 flex items-center justify-center" style={{ borderColor: LIME }}>
                            <span className="text-xl md:text-2xl font-black" style={{ color: LIME }}>A</span>
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">About</h2>
                            <div className="h-0.5 w-14 md:w-20 mt-1" style={{ background: `linear-gradient(90deg, ${LIME}, transparent)` }} />
                        </div>
                    </div>

                    <div className="flex gap-2 mb-5">
                        {(['about', 'experience'] as const).map((t) => (
                            <motion.button key={t} onClick={() => settab(t)} className={`px-4 md:px-5 py-2 text-xs md:text-sm font-bold uppercase tracking-wider border-2 transition-all ${tab === t ? 'text-black' : 'text-gray-500'}`} style={{ borderColor: tab === t ? LIME : '#333', background: tab === t ? LIME : 'transparent' }} whileHover={{ scale: 1.02 }}>
                                {t === 'about' ? 'About Me' : 'Experience'}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'about' ? (
                            <motion.div key="about" className="border-2 border-[#333] p-4 md:p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="grid md:grid-cols-[auto_1fr] gap-4 md:gap-6 items-start">
                                    <div className="relative hidden md:block">
                                        <div className="w-24 h-24 relative overflow-hidden">
                                            <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" style={{ filter: 'grayscale(100%)' }} />
                                            <motion.div className="absolute inset-0" style={{ background: `linear-gradient(45deg, ${LIME}80, transparent)`, mixBlendMode: 'color' }} animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                                        </div>
                                        <motion.div className="absolute -inset-2 border-2" style={{ borderColor: LIME }} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                                    </div>

                                    <div>
                                        <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-4">
                                            Passionate engineering undergrad looking for software engineering internships to build real products and learn fast. Started web development in 9th grade, and for 4+ years I&apos;ve been shipping production-grade apps used by real people.
                                        </p>

                                        <div className="space-y-2">
                                            {highlights.map((h, i) => (
                                                <motion.div key={i} className="flex items-start gap-2" initial={{ x: -10, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                                    <IoCheckmark className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: [NEON, CYAN, YELLOW, LIME][i % 4] }} />
                                                    <span className="text-xs md:text-sm text-gray-500">{h}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="experience" className="space-y-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                {experiences.map((exp, i) => (
                                    <motion.a key={i} href={exp.url} target="_blank" className="block border-2 p-4 md:p-5 relative overflow-hidden group" style={{ borderColor: exp.color + '40' }} whileHover={{ borderColor: exp.color }}>
                                        <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: exp.color }} />
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: exp.color }} />

                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 md:w-11 md:h-11 border-2 flex items-center justify-center" style={{ borderColor: exp.color }}>
                                                    <IoBriefcase className="w-4 h-4 md:w-5 md:h-5" style={{ color: exp.color }} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm md:text-base font-bold uppercase">{exp.role}</h3>
                                                    <p className="text-xs md:text-sm text-gray-500">{exp.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IoCalendar className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                                                <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{exp.period}</span>
                                                {exp.current && <span className="px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase" style={{ background: exp.color, color: 'black' }}>Current</span>}
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

const NextarShowcase = ({ onBoot, scroller }: { onBoot: () => void; scroller: React.RefObject<HTMLDivElement | null> }) => {
    const sectionref = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!sectionref.current || !scroller.current) return;
        gsap.fromTo('.nextar-box', { scale: 0.95, opacity: 0 }, {
            scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out',
            scrollTrigger: { trigger: sectionref.current, start: 'top 70%', scroller: scroller.current }
        });
    }, { scope: sectionref, dependencies: [scroller] });

    return (
        <section ref={sectionref} className="py-16 md:py-24 px-4 md:px-12 bg-black overflow-hidden">
            <div className="max-w-3xl mx-auto">
                <div className="nextar-box border-2 border-[#333] p-6 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, ${NEON}, ${CYAN})` }} />

                    <motion.div className="inline-block px-3 py-1 mb-4 text-[10px] md:text-xs font-black uppercase tracking-widest border-2" style={{ borderColor: NEON, color: NEON }} animate={{ borderColor: [NEON, CYAN, NEON] }} transition={{ duration: 2, repeat: Infinity }}>Featured</motion.div>

                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-3">
                        <motion.span style={{ color: NEON }} animate={{ textShadow: [`0 0 0px ${NEON}`, `0 0 10px ${NEON}`, `0 0 0px ${NEON}`] }} transition={{ duration: 1.5, repeat: Infinity }}>Nextar</motion.span>
                        <span className="text-white">OS</span>
                    </h2>

                    <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">A complete macOS/iOS simulation in your browser with window management, virtual filesystem, and installable apps.</p>

                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                        <motion.button onClick={onBoot} className="flex items-center gap-2 px-5 md:px-6 py-2.5 text-xs md:text-sm uppercase font-black text-black" style={{ background: `linear-gradient(90deg, ${NEON}, ${CYAN})` }} whileHover={{ scale: 1.02 }}>
                            <IoPlay className="w-4 h-4" /> Launch
                        </motion.button>
                        <motion.a href="https://github.com/invincibleinventor/Nextar-OS" target="_blank" className="flex items-center gap-2 px-5 md:px-6 py-2.5 border-2 border-[#333] text-xs md:text-sm uppercase font-black text-gray-300 hover:border-white hover:text-white" whileHover={{ scale: 1.02 }}>
                            <IoLogoGithub className="w-4 h-4" /> Source
                        </motion.a>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactSection = ({ onBoot, scroller }: { onBoot: () => void; scroller: React.RefObject<HTMLDivElement | null> }) => {
    const sectionref = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!sectionref.current || !scroller.current) return;
        gsap.fromTo('.contact-box', { y: 30, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
            scrollTrigger: { trigger: sectionref.current, start: 'top 80%', scroller: scroller.current }
        });
    }, { scope: sectionref, dependencies: [scroller] });

    return (
        <section ref={sectionref} className="py-16 md:py-24 px-4 md:px-12 bg-black overflow-hidden">
            <div className="max-w-md mx-auto">
                <div className="contact-box border-2 border-[#333] p-6 md:p-8 text-center relative overflow-hidden">
                    <motion.div className="absolute inset-0" style={{ background: `conic-gradient(from 0deg at 50% 50%, ${NEON}10, ${CYAN}10, ${YELLOW}10, ${LIME}10, ${PURPLE}10, ${NEON}10)` }} animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
                    <div className="absolute inset-2 bg-black" />

                    <div className="relative z-10">
                        <motion.div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 border-2 flex items-center justify-center" style={{ borderColor: NEON }} animate={{ boxShadow: [`0 0 0px ${NEON}`, `0 0 15px ${NEON}40`, `0 0 0px ${NEON}`] }} transition={{ duration: 2, repeat: Infinity }}>
                            <IoFlash className="w-5 h-5 md:w-6 md:h-6" style={{ color: NEON }} />
                        </motion.div>

                        <h2 className="text-xl md:text-2xl font-black uppercase mb-2">Let&apos;s Connect</h2>
                        <p className="text-xs md:text-sm text-gray-500 mb-5">Open to internships and collaborations</p>

                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                            <motion.a href={`mailto:${personal.personal.email}`} className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-black uppercase text-black" style={{ background: NEON }} whileHover={{ scale: 1.02 }}><IoMail className="w-4 h-4" /> Email</motion.a>
                            <motion.a href={personal.personal.socials.linkedin} target="_blank" className="flex items-center gap-2 px-4 py-2 border-2 border-[#333] text-xs md:text-sm uppercase font-black text-gray-300 hover:border-white hover:text-white" whileHover={{ scale: 1.02 }}><IoLogoLinkedin className="w-4 h-4" /> LinkedIn</motion.a>
                        </div>

                        <motion.button onClick={onBoot} className="text-xs md:text-sm text-gray-600 hover:text-white transition-colors font-bold uppercase tracking-wider" whileHover={{ x: 5 }}>Or explore NextarOS →</motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default function Portfolio() {
    const { setappmode, setosstate } = useDevice();
    const [booting, setbooting] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    const handleboot = useCallback(() => setbooting(true), []);
    const handlecomplete = useCallback(() => { setbooting(false); setosstate('booting'); setappmode('os'); }, [setosstate, setappmode]);

    return (
        <>
            <AnimatePresence>{booting && <BootSequence onComplete={handlecomplete} />}</AnimatePresence>

            <div ref={containerref} className="fixed inset-0 bg-black text-white overflow-y-auto overflow-x-hidden" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                <FloatingCTA onBoot={handleboot} />
                <HeroSection onBoot={handleboot} />
                <ProjectsSection scroller={containerref} />
                <SkillsSection scroller={containerref} />
                <AboutSection scroller={containerref} />
                <NextarShowcase onBoot={handleboot} scroller={containerref} />
                <ContactSection onBoot={handleboot} scroller={containerref} />

                <footer className="border-t border-[#222] py-5 px-4 bg-black">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <span className="text-xs md:text-sm text-gray-600">© {new Date().getFullYear()} {personal.personal.name}</span>
                        <div className="flex gap-3">
                            <a href={personal.personal.socials.github} target="_blank" className="text-gray-500 hover:text-white"><IoLogoGithub className="w-4 h-4 md:w-5 md:h-5" /></a>
                            <a href={personal.personal.socials.linkedin} target="_blank" className="text-gray-500 hover:text-white"><IoLogoLinkedin className="w-4 h-4 md:w-5 md:h-5" /></a>
                            <a href={`mailto:${personal.personal.email}`} className="text-gray-500 hover:text-white"><IoMail className="w-4 h-4 md:w-5 md:h-5" /></a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
