'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../AuthContext';
import { personal } from '../data';
import { IoInformationCircleOutline, IoHelpCircleOutline } from 'react-icons/io5';

type Tab = 'about' | 'help';

const HELP_SECTIONS = [
    {
        id: 'google-client-id',
        title: 'Setting up Google Client ID',
        content: [
            '1. Go to console.cloud.google.com',
            '2. Create a new project (or select existing)',
            '3. Navigate to APIs & Services > Credentials',
            '4. Click "Create Credentials" > "OAuth client ID"',
            '5. Select "Web application" as application type',
            '6. Add your domain to "Authorized JavaScript origins"',
            '   e.g. http://localhost:3000 for local dev',
            '7. Add your callback URL to "Authorized redirect URIs"',
            '   e.g. http://localhost:3000/auth/callback',
            '8. Copy the Client ID',
            '9. Create a .env.local file in your project root:',
            '   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here',
            '10. Restart the dev server',
            '',
            'Required APIs to enable:',
            '  - Gmail API (for Mail app)',
            '  - Google Classroom API (for Lab Submit)',
        ],
    },
    {
        id: 'linux-vm',
        title: 'Linux Virtual Machine',
        content: [
            'The Linux VM runs via CheerpX (WebAssembly).',
            'It requires cross-origin isolation headers.',
            '',
            'If the VM fails to boot:',
            '  - Ensure your browser supports SharedArrayBuffer',
            '  - Try refreshing the page once (service worker needs one load)',
            '  - Chrome, Edge, Firefox, and Safari 16.4+ are supported',
            '',
            'Internet access in the VM:',
            '  - Click "Connect to Internet" in the terminal',
            '  - A Tailscale login page will open (free account)',
            '  - After login, apt, curl, pip, etc. will work',
        ],
    },
    {
        id: 'webcontainer',
        title: 'WebContainer Terminal',
        content: [
            'The code editor uses WebContainers for Node.js.',
            'npm, node, and npx are available.',
            '',
            'If the terminal shows "Failed to boot":',
            '  - WebContainers need cross-origin isolation',
            '  - These headers are set in next.config.ts',
            '  - Check that no other service worker interferes',
        ],
    },
    {
        id: 'keyboard',
        title: 'Keyboard Shortcuts',
        content: [
            'Global:',
            '  Cmd+Space    Open App Launcher',
            '  Cmd+W        Close active window',
            '  Cmd+N        New window (where supported)',
            '',
            'Code Editor:',
            '  Cmd+S        Save file',
            '  Cmd+Shift+B  Run code',
            '  Cmd+`        Toggle terminal',
            '  Cmd+B        Toggle sidebar',
            '',
            'Terminal:',
            '  Ctrl+C       Interrupt process',
            '  Ctrl+D       EOF / exit',
        ],
    },
];

export default function AboutNextarOS() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('about');
    const [expandedSection, setExpandedSection] = useState<string | null>('google-client-id');

    return (
        <div className="h-full w-full bg-[--bg-base] font-mono overflow-hidden flex flex-col">
            <div className="flex border-b border-[--border-color] shrink-0">
                <button
                    onClick={() => setActiveTab('about')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'about'
                            ? 'text-[--text-color] border-b-2 border-accent'
                            : 'text-[--text-muted] hover:text-[--text-color]'
                    }`}
                >
                    <IoInformationCircleOutline size={14} />
                    About
                </button>
                <button
                    onClick={() => setActiveTab('help')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'help'
                            ? 'text-[--text-color] border-b-2 border-accent'
                            : 'text-[--text-muted] hover:text-[--text-color]'
                    }`}
                >
                    <IoHelpCircleOutline size={14} />
                    Help
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'about' && (
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
                        <p className="text-xs text-[--text-muted] mb-1">Version 1.0</p>
                        <p className="text-xs text-[--text-muted] mb-4">Your personal cloud OS.</p>

                        <div className="w-full max-w-[250px] space-y-2 text-[13px] text-left mb-4">
                            <div className="flex justify-between">
                                <span className="text-[--text-muted]">User</span>
                                <span className="text-[--text-color] font-medium">{user?.name || 'Guest'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[--text-muted]">Platform</span>
                                <span className="text-[--text-color]">Cloud</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[--text-muted]">Access</span>
                                <span className="text-[--text-color]">Any browser, any device</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[--text-muted]">By</span>
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
                                Learn more
                            </a>
                        </div>
                    </div>
                )}

                {activeTab === 'help' && (
                    <div className="p-4 space-y-2">
                        {HELP_SECTIONS.map(section => (
                            <div key={section.id} className="border border-[--border-color]">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-overlay transition-colors"
                                >
                                    <span className="text-[13px] font-medium text-[--text-color]">{section.title}</span>
                                    <span className="text-[--text-muted] text-xs">{expandedSection === section.id ? '\u25B2' : '\u25BC'}</span>
                                </button>
                                {expandedSection === section.id && (
                                    <div className="px-4 pb-4 border-t border-[--border-color]">
                                        <pre className="text-[12px] text-[--text-color] leading-relaxed whitespace-pre-wrap font-mono mt-3">
                                            {section.content.join('\n')}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
