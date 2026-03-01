'use client';
import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import { personal } from './data';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoGlobeOutline, IoArrowForward, IoRocketOutline, IoChevronForward } from 'react-icons/io5';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';

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

export default function Portfolio({ embedded }: { embedded?: boolean } = {}) {
    const containerref = useRef<HTMLDivElement>(null);
    const { ismobile } = useDevice();
    const clay = useIsClay();

    const handlegetstarted = useCallback(() => {
        if (embedded && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('close-about'));
        }
    }, [embedded]);

    const sectionTitle = (text: string) => (
        <h2 className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ${clay ? 'text-[--text-muted]' : 'text-[--text-muted]'}`}>{text}</h2>
    );

    return (
        <div
            ref={containerref}
            className={`w-full h-full overflow-y-auto overflow-x-hidden bg-[--bg-base] ${clay ? '' : 'font-mono'}`}
        >
            <div className={`max-w-3xl mx-auto px-6 md:px-10 ${ismobile ? 'py-6' : 'py-10'}`}>

                {/* ── Profile Header ── */}
                <div className="flex items-center gap-5 mb-2">
                    <div className={`w-[72px] h-[72px] relative shrink-0 overflow-hidden ${clay ? 'rounded-full' : 'rounded-full'}`}
                        style={{ boxShadow: clay ? 'var(--shadow-md)' : '0 2px 8px rgba(0,0,0,0.12)' }}
                    >
                        <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-[--text-color] leading-tight tracking-tight">
                            Balasubramanian
                        </h1>
                        <p className="text-[13px] text-accent font-medium mt-0.5">Full Stack Developer</p>
                    </div>
                </div>

                <p className="text-[13px] text-[--text-muted] leading-relaxed mb-5 max-w-lg">
                    Engineering student with 4+ years building production-ready web apps. Currently interning at For Real.
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-10">
                    <a href={personal.personal.socials.github} target="_blank"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold transition-all ${clay
                            ? 'rounded-full text-white active:scale-[0.97]'
                            : 'text-[--bg-base] bg-accent'
                        }`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <IoLogoGithub size={13} /> GitHub
                    </a>
                    <a href={personal.personal.socials.linkedin} target="_blank"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                            ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                            : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                        }`}
                    >
                        <IoLogoLinkedin size={13} /> LinkedIn
                    </a>
                    <a href="/Balasubramanian TBR.pdf" target="_blank"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                            ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                            : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                        }`}
                    >
                        Resume <IoArrowForward size={11} />
                    </a>
                </div>

                {/* ── Experience ── */}
                {sectionTitle('Experience')}
                <div className="space-y-3 mb-10">
                    {EXPERIENCES.map((exp, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${exp.current ? 'bg-accent' : clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-[13px] font-semibold text-[--text-color]">{exp.role}</span>
                                    {exp.current && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 text-white ${clay ? 'rounded-full' : ''}`}
                                            style={{ background: 'var(--accent-color)' }}>Now</span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[--text-muted]">{exp.company} &middot; {exp.period}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Projects ── */}
                {sectionTitle('Projects')}
                <div className="space-y-3 mb-10">
                    {PROJECTS.map((p, i) => (
                        <div key={i}
                            className={`flex gap-4 p-3 transition-colors ${clay
                                ? 'rounded-[14px] hover:bg-[--bg-glass-hover]'
                                : 'hover:bg-[--bg-overlay] border-b border-[--border-color] last:border-0'
                            }`}
                        >
                            <div className={`w-[100px] h-[64px] md:w-[130px] md:h-[80px] relative shrink-0 overflow-hidden ${clay ? 'rounded-[10px] border border-[--glass-border]' : 'border border-[--border-color]'}`}>
                                <Image src={p.img} alt={p.name} fill className="object-cover" sizes="130px" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-[14px] font-bold text-[--text-color] leading-tight">{p.name}</h3>
                                    <div className="flex gap-1.5 ml-auto shrink-0">
                                        {p.live && (
                                            <a href={p.live} target="_blank" className="text-[--text-muted] hover:text-accent transition-colors" title="Live">
                                                <IoGlobeOutline size={14} />
                                            </a>
                                        )}
                                        <a href={p.url} target="_blank" className="text-[--text-muted] hover:text-accent transition-colors" title="Source">
                                            <IoLogoGithub size={14} />
                                        </a>
                                    </div>
                                </div>
                                <p className="text-[12px] text-[--text-muted] leading-relaxed line-clamp-2 mb-1.5">{p.desc}</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.tags.map(tag => (
                                        <span key={tag} className={`text-[9px] px-1.5 py-0.5 font-semibold ${clay
                                            ? 'bg-[--bg-glass-active] text-accent rounded-[4px]'
                                            : 'bg-[--bg-overlay] text-accent'
                                        }`}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Skills ── */}
                {sectionTitle('Tech Stack')}
                <div className="space-y-4 mb-10">
                    {Object.entries(SKILLS).map(([category, skills]) => (
                        <div key={category}>
                            <div className="text-[11px] font-semibold text-[--text-color] mb-1.5">{category}</div>
                            <div className="flex flex-wrap gap-1.5">
                                {skills.map(skill => (
                                    <span key={skill}
                                        className={`px-2.5 py-1 text-[11px] font-medium text-[--text-muted] ${clay
                                            ? 'rounded-full border border-[--glass-border]'
                                            : 'border border-[--border-color]'
                                        }`}
                                    >{skill}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Contact ── */}
                {sectionTitle('Contact')}
                <div className="flex flex-wrap gap-2 mb-6">
                    <a href={`mailto:${personal.personal.email}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-white transition-all ${clay ? 'rounded-full active:scale-[0.97]' : ''}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                    >
                        <IoMail size={13} /> Email
                    </a>
                    <a href={personal.personal.socials.linkedin} target="_blank"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                            ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                            : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                        }`}
                    >
                        <IoLogoLinkedin size={13} /> LinkedIn
                    </a>
                    <a href={personal.personal.socials.github} target="_blank"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-[--text-color] transition-all ${clay
                            ? 'rounded-full border border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]'
                            : 'border border-[--border-color] hover:bg-[--bg-overlay]'
                        }`}
                    >
                        <IoLogoGithub size={13} /> GitHub
                    </a>
                </div>

                {/* ── Get Started (embedded mode) ── */}
                {embedded && (
                    <div className="py-6 text-center">
                        <button onClick={handlegetstarted}
                            className={`px-8 py-2.5 text-white font-bold text-[12px] inline-flex items-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider ${clay ? 'rounded-full active:scale-[0.97]' : ''}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                        >
                            <IoRocketOutline size={16} /> Get Started <IoChevronForward size={12} />
                        </button>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className={`flex items-center justify-between text-[11px] text-[--text-muted] py-4 ${clay ? 'border-t border-[--glass-border]' : 'border-t border-[--border-color]'}`}>
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
