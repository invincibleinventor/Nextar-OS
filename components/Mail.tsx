import React, { useState } from 'react';
import { FaInbox, FaStar, FaPaperPlane, FaTrash, FaPen } from 'react-icons/fa';

export default function Mail() {
    const [selectedmail, setselectedmail] = useState<number | null>(null);

    const mails = [
        { id: 1, sender: 'Apple', subject: 'Welcome to your new Mac', time: '9:41 AM', preview: 'Explore all the new features...' },
        { id: 2, sender: 'GitHub', subject: '[GitHub] A new repository was created', time: 'Yesterday', preview: 'You created a new repository...' },
        { id: 3, sender: 'Vercel', subject: 'Deployment Successful', time: 'Yesterday', preview: 'Your project was successfully deployed...' },
    ];

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white rounded-lg overflow-hidden">
            <div className="w-[200px] bg-[#f5f5f5]/80 dark:bg-[#2c2c2c]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col pt-10">
                <div className="px-4 mb-4">
                    <h2 className="text-sm font-semibold text-gray-500 mb-2">Favorites</h2>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 px-2 py-1.5 bg-blue-500/10 text-blue-500 rounded-md cursor-pointer">
                            <FaInbox size={14} />
                            <span className="text-sm font-medium">Inbox</span>
                            <span className="ml-auto text-xs opacity-60">3</span>
                        </div>
                        <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300">
                            <FaPaperPlane size={14} />
                            <span className="text-sm">Sent</span>
                        </div>
                        <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300">
                            <FaStar size={14} />
                            <span className="text-sm">Starred</span>
                        </div>
                        <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300">
                            <FaTrash size={14} />
                            <span className="text-sm">Trash</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-[300px] bg-white dark:bg-[#1e1e1e] border-r border-black/5 dark:border-white/5 flex flex-col">
                <div className="h-12 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-3">
                    <span className="font-semibold text-sm">Inbox</span>
                    <FaPen className="text-gray-500 cursor-pointer hover:text-blue-500" size={14} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mails.map(mail => (
                        <div
                            key={mail.id}
                            onClick={() => setselectedmail(mail.id)}
                            className={`p-3 border-b border-black/5 dark:border-white/5 cursor-pointer ${selectedmail === mail.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
                        >
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className={`text-sm font-semibold ${selectedmail === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.sender}</span>
                                <span className={`text-xs ${selectedmail === mail.id ? 'text-white/80' : 'text-gray-500'}`}>{mail.time}</span>
                            </div>
                            <div className={`text-xs font-medium mb-1 ${selectedmail === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.subject}</div>
                            <div className={`text-xs ${selectedmail === mail.id ? 'text-white/80' : 'text-gray-500'} line-clamp-2`}>{mail.preview}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-[#1e1e1e] flex flex-col">
                {selectedmail ? (
                    <div className="p-8 flex flex-col h-full">
                        <div className="border-b border-black/5 dark:border-white/5 pb-4 mb-4">
                            <h1 className="text-2xl font-bold mb-2">{mails.find(m => m.id === selectedmail)?.subject}</h1>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">
                                    {mails.find(m => m.id === selectedmail)?.sender[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{mails.find(m => m.id === selectedmail)?.sender}</div>
                                    <div className="text-xs text-gray-500">{mails.find(m => m.id === selectedmail)?.time}</div>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                            <p>This is a demo email content used for the portfolio preview.</p>
                            <br />
                            <p>Feel free to browse around the other apps!</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <FaInbox size={48} className="mb-4 opacity-20" />
                        <p>No Message Selected</p>
                    </div>
                )}
            </div>
        </div>
    );
}
