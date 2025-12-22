import React from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import TintedAppIcon from './ui/TintedAppIcon';
import {
    FaReact, FaPython, FaHtml5, FaCss3Alt, FaLinux, FaGitAlt, FaJava,
    FaGithub, FaSafari, FaLinkedin
} from 'react-icons/fa';
import {
    SiNextdotjs, SiTailwindcss, SiTypescript, SiSupabase, SiFirebase,
    SiMongodb, SiGnubash, SiCplusplus, SiWordpress
} from 'react-icons/si';
import { PiThreadsLogo } from "react-icons/pi";
import {
    IoCloseOutline, IoFolderOutline, IoDocumentTextOutline, IoAppsOutline,
    IoGridOutline, IoListOutline, IoChevronBack, IoChevronForward,
    IoSearch, IoGlobeOutline, IoInformationCircleOutline,
    IoCodeOutline, IoMailOutline, IoPersonCircleOutline, IoFlagOutline, IoSchoolOutline, IoConstructOutline, IoFolderOpenOutline, IoLogoGithub, IoHeartOutline,
    IoDesktopOutline,
    IoDownloadOutline
} from "react-icons/io5";

export interface appdata {
    id: string;
    appname: string;
    icon: string;
    maximizeable: boolean;
    componentname: string;
    additionaldata: any;
    multiwindow: boolean;
    titlebarblurred: boolean;
    pinned: boolean;
    defaultsize?: { width: number; height: number };
    acceptedMimeTypes?: string[];
    category?: string;
    titlemenu?: { title: string; disabled: boolean; separator?: boolean; actionId?: string }[];
    menus?: Record<string, { title?: string; disabled?: boolean; separator?: boolean; actionId?: string }[]>;
    isExternal?: boolean;
    externalUrl?: string;
    manifest?: {
        permissions: {
            fs?: string[];
            system?: string[];
            window?: string[];
            user?: string[];
        };
    };
}

export interface filesystemitem {
    name: string;
    parent: string | null;
    mimetype: string;
    date: string;
    size: string;
    icon?: React.ReactNode | string;
    link?: string;
    content?: string;
    appname?: string;
    description?: string;
    id: string;
    projectPath?: string;
    projectLink?: string;
    isSystem?: boolean;
    isTrash?: boolean;
    originalParent?: string;
    isReadOnly?: boolean;
    linkPath?: string;
    owner?: string;
    appId?: string;
}

export const componentmap: { [key: string]: any } = {
    'apps/Explorer': dynamic(() => import('./apps/Explorer')),
    'apps/FileInfo': dynamic(() => import('./apps/FileInfo')),
    'apps/TextEdit': dynamic(() => import('./apps/TextEdit')),
    'apps/Settings': dynamic(() => import('./apps/Settings')),
    'apps/Calendar': dynamic(() => import('./apps/Calendar')),
    'apps/Browser': dynamic(() => import('./apps/Browser')),
    'apps/Photos': dynamic(() => import('./apps/Photos')),
    'apps/Terminal': dynamic(() => import('./apps/Terminal')),
    'apps/Launchpad': dynamic(() => import('./apps/Launchpad')),
    'apps/Python': dynamic(() => import('./apps/Python')),
    'apps/FileViewer': dynamic(() => import('./apps/FileViewer')),
    'apps/Notes': dynamic(() => import('./apps/Notes')),
    'apps/Music': dynamic(() => import('./apps/Music')),
    'apps/AboutBala': dynamic(() => import('./apps/AboutBala')),
    'apps/AppStore': dynamic(() => import('./apps/AppStore')),
    'apps/BalaDev': dynamic(() => import('./apps/BalaDev')),
    'apps/Welcome': dynamic(() => import('./apps/Welcome')),
    'apps/Mail': dynamic(() => import('./apps/Mail')),
    'apps/Calculator': dynamic(() => import('./apps/Calculator')),
    'apps/ExternalAppLoader': dynamic(() => import('./apps/ExternalAppLoader')),
    'apps/ApiDocs': dynamic(() => import('./apps/ApiDocs')),
    'apps/SystemMonitor': dynamic(() => import('./apps/SystemMonitor')),
    'DynamicAppRunner': dynamic(() => import('./DynamicAppRunner')),
};




export const personal = {
    personal: {
        name: "Bala TBR",
        role: "Second Year Comp Sci Student - Next.JS Full Stack Developer",
        bio: "Second-year Computer Science undergraduate at SASTRA Deemed to be University with hands-on experience building and deploying full-stack web applications used by real users. Strong in Next.js, PostgreSQL, and document processing systems. Actively seeking software engineering internships.",
        location: "India",
        username: "invincibleinventor",
        email: "invincibleinventor@gmail.com",
        socials: {
            github: "https://github.com/invincibleinventor",
            threads: "https://threads.com/balatbr",
            linkedin: "https://www.linkedin.com/in/balasubramaniantbr/"
        }
    },
    education: [
        {
            degree: "Bachelor Of Technology - Computer Science",
            institution: "SASTRA Deemed To Be University",
            year: "2024 - 2028",
            grade: "CGPA: 7.64"
        }
    ],
    projects: [
        {
            title: "Falar",
            type: "Open Source",
            date: 2022,
            desc: "Built and deployed a full-stack social platform with authentication, content posting, and media uploads using Next.js and PostgreSQL. Integrated Google OAuth and Amazon S3. Designed relational schemas and end-to-end features.",
            stack: ["Next.js", "Supabase", "TailwindCSS", "Amazon S3"],
            link: "https://falarapp.vercel.app",
            github: "https://github.com/invincibleinventor/falar",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "NextarOS",
            date: 2023,
            type: "Open Source",
            desc: "Built an interactive simulated operating system with window management on desktop and a responsive convergent mobile UI. Implemented custom animations and responsive transitions using Framer Motion and GSAP.",
            stack: ["Next.js", "TailwindCSS"],
            link: "https://baladev.in",
            github: "https://github.com/invincibleinventor/nextar-os",
            icon: <FaReact className="text-blue-500" />
        },
        {
            title: "VSCode Portfolio",
            date: 2022,
            type: "Open Source",
            desc: "A portfolio website themed like Visual Studio Code.",
            stack: ["Next.js", "TailwindCSS", "TypeScript"],
            link: "https://baladev.vercel.app",
            github: "https://github.com/invincibleinventor/vscode-portfolio",
            icon: <SiTypescript className="text-blue-600" />
        },
        {
            title: "W11Web",
            date: 2021,
            type: "Open Source",
            desc: "Windows 11 desktop simulation using Vanilla CSS.",
            stack: ["TypeScript", "CSS", "Webpack"],
            link: "https://w11web.vercel.app",
            github: "https://github.com/invincibleinventor/w11web",
            icon: <FaCss3Alt className="text-blue-500" />
        },
        {
            title: "Filmhood Journal",
            date: 2022,
            type: "Closed Source",
            desc: "A wordpress blog for an aspiring filmmaker.",
            stack: ["Wordpress", "Analytics"],
            link: "https://filmhoodjournal.com",
            github: "#",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "Calistnx",
            date: 2023,
            type: "Closed Source",
            desc: "E-commerce platform for fitness courses.",
            stack: ["Wordpress", "WooCommerce", "Stripe"],
            link: "https://calistnx.com",
            github: "#",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "TTS Internal Tools",
            date: 2022,
            type: "Closed Source",
            desc: "Management system for Golden Jubilee fests.",
            stack: ["Qwik JS", "Supabase", "TailwindCSS"],
            link: "https://ttsgold.vercel.app",
            github: "https://github.com/invincibleinventor/gold",
            icon: <SiSupabase className="text-green-500" />
        },
        {
            title: "SquadSearch",
            date: 2025,
            type: "Open Source",
            desc: "Developed an anonymous-first hiring platform generating candidate summaries using AI from resumes and GitHub data to reduce bias. Built swipe-based shortlisting and a secure invite-only contact reveal workflow.",
            stack: ["Next.js", "Supabase", "GSAP", "TailwindCSS", "LLMs", "FastAPI", "SMTP", "Python"],
            link: "https://squadsearch.vercel.app",
            github: "https://github.com/invincibleinventor/squadsearch",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "Sastracker",
            date: 2025,
            type: "Open Source",
            desc: "Built a system used by 500+ students to convert question paper PDFs into a structured, searchable database, handling multi-page and inconsistent formats. Implemented LLM-assisted extraction with fallbacks, fast search, AI-assisted solving, and community-contributed answers.",
            stack: ["Next.js", "Supabase", "LLMs", "TailwindCSS", "FastAPI"],
            link: "https://sastracker.vercel.app",
            github: "https://github.com/invincibleinventor/sastracker",
            icon: <FaReact className="text-blue-500" />
        },
        {
            title: "EzyPing",
            date: 2025,
            type: "Open Source",
            desc: "A lightweight uptime monitor for tracking website status and to quicky notify subscribed users of website changes through SMTP.",
            stack: ["Next.js", "TypeScript", "Node.js", "CRON"],
            link: "https://ezyping.vercel.app",
            github: "https://github.com/invincibleinventor/ezyping",
            icon: <SiTypescript className="text-blue-600" />
        }
    ],
    skills: [
        "HTML/CSS (Fluent)", "TailwindCSS (Fluent)", "React/Next.js (Fluent)", "TypeScript (Fluent)",
        "Node.js/Express (Fluent)", "Python (Fluent)", "C/C++ (Decent)", "Linux (Arch, Ubuntu)",
        "Git", "Docker", "Figma", "Firebase/Supabase"
    ]
};

export const apps: appdata[] = [
    {
        id: 'explorer',
        appname: 'Explorer',
        icon: '/explorer.png',
        maximizeable: true,
        componentname: 'apps/Explorer',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        defaultsize: { width: 1000, height: 600 },
        category: 'Utilities',
        titlemenu: [
            { title: "About Explorer", disabled: false },
            { title: "Quit Explorer", disabled: false },
        ],
        manifest: {
            permissions: {
                fs: ['fs.read', 'fs.write', 'fs.system'],
                window: ['window.multiInstance']
            }
        }
    },
    {
        id: 'settings',
        appname: 'Settings',
        icon: '/settings.png',
        maximizeable: true,
        componentname: 'apps/Settings',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        category: 'Utilities',
        manifest: {
            permissions: {
                system: ['system.settings', 'system.theme'],
                user: ['user.current']
            }
        }
    },
    {
        id: 'python',
        appname: 'Code Editor',
        icon: '/code.png',
        maximizeable: true,
        componentname: 'apps/Python',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        category: 'Creativity'
    },
    {
        id: 'mail',
        appname: 'Mail',
        icon: '/mail.png',
        maximizeable: true,
        componentname: 'apps/Mail',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        category: 'Social'
    },
    {
        id: 'calendar',
        appname: 'Calendar',
        icon: '/calendar.png',
        maximizeable: true,
        componentname: 'apps/Calendar',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        category: 'Productivity'
    },
    {
        id: 'textedit',
        appname: 'Text Edit',
        componentname: 'apps/TextEdit',
        icon: '/textedit.png',
        multiwindow: true,
        acceptedMimeTypes: ['text/plain', 'text/markdown', 'text/x-uri', 'application/json'],
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        additionaldata: { startlarge: false },
        category: 'Productivity'
    },
    {
        id: 'notes',
        appname: 'Notes',
        componentname: 'apps/Notes',
        icon: '/notes.png',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        additionaldata: {},
        category: 'Productivity',
        defaultsize: { width: 700, height: 500 }
    },
    {
        id: 'music',
        appname: 'Music',
        componentname: 'apps/Music',
        icon: '/music.png',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        additionaldata: {},
        category: 'Entertainment',
        defaultsize: { width: 900, height: 600 }
    },
    {
        id: 'calculator',
        appname: 'Calculator',
        icon: '/calculator.png',
        maximizeable: true,
        componentname: 'apps/Calculator',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 300, height: 500 },
        category: 'Utilities'
    },
    {
        id: 'appstore',
        appname: 'App Store',
        icon: '/appstore.png',
        maximizeable: false,
        componentname: 'apps/AppStore',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        category: 'Creativity'
    },
    {
        id: 'apidocs',
        appname: 'API Docs',
        icon: '/terminal.png',
        maximizeable: true,
        componentname: 'apps/ApiDocs',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        category: 'Developer Tools'
    },
    {
        id: 'browser',
        appname: 'Browser',
        icon: '/browser.png',
        maximizeable: true,
        componentname: 'apps/Browser',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        acceptedMimeTypes: ['text/x-uri'],
        category: 'Productivity'
    },
    {
        id: 'terminal',
        appname: 'Terminal',
        icon: '/terminal.webp',
        maximizeable: true,
        componentname: 'apps/Terminal',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        category: 'Utilities',
        manifest: {
            permissions: {
                fs: ['fs.read', 'fs.write', 'fs.system'],
                window: ['window.multiInstance']
            }
        }
    },
    {
        id: 'photos',
        appname: 'Photos',
        icon: '/photos.webp',
        maximizeable: true,
        componentname: 'apps/Photos',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        category: 'Creativity',
        manifest: {
            permissions: {
                fs: ['fs.read', 'fs.homeOnly'],
                window: ['window.multiInstance', 'window.fullscreen']
            }
        }
    },
    {
        id: 'welcome',
        appname: 'Welcome',
        icon: '/info.png',
        maximizeable: false,
        componentname: 'apps/Welcome',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 850, height: 550 },
        category: 'Utilities'
    },
    {
        id: 'fileviewer',
        appname: 'File Viewer',
        icon: '/preview.png',
        maximizeable: true,
        componentname: 'apps/FileViewer',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        category: 'Productivity',
        defaultsize: { width: 600, height: 400 },
        acceptedMimeTypes: ['text/markdown', 'text/plain', 'text/x-uri', 'application/pdf']
    },
    {
        id: 'getinfo',
        appname: 'Get Info',
        icon: '/explorer.png',
        maximizeable: false,
        componentname: 'apps/FileInfo',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 300, height: 450 }
    },
    {
        id: 'aboutbala',
        appname: 'About Bala',
        icon: '/about.png',
        maximizeable: false,
        componentname: 'apps/AboutBala',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: true,
        pinned: true,
        defaultsize: { width: 400, height: 550 },
        category: 'Utilities'
    },
    {
        id: 'systemmonitor',
        appname: 'System Monitor',
        icon: '/terminal.webp',
        maximizeable: true,
        componentname: 'apps/SystemMonitor',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 800, height: 500 },
        category: 'Utilities',
        manifest: {
            permissions: {
                system: ['system.settings'],
                user: ['user.current']
            }
        }
    }
];

export const menus = [
    {
        appname: "Explorer",
        menus: {
            File: [
                { title: "New Explorer Window", actionId: "new-window", disabled: false },
                { title: "New Folder", actionId: "new-folder", disabled: false },
                { title: "New Folder with Selection", actionId: "new-folder-selection", disabled: true },
                { title: "New Smart Folder", actionId: "new-smart-folder", disabled: false },
                { title: "New Tab", actionId: "new-tab", disabled: false },
                { separator: true },
                { title: "Open", actionId: "open", disabled: false },
                { title: "Open With", actionId: "open-with", disabled: false },
                { title: "Close Window", actionId: "close-window", disabled: false },
                { separator: true },
                { title: "Move to Trash", actionId: "move-to-trash", disabled: false },
                { separator: true },
                { title: "Get Info", actionId: "get-info", disabled: false },
                { title: "Rename", actionId: "rename", disabled: false },
                { title: "Duplicate", actionId: "duplicate", disabled: true }
            ],
            Edit: [
                { title: "Undo", actionId: "undo", disabled: true },
                { title: "Redo", actionId: "redo", disabled: true },
                { separator: true },
                { title: "Cut", actionId: "cut", disabled: true },
                { title: "Copy", actionId: "copy", disabled: false },
                { title: "Paste", actionId: "paste", disabled: true },
                { title: "Select All", actionId: "select-all", disabled: false }
            ],
            View: [
                { title: "As Icons", disabled: false },
                { title: "As List", disabled: false },
                { title: "As Columns", disabled: false },
                { title: "As Gallery", disabled: false },
                { separator: true },
                { title: "Hide Sidebar", disabled: false },
                { title: "Show Preview", disabled: false }
            ],
            Go: [
                { title: "Back", disabled: true },
                { title: "Forward", disabled: true },
                { title: "Enclosing Folder", disabled: false },
                { separator: true },
                { title: "Recent Folders", disabled: false },
                { title: "iCloud Drive", disabled: false },
                { title: "Applications", disabled: false },
                { title: "Desktop", disabled: false },
                { title: "Documents", disabled: false },
                { title: "Downloads", disabled: false }
            ],

        }
    }
];

export const titlemenu = [
    {
        title: "Explorer",
        menu: [
            { title: "About Explorer", disabled: false },
            { title: "Quit Explorer", disabled: false },
        ]
    },
    {
        title: "Calculator",
        menu: [
            { title: "About Calculator", disabled: false },
            { title: "Quit Calculator", disabled: false },
        ]
    }
];

export const mainmenu = [
    { title: "About This Mac", disabled: false },
    { separator: true },
    { title: "System Settings...", disabled: false },
    { title: "App Store...", disabled: true },
    { separator: true },
    { title: "Recent Items", disabled: false },
    { separator: true },
    { title: "Force Quit...", disabled: false },
    { separator: true },
    { title: "Sleep", disabled: false },
    { title: "Restart...", disabled: false },
    { title: "Shut Down...", disabled: false },
    { separator: true },
    { title: "Lock Screen", disabled: false },
    { title: "Log Out User...", disabled: false },
];

export const sidebaritems = [
    {
        title: 'Favorites',
        items: [
            { name: 'Projects', icon: IoFolderOutline, path: ['System', 'Users', 'Guest', 'Projects'] },
            { name: 'Applications', icon: IoAppsOutline, path: ['System', 'Applications'] },
            { name: 'About Me', icon: IoDocumentTextOutline, path: ['System', 'Users', 'Guest', 'About Me'] },
            { name: 'Desktop', icon: IoDesktopOutline, path: ['System', 'Users', 'Guest', 'Desktop'] },
            { name: 'Documents', icon: IoDocumentTextOutline, path: ['System', 'Users', 'Guest', 'Documents'] },
            { name: 'Downloads', icon: IoDownloadOutline, path: ['System', 'Users', 'Guest', 'Downloads'] },
        ]
    },
    {
        title: 'iCloud',
        items: [
            { name: 'iCloud Drive', icon: IoFolderOutline, path: ['iCloud Drive'] },
        ]
    },
    {
        title: 'Locations',
        items: [
            { name: 'System', icon: IoAppsOutline, path: ['System'] },
            { name: 'Network', icon: IoGlobeOutline, path: ['Network'] },
        ]
    }
];

export interface MailItem {
    id: string;
    folder: string;
    category: string;
    sender: string;
    senderEmail: string;
    subject: string;
    date: string;
    iconType: 'image' | 'icon';
    iconSrc?: string;
    icon?: React.ElementType;
    preview: string;
    content: React.ReactNode;
}

export const ALL_MAILS: MailItem[] = [
    {
        id: 'about-welcome',
        folder: 'about',
        category: 'About',
        sender: 'Bala TBR',
        senderEmail: 'me@baladev.in',
        subject: 'Welcome to my Portfolio OS!',
        date: 'Just Now',
        iconType: 'image' as const,
        iconSrc: `pfp.png`,
        preview: 'Thanks for stopping by. I am a Second-year Computer Science undergraduate...',
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-black dark:text-white">
                <p>Hi there,</p>
                <p>Welcome to <strong>NextarOS</strong>! I built this &quot;Portfolio OS&quot; to demonstrate the power of modern web technologies.</p>
                <p><strong>About Me:</strong></p>
                <p>{personal.personal.bio}</p>
                <p>Feel free to explore the apps, check out my projects in the &quot;Projects&quot; folder, or read my latest thoughts in &quot;Blog&quot;.</p>
                <p>Best,<br />Bala</p>
            </div>
        )
    },
    ...personal.projects.map(proj => ({
        id: `proj - ${proj.title} `,
        folder: 'projects',
        category: 'Projects',
        sender: 'GitHub',
        senderEmail: 'notifications@github.com',
        subject: `Project Update: ${proj.title} `,
        date: 'Yesterday',
        iconType: 'image' as const,
        iconSrc: `/appimages/${proj.title.toLowerCase()}.png`,
        preview: `Repository update for ${proj.title}.${proj.desc}`,
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-black dark:text-white">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
                    <div className="w-16 flex  shrink-0 h-16 bg-white dark:bg-black rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-black/5">
                        <Image src={`/appimages/${proj.title.toLowerCase()}.png`} width={64} height={64} alt={proj.title} className="w-full flex shrink-0 h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{proj.title}</h3>
                        <p className="text-xs text-gray-500">{proj.stack.join(' • ')}</p>
                    </div>
                </div>
                <p><strong>Description:</strong></p>
                <p>{proj.desc}</p>
                <p><strong>Tech Stack:</strong> {proj.stack.join(', ')}</p>
                <div className="pt-4 flex gap-3">
                    <a href={proj.link || '#'} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-accent text-center line-clamp-2 mx-auto text-white rounded-md text-xs font-semibold hover:bg-[#0062cc] transition shadow-sm">
                        View Project
                    </a>
                </div>
            </div>
        )
    })),
];

export const getMails = (): MailItem[] => {
    return [];
};


export const generateSystemFilesystem = (): filesystemitem[] => {
    const fs: filesystemitem[] = [];

    fs.push({
        id: 'root-hd',
        name: 'System',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'system'
    });

    fs.push({
        id: 'root-apps',
        name: 'Applications',
        parent: 'root-hd',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: 'system'
    });

    fs.push({
        id: 'root-users',
        name: 'Users',
        parent: 'root-hd',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'system'
    });

    fs.push({
        id: 'root-network',
        name: 'Network',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: 'system'
    });

    apps.forEach(a => {
        if (a.id !== 'explorer') {
            fs.push({
                id: `app-${a.id}`,
                name: a.appname,
                parent: 'root-apps',
                mimetype: 'application/x-executable',
                date: 'Today',
                size: 'App',
                icon: a.icon,
                appname: a.appname,
                description: `Launch ${a.appname} application.`,
                isSystem: true,
                owner: 'system'
            });
        }
    });

    return fs;
};

export const generateGuestFilesystem = (): filesystemitem[] => {
    const fs: filesystemitem[] = [...generateSystemFilesystem()];

    fs.push({
        id: 'user-guest',
        name: 'Guest',
        parent: 'root-users',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-desktop',
        name: 'Desktop',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-docs',
        name: 'Documents',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-downloads',
        name: 'Downloads',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-projects',
        name: 'Projects',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-about',
        name: 'About Me',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-icloud',
        name: 'iCloud Drive',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-trash',
        name: 'Trash',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isTrash: true,
        isReadOnly: true,
        owner: 'guest'
    });

    personal.projects.forEach(p => {
        const pid = `guest-project-${p.title}`;

        fs.push({
            id: pid,
            name: p.title,
            parent: 'guest-projects',
            mimetype: 'inode/directory',
            date: 'Today',
            size: '--',
            description: p.desc,
            isSystem: true,
            isReadOnly: true,
            projectPath: p.title,
            projectLink: p.link,
            owner: 'guest'
        });

        fs.push({
            id: `${pid}-source`,
            name: 'Source Code',
            parent: pid,
            mimetype: 'text/x-uri',
            date: 'Today',
            size: '--',
            icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src='/github.png' alt={`${p.title} source code`} width={64} height={64} />,
            link: p.github,
            description: `View source code for ${p.title} on GitHub.`,
            isReadOnly: true,
            owner: 'guest'
        });

        fs.push({
            id: `${pid}-demo`,
            name: 'Live Preview',
            parent: pid,
            mimetype: 'text/x-uri',
            date: 'Today',
            icon: <Image className='w-full p-[6px] h-full sm:w-full sm:h-full' src='/live.png' alt={`${p.title} live demo`} width={64} height={64} />,
            size: '--',
            link: p.link,
            description: `Open live demo of ${p.title}.`,
            isReadOnly: true,
            owner: 'guest'
        });

        const projectPhotoBase: Partial<filesystemitem> = {
            name: `${p.title}.png`,
            mimetype: 'image/png',
            date: 'Today',
            icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src={`/appimages/${p.title.toLowerCase()}.png`} alt={`${p.title} screenshot`} width={64} height={64} />,
            size: '2.5 MB',
            description: p.desc,
            link: `/appimages/${p.title.toLowerCase()}.png`,
            content: `/appimages/${p.title.toLowerCase()}.png`,
            projectPath: p.title,
            projectLink: p.link,
            isReadOnly: true,
            owner: 'guest'
        };

        fs.push({ ...projectPhotoBase, id: `${pid}-photo`, parent: pid } as filesystemitem);
        fs.push({ ...projectPhotoBase, id: `${pid}-photo-icloud`, parent: 'guest-icloud' } as filesystemitem);

        fs.push({
            id: `${pid}-readme`,
            name: 'README.md',
            parent: pid,
            mimetype: 'text/markdown',
            date: 'Today',
            size: '1 KB',
            description: `Read more about ${p.title}.`,
            content: `# ${p.title}\n\n**Type:** ${p.type}\n\n**Date:** ${p.date}\n\n**Stack:** ${p.stack.join(', ')}\n\n## Description\n\n${p.desc}\n\nCheck out the [Live Demo](${p.link}) or view the [Source Code](${p.github}).`,
            isReadOnly: true,
            owner: 'guest'
        });
    });

    const resumeBase: Partial<filesystemitem> = {
        name: 'RESUME.pdf',
        mimetype: 'application/pdf',
        date: 'Today',
        icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src='/pdf.png' alt="Resume" width={64} height={64} />,
        size: 'PDF',
        link: '/Balasubramanian TBR.pdf',
        content: '/Balasubramanian TBR.pdf',
        description: "My Resume",
        isReadOnly: true,
        owner: 'guest'
    };

    fs.push({ ...resumeBase, id: 'guest-resume', parent: 'guest-docs' } as filesystemitem);

    apps.forEach(a => {
        if (a.id !== 'explorer' && a.id !== 'launchpad') {
            fs.push({
                id: `guest-desktop-app-${a.id}`,
                name: a.appname,
                parent: 'guest-desktop',
                mimetype: 'application/x-executable',
                date: 'Today',
                size: 'App',
                icon: a.icon,
                appname: a.appname,
                description: `Launch ${a.appname} application.`,
                isSystem: true,
                isReadOnly: true,
                owner: 'guest'
            });
        }
    });

    fs.push({ ...resumeBase, id: 'guest-desktop-resume', parent: 'guest-desktop' } as filesystemitem);

    const socialLinks = [
        { id: 'guest-about-github', name: 'Github', link: personal.personal.socials.github, icon: <FaGithub className="w-full h-full text-gray-700 dark:text-gray-300" />, desc: "My Github Profile" },
        { id: 'guest-about-linkedin', name: 'LinkedIn', link: personal.personal.socials.linkedin, icon: <FaLinkedin className="w-full h-full text-[#0077b5]" />, desc: "My LinkedIn Profile" },
        { id: 'guest-about-threads', name: 'Threads', link: personal.personal.socials.threads, icon: <PiThreadsLogo className="w-full h-full text-black dark:text-white" />, desc: "My Threads Profile" }
    ];

    socialLinks.forEach(s => {
        fs.push({
            id: s.id,
            name: s.name,
            parent: 'guest-about',
            mimetype: 'text/x-uri',
            date: 'Today',
            size: 'Web Link',
            link: s.link,
            icon: s.icon,
            description: s.desc,
            isReadOnly: true,
            owner: 'guest'
        });
    });



    fs.push({
        id: 'guest-shortcut-nextar-os',
        name: 'NextarOS',
        parent: 'guest-desktop',
        mimetype: 'inode/shortcut',
        date: 'Today',
        size: '4 KB',
        linkPath: 'guest-project-NextarOS',
        isSystem: false,
        isReadOnly: true,
        icon: <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />,
        owner: 'guest'
    });

    return fs;
};

export const generateUserFilesystem = (username: string): filesystemitem[] => {
    const fs: filesystemitem[] = [];
    const uid = `user-${username}`;

    fs.push({
        id: uid,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        parent: 'root-users',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-desktop`,
        name: 'Desktop',
        parent: uid,
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-docs`,
        name: 'Documents',
        parent: uid,
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-downloads`,
        name: 'Downloads',
        parent: uid,
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-icloud`,
        name: 'iCloud Drive',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-trash`,
        name: 'Trash',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isTrash: true,
        owner: username
    });

    const defaultApps = [
        { appId: 'explorer', name: 'Explorer', icon: '/explorer.png' },
        { appId: 'browser', name: 'Browser', icon: '/browser.png' },
        { appId: 'settings', name: 'Settings', icon: '/settings.png' },
        { appId: 'calculator', name: 'Calculator', icon: '/calculator.png' },
        { appId: 'notes', name: 'Notes', icon: '/notes.png' },
        { appId: 'terminal', name: 'Terminal', icon: '/terminal.webp' },
    ];

    defaultApps.forEach((app, idx) => {
        fs.push({
            id: `${uid}-app-${app.appId}`,
            name: app.name,
            parent: `${uid}-desktop`,
            mimetype: 'application/x-app',
            date: 'Today',
            size: '--',
            icon: app.icon,
            appId: app.appId,
            owner: username
        });
    });

    return fs;
};

export const generatefilesystem = (): filesystemitem[] => {
    return generateGuestFilesystem();
};

export const filesystem = generateGuestFilesystem();

interface SystemContext {
    addwindow: (window: any) => void;
    windows: any[];
    updatewindow: (id: string, updates: any) => void;
    setactivewindow: (id: string) => void;
    ismobile: boolean;
    files?: filesystemitem[];
}

const FileConfig: Record<string, {
    appId: string;
    icon: React.ReactNode | string | undefined;
    getLaunchProps?: (file: filesystemitem) => any;
}> = {
    'inode/directory': {
        appId: 'explorer',
        icon: <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />,
    },
    'inode/shortcut': {
        appId: 'explorer',
        icon: <Image src="/folder.png" alt="shortcut" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />,
    },
    'application/x-executable': {
        appId: 'app-launch',
        icon: <Image src="/app-store.png" alt="app" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />,
    },
    'image/png': {
        appId: 'photos',
        icon: <Image src="/photos.png" alt="image" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            singleview: true,
            src: file.content || file.link,
            title: file.name,
            desc: file.description,
            link: file.projectLink,
            projectPath: file.projectPath
        })
    },
    'image/jpeg': {
        appId: 'photos',
        icon: <Image src="/photos.png" alt="image" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            singleview: true,
            src: file.content || file.link,
            title: file.name,
            desc: file.description,
            link: file.projectLink,
            projectPath: file.projectPath
        })
    },
    'application/pdf': {
        appId: 'fileviewer',
        icon: <Image src="/pdf.png" alt="pdf" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            content: file.content,
            title: file.name,
            type: file.mimetype
        })
    },
    'text/x-uri': {
        appId: 'browser',
        icon: <IoGlobeOutline className="w-full h-full text-blue-500" />,
        getLaunchProps: (file) => ({
            initialurl: file.link || file.content
        })
    },
    'text/markdown': {
        appId: 'fileviewer',
        icon: <IoDocumentTextOutline className="w-full h-full text-gray-500" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
            type: file.mimetype
        })
    },
    'text/plain': {
        appId: 'textedit',
        icon: <IoDocumentTextOutline className="w-full h-full text-gray-500" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
            type: file.mimetype
        })
    }
};

export const getFileIcon = (mimetype: string, name: string, itemicon?: React.ReactNode | string, fileId?: string) => {
    if ((mimetype === 'application/x-executable' || mimetype === 'application/x-app') && fileId) {
        let appId = fileId;
        if (appId.includes('desktop-app-')) {
            appId = appId.split('desktop-app-').pop() || '';
        } else if (appId.startsWith('app-')) {
            appId = appId.split('app-').pop() || '';
        } else if (appId.includes('-app-')) {
            appId = appId.split('-app-').pop() || '';
        }
        const appData = apps.find(a => a.id === appId);
        if (appData) {
            return (
                <TintedAppIcon
                    appId={appData.id}
                    appName={appData.appname}
                    originalIcon={appData.icon}
                    size={64}
                    useFill={true}
                />
            );
        }
    }

    if (itemicon) {
        if (typeof itemicon === 'string') {
            if (itemicon.startsWith('/') || itemicon.startsWith('http://') || itemicon.startsWith('https://')) {
                return <Image className='w-full h-full p-[6px] sm:w-full sm:h-full object-contain' src={itemicon} alt={name} width={64} height={64} />;
            }
            return <span className="text-3xl flex items-center justify-center w-full h-full">{itemicon}</span>;
        }
        return itemicon;
    }
    const config = FileConfig[mimetype];
    if (config && config.icon) return config.icon;
    return <IoDocumentTextOutline className="w-full h-full text-gray-500" />;
};

const FolderPathMap: Record<string, string[]> = {
    'user-projects': ['System', 'Users', 'Bala', 'Projects'],
    'root-apps': ['System', 'Applications'],
    'root-icloud': ['iCloud Drive'],
    'user-docs': ['System', 'Users', 'Bala', 'Documents'],
    'user-downloads': ['System', 'Users', 'Bala', 'Downloads'],
    'root-network': ['Network'],
    'root-hd': ['System'],
    'user-desktop': ['System', 'Users', 'Bala', 'Desktop'],
    'user-about': ['System', 'Users', 'Bala', 'About Me'],
};

const ParentFolderMap: Record<string, string> = {
    'user-projects': 'Projects',
    'root-icloud': 'iCloud Drive',
    'root-apps': 'Applications',
    'user-docs': 'Documents',
    'user-downloads': 'Downloads',
    'user-desktop': 'Desktop',
    'user-about': 'About Me'
};





const resolveFolderPath = (file: filesystemitem): string[] => {
    if (FolderPathMap[file.id]) return FolderPathMap[file.id];

    const getUsername = (f: filesystemitem) => {
        if (f.owner && f.owner !== 'guest') {
            return f.owner.charAt(0).toUpperCase() + f.owner.slice(1);
        }
        return 'Guest';
    };

    const userHome = getUsername(file);

    if (file.parent) {
        if (file.parent.endsWith('-desktop') || file.parent === 'user-desktop') {
            return ['System', 'Users', userHome, 'Desktop', file.name];
        }

        if (ParentFolderMap[file.parent]) {
            if (file.parent === 'user-projects' || file.parent.endsWith('-projects')) {
                return ['System', 'Users', userHome, 'Projects', file.name];
            }
            return ['System', 'Users', userHome, ParentFolderMap[file.parent], file.name];
        }

        if (file.parent.startsWith('project-') || file.parent.includes('-project-')) {
            let projectName = file.parent;
            if (projectName.startsWith('project-')) projectName = projectName.replace('project-', '');
            if (projectName.startsWith('guest-project-')) projectName = projectName.replace('guest-project-', '');

            return ['System', 'Users', userHome, 'Projects', projectName, file.name];
        }
    }

    return [file.name];
};

const resolveTarget = (itemOrId: string | filesystemitem, currentFiles?: filesystemitem[], depth = 0): { appId?: string; props: any; title?: string } | null => {
    if (depth > 5) {
        console.warn("Shortcut recursion depth exceeded.");
        return null;
    }

    if (typeof itemOrId === 'string') {
        const app = apps.find(a => a.id === itemOrId || a.appname === itemOrId);
        if (app) return { appId: app.id, props: {}, title: app.appname };
        let file = filesystem.find(f => f.id === itemOrId);
        if (!file && currentFiles) {
            file = currentFiles.find(f => f.id === itemOrId);
        }

        if (file) return resolveTarget(file, currentFiles, depth + 1);

        if (itemOrId.startsWith('project-')) {
            const projectName = itemOrId.replace('project-', '');
            return { appId: 'explorer', props: { initialpath: ['System', 'Users', 'Bala', 'Projects', projectName] }, title: projectName };
        }

        console.warn(`System logic: Item '${itemOrId}' not found.`);
        return null;
    }

    const file = itemOrId;
    const { mimetype, id, name, linkPath } = file;
    if (mimetype === 'inode/shortcut' && linkPath) {
        return resolveTarget(linkPath, currentFiles, depth + 1);
    }

    if (mimetype === 'inode/directory' || mimetype === 'inode/directory-alias') {
        return { appId: 'explorer', props: { initialpath: resolveFolderPath(file) }, title: name };
    }

    if (mimetype === 'application/x-executable') {
        const app = apps.find(a => a.appname === file.appname || a.id === file.appname?.toLowerCase());
        if (app) return { appId: app.id, props: {}, title: app.appname };
    }

    if (mimetype === 'application/x-app' && file.appId) {
        const app = apps.find(a => a.id === file.appId);
        if (app) return { appId: app.id, props: {}, title: app.appname };
    }

    const config = FileConfig[mimetype];
    if (config) {
        return {
            appId: config.appId,
            props: config.getLaunchProps ? config.getLaunchProps(file) : {},
            title: name
        };
    }


    if (mimetype.startsWith('text/')) {
        return {
            appId: 'fileviewer',
            props: { id: file.id, content: file.content, title: file.name, type: file.mimetype },
            title: file.name
        };
    }

    if (mimetype.startsWith('image/')) {
        return {
            appId: 'photos',
            props: {
                singleview: true,
                src: file.content || file.link || `/appimages/${file.name.toLowerCase()}`,
                title: file.name,
                desc: file.description,
                link: file.projectLink,
                projectPath: file.projectPath
            },
            title: name
        };
    }

    return null;
};

export const openSystemItem = (
    itemOrId: string | filesystemitem,
    context: SystemContext,
    forceAppId?: string,
    additionalProps?: Record<string, unknown>
) => {
    console.log('[Debug] openSystemItem called for:', itemOrId);
    const { addwindow, windows, updatewindow, setactivewindow, ismobile, files } = context;

    const resolved = resolveTarget(itemOrId, files);
    const { title } = resolved || {};
    let { appId, props } = resolved || {};

    if (forceAppId) {
        appId = forceAppId;
        if (!resolved && typeof itemOrId !== 'string') {
            if (itemOrId.mimetype.startsWith('text/') || itemOrId.mimetype === 'application/pdf') {
                props = { content: itemOrId.content, title: itemOrId.name, type: itemOrId.mimetype };
            }
        }
    }

    if (additionalProps) {
        props = { ...props, ...additionalProps };
    }

    if (!appId) return;
    const app = apps.find(a => a.id === appId);

    if (!app) return;

    if (appId === 'getinfo' && typeof itemOrId !== 'string') {
        addwindow({
            id: `getinfo-${itemOrId.id}`,
            appname: 'Get Info',
            title: `${itemOrId.name} Info`,
            component: 'apps/FileInfo',
            icon: itemOrId.icon || '/explorer.png',
            isminimized: false,
            ismaximized: false,
            position: { top: 100, left: 100 },
            size: { width: 300, height: 450 },
            props: { item: itemOrId }
        });
        return;
    }

    const existingWins = windows.filter((w: any) => w.appname === app.appname);


    const reuseApps = ['Text Edit', 'File Viewer', 'Photos', 'Browser'];
    if (reuseApps.includes(app.appname)) {
        const existingInstance = existingWins.find(w => w.props && w.props.id === (props?.id));

        if (existingInstance) {
            updatewindow(existingInstance.id, {
                isminimized: false,
            });
            setactivewindow(existingInstance.id);
            return;
        }
    } else {
        if (!app.multiwindow && existingWins.length > 0) {
            const win = existingWins[existingWins.length - 1];
            updatewindow(win.id, { isminimized: false });
            setactivewindow(win.id);
            return;
        }
    }

    if (ismobile) {
        windows.forEach((w: any) => {
            if (!w.isminimized) updatewindow(w.id, { isminimized: true });
        });
    }

    let position = { top: 100, left: 100 };
    let size = app.defaultsize || { width: 900, height: 600 };
    const ismaximized = ismobile ? true : false;

    if (windows.length > 0 && !ismobile) {
        const lastWin = windows[windows.length - 1];
        if (lastWin.position) {
            position = { top: lastWin.position.top + 20, left: lastWin.position.left + 20 };
        }
    }

    if (ismobile && typeof window !== 'undefined') {
        position = { top: 0, left: 0 };
        size = { width: window.innerWidth, height: window.innerHeight };
    }

    addwindow({
        id: `${app.appname}-${Date.now()}`,
        appname: app.appname,
        title: title || app.appname,
        component: app.componentname,
        icon: app.icon,
        isminimized: false,
        ismaximized: ismaximized,
        position: position,
        size: size,
        props: props || {}
    });
};

export const mimeTypeMap: { [key: string]: string } = {
    'md': 'text/markdown',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'pdf': 'application/pdf',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json'
};

export const getMimeTypeFromExtension = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return mimeTypeMap[ext] || 'text/plain';
};

export const humanizeMime = (mime: string): string => {
    const map: { [key: string]: string } = {
        'inode/directory': 'Folder',
        'application/x-executable': 'Application',
        'application/pdf': 'PDF Document',
        'text/plain': 'Plain Text'
    };

    if (map[mime]) return map[mime];
    if (mime.startsWith('image/')) return 'Image ' + mime.split('/')[1].toUpperCase();
    return mime;
};
