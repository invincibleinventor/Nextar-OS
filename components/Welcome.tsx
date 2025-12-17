'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { personal, apps } from './data';
import { IoArrowForward, IoCheckmarkCircle, IoLogoApple, IoConstructOutline, IoAppsOutline, IoRocketOutline, IoDesktopOutline, IoLaptopOutline, IoPhonePortraitOutline, IoLogoGithub } from "react-icons/io5";

export default function Welcome(props: any) {
    const { removewindow, addwindow } = useWindows();
    const [step, setstep] = useState(0);

    const steps = [
        {
            title: "Welcome to MacOS-Next",
            subtitle: "A fully interactive web OS simulation.",
            icon: IoLogoApple,
            content: (
                <div className="text-center space-y-8 max-w-md mx-auto h-auto flex flex-col justify-center">
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

                </div>
            )
        },
        {
            title: "Adaptive Interface",
            subtitle: "macOS on Desktop. iOS on Mobile.",
            icon: IoPhonePortraitOutline,
            content: (
                <div className="flex flex-col items-center justify-center h-full gap-8">
                    <div className="flex items-end justify-center gap-6 h-32 relative">

                        <motion.div
                            initial={{ scale: 0, opacity: 0, x: -50 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl shadow-xl">
                                <IoDesktopOutline size={64} className="text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">macOS</span>
                        </motion.div>


                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            className="mb-8 text-gray-300 dark:text-gray-600"
                        >
                            <IoArrowForward size={24} />
                        </motion.div>


                        <motion.div
                            initial={{ scale: 0, opacity: 0, x: 50 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-[14px] shadow-xl mb-1">
                                <IoPhonePortraitOutline size={32} className="text-gray-800 dark:text-gray-100" />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">iPhone</span>
                        </motion.div>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                        The interface transforms from a powerful <strong>macOS Desktop</strong> environment to a native-feeling <strong>iPhone UI</strong> on smaller screens.
                    </p>
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
                                    isminimized: false,
                                    ismaximized: false,
                                    position: { top: 100, left: 100 },
                                    size: app.defaultsize || { width: 900, height: 600 },
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
            subtitle: "Bala TBR",
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
                        &quot;{personal.personal.bio}&quot;
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
                                isminimized: false,
                                ismaximized: false,
                                position: { top: 100, left: 100 },
                                size: mailapp?.defaultsize || { width: 900, height: 600 },
                                props: {}
                            });
                        }}
                        className="mt-2 px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-full text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        Contact Me
                    </button>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {personal.skills.slice(1, 4).map((skill, i) => (
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
        <div className="flex flex-col h-full w-full bg-[#fbfbfd] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden relative selection:bg-blue-500/30">
            <div className="h-10 w-full shrink-0" />

            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 w-full max-w-4xl mx-auto overflow-hidden">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-col items-center justify-center w-full h-full"
                    >
                        <div className="mb-4 text-[#007AFF] drop-shadow-sm shrink-0">
                            {React.createElement(steps[step].icon, { size: 56 })}
                        </div>

                        <div className="text-center space-y-2 mb-6 shrink-0 z-20">
                            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-black dark:text-white">
                                {steps[step].title}
                            </h1>
                            <p className="text-sm md:text-[15px] text-gray-500 dark:text-gray-400 font-normal">
                                {steps[step].subtitle}
                            </p>
                        </div>

                        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                            {steps[step].content}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="h-20 shrink-0 flex items-center justify-between w-full px-10 bg-[#fbfbfd] dark:bg-[#1e1e1e] border-t border-black/5 dark:border-white/5 z-20">
                <button
                    onClick={() => step > 0 && setstep(step - 1)}
                    className={`text-[#007AFF] text-[13px] font-medium px-4 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    Go Back
                </button>

                <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#007AFF]' : 'bg-gray-300 dark:bg-zinc-700'}`} />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) {
                            setstep(step + 1);
                        } else {
                            const mailapp = apps.find(a => a.id === 'mail');
                            addwindow({
                                id: `mail-${Date.now()}`,
                                appname: 'Mail',
                                title: 'Mail',
                                component: 'Mail',
                                icon: '/mail.png',
                                isminimized: false,
                                ismaximized: false,
                                position: { top: 100, left: 100 },
                                size: mailapp?.defaultsize || { width: 900, height: 600 },
                                props: {}
                            });

                            if (props.id) {
                                removewindow(props.id);
                            } else {
                                removewindow('welcome');
                            }
                        }
                    }}
                    className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0062cc] active:bg-[#0051a8] text-white px-6 py-1.5 rounded-full text-[13px] font-medium transition-all shadow-sm active:scale-95 active:shadow-none"
                >
                    {step < steps.length - 1 ? 'Continue' : 'Get Started'}
                </button>
            </div>
        </div>
    );
}