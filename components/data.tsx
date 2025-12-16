
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
    IoCodeOutline
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
}

export interface filesystemitem {
    name: string;
    parent: string | null;
    mimetype: string;
    date: string;
    size: string;
    icon?: React.ReactNode;
    link?: string;
    content?: string;
    appname?: string;
    description?: string;
    id: string;
}

export const personal = {
    personal: {
        name: "Bala TBR",
        role: "Second Year Comp Sci Student - Next.JS Full Stack Developer",
        bio: "I'm a passionate geek from India studying second year computer science engineering that loves to tinker with frontend technologies. I'm an ardent lover of Linux and FOSS principles. Self-taught web developer, specializing in Next.js and TailwindCSS. I use Arch Linux btw.",
        location: "India",
        username: "invincibleinventor",
        email: "invincibleinventor@gmail.com",
        socials: {
            github: "https://github.com/invincibleinventor",
            threads: "https://threads.com/balatbr",
            linkedin: "https://www.linkedin.com/in/balasubramaniantbr/"
        }
    },
    projects: [
        {
            title: "Falar",
            type: "Open Source",
            date: 2022,
            desc: "A content publishing platform for sharing written works publicly.",
            stack: ["Next.js", "Supabase", "TailwindCSS", "Amazon S3"],
            link: "https://falarapp.vercel.app",
            github: "https://github.com/invincibleinventor/falar",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "MacOS-Next",
            date: 2023,
            type: "Open Source",
            desc: "A simulation of macOS Sonoma UI in the web. Features dock, window management, and animations.",
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
            desc: "A matchmaking platform for teams and TLs to find and assemble their perfect squad for hackathons or internal hirings.",
            stack: ["Next.js", "Supabase", "GSAP", "TailwindCSS", "LLMs", "FastAPI", "SMTP", "Python"],
            link: "https://squadsearch.vercel.app",
            github: "https://github.com/invincibleinventor/squadsearch",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "Sastracker",
            date: 2025,
            type: "Open Source",
            desc: "A Modern PyQDB for SASTRA Students",
            stack: ["Next.JS", "Supabase", "LLMs", "TailwindCSS", "FastAPI"],
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
        defaultsize: { width: 1000, height: 600 }
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
        defaultsize: { width: 300, height: 500 }
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
    },
    {
        id: 'fileviewer',
        appname: 'File Viewer',
        icon: '/textedit.png',
        maximizeable: true,
        componentname: 'apps/FileViewer',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 600, height: 400 },
        acceptedMimeTypes: ['text/markdown', 'text/plain', 'text/x-uri', 'application/pdf']
    }
];

export const menus = [
    {
        appname: "Finder",
        menus: {
            File: [
                { title: "New Finder Window", disabled: false },
                { title: "New Folder", disabled: false },
                { title: "New Folder with Selection", disabled: true },
                { title: "New Smart Folder", disabled: false },
                { title: "New Tab", disabled: false },
                { separator: true },
                { title: "Open", disabled: false },
                { title: "Open With", disabled: false },
                { title: "Close Window", disabled: false },
                { separator: true },
                { title: "Move to Trash", disabled: false },
                { separator: true },
                { title: "Get Info", disabled: false },
                { title: "Rename", disabled: false },
                { title: "Duplicate", disabled: true }
            ],
            Edit: [
                { title: "Undo", disabled: true },
                { title: "Redo", disabled: true },
                { separator: true },
                { title: "Cut", disabled: true },
                { title: "Copy", disabled: false },
                { title: "Paste", disabled: true },
                { title: "Select All", disabled: false }
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
            Window: [
                { title: "Minimize", disabled: false },
                { title: "Zoom", disabled: true },
                { separator: true },
                { title: "Bring All to Front", disabled: true }
            ],
            Help: [
                { title: "macOS Help", disabled: false },
                { title: "About BalaTBR", disabled: false }
            ]
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
            { name: 'Projects', icon: IoFolderOutline, path: ['Projects'] },
            { name: 'Applications', icon: IoAppsOutline, path: ['Applications'] },
            { name: 'About Me', icon: IoDocumentTextOutline, path: ['About Me'] },
        ]
    },
    {
        title: 'iCloud',
        items: [
            { name: 'iCloud Drive', icon: IoFolderOutline, path: ['iCloud Drive'] },
            { name: 'Documents', icon: IoDocumentTextOutline, path: ['Documents'] },
            { name: 'Desktop', icon: IoAppsOutline, path: ['Desktop'] },
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

const generatefilesystem = (): filesystemitem[] => {
    const fs: filesystemitem[] = [];

    fs.push({ id: 'root-projects', name: 'Projects', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-apps', name: 'Applications', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-about', name: 'About Me', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-icloud', name: 'iCloud Drive', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-docs', name: 'Documents', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-desktop', name: 'Desktop', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-hd', name: 'Macintosh HD', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });
    fs.push({ id: 'root-network', name: 'Network', parent: 'root', mimetype: 'inode/directory', date: 'Today', size: '--' });

    personal.projects.forEach(p => {
        const pid = `project-${p.title}`;
        fs.push({
            id: pid,
            name: p.title,
            parent: 'root-projects',
            mimetype: 'inode/directory',
            date: 'Today',
            size: '--',
            description: p.desc
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
            description: `View source code for ${p.title} on GitHub.`
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
            description: `Open live demo of ${p.title}.`
        });

        fs.push({
            id: `${pid}-photo`,
            name: `${p.title}.png`,
            parent: pid,
            mimetype: 'image/png',
            date: 'Today',
            icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src={`/appimages/${p.title.toLowerCase()}.png`} alt={`${p.title} live demo`} width={64} height={64} />,
            size: '2.5 MB',
            description: `Screenshot of ${p.title}.`,
            link: `/appimages/${p.title.toLowerCase()}.png`,
            content: `/appimages/${p.title.toLowerCase()}.png`
        });

        fs.push({
            id: `${pid}-photo-icloud`,
            name: `${p.title}.png`,
            parent: 'root-icloud',
            mimetype: 'image/png',
            date: 'Today',
            icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src={`/appimages/${p.title.toLowerCase()}.png`} alt={`${p.title} live demo`} width={64} height={64} />,
            size: '2.5 MB',
            description: `Screenshot of ${p.title}.`,
            link: `/appimages/${p.title.toLowerCase()}.png`,
            content: `/appimages/${p.title.toLowerCase()}.png`
        });

        fs.push({
            id: `${pid}-readme`,
            name: 'README.md',
            parent: pid,
            mimetype: 'text/markdown',
            date: 'Today',
            size: '1 KB',
            description: `Read more about ${p.title}.`,
            content: `# ${p.title}\n\n**Type:** ${p.type}\n**Date:** ${p.date}\n**Stack:** ${p.stack.join(', ')}\n\n## Description\n${p.desc}\n\nCheck out the [Live Demo](${p.link}) or view the [Source Code](${p.github}).`
        });
    });

    apps.forEach(a => {
        if (a.id !== 'finder') {
            fs.push({
                id: `app-${a.id}`,
                name: a.appname,
                parent: 'root-apps',
                mimetype: 'application/x-executable',
                date: 'Today',
                size: 'App',
                icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src={a.icon} alt={`${a.appname} application`} width={64} height={64} />,
                appname: a.appname,
                description: `Launch ${a.appname} application.`
            });
        }
    });

    fs.push({
        id: 'about-resume',
        name: 'BALASUBRAMANIAN.pdf',
        parent: 'root-desktop',
        mimetype: 'application/pdf',
        date: 'Today',
        icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src='/pdf.png' alt="Welcome App" width={64} height={64} />,
        size: 'PDF',
        link: '/BALASUBRAMANIAN.pdf',
        content: '/BALASUBRAMANIAN.pdf',
        description: "My Resume"
    });

    fs.push({
        id: 'desktop-welcome',
        name: 'Welcome App',
        parent: 'root-desktop',
        mimetype: 'application/x-executable',
        date: 'Today',
        size: 'App',
        icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src='/info.png' alt="Welcome App" width={64} height={64} />,
        appname: 'Welcome',
        description: "Welcome to my portfolio."
    });

    fs.push({
        id: 'desktop-oldportfolio',
        name: 'Old Portfolio',
        parent: 'root-desktop',
        mimetype: 'text/x-uri',
        date: 'Today',
        size: 'Web Link',
        link: 'https://baladev.vercel.app',
        icon: <Image className='w-full h-full p-[6px] sm:w-full sm:h-full' src='/code.png' alt="Old Portfolio" width={64} height={64} />,
        description: "My previous portfolio."
    });

    fs.push({
        id: 'about-github',
        name: 'Github',
        parent: 'root-about',
        mimetype: 'text/x-uri',
        date: 'Today',
        size: 'Web Link',
        link: personal.personal.socials.github,
        icon: <FaGithub className="w-full h-full text-gray-700 dark:text-gray-300" />,
        description: "My Github Profile"
    });
    fs.push({
        id: 'about-linkedin',
        name: 'LinkedIn',
        parent: 'root-about',
        mimetype: 'text/x-uri',
        date: 'Today',
        size: 'Web Link',
        link: personal.personal.socials.linkedin,
        icon: <FaLinkedin className="w-full h-full text-[#0077b5]" />,
        description: "My LinkedIn Profile"
    });
    fs.push({
        id: 'about-threads',
        name: 'Threads',
        parent: 'root-about',
        mimetype: 'text/x-uri',
        date: 'Today',
        size: 'Web Link',
        link: personal.personal.socials.threads,
        icon: <PiThreadsLogo className="w-full h-full text-black dark:text-white" />,
        description: "My Threads Profile"
    });

    return fs;
};

export const filesystem = generatefilesystem();
