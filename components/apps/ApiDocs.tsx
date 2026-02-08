'use client';
import React, { useState } from 'react';
import { IoCodeSlash, IoBook, IoRocket, IoSearch, IoChevronForward, IoChevronDown, IoClipboard, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';
import { useDevice } from '../DeviceContext';

interface ApiItem {
    name: string;
    desc: string;
    usage: string;
    returns?: string;
}

interface ApiCategory {
    name: string;
    hook: string;
    apis: ApiItem[];
}

const apicategories: ApiCategory[] = [
    {
        name: 'Window APIs',
        hook: 'useWindows()',
        apis: [
            {
                name: 'addwindow()', desc: 'Open a new window', usage: `addwindow({
  componentname: 'apps/MyApp',
  appname: 'My App',
  icon: '/myapp.png'
})`, returns: 'void'
            },
            { name: 'removewindow(id)', desc: 'Close a window by ID', usage: `removewindow('window-123')`, returns: 'void' },
            {
                name: 'updatewindow(id, props)', desc: 'Update window properties', usage: `updatewindow('window-123', { 
  title: 'New Title',
  isminimized: false 
})`, returns: 'void'
            },
            { name: 'setactivewindow(id)', desc: 'Bring window to front', usage: `setactivewindow('window-123')`, returns: 'void' },
            { name: 'windows', desc: 'Array of all open windows', usage: `windows.map(w => w.appname)`, returns: 'Window[]' },
            { name: 'activewindow', desc: 'Current active window ID', usage: `if (activewindow === id) { ... }`, returns: 'string | null' },
        ]
    },
    {
        name: 'FileSystem APIs',
        hook: 'useFileSystem()',
        apis: [
            { name: 'files', desc: 'Array of all files', usage: `const docs = files.filter(f => f.parent === parentId)`, returns: 'FilesystemItem[]' },
            { name: 'createFile(name, parent, content)', desc: 'Create new file', usage: `await createFile('notes.txt', folderId, 'Hello')`, returns: 'Promise<void>' },
            { name: 'createFolder(name, parent)', desc: 'Create new folder', usage: `await createFolder('My Folder', parentId)`, returns: 'Promise<void>' },
            { name: 'updateFileContent(id, content)', desc: 'Update file content', usage: `await updateFileContent(fileId, 'New content')`, returns: 'Promise<void>' },
            { name: 'renameItem(id, newName)', desc: 'Rename file or folder', usage: `await renameItem(fileId, 'renamed.txt')`, returns: 'Promise<void>' },
            { name: 'deleteItem(id)', desc: 'Permanently delete', usage: `await deleteItem(fileId)`, returns: 'Promise<void>' },
            { name: 'moveToTrash(id)', desc: 'Move to trash', usage: `await moveToTrash(fileId)`, returns: 'Promise<void>' },
            { name: 'getFileById(id)', desc: 'Get file by ID', usage: `const file = getFileById('file-123')`, returns: 'FilesystemItem | undefined' },
        ]
    },
    {
        name: 'Notification APIs',
        hook: 'useNotifications()',
        apis: [
            {
                name: 'addToast(message, type)', desc: 'Show toast notification', usage: `addToast('Saved!', 'success')
addToast('Error occurred', 'error')`, returns: 'void'
            },
            {
                name: 'addnotification(notif)', desc: 'Add to notification center', usage: `addnotification({
  id: 'n1',
  appname: 'My App',
  title: 'Alert',
  description: 'Something happened',
  icon: '/myapp.png',
  time: 'now'
})`, returns: 'void'
            },
            { name: 'clearnotification(id)', desc: 'Remove notification', usage: `clearnotification('n1')`, returns: 'void' },
            { name: 'notifications', desc: 'All notifications', usage: `notifications.length`, returns: 'Notification[]' },
        ]
    },
    {
        name: 'Settings APIs',
        hook: 'useSettings()',
        apis: [
            { name: 'wallpaperurl', desc: 'Current wallpaper URL', usage: `<img src={wallpaperurl} />`, returns: 'string' },
            { name: 'setwallpaperurl(url)', desc: 'Set wallpaper', usage: `setwallpaperurl('/wallpapers/new.jpg')`, returns: 'void' },
            { name: 'accentcolor', desc: 'Current accent color', usage: `style={{ color: accentcolor }}`, returns: 'string' },
            { name: 'setaccentcolor(color)', desc: 'Set accent color', usage: `setaccentcolor('#007AFF')`, returns: 'void' },
            { name: 'reducemotion', desc: 'Reduce motion preference', usage: `if (!reducemotion) { animate() }`, returns: 'boolean' },
            { name: 'soundeffects', desc: 'Sound effects enabled', usage: `if (soundeffects) playSound('click')`, returns: 'boolean' },
        ]
    },
    {
        name: 'Auth APIs',
        hook: 'useAuth()',
        apis: [
            { name: 'user', desc: 'Current user object', usage: `const username = user?.username || 'Guest'`, returns: 'User | null' },
            { name: 'isGuest', desc: 'Is guest mode', usage: `if (isGuest) showLoginPrompt()`, returns: 'boolean' },
        ]
    },
    {
        name: 'Theme APIs',
        hook: 'useTheme()',
        apis: [
            { name: 'theme', desc: 'Current theme (dark/light)', usage: `const isDark = theme === 'dark'`, returns: 'string' },
            { name: 'setTheme(theme)', desc: 'Set theme', usage: `setTheme('dark')`, returns: 'void' },
        ]
    },
    {
        name: 'Device APIs',
        hook: 'useDevice()',
        apis: [
            { name: 'ismobile', desc: 'Is mobile device', usage: `if (ismobile) showMobileUI()`, returns: 'boolean' },
            { name: 'isdesktop', desc: 'Is desktop device', usage: `if (isdesktop) showDesktopUI()`, returns: 'boolean' },
            { name: 'osstate', desc: 'OS state (locked/unlocked)', usage: `if (osstate === 'unlocked') { ... }`, returns: 'string' },
        ]
    },
    {
        name: 'External Apps APIs',
        hook: 'useExternalApps()',
        apis: [
            { name: 'apps', desc: 'All available apps', usage: `apps.map(a => a.name)`, returns: 'ExternalApp[]' },
            { name: 'installApp(id)', desc: 'Install an app', usage: `await installApp('app-123')`, returns: 'Promise<void>' },
            { name: 'uninstallApp(id)', desc: 'Uninstall an app', usage: `await uninstallApp('app-123')`, returns: 'Promise<void>' },
            { name: 'launchApp(id)', desc: 'Launch installed app', usage: `launchApp('app-123')`, returns: 'void' },
            { name: 'addRepository(repo)', desc: 'Add GitHub repo', usage: `await addRepository('user/repo')`, returns: 'Promise<boolean>' },
        ]
    }
];

const totalapis = apicategories.reduce((sum, cat) => sum + cat.apis.length, 0);

export default function ApiDocs() {
    const { ismobile } = useDevice();
    const [search, setsearch] = useState('');
    const [expandedcat, setexpandedcat] = useState<string | null>('Window APIs');
    const [selectedapi, setselectedapi] = useState<ApiItem | null>(null);
    const [copiedtext, setcopiedtext] = useState<string | null>(null);

    const filteredcategories = search
        ? apicategories.map(cat => ({
            ...cat,
            apis: cat.apis.filter(api =>
                api.name.toLowerCase().includes(search.toLowerCase()) ||
                api.desc.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(cat => cat.apis.length > 0)
        : apicategories;

    const copytoClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setcopiedtext(text);
        setTimeout(() => setcopiedtext(null), 2000);
    };

    const sidebarContent = (
        <div className={`${ismobile ? 'w-full' : 'w-72'} border-r border-[--border-color] bg-surface overflow-y-auto shrink-0 flex flex-col`}>
            <div className="p-3">
                <div className="relative mb-4">
                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" size={14} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setsearch(e.target.value)}
                        placeholder="Search APIs..."
                        className="w-full bg-overlay pl-9 pr-3 py-2 text-sm outline-none"
                    />
                </div>

                {filteredcategories.map(cat => (
                    <div key={cat.name} className="mb-2">
                        <button
                            onClick={() => setexpandedcat(expandedcat === cat.name ? null : cat.name)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-overlay transition-colors"
                        >
                            <span className="font-medium text-sm">{cat.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[--text-muted]">{cat.apis.length}</span>
                                {expandedcat === cat.name ? <IoChevronDown size={14} /> : <IoChevronForward size={14} />}
                            </div>
                        </button>
                        {expandedcat === cat.name && (
                            <div className="ml-2 mt-1 space-y-0.5">
                                {cat.apis.map(api => (
                                    <button
                                        key={api.name}
                                        onClick={() => setselectedapi(api)}
                                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${selectedapi?.name === api.name ? 'bg-accent/10 text-accent' : 'text-[--text-muted] hover:bg-overlay'}`}
                                    >
                                        <code className="text-xs">{api.name}</code>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const mainContent = (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {!selectedapi ? (
                    <>
                        <div className="bg-pastel-purple/10 p-6 border border-accent/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-accent flex items-center justify-center">
                                    <IoBook className="text-[--text-color]" size={24} />
                                </div>
                                <div>
                                    <h1 className="font-bold text-xl text-[--text-color]">API Documentation</h1>
                                    <p className="text-sm text-[--text-muted]">{totalapis} APIs available</p>
                                </div>
                            </div>
                            <p className="text-sm text-[--text-muted]">
                                Build apps for NextarOS using these APIs. Select an API from the sidebar to see usage examples.
                            </p>
                        </div>

                        <div className="bg-pastel-yellow/10 border border-pastel-yellow/20 p-4">
                            <div className="flex items-start gap-3">
                                <IoWarning className="text-pastel-yellow shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h3 className="font-bold text-sm mb-1 text-[--text-color]">Bundling Required</h3>
                                    <p className="text-xs text-[--text-muted]">
                                        The Code Editor runs vanilla JavaScript/Python. For apps with imports, you need to bundle your code
                                        or host externally. Use the quickstart example without imports for simple apps.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface p-6 border border-[--border-color]">
                            <div className="flex items-center gap-3 mb-4">
                                <IoRocket className="text-accent" size={24} />
                                <h2 className="text-xl font-bold text-[--text-color]">Quick Start</h2>
                            </div>
                            <p className="text-sm text-[--text-muted] mb-4">
                                This example works in the Code Editor. Save as <code className="bg-overlay px-1">.js</code> and click Run:
                            </p>
                            <div className="relative">
                                <pre className="bg-overlay p-4 text-sm overflow-x-auto select-text">{`function greet(name) {
  console.log('Hello, ' + name + '!');
  console.log('Welcome to NextarOS');
  return 'Greeting sent';
}

greet('Developer');

const result = 2 + 2;
console.log('2 + 2 = ' + result);`}</pre>
                                <button
                                    onClick={() => copytoClipboard(`function greet(name) {\n  console.log('Hello, ' + name + '!');\n  console.log('Welcome to NextarOS');\n  return 'Greeting sent';\n}\n\ngreet('Developer');\n\nconst result = 2 + 2;\nconsole.log('2 + 2 = ' + result);`)}
                                    className="absolute top-2 right-2 p-2 bg-overlay hover:bg-overlay"
                                >
                                    {copiedtext ? <IoCheckmarkCircle size={16} className="text-pastel-green" /> : <IoClipboard size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-surface p-6 border border-[--border-color]">
                            <div className="flex items-center gap-3 mb-4">
                                <IoCodeSlash className="text-accent" size={24} />
                                <h2 className="text-xl font-bold text-[--text-color]">apps.json Schema</h2>
                            </div>
                            <p className="text-sm text-[--text-muted] mb-4">
                                For external apps, create an apps.json in your GitHub repo:
                            </p>
                            <pre className="bg-overlay p-4 text-sm overflow-x-auto select-text">{`{
  "apps": [{
    "id": "my-app",
    "name": "My App",
    "description": "Description",
    "icon": "🎮",
    "author": "Your Name",
    "version": "1.0.0",
    "category": "Utilities",
    "component": "MyComponent"
  }]
}`}</pre>
                        </div>
                    </>
                ) : (
                    <div className="bg-surface p-6 border border-[--border-color]">
                        <button onClick={() => setselectedapi(null)} className="text-accent text-sm mb-4 hover:underline">
                            ← Back to overview
                        </button>
                        <h2 className="text-2xl font-bold mb-2 font-mono select-text">{selectedapi.name}</h2>
                        <p className="text-[--text-muted] mb-6">{selectedapi.desc}</p>

                        {selectedapi.returns && (
                            <div className="mb-4">
                                <span className="text-xs font-semibold uppercase text-[--text-muted]">Returns</span>
                                <code className="ml-2 text-sm bg-overlay px-2 py-1 select-text">{selectedapi.returns}</code>
                            </div>
                        )}

                        <div className="mb-2">
                            <span className="text-xs font-semibold uppercase text-[--text-muted]">Usage Example</span>
                        </div>
                        <div className="relative">
                            <pre className="bg-overlay p-4 text-sm overflow-x-auto select-text whitespace-pre-wrap">{selectedapi.usage}</pre>
                            <button
                                onClick={() => copytoClipboard(selectedapi.usage)}
                                className="absolute top-2 right-2 p-2 bg-overlay hover:bg-overlay"
                            >
                                {copiedtext === selectedapi.usage ? <IoCheckmarkCircle size={16} className="text-pastel-green" /> : <IoClipboard size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (ismobile) {
        return (
            <div className="h-full flex flex-col bg-[--bg-base]">
                <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-[--border-color]">
                    <div className="w-10 h-10 bg-accent flex items-center justify-center">
                        <IoBook className="text-[--text-color]" size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">API Docs</h1>
                        <p className="text-xs text-[--text-muted]">{totalapis} APIs</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {selectedapi ? mainContent : sidebarContent}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[--bg-base]">
            <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-[--border-color]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent flex items-center justify-center">
                        <IoBook className="text-[--text-color]" size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-[--text-color]">API Documentation</h1>
                        <p className="text-xs text-[--text-muted]">{totalapis} APIs available</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {sidebarContent}
                {mainContent}
            </div>
        </div>
    );
}
