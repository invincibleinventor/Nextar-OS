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
    'apps/Python': dynamic(() => import('./apps/Python')), // kept for DynamicAppRunner compat
    'apps/FileViewer': dynamic(() => import('./apps/FileViewer')),
    'apps/Notes': dynamic(() => import('./apps/Notes')),
    'apps/Music': dynamic(() => import('./apps/Music')),
    'apps/AboutBala': dynamic(() => import('./apps/AboutBala')),
    'apps/AppStore': dynamic(() => import('./apps/AppStore')),
    'apps/BalaDev': dynamic(() => import('./apps/BalaDev')),
    'apps/Installer': dynamic(() => import('./apps/Welcome')),
    'apps/Mail': dynamic(() => import('./apps/Mail')),
    'apps/Calculator': dynamic(() => import('./apps/Calculator')),
    'apps/ExternalAppLoader': dynamic(() => import('./apps/ExternalAppLoader')),
    'apps/ApiDocs': dynamic(() => import('./apps/ApiDocs')),
    'apps/SystemMonitor': dynamic(() => import('./apps/SystemMonitor')),
    'apps/NativeFileBrowser': dynamic(() => import('./apps/NativeFileBrowser')),
    'apps/AppLauncher': dynamic(() => import('./apps/AppLauncher')),
    'apps/AboutNextarOS': dynamic(() => import('./apps/AboutNextarOS')),
    'DynamicAppRunner': dynamic(() => import('./DynamicAppRunner')),
    'apps/ProjectDashboard': dynamic(() => import('./apps/ProjectDashboard')),
    'apps/HackathonWorkspace': dynamic(() => import('./apps/HackathonWorkspace')),
    'apps/IdeaBoard': dynamic(() => import('./apps/IdeaBoard')),
    'apps/ShipChecklist': dynamic(() => import('./apps/ShipChecklist')),
};




export const personal = {
    personal: {
        name: "HackathOS",
        role: "Hackathon Operating Workspace",
        bio: "A zero-setup, offline-first, shareable project workspace for hackathon teams and startup builders. Go from idea to deploy in minutes.",
        location: "Everywhere",
        username: "hackos",
        email: "hello@hackos.dev",
        socials: {
            github: "https://github.com/hackos",
            threads: "",
            linkedin: ""
        }
    },
    education: [] as { degree: string; institution: string; year: string; grade: string }[],
    projects: [] as { title: string; date: number; type: string; desc: string; stack: string[]; link: string; github: string; icon: React.ReactNode }[],
    skills: [
        "Next.js", "React", "TypeScript", "Tailwind CSS",
        "Node.js", "Python", "Express", "Flask",
        "WebContainers", "IndexedDB", "Monaco Editor", "WASM"
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
    // Python/Code Editor removed — functionality merged into HackathonWorkspace
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
        webOnly: true
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
        id: 'nativefilebrowser',
        appname: 'Files',
        icon: '/explorer.png',
        maximizeable: true,
        componentname: 'apps/NativeFileBrowser',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 900, height: 600 },
        category: 'Utilities',
        nativeOnly: true,
        manifest: {
            permissions: {
                fs: ['fs.native', 'fs.read', 'fs.write'],
                system: ['system.host']
            }
        }
    },
    {
        id: 'applauncher',
        appname: 'Applications',
        icon: '/appstore.png',
        maximizeable: true,
        componentname: 'apps/AppLauncher',
        additionaldata: {},
        multiwindow: false,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 900, height: 600 },
        category: 'Utilities',
        nativeOnly: true,
        manifest: {
            permissions: {
                system: ['system.apps']
            }
        }
    },
    {
        id: 'abouthackathos',
        appname: 'About HackathOS',
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
        appname: 'Workspace',
        icon: '/code.png',
        maximizeable: true,
        componentname: 'apps/HackathonWorkspace',
        additionaldata: {},
        multiwindow: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 1200, height: 700 },
        category: 'Creativity',
        hidePreview: true,
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
    }
];

export function getfilteredapps(iselectron: boolean): appdata[] {
    return apps.filter(app => {
        if (iselectron) {
            return !app.webOnly;
        } else {
            return !app.nativeOnly;
        }
    });
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
            { name: 'Desktop', icon: IoDesktopOutline, path: ['System', 'Users', 'Guest', 'Desktop'] },
            { name: 'Documents', icon: IoDocumentTextOutline, path: ['System', 'Users', 'Guest', 'Documents'] },
            { name: 'Downloads', icon: IoDownloadOutline, path: ['System', 'Users', 'Guest', 'Downloads'] },
            { name: 'Projects', icon: IoFolderOutline, path: ['System', 'Users', 'Guest', 'Projects'] },
        ]
    },
    {
        title: 'Locations',
        items: [
            { name: 'Applications', icon: IoAppsOutline, path: ['System', 'Applications'] },
            { name: 'System', icon: IoAppsOutline, path: ['System'] },
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
        id: 'hackos-welcome',
        folder: 'inbox',
        category: 'System',
        sender: 'HackathOS Team',
        senderEmail: 'hello@hackos.dev',
        subject: 'Welcome to HackathOS!',
        date: 'Just Now',
        iconType: 'icon' as const,
        icon: IoRocketOutline,
        preview: 'Welcome to the Hackathon Operating Workspace. Build, ship, and demo in minutes.',
        content: (
            <div className="space-y-4 text-sm leading-relaxed text-[--text-color]">
                <p>Welcome to <strong>HackathOS</strong>!</p>
                <p>Your hackathon operating workspace is ready. Here&apos;s how to get started:</p>
                <p><strong>1.</strong> Open the <strong>Hackathon Workspace</strong> app to create a new project from a template.</p>
                <p><strong>2.</strong> Use the <strong>Idea Board</strong> to track your tasks and progress.</p>
                <p><strong>3.</strong> When you&apos;re ready, use the <strong>Ship Checklist</strong> to validate before deploying.</p>
                <p>Happy hacking!</p>
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
        isSystem: false,
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

    // Add a welcome README to Documents
    fs.push({
        id: 'guest-welcome-readme',
        name: 'Welcome.md',
        parent: 'guest-docs',
        mimetype: 'text/markdown',
        date: 'Today',
        size: '1 KB',
        content: '# Welcome to HackathOS\n\nYour hackathon operating workspace.\n\n## Getting Started\n\n1. Open **Hackathon Workspace** to create a project from a template\n2. Use the **Idea Board** to track tasks\n3. Use the **Ship Checklist** before deploying\n\nHappy hacking!',
        isReadOnly: true,
        owner: 'guest'
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

        // Allow user to delete their own desktop app shortcuts and files
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
        icon: <IoFolderOutline className="w-full h-full text-pastel-blue" />,
    },
    'inode/shortcut': {
        appId: 'explorer',
        icon: <IoFolderOutline className="w-full h-full text-pastel-lavender" />,
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
        icon: <IoDocumentTextOutline className="w-full h-full text-pastel-red" />,
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
        appId: 'fileviewer',
        icon: <IoDocumentTextOutline className="w-full h-full text-[--text-muted]" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
            type: file.mimetype
        })
    },
    'text/plain': {
        appId: 'textedit',
        icon: <IoDocumentTextOutline className="w-full h-full text-pastel-peach" />,
        getLaunchProps: (file) => ({
            id: file.id,
            content: file.content,
            title: file.name,
            type: file.mimetype
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
    return <IoDocumentTextOutline className="w-full h-full text-[--text-muted]" />;
};

const FolderPathMap: Record<string, string[]> = {
    'user-projects': ['System', 'Users', 'Guest', 'Projects'],
    'root-apps': ['System', 'Applications'],
    'user-docs': ['System', 'Users', 'Guest', 'Documents'],
    'user-downloads': ['System', 'Users', 'Guest', 'Downloads'],
    'root-network': ['Network'],
    'root-hd': ['System'],
    'user-desktop': ['System', 'Users', 'Guest', 'Desktop'],
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
            return { appId: 'explorer', props: { initialpath: ['System', 'Users', 'Projects', projectName] }, title: projectName };
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
