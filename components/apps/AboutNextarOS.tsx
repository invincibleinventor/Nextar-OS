'use client';
import React from 'react';
import Image from 'next/image';
import { useAuth } from '../AuthContext';
import { personal } from '../data';

export default function AboutNextarOS() {
    const { user } = useAuth();

    return (
        <div className="h-full w-full bg-[#f5f5f5] dark:bg-[#2a2a2a] font-sf overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
                <div className="w-20 h-20 mb-4">
                    <Image
                        src="/logo.svg"
                        alt="NextarOS"
                        width={80}
                        height={80}
                        className="w-full h-full dark:invert"
                    />
                </div>

                <h1 className="text-xl font-bold dark:text-white mb-1">NextarOS</h1>
                <p className="text-xs text-gray-500 mb-4">Version 2.0</p>

                <div className="w-full max-w-[250px] space-y-2 text-sm text-left mb-4">
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
        </div>
    );
}
