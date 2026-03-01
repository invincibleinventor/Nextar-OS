'use client';
import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import { personal } from './data';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoGlobeOutline, IoArrowForward, IoRocketOutline, IoChevronForward, IoCodeSlash, IoCalendarOutline, IoLayersOutline } from 'react-icons/io5';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { glassCard } from './hooks/useClayStyles';

const PROJECTS = [
    { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation with window management and installable apps', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', tags: ['Next.js', 'React', 'Electron'], img: '/projects/nextaros.png' },
    { name: 'SASTracker', desc: 'Question paper archive for SASTRA students with AI solutions', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', tags: ['React', 'Supabase'], img: '/projects/sastracker.png' },
    { name: 'SquadSearch', desc: 'Anonymous hiring platform verifying skills via GitHub', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', tags: ['Next.js'], img: '/projects/squadsearch.png' },
    { name: 'Falar', desc: 'Social media platform with posts and messaging', url: 'https://github.com/invincibleinventor/falarapp', live: 'https://falarapp.vercel.app', tags: ['React'], img: '/projects/falar.png' },
    { name: 'AIButton', desc: 'Crowdsourced AI content detection for LinkedIn posts', url: 'https://github.com/invincibleinventor/aibutton', live: null, tags: ['Chrome Extension'], img: '/projects/aibutton.png' },
    { name: 'CleanMyLinkedIn', desc: 'Chrome extension filtering LinkedIn engagement bait', url: 'https://github.com/invincibleinventor/cleanmylinkedin', live: null, tags: ['Chrome Extension'], img: '/projects/cleanmylinkedin.png' },
    { name: 'EzyPing', desc: 'Website change monitoring tool', url: 'https://github.com/invincibleinventor/ezyping', live: 'https://ezyping.vercel.app', tags: ['Python'], img: '/projects/ezyping.png' },
];

const SKILLS: Record<string, string[]> = {
    'Frontend': ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'GSAP'],
    'Backend': ['Node.js', 'Python', 'Express', 'Django', 'FastAPI'],
    'Data & Infra': ['PostgreSQL', 'MongoDB', 'Supabase', 'Redis', 'Docker', 'GCP'],
    'Other': ['Git', 'Linux', 'Selenium'],
};

const EXPERIENCES = [
    { role: 'Software Engineering Intern', company: 'For Real', period: 'Jan 2026 – Present', current: true },
    { role: 'Technical Lead', company: 'The TVS School', period: 'Aug 2022 – May 2024', current: false },
];

const STATS = [
    { icon: IoCodeSlash, value: '7+', label: 'Projects' },
    { icon: IoCalendarOutline, value: '4+', label: 'Years' },
    { icon: IoLayersOutline, value: '20+', label: 'Technologies' },
];

const cursiveFont = "'Snell Roundhand', 'Segoe Script', 'Dancing Script', cursive";

export default function Portfolio({ embedded }: { embedded?: boolean } = {}) {
    const containerref = useRef<HTMLDivElement>(null);
    const { ismobile } = useDevice();
    const clay = useIsClay();

    const handlegetstarted = useCallback(() => {
        if (embedded && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('close-about'));
        }
    }, [embedded]);

    const cardCls = (extra = '') => clay
        ? `rounded-[16px] ${extra}`
        : `bg-[--bg-surface] border border-[--border-color] ${extra}`;
    const cardSty = clay ? glassCard : undefined;

    return (
        <div
            ref={containerref}
            className={`w-full h-full overflow-y-auto overflow-x-hidden bg-[--bg-base] ${clay ? '' : 'font-mono'}`}
        >
            <div className={`max-w-4xl mx-auto px-5 md:px-8 ${ismobile ? 'py-6' : 'py-10'} space-y-5`}>

                {/* ── Hero Card ── */}
                <div className={`p-6 md:p-8 ${cardCls()}`} style={cardSty}>
                    <div className="flex items-start gap-5 md:gap-6">
                        <div className={`w-20 h-20 md:w-24 md:h-24 relative shrink-0 overflow-hidden ${clay ? 'rounded-[18px]' : 'rounded-[12px]'}`}
                            style={{ boxShadow: clay ? 'var(--shadow-md)' : '0 2px 12px rgba(0,0,0,0.12)' }}
                        >
                            <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-4xl font-bold text-[--text-color] leading-none tracking-tight"
                                style={{ fontFamily: cursiveFont, fontStyle: 'italic' }}
                            >
                                Balasubramanian
                            </h1>
                            <p className="text-[13px] text-accent font-semibold mt-1.5">Full Stack Developer</p>
                            <p className="text-[12px] text-[--text-muted] mt-2 leading-relaxed max-w-md">
                                Engineering student with 4+ years building production-ready web apps, tools, and browser extensions. Currently interning at For Real.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-5">
                        <a href={personal.personal.socials.github} target="_blank"
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold transition-all ${clay
                                ? 'rounded-full text-white active:scale-[0.97]'
                                : 'text-[--bg-base] bg-accent'
                            }`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            <IoLogoGithub size={13} /> GitHub
                        </a>
                        <a href={personal.personal.socials.linkedin} target="_blank"
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                                ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                            }`}
                        >
                            <IoLogoLinkedin size={13} /> LinkedIn
                        </a>
                        <a href="/Balasubramanian TBR.pdf" target="_blank"
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                                ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                            }`}
                        >
                            Resume <IoArrowForward size={11} />
                        </a>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-3">
                    {STATS.map((stat, i) => (
                        <div key={i} className={`p-4 text-center ${cardCls()}`} style={cardSty}>
                            <stat.icon size={18} className="mx-auto text-accent mb-2" />
                            <div className="text-2xl font-bold text-[--text-color] leading-none">{stat.value}</div>
                            <div className="text-[10px] uppercase tracking-widest text-[--text-muted] mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Experience ── */}
                <div className={`p-5 md:p-6 ${cardCls()}`} style={cardSty}>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[--text-muted] mb-4">Experience</h2>
                    <div className="space-y-4">
                        {EXPERIENCES.map((exp, i) => (
                            <div key={i} className={`flex items-start gap-3.5 p-3.5 ${clay ? 'rounded-[12px] bg-[--bg-glass-active]' : 'bg-[--bg-base] border border-[--border-color]'}`}>
                                <div className={`w-1.5 self-stretch shrink-0 ${clay ? 'rounded-full' : ''}`}
                                    style={{ background: exp.current ? 'var(--accent-color)' : clay ? 'var(--glass-border)' : 'var(--border-color)' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[13px] font-bold text-[--text-color]">{exp.role}</span>
                                        {exp.current && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-white ${clay ? 'rounded-full' : ''}`}
                                                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                                            >Now</span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-[--text-muted] mt-0.5">{exp.company} &middot; {exp.period}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Projects ── */}
                <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[--text-muted] mb-3 px-1">Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PROJECTS.map((p, i) => (
                            <div key={i}
                                className={`group overflow-hidden transition-all ${cardCls('hover:shadow-lg')}`}
                                style={cardSty}
                            >
                                <div className={`h-32 relative overflow-hidden ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color]'}`}>
                                    <Image src={p.img} alt={p.name} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" sizes="(max-width: 768px) 100vw, 50vw" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                                        <div>
                                            <h3 className="text-[14px] font-bold text-white leading-tight drop-shadow-md">{p.name}</h3>
                                            <div className="flex gap-1 mt-1">
                                                {p.tags.map(tag => (
                                                    <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-white/90 rounded-full font-medium">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {p.live && (
                                                <a href={p.live} target="_blank"
                                                    className={`w-7 h-7 flex items-center justify-center text-white hover:scale-110 transition-transform ${clay ? 'rounded-[8px]' : 'rounded-sm'}`}
                                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <IoGlobeOutline size={13} />
                                                </a>
                                            )}
                                            <a href={p.url} target="_blank"
                                                className={`w-7 h-7 flex items-center justify-center text-white/90 hover:scale-110 transition-transform backdrop-blur-sm ${clay ? 'rounded-[8px] bg-white/15 border border-white/20' : 'rounded-sm bg-white/15'}`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <IoLogoGithub size={13} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3.5 py-3">
                                    <p className="text-[12px] text-[--text-muted] leading-relaxed line-clamp-2">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Skills ── */}
                <div className={`p-5 md:p-6 ${cardCls()}`} style={cardSty}>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[--text-muted] mb-4">Tech Stack</h2>
                    <div className="space-y-4">
                        {Object.entries(SKILLS).map(([category, skills]) => (
                            <div key={category}>
                                <div className="text-[11px] font-semibold text-[--text-color] mb-2">{category}</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map(skill => (
                                        <span key={skill}
                                            className={`px-3 py-1.5 text-[11px] font-medium text-[--text-color] transition-all ${clay
                                                ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover]'
                                                : 'bg-[--bg-base] border border-[--border-color] hover:bg-[--bg-overlay]'
                                            }`}
                                        >{skill}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Contact ── */}
                <div className={`p-5 md:p-6 ${cardCls()}`} style={cardSty}>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[--text-muted] mb-2">Get in Touch</h2>
                    <p className="text-[12px] text-[--text-muted] mb-4 leading-relaxed">
                        Open to internship opportunities and collaborations. Let&apos;s build something together.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <a href={`mailto:${personal.personal.email}`}
                            className={`inline-flex items-center gap-1.5 px-5 py-2 text-[11px] font-semibold text-white transition-all ${clay ? 'rounded-full active:scale-[0.97]' : ''}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                        >
                            <IoMail size={13} /> Email
                        </a>
                        <a href={personal.personal.socials.linkedin} target="_blank"
                            className={`inline-flex items-center gap-1.5 px-5 py-2 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                                ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                            }`}
                        >
                            <IoLogoLinkedin size={13} /> LinkedIn
                        </a>
                        <a href={personal.personal.socials.github} target="_blank"
                            className={`inline-flex items-center gap-1.5 px-5 py-2 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                                ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                                : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                            }`}
                        >
                            <IoLogoGithub size={13} /> GitHub
                        </a>
                    </div>
                </div>

                {/* ── Get Started (embedded mode) ── */}
                {embedded && (
                    <div className={`p-5 text-center ${cardCls()}`} style={cardSty}>
                        <button onClick={handlegetstarted}
                            className={`px-8 py-2.5 text-white font-bold text-[12px] inline-flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider ${clay ? 'rounded-full active:scale-[0.97]' : ''}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                        >
                            <IoRocketOutline size={16} /> Get Started <IoChevronForward size={12} />
                        </button>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className={`flex items-center justify-between text-[11px] text-[--text-muted] py-3 px-1`}>
                    <span>&copy; {new Date().getFullYear()} Balasubramanian</span>
                    <div className="flex gap-3">
                        <a href={personal.personal.socials.github} target="_blank" className="hover:text-accent transition-colors"><IoLogoGithub size={14} /></a>
                        <a href={personal.personal.socials.linkedin} target="_blank" className="hover:text-accent transition-colors"><IoLogoLinkedin size={14} /></a>
                        <a href={`mailto:${personal.personal.email}`} className="hover:text-accent transition-colors"><IoMail size={14} /></a>
                    </div>
                </div>
            </div>
        </div>
    );
}
