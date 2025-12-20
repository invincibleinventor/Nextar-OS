'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';
import { personal, apps, openSystemItem } from './data';
import { IoArrowForward, IoCheckmarkCircle, IoLogoApple, IoAppsOutline, IoDesktopOutline, IoPhonePortraitOutline, IoLogoGithub, IoFolderOpenOutline, IoTerminalOutline, IoDocumentTextOutline, IoLogoLinkedin } from "react-icons/io5";

export default function Welcome(props: any) {
    const { removewindow, addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const { ismobile } = useDevice();
    const [step, setstep] = useState(0);
    const [isnarrow, setisnarrow] = useState(false);
    const containerref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerref.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setisnarrow(entry.contentRect.width < 500);
            }
        });
        observer.observe(containerref.current);
        return () => observer.disconnect();
    }, []);

    const context = { addwindow, windows, updatewindow, setactivewindow, ismobile };

    const steps = [
        {
            title: "Welcome",
            content: (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <IoLogoApple size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">MacOS-Next</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            A web-based operating system interface built with Next.js, featuring window management, file operations, and native-like interactions.
                        </p>
                    </div>
                    <a href="https://github.com/invincibleinventor/macos" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                        <IoLogoGithub size={18} />
                        View Source
                    </a>
                </div>
            )
        },
        {
            title: "About",
            content: (
                <div className="text-center space-y-5">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden shadow-lg border-2 border-white/20">
                        <Image src="/pfp.png" alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">{personal.personal.name}</h3>
                        <p className="text-sm text-blue-500">@{personal.personal.username}</p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                        {personal.personal.role}
                    </p>
                    <div className="flex justify-center gap-3">
                        <a href={personal.personal.socials.github} target="_blank" rel="noopener noreferrer"
                            className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                            <IoLogoGithub size={20} />
                        </a>
                        <a href={personal.personal.socials.linkedin} target="_blank" rel="noopener noreferrer"
                            className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                            <IoLogoLinkedin size={20} className="text-[#0077B5]" />
                        </a>
                        <button onClick={() => openSystemItem('mail', context, undefined, { initialFolder: 'contact', initialMailId: 'contact-card' })}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                            Contact
                        </button>
                    </div>
                </div>
            )
        },
        {
            title: "Interface",
            content: (
                <div className="space-y-6">
                    <div className={`flex ${isnarrow ? 'flex-col gap-4' : 'gap-8'} items-center justify-center`}>
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-gray-100 dark:bg-white/10 rounded-2xl">
                                <IoDesktopOutline size={isnarrow ? 40 : 56} className="text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">Desktop</span>
                        </div>
                        {!isnarrow && <IoArrowForward size={24} className="text-gray-300" />}
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-xl">
                                <IoPhonePortraitOutline size={isnarrow ? 28 : 36} className="text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">Mobile</span>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        The interface adapts between a desktop environment and a mobile-optimized layout.
                    </p>
                </div>
            )
        },
        {
            title: "Features",
            content: (
                <div className={`grid ${isnarrow ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} max-w-md mx-auto`}>
                    {[
                        { icon: IoFolderOpenOutline, label: "File System", desc: "Persistent storage" },
                        { icon: IoAppsOutline, label: "Applications", desc: "Functional apps" },
                        { icon: IoTerminalOutline, label: "Terminal", desc: "Command line" },
                        { icon: IoDocumentTextOutline, label: "Text Editor", desc: "Rich text support" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/5 rounded-xl">
                            <item.icon size={24} className="text-blue-500 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{item.label}</div>
                                <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: "Get Started",
            content: (
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                        <IoCheckmarkCircle size={36} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Ready to explore</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            Click Get Started to begin using the desktop.
                        </p>
                    </div>
                    <div className={`flex ${isnarrow ? 'flex-col' : 'flex-row'} justify-center gap-2`}>
                        <button onClick={() => openSystemItem('finder', context)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                            <Image src="/finder.png" alt="" width={20} height={20} className="w-5 h-5" />
                            Finder
                        </button>
                        <button onClick={() => openSystemItem('appstore', context)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                            <Image src="/appstore.webp" alt="" width={20} height={20} className="w-5 h-5" />
                            Projects
                        </button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div ref={containerref} className="flex flex-col h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden">
            <div className="h-10 shrink-0" />

            <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-lg"
                    >
                        {steps[step].content}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="h-24 lg:h-16 shrink-0 relative flex items-center justify-between px-6 border-t border-black/5 dark:border-white/5">
                <button
                    onClick={() => step > 0 && setstep(step - 1)}
                    className={`text-blue-500 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    Go Back
                </button>

                <div className="flex gap-1.5 absolute top-[50%]  w-max h-max mx-auto  left-0 right-0 bottom-[50%}">
                    {steps.map((_, i) => (
                        <button key={i} onClick={() => setstep(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) {
                            setstep(step + 1);
                        } else {
                            removewindow(props.windowId || 'welcome');
                        }
                    }}
                    className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                    {step < steps.length - 1 ? 'Continue' : 'Get Started'}
                </button>
            </div>
        </div>
    );
}