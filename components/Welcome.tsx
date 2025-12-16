'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { portfoliodata } from './portfolioData';
import { apps } from './app';
import { IoArrowForward, IoCheckmarkCircle, IoLogoApple, IoConstructOutline, IoAppsOutline, IoRocketOutline, IoLogoGithub } from "react-icons/io5";

export default function Welcome(props: any) {
    const { removewindow, addwindow } = useWindows();
    const [step, setstep] = useState(0);

    const steps = [
        {
            title: "Welcome to MacOS-Next",
            subtitle: "A fully interactive web OS simulation.",
            icon: IoLogoApple,
            content: (
                <div className="text-center space-y-8 max-w-md mx-auto h-full flex flex-col justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        Experience my portfolio through a familiar desktop interface. This isn&apos;t just a simple macos themed portfolio site - you can call it a full fledged operating system simulation built with Next JS, Framer Motion and TailwindCSS.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-medium text-gray-500">
                        <div className="flex flex-col items-center gap-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <IoRocketOutline size={16} />
                            <span>Fast</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <IoConstructOutline size={16} />
                            <span>Interactive</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                            <IoAppsOutline size={16} />
                            <span>App Rich</span>
                        </div>
                    </div>
                    <a
                        href="https://github.com/invincibleinventor/macos"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-400 dark:bg-blue-500/20 text-white rounded-xl text-sm font-medium  transition-colors mx-auto w-max shadow-lg"
                    >
                        <IoLogoGithub size={18} />
                        <span>Check out GitHub Repo</span>
                    </a>
                </div>
            )
        },
        {
            title: "App Ecosystem",
            subtitle: "Discover what each app can do.",
            icon: IoAppsOutline,
            content: (
                <div className="text-left space-y-4 max-w-md mx-auto h-full overflow-y-auto pr-2 scrollbar-thin">
                    <div className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Image src="/finder.png" alt="Finder" width={40} height={40} className="w-10 h-10 object-contain drop-shadow-md" />
                        <div><h4 className="text-sm font-semibold">Finder</h4><p className="text-xs text-gray-500">File management and project browsing.</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Image src="/photos.webp" alt="Photos" width={40} height={40} className="w-10 h-10 object-contain drop-shadow-md" />
                        <div><h4 className="text-sm font-semibold">Photos</h4><p className="text-xs text-gray-500">Visual portfolio gallery.</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Image src="/calendar.png" alt="Calendar" width={40} height={40} className="w-10 h-10 object-contain drop-shadow-md" />
                        <div><h4 className="text-sm font-semibold">Calendar</h4><p className="text-xs text-gray-500">Schedule and timeline visualization.</p></div>
                    </div>
                </div>
            )
        },
        {
            title: "Key Features",
            subtitle: "Explore the ecosystem.",
            icon: IoConstructOutline,
            content: (
                <div className="text-center space-y-4 max-w-md mx-auto h-full flex flex-col justify-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        From a fully functional <strong>Dock</strong> to window management and <strong>Finder</strong> integration, every detail is crafted to mimic the macOS experience.
                    </p>
                    <ul className="text-left text-xs text-gray-500 space-y-2 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/5">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Launch apps from the Dock or Launchpad.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Drag, resize, and minimize windows.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Deep link navigation (Calendar ➜ Finder).</li>
                    </ul>
                </div>
            )
        },
        {
            title: "App Showcase",
            subtitle: "Click an icon to launch.",
            icon: IoAppsOutline,
            content: (
                <div className="grid grid-cols-4 gap-4 p-2 h-full content-center">
                    {apps.filter(a => ['finder', 'calendar', 'photos', 'terminal', 'mail', 'calculator'].includes(a.id)).map(app => (
                        <div
                            key={app.id}
                            onClick={() => {
                                addwindow({
                                    id: `${app.id}-${Date.now()}`,
                                    appname: app.appname,
                                    title: app.appname,
                                    component: app.componentname,
                                    icon: app.icon,
                                    isMinimized: false,
                                    isMaximized: false,
                                    position: { top: 100, left: 100 },
                                    size: app.defaultsize || { width: 800, height: 600 },
                                    props: {}
                                });
                            }}
                            className="flex flex-col items-center gap-2 hover:scale-105 transition-transform group cursor-pointer"
                        >
                            <Image src={app.icon} width={40} height={40} className="w-10 h-10 shadow-sm rounded-[10px]" alt={app.appname} />
                            <span className="text-[10px] whitespace-nowrap group-hover:text-blue-500 transition-colors">{app.appname}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: "About Me",
            subtitle: "Administrator",
            icon: IoLogoApple,
            content: (
                <div className="text-center space-y-3 max-w-md mx-auto h-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center mb-2">
                        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-white/20 mb-2">
                            <Image src="/pfp.png" alt="Profile" width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-lg">Bala TBR</h3>
                        <p className="text-xs text-blue-500 font-medium">@invincibleinventor</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">
                        &quot;{portfoliodata.personal.bio}&quot;
                    </p>

                    <button
                        onClick={() => {
                            const mailapp = apps.find(a => a.id === 'mail');
                            addwindow({
                                id: `mail-${Date.now()}`,
                                appname: 'Mail',
                                title: 'Mail',
                                component: 'Mail',
                                icon: '/mail.png',
                                isMinimized: false,
                                isMaximized: false,
                                position: { top: 100, left: 100 },
                                size: mailapp?.defaultsize || { width: 800, height: 600 },
                                props: {}
                            });
                        }}
                        className="mt-2 px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-full text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        Contact Me
                    </button>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {portfoliodata.skills.slice(1, 5).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full text-[9px] border border-blue-100 dark:border-blue-800/30">
                                {skill.split('(')[0]}
                            </span>
                        ))}
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full w-full bg-[#fbfbfd] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-y-auto overflow-x-hidden relative selection:bg-blue-500/30">
            <div className="h-10 w-full shrink-0" />

            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 w-full max-w-2xl mx-auto">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="flex flex-col items-center w-full h-full"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-7xl text-blue-500 mb-8 drop-shadow-2xl"
                        >
                            {React.createElement(steps[step].icon)}
                        </motion.div>

                        <div className="text-center space-y-3 mb-12 max-w-lg">
                            <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
                                {steps[step].title}
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                                {steps[step].subtitle}
                            </p>
                        </div>

                        <div className="flex-1 w-full overflow-y-auto px-4 pb-4 min-h-0 scrollbar-hide">
                            <div className="w-full max-w-lg mx-auto">
                                {steps[step].content}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="h-24 shrink-0 flex items-center justify-between px-12 bg-[#fbfbfd] dark:bg-[#1e1e1e] z-20">
                <div className="flex gap-2">
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) {
                            setstep(step + 1);
                        } else {
                            if (props.id) {
                                removewindow(props.id);
                            } else {
                                removewindow('welcome');
                            }
                        }
                    }}
                    className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0062cc] active:bg-[#0051a8] text-white px-8 py-3 rounded-xl text-[15px] font-semibold transition-all shadow-[0_2px_12px_rgba(0,122,255,0.25)] hover:shadow-[0_4px_16px_rgba(0,122,255,0.4)] active:scale-95 active:shadow-sm"
                >
                    {step < steps.length - 1 ? (
                        <>Continue</>
                    ) : (
                        <div onClick={() => {
                            const mailapp = apps.find(a => a.id === 'mail');
                            addwindow({
                                id: `mail-${Date.now()}`,
                                appname: 'Mail',
                                title: 'Finder',
                                component: 'apps/Mail',
                                icon: '/mail.png',
                                isMinimized: false,
                                isMaximized: false,
                                position: { top: 100, left: 100 },
                                size: mailapp?.defaultsize || { width: 800, height: 600 },
                                props: {}
                            });
                            removewindow('welcome');
                            if (props.id) removewindow(props.id);
                        }}>Get Started</div>
                    )}
                </button>
            </div>
        </div>
    );
}