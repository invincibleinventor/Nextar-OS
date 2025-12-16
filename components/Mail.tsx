import React, { useState } from 'react';
import Image from 'next/image';
import { portfoliodata } from './portfolioData';
import { IoMailOutline, IoLogoGithub, IoLogoTwitter, IoLogoLinkedin, IoCallOutline, IoLocationOutline, IoPaperPlaneOutline, IoChevronBack } from "react-icons/io5";
import { PiThreadsLogo } from 'react-icons/pi';
import { useDevice } from './DeviceContext';

export default function Mail() {
    const [showsidebar, setshowsidebar] = useState(true);
    const ismobile  = useDevice()

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white relative overflow-hidden">
            <div className={`
                w-full md:w-[240px] ${ismobile ? 'pt-[36px]': ''} border-r border-gray-200 dark:border-white/10 flex flex-col bg-[#f5f5f7] dark:bg-[#2d2d2d]/50 backdrop-blur-xl
                absolute md:relative z-20 h-full transition-transform duration-300 ease-in-out
                ${showsidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-[52px] border-b border-gray-200 dark:border-white/10 flex items-center px-4 shrink-0">
                    <span className="font-semibold text-sm text-gray-500 dark:text-gray-400">All Contacts</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <div
                        className="bg-[#007AFF] text-white rounded-md px-3 py-2 flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                            if (window.innerWidth < 768) setshowsidebar(false);
                        }}
                    >
                        <span className="font-bold text-sm">About {portfoliodata.personal.name}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] w-full min-w-0">
                <div className="md:hidden h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-4 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-10">
                    <button
                        onClick={() => setshowsidebar(true)}
                        className="flex items-center gap-1 text-[#007AFF] font-medium text-[15px]"
                    >
                        <IoChevronBack /> Contacts
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    <div className="p-8 max-w-2xl mx-auto">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border dark:border-white/10 shrink-0">
                                <Image src="/pfp.png" alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                            </div>
                            <div className="pt-2 min-w-0">
                                <h1 className="text-2xl font-bold text-black dark:text-white truncate">{portfoliodata.personal.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{portfoliodata.personal.role}</p>

                                <div className="flex gap-3 mt-4 flex-wrap">
                                    <a href={`mailto:${portfoliodata.personal.email}`} className="flex flex-col items-center gap-1 min-w-[60px] p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                                        <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-sm group-hover:bg-[#0062cc]">
                                            <IoMailOutline size={16} />
                                        </div>
                                        <span className="text-[11px] text-[#007AFF]">mail</span>
                                    </a>
                                    <a href={portfoliodata.personal.socials.github} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 min-w-[60px] p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white shadow-sm group-hover:bg-gray-600">
                                            <IoLogoGithub size={16} />
                                        </div>
                                        <span className="text-[11px] text-[#007AFF]">github</span>
                                    </a>
                                    <a href={portfoliodata.personal.socials.linkedin} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 min-w-[60px] p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                                        <div className="w-8 h-8 bg-[#0077b5] rounded-full flex items-center justify-center text-white shadow-sm group-hover:bg-[#006097]">
                                            <IoLogoLinkedin size={16} />
                                        </div>
                                        <span className="text-[11px] text-[#007AFF]">linkedin</span>
                                    </a>
                                    <a href={portfoliodata.personal.socials.threads} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 min-w-[60px] p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                                        <div className="w-8 h-8 bg-black dark:bg-white dark:text-black rounded-full flex items-center justify-center text-white shadow-sm">
                                            <PiThreadsLogo size={16} />
                                        </div>
                                        <span className="text-[11px] text-[#007AFF]">social</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-white/10 mb-6" />

                        <div className="space-y-6">
                            <div className="grid grid-cols-[80px_1fr] gap-4 items-baseline">
                                <span className="text-right text-xs font-medium text-gray-500 dark:text-gray-400">home</span>
                                <div>
                                    <a href={`mailto:${portfoliodata.personal.email}`} className="text-[15px] text-[#007AFF] hover:underline block mb-0.5 break-all">
                                        {portfoliodata.personal.email}
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-[80px_1fr] gap-4 items-baseline">
                                <span className="text-right text-xs font-medium text-gray-500 dark:text-gray-400">location</span>
                                <div>
                                    <span className="text-[15px] text-black dark:text-white block mb-0.5">
                                        {portfoliodata.personal.location}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[80px_1fr] gap-4 items-baseline">
                                <span className="text-right text-xs font-medium text-gray-500 dark:text-gray-400">bio</span>
                                <div>
                                    <span className="text-[15px] text-black dark:text-white block leading-relaxed">
                                        {portfoliodata.personal.bio}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[80px_1fr] gap-4 items-baseline">
                                <span className="text-right text-xs font-medium text-gray-500 dark:text-gray-400">profiles</span>
                                <div className="space-y-2">
                                    <a href={portfoliodata.personal.socials.github} target="_blank" rel="noreferrer" className="block text-[15px] text-[#007AFF] hover:underline">
                                        Github
                                    </a>
                                    <a href={portfoliodata.personal.socials.linkedin} target="_blank" rel="noreferrer" className="block text-[15px] text-[#007AFF] hover:underline">
                                        LinkedIn
                                    </a>
                                    <a href={portfoliodata.personal.socials.threads || '#'} target="_blank" rel="noreferrer" className="block text-[15px] text-[#007AFF] hover:underline">
                                        Threads
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
