'use client';
import React, { useState } from 'react';

const photos = [
    { id: 1, src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop", alt: "Tech" },
    { id: 2, src: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400&h=400&fit=crop", alt: "Code" },
    { id: 3, src: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=400&fit=crop", alt: "Dev" },
    { id: 4, src: "https://images.unsplash.com/photo-1607799275518-d58665d099db?w=400&h=400&fit=crop", alt: "Setup" },
    { id: 5, src: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=400&h=400&fit=crop", alt: "Design" },
    { id: 6, src: "https://images.unsplash.com/photo-1593642532744-9f770541f808?w=400&h=400&fit=crop", alt: "Creative" },
    { id: 7, src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop", alt: "Laptop" },
    { id: 8, src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop", alt: "Monitor" },
    { id: 9, src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=400&fit=crop", alt: "MacBook" },
];

export default function Photos() {
    const [selected, setselected] = useState<number | null>(null);

    return (
        <div className="h-full w-full bg-white dark:bg-[#232323] flex flex-col font-sf">
            <div className="h-[44px] flex items-center justify-between px-4 bg-[#f6f6f6]/80 dark:bg-[#2a2a2a]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 shrink-0">
                <div className="flex gap-4">
                    <span className="text-[13px] font-medium text-black dark:text-white">Library</span>
                    <span className="text-[13px] text-gray-400">For You</span>
                    <span className="text-[13px] text-gray-400">Albums</span>
                </div>
                <div className="flex gap-2">
                    <button className="text-[11px] px-3 py-1 bg-black/5 dark:bg-white/10 rounded-md text-black/70 dark:text-white/70">
                        Select
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
                <div className="grid grid-cols-3 gap-0.5">
                    {photos.map(p => (
                        <div
                            key={p.id}
                            className={`aspect-square bg-gray-100 dark:bg-gray-800 relative cursor-pointer overflow-hidden
                                ${selected === p.id ? 'ring-4 ring-[#007AFF] ring-inset' : ''}`}
                            onClick={() => setselected(selected === p.id ? null : p.id)}
                        >
                            <img
                                src={p.src}
                                alt={p.alt}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-[44px] flex items-center justify-center bg-[#f6f6f6]/80 dark:bg-[#2a2a2a]/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 shrink-0">
                <span className="text-[12px] text-gray-500 dark:text-gray-400">
                    {photos.length} Photos • Updated Just Now
                </span>
            </div>
        </div>
    )
}
