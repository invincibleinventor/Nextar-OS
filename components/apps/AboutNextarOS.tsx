'use client';
import React from 'react';
import Image from 'next/image';
import { useAuth } from '../AuthContext';
import { personal } from '../data';

export default function AboutNextarOS() {
    const { user } = useAuth();

    return (
        <div className="h-full w-full bg-[--bg-base] font-mono overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
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

                <div className="w-full max-w-[250px] space-y-2 text-sm text-left mb-4">
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
        </div>
    );
}
