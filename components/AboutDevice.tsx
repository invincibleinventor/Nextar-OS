'use client';
import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { personal } from './data';

interface AboutDeviceProps {
    isopen: boolean;
    onclose: () => void;
}

export default function AboutDevice({ isopen, onclose }: AboutDeviceProps) {
    const { user } = useAuth();

    return (
        <AnimatePresence>
            {isopen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[--bg-base]/80 z-[99998]"
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-0 top-0 bottom-0 right-0 h-max my-auto mx-auto w-[300px] bg-surface border border-[--border-color] z-[99999] font-mono overflow-hidden"
                    >
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-4">
                                <Image
                                    src="/logo.svg"
                                    alt="NextarOS"
                                    width={80}
                                    height={80}
                                    className="w-full h-full"
                                />
                            </div>

                            <h1 className="text-xl font-bold text-[--text-color] mb-1">NextarOS</h1>
                            <p className="text-xs text-[--text-muted] mb-4">Version 2.0</p>

                            <div className="w-full space-y-2 text-sm text-left mb-4">
                                <div className="flex justify-between">
                                    <span className="text-[--text-muted]">User</span>
                                    <span className="text-[--text-color] font-medium">{user?.name || 'Guest'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[--text-muted]">Framework</span>
                                    <span className="text-[--text-color]">Next.js 15</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[--text-muted]">Styling</span>
                                    <span className="text-[--text-color]">TailwindCSS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[--text-muted]">Author</span>
                                    <span className="text-[--text-color]">{personal.personal.name}</span>
                                </div>
                            </div>

                            <div className="w-full pt-3 border-t border-[--border-color]">
                                <a
                                    href={personal.personal.socials.github}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-accent text-xs hover:underline"
                                >
                                    View on GitHub
                                </a>
                            </div>
                        </div>

                        <div className="p-3 border-t border-[--border-color] flex justify-center">
                            <button
                                onClick={onclose}
                                className="px-6 py-1.5 text-sm font-medium bg-accent text-[--bg-base] hover:bg-accent/80 transition-colors"
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
