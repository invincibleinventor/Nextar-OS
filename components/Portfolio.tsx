'use client';
import React, { useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import { personal } from './data';
import { IoLogoGithub, IoLogoLinkedin, IoMail, IoPlay, IoArrowForward, IoRocketOutline, IoChevronForward, IoCalendar, IoBriefcase, IoCodeSlash, IoGlobe, IoServer, IoConstruct } from 'react-icons/io5';
import { useDevice } from './DeviceContext';

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
    return (

        <div className={`${ismobile ?
            'top-0' : 'top-12'} sticky  z-30 bg-[--bg-surface]/80 backdrop-blur-xl border-b border-[--border-color]`}>
            <div className="max-w-5xl mx-auto px-6 md:px-10 flex items-center h-12 gap-6">
                <div className="flex items-center gap-2.5 mr-auto">
                    <div className="w-7 h-7 bg-accent flex items-center justify-center shadow-pastel-lg">
                        <span className="text-[--bg-base] font-black text-xs">B</span>
                    </div>
                    <span className="font-bold text-[13px] text-[--text-color] tracking-tight">Bala</span>
                </div>
                {['projects', 'skills', 'about', 'contact'].map(id => (
                    <button
                        key={id}
                        onClick={() => onNav(id)}
                        className={`text-[12px] font-semibold uppercase tracking-wider transition-colors ${activeSection === id ? 'text-accent' : 'text-[--text-muted] hover:text-[--text-color]'}`}
                    >
                        {id}
                    </button>
                ))}
            </div>
        </div>
    );
}

const HeroSection = () => (
    <section className="relative overflow-hidden">
        <div className="absolute inset-0 anime-gradient-fade opacity-50" />
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24 relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
                <div className="w-28 h-28 md:w-36 md:h-36 relative shrink-0 overflow-hidden border-2 border-[--border-color] shadow-pastel-lg">
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
                            <div key={i} className="px-4 py-2.5 bg-[--bg-surface] border border-[--border-color] shadow-pastel">
                                <div className="text-xl font-bold text-[--text-color] leading-none">{stat.n}</div>
                                <div className="text-[10px] uppercase tracking-wider text-[--text-muted] mt-1">{stat.l}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <a href={personal.personal.socials.github} target="_blank" className="px-5 py-2 bg-accent text-[--bg-base] font-bold text-[12px] flex items-center gap-2 shadow-pastel-lg hover:opacity-90 transition-opacity uppercase tracking-wider">
                            <IoLogoGithub className="w-4 h-4" /> GitHub
                        </a>
                        <a href={personal.personal.socials.linkedin} target="_blank" className="px-5 py-2 border border-[--border-color] text-[--text-color] font-bold text-[12px] flex items-center gap-2 hover:bg-[--bg-surface] transition-colors uppercase tracking-wider">
                            <IoLogoLinkedin className="w-4 h-4" /> LinkedIn
                        </a>
                        <a href="/Balasubramanian TBR.pdf" target="_blank" className="px-5 py-2 border border-[--border-color] text-[--text-color] font-bold text-[12px] flex items-center gap-2 hover:bg-[--bg-surface] transition-colors uppercase tracking-wider">
                            Resume <IoArrowForward className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const ProjectsSection = () => (
    <section id="projects" className="py-16 md:py-20 px-6 md:px-10 bg-[--bg-surface] border-y border-[--border-color]">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <IoCodeSlash className="w-5 h-5 text-accent" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[--text-color] leading-none">Projects</h2>
                    <p className="text-[11px] text-[--text-muted] uppercase tracking-widest mt-0.5">Featured work</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROJECTS.map((p, i) => (
                    <div key={i} className="group bg-[--bg-base] border border-[--border-color] overflow-hidden hover:border-accent/30 transition-all hover:shadow-pastel">
                        <div className="h-32 bg-[--bg-overlay] relative overflow-hidden border-b border-[--border-color]">
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
                                    <a href={p.live} target="_blank" className="w-7 h-7 flex items-center justify-center bg-accent text-[--bg-base] shadow-pastel-lg hover:scale-105 transition-transform">
                                        <IoPlay className="w-3 h-3" />
                                    </a>
                                )}
                                <a href={p.url} target="_blank" className="w-7 h-7 flex items-center justify-center bg-[--bg-surface]/90 backdrop-blur-sm border border-[--border-color] text-[--text-color] hover:scale-105 transition-transform">
                                    <IoLogoGithub className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-[14px] font-bold text-[--text-color] mb-1">{p.name}</h3>
                            <p className="text-[12px] text-[--text-muted] leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                            <div className="flex flex-wrap gap-1">
                                {p.tags.map((tag) => (
                                    <span key={tag} className="text-[9px] px-2 py-0.5 bg-accent/8 border border-accent/15 text-accent uppercase tracking-wider font-bold">
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

const SkillsSection = () => (
    <section id="skills" className="py-16 md:py-20 px-6 md:px-10 bg-[--bg-base]">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <IoConstruct className="w-5 h-5 text-accent" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[--text-color] leading-none">Skills</h2>
                    <p className="text-[11px] text-[--text-muted] uppercase tracking-widest mt-0.5">Tech stack</p>
                </div>
            </div>

            <div className="space-y-6">
                {SKILLS.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <div key={cat.category}>
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 flex items-center justify-center" style={{ background: cat.color }}>
                                    <Icon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[13px] font-bold text-[--text-color] uppercase tracking-wider">{cat.category}</span>
                                <div className="flex-1 h-px bg-[--border-color]" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cat.items.map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-3.5 py-1.5 text-[12px] font-semibold bg-[--bg-surface] border border-[--border-color] text-[--text-color] hover:border-accent/40 hover:shadow-pastel transition-all"
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

const AboutSection = () => (
    <section id="about" className="py-16 md:py-20 px-6 md:px-10 bg-[--bg-surface] border-y border-[--border-color]">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <IoBriefcase className="w-5 h-5 text-accent" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[--text-color] leading-none">About</h2>
                    <p className="text-[11px] text-[--text-muted] uppercase tracking-widest mt-0.5">Background</p>
                </div>
            </div>

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
                            <div key={i} className="p-4 bg-[--bg-base] border border-[--border-color] flex items-start justify-between gap-4 hover:border-accent/20 transition-colors">
                                <div className="flex gap-3">
                                    <div className="w-1 self-stretch bg-accent/30 shrink-0" style={exp.current ? { background: 'var(--accent-color)' } : {}} />
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
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-accent text-[--bg-base] uppercase tracking-wider shrink-0 shadow-pastel">
                                        Now
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="sticky top-20">
                        <div className="w-full aspect-[3/4] relative overflow-hidden border-2 border-[--border-color] shadow-pastel-lg">
                            <Image src="/bala.jpeg" alt="Bala" fill className="object-cover" />
                        </div>
                        <div className="mt-3 p-3 bg-[--bg-base] border border-[--border-color] text-center">
                            <div className="text-[12px] font-bold text-[--text-color]">{personal.personal.location}</div>
                            <div className="text-[10px] text-[--text-muted] mt-0.5">Engineering Student</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const ContactSection = ({ embedded, onGetStarted }: { embedded?: boolean; onGetStarted?: () => void }) => (
    <section id="contact" className="py-16 md:py-20 px-6 md:px-10 bg-[--bg-base] relative overflow-hidden">
        <div className="absolute inset-0 anime-gradient-fade opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <IoMail className="w-5 h-5 text-accent" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[--text-color] leading-none">Contact</h2>
                    <p className="text-[11px] text-[--text-muted] uppercase tracking-widest mt-0.5">Get in touch</p>
                </div>
            </div>

            <div className="max-w-lg">
                <p className="text-[15px] font-semibold text-[--text-color] mb-2">
                    Ready to build something amazing together?
                </p>
                <p className="text-[13px] text-[--text-muted] mb-8 leading-relaxed">
                    Open to internship opportunities and exciting projects. Let&apos;s connect and create something extraordinary.
                </p>

                <div className="flex flex-wrap gap-2.5">
                    <a href={`mailto:${personal.personal.email}`} className="px-6 py-2.5 bg-accent text-[--bg-base] font-bold text-[12px] flex items-center gap-2 shadow-pastel-lg hover:opacity-90 transition-opacity uppercase tracking-wider">
                        <IoMail className="w-4 h-4" /> Email
                    </a>
                    <a href={personal.personal.socials.linkedin} target="_blank" className="px-6 py-2.5 border border-[--border-color] text-[--text-color] font-bold text-[12px] flex items-center gap-2 hover:bg-[--bg-surface] transition-colors uppercase tracking-wider">
                        <IoLogoLinkedin className="w-4 h-4" /> LinkedIn
                    </a>
                    <a href={personal.personal.socials.github} target="_blank" className="px-6 py-2.5 border border-[--border-color] text-[--text-color] font-bold text-[12px] flex items-center gap-2 hover:bg-[--bg-surface] transition-colors uppercase tracking-wider">
                        <IoLogoGithub className="w-4 h-4" /> GitHub
                    </a>
                </div>
            </div>

            {embedded && (
                <div className="mt-12 pt-8 border-t border-[--border-color]">
                    <button onClick={onGetStarted} className="px-8 py-3 bg-accent text-[--bg-base] font-bold text-[12px] flex items-center gap-2 shadow-pastel-lg hover:opacity-90 transition-opacity uppercase tracking-wider">
                        <IoRocketOutline className="w-4 h-4" /> Get Started <IoChevronForward className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    </section>
);

export default function Portfolio({ embedded }: { embedded?: boolean } = {}) {
    const containerref = useRef<HTMLDivElement>(null);
    const { ismobile } = useDevice();
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
            className={`${embedded ? 'w-full h-full' : 'fixed inset-0'} overflow-y-auto overflow-x-hidden bg-[--bg-base] font-mono`}
        >
            {!ismobile && <Nav activeSection={activeSection} onNav={scrollToSection} />}
            <HeroSection />
            <ProjectsSection />
            <SkillsSection />
            <AboutSection />
            <ContactSection embedded={embedded} onGetStarted={handlegetstarted} />

            <footer className="py-5 px-6 md:px-10 flex items-center justify-between text-[11px] bg-[--bg-surface] border-t border-[--border-color] text-[--text-muted]">
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
