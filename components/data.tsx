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
    IoDownloadOutline,
    IoImageOutline,
    IoRocketOutline
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
    nativeOnly?: boolean;
    webOnly?: boolean;
    hidePreview?: boolean;
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
    'apps/FileViewer': dynamic(() => import('./apps/FileViewer')),
    'apps/Notes': dynamic(() => import('./apps/Notes')),
    'apps/Music': dynamic(() => import('./apps/Music')),
    'apps/AppStore': dynamic(() => import('./apps/AppStore')),
    'apps/Installer': dynamic(() => import('./apps/Welcome')),
    'apps/Mail': dynamic(() => import('./apps/Mail')),
    'apps/Calculator': dynamic(() => import('./apps/Calculator')),
    'apps/ExternalAppLoader': dynamic(() => import('./apps/ExternalAppLoader')),
    'apps/ApiDocs': dynamic(() => import('./apps/ApiDocs')),
    'apps/SystemMonitor': dynamic(() => import('./apps/SystemMonitor')),
    'apps/AboutNextarOS': dynamic(() => import('./apps/AboutNextarOS')),
    'apps/Portfolio': dynamic(() => import('./Portfolio')),
    'DynamicAppRunner': dynamic(() => import('./DynamicAppRunner')),
    'apps/ProjectDashboard': dynamic(() => import('./apps/ProjectDashboard')),
    'apps/HackathonWorkspace': dynamic(() => import('./apps/HackathonWorkspace')),
    'apps/IdeaBoard': dynamic(() => import('./apps/IdeaBoard')),
    'apps/ShipChecklist': dynamic(() => import('./apps/ShipChecklist')),
    'apps/ApiPlayground': dynamic(() => import('./apps/ApiPlayground')),
    'apps/TemplatesManager': dynamic(() => import('./apps/TemplatesManager')),
    'apps/Clock': dynamic(() => import('./apps/Clock')),
    'apps/Weather': dynamic(() => import('./apps/Weather')),
    'apps/Reminders': dynamic(() => import('./apps/Reminders')),
    'apps/VideoPlayer': dynamic(() => import('./apps/VideoPlayer')),
    'apps/Paint': dynamic(() => import('./apps/Paint')),
    'apps/Contacts': dynamic(() => import('./apps/Contacts')),
};




export const personal = {
    personal: {
        name: "NextarOS",
        role: "Your Personal Cloud OS",
        bio: "A complete desktop experience in your browser. Files, apps, tools, and more — deploy on any server, access from anywhere.",
        location: "Everywhere",
        username: "nextaros",
        email: "hello@nextaros.dev",
        socials: {
            github: "https://github.com/nextaros",
            threads: "",
            linkedin: ""
        }
    },
    education: [] as { degree: string; institution: string; year: string; grade: string }[],
    projects: [] as { title: string; date: number; type: string; desc: string; stack: string[]; link: string; github: string; icon: React.ReactNode }[],
    skills: [
        "Self-Hosted", "Cloud Desktop", "Next.js", "React",
        "TypeScript", "Node.js", "Python", "Tailwind CSS",
        "WebContainers", "IndexedDB", "Monaco Editor", "WASM"
    ]
};

import { getAllApps, getFilteredPackages } from '@/packages/registry';

export const apps: appdata[] = getAllApps() as appdata[];

const _legacyApps: appdata[] = [
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
        id: 'mail',
        appname: 'Mail',
        icon: '/mail.png',
        maximizeable: true,
        componentname: 'apps/Mail',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        category: 'Social',
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
        appname: 'Installer',
        icon: '/info.png',
        maximizeable: false,
        componentname: 'apps/Installer',
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
    },
    {
        id: 'portfolio',
        appname: 'Portfolio',
        icon: '/bala.jpeg',
        maximizeable: true,
        componentname: 'apps/Portfolio',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: true,
        pinned: false,
        defaultsize: { width: 1100, height: 700 },
        category: 'Utilities',
        hidePreview: true
    },
    {
        id: 'aboutbala',
        appname: 'About Bala',
        icon: '/bala.jpeg',
        maximizeable: true,
        componentname: 'apps/AboutBala',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 900, height: 650 },
        category: 'Utilities',
        webOnly: true,
        hidePreview: true
    },
    {
        id: 'aboutnextaros',
        appname: 'Help',
        icon: '/info.png',
        maximizeable: false,
        componentname: 'apps/AboutNextarOS',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 300, height: 400 },
        category: 'Utilities'
    },
    {
        id: 'projectdashboard',
        appname: 'Projects',
        icon: '/code.png',
        maximizeable: true,
        componentname: 'apps/ProjectDashboard',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 1000, height: 650 },
        category: 'Creativity',
    },
    {
        id: 'hackathonworkspace',
        appname: 'Code Editor',
        icon: '/code.png',
        maximizeable: true,
        componentname: 'apps/HackathonWorkspace',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 1200, height: 700 },
        category: 'Developer Tools',
    },
    {
        id: 'ideaboard',
        appname: 'Idea Board',
        icon: '/notes.png',
        maximizeable: true,
        componentname: 'apps/IdeaBoard',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 900, height: 550 },
        category: 'Productivity',
    },
    {
        id: 'shipchecklist',
        appname: 'Ship Checklist',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/ShipChecklist',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 500, height: 600 },
        category: 'Productivity',
    },
    {
        id: 'apiplayground',
        appname: 'API Playground',
        icon: '/terminal.png',
        maximizeable: true,
        componentname: 'apps/ApiPlayground',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 1000, height: 600 },
        category: 'Developer Tools',
    },
    {
        id: 'templatesmanager',
        appname: 'Templates',
        icon: '/classroom.png',
        maximizeable: true,
        componentname: 'apps/TemplatesManager',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 1000, height: 650 },
        category: 'Developer Tools',
    },
    {
        id: 'clock',
        appname: 'Clock',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/Clock',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 500, height: 550 },
        category: 'Utilities',
    },
    {
        id: 'weather',
        appname: 'Weather',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/Weather',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 600, height: 650 },
        category: 'Utilities',
    },
    {
        id: 'reminders',
        appname: 'Reminders',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/Reminders',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 700, height: 550 },
        category: 'Productivity',
    },
    {
        id: 'videoplayer',
        appname: 'Video Player',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/VideoPlayer',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 800, height: 550 },
        category: 'Entertainment',
        acceptedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    },
    {
        id: 'paint',
        appname: 'Paint',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/Paint',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 900, height: 650 },
        category: 'Creativity',
    },
    {
        id: 'contacts',
        appname: 'Contacts',
        icon: '/info.png',
        maximizeable: true,
        componentname: 'apps/Contacts',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 700, height: 550 },
        category: 'Social',
    },
];

export function getfilteredapps(iselectron: boolean): appdata[] {
    return getFilteredPackages(iselectron) as appdata[];
}

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
                { title: "Projects", disabled: false },
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
    { title: "About Nextzr", disabled: false },
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
            { name: 'Desktop', icon: IoDesktopOutline, path: ['Disk Drive', 'Users', 'Guest', 'Desktop'], color: 'var(--pastel-blue)' },
            { name: 'Documents', icon: IoDocumentTextOutline, path: ['Disk Drive', 'Users', 'Guest', 'Documents'], color: 'var(--pastel-green)' },
            { name: 'Downloads', icon: IoDownloadOutline, path: ['Disk Drive', 'Users', 'Guest', 'Downloads'], color: 'var(--pastel-peach)' },
            { name: 'Projects', icon: IoFolderOutline, path: ['Disk Drive', 'Users', 'Guest', 'Projects'], color: 'var(--pastel-mauve)' },
            { name: 'Applications', icon: IoAppsOutline, path: ['Disk Drive', 'Applications'], color: 'var(--pastel-red)' },
        ]
    },
    {
        title: 'Locations',
        items: [
            { name: 'Disk Drive', icon: IoAppsOutline, path: ['Disk Drive'], color: 'var(--text-muted)' },
        ]
    },
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
        id: 'nextaros-welcome',
        folder: 'inbox',
        category: 'System',
        sender: 'NextarOS Team',
        senderEmail: 'hello@nextaros.dev',
        subject: 'Welcome to NextarOS!',
        date: 'Just Now',
        iconType: 'icon' as const,
        icon: IoRocketOutline,
        preview: 'Welcome to NextarOS. Your cloud desktop is ready.',
        content: (
            <div className="space-y-4 text-[13px] leading-relaxed text-[--text-color]">
                <p>Welcome to <strong>NextarOS</strong>!</p>
                <p>Your cloud desktop is ready. Here&apos;s how to get started:</p>
                <p><strong>1.</strong> Explore the <strong>apps</strong> — files, notes, music, browser, and much more.</p>
                <p><strong>2.</strong> Open <strong>Settings</strong> to customize your desktop, themes, and wallpaper.</p>
                <p><strong>3.</strong> Use the <strong>Code Editor</strong> for development, or try any of the built-in tools.</p>
                <p>Your cloud, your OS. Enjoy NextarOS!</p>
            </div>
        )
    },
];

export const getMails = (): MailItem[] => {
    return [];
};


export const generateSystemFilesystem = (): filesystemitem[] => {
    const fs: filesystemitem[] = [];

    fs.push({
        id: 'root-hd',
        name: 'Disk Drive',
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
        isSystem: false,
        isReadOnly: false,
        owner: 'guest'
    });

    fs.push({
        id: 'guest-videos',
        name: 'Videos',
        parent: 'user-guest',
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        isReadOnly: false,
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

    fs.push({
        id: 'guest-welcome-readme',
        name: 'Welcome.md',
        parent: 'guest-docs',
        mimetype: 'text/markdown',
        date: 'Today',
        size: '1 KB',
        content: '# Welcome to NextarOS\n\nYour personal cloud OS.\n\n## Getting Started\n\n1. Explore the **apps** — files, notes, music, browser, and more\n2. Open **Settings** to customize your desktop and themes\n3. Use the **Code Editor** for development projects\n\nYour cloud, your OS. Enjoy NextarOS!',
        isReadOnly: true,
        owner: 'guest'
    });

    const GUEST_PROJECTS = [
        { name: 'NextarOS', desc: 'Browser-based macOS/iOS simulation with window management and installable apps', url: 'https://github.com/invincibleinventor/nextar-os', live: 'https://baladev.in', tags: ['Next.js', 'React'] },
        { name: 'SASTracker', desc: 'Question paper archive for SASTRA students with AI solutions', url: 'https://github.com/invincibleinventor/sastracker', live: 'https://sastracker.vercel.app', tags: ['React', 'Supabase'] },
        { name: 'SquadSearch', desc: 'Anonymous hiring platform verifying skills via GitHub', url: 'https://github.com/invincibleinventor/squadsearch', live: 'https://squadsearch.vercel.app', tags: ['Next.js'] },
        { name: 'Falar', desc: 'Social media platform with posts and messaging', url: 'https://github.com/invincibleinventor/falarapp', live: 'https://falarapp.vercel.app', tags: ['React'] },
        { name: 'AIButton', desc: 'Crowdsourced AI content detection for LinkedIn posts', url: 'https://github.com/invincibleinventor/aibutton', live: null, tags: ['Chrome'] },
        { name: 'CleanMyLinkedIn', desc: 'Chrome extension filtering LinkedIn engagement bait', url: 'https://github.com/invincibleinventor/cleanmylinkedin', live: null, tags: ['Chrome'] },
        { name: 'EzyPing', desc: 'Website change monitoring tool', url: 'https://github.com/invincibleinventor/ezyping', live: 'https://ezyping.vercel.app', tags: ['Python'] },
    ];

    GUEST_PROJECTS.forEach(p => {
        const slug = p.name.toLowerCase().replace(/\s+/g, '-');
        fs.push({
            id: `guest-project-${slug}`,
            name: p.name,
            parent: 'guest-projects',
            mimetype: 'inode/directory',
            date: 'Today',
            size: '--',
            isSystem: true,
            isReadOnly: true,
            owner: 'guest'
        });
        fs.push({
            id: `guest-project-${slug}-readme`,
            name: 'README.md',
            parent: `guest-project-${slug}`,
            mimetype: 'text/markdown',
            date: 'Today',
            size: '1 KB',
            content: `# ${p.name}\n\n${p.desc}\n\n## Tech Stack\n${p.tags.map(t => `- ${t}`).join('\n')}\n\n## Links\n- GitHub: ${p.url}${p.live ? `\n- Live: ${p.live}` : ''}`,
            isReadOnly: true,
            owner: 'guest'
        });
        fs.push({
            id: `guest-project-${slug}-img`,
            name: `${slug}.png`,
            parent: `guest-project-${slug}`,
            mimetype: 'image/png',
            date: 'Today',
            size: '50 KB',
            link: `/projects/${slug}.png`,
            isReadOnly: true,
            owner: 'guest'
        });
    });

    apps.forEach(a => {
        if (a.id !== 'explorer' && a.id !== 'launchpad' && !a.nativeOnly) {
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

    return fs;
};

export const generateUserFolders = (username: string): filesystemitem[] => {
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
        id: `${uid}-projects`,
        name: 'Projects',
        parent: uid,
        mimetype: 'inode/directory',
        date: 'Today',
        size: '--',
        isSystem: true,
        owner: username
    });

    fs.push({
        id: `${uid}-videos`,
        name: 'Videos',
        parent: uid,
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
        id: `${uid}-projects`,
        name: 'Projects',
        parent: uid,
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

export const generateFullFilesystemForUser = (username: string): filesystemitem[] => {
    const guestFs = generateGuestFilesystem();
    const uid = `user-${username}`;
    const displayName = username.charAt(0).toUpperCase() + username.slice(1);

    return guestFs.map(item => {
        const newItem = { ...item };

        if (newItem.id.startsWith('guest-') || newItem.id.startsWith('user-guest')) {
            newItem.id = newItem.id.replace(/^guest-/, `${uid}-`).replace(/^user-guest/, uid);
        }

        if (newItem.parent === 'user-guest') {
            newItem.parent = uid;
        } else if (newItem.parent?.startsWith('guest-')) {
            newItem.parent = newItem.parent.replace(/^guest-/, `${uid}-`);
        }

        if (newItem.name === 'Guest' && newItem.parent === 'root-users') {
            newItem.name = displayName;
        }

        if (newItem.owner === 'guest') {
            newItem.owner = username;
        }

        if (newItem.linkPath?.startsWith('guest-')) {
            newItem.linkPath = newItem.linkPath.replace(/^guest-/, `${uid}-`);
        }

        delete newItem.isReadOnly;

        if (newItem.mimetype !== 'inode/directory') {
            newItem.isSystem = false;
        }

        return newItem;
    });
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
        icon: <Image src="/icons/folder.png" alt="Folder" width={64} height={64} className="w-full h-full object-contain" />,
    },
    'inode/shortcut': {
        appId: 'explorer',
        icon: <Image src="/icons/folder.png" alt="Folder" width={64} height={64} className="w-full h-full object-contain" />,
    },
    'application/x-executable': {
        appId: 'app-launch',
        icon: <IoAppsOutline className="w-full h-full text-pastel-mauve" />,
    },
    'image/png': {
        appId: 'photos',
        icon: <IoImageOutline className="w-full h-full text-pastel-green" />,
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
        icon: <IoImageOutline className="w-full h-full text-pastel-green" />,
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
        icon: <Image src="/icons/file.png" alt="File" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            content: file.content,
            title: file.name,
            type: file.mimetype
        })
    },
    'text/x-uri': {
        appId: 'browser',
        icon: <IoGlobeOutline className="w-full h-full text-pastel-blue" />,
        getLaunchProps: (file) => ({
            initialurl: file.link || file.content
        })
    },
    'text/markdown': {
        appId: 'textedit',
        icon: <Image src="/icons/file.png" alt="File" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
        })
    },
    'text/plain': {
        appId: 'textedit',
        icon: <Image src="/icons/file.png" alt="File" width={64} height={64} className="w-full h-full object-contain" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
        })
    }
};

export const getFileIcon = (mimetype: string, name: string, itemicon?: React.ReactNode | string, fileId?: string, content?: string) => {
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
    if (mimetype.startsWith('image/') && content) {
        return <Image className="w-full h-full object-cover" src={content} alt={name} width={64} height={64} />;
    }
    const config = FileConfig[mimetype];
    if (config && config.icon) return config.icon;
    return <Image src="/icons/file.png" alt="File" width={64} height={64} className="w-full h-full object-contain" />;
};

const FolderPathMap: Record<string, string[]> = {
    'user-projects': ['Disk Drive', 'Users', 'Guest', 'Projects'],
    'root-apps': ['Disk Drive', 'Applications'],
    'user-docs': ['Disk Drive', 'Users', 'Guest', 'Documents'],
    'user-downloads': ['Disk Drive', 'Users', 'Guest', 'Downloads'],
    'root-hd': ['Disk Drive'],
    'user-desktop': ['Disk Drive', 'Users', 'Guest', 'Desktop'],
};

const ParentFolderMap: Record<string, string> = {
    'user-projects': 'Projects',
    'root-apps': 'Applications',
    'user-docs': 'Documents',
    'user-downloads': 'Downloads',
    'user-desktop': 'Desktop',
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
            return ['Disk Drive', 'Users', userHome, 'Desktop', file.name];
        }

        if (ParentFolderMap[file.parent]) {
            if (file.parent === 'user-projects' || file.parent.endsWith('-projects')) {
                return ['Disk Drive', 'Users', userHome, 'Projects', file.name];
            }
            return ['Disk Drive', 'Users', userHome, ParentFolderMap[file.parent], file.name];
        }

        if (file.parent.startsWith('project-') || file.parent.includes('-project-')) {
            let projectName = file.parent;
            if (projectName.startsWith('project-')) projectName = projectName.replace('project-', '');
            if (projectName.startsWith('guest-project-')) projectName = projectName.replace('guest-project-', '');

            return ['Disk Drive', 'Users', userHome, 'Projects', projectName, file.name];
        }
    }

    return [file.name];
};

const resolveTarget = (itemOrId: string | filesystemitem, currentFiles?: filesystemitem[], depth = 0): { appId?: string; props: any; title?: string } | null => {
    if (depth > 5) {
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
            return { appId: 'explorer', props: { initialpath: ['Disk Drive', 'Users', 'Projects', projectName] }, title: projectName };
        }

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
            appId: 'textedit',
            props: { id: file.id, content: file.content, title: file.name },
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
        props: props || {},
        multiwindow: app.multiwindow !== false ? true : false
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
