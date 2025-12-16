'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useDevice } from '../DeviceContext';

export default function Terminal({ isFocused = true }: { isFocused?: boolean }) {
    const [history, sethistory] = useState(['Welcome to MacOS-Next Terminal v1.0', 'Type "help" for available commands.', '']);
    const [currline, setcurrline] = useState('');
    const endref = useRef<HTMLDivElement>(null);
    const inputref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isFocused) {
            const timer = setTimeout(() => {
                inputref.current?.focus();
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isFocused]);

    const handlekey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = currline.trim().toLowerCase();
            let response = '';

            switch (cmd) {
                case 'help':
                    response = 'Commands: about, skills, projects, contact, clear, whoami';
                    break;
                case 'about':
                    response = 'Full Stack Developer with a passion for pixel-perfect interfaces and clean code.';
                    break;
                case 'skills':
                    response = 'React • Next.js • TypeScript • Tailwind CSS • Node.js • Python • AI/ML';
                    break;
                case 'projects':
                    response = 'Visit the Finder app to browse my portfolio projects.';
                    break;
                case 'contact':
                    response = 'Email: invincibleinvnentor@gmail.com';
                    break;
                case 'whoami':
                    response = 'guest@balatbr';
                    break;
                case 'clear':
                    sethistory([]);
                    setcurrline('');
                    return;
                case '':
                    sethistory(prev => [...prev, '']);
                    return;
                default:
                    response = `zsh: command not found: ${cmd}`;
            }

            sethistory(prev => [...prev, `$ ${currline}`, response, '']);
            setcurrline('');
        }
    };

    useEffect(() => {
        endref.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);
    const ismobile = useDevice()

    return (
        <div
            className={`${ismobile ? 'pt-[50px]' : ''} h-full w-full bg-[#1e1e1e] text-[#cccccc] p-4 overflow-y-auto cursor-text`}
            onClick={() => inputref.current?.focus()}
        >
            <div className="font-mono text-[13px] leading-relaxed">
                {history.map((line, i) => (
                    <div key={i} className="min-h-[20px]">
                        {line.startsWith('$') ? (
                            <span>
                                <span className="text-[#50fa7b]">guest</span>
                                <span className="text-white">@</span>
                                <span className="text-[#8be9fd]">balatbr</span>
                                <span className="text-white"> ~ </span>
                                <span className="text-white">{line}</span>
                            </span>
                        ) : (
                            <span className="text-[#f8f8f2]">{line}</span>
                        )}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-[#50fa7b]">guest</span>
                    <span className="text-white">@</span>
                    <span className="text-[#8be9fd]">balatbr</span>
                    <span className="text-white"> ~ $ </span>
                    <input
                        ref={inputref}
                        className="flex-1 bg-transparent outline-none text-[#f8f8f2] font-mono"
                        value={currline}
                        onChange={(e) => setcurrline(e.target.value)}
                        onKeyDown={handlekey}
                        spellCheck={false}
                    />
                </div>
                <div ref={endref} />
            </div>
        </div>
    )
}
