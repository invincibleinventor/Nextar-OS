'use client';
import React, { useState, useRef, useEffect } from 'react';
import { IoSend } from "react-icons/io5";

export default function Messages() {
    const [messages, setmessages] = useState([
        { id: 1, text: "Hey! Welcome to my portfolio 👋", sender: 'them', time: '9:41 AM' },
        { id: 2, text: "Feel free to explore around. If you have any questions, just drop a message!", sender: 'them', time: '9:41 AM' },
    ]);
    const [input, setinput] = useState('');
    const listref = useRef<HTMLDivElement>(null);

    const handlesend = () => {
        if (!input.trim()) return;
        const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setmessages(prev => [...prev, { id: Date.now(), text: input, sender: 'me', time: now }]);
        setinput('');
        setTimeout(() => {
            const responses = [
                "Thanks for reaching out! I'll get back to you soon.",
                "Great question! Let me think about that.",
                "I appreciate your interest in my work!",
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            setmessages(prev => [...prev, {
                id: Date.now() + 1,
                text: response,
                sender: 'them',
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            }]);
        }, 1500);
    };

    useEffect(() => {
        listref.current?.scrollTo({ top: listref.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="h-full w-full bg-white dark:bg-[#232323] flex font-sf">
            <div className="w-[240px] border-r border-black/5 dark:border-white/5 bg-[#f6f6f6] dark:bg-[#2a2a2a] hidden sm:flex flex-col">
                <div className="h-[50px] flex items-center justify-center border-b border-black/5 dark:border-white/5">
                    <input
                        placeholder="Search"
                        className="w-[calc(100%-24px)] bg-black/5 dark:bg-white/5 rounded-md px-3 py-1.5 text-[12px] outline-none placeholder-gray-400"
                    />
                </div>
                <div className="p-2">
                    <div className="p-3 bg-[#007AFF] rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-[13px]">Invincible</div>
                            <div className="text-[11px] text-white/70 truncate">Hey! Welcome to my portfolio</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full">
                <div className="h-[50px] border-b border-black/5 dark:border-white/5 flex items-center justify-center bg-[#f6f6f6]/80 dark:bg-[#2a2a2a]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm" />
                        <div>
                            <div className="text-[13px] font-medium text-black dark:text-white">Invincible Inventor</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3" ref={listref}>
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3 py-2 text-[14px] leading-snug
                                ${m.sender === 'me'
                                    ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm'
                                    : 'bg-[#e9e9eb] dark:bg-[#3a3a3a] text-black dark:text-white rounded-2xl rounded-bl-sm'
                                }`}
                            >
                                {m.text}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-2 bg-[#f6f6f6] dark:bg-[#2a2a2a] border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] rounded-full px-4 py-1.5 border border-black/5 dark:border-white/10">
                        <input
                            value={input}
                            onChange={(e) => setinput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlesend()}
                            className="flex-1 bg-transparent outline-none text-[14px] text-black dark:text-white placeholder-gray-400"
                            placeholder="iMessage"
                        />
                        <button
                            onClick={handlesend}
                            disabled={!input.trim()}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                                ${input.trim()
                                    ? 'bg-[#007AFF] text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}
                        >
                            <IoSend size={14} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
