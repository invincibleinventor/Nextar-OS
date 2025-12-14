'use client';
import React from 'react';

const articles = [
    {
        id: 1,
        category: "Tech",
        title: "The Future of React Server Components",
        author: "Invincible Inventor",
        img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
        time: "2 hours ago"
    },
    {
        id: 2,
        category: "Design",
        title: "Mastering Tailwind CSS v4",
        author: "Invincible Inventor",
        img: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=600&fit=crop",
        time: "Yesterday"
    },
    {
        id: 3,
        category: "AI",
        title: "Building Autonomous Agents",
        author: "Invincible Inventor",
        img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
        time: "2 days ago"
    },
];

export default function News() {
    return (
        <div className="h-full w-full bg-[#fafafa] dark:bg-[#1e1e1e] flex font-sf">
            <div className="w-[220px] border-r border-black/5 dark:border-white/5 bg-[#f6f6f6] dark:bg-[#252525] hidden md:flex flex-col">
                <div className="p-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="text-[24px]">📰</div>
                        <span className="text-[18px] font-bold text-black dark:text-white">News</span>
                    </div>
                </div>
                <div className="p-2 space-y-0.5">
                    <div className="px-3 py-2 bg-[#FA3B4E] text-white rounded-lg text-[13px] font-medium">
                        Today
                    </div>
                    <div className="px-3 py-2 text-gray-600 dark:text-gray-400 text-[13px] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-default">
                        News+
                    </div>
                    <div className="px-3 py-2 text-gray-600 dark:text-gray-400 text-[13px] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-default">
                        Saved Stories
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-[50px] flex items-center justify-center border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl">
                    <span className="font-serif text-[20px] font-bold italic text-black dark:text-white">Portfolio News</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {articles.map(article => (
                            <article key={article.id} className="group cursor-pointer">
                                <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-gray-200 dark:bg-gray-700 shadow-sm group-hover:shadow-lg transition-shadow">
                                    <img
                                        src={article.img}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#FA3B4E] uppercase tracking-wide">
                                            {article.category}
                                        </span>
                                        <span className="text-[11px] text-gray-400">•</span>
                                        <span className="text-[11px] text-gray-400">{article.time}</span>
                                    </div>
                                    <h3 className="font-bold text-[16px] leading-tight text-black dark:text-white group-hover:text-[#FA3B4E] transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-[12px] text-gray-500">By {article.author}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
