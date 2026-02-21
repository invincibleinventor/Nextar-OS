/**
 * NextarOS Application Package Registry
 *
 * Each app in NextarOS is structured like a Linux desktop package:
 * - Has a manifest (like .desktop files) defining metadata, permissions, and capabilities
 * - Registers itself independently in the component map
 * - Can declare dependencies, accepted MIME types, and categories
 *
 * In a traditional Linux DE, apps are separate binaries with .desktop files.
 * In NextarOS, apps share the Electron process but maintain package-level isolation
 * through this manifest system. This enables:
 * - Per-app permissions (fs access, system APIs, etc.)
 * - MIME type associations for file opening
 * - Category-based organization in Launchpad
 * - Independent app lifecycle management
 */

export interface AppManifest {
    // Package identity (like .desktop [Desktop Entry])
    id: string;
    name: string;
    comment?: string;
    icon: string;
    category: string;

    // Component binding
    component: string; // path relative to components/apps/

    // Window behavior
    multiwindow: boolean;
    maximizeable: boolean;
    titlebarblurred: boolean;
    pinned: boolean;
    defaultsize?: { width: number; height: number };
    startlarge?: boolean;

    // Capabilities
    acceptedMimeTypes?: string[];
    nativeOnly?: boolean;
    webOnly?: boolean;
    hideFromLauncher?: boolean;
    prodOnly?: boolean;

    // Permissions (like AppArmor/Flatpak sandboxing)
    permissions: {
        fs?: string[];       // fs.read, fs.write, fs.system, fs.homeOnly
        system?: string[];   // system.settings, system.theme, system.processes
        window?: string[];   // window.multiInstance, window.fullscreen
        network?: string[];  // network.http, network.websocket
        user?: string[];     // user.current, user.manage
    };

    // App menu structure
    titlemenu?: { title: string; disabled: boolean; separator?: boolean; actionId?: string }[];
    menus?: Record<string, { title?: string; disabled?: boolean; separator?: boolean; actionId?: string }[]>;

    // External app support
    isExternal?: boolean;
    externalUrl?: string;
}

/**
 * All registered app packages. In a real Linux DE, these would be read from
 * /usr/share/applications/*.desktop at runtime. Here they're compiled in.
 */
export const packages: AppManifest[] = [
    // === Core System Apps ===
    {
        id: 'explorer',
        name: 'Explorer',
        comment: 'File manager and system browser',
        icon: '/explorer.png',
        category: 'Utilities',
        component: 'apps/Explorer',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        defaultsize: { width: 1000, height: 600 },
        permissions: { fs: ['fs.read', 'fs.write', 'fs.system'], window: ['window.multiInstance'] },
        titlemenu: [
            { title: 'About Explorer', disabled: false },
            { title: 'Quit Explorer', disabled: false },
        ],
    },
    {
        id: 'settings',
        name: 'Settings',
        comment: 'System preferences and configuration',
        icon: '/settings.png',
        category: 'Utilities',
        component: 'apps/Settings',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        permissions: { system: ['system.settings', 'system.theme'], user: ['user.current'] },
    },
    {
        id: 'terminal',
        name: 'Terminal',
        comment: 'Command line interface',
        icon: '/terminal.webp',
        category: 'Utilities',
        component: 'apps/Terminal',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        permissions: { fs: ['fs.read', 'fs.write', 'fs.system'], window: ['window.multiInstance'] },
    },
    {
        id: 'systemmonitor',
        name: 'System Monitor',
        comment: 'Process and resource monitor',
        icon: '/terminal.webp',
        category: 'Utilities',
        component: 'apps/SystemMonitor',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 800, height: 500 },
        permissions: { system: ['system.settings'], user: ['user.current'] },
    },

    // === Productivity ===
    {
        id: 'browser',
        name: 'Browser',
        comment: 'Web browser',
        icon: '/browser.png',
        category: 'Productivity',
        component: 'apps/Browser',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        acceptedMimeTypes: ['text/x-uri'],
        permissions: { network: ['network.http', 'network.websocket'], window: ['window.multiInstance'] },
    },
    {
        id: 'mail',
        name: 'Mail',
        comment: 'Email client',
        icon: '/mail.png',
        category: 'Social',
        component: 'apps/Mail',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        permissions: { network: ['network.http'] },
    },
    {
        id: 'calendar',
        name: 'Calendar',
        comment: 'Calendar and scheduling',
        icon: '/calendar.png',
        category: 'Productivity',
        component: 'apps/Calendar',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        permissions: {},
    },
    {
        id: 'textedit',
        name: 'Text Edit',
        comment: 'Plain text editor',
        icon: '/textedit.png',
        category: 'Productivity',
        component: 'apps/TextEdit',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        acceptedMimeTypes: ['text/plain', 'text/markdown', 'text/x-uri', 'application/json'],
        permissions: { fs: ['fs.read', 'fs.write'] },
    },
    {
        id: 'notes',
        name: 'Notes',
        comment: 'Rich note-taking app',
        icon: '/notes.png',
        category: 'Productivity',
        component: 'apps/Notes',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        defaultsize: { width: 700, height: 500 },
        permissions: { fs: ['fs.read', 'fs.write'] },
    },
    {
        id: 'reminders',
        name: 'Reminders',
        comment: 'Task and reminder manager',
        icon: '/info.png',
        category: 'Productivity',
        component: 'apps/Reminders',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 700, height: 550 },
        permissions: {},
    },
    {
        id: 'ideaboard',
        name: 'Idea Board',
        comment: 'Brainstorming and idea management',
        icon: '/notes.png',
        category: 'Productivity',
        component: 'apps/IdeaBoard',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 900, height: 550 },
        permissions: {},
    },
    {
        id: 'shipchecklist',
        name: 'Ship Checklist',
        comment: 'Launch checklist tracker',
        icon: '/info.png',
        category: 'Productivity',
        component: 'apps/ShipChecklist',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 500, height: 600 },
        permissions: {},
    },

    // === Creativity & Entertainment ===
    {
        id: 'music',
        name: 'Music',
        comment: 'Music player',
        icon: '/music.png',
        category: 'Entertainment',
        component: 'apps/Music',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        defaultsize: { width: 900, height: 600 },
        permissions: { fs: ['fs.read'] },
    },
    {
        id: 'photos',
        name: 'Photos',
        comment: 'Image viewer and gallery',
        icon: '/photos.webp',
        category: 'Creativity',
        component: 'apps/Photos',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: true,
        pinned: true,
        acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        permissions: { fs: ['fs.read', 'fs.homeOnly'], window: ['window.multiInstance', 'window.fullscreen'] },
    },
    {
        id: 'videoplayer',
        name: 'Video Player',
        comment: 'Video playback',
        icon: '/info.png',
        category: 'Entertainment',
        component: 'apps/VideoPlayer',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 800, height: 550 },
        acceptedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        permissions: { fs: ['fs.read'] },
    },
    {
        id: 'paint',
        name: 'Paint',
        comment: 'Drawing and painting tool',
        icon: '/info.png',
        category: 'Creativity',
        component: 'apps/Paint',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 900, height: 650 },
        permissions: { fs: ['fs.read', 'fs.write'] },
    },

    // === Developer Tools ===
    {
        id: 'hackathonworkspace',
        name: 'Code Editor',
        comment: 'Code editing workspace',
        icon: '/code.png',
        category: 'Developer Tools',
        component: 'apps/HackathonWorkspace',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 1200, height: 700 },
        permissions: { fs: ['fs.read', 'fs.write'], window: ['window.multiInstance'] },
    },
    {
        id: 'python',
        name: 'Python',
        comment: 'Python REPL and runner',
        icon: '/terminal.png',
        category: 'Developer Tools',
        component: 'apps/Python',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 800, height: 550 },
        permissions: { fs: ['fs.read', 'fs.write'] },
    },
    {
        id: 'apidocs',
        name: 'API Docs',
        comment: 'API documentation browser',
        icon: '/terminal.png',
        category: 'Developer Tools',
        component: 'apps/ApiDocs',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        permissions: { network: ['network.http'] },
    },
    {
        id: 'apiplayground',
        name: 'API Playground',
        comment: 'HTTP API testing tool',
        icon: '/terminal.png',
        category: 'Developer Tools',
        component: 'apps/ApiPlayground',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 1000, height: 600 },
        permissions: { network: ['network.http', 'network.websocket'] },
    },
    {
        id: 'templatesmanager',
        name: 'Templates',
        comment: 'Project template manager',
        icon: '/classroom.png',
        category: 'Developer Tools',
        component: 'apps/TemplatesManager',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 1000, height: 650 },
        permissions: { fs: ['fs.read', 'fs.write'] },
    },
    {
        id: 'projectdashboard',
        name: 'Projects',
        comment: 'Project management dashboard',
        icon: '/code.png',
        category: 'Creativity',
        component: 'apps/ProjectDashboard',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 1000, height: 650 },
        permissions: { fs: ['fs.read'] },
    },

    // === Social ===
    {
        id: 'contacts',
        name: 'Contacts',
        comment: 'Contact management',
        icon: '/info.png',
        category: 'Social',
        component: 'apps/Contacts',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 700, height: 550 },
        permissions: {},
    },

    // === Utilities ===
    {
        id: 'calculator',
        name: 'Calculator',
        comment: 'Scientific calculator',
        icon: '/calculator.png',
        category: 'Utilities',
        component: 'apps/Calculator',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: true,
        defaultsize: { width: 300, height: 500 },
        permissions: {},
    },
    {
        id: 'clock',
        name: 'Clock',
        comment: 'World clock and alarms',
        icon: '/info.png',
        category: 'Utilities',
        component: 'apps/Clock',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 500, height: 550 },
        permissions: {},
    },
    {
        id: 'weather',
        name: 'Weather',
        comment: 'Weather forecasts',
        icon: '/info.png',
        category: 'Utilities',
        component: 'apps/Weather',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 600, height: 650 },
        permissions: { network: ['network.http'] },
    },
    {
        id: 'appstore',
        name: 'App Store',
        comment: 'Browse and install applications',
        icon: '/appstore.png',
        category: 'Creativity',
        component: 'apps/AppStore',
        multiwindow: false,
        maximizeable: false,
        titlebarblurred: false,
        pinned: true,
        permissions: { network: ['network.http'], fs: ['fs.write'] },
    },

    // === Internal / Hidden ===
    {
        id: 'welcome',
        name: 'Installer',
        comment: 'First-run setup wizard',
        icon: '/info.png',
        category: 'Utilities',
        component: 'apps/Installer',
        multiwindow: false,
        maximizeable: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 850, height: 550 },
        permissions: {},
    },
    {
        id: 'fileviewer',
        name: 'File Viewer',
        comment: 'Document preview',
        icon: '/preview.png',
        category: 'Productivity',
        component: 'apps/FileViewer',
        multiwindow: true,
        maximizeable: true,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 600, height: 400 },
        acceptedMimeTypes: ['text/markdown', 'text/plain', 'text/x-uri', 'application/pdf'],
        hideFromLauncher: true,
        permissions: { fs: ['fs.read'] },
    },
    {
        id: 'getinfo',
        name: 'Get Info',
        comment: 'File information viewer',
        icon: '/explorer.png',
        category: 'Utilities',
        component: 'apps/FileInfo',
        multiwindow: true,
        maximizeable: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 300, height: 450 },
        hideFromLauncher: true,
        permissions: { fs: ['fs.read'] },
    },
    {
        id: 'portfolio',
        name: 'Portfolio',
        comment: 'Personal portfolio showcase',
        icon: '/bala.jpeg',
        category: 'Utilities',
        component: 'apps/Portfolio',
        multiwindow: false,
        maximizeable: true,
        titlebarblurred: true,
        pinned: false,
        defaultsize: { width: 1100, height: 700 },
        prodOnly: true,
        permissions: {},
    },
    {
        id: 'aboutnextaros',
        name: 'Help',
        comment: 'About NextarOS',
        icon: '/info.png',
        category: 'Utilities',
        component: 'apps/AboutNextarOS',
        multiwindow: false,
        maximizeable: false,
        titlebarblurred: false,
        pinned: false,
        defaultsize: { width: 300, height: 400 },
        prodOnly: true,
        permissions: {},
    },
];

/**
 * Convert manifest to appdata format for backward compatibility
 * with the existing component system.
 */
export function manifestToAppData(m: AppManifest) {
    return {
        id: m.id,
        appname: m.name,
        icon: m.icon,
        maximizeable: m.maximizeable,
        componentname: m.component,
        additionaldata: m.startlarge ? { startlarge: true } : {},
        multiwindow: m.multiwindow,
        titlebarblurred: m.titlebarblurred,
        pinned: m.pinned,
        defaultsize: m.defaultsize,
        acceptedMimeTypes: m.acceptedMimeTypes,
        category: m.category,
        nativeOnly: m.nativeOnly,
        webOnly: m.webOnly,
        hidePreview: false,
        manifest: { permissions: m.permissions },
        titlemenu: m.titlemenu,
        menus: m.menus,
        isExternal: m.isExternal,
        externalUrl: m.externalUrl,
    };
}

/** Get all packages as appdata[] for the existing system */
export function getAllApps() {
    return packages.map(manifestToAppData);
}

/** Get filtered packages by platform and mode */
export function getFilteredPackages(iselectron: boolean) {
    const mode = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_NEXTAROS_MODE || 'prod' : 'prod';
    return packages
        .filter(p => iselectron ? !p.webOnly : !p.nativeOnly)
        .filter(p => !p.prodOnly || mode === 'prod')
        .map(manifestToAppData);
}

/** Find a package by ID */
export function getPackage(id: string) {
    return packages.find(p => p.id === id);
}

/** Get packages that accept a given MIME type */
export function getHandlersForMime(mime: string) {
    return packages.filter(p => p.acceptedMimeTypes?.includes(mime));
}
