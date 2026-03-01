'use client';
import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { personal } from './data';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel } from './hooks/useClayStyles';

interface AboutDeviceProps {
    isopen: boolean;
    onclose: () => void;
}

export default function AboutDevice({ isopen, onclose }: AboutDeviceProps) {
    const { user } = useAuth();
    const clay = useIsClay();

    return (
        <AnimatePresence>
            {isopen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[--bg-base]/80 z-[499]"
                        onClick={onclose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed left-0 top-0 bottom-0 right-0 h-max my-auto mx-auto w-[300px] z-[500] overflow-hidden ${clay
                            ? 'rounded-[20px]'
                            : 'bg-surface border border-[--border-color] font-mono'
                        }`}
                        style={clay ? {
                            ...glassPanel,
                            backdropFilter: 'blur(var(--glass-blur-heavy))',
                            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                        } : undefined}
                    >
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className={`w-20 h-20 mb-4 flex items-center justify-center ${clay ? 'rounded-full' : ''}`}
                                style={clay ? {
                                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-surface), white 8%) 0%, color-mix(in srgb, var(--bg-surface), black 4%) 100%)',
                                    boxShadow: 'var(--shadow-md)',
                                } : undefined}
                            >
                                <Image
                                    src="/logo.svg"
                                    alt="NextarOS"
                                    width={clay ? 48 : 80}
                                    height={clay ? 48 : 80}
                                    className={clay ? 'w-12 h-12' : 'w-full h-full'}
                                />
                            </div>

                            <h1 className="text-xl font-bold text-[--text-color] mb-1">NextarOS</h1>
                            <p className="text-xs text-[--text-muted] mb-4">Version 1.0</p>

                            <div className={`w-full space-y-2 text-[13px] text-left mb-4 p-3 ${clay ? 'rounded-[12px]' : ''}`}
                                style={clay ? {
                                    boxShadow: 'var(--shadow-inset)',
                                    background: 'var(--bg-overlay)',
                                } : undefined}
                            >
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

                            <div className={`w-full pt-3 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
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

                        <div className={`p-3 flex justify-center ${clay ? '' : 'border-t border-[--border-color]'}`}>
                            <button
                                onClick={onclose}
                                className={`px-6 py-1.5 text-[13px] font-medium text-white transition-all ${clay
                                    ? 'rounded-full active:scale-[0.97] hover:opacity-90'
                                    : 'bg-accent text-[--bg-base] hover:opacity-80'
                                }`}
                                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
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
