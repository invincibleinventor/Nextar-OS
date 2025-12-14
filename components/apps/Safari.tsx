'use client';
import React, { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaRedo, FaLock, FaBookOpen, FaShareSquare, FaPlus } from 'react-icons/fa';

interface safariprops {
    initialurl?: string;
}

export default function Safari({ initialurl = 'https://baladev.vercel.app' }: safariprops) {
    const [url, seturl] = useState(initialurl);
    const [inputvalue, setinputvalue] = useState(initialurl);

    const handlenavigate = (e: React.FormEvent) => {
        e.preventDefault();
        let target = inputvalue;
        if (!target.startsWith('http')) {
            target = 'https://' + target;
        }
        seturl(target);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#232323] text-black dark:text-white font-sf">
            <div className="h-[44px] bg-[#f2f2f2] dark:bg-[#343434] flex items-center px-2 md:px-4 gap-2 md:gap-4 border-b border-black/5 dark:border-white/5">
                <div className="flex gap-2 md:gap-4 text-gray-500 dark:text-gray-400">
                    <button className="hover:text-black dark:hover:text-white transition"><FaArrowLeft size={14} /></button>
                    <button className="hover:text-black dark:hover:text-white transition"><FaArrowRight size={14} /></button>
                </div>
                <button className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition hidden md:block"><FaBookOpen size={14} /></button>

                <form onSubmit={handlenavigate} className="flex-1 max-w-2xl mx-auto flex items-center bg-white dark:bg-[#232323] rounded-md px-3 h-[28px] shadow-sm border border-black/5 dark:border-white/5 focus-within:ring-2 ring-blue-500/50 min-w-0">
                    <FaLock size={10} className="text-gray-400 mr-2 flex-shrink-0" />
                    <input
                        type="text"
                        value={inputvalue}
                        onChange={(e) => setinputvalue(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[13px] text-center placeholder-gray-400 min-w-0 truncate"
                        placeholder="Search or enter website name"
                    />
                    <FaRedo size={10} className="text-gray-400 ml-2 cursor-pointer hover:text-black dark:hover:text-white flex-shrink-0" onClick={() => seturl(inputvalue)} />
                </form>

                <div className="flex gap-2 md:gap-4 text-gray-500 dark:text-gray-400">
                    <button className="hover:text-black dark:hover:text-white transition hidden md:block"><FaShareSquare size={14} /></button>
                    <button className="hover:text-black dark:hover:text-white transition"><FaPlus size={14} /></button>
                </div>
            </div>

            <div className="flex-1 w-full h-full bg-white relative">
                {url ? (
                    url.includes('github.com') ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-[#1e1e1e]">
                            <FaLock size={48} className="text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">GitHub Security</h2>
                            <p className="text-gray-500 max-w-sm mb-6">
                                GitHub does not allow their website to be embedded.
                            </p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
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
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Start Page
                    </div>
                )}
            </div>
        </div>
    );
}
