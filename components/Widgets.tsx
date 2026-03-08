'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { IoLogoGithub, IoLogoLinkedin, IoArrowForward, IoCodeSlash, IoCalendarOutline, IoLayersOutline, IoRocketOutline, IoMailOutline } from 'react-icons/io5';
import { useIsClay } from './hooks/useIsClay';
import { useWindows } from './WindowContext';
import { apps } from './data';

const PROJECTS = [
    { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', tags: ['Next.js', 'React', 'Electron'], img: '/projects/nextaros.png' },
    { name: 'SASTracker', desc: 'Question paper archive with AI solutions', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', tags: ['React', 'Supabase'], img: '/projects/sastracker.png' },
    { name: 'SquadSearch', desc: 'Anonymous hiring via GitHub verification', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', tags: ['Next.js'], img: '/projects/squadsearch.png' },
];

const SKILLS = ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Node.js', 'Python', 'PostgreSQL', 'Docker'];

const STATS = [
    { icon: IoCodeSlash, value: '7+', label: 'Projects' },
    { icon: IoCalendarOutline, value: '4+', label: 'Years' },
    { icon: IoLayersOutline, value: '20+', label: 'Technologies' },
];

const cursiveFont = "'Snell Roundhand', 'Segoe Script', 'Dancing Script', cursive";


const widgetGlass = (clay: boolean): React.CSSProperties => clay ? {
    background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 28%, transparent))',
    backdropFilter: 'blur(var(--glass-blur-heavy))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-md)',
} : {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
};

function openPortfolio(addwindow: any) {
    addwindow({
        id: `portfolio-${Date.now()}`,
        appname: 'Portfolio',
        component: 'apps/Portfolio',
        props: {},
        isminimized: false,
        ismaximized: false,
    });
}

/** Profile Widget — Small (2x2 on mobile grid, ~196px on desktop) */
export function ProfileWidget({ size = 'small', onClick }: { size?: 'small' | 'medium'; onClick?: () => void }) {
    const clay = useIsClay();
    const { addwindow } = useWindows();

    return (
        <motion.div
            className={`flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} ${size === 'medium' ? 'p-3 gap-2' : 'p-3 gap-1.5'}`}
            style={widgetGlass(clay)}
            whileTap={{ scale: 0.97 }}
            onClick={onClick || (() => openPortfolio(addwindow))}
        >
            <div className={`relative overflow-hidden shrink-0 ${clay ? 'rounded-[16px]' : 'rounded-[10px]'} w-12 h-12`}
                style={{ boxShadow: clay ? 'var(--shadow-sm)' : '0 2px 8px rgba(0,0,0,0.1)' }}
            >
                <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
            </div>
            <div className="text-center min-w-0">
                <p className="font-bold text-[13px] leading-tight text-[--text-color]"
                    style={{ fontFamily: cursiveFont, fontStyle: 'italic' }}
                >Bala</p>
                <p className="text-[--text-color] font-semibold mt-0.5 text-[10px]">Full Stack Dev</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
                <a href="https://github.com/invincibleinventor" target="_blank" onClick={e => e.stopPropagation()}
                    className="text-[--text-color] opacity-50 hover:opacity-100 transition-opacity"><IoLogoGithub size={14} /></a>
                <a href="https://www.linkedin.com/in/balasubramaniantbr/" target="_blank" onClick={e => e.stopPropagation()}
                    className="text-[--text-color] opacity-50 hover:opacity-100 transition-opacity"><IoLogoLinkedin size={14} /></a>
                <a href="mailto:balasubramanian.tbr@gmail.com" onClick={e => e.stopPropagation()}
                    className="text-[--text-color] opacity-50 hover:opacity-100 transition-opacity"><IoMailOutline size={14} /></a>
            </div>
        </motion.div>
    );
}

/** Stats Widget — Shows project/years/tech stats */
export function StatsWidget({ onClick }: { onClick?: () => void }) {
    const clay = useIsClay();
    const { addwindow } = useWindows();

    return (
        <motion.div
            className={`flex flex-col cursor-pointer select-none overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} p-3`}
            style={widgetGlass(clay)}
            whileTap={{ scale: 0.97 }}
            onClick={onClick || (() => openPortfolio(addwindow))}
        >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[--text-color] mb-auto">Overview</p>
            <div className="flex flex-col gap-1.5">
                {STATS.map((stat, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 ${clay ? 'rounded-[10px] bg-[--bg-glass-active]' : 'rounded-[8px] bg-[--bg-base] border border-[--border-color]'}`}>
                        <stat.icon size={13} className="text-accent shrink-0" />
                        <span className="text-[13px] font-bold text-[--text-color] leading-none min-w-[24px]">{stat.value}</span>
                        <span className="text-[10px] text-[--text-color] opacity-70 leading-none">{stat.label}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

/** Projects Widget — Featured project cards */
export function ProjectsWidget({ onClick }: { onClick?: () => void }) {
    const clay = useIsClay();
    const { addwindow } = useWindows();

    return (
        <motion.div
            className={`flex flex-col cursor-pointer select-none overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} p-3`}
            style={widgetGlass(clay)}
            whileTap={{ scale: 0.97 }}
            onClick={onClick || (() => openPortfolio(addwindow))}
        >
            <div className="flex items-center justify-between mb-auto">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[--text-color]">Featured Projects</p>
                <IoArrowForward size={10} className="text-[--text-color] opacity-50" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                {PROJECTS.map((p, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 shrink-0 ${clay ? 'rounded-[10px] bg-[--bg-glass-active]' : 'rounded-[8px] bg-[--bg-base] border border-[--border-color]'}`}>
                        <div className={`w-8 h-8 relative shrink-0 overflow-hidden ${clay ? 'rounded-[8px]' : 'rounded-[4px]'}`}>
                            <Image src={p.img} alt={p.name} fill className="object-cover" sizes="32px" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-[--text-color] leading-tight truncate">{p.name}</p>
                            <p className="text-[9px] text-[--text-color] opacity-70 leading-tight mt-0.5 truncate">{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

/** Skills Widget — Tech stack pills */
export function SkillsWidget({ onClick }: { onClick?: () => void }) {
    const clay = useIsClay();
    const { addwindow } = useWindows();

    return (
        <motion.div
            className={`flex flex-col cursor-pointer select-none overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} p-3`}
            style={widgetGlass(clay)}
            whileTap={{ scale: 0.97 }}
            onClick={onClick || (() => openPortfolio(addwindow))}
        >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[--text-color] mb-auto">Tech Stack</p>
            <div className="flex flex-wrap gap-1 content-end">
                {SKILLS.map((skill, i) => (
                    <span key={i}
                        className={`px-2 py-0.5 text-[9px] font-semibold ${clay
                            ? 'rounded-full bg-[--bg-glass-active] text-[--text-color] border border-[--glass-border]'
                            : 'rounded-[4px] bg-[--bg-base] text-[--text-color] border border-[--border-color]'
                        }`}
                    >{skill}</span>
                ))}
            </div>
        </motion.div>
    );
}

/** Experience Widget — Current role */
export function ExperienceWidget({ onClick }: { onClick?: () => void }) {
    const clay = useIsClay();
    const { addwindow } = useWindows();

    return (
        <motion.div
            className={`flex flex-col cursor-pointer select-none overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} p-3`}
            style={widgetGlass(clay)}
            whileTap={{ scale: 0.97 }}
            onClick={onClick || (() => openPortfolio(addwindow))}
        >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[--text-color] mb-auto">Experience</p>
            <div className={`flex items-start gap-2 p-2 ${clay ? 'rounded-[10px] bg-[--bg-glass-active]' : 'rounded-[8px] bg-[--bg-base] border border-[--border-color]'}`}>
                <div className={`w-1 self-stretch shrink-0 ${clay ? 'rounded-full' : ''}`}
                    style={{ background: 'var(--accent-color)' }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-[--text-color]">SWE Intern</span>
                        <span className={`text-[7px] font-bold uppercase tracking-wider px-1 py-px text-white ${clay ? 'rounded-full' : ''}`}
                            style={clay ? { background: 'var(--accent-gradient)' } : { background: 'var(--accent-color)' }}
                        >Now</span>
                    </div>
                    <p className="text-[9px] text-[--text-color] opacity-70 mt-0.5 truncate">For Real &middot; Jan 2026 – Present</p>
                </div>
            </div>
            <div className={`flex items-start gap-2 p-2 mt-1 ${clay ? 'rounded-[10px] bg-[--bg-glass-active]' : 'rounded-[8px] bg-[--bg-base] border border-[--border-color]'}`}>
                <div className={`w-1 self-stretch shrink-0 ${clay ? 'rounded-full' : ''}`}
                    style={{ background: clay ? 'var(--glass-border)' : 'var(--border-color)' }} />
                <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-[--text-color]">Technical Lead</span>
                    <p className="text-[9px] text-[--text-color] opacity-70 mt-0.5 truncate">TVS School &middot; Aug 2022 – May 2024</p>
                </div>
            </div>
        </motion.div>
    );
}

/** Quick Links Widget — Resume, GitHub, LinkedIn */
export function QuickLinksWidget() {
    const clay = useIsClay();

    const links = [
        { label: 'Resume', href: '/Balasubramanian TBR.pdf', icon: IoArrowForward },
        { label: 'GitHub', href: 'https://github.com/invincibleinventor', icon: IoLogoGithub },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/balasubramaniantbr/', icon: IoLogoLinkedin },
    ];

    return (
        <div
            className={`flex flex-col gap-1.5 overflow-hidden w-full h-full ${clay ? 'rounded-[22px]' : 'rounded-[16px]'} p-3`}
            style={widgetGlass(clay)}
        >
            {links.map((link, i) => (
                <a key={i} href={link.href} target="_blank"
                    className={`flex items-center gap-2.5 px-3 py-2.5 transition-all active:scale-[0.97] ${clay
                        ? 'rounded-[12px] hover:bg-[--bg-glass-hover]'
                        : 'rounded-[8px] hover:bg-[--bg-overlay]'
                    }`}
                >
                    <link.icon size={14} className="text-accent shrink-0" />
                    <span className="text-[12px] font-semibold text-[--text-color] flex-1">{link.label}</span>
                    <IoArrowForward size={10} className="text-[--text-color] opacity-50" />
                </a>
            ))}
        </div>
    );
}
