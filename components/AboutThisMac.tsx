'use client';
import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { personal } from './data';

interface AboutThisMacProps {
    isopen: boolean;
    onclose: () => void;
}

export default function AboutThisMac({ isopen, onclose }: AboutThisMacProps) {
    const { user } = useAuth();

    return (
        <AnimatePresence>
            {isopen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99998]"
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[300px] bg-[#f5f5f5] dark:bg-[#2a2a2a] rounded-xl shadow-2xl z-[99999] font-sf overflow-hidden"
                    >
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-4">
                                <Image
                                    src="/logo.svg"
                                    alt="MacOS-Next"
                                    width={80}
                                    height={80}
                                    className="w-full h-full dark:invert"
                                />
                            </div>

                            <h1 className="text-xl font-bold dark:text-white mb-1">MacOS-Next</h1>
                            <p className="text-xs text-gray-500 mb-4">Version 2.0</p>

                            <div className="w-full space-y-2 text-sm text-left mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">User</span>
                                    <span className="dark:text-white font-medium">{user?.name || 'Guest'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Framework</span>
                                    <span className="dark:text-white">Next.js 15</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Styling</span>
                                    <span className="dark:text-white">TailwindCSS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Author</span>
                                    <span className="dark:text-white">{personal.personal.name}</span>
                                </div>
                            </div>

                            <div className="w-full pt-3 border-t border-black/10 dark:border-white/10">
                                <a
                                    href={personal.personal.socials.github}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 text-xs hover:underline"
                                >
                                    View on GitHub
                                </a>
                            </div>
                        </div>

                        <div className="p-3 border-t border-black/10 dark:border-white/10 flex justify-center">
                            <button
                                onClick={onclose}
                                className="px-6 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
