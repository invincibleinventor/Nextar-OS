import React, { useState } from 'react';
import { FaInbox, FaStar, FaPaperPlane, FaTrash, FaPen } from 'react-icons/fa';

export default function Mail() {
    const [selectedmail, setselectedmail] = useState<number | null>(null);

    const mails = [
        { id: 1, sender: 'Apple', subject: 'Welcome to your new Mac', time: '9:41 AM', preview: 'Explore all the new features and get the most out of your MacBook Pro. Discover tips, tricks, and more.' },
        { id: 2, sender: 'GitHub', subject: '[GitHub] A new repository was created', time: 'Yesterday', preview: 'You created a new repository "macos-web". Check it out and start contributing today.' },
        { id: 3, sender: 'Vercel', subject: 'Deployment Successful', time: 'Yesterday', preview: 'Your project "macos-web" was successfully deployed to production. View your deployment.' },
    ];

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white rounded-lg overflow-hidden">
            {/* Sidebar - Translucent */}
            <div className="w-[200px] bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl border-r border-black/5 dark:border-white/5 flex flex-col pt-10 hidden md:flex">
                <div className="px-3 mb-2">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2">Favorites</span>
                </div>
                <div className="px-2 space-y-0.5">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 rounded-lg cursor-pointer">
                        <FaInbox size={14} className="text-blue-500" />
                        <span className="text-[13px] font-medium">Inbox</span>
                        <span className="ml-auto text-[11px] text-gray-500 font-medium">3</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer text-black/70 dark:text-white/70 transition-colors">
                        <FaPaperPlane size={14} />
                        <span className="text-[13px]">Sent</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer text-black/70 dark:text-white/70 transition-colors">
                        <FaStar size={14} />
                        <span className="text-[13px]">Starred</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer text-black/70 dark:text-white/70 transition-colors">
                        <FaTrash size={14} />
                        <span className="text-[13px]">Trash</span>
                    </div>
                </div>
            </div>

            {/* Mail List */}
            <div className="w-[300px] md:w-[320px] bg-white dark:bg-[#1e1e1e] border-r border-black/5 dark:border-white/5 flex flex-col z-10">
                <div className="h-[52px] border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur">
                    <span className="font-bold text-[16px]">Inbox</span>
                    <button className="text-gray-400 hover:text-blue-500 transition"><FaPen size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mails.map(mail => (
                        <div
                            key={mail.id}
                            onClick={() => setselectedmail(mail.id)}
                            className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition-colors relative
                                ${selectedmail === mail.id
                                    ? 'bg-blue-500 text-white z-10'
                                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}`}
                        >
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={`text-[13px] font-bold ${selectedmail === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.sender}</span>
                                <span className={`text-[11px] ${selectedmail === mail.id ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>{mail.time}</span>
                            </div>
                            <div className={`text-[13px] font-medium mb-1 truncate ${selectedmail === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.subject}</div>
                            <div className={`text-[13px] leading-snug line-clamp-2 ${selectedmail === mail.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{mail.preview}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reading Pane */}
            <div className="flex-1 bg-white dark:bg-[#1e1e1e] flex flex-col min-w-0">
                {selectedmail ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="h-[52px] border-b border-black/5 dark:border-white/5 flex items-center px-6 justify-between bg-white dark:bg-[#1e1e1e]">
                            <div className="flex gap-4 text-gray-400">
                                <FaTrash className="hover:text-red-500 cursor-pointer transition" size={14} />
                                <FaStar className="hover:text-yellow-500 cursor-pointer transition" size={14} />
                            </div>
                            <div className="flex gap-4 text-gray-400">
                                <FaPaperPlane className="hover:text-blue-500 cursor-pointer transition" size={14} />
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            <div className="flex items-start justify-between mb-6">
                                <h1 className="text-2xl font-bold text-black dark:text-white leading-tight">{mails.find(m => m.id === selectedmail)?.subject}</h1>
                                <span className="text-xs text-gray-400 mt-1 whitespace-nowrap ml-4">{mails.find(m => m.id === selectedmail)?.time}</span>
                            </div>

                            <div className="flex items-center gap-3 mb-8 border-b border-black/5 dark:border-white/5 pb-6">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                                    {mails.find(m => m.id === selectedmail)?.sender[0]}
                                </div>
                                <div>
                                    <div className="text-[14px] font-semibold text-black dark:text-white">{mails.find(m => m.id === selectedmail)?.sender}</div>
                                    <div className="text-[12px] text-gray-500">to me</div>
                                </div>
                            </div>

                            <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 space-y-4 max-w-3xl">
                                <p>Hi there,</p>
                                <p>This is a demo email content used for the portfolio preview. In a real application, this would fetch the actual body of the email.</p>
                                <p>{mails.find(m => m.id === selectedmail)?.preview}</p>
                                <p>Feel free to browse around the other apps and explore the interface!</p>
                                <br />
                                <p className="font-medium text-black dark:text-white">Best,<br />{mails.find(m => m.id === selectedmail)?.sender} Team</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                        <FaInbox size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">No Message Selected</p>
                    </div>
                )}
            </div>
        </div>
    );
}
