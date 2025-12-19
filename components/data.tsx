import React from 'react';
import Image from 'next/image';
import {
    FaReact, FaPython, FaHtml5, FaCss3Alt, FaLinux, FaGitAlt, FaJava,
    FaApple, FaGithub, FaSafari, FaLinkedin
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
    IoCodeOutline, IoMailOutline, IoPersonCircleOutline, IoFlagOutline, IoSchoolOutline, IoConstructOutline, IoFolderOpenOutline, IoLogoGithub, IoHeartOutline
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
}





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
            title: "MacOS-Next",
            date: 2023,
            type: "Open Source",
            desc: "Built a macOS-style interactive portfolio with window management on desktop and a responsive convergent iOS-style UI on mobile. Implemented custom animations and responsive transitions using Framer Motion and GSAP.",
            stack: ["Next.js", "TailwindCSS"],
            link: "https://baladev.in",
            github: "https://github.com/invincibleinventor/macos",
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
        id: 'finder',
        appname: 'Finder',
        icon: '/finder.png',
        maximizeable: true,
        componentname: 'apps/Finder',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        defaultsize: { width: 1000, height: 600 },
        category: 'Utilities',
        titlemenu: [
            { title: "About Finder", disabled: false },
            { title: "Quit Finder", disabled: false },
        ],
        menus: {
            File: [
                { title: "New Finder Window", actionId: "new-window", disabled: false },
                { title: "New Folder", actionId: "new-folder", disabled: false },
                { title: "New Tab", actionId: "new-tab", disabled: false },
                { separator: true },
                { title: "Open", actionId: "open", disabled: false },
                { title: "Close Window", actionId: "close-window", disabled: false },
                { separator: true },
                { title: "Move to Trash", actionId: "move-to-trash", disabled: false },
                { separator: true },
                { title: "Get Info", actionId: "get-info", disabled: false },
                { title: "Rename", actionId: "rename", disabled: false },
            ],
            Edit: [
                { title: "Undo", actionId: "undo", disabled: true },
                { title: "Redo", actionId: "redo", disabled: true },
                { separator: true },
                { title: "Cut", actionId: "cut", disabled: false },
                { title: "Copy", actionId: "copy", disabled: false },
                { title: "Paste", actionId: "paste", disabled: false },
                { title: "Select All", actionId: "select-all", disabled: false }
            ],
            View: [
                { title: "As Icons", actionId: "view-icons", disabled: false },
                { title: "As List", actionId: "view-list", disabled: false },
                { separator: true },
                { title: "Toggle Sidebar", actionId: "toggle-sidebar", disabled: false },
                { title: "Toggle Preview", actionId: "toggle-preview", disabled: false }
            ],
            Go: [
                { title: "Back", actionId: "go-back", disabled: false },
                { title: "Forward", actionId: "go-forward", disabled: false },
                { title: "Enclosing Folder", actionId: "go-up", disabled: false },
                { separator: true },
                { title: "Desktop", actionId: "go-desktop", disabled: false },
                { title: "Documents", actionId: "go-documents", disabled: false },
                { title: "Downloads", actionId: "go-downloads", disabled: false }
            ],

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
        category: 'Utilities'
    },
    {
        id: 'python',
        appname: 'Python IDE',
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
        componentname: 'Mail',
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
        icon: '/notes.png',
        multiwindow: true,
        acceptedMimeTypes: ['text/plain', 'text/markdown', 'text/x-uri', 'application/json'],
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        additionaldata: { startlarge: false },
        category: 'Productivity',
        menus: {
            File: [
                { title: "New", actionId: "new-file", disabled: false },
                { title: "Open...", actionId: "open", disabled: false },
                { separator: true },
                { title: "Save", actionId: "save", disabled: false },
                { title: "Rename...", actionId: "rename", disabled: true },
                { separator: true },
                { title: "Print...", actionId: "print", disabled: true },
                { title: "Close Window", actionId: "close-window", disabled: false }
            ],
            Edit: [
                { title: "Undo", actionId: "undo", disabled: false },
                { title: "Redo", actionId: "redo", disabled: false },
                { separator: true },
                { title: "Cut", actionId: "cut", disabled: false },
                { title: "Copy", actionId: "copy", disabled: false },
                { title: "Paste", actionId: "paste", disabled: false },
                { title: "Delete", actionId: "delete", disabled: false },
                { separator: true },
                { title: "Select All", actionId: "select-all", disabled: false },
                { separator: true },
                { title: "Find", actionId: "find", disabled: false }
            ],
            Format: [
                { title: "Font", disabled: false, actionId: "font-menu" },
                { title: "Bold", actionId: "format-bold", disabled: false },
                { title: "Italic", actionId: "format-italic", disabled: false },
                { title: "Underline", actionId: "format-underline", disabled: false },
                { separator: true },
                { title: "Align Left", actionId: "align-left", disabled: false },
                { title: "Center", actionId: "align-center", disabled: false },
                { title: "Align Right", actionId: "align-right", disabled: false }
            ],
            View: [
                { title: "Zoom In", actionId: "zoom-in", disabled: true },
                { title: "Zoom Out", actionId: "zoom-out", disabled: true }
            ],
            Window: [
                { title: "Minimize", actionId: "minimize", disabled: false },
                { title: "Zoom", actionId: "zoom", disabled: false }
            ]
        }
    },
    {
        id: 'calculator',
        appname: 'Calculator',
        icon: '/calculator.png',
        maximizeable: true,
        componentname: 'Calculator',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 300, height: 500 },
        category: 'Utilities',
        menus: {
            View: [
                { title: "Basic", actionId: "view-basic", disabled: false },
                { title: "Scientific", actionId: "view-scientific", disabled: true },
                { title: "Programmer", actionId: "view-programmer", disabled: true }
            ],
            Window: [
                { title: "Minimize", actionId: "minimize", disabled: false }
            ]
        }
    },
    {
        id: 'appstore',
        appname: 'App Store',
        icon: '/appstore.png',
        maximizeable: false,
        componentname: 'AppStore',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        category: 'Creativity',
        menus: {
            Store: [
                { title: "Reload", actionId: "reload", disabled: false },
                { separator: true },
                { title: "Search", actionId: "search", disabled: false }
            ]
        }
    },
    {
        id: 'safari',
        appname: 'Safari',
        icon: '/safari.png',
        maximizeable: true,
        componentname: 'apps/Safari',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: true,
        pinned: true,
        acceptedMimeTypes: ['text/x-uri'],
        category: 'Productivity',
        menus: {
            File: [
                { title: "New Window", actionId: "new-window", disabled: false },
                { title: "New Tab", actionId: "new-tab", disabled: false },
                { title: "Open Location...", actionId: "open-location", disabled: false },
                { separator: true },
                { title: "Close Tab", actionId: "close-tab", disabled: false },
                { title: "Close Window", actionId: "close-window", disabled: false }
            ],
            Edit: [
                { title: "Undo", actionId: "undo", disabled: true },
                { title: "Redo", actionId: "redo", disabled: true },
                { separator: true },
                { title: "Cut", actionId: "cut", disabled: false },
                { title: "Copy", actionId: "copy", disabled: false },
                { title: "Paste", actionId: "paste", disabled: false },
                { title: "Select All", actionId: "select-all", disabled: false }
            ],
            View: [
                { title: "Reload Page", actionId: "reload", disabled: false },
                { separator: true },
                { title: "Zoom In", actionId: "zoom-in", disabled: false },
                { title: "Zoom Out", actionId: "zoom-out", disabled: false }
            ],
            History: [
                { title: "Back", actionId: "go-back", disabled: false },
                { title: "Forward", actionId: "go-forward", disabled: false }
            ],
            Window: [
                { title: "Minimize", actionId: "minimize", disabled: false },
                { title: "Zoom", actionId: "zoom", disabled: false }
            ]
        }
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
        menus: {
            Shell: [
                { title: "New Window", actionId: "new-window", disabled: false },
                { title: "New Tab", actionId: "new-tab", disabled: false },
                { separator: true },
                { title: "Close Window", actionId: "close-window", disabled: false }
            ],
            Edit: [
                { title: "Copy", actionId: "copy", disabled: false },
                { title: "Paste", actionId: "paste", disabled: false },
                { title: "Select All", actionId: "select-all", disabled: false },
                { separator: true },
                { title: "Clear Screen", actionId: "clear", disabled: false }
            ],
            View: [
                { title: "Zoom In", actionId: "zoom-in", disabled: false },
                { title: "Zoom Out", actionId: "zoom-out", disabled: false }
            ],
            Window: [
                { title: "Minimize", actionId: "minimize", disabled: false },
                { title: "Zoom", actionId: "zoom", disabled: false }
            ]
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
        category: 'Creativity'
    },
    {
        id: 'welcome',
        appname: 'Welcome',
        icon: '/info.png',
        maximizeable: false,
        componentname: 'Welcome',
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
        icon: '/finder.png',
        maximizeable: false,
        componentname: 'apps/FileInfo',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 300, height: 450 }
    }
];

export const menus = [
    {
        appname: "Finder",
        menus: {
            File: [
                { title: "New Finder Window", actionId: "new-window", disabled: false },
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
        title: "Finder",
        menu: [
            { title: "About Finder", disabled: false },
            { title: "Quit Finder", disabled: false },
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

export const applemenu = [
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
            { name: 'Projects', icon: IoFolderOutline, path: ['Macintosh HD', 'Users', 'Bala', 'Projects'] },
            { name: 'Applications', icon: IoAppsOutline, path: ['Macintosh HD', 'Applications'] },
            { name: 'About Me', icon: IoDocumentTextOutline, path: ['Macintosh HD', 'Users', 'Bala', 'About Me'] },
            { name: 'Desktop', icon: IoAppsOutline, path: ['Macintosh HD', 'Users', 'Bala', 'Desktop'] },
            { name: 'Documents', icon: IoDocumentTextOutline, path: ['Macintosh HD', 'Users', 'Bala', 'Documents'] },
            { name: 'Downloads', icon: IoAppsOutline, path: ['Macintosh HD', 'Users', 'Bala', 'Downloads'] },
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
            { name: 'Macintosh HD', icon: IoAppsOutline, path: ['Macintosh HD'] },
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
                <p>Welcome to <strong>MacOS-Next</strong>! I built this &quot;Portfolio OS&quot; to demonstrate the power of modern web technologies.</p>
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
                    <a href={proj.link || '#'} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-[#007AFF] text-center line-clamp-2 mx-auto text-white rounded-md text-xs font-semibold hover:bg-[#0062cc] transition shadow-sm">
                        View Project
                    </a>
                </div>
            </div>
        )
    })),
];

export const getMails = (openInFinder: (path: string) => void): MailItem[] => {
    return [
        {
            id: 'about-welcome',
            folder: 'about',
            category: 'About',
            sender: 'Bala TBR',
            senderEmail: 'me@baladev.in',
            subject: 'Welcome to my Portfolio OS!',
            date: 'Just Now',
            iconType: 'icon',
            icon: IoPersonCircleOutline,
            preview: 'Thanks for stopping by. I am a Second-year Computer Science undergraduate...',
            content: (
                <div className="space-y-6 text-sm leading-relaxed text-black dark:text-white pb-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] p-8 text-white shadow-lg">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl overflow-hidden shrink-0">
                                <Image src="/pfp.png" width={96} height={96} priority className="w-full h-full object-cover" alt="Bala TBR" />
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl font-bold mb-2 tracking-tight">Bala TBR</h1>
                                <p className="text-white/80 font-medium text-lg">Full Stack Developer & UI/UX Design Enthusiast</p>
                                <div className="flex gap-3 justify-center md:justify-start mt-4">
                                    <a href={personal.personal.socials.github} target="_blank" rel="noreferrer" className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-md">
                                        <IoLogoGithub size={20} />
                                    </a>
                                    <a href={personal.personal.socials.linkedin} target="_blank" rel="noreferrer" className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-md">
                                        <FaLinkedin size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    </div>

                    <div className="prose dark:prose-invert max-w-none px-2">
                        <p className="text-lg font-medium leading-relaxed">
                            Welcome to <strong>MacOS-Next</strong>!
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            I built this &quot;Portfolio OS&quot; to push the boundaries of what&apos;s possible on the web. It is a fully interactive, responsive desktop environment built with <strong>Next.js</strong>, <strong>TailwindCSS</strong>, and <strong>Framer Motion</strong>.
                        </p>

                        <h3 className="text-xl font-bold mt-8 mb-4 border-b border-gray-200 dark:border-white/10 pb-2">About Me</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {personal.personal.bio}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <IoConstructOutline className="text-[#007AFF]" /> Tech Stack
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Next.js 14, TypeScript, TailwindCSS, Supabase, Framer Motion, GSAP
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <IoHeartOutline className="text-red-500" /> Focus
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Building beautiful, high-performance web applications with a focus on user experience.
                                </p>
                            </div>
                        </div>

                        <p className="mt-8 text-gray-400 text-xs text-center">
                            Feel free to explore the apps, check out my projects in the &quot;Projects&quot; folder, or read my latest thoughts in &quot;Blog&quot;.
                        </p>
                        <p className="text-center font-medium mt-2">Best,<br />Bala</p>
                    </div>
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
                        <div className="w-16 h-16 bg-white dark:bg-black rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-black/5">
                            <Image src={`/appimages/${proj.title.toLowerCase()}.png`} width={64} height={64} alt={proj.title} className="w-full h-full object-cover" />
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
                        <a href={proj.link || '#'} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-[#007AFF] text-white rounded-md text-xs font-semibold hover:bg-[#0062cc] transition shadow-sm">
                            View Project
                        </a>
                        <button
                            onClick={() => openInFinder(proj.title)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 text-black dark:text-white rounded-md text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition"
                        >
                            <IoFolderOpenOutline size={14} />
                            View in Finder
                        </button>
                    </div>
                </div>
            )
        })),
        {
            id: 'education-info',
            folder: 'education',
            category: 'Education',
            sender: 'University',
            senderEmail: 'edu@university.edu',
            subject: 'Education History',
            date: 'See Details',
            iconType: 'icon',
            icon: IoSchoolOutline,
            preview: 'Bachelor of Technology details...',
            content: (
                <div className="space-y-4 text-sm leading-relaxed text-black dark:text-white">
                    <h3 className="font-bold text-lg border-b border-gray-200 dark:border-white/10 pb-2">Education</h3>
                    <div className="space-y-4">
                        {(personal.education || []).map((edu: any, idx: number) => (
                            <div key={idx}>
                                <div className="font-semibold text-base">{edu.degree}</div>
                                <div className="text-gray-500">{edu.institution}</div>
                                <div className="text-xs text-gray-400">{edu.year}</div>
                                {edu.grade && <div className="text-xs text-gray-500 mt-1">{edu.grade}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'skills-info',
            folder: 'skills',
            category: 'Skills',
            sender: 'System',
            senderEmail: 'skills@baladev.in',
            subject: 'Technical Skills & Stack',
            date: 'Updated',
            iconType: 'icon',
            icon: IoConstructOutline,
            preview: 'Overview of technical proficiencies...',
            content: (
                <div className="space-y-4 text-sm leading-relaxed text-black dark:text-white">
                    <h3 className="font-bold text-lg border-b border-gray-200 dark:border-white/10 pb-2">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {personal.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-medium border border-black/5 dark:border-white/5">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'contact-info',
            folder: 'contact',
            category: 'Contact',
            sender: 'Bala TBR',
            senderEmail: 'me@baladev.in',
            subject: 'Contact Information & Resume',
            date: '2 days ago',
            iconType: 'icon',
            icon: IoPersonCircleOutline,
            preview: 'Here is how you can reach me...',
            content: (
                <div className="space-y-6 text-sm leading-relaxed text-black dark:text-white">
                    <p>Here are my official contact details:</p>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                        <span className="text-gray-500 text-right">Email:</span>
                        <a href={`mailto:${personal.personal.email} `} className="text-[#007AFF]">{personal.personal.email}</a>

                        <span className="text-gray-500 text-right">Location:</span>
                        <span>{personal.personal.location}</span>

                        <span className="text-gray-500 text-right">Socials:</span>
                        <div className="flex gap-2">
                            <a href={personal.personal.socials.github} className="text-[#007AFF]">GitHub</a>
                            <a href={personal.personal.socials.linkedin} className="text-[#007AFF]">LinkedIn</a>
                        </div>
                    </div>
                </div>
            )
        }
    ];
};


export const generatefilesystem = (): filesystemitem[] => {
    const fs: filesystemitem[] = [];



    const hd: filesystemitem = {
        id: 'root-hd',
        name: 'Macintosh HD',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true
    };
    fs.push(hd);

    const applications: filesystemitem = {
        id: 'root-apps',
        name: 'Applications',
        parent: 'root-hd',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,

    };
    fs.push(applications);

    const users: filesystemitem = {
        id: 'root-users',
        name: 'Users',
        parent: 'root-hd',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true
    };
    fs.push(users);

    const userHome: filesystemitem = {
        id: 'user-bala',
        name: 'Bala',
        parent: 'root-users',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,

    };
    fs.push(userHome);

    const desktop: filesystemitem = {
        id: 'user-desktop',
        name: 'Desktop',
        parent: 'user-bala',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true
    };
    fs.push(desktop);

    const documents: filesystemitem = {
        id: 'user-docs',
        name: 'Documents',
        parent: 'user-bala',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true
    };
    fs.push(documents);

    const downloads: filesystemitem = {
        id: 'user-downloads',
        name: 'Downloads',
        parent: 'user-bala',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true
    };
    fs.push(downloads);

    const projects: filesystemitem = {
        id: 'user-projects',
        name: 'Projects',
        parent: 'user-bala',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true
    };
    fs.push(projects);

    const about: filesystemitem = {
        id: 'user-about',
        name: 'About Me',
        parent: 'user-bala',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true
    };
    fs.push(about);


    const icloud: filesystemitem = {
        id: 'root-icloud',
        name: 'iCloud Drive',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: true
    };
    fs.push(icloud);

    const network: filesystemitem = {
        id: 'root-network',
        name: 'Network',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true
    };
    fs.push(network);

    const trash: filesystemitem = {
        id: 'root-trash',
        name: 'Trash',
        parent: 'root',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isTrash: true
    };
    fs.push(trash);


    personal.projects.forEach(p => {
        const pid = `project-${p.title}`;

        fs.push({
            id: pid,
            name: p.title,
            parent: 'user-projects',
            mimetype: 'inode/directory',
            date: 'Today',
            size: '--',
            description: p.desc,
            isSystem: true,
            isReadOnly: true,
            projectPath: p.title,
            projectLink: p.link
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
            isReadOnly: true
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
            isReadOnly: true
        });

        const projectPhotoBase: Partial<filesystemitem> = {
            name: `${p.title}.png`,
            mimetype: 'image/png',
            date: 'Today',
            icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src={`/appimages/${p.title.toLowerCase()}.png`} alt={`${p.title} live demo`} width={64} height={64} />,
            size: '2.5 MB',
            description: p.desc,
            link: `/appimages/${p.title.toLowerCase()}.png`,
            content: `/appimages/${p.title.toLowerCase()}.png`,
            projectPath: p.title,
            projectLink: p.link,
            isReadOnly: true
        };

        fs.push({ ...projectPhotoBase, id: `${pid}-photo`, parent: pid } as filesystemitem);
        fs.push({ ...projectPhotoBase, id: `${pid}-photo-icloud`, parent: 'root-icloud' } as filesystemitem);

        fs.push({
            id: `${pid}-readme`,
            name: 'README.md',
            parent: pid,
            mimetype: 'text/markdown',
            date: 'Today',
            size: '1 KB',
            description: `Read more about ${p.title}.`,
            content: `# ${p.title}\n\n**Type:** ${p.type}\n\n**Date:** ${p.date}\n\n**Stack:** ${p.stack.join(', ')}\n\n## Description\n\n${p.desc}\n\nCheck out the [Live Demo](${p.link}) or view the [Source Code](${p.github}).`,
            isReadOnly: true
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
        description: "My Resume"
    };

    fs.push({ ...resumeBase, id: 'root-resume', parent: 'user-docs' } as filesystemitem);

    apps.forEach(a => {
        const appBase: Partial<filesystemitem> = {
            name: a.appname,
            mimetype: 'application/x-executable',
            date: 'Today',
            size: 'App',
            icon: a.icon,
            appname: a.appname,
            description: `Launch ${a.appname} application.`,
            isSystem: true
        };

        if (a.id !== 'finder') {
            fs.push({ ...appBase, id: `app - ${a.id} `, parent: 'root-apps' } as filesystemitem);
        }

        if (a.id !== 'finder' && a.id !== 'launchpad') {

            fs.push({ ...appBase, id: `desktop-app-${a.id}`, parent: 'user-desktop' } as filesystemitem);
        }
    });


    fs.push({ ...resumeBase, id: 'desktop-resume', parent: 'user-desktop' } as filesystemitem);

    const socialLinks = [
        { id: 'about-github', name: 'Github', link: personal.personal.socials.github, icon: <FaGithub className="w-full h-full text-gray-700 dark:text-gray-300" />, desc: "My Github Profile", color: 'text-gray-700 dark:text-gray-300' },
        { id: 'about-linkedin', name: 'LinkedIn', link: personal.personal.socials.linkedin, icon: <FaLinkedin className="w-full h-full text-[#0077b5]" />, desc: "My LinkedIn Profile", color: 'text-[#0077b5]' },
        { id: 'about-threads', name: 'Threads', link: personal.personal.socials.threads, icon: <PiThreadsLogo className="w-full h-full text-black dark:text-white" />, desc: "My Threads Profile", color: 'text-black dark:text-white' }
    ];

    socialLinks.forEach(s => {
        fs.push({
            id: s.id,
            name: s.name,
            parent: 'user-about',
            mimetype: 'text/x-uri',
            date: 'Today',
            size: 'Web Link',
            link: s.link,
            icon: s.icon,
            description: s.desc
        });
    });

    const oldPortfolioBase: Partial<filesystemitem> = {
        name: 'Old Portfolio',
        mimetype: 'text/x-uri',
        date: 'Today',
        size: 'Web Link',
        link: 'https://baladev.vercel.app',
        icon: '/code.png', // Changing to string path to avoid React Element issue in data object if unused or ensuring valid element
        description: "My previous portfolio."
    };
    fs.push({ ...oldPortfolioBase, id: 'desktop-oldportfolio', parent: 'user-desktop', icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full object-contain' src='/code.png' alt="Old Portfolio" width={64} height={64} /> } as filesystemitem);


    const shortcuts: filesystemitem[] = [
        {
            id: 'shortcut-macos-next',
            name: 'MacOS-Next',
            parent: 'user-desktop',
            mimetype: 'inode/shortcut',
            date: 'Today',
            size: '4 KB',
            linkPath: 'project-MacOS-Next',
            isSystem: false,
            icon: <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />
        }
    ];
    fs.push(...shortcuts);

    return fs;
};

export const filesystem = generatefilesystem();

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
        appId: 'finder',
        icon: <Image src="/folder.png" alt="folder" width={64} height={64} className="w-full h-full object-contain drop-shadow-md" />,
    },
    'inode/shortcut': {
        appId: 'finder',
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
        appId: 'safari',
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

export const getFileIcon = (mimetype: string, name: string, itemicon?: React.ReactNode | string) => {
    if (itemicon) {
        if (typeof itemicon === 'string') {
            if (itemicon.startsWith('/')) {
                return <Image className='w-full h-full p-[6px] sm:w-full sm:h-full object-contain' src={itemicon} alt={name} width={64} height={64} />;
            }
        }
        return itemicon;
    }
    const config = FileConfig[mimetype];
    if (config && config.icon) return config.icon;
    return <IoDocumentTextOutline className="w-full h-full text-gray-500" />;
};

const FolderPathMap: Record<string, string[]> = {
    'user-projects': ['Macintosh HD', 'Users', 'Bala', 'Projects'],
    'root-apps': ['Macintosh HD', 'Applications'],
    'root-icloud': ['iCloud Drive'],
    'user-docs': ['Macintosh HD', 'Users', 'Bala', 'Documents'],
    'user-downloads': ['Macintosh HD', 'Users', 'Bala', 'Downloads'],
    'root-network': ['Network'],
    'root-hd': ['Macintosh HD'],
    'user-desktop': ['Macintosh HD', 'Users', 'Bala', 'Desktop'],
    'user-about': ['Macintosh HD', 'Users', 'Bala', 'About Me'],
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

    if (file.parent) {
        if (file.parent === 'user-desktop' && (file.mimetype === 'inode/directory' || file.mimetype === 'inode/shortcut')) {
            return ['Macintosh HD', 'Users', 'Bala', 'Desktop', file.name];
        }
        if (ParentFolderMap[file.parent]) {
            if (file.parent === 'user-projects') {
                return ['Macintosh HD', 'Users', 'Bala', 'Projects', file.name];
            }
            return ['Macintosh HD', 'Users', 'Bala', ParentFolderMap[file.parent], file.name];
        }
        if (file.parent.startsWith('project-')) {
            const projectName = file.parent.replace('project-', '');
            return ['Macintosh HD', 'Users', 'Bala', 'Projects', projectName, file.name];
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
            return { appId: 'finder', props: { initialpath: ['Macintosh HD', 'Users', 'Bala', 'Projects', projectName] }, title: projectName };
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
        return { appId: 'finder', props: { initialpath: resolveFolderPath(file) }, title: name };
    }

    if (mimetype === 'application/x-executable') {
        const app = apps.find(a => a.appname === file.appname || a.id === file.appname?.toLowerCase());
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
            icon: itemOrId.icon || '/finder.png',
            isminimized: false,
            ismaximized: false,
            position: { top: 100, left: 100 },
            size: { width: 300, height: 450 },
            props: { item: itemOrId }
        });
        return;
    }

    const existingWins = windows.filter((w: any) => w.appname === app.appname);


    const reuseApps = ['Text Edit', 'File Viewer', 'Photos', 'Safari'];
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
