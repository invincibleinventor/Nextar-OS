'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { FaArrowLeft, FaArrowRight, FaRedo, FaLock, FaBookOpen, FaShareSquare, FaPlus } from 'react-icons/fa';
import { useDevice } from '../DeviceContext';

interface safariprops {
    initialurl?: string;
}

export default function Safari({ initialurl = 'https://baladev.vercel.app' }: safariprops) {
    const [url, seturl] = useState(initialurl);
    const [inputvalue, setinputvalue] = useState(initialurl);
    const { ismobile } = useDevice()

    const handlenavigate = (e: React.FormEvent) => {
        e.preventDefault();
        let target = inputvalue;
        if (!target.startsWith('http')) {
            target = 'https://' + target;
        }
        seturl(target);
    };

    return (
        <div className="flex flex-col bg-transparent h-full w-full text-black dark:text-white font-sf">

            <div className={`h-[50px] bg-white/40 dark:bg-[#343434]/40 backdrop-blur-lg flex items-center ${ismobile ? 'px-2' : 'pl-24 pr-4'} gap-4 border-b border-black/5 dark:border-white/5 `}>
                <div className={`flex gap-4 text-gray-500 dark:text-gray-400`}>
                    <button className="hover:text-black dark:hover:text-white transition"><FaArrowLeft size={14} /></button>
                    <button className="hover:text-black dark:hover:text-white transition"><FaArrowRight size={14} /></button>
                    <button className="hover:text-black dark:hover:text-white transition hidden md:block"><FaBookOpen size={14} /></button>
                </div>

                <form onSubmit={handlenavigate} className="flex-1 max-w-3xl mx-auto flex items-center bg-white dark:bg-[#1e1e1e] rounded-[10px] px-3 h-[34px] shadow-sm hover:shadow-md transition-all border border-black/5 dark:border-white/5 focus-within:ring-2 ring-blue-500/30 min-w-0">
                    <FaLock size={10} className="text-gray-400 mr-2 flex-shrink-0" />
                    <input
                        type="text"
                        value={inputvalue}
                        onChange={(e) => setinputvalue(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[13px] text-center placeholder-gray-400 min-w-0 truncate text-black dark:text-white"
                        placeholder="Search or enter website name"
                    />
                    <FaRedo size={10} className="text-gray-400 ml-2 cursor-pointer hover:text-black dark:hover:text-white flex-shrink-0" onClick={() => seturl(inputvalue)} />
                </form>

                <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                    <button className="hover:text-black dark:hover:text-white transition hidden md:block"><FaShareSquare size={14} /></button>
                    <button className="hover:text-black dark:hover:text-white transition"><FaPlus size={14} /></button>
                </div>
            </div>

            <div className="flex-1 w-full h-full bg-white dark:bg-[#1e1e1e] relative">
                {url ? (
                    url.includes('github.com') ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-[#1e1e1e]">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
                                <FaLock size={32} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-black dark:text-white">GitHub Security</h2>
                            <p className="text-gray-500 max-w-sm mb-6 text-sm">
                                Browsing GitHub recursively is restricted.
                            </p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition font-medium text-sm shadow-lg hover:shadow-blue-500/25"
                            >
                                Open in New Tab
                            </a>
                        </div>
                    ) : (
                        <iframe
                            src={url}
                            className="w-full h-full border-none"
                            title="Safari Browser"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Image src="/icons/safari.png" width={96} height={96} className="w-24 h-24 mb-8 opacity-20 filter grayscale" alt="Safari" />
                        <h1 className="text-2xl font-bold text-black/20 dark:text-white/20 mb-8">Favorites</h1>

                        <div className="grid grid-cols-4 gap-8">
                            {['Apple', 'iCloud', 'GitHub', 'LinkedIn'].map(site => (
                                <div key={site} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <div className="w-14 h-14 bg-gray-100 dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                                        <span className="text-xl font-bold text-gray-400">{site[0]}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{site}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
