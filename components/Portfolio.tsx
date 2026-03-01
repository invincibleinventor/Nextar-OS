'use client';
import React, { useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import { personal } from './data';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoPlay, IoArrowForward, IoRocketOutline, IoChevronForward, IoCalendar, IoBriefcase, IoCodeSlash, IoGlobe, IoServer, IoConstruct } from 'react-icons/io5';
import { useDevice } from './DeviceContext';
import { useIsClay } from './hooks/useIsClay';
import { glassCard } from './hooks/useClayStyles';

const PROJECTS = [
    { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation with window management and installable apps', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', tags: ['Next.js', 'React'], img: '/projects/nextaros.png' },
    { name: 'SASTracker', desc: 'Question paper archive for SASTRA students with AI solutions', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', tags: ['React', 'Supabase'], img: '/projects/sastracker.png' },
    { name: 'SquadSearch', desc: 'Anonymous hiring platform verifying skills via GitHub', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', tags: ['Next.js'], img: '/projects/squadsearch.png' },
    { name: 'Falar', desc: 'Social media platform with posts and messaging', url: 'https://github.com/invincibleinventor/falarapp', live: 'https://falarapp.vercel.app', tags: ['React'], img: '/projects/falar.png' },
    { name: 'AIButton', desc: 'Crowdsourced AI content detection for LinkedIn posts', url: 'https://github.com/invincibleinventor/aibutton', live: null, tags: ['Chrome'], img: '/projects/aibutton.png' },
    { name: 'CleanMyLinkedIn', desc: 'Chrome extension filtering LinkedIn engagement bait', url: 'https://github.com/invincibleinventor/cleanmylinkedin', live: null, tags: ['Chrome'], img: '/projects/cleanmylinkedin.png' },
    { name: 'EzyPing', desc: 'Website change monitoring tool', url: 'https://github.com/invincibleinventor/ezyping', live: 'https://ezyping.vercel.app', tags: ['Python'], img: '/projects/ezyping.png' },
];

const SKILLS = [
    { category: 'Frontend', icon: IoCodeSlash, color: 'var(--pastel-blue)', items: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Framer Motion', 'GSAP'] },
    { category: 'Backend', icon: IoServer, color: 'var(--pastel-green)', items: ['Node.js', 'Python', 'Express', 'Django', 'FastAPI'] },
    { category: 'Data', icon: IoGlobe, color: 'var(--pastel-mauve)', items: ['PostgreSQL', 'MongoDB', 'Supabase', 'Redis'] },
    { category: 'Tools', icon: IoConstruct, color: 'var(--pastel-peach)', items: ['Docker', 'Git', 'Linux', 'GCP', 'Selenium'] },
];

const EXPERIENCES = [
    { role: 'Software Engineering Intern', company: 'For Real', period: 'Jan 2026 - Present', current: true },
    { role: 'Technical Lead', company: 'The TVS School', period: 'Aug 2022 - May 2024', current: false },
];

function Nav({ activeSection, onNav }: { activeSection: string; onNav: (id: string) => void; }) {
    const { ismobile } = useDevice();
    const clay = useIsClay();
    return (

        <div className={`${ismobile ?
            'top-0' : 'top-12'} sticky z-30 border-b ${clay ? 'border-[--glass-border] bg-[--bg-glass]' : 'bg-[--bg-surface]/80 border-[--border-color]'} backdrop-blur-xl`}>
            <div className="max-w-5xl mx-auto px-6 md:px-10 flex items-center h-12 gap-6">
                <div className="flex items-center gap-2.5 mr-auto">
                    <div className={`w-7 h-7 flex items-center justify-center ${clay ? 'rounded-[8px]' : ''}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <span className={`font-black text-xs ${clay ? 'text-white' : 'text-[--bg-base] bg-accent w-full h-full flex items-center justify-center shadow-pastel-lg'}`}>B</span>
                    </div>
                    <span className="font-bold text-[13px] text-[--text-color] tracking-tight">Bala</span>
                </div>
                {['projects', 'skills', 'about', 'contact'].map(id => (
                    <button
                        key={id}
                        onClick={() => onNav(id)}
                        className={`text-[12px] font-semibold uppercase tracking-wider transition-colors ${clay ? 'rounded-[8px] px-2 py-1' : ''} ${activeSection === id ? 'text-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                    >
                        {id}
                    </button>
                ))}
            </div>
        </div>
    );
}

const HeroSection = () => {
    const clay = useIsClay();
    return (
    <section className="relative overflow-hidden">
        {!clay && <div className="absolute inset-0 anime-gradient-fade opacity-50" />}
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24 relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
                <div className={`w-28 h-28 md:w-36 md:h-36 relative shrink-0 overflow-hidden border-2 ${clay ? 'border-[--glass-border] rounded-[22px]' : 'border-[--border-color]'}`}
                    style={clay ? { boxShadow: 'var(--shadow-lg)' } : undefined}
                >
                    <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl md:text-5xl font-bold text-[--text-color] tracking-tight mb-1">
                        Balasubramanian
                    </h1>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[2px] w-8 bg-accent" />
                        <p className="text-[12px] font-bold text-accent uppercase tracking-widest">
                            Full Stack Developer
                        </p>
                    </div>
                    <p className="text-[13px] md:text-[14px] text-[--text-muted] max-w-lg leading-relaxed mb-6">
                        Engineering student from {personal.personal.location}. 4+ years building and shipping production-ready web applications.
                    </p>

                    <div className="flex gap-2.5 mb-8">
                        {[
                            { n: '7+', l: 'Projects' },
                            { n: '4+', l: 'Years' },
                            { n: '15+', l: 'Tech' },
                        ].map((stat, i) => (
                            <div key={i} className={`px-4 py-2.5 border ${clay ? 'border-[--glass-border] rounded-[12px]' : 'border-[--border-color] bg-[--bg-surface] shadow-pastel'}`}
                                style={clay ? glassCard : undefined}
                            >
                                <div className="text-xl font-bold text-[--text-color] leading-none">{stat.n}</div>
                                <div className="text-[10px] uppercase tracking-wider text-[--text-muted] mt-1">{stat.l}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <a href={personal.personal.socials.github} target="_blank"
                            className={`px-5 py-2 text-white font-bold text-[12px] flex items-center gap-2 hover:opacity-90 transition-opacity uppercase tracking-wider ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-accent text-[--bg-base] shadow-pastel-lg'}`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            <IoLogoGithub className="w-4 h-4" /> GitHub
                        </a>
                        <a href={personal.personal.socials.linkedin} target="_blank"
                            className={`px-5 py-2 text-[--text-color] font-bold text-[12px] flex items-center gap-2 transition-colors uppercase tracking-wider ${clay ? 'rounded-[12px] border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'border border-[--border-color] hover:bg-[--bg-surface]'}`}
                            style={clay ? { border: '1px solid var(--glass-border)' } : undefined}
                        >
                            <IoLogoLinkedin className="w-4 h-4" /> LinkedIn
                        </a>
                        <a href="/Balasubramanian TBR.pdf" target="_blank"
                            className={`px-5 py-2 text-[--text-color] font-bold text-[12px] flex items-center gap-2 transition-colors uppercase tracking-wider ${clay ? 'rounded-[12px] border-[--glass-border] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'border border-[--border-color] hover:bg-[--bg-surface]'}`}
                            style={clay ? { border: '1px solid var(--glass-border)' } : undefined}
                        >
                            Resume <IoArrowForward className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    );
};

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => {
    const clay = useIsClay();
    return (
        <div className="flex items-center gap-3 mb-10">
            <div className={`w-10 h-10 flex items-center justify-center ${clay ? 'rounded-[12px]' : ''}`}
                style={clay ? { background: 'var(--bg-glass-hover)', border: '1px solid var(--glass-border)' } : { background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}
            >
                <Icon className="w-5 h-5 text-accent" />
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[--text-color] leading-none">{title}</h2>
                <p className="text-[11px] text-[--text-muted] uppercase tracking-widest mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
};

const ProjectsSection = () => {
    const clay = useIsClay();
    return (
    <section id="projects" className={`py-16 md:py-20 px-6 md:px-10 border-y ${clay ? 'bg-[--bg-surface] border-[--glass-border]' : 'bg-[--bg-surface] border-[--border-color]'}`}>
        <div className="max-w-5xl mx-auto">
            <SectionHeader icon={IoCodeSlash} title="Projects" subtitle="Featured work" />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROJECTS.map((p, i) => (
                    <div key={i}
                        className={`group overflow-hidden transition-all ${clay
                            ? 'rounded-[16px] hover:shadow-[var(--shadow-md)]'
                            : 'bg-[--bg-base] border border-[--border-color] hover:shadow-pastel'
                        }`}
                        style={clay ? glassCard : undefined}
                    >
                        <div className={`h-32 relative overflow-hidden border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color] bg-[--bg-overlay]'}`}>
                            <Image
                                src={p.img}
                                alt={p.name}
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[--bg-base] via-transparent to-transparent" />
                            <div className="absolute top-2 right-2 flex gap-1.5">
                                {p.live && (
                                    <a href={p.live} target="_blank"
                                        className={`w-7 h-7 flex items-center justify-center text-white hover:scale-105 transition-transform ${clay ? 'rounded-[8px]' : 'bg-accent text-[--bg-base] shadow-pastel-lg'}`}
                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        <IoPlay className="w-3 h-3" />
                                    </a>
                                )}
                                <a href={p.url} target="_blank" className={`w-7 h-7 flex items-center justify-center backdrop-blur-sm text-[--text-color] hover:scale-105 transition-transform ${clay ? 'rounded-[8px] bg-[--bg-glass] border border-[--glass-border]' : 'bg-[--bg-surface]/90 border border-[--border-color]'}`}>
                                    <IoLogoGithub className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-[14px] font-bold text-[--text-color] mb-1">{p.name}</h3>
                            <p className="text-[12px] text-[--text-muted] leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                            <div className="flex flex-wrap gap-1">
                                {p.tags.map((tag) => (
                                    <span key={tag} className={`text-[9px] px-2 py-0.5 text-accent uppercase tracking-wider font-bold ${clay ? 'bg-[--bg-glass-hover] rounded-[6px] border border-[--glass-border]' : 'bg-[--bg-overlay] border border-[--border-color]'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
    );
};

const SkillsSection = () => {
    const clay = useIsClay();
    return (
    <section id="skills" className={`py-16 md:py-20 px-6 md:px-10 ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
        <div className="max-w-5xl mx-auto">
            <SectionHeader icon={IoConstruct} title="Skills" subtitle="Tech stack" />

            <div className="space-y-6">
                {SKILLS.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <div key={cat.category}>
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className={`w-7 h-7 flex items-center justify-center ${clay ? 'rounded-[8px]' : ''}`} style={{ background: cat.color }}>
                                    <Icon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[13px] font-bold text-[--text-color] uppercase tracking-wider">{cat.category}</span>
                                <div className={`flex-1 h-px ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cat.items.map((skill) => (
                                    <span
                                        key={skill}
                                        className={`px-3.5 py-1.5 text-[12px] font-semibold text-[--text-color] transition-all ${clay
                                            ? 'rounded-[12px] border border-[--glass-border] hover:bg-[--bg-glass-hover]'
                                            : 'bg-[--bg-surface] border border-[--border-color] hover:shadow-pastel'
                                        }`}
                                        style={clay ? glassCard : undefined}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
    );
};

const AboutSection = () => {
    const clay = useIsClay();
    return (
    <section id="about" className={`py-16 md:py-20 px-6 md:px-10 border-y ${clay ? 'bg-[--bg-surface] border-[--glass-border]' : 'bg-[--bg-surface] border-[--border-color]'}`}>
        <div className="max-w-5xl mx-auto">
            <SectionHeader icon={IoBriefcase} title="About" subtitle="Background" />

            <div className="grid md:grid-cols-[1fr_280px] gap-8">
                <div>
                    <p className="text-[15px] md:text-lg font-semibold text-[--text-color] leading-relaxed mb-3">
                        Engineering undergrad with a passion for building. Started coding in 9th grade, never stopped shipping.
                    </p>
                    <p className="text-[13px] text-[--text-muted] leading-relaxed mb-8">
                        4+ years of full-stack development experience. Currently seeking software engineering internships where I can contribute to meaningful products and grow as a developer.
                    </p>

                    <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-4">Experience</div>
                    <div className="space-y-2.5">
                        {EXPERIENCES.map((exp, i) => (
                            <div key={i}
                                className={`p-4 flex items-start justify-between gap-4 transition-colors ${clay
                                    ? 'rounded-[16px] hover:bg-[--bg-glass-hover]'
                                    : 'bg-[--bg-base] border border-[--border-color]'
                                }`}
                                style={clay ? glassCard : undefined}
                            >
                                <div className="flex gap-3">
                                    <div className={`w-1 self-stretch shrink-0 ${clay ? 'rounded-full' : ''}`}
                                        style={exp.current
                                            ? { background: 'var(--accent-color)' }
                                            : { background: clay ? 'var(--glass-border)' : 'var(--border-color)' }
                                        }
                                    />
                                    <div>
                                        <div className="font-bold text-[14px] text-[--text-color]">{exp.role}</div>
                                        <div className="text-[12px] text-[--text-muted] flex items-center gap-1.5 mt-0.5">
                                            <IoBriefcase className="w-3 h-3 shrink-0" /> {exp.company}
                                        </div>
                                        <div className="text-[11px] text-[--text-muted] flex items-center gap-1.5 mt-1">
                                            <IoCalendar className="w-3 h-3 shrink-0" /> {exp.period}
                                        </div>
                                    </div>
                                </div>
                                {exp.current && (
                                    <span className={`px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shrink-0 ${clay ? 'rounded-full' : 'bg-accent text-[--bg-base] shadow-pastel'}`}
                                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        Now
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="sticky top-20">
                        <div className={`w-full aspect-[3/4] relative overflow-hidden border-2 ${clay ? 'border-[--glass-border] rounded-[22px]' : 'border-[--border-color] shadow-pastel-lg'}`}
                            style={clay ? { boxShadow: 'var(--shadow-lg)' } : undefined}
                        >
                            <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
                        </div>
                        <div className={`mt-3 p-3 text-center ${clay ? 'rounded-[12px]' : 'bg-[--bg-base] border border-[--border-color]'}`}
                            style={clay ? glassCard : undefined}
                        >
                            <div className="text-[12px] font-bold text-[--text-color]">{personal.personal.location}</div>
                            <div className="text-[10px] text-[--text-muted] mt-0.5">Engineering Student</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    );
};

const ContactSection = ({ embedded, onGetStarted }: { embedded?: boolean; onGetStarted?: () => void }) => {
    const clay = useIsClay();
    return (
    <section id="contact" className={`py-16 md:py-20 px-6 md:px-10 relative overflow-hidden ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
        {!clay && <div className="absolute inset-0 anime-gradient-fade opacity-30 pointer-events-none" />}
        <div className="max-w-5xl mx-auto relative z-10">
            <SectionHeader icon={IoMail} title="Contact" subtitle="Get in touch" />

            <div className="max-w-lg">
                <p className="text-[15px] font-semibold text-[--text-color] mb-2">
                    Ready to build something amazing together?
                </p>
                <p className="text-[13px] text-[--text-muted] mb-8 leading-relaxed">
                    Open to internship opportunities and exciting projects. Let&apos;s connect and create something extraordinary.
                </p>

                <div className="flex flex-wrap gap-2.5">
                    <a href={`mailto:${personal.personal.email}`}
                        className={`px-6 py-2.5 text-white font-bold text-[12px] flex items-center gap-2 hover:opacity-90 transition-opacity uppercase tracking-wider ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-accent text-[--bg-base] shadow-pastel-lg'}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <IoMail className="w-4 h-4" /> Email
                    </a>
                    <a href={personal.personal.socials.linkedin} target="_blank"
                        className={`px-6 py-2.5 text-[--text-color] font-bold text-[12px] flex items-center gap-2 transition-colors uppercase tracking-wider ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'border border-[--border-color] hover:bg-[--bg-surface]'}`}
                        style={clay ? { border: '1px solid var(--glass-border)' } : undefined}
                    >
                        <IoLogoLinkedin className="w-4 h-4" /> LinkedIn
                    </a>
                    <a href={personal.personal.socials.github} target="_blank"
                        className={`px-6 py-2.5 text-[--text-color] font-bold text-[12px] flex items-center gap-2 transition-colors uppercase tracking-wider ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'border border-[--border-color] hover:bg-[--bg-surface]'}`}
                        style={clay ? { border: '1px solid var(--glass-border)' } : undefined}
                    >
                        <IoLogoGithub className="w-4 h-4" /> GitHub
                    </a>
                </div>
            </div>

            {embedded && (
                <div className={`mt-12 pt-8 border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                    <button onClick={onGetStarted}
                        className={`px-8 py-3 text-white font-bold text-[12px] flex items-center gap-2 hover:opacity-90 transition-opacity uppercase tracking-wider ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-accent text-[--bg-base] shadow-pastel-lg'}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                    >
                        <IoRocketOutline className="w-4 h-4" /> Get Started <IoChevronForward className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    </section>
    );
};

export default function Portfolio({ embedded }: { embedded?: boolean } = {}) {
    const containerref = useRef<HTMLDivElement>(null);
    const { ismobile } = useDevice();
    const clay = useIsClay();
    const [activeSection, setActiveSection] = useState('projects');

    const handlegetstarted = useCallback(() => {
        if (embedded && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('close-about'));
        }
    }, [embedded]);

    const scrollToSection = useCallback((id: string) => {
        setActiveSection(id);
        const el = containerref.current?.querySelector(`#${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return (
        <div
            ref={containerref}
            className={`${embedded ? 'w-full h-full' : 'fixed inset-0'} overflow-y-auto overflow-x-hidden bg-[--bg-base] ${clay ? '' : 'font-mono'}`}
        >
            {!ismobile && <Nav activeSection={activeSection} onNav={scrollToSection} />}
            <HeroSection />
            <ProjectsSection />
            <SkillsSection />
            <AboutSection />
            <ContactSection embedded={embedded} onGetStarted={handlegetstarted} />

            <footer className={`py-5 px-6 md:px-10 flex items-center justify-between text-[11px] text-[--text-muted] border-t ${clay ? 'bg-[--bg-surface] border-[--glass-border]' : 'bg-[--bg-surface] border-[--border-color]'}`}>
                <div>&copy; {new Date().getFullYear()} {personal.personal.name}</div>
                <div className="flex gap-3">
                    <a href={personal.personal.socials.github} target="_blank" className="hover:text-accent transition-colors"><IoLogoGithub className="w-3.5 h-3.5" /></a>
                    <a href={personal.personal.socials.linkedin} target="_blank" className="hover:text-accent transition-colors"><IoLogoLinkedin className="w-3.5 h-3.5" /></a>
                    <a href={`mailto:${personal.personal.email}`} className="hover:text-accent transition-colors"><IoMail className="w-3.5 h-3.5" /></a>
                </div>
            </footer>
        </div>
    );
}
