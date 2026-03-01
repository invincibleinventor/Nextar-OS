'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { IoCodeSlash, IoBook, IoRocket, IoSearch, IoChevronForward, IoChevronDown, IoClipboard, IoCheckmarkCircle, IoWarning, IoClose, IoDesktop, IoFileTrayFull, IoNotifications, IoSettings, IoPerson, IoColorPalette, IoPhonePortrait, IoApps } from 'react-icons/io5';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassSidebar, glassCard, glassInput } from '../hooks/useClayStyles';

interface ApiItem {
    name: string;
    desc: string;
    usage: string;
    returns?: string;
    params?: { name: string; type: string; desc: string }[];
    examples?: { lang: string; code: string }[];
}

interface ApiCategory {
    name: string;
    hook: string;
    icon: React.ReactNode;
    apis: ApiItem[];
}

const apicategories: ApiCategory[] = [
    {
        name: 'Window APIs',
        hook: 'useWindows()',
        icon: <IoDesktop size={16} />,
        apis: [
            {
                name: 'addwindow()',
                desc: 'Open a new window with the specified component and configuration.',
                usage: `addwindow({
  componentname: 'apps/MyApp',
  appname: 'My App',
  icon: '/myapp.png'
})`,
                returns: 'void',
                params: [
                    { name: 'componentname', type: 'string', desc: 'Path to the component' },
                    { name: 'appname', type: 'string', desc: 'Display name of the app' },
                    { name: 'icon', type: 'string', desc: 'Path to app icon' },
                ],
                examples: [
                    { lang: 'JavaScript', code: `const { addwindow } = useWindows();\n\naddwindow({\n  componentname: 'apps/MyApp',\n  appname: 'My App',\n  icon: '/myapp.png',\n  title: 'Custom Title'\n});` },
                    { lang: 'Python', code: `# Python equivalent (via Piston API)\n# Window APIs are JS-only in NextarOS\n# Use the Code Editor to write JS apps` },
                ]
            },
            { name: 'removewindow(id)', desc: 'Close a window by its unique ID.', usage: `removewindow('window-123')`, returns: 'void', params: [{ name: 'id', type: 'string', desc: 'Window ID to close' }] },
            {
                name: 'updatewindow(id, props)',
                desc: 'Update properties of an existing window such as title, position, or minimized state.',
                usage: `updatewindow('window-123', {
  title: 'New Title',
  isminimized: false
})`,
                returns: 'void',
                params: [
                    { name: 'id', type: 'string', desc: 'Window ID' },
                    { name: 'props', type: 'Partial<Window>', desc: 'Properties to update' },
                ]
            },
            { name: 'setactivewindow(id)', desc: 'Bring a window to the front and focus it.', usage: `setactivewindow('window-123')`, returns: 'void' },
            { name: 'windows', desc: 'Array of all open windows. Use to check state or iterate over active apps.', usage: `windows.map(w => w.appname)`, returns: 'Window[]' },
            { name: 'activewindow', desc: 'ID of the currently focused window, or null if none.', usage: `if (activewindow === id) { ... }`, returns: 'string | null' },
        ]
    },
    {
        name: 'FileSystem APIs',
        hook: 'useFileSystem()',
        icon: <IoFileTrayFull size={16} />,
        apis: [
            { name: 'files', desc: 'Array of all files in the virtual filesystem.', usage: `const docs = files.filter(f => f.parent === parentId)`, returns: 'FilesystemItem[]' },
            { name: 'createFile(name, parent, content)', desc: 'Create a new file with content in the specified parent folder.', usage: `await createFile('notes.txt', folderId, 'Hello')`, returns: 'Promise<void>', params: [{ name: 'name', type: 'string', desc: 'Filename' }, { name: 'parent', type: 'string', desc: 'Parent folder ID' }, { name: 'content', type: 'string', desc: 'File content' }] },
            { name: 'createFolder(name, parent)', desc: 'Create a new folder inside the specified parent.', usage: `await createFolder('My Folder', parentId)`, returns: 'Promise<void>' },
            { name: 'updateFileContent(id, content)', desc: 'Update the content of an existing file.', usage: `await updateFileContent(fileId, 'New content')`, returns: 'Promise<void>' },
            { name: 'renameItem(id, newName)', desc: 'Rename a file or folder.', usage: `await renameItem(fileId, 'renamed.txt')`, returns: 'Promise<void>' },
            { name: 'deleteItem(id)', desc: 'Permanently delete a file or folder.', usage: `await deleteItem(fileId)`, returns: 'Promise<void>' },
            { name: 'moveToTrash(id)', desc: 'Soft-delete by moving to trash.', usage: `await moveToTrash(fileId)`, returns: 'Promise<void>' },
            { name: 'getFileById(id)', desc: 'Look up a file by its unique ID.', usage: `const file = getFileById('file-123')`, returns: 'FilesystemItem | undefined' },
        ]
    },
    {
        name: 'Notification APIs',
        hook: 'useNotifications()',
        icon: <IoNotifications size={16} />,
        apis: [
            {
                name: 'addToast(message, type)',
                desc: 'Show a brief toast notification at the top of the screen.',
                usage: `addToast('Saved!', 'success')\naddToast('Error occurred', 'error')`,
                returns: 'void',
                params: [{ name: 'message', type: 'string', desc: 'Toast message' }, { name: 'type', type: "'success' | 'error' | 'info'", desc: 'Notification type' }],
                examples: [
                    { lang: 'JavaScript', code: `const { addToast } = useNotifications();\n\naddToast('File saved successfully!', 'success');\naddToast('Something went wrong', 'error');\naddToast('Processing...', 'info');` },
                ]
            },
            {
                name: 'addnotification(notif)',
                desc: 'Add a persistent notification to the notification center.',
                usage: `addnotification({
  id: 'n1',
  appname: 'My App',
  title: 'Alert',
  description: 'Something happened',
  icon: '/myapp.png',
  time: 'now'
})`,
                returns: 'void'
            },
            { name: 'clearnotification(id)', desc: 'Remove a notification from the notification center.', usage: `clearnotification('n1')`, returns: 'void' },
            { name: 'notifications', desc: 'Array of all current notifications.', usage: `notifications.length`, returns: 'Notification[]' },
        ]
    },
    {
        name: 'Settings APIs',
        hook: 'useSettings()',
        icon: <IoSettings size={16} />,
        apis: [
            { name: 'wallpaperurl', desc: 'URL of the current wallpaper.', usage: `<img src={wallpaperurl} />`, returns: 'string' },
            { name: 'setwallpaperurl(url)', desc: 'Change the desktop wallpaper.', usage: `setwallpaperurl('/wallpapers/new.jpg')`, returns: 'void' },
            { name: 'accentcolor', desc: 'Current accent color hex value.', usage: `style={{ color: accentcolor }}`, returns: 'string' },
            { name: 'setaccentcolor(color)', desc: 'Set the system accent color.', usage: `setaccentcolor('#007AFF')`, returns: 'void' },
            { name: 'reducemotion', desc: 'Whether reduce motion is enabled.', usage: `if (!reducemotion) { animate() }`, returns: 'boolean' },
            { name: 'soundeffects', desc: 'Whether sound effects are enabled.', usage: `if (soundeffects) playSound('click')`, returns: 'boolean' },
        ]
    },
    {
        name: 'Auth APIs',
        hook: 'useAuth()',
        icon: <IoPerson size={16} />,
        apis: [
            { name: 'user', desc: 'Current user object with username, avatar, etc.', usage: `const username = user?.username || 'Guest'`, returns: 'User | null' },
            { name: 'isGuest', desc: 'Whether the current session is a guest.', usage: `if (isGuest) showLoginPrompt()`, returns: 'boolean' },
        ]
    },
    {
        name: 'Theme APIs',
        hook: 'useTheme()',
        icon: <IoColorPalette size={16} />,
        apis: [
            { name: 'theme', desc: 'Current theme mode.', usage: `const isDark = theme === 'dark'`, returns: "'dark' | 'light'" },
            { name: 'setTheme(theme)', desc: 'Switch between dark and light themes.', usage: `setTheme('dark')`, returns: 'void' },
        ]
    },
    {
        name: 'Device APIs',
        hook: 'useDevice()',
        icon: <IoPhonePortrait size={16} />,
        apis: [
            { name: 'ismobile', desc: 'Whether the viewport is mobile-sized.', usage: `if (ismobile) showMobileUI()`, returns: 'boolean' },
            { name: 'isdesktop', desc: 'Whether the viewport is desktop-sized.', usage: `if (isdesktop) showDesktopUI()`, returns: 'boolean' },
            { name: 'osstate', desc: 'Current OS state (booting, locked, unlocked).', usage: `if (osstate === 'unlocked') { ... }`, returns: 'string' },
        ]
    },
    {
        name: 'External Apps APIs',
        hook: 'useExternalApps()',
        icon: <IoApps size={16} />,
        apis: [
            { name: 'apps', desc: 'All available apps from app repositories.', usage: `apps.map(a => a.name)`, returns: 'ExternalApp[]' },
            { name: 'installApp(id)', desc: 'Install an app from the store.', usage: `await installApp('app-123')`, returns: 'Promise<void>' },
            { name: 'uninstallApp(id)', desc: 'Uninstall a previously installed app.', usage: `await uninstallApp('app-123')`, returns: 'Promise<void>' },
            { name: 'launchApp(id)', desc: 'Launch an installed external app.', usage: `launchApp('app-123')`, returns: 'void' },
            { name: 'addRepository(repo)', desc: 'Add a GitHub repository as an app source.', usage: `await addRepository('user/repo')`, returns: 'Promise<boolean>' },
        ]
    }
];

const totalapis = apicategories.reduce((sum, cat) => sum + cat.apis.length, 0);

function MethodBadge({ name, clay }: { name: string; clay: boolean }) {
    const isAsync = name.includes('await') || name.includes('Promise');
    const isProperty = !name.includes('(');
    const label = isProperty ? 'PROP' : isAsync ? 'ASYNC' : 'METHOD';

    if (clay) {
        const colorStyle = isProperty
            ? { background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)', color: 'var(--accent-color)' }
            : isAsync
            ? { background: 'color-mix(in srgb, var(--pastel-yellow) 15%, transparent)', color: 'var(--pastel-yellow)' }
            : { background: 'color-mix(in srgb, var(--pastel-green) 15%, transparent)', color: 'var(--pastel-green)' };
        return <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-[6px]" style={colorStyle}>{label}</span>;
    }

    const colorStyle = isProperty
        ? { background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)', color: 'var(--accent-color)' }
        : isAsync
        ? { background: 'color-mix(in srgb, var(--pastel-yellow) 15%, transparent)', color: 'var(--pastel-yellow)' }
        : { background: 'color-mix(in srgb, var(--pastel-green) 15%, transparent)', color: 'var(--pastel-green)' };
    return <span className="text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider" style={colorStyle}>{label}</span>;
}

function CodeTabs({ examples, usage, copiedtext, onCopy, clay }: { examples?: { lang: string; code: string }[]; usage: string; copiedtext: string | null; onCopy: (text: string) => void; clay: boolean }) {
    const tabs = examples && examples.length > 0 ? examples : [{ lang: 'JavaScript', code: usage }];
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className={`overflow-hidden ${clay ? 'rounded-[12px]' : 'border border-[--border-color]'}`}
            style={clay ? { border: '1px solid var(--glass-border)' } : undefined}>
            <div className={`flex items-center ${clay ? 'border-b border-[--text-muted]/10' : 'bg-overlay border-b border-[--border-color]'}`}
                style={clay ? { background: 'var(--bg-glass-active)' } : undefined}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab.lang}
                        onClick={() => setActiveTab(i)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${clay ? 'rounded-t-[8px]' : ''} ${activeTab === i
                            ? (clay ? 'text-[--text-color] border-b-2' : 'text-[--text-color] border-b-2 border-accent bg-[--bg-base]')
                            : 'text-[--text-muted] hover:text-[--text-color]'}`}
                        style={activeTab === i && clay ? { borderBottomColor: 'var(--accent-color)' } : undefined}
                    >
                        {tab.lang}
                    </button>
                ))}
                <div className="flex-1" />
                <button
                    onClick={() => onCopy(tabs[activeTab].code)}
                    className={`px-2 py-1 mr-1 text-[--text-muted] hover:text-[--text-color] transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                >
                    {copiedtext === tabs[activeTab].code ? <IoCheckmarkCircle size={14} className="text-pastel-green" /> : <IoClipboard size={14} />}
                </button>
            </div>
            <pre className={`p-4 text-[13px] overflow-x-auto select-text whitespace-pre-wrap font-mono text-[--text-color] ${clay ? '' : 'bg-[--bg-base]'}`}
                style={clay ? { background: 'var(--bg-glass)' } : undefined}>
                {tabs[activeTab].code}
            </pre>
        </div>
    );
}

export default function ApiDocs({ windowId }: { windowId?: string }) {
    const { ismobile } = useDevice();
    const { activewindow } = useWindows();
    const clay = useIsClay();
    const [search, setsearch] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [expandedcat, setexpandedcat] = useState<string | null>('Window APIs');
    const [selectedapi, setselectedapi] = useState<ApiItem | null>(null);
    const [selectedCat, setSelectedCat] = useState<string | null>(null);
    const [copiedtext, setcopiedtext] = useState<string | null>(null);
    const [expandedApis, setExpandedApis] = useState<Set<string>>(new Set());
    const searchInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [activeSection, setActiveSection] = useState<string>('');

    useEffect(() => {
        if (!windowId || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (selectedapi) { e.preventDefault(); setselectedapi(null); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, ismobile, activewindow, selectedapi]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                setShowSearchDropdown(true);
            }
            if (e.key === 'Escape') {
                setShowSearchDropdown(false);
                searchInputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (ismobile || selectedapi) return;
        const container = contentRef.current;
        if (!container) return;

        const handleScroll = () => {
            const sections = container.querySelectorAll('[data-section-id]');
            let current = '';
            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (rect.top - containerRect.top < 100) {
                    current = section.getAttribute('data-section-id') || '';
                }
            });
            setActiveSection(current);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [ismobile, selectedapi]);

    const filteredcategories = useMemo(() => {
        if (!search) return apicategories;
        return apicategories.map(cat => ({
            ...cat,
            apis: cat.apis.filter(api =>
                api.name.toLowerCase().includes(search.toLowerCase()) ||
                api.desc.toLowerCase().includes(search.toLowerCase()) ||
                (api.params?.some(p => p.name.toLowerCase().includes(search.toLowerCase())) ?? false)
            )
        })).filter(cat => cat.apis.length > 0);
    }, [search]);

    const searchResults = useMemo(() => {
        if (!search) return [];
        const results: { api: ApiItem; cat: string; highlight: string }[] = [];
        apicategories.forEach(cat => {
            cat.apis.forEach(api => {
                const q = search.toLowerCase();
                if (api.name.toLowerCase().includes(q) || api.desc.toLowerCase().includes(q)) {
                    const match = api.name.toLowerCase().includes(q) ? api.name : api.desc;
                    results.push({ api, cat: cat.name, highlight: match });
                }
            });
        });
        return results.slice(0, 8);
    }, [search]);

    const copytoClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setcopiedtext(text);
        setTimeout(() => setcopiedtext(null), 2000);
    }, []);

    const toggleApiExpand = useCallback((name: string) => {
        setExpandedApis(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }, []);

    const scrollToSection = useCallback((sectionId: string) => {
        const el = contentRef.current?.querySelector(`[data-section-id="${sectionId}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const activeCats = selectedCat ? filteredcategories.filter(c => c.name === selectedCat) : filteredcategories;

    const sectionIds = useMemo(() => {
        const ids: { id: string; label: string }[] = [{ id: 'quickstart', label: 'Quick Start' }];
        activeCats.forEach(cat => {
            ids.push({ id: cat.name, label: cat.name });
        });
        return ids;
    }, [activeCats]);

    const sidebarContent = (
        <div
            className={`${ismobile ? 'w-full' : 'w-56'} overflow-y-auto shrink-0 flex flex-col ${clay ? '' : 'border-r border-[--border-color] bg-surface'}`}
            style={clay ? glassSidebar : undefined}
        >
            <div className="p-3">
                {/* Search */}
                <div className={`relative mb-3 ${clay ? 'rounded-full' : ''}`}
                    style={clay ? glassInput : undefined}>
                    <IoSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-muted]" size={13} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={e => { setsearch(e.target.value); setShowSearchDropdown(!!e.target.value); }}
                        onFocus={() => { if (search) setShowSearchDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                        placeholder={ismobile ? 'Search APIs...' : '\u2318K to search...'}
                        className={`w-full pl-8 pr-3 py-1.5 text-xs outline-none text-[--text-color] placeholder-[--text-muted] ${clay ? 'bg-transparent' : 'bg-overlay'}`}
                    />
                    {search && (
                        <button onClick={() => { setsearch(''); setShowSearchDropdown(false); }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-color] ${clay ? 'active:scale-[0.97]' : ''}`}>
                            <IoClose size={12} />
                        </button>
                    )}

                    {showSearchDropdown && searchResults.length > 0 && (
                        <div className={`absolute top-full left-0 right-0 mt-1 z-20 max-h-64 overflow-auto ${clay ? 'rounded-[12px]' : 'bg-surface border border-[--border-color] shadow-lg'}`}
                            style={clay ? { ...glassCard, boxShadow: 'var(--shadow-lg)' } : undefined}>
                            {searchResults.map((r, i) => (
                                <button
                                    key={i}
                                    className={`w-full text-left px-3 py-2 transition-colors ${clay ? 'hover:bg-[--bg-glass-hover] border-b border-[--text-muted]/10 last:border-0' : 'hover:bg-overlay border-b border-[--border-color] last:border-0'}`}
                                    onMouseDown={() => {
                                        setselectedapi(r.api);
                                        setSelectedCat(r.cat);
                                        setsearch('');
                                        setShowSearchDropdown(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <MethodBadge name={r.api.returns || ''} clay={clay} />
                                        <code className="text-xs font-medium text-[--text-color]">{r.api.name}</code>
                                    </div>
                                    <div className="text-[10px] text-[--text-muted] mt-0.5 truncate">{r.cat} &middot; {r.api.desc}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* All APIs button */}
                <button
                    onClick={() => { setSelectedCat(null); setselectedapi(null); }}
                    className={`w-full text-left px-3 mb-2 transition-all ${clay ? 'py-2.5 rounded-[12px] active:scale-[0.98]' : 'py-2 text-xs font-medium'} ${
                        !selectedCat
                            ? (clay ? 'text-white' : 'text-accent')
                            : (clay ? 'text-[--text-color] hover:bg-[--bg-glass-hover]' : 'text-[--text-muted] hover:bg-overlay')
                    }`}
                    style={!selectedCat && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
                        : !selectedCat && !clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' }
                        : undefined}
                >
                    <span className={clay ? 'text-[14px] font-medium' : 'text-xs font-medium'}>All APIs</span>
                    <span className={`float-right text-[11px] ${!selectedCat && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>{totalapis}</span>
                </button>

                {/* Category list */}
                {apicategories.map(cat => {
                    const active = selectedCat === cat.name;
                    return (
                        <div key={cat.name} className="mb-1">
                            <button
                                onClick={() => { setexpandedcat(expandedcat === cat.name ? null : cat.name); setSelectedCat(cat.name); setselectedapi(null); }}
                                className={`w-full flex items-center gap-3 px-3 transition-all text-xs ${clay ? 'py-2.5 rounded-[12px] active:scale-[0.98]' : 'py-1.5 gap-2'} ${
                                    active
                                        ? (clay ? 'text-white' : 'text-accent')
                                        : (clay ? 'text-[--text-color] hover:bg-[--bg-glass-hover]' : 'text-[--text-color] hover:bg-overlay')
                                }`}
                                style={active && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
                                    : active && !clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' }
                                    : undefined}
                            >
                                <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-6 h-6 rounded-[7px]' : ''}`}
                                    style={clay ? { backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-glass-active)' } : undefined}>
                                    <span className={active && clay ? 'text-white' : 'text-[--text-muted]'}>{cat.icon}</span>
                                </div>
                                <span className={`flex-1 text-left ${clay ? 'text-[14px] font-medium' : 'font-medium'}`}>{cat.name}</span>
                                <span className={`text-[10px] ${active && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>{cat.apis.length}</span>
                                {expandedcat === cat.name ? <IoChevronDown size={12} /> : <IoChevronForward size={12} />}
                            </button>
                            {expandedcat === cat.name && (
                                <div className={`mt-0.5 space-y-0.5 ${clay ? 'ml-4 pl-2' : 'ml-6'}`}>
                                    {cat.apis.map(api => {
                                        const apiActive = selectedapi?.name === api.name;
                                        return (
                                            <button
                                                key={api.name}
                                                onClick={() => setselectedapi(api)}
                                                className={`w-full text-left px-2 py-1.5 text-[11px] transition-all ${clay ? 'rounded-[12px] active:scale-[0.98]' : ''} ${
                                                    apiActive
                                                        ? (clay ? 'bg-[--bg-glass-active] text-[--text-color] font-medium' : 'text-accent')
                                                        : (clay ? 'text-[--text-muted] hover:bg-[--bg-glass-hover]' : 'text-[--text-muted] hover:bg-overlay')
                                                }`}
                                                style={apiActive && clay ? { background: 'var(--bg-glass-active)', border: '1px solid var(--glass-border-subtle)' } : undefined}
                                            >
                                                <code>{api.name}</code>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const mainContent = (
        <div ref={contentRef} className={`flex-1 overflow-y-auto p-4 md:p-6 ${clay ? 'bg-[--bg-base]' : ''}`}>
            <div className="max-w-3xl mx-auto space-y-6">
                {selectedapi ? (
                    <div className="space-y-5">
                        <button onClick={() => setselectedapi(null)}
                            className={`text-xs flex items-center gap-1 transition-colors ${clay ? 'rounded-[12px] px-3 py-1.5 hover:bg-[--bg-glass-hover] active:scale-[0.97] text-[--text-color]' : 'text-accent hover:underline'}`}
                            style={clay ? { color: 'var(--accent-color)' } : undefined}>
                            <IoChevronForward size={10} className="rotate-180" /> Back to overview
                        </button>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <MethodBadge name={selectedapi.returns || ''} clay={clay} />
                                {selectedCat && <span className="text-[10px] text-[--text-muted]">{selectedCat}</span>}
                            </div>
                            <h2 className="text-xl font-bold font-mono select-text text-[--text-color]">{selectedapi.name}</h2>
                            <p className="text-[13px] text-[--text-muted] mt-2 leading-relaxed">{selectedapi.desc}</p>
                        </div>

                        {selectedapi.params && selectedapi.params.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold uppercase text-[--text-muted] tracking-wider mb-2">Parameters</h3>
                                <div className={`${clay ? 'rounded-[16px] overflow-hidden' : 'border border-[--border-color] divide-y divide-[--border-color]'}`}
                                    style={clay ? glassCard : undefined}>
                                    {selectedapi.params.map((p, i) => (
                                        <div key={p.name} className={`flex items-start gap-3 px-4 py-2.5 ${clay ? (i < (selectedapi.params?.length || 0) - 1 ? 'border-b border-[--text-muted]/10' : '') : ''}`}>
                                            <code className="text-xs font-medium shrink-0" style={{ color: 'var(--accent-color)' }}>{p.name}</code>
                                            <code className={`text-[10px] text-[--text-muted] px-1.5 py-0.5 shrink-0 ${clay ? 'rounded-[6px]' : ''}`}
                                                style={clay ? { background: 'var(--bg-glass-active)' } : { background: 'var(--bg-overlay)' }}>{p.type}</code>
                                            <span className="text-xs text-[--text-muted]">{p.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedapi.returns && (
                            <div>
                                <h3 className="text-xs font-semibold uppercase text-[--text-muted] tracking-wider mb-2">Returns</h3>
                                <code className={`text-[13px] px-2 py-1 select-text text-[--text-color] ${clay ? 'rounded-[8px]' : ''}`}
                                    style={clay ? { background: 'var(--bg-glass-active)' } : { background: 'var(--bg-overlay)' }}>{selectedapi.returns}</code>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xs font-semibold uppercase text-[--text-muted] tracking-wider mb-2">Example</h3>
                            <CodeTabs examples={selectedapi.examples} usage={selectedapi.usage} copiedtext={copiedtext} onCopy={copytoClipboard} clay={clay} />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Quick Start Card */}
                        <div
                            data-section-id="quickstart"
                            className={`p-6 ${clay ? 'rounded-[16px]' : 'bg-surface border border-[--border-color]'}`}
                            style={clay ? glassCard : undefined}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${clay ? 'rounded-[12px]' : ''}`}
                                    style={{ background: 'var(--accent-gradient)' }}>
                                    <IoRocket className="text-white" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[--text-color]">Quick Start</h2>
                                    <p className="text-xs text-[--text-muted]">Get up and running in 3 steps</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { step: 1, title: 'Open Code Editor', desc: 'Launch the Code Editor from the Dock or Launchpad.' },
                                    { step: 2, title: 'Create a file', desc: 'Click the New File button and save as .js for JavaScript or .py for Python.' },
                                    { step: 3, title: 'Run your code', desc: 'Click the Run button to execute. Output appears in the terminal panel below.' },
                                ].map(s => (
                                    <div key={s.step} className="flex items-start gap-3">
                                        <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold text-white shrink-0 ${clay ? 'rounded-[8px]' : ''}`}
                                            style={{ background: 'var(--accent-gradient)' }}>{s.step}</div>
                                        <div>
                                            <div className="text-[13px] font-medium text-[--text-color]">{s.title}</div>
                                            <div className="text-xs text-[--text-muted]">{s.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5">
                                <div className="text-xs font-semibold uppercase text-[--text-muted] tracking-wider mb-2">Try this example</div>
                                <CodeTabs
                                    examples={[
                                        { lang: 'JavaScript', code: `function greet(name) {\n  console.log('Hello, ' + name + '!');\n  console.log('Welcome to NextarOS');\n}\n\ngreet('Developer');\nconsole.log('2 + 2 =', 2 + 2);` },
                                        { lang: 'Python', code: `def greet(name):\n    print(f'Hello, {name}!')\n    print('Welcome to NextarOS')\n\ngreet('Developer')\nprint(f'2 + 2 = {2 + 2}')` },
                                    ]}
                                    usage=""
                                    copiedtext={copiedtext}
                                    onCopy={copytoClipboard}
                                    clay={clay}
                                />
                            </div>
                        </div>

                        {/* Warning Banner */}
                        <div className={`p-4 ${clay ? 'rounded-[12px]' : ''}`}
                            style={clay ? glassCard : { background: 'color-mix(in srgb, var(--pastel-yellow) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--pastel-yellow) 20%, transparent)' }}>
                            <div className="flex items-start gap-3">
                                <IoWarning className={`shrink-0 mt-0.5 ${clay ? 'text-[--text-muted]' : 'text-pastel-yellow'}`} size={18} />
                                <div>
                                    <h3 className="font-bold text-xs mb-1 text-[--text-color]">Bundling Required for Imports</h3>
                                    <p className="text-[11px] text-[--text-muted] leading-relaxed">
                                        The Code Editor runs vanilla code via the Piston API. For apps with imports, bundle your code or host externally.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* API Categories */}
                        {activeCats.map(cat => (
                            <div key={cat.name} data-section-id={cat.name} className="space-y-3">
                                <div className={`flex items-center gap-3 sticky top-0 py-2 z-10 ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                                    <span style={{ color: 'var(--accent-color)' }}>{cat.icon}</span>
                                    <h2 className="text-base font-bold text-[--text-color]">{cat.name}</h2>
                                    <code className={`text-[10px] text-[--text-muted] px-2 py-0.5 ${clay ? 'rounded-[6px]' : ''}`}
                                        style={clay ? { background: 'var(--bg-glass-active)' } : { background: 'var(--bg-overlay)' }}>{cat.hook}</code>
                                </div>

                                <div className="space-y-2">
                                    {cat.apis.map(api => {
                                        const isExpanded = expandedApis.has(api.name);
                                        return (
                                            <div
                                                key={api.name}
                                                className={`overflow-hidden ${clay ? 'rounded-[16px]' : 'border border-[--border-color] bg-surface'}`}
                                                style={clay ? glassCard : undefined}
                                            >
                                                <button
                                                    onClick={() => toggleApiExpand(api.name)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${clay ? 'hover:bg-[--bg-glass-hover] rounded-[16px] active:scale-[0.98]' : 'hover:bg-overlay'}`}
                                                >
                                                    <MethodBadge name={api.returns || ''} clay={clay} />
                                                    <code className="text-[13px] font-medium text-[--text-color] flex-1">{api.name}</code>
                                                    {api.returns && <code className="text-[10px] text-[--text-muted] hidden sm:block">{api.returns}</code>}
                                                    {isExpanded ? <IoChevronDown size={14} className="text-[--text-muted]" /> : <IoChevronForward size={14} className="text-[--text-muted]" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className={`px-4 pb-4 pt-1 space-y-3 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                                        <p className="text-xs text-[--text-muted] leading-relaxed">{api.desc}</p>

                                                        {api.params && api.params.length > 0 && (
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-semibold uppercase text-[--text-muted] tracking-wider">Parameters</span>
                                                                {api.params.map(p => (
                                                                    <div key={p.name} className="flex items-center gap-2 text-xs pl-2">
                                                                        <code style={{ color: 'var(--accent-color)' }}>{p.name}</code>
                                                                        <code className={`text-[10px] text-[--text-muted] px-1 ${clay ? 'rounded-[4px]' : ''}`}
                                                                            style={clay ? { background: 'var(--bg-glass-active)' } : { background: 'var(--bg-overlay)' }}>{p.type}</code>
                                                                        <span className="text-[--text-muted]">&mdash; {p.desc}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <CodeTabs examples={api.examples} usage={api.usage} copiedtext={copiedtext} onCopy={copytoClipboard} clay={clay} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Schema Card */}
                        <div
                            data-section-id="schema"
                            className={`p-6 ${clay ? 'rounded-[16px]' : 'bg-surface border border-[--border-color]'}`}
                            style={clay ? glassCard : undefined}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <IoCodeSlash size={20} style={{ color: 'var(--accent-color)' }} />
                                <h2 className="text-base font-bold text-[--text-color]">apps.json Schema</h2>
                            </div>
                            <p className="text-xs text-[--text-muted] mb-3">
                                For external apps, create an apps.json in your GitHub repo:
                            </p>
                            <CodeTabs
                                examples={[{ lang: 'JSON', code: `{\n  "apps": [{\n    "id": "my-app",\n    "name": "My App",\n    "description": "Description",\n    "icon": "\ud83c\udfae",\n    "author": "Your Name",\n    "version": "1.0.0",\n    "category": "Utilities",\n    "component": "MyComponent",\n    "hidePreview": false\n  }]\n}` }]}
                                usage=""
                                copiedtext={copiedtext}
                                onCopy={copytoClipboard}
                                clay={clay}
                            />
                            <div className={`mt-4 pt-4 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                                <h3 className="text-xs font-bold text-[--text-color] mb-2">hidePreview</h3>
                                <p className="text-xs text-[--text-muted]">
                                    <code className={`px-1.5 py-0.5 text-[11px] ${clay ? 'rounded-[4px]' : ''}`}
                                        style={clay ? { background: 'var(--bg-glass-active)', color: 'var(--accent-color)' } : { background: 'var(--bg-overlay)', color: 'var(--accent-color)' }}>boolean</code> — When set to <code className={`px-1.5 py-0.5 text-[11px] ${clay ? 'rounded-[4px]' : ''}`}
                                        style={clay ? { background: 'var(--bg-glass-active)', color: 'var(--accent-color)' } : { background: 'var(--bg-overlay)', color: 'var(--accent-color)' }}>true</code>, the app&apos;s live preview will be hidden in the Recent Apps view. Instead, the app icon and title are shown as a placeholder. Use this for apps with heavy animations or content that doesn&apos;t render well as a frozen preview. Defaults to <code className={`px-1.5 py-0.5 text-[11px] ${clay ? 'rounded-[4px]' : ''}`}
                                        style={clay ? { background: 'var(--bg-glass-active)', color: 'var(--accent-color)' } : { background: 'var(--bg-overlay)', color: 'var(--accent-color)' }}>false</code>.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    /* Right anchor nav for "On this page" */
    const anchorNav = !ismobile && !selectedapi && (
        <div
            className={`w-40 overflow-y-auto shrink-0 hidden lg:block ${clay ? '' : 'border-l border-[--border-color] bg-surface'}`}
            style={clay ? { background: 'var(--bg-glass)', borderLeft: '1px solid var(--glass-border)' } : undefined}
        >
            <div className="p-3 sticky top-0">
                <div className={`text-[10px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2 ${clay ? 'font-bold' : ''}`}>On this page</div>
                {sectionIds.map(s => {
                    const isActive = activeSection === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => scrollToSection(s.id)}
                            className={`block w-full text-left text-[11px] px-2 py-1.5 transition-colors ${clay ? 'rounded-[8px]' : ''} ${
                                isActive
                                    ? (clay ? 'bg-[--bg-glass-active] font-medium' : 'border-l-2 border-accent -ml-px')
                                    : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:text-[--text-color]')
                            }`}
                            style={isActive ? { color: 'var(--accent-color)' } : { color: 'var(--text-muted)' }}
                        >
                            {s.label}
                        </button>
                    );
                })}
                <button
                    onClick={() => scrollToSection('schema')}
                    className={`block w-full text-left text-[11px] px-2 py-1.5 transition-colors ${clay ? 'rounded-[8px]' : ''} ${
                        activeSection === 'schema'
                            ? (clay ? 'bg-[--bg-glass-active] font-medium' : 'border-l-2 border-accent -ml-px')
                            : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:text-[--text-color]')
                    }`}
                    style={activeSection === 'schema' ? { color: 'var(--accent-color)' } : { color: 'var(--text-muted)' }}
                >
                    apps.json Schema
                </button>
            </div>
        </div>
    );

    if (ismobile) {
        return (
            <div className={`h-full flex flex-col text-[--text-color] ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'bg-surface border-b border-[--border-color]'}`}>
                    <div className={`w-8 h-8 flex items-center justify-center ${clay ? 'rounded-[10px]' : ''}`}
                        style={{ background: 'var(--accent-gradient)' }}>
                        <IoBook className="text-white" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-[13px] text-[--text-color]">API Docs</h1>
                        <p className="text-[10px] text-[--text-muted]">{totalapis} APIs</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {selectedapi ? mainContent : sidebarContent}
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col text-[--text-color] ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
            <div className={`flex items-center justify-between px-4 py-3 ${clay ? 'border-b border-[--text-muted]/10' : 'bg-surface border-b border-[--border-color]'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${clay ? 'rounded-[10px]' : ''}`}
                        style={{ background: 'var(--accent-gradient)' }}>
                        <IoBook className="text-white" size={16} />
                    </div>
                    <div>
                        <h1 className="font-bold text-[13px] text-[--text-color]">API Documentation</h1>
                        <p className="text-[10px] text-[--text-muted]">{totalapis} APIs across {apicategories.length} categories</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {sidebarContent}
                {mainContent}
                {anchorNav}
            </div>
        </div>
    );
}
