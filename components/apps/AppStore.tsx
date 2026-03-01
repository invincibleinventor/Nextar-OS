'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { IoSearch, IoRocketOutline, IoGlobeOutline, IoOpenOutline, IoLogoGithub, IoCodeSlashOutline, IoServerOutline, IoPhonePortraitOutline, IoLayersOutline, IoChevronBack, IoDownloadOutline, IoTrashOutline, IoAddCircleOutline, IoRefresh, IoCheckmarkCircle, IoWarning, IoPlayCircle } from "react-icons/io5";
import Image from 'next/image';
import { personal, openSystemItem } from '../data';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useExternalApps, ExternalApp } from '../ExternalAppsContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, glassInput, glassSidebar, clayClasses } from '../hooks/useClayStyles';

export default function AppStore({ appId = 'appstore', id }: { appId?: string, id?: string }) {
    const [selectedcategory, setselectedcategory] = useState('All');
    const [selectedproject, setselectedproject] = useState<any>(null);
    const [selectedexternalapp, setselectedexternalapp] = useState<ExternalApp | null>(null);
    const [activetab, setactivetab] = useState<'apps' | 'repos'>('apps');
    const [newrepo, setnewrepo] = useState('');
    const [appsearch, setappsearch] = useState('');
    const [appcategory, setappcategory] = useState('All');
    const [isaddingwrepo, setisaddingwrepo] = useState(false);
    const { addwindow, windows, updatewindow, setactivewindow, activewindow } = useWindows();
    const { ismobile } = useDevice();
    const isActiveWindow = activewindow === id;
    const { apps: externalApps, repositories, repoStatuses, isLoading, categories, installApp, uninstallApp, addRepository, removeRepository, refreshApps, searchApps, getAppsByCategory, launchApp } = useExternalApps();
    const clay = useIsClay();

    const filteredExternalApps = useMemo(() => {
        let result = appcategory === 'All' ? externalApps : getAppsByCategory(appcategory);
        if (appsearch.trim()) {
            result = searchApps(appsearch).filter(app => appcategory === 'All' || app.category === appcategory);
        }
        return result;
    }, [externalApps, appcategory, appsearch, getAppsByCategory, searchApps]);

    const currentApp = useMemo(() => {
        if (!selectedexternalapp) return null;
        return externalApps.find(a => a.id === selectedexternalapp.id) || selectedexternalapp;
    }, [selectedexternalapp, externalApps]);

    useEffect(() => {
        if (!id) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== id) return;
            if (selectedexternalapp) { e.preventDefault(); setselectedexternalapp(null); }
            else if (selectedproject) { e.preventDefault(); setselectedproject(null); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [id, activewindow, selectedexternalapp, selectedproject]);

    const appStoreMenus = useMemo(() => ({
        Store: [
            { title: "Reload Page", actionId: "reload", shortcut: "⌘R" },
            { title: "Search", actionId: "search", shortcut: "⌘F" }
        ]
    }), []);

    const menuActions = useMemo(() => ({
        'reload': () => setselectedcategory('All'),
        'search': () => {
            const el = document.querySelector<HTMLInputElement>('input[placeholder="Search projects"]') || document.querySelector<HTMLInputElement>('input[placeholder="Search"]');
            el?.focus();
        }
    }), []);

    useMenuRegistration(appStoreMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);

    const projects = personal.projects.map((proj, i) => ({
        id: i,
        year: proj.date,
        title: proj.title,
        desc: proj.desc,
        color: proj.type === 'Open Source' ? "#007AFF" : "#34C759",
        icon: proj.icon,
        tech: proj.stack,
        type: proj.type,
    }));

    projects.sort((a, b) => b.year - a.year);

    const allcategories = ['All', ...Array.from(new Set(projects.flatMap(p => p.tech.slice(0, 2))))];

    const filteredprojects = selectedcategory === 'All'
        ? projects
        : projects.filter(p => p.tech.includes(selectedcategory));

    const categoryicons: { [key: string]: React.ReactNode } = {
        'All': <IoLayersOutline size={20} />,
        'React': <IoCodeSlashOutline size={20} />,
        'Next.js': <IoGlobeOutline size={20} />,
        'TypeScript': <IoCodeSlashOutline size={20} />,
        'Supabase': <IoServerOutline size={20} />,
        'Firebase': <IoServerOutline size={20} />,
        'TailwindCSS': <IoPhonePortraitOutline size={20} />,
    };

    if (ismobile) {
        return (
            <div className={`relative flex flex-col h-full w-full bg-[--bg-base] text-[--text-color] overflow-hidden ${clay ? '' : 'font-mono'}`}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {!selectedexternalapp ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex flex-col"
                        >
                            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                <h1 className="text-[28px] font-bold text-[--text-color]">App Store</h1>
                                <button onClick={refreshApps} className={`p-2 ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'bg-overlay'}`}
                                    style={clay ? glassButton : undefined}
                                >
                                    <IoRefresh size={18} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            <div className="px-4 flex gap-2 mb-2">
                                {(['apps', 'repos'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setactivetab(tab)}
                                        className={`flex-1 py-2 text-[14px] font-semibold capitalize transition-colors ${clay ? 'rounded-full' : ''} ${activetab === tab
                                            ? (clay ? 'text-white' : 'bg-accent text-[--text-color]')
                                            : (clay ? 'bg-[--bg-glass-hover] text-[--text-muted]' : 'bg-surface text-[--text-color]')}`}
                                        style={activetab === tab && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        {tab === 'apps' ? `Apps (${externalApps.length})` : `Repos (${repositories.length})`}
                                    </button>
                                ))}
                            </div>

                            {activetab === 'apps' && (
                                <>
                                    <div className="px-4 py-2">
                                        <div className={`relative flex items-center ${clay ? 'rounded-full' : ''}`}
                                            style={clay ? glassInput : undefined}>
                                            <IoSearch className="absolute left-3 text-[--text-muted]" />
                                            <input
                                                className={`w-full pl-10 pr-4 py-3 bg-transparent text-[15px] outline-none ${clay ? 'rounded-full' : 'bg-surface'}`}
                                                placeholder="Search apps..."
                                                value={appsearch}
                                                onChange={e => setappsearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="px-4 py-1 overflow-x-auto scrollbar-hide">
                                        <div className="flex gap-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setappcategory(cat)}
                                                    className={`px-3 py-1.5 text-[12px] font-medium whitespace-nowrap ${clay ? 'rounded-[10px]' : ''} ${appcategory === cat
                                                        ? (clay ? 'text-white' : 'bg-accent text-[--text-color]')
                                                        : (clay ? 'bg-[--bg-glass-hover] text-[--text-muted]' : 'bg-surface text-[--text-color]')}`}
                                                    style={appcategory === cat && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {isLoading ? (
                                            <div className="text-center py-10 text-[--text-muted]">
                                                <IoRefresh size={24} className="animate-spin mx-auto mb-2" />
                                                Loading...
                                            </div>
                                        ) : filteredExternalApps.length === 0 ? (
                                            <div className="text-center py-10 text-[--text-muted] text-[13px]">
                                                {appsearch ? `No apps found for "${appsearch}"` : 'No apps available'}
                                            </div>
                                        ) : (
                                            <>
                                                {filteredExternalApps.map(app => (
                                                    <div
                                                        key={app.id}
                                                        className={`p-4 active:scale-[0.98] transition-transform ${clay ? 'rounded-[16px]' : 'bg-surface'}`}
                                                        style={clay ? glassCard : undefined}
                                                        onClick={() => setselectedexternalapp(app)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-14 h-14 flex items-center justify-center text-2xl shrink-0 ${clay ? 'rounded-[12px] bg-[--bg-glass-hover]' : 'bg-overlay'}`}>
                                                                {app.icon || '📦'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <h3 className="text-[16px] font-semibold truncate text-[--text-color]">{app.name}</h3>
                                                                    {app.installed && <span className="text-[9px] px-1.5 py-0.5 bg-pastel-green/10 text-pastel-green font-semibold rounded">✓</span>}
                                                                </div>
                                                                <p className="text-[13px] text-[--text-muted] line-clamp-1">{app.description}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-[--text-muted]">{app.author}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); if (app.installed) { launchApp(app.id); } else { installApp(app.id); } }}
                                                                className={`px-4 py-2 text-[12px] font-bold shrink-0 ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''} ${app.installed
                                                                    ? (clay ? 'text-[--text-color]' : 'bg-overlay text-accent')
                                                                    : (clay ? 'text-white' : 'bg-accent text-[--text-color]')}`}
                                                                style={app.installed
                                                                    ? (clay ? glassButton : undefined)
                                                                    : (clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined)}
                                                            >
                                                                {app.installed ? 'Open' : 'Get'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {activetab === 'repos' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {repositories.map(repo => {
                                        const status = repoStatuses.find(s => s.repo === repo);
                                        return (
                                            <div key={repo} className={`p-4 ${clay ? 'rounded-[16px]' : 'bg-surface'}`} style={clay ? glassCard : undefined}>
                                                <div className="flex items-center gap-3">
                                                    {status?.status === 'success' && <IoCheckmarkCircle size={20} className="text-pastel-green" />}
                                                    {status?.status === 'error' && <IoWarning size={20} className="text-pastel-red" />}
                                                    {(!status || status?.status === 'loading') && <IoLogoGithub size={20} className="text-[--text-muted]" />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[14px] font-medium truncate text-[--text-color]">{repo}</div>
                                                        {status?.status === 'success' && <div className="text-[12px] text-[--text-muted]">{status.appCount} apps</div>}
                                                        {status?.status === 'error' && <div className="text-[12px] text-pastel-red">{status.error}</div>}
                                                    </div>
                                                    {repo !== 'invincibleinventor/nextar-apps' && (
                                                        <button onClick={() => removeRepository(repo)} className={`p-2 ${clay ? 'rounded-[10px] active:scale-[0.97]' : ''}`}>
                                                            <IoTrashOutline size={18} className="text-pastel-red" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className={`p-4 ${clay ? 'rounded-[16px]' : 'bg-surface'}`} style={clay ? glassCard : undefined}>
                                        <input
                                            type="text"
                                            value={newrepo}
                                            onChange={e => setnewrepo(e.target.value)}
                                            placeholder="username/repository"
                                            className={`w-full px-4 py-3 text-[14px] outline-none mb-3 ${clay ? 'rounded-[12px]' : 'bg-overlay'}`}
                                            style={clay ? glassInput : undefined}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!newrepo) return;
                                                setisaddingwrepo(true);
                                                const success = await addRepository(newrepo);
                                                if (success) setnewrepo('');
                                                setisaddingwrepo(false);
                                            }}
                                            disabled={isaddingwrepo || !newrepo}
                                            className={`w-full py-3 text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                        >
                                            {isaddingwrepo ? <IoRefresh className="animate-spin" /> : <IoAddCircleOutline size={18} />}
                                            {isaddingwrepo ? 'Adding...' : 'Add Repository'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`absolute inset-0 z-30 flex flex-col ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}
                        >
                            <div className={`h-14 flex items-center px-2 shrink-0 ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color]'}`}>
                                <button onClick={() => setselectedexternalapp(null)} className="flex items-center text-accent px-2">
                                    <IoChevronBack size={26} />
                                    <span className="text-[17px]">Apps</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="flex flex-col items-center mb-6">
                                    <div className={`w-24 h-24 flex items-center justify-center text-5xl mb-4 ${clay ? 'rounded-[20px] bg-[--bg-glass-hover]' : 'bg-overlay'}`}>
                                        {selectedexternalapp.icon || '📦'}
                                    </div>
                                    <h1 className="text-[22px] font-bold text-center mb-1 text-[--text-color]">{selectedexternalapp.name}</h1>
                                    <p className="text-[--text-muted] text-[14px] mb-1">by {selectedexternalapp.author}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] px-2 py-1 text-accent ${clay ? 'rounded-[8px] bg-[--bg-glass-hover]' : ''}`}
                                            style={!clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' } : undefined}
                                        >{selectedexternalapp.category}</span>
                                        <span className={`text-[11px] px-2 py-1 bg-[--bg-glass-hover] text-[--text-muted] ${clay ? 'rounded-[8px]' : ''}`}>v{selectedexternalapp.version}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mb-6">
                                    {currentApp?.installed ? (
                                        <>
                                            <button onClick={() => launchApp(selectedexternalapp.id)}
                                                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                            >
                                                <IoPlayCircle size={20} /> Open
                                            </button>
                                            <button onClick={() => uninstallApp(selectedexternalapp.id)}
                                                className={`px-5 py-3 text-pastel-red font-medium ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`}
                                                style={clay ? { ...glassButton, background: 'color-mix(in srgb, var(--pastel-red) 10%, var(--bg-glass))' } : { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' }}
                                            >
                                                <IoTrashOutline size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => installApp(selectedexternalapp.id)}
                                            className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                        >
                                            <IoDownloadOutline size={20} /> Install
                                        </button>
                                    )}
                                </div>

                                <div className={`p-4 mb-4 ${clay ? 'rounded-[16px]' : 'bg-surface'}`} style={clay ? glassCard : undefined}>
                                    <h3 className="font-bold mb-2 text-[15px] text-[--text-color]">About</h3>
                                    <p className="text-[14px] text-[--text-muted] leading-relaxed">{selectedexternalapp.description}</p>
                                </div>

                                {selectedexternalapp.tags && selectedexternalapp.tags.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-bold mb-2 text-[15px] text-[--text-color]">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedexternalapp.tags.map(tag => (
                                                <span key={tag} className={`text-[12px] px-2 py-1 bg-[--bg-glass-hover] text-[--text-muted] ${clay ? 'rounded-[8px]' : ''}`}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-[12px] text-[--text-muted] text-center">
                                    From: {selectedexternalapp.repo}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={`flex h-full w-full text-[--text-color] overflow-hidden ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'}`}>
            <div
                className={`w-[220px] shrink-0 flex-col pt-4 pb-4 px-2 hidden md:flex ${clay ? '' : 'border-r border-[--border-color] bg-surface anime-gradient-top'}`}
                style={clay ? glassSidebar : undefined}
            >
                <div className="px-4 mb-4">
                    <div className="relative">
                        <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                        <input
                            className={`w-full pl-8 pr-2 py-1.5 text-[13px] outline-none placeholder-[--text-muted] ${clay ? 'rounded-full' : 'bg-overlay'}`}
                            style={clay ? glassInput : undefined}
                            placeholder="Search"
                        />
                    </div>
                </div>

                <div className={`px-2 mb-4 flex gap-1 ${clay ? 'bg-[--bg-glass-active] rounded-full p-1' : ''}`}>
                    {(['apps', 'repos'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setactivetab(tab as any)}
                            className={`flex-1 py-1.5 text-[11px] font-semibold capitalize transition-colors ${clay ? 'rounded-full' : ''} ${activetab === tab
                                ? (clay ? 'text-white' : 'bg-accent text-[--text-color]')
                                : (clay ? 'text-[--text-muted]' : 'bg-overlay text-[--text-muted]')}`}
                            style={activetab === tab && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-0.5 flex-1 overflow-y-auto px-2">
                    {activetab === 'apps' && (
                        <>
                            <div className="px-2 mb-3">
                                <div className={`relative flex items-center ${clay ? 'rounded-full' : ''}`}
                                    style={clay ? glassInput : undefined}>
                                    <IoSearch className="absolute left-2 text-[--text-muted]" size={12} />
                                    <input
                                        type="text"
                                        value={appsearch}
                                        onChange={e => setappsearch(e.target.value)}
                                        placeholder="Search apps..."
                                        className={`w-full pl-7 pr-2 py-1.5 bg-transparent text-xs outline-none ${clay ? 'rounded-full' : 'bg-overlay'}`}
                                    />
                                </div>
                            </div>
                            <div className={`text-[10px] font-semibold text-[--text-muted] uppercase px-3 mb-1 ${clay ? 'tracking-wide' : ''}`}>Categories</div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setappcategory(cat)}
                                    className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${clay ? 'rounded-[12px] active:scale-[0.98]' : ''} ${appcategory === cat
                                        ? (clay ? 'text-white font-medium' : 'text-accent font-medium')
                                        : 'text-[--text-muted] hover:bg-[--bg-glass-hover]'}`}
                                    style={appcategory === cat && clay
                                        ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
                                        : (appcategory === cat && !clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' } : undefined)}
                                >
                                    <span className="truncate block">{cat}</span>
                                </button>
                            ))}
                            {externalApps.filter(a => a.installed).length > 0 && (
                                <>
                                    <div className={`text-[10px] font-semibold uppercase px-3 mb-1 mt-4 ${clay ? 'text-[--text-muted] tracking-wide' : 'text-pastel-green'}`}>Installed</div>
                                    {externalApps.filter(a => a.installed).map(app => (
                                        <div key={app.id} className={`flex items-center gap-1 px-2 py-1.5 text-[12px] mb-1 ${clay ? 'rounded-[10px] text-[--text-color]' : 'text-pastel-green'}`}
                                            style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)' } : { background: 'color-mix(in srgb, var(--pastel-green) 10%, transparent)' }}
                                        >
                                            <span className="truncate flex-1">{app.name}</span>
                                            <button onClick={() => launchApp(app.id)} className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`} title="Open">
                                                <IoPlayCircle size={14} />
                                            </button>
                                            <button onClick={() => uninstallApp(app.id)} className={`p-1 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`} title="Uninstall">
                                                <IoTrashOutline size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                    {activetab === 'repos' && (
                        <>
                            <div className={`text-[11px] font-semibold text-[--text-muted] uppercase px-3 mb-2 ${clay ? 'tracking-wide' : ''}`}>Repositories</div>
                            {repositories.map(repo => {
                                const status = repoStatuses.find(s => s.repo === repo);
                                return (
                                    <div key={repo} className={`flex items-center gap-2 px-3 py-2 text-[11px] group ${clay ? 'rounded-[10px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                        {status?.status === 'success' && <IoCheckmarkCircle size={14} className="text-pastel-green shrink-0" />}
                                        {status?.status === 'error' && <IoWarning size={14} className="text-pastel-red shrink-0" />}
                                        {status?.status === 'loading' && <IoRefresh size={14} className="animate-spin text-[--text-muted] shrink-0" />}
                                        {!status && <IoLogoGithub size={14} className="shrink-0 text-[--text-muted]" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-[--text-color]">{repo}</div>
                                            {status?.status === 'success' && <div className="text-[10px] text-[--text-muted]">{status.appCount} apps</div>}
                                            {status?.status === 'error' && <div className="text-[10px] text-pastel-red">{status.error}</div>}
                                        </div>
                                        {repo !== 'invincibleinventor/nextar-apps' && (
                                            <button onClick={() => removeRepository(repo)} className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${clay ? 'rounded-[6px] hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`}>
                                                <IoTrashOutline size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="mt-3 px-1">
                                <input
                                    type="text"
                                    value={newrepo}
                                    onChange={e => setnewrepo(e.target.value)}
                                    placeholder="username/repository"
                                    className={`w-full px-3 py-2 text-xs outline-none mb-2 ${clay ? 'rounded-[12px]' : 'bg-overlay'}`}
                                    style={clay ? glassInput : undefined}
                                    disabled={isaddingwrepo}
                                />
                                <button
                                    onClick={async () => {
                                        if (!newrepo) return;
                                        setisaddingwrepo(true);
                                        const success = await addRepository(newrepo);
                                        if (success) setnewrepo('');
                                        setisaddingwrepo(false);
                                    }}
                                    disabled={isaddingwrepo || !newrepo}
                                    className={`w-full py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50 ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    {isaddingwrepo ? <IoRefresh size={14} className="animate-spin" /> : <IoAddCircleOutline size={14} />}
                                    {isaddingwrepo ? 'Validating...' : 'Add Repository'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className={`px-4 py-4 ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                    <div className="text-[11px] text-[--text-muted] text-center">
                        {activetab === 'apps' ? `${externalApps.length} Apps` : `${repositories.length} Repos`}
                    </div>
                </div>
            </div>

            <div className={`flex-1 flex flex-col h-full overflow-y-auto relative ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full w-full flex flex-col overflow-y-auto"
                    >
                        <div className="p-6 md:p-10 pt-6 max-w-7xl mx-auto w-full">
                            {activetab === 'apps' && !selectedexternalapp && (
                                <>
                                    {filteredExternalApps.length > 0 && !appsearch && appcategory === 'All' && (
                                        <div className="mb-8">
                                            <div
                                                className={`relative overflow-hidden p-8 h-[200px] flex items-end cursor-pointer group ${clay ? 'rounded-[16px]' : ''}`}
                                                style={clay
                                                    ? { ...glassCard, boxShadow: 'var(--shadow-sm)' }
                                                    : { background: 'color-mix(in srgb, var(--accent-color) 20%, transparent)' }}
                                                onClick={() => setselectedexternalapp(filteredExternalApps[0])}
                                            >
                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${clay ? 'bg-[--bg-glass-hover]' : 'bg-overlay'}`} />
                                                <div className="relative flex items-end justify-between w-full">
                                                    <div>
                                                        <div className="text-[--text-muted] text-xs uppercase font-semibold mb-1">Featured App</div>
                                                        <h2 className="text-[--text-color] text-3xl font-bold mb-1">{filteredExternalApps[0].name}</h2>
                                                        <p className="text-[--text-muted] text-[13px] line-clamp-1">{filteredExternalApps[0].description}</p>
                                                    </div>
                                                    <div className={`w-20 h-20 flex items-center justify-center text-4xl ${clay ? 'rounded-[16px] bg-[--bg-glass-hover]' : 'bg-overlay'}`}>
                                                        {filteredExternalApps[0].icon || '📦'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-bold text-[--text-color]">{appcategory !== 'All' ? appcategory : appsearch ? `Results for "${appsearch}"` : 'Discover'}</h3>
                                            <button onClick={refreshApps}
                                                className={`p-2 transition-colors ${clay ? 'rounded-[10px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'bg-overlay hover:bg-surface'}`}
                                                style={clay ? undefined : undefined}
                                            >
                                                <IoRefresh size={16} className={isLoading ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                        <span className="text-[--text-muted] text-[13px]">{filteredExternalApps.length} apps</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center text-[--text-muted] py-10">
                                            <IoRefresh size={32} className="animate-spin mx-auto mb-3" />
                                            <p className="text-[13px]">Loading apps from repositories...</p>
                                        </div>
                                    ) : filteredExternalApps.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center text-[--text-muted] py-10">
                                            <p className="text-[13px] max-w-[300px] text-center">{appsearch ? `No apps found for "${appsearch}"` : 'No external apps found. Add a repository or check your connection.'}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredExternalApps.slice(appcategory === 'All' && !appsearch ? 1 : 0).map((app) => (
                                                <div
                                                    key={app.id}
                                                    className={`p-5 transition-all cursor-pointer group hover:-translate-y-1 ${clay ? 'rounded-[16px] active:scale-[0.97]' : 'bg-surface border border-[--border-color]'}`}
                                                    style={clay ? glassCard : undefined}
                                                    onClick={() => setselectedexternalapp(app)}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`w-14 h-14 flex items-center justify-center text-2xl ${clay ? 'rounded-[12px] bg-[--bg-glass-hover]' : 'bg-overlay'}`}>
                                                            {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="w-12 h-12  object-cover" /> : (app.icon || '📦')}
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (app.installed) { launchApp(app.id); } else { installApp(app.id); } }}
                                                            className={`px-4 py-1.5 text-xs font-bold transition-all ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''} ${app.installed
                                                                ? (clay ? 'text-[--text-color]' : 'bg-overlay text-accent hover:bg-accent hover:text-[--text-color]')
                                                                : (clay ? 'text-white' : 'bg-accent text-[--text-color] hover:opacity-90')}`}
                                                            style={app.installed
                                                                ? (clay ? glassButton : undefined)
                                                                : (clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined)}
                                                        >
                                                            {app.installed ? 'OPEN' : 'GET'}
                                                        </button>
                                                    </div>
                                                    <h4 className="text-[16px] font-semibold mb-1 group-hover:text-accent transition-colors text-[--text-color]">{app.name}</h4>
                                                    <p className="text-[12px] text-[--text-muted] line-clamp-2 mb-3 leading-relaxed">{app.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] text-[--text-muted]">{app.author}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 text-accent font-medium ${clay ? 'rounded-[6px] bg-[--bg-glass-hover]' : ''}`}
                                                            style={!clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' } : undefined}
                                                        >{app.category}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {activetab === 'apps' && selectedexternalapp && (
                                <div className="max-w-2xl mx-auto">
                                    <button onClick={() => setselectedexternalapp(null)} className={`flex items-center gap-1 text-accent mb-6 hover:underline ${clay ? 'active:scale-[0.97]' : ''}`}>
                                        <IoChevronBack size={18} /> Back to Apps
                                    </button>
                                    <div className="flex items-start gap-5 mb-6">
                                        <div className={`w-20 h-20 flex items-center justify-center text-4xl shrink-0 ${clay ? 'rounded-[18px] bg-[--bg-glass-hover]' : 'bg-overlay'}`}>
                                            {selectedexternalapp.iconUrl ? <img src={selectedexternalapp.iconUrl} alt={selectedexternalapp.name} className="w-16 h-16 object-cover" /> : (selectedexternalapp.icon || '📦')}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold mb-1 text-[--text-color]">{selectedexternalapp.name}</h2>
                                            <p className="text-[--text-muted] text-[13px] mb-2">by {selectedexternalapp.author}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs px-2 py-1 text-accent ${clay ? 'rounded-[8px] bg-[--bg-glass-hover]' : ''}`}
                                                    style={!clay ? { background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' } : undefined}
                                                >{selectedexternalapp.category}</span>
                                                <span className={`text-xs px-2 py-1 bg-[--bg-glass-hover] text-[--text-muted] ${clay ? 'rounded-[8px]' : ''}`}>v{selectedexternalapp.version}</span>
                                                {selectedexternalapp.license && <span className={`text-xs px-2 py-1 bg-[--bg-glass-hover] text-[--text-muted] ${clay ? 'rounded-[8px]' : ''}`}>{selectedexternalapp.license}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mb-8">
                                        {currentApp?.installed ? (
                                            <>
                                                <button onClick={() => launchApp(selectedexternalapp.id)}
                                                    className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                                >
                                                    <IoPlayCircle size={18} /> Open
                                                </button>
                                                <button onClick={() => uninstallApp(selectedexternalapp.id)}
                                                    className={`px-6 py-3 text-pastel-red font-semibold flex items-center justify-center gap-2 transition-all ${clay ? 'rounded-[12px] active:scale-[0.97]' : 'hover:bg-pastel-red hover:text-[--text-color]'}`}
                                                    style={clay ? { ...glassButton, background: 'color-mix(in srgb, var(--pastel-red) 10%, var(--bg-glass))' } : { background: 'color-mix(in srgb, var(--pastel-red) 10%, transparent)' }}
                                                >
                                                    <IoTrashOutline size={16} /> Uninstall
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => installApp(selectedexternalapp.id)}
                                                className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${clay ? 'rounded-[12px] text-white active:scale-[0.97]' : 'bg-accent text-[--text-color]'}`}
                                                style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                            >
                                                <IoDownloadOutline size={18} /> Install
                                            </button>
                                        )}
                                    </div>
                                    <div className={`p-5 mb-6 ${clay ? 'rounded-[16px]' : 'bg-surface'}`} style={clay ? glassCard : undefined}>
                                        <h3 className="font-bold mb-3 text-[--text-color]">About</h3>
                                        <p className="text-[--text-muted] text-[13px] leading-relaxed">{selectedexternalapp.description}</p>
                                    </div>
                                    {selectedexternalapp.tags && selectedexternalapp.tags.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold mb-3 text-[--text-color]">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedexternalapp.tags.map(tag => (
                                                    <span key={tag} className={`text-xs px-2 py-1 bg-[--bg-glass-hover] text-[--text-muted] ${clay ? 'rounded-[8px]' : ''}`}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedexternalapp.homepage && (
                                        <a href={selectedexternalapp.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent text-[13px] hover:underline mb-4">
                                            <IoGlobeOutline size={16} /> Visit Homepage
                                        </a>
                                    )}
                                    <div className="text-xs text-[--text-muted]">
                                        From repository: {selectedexternalapp.repo}
                                    </div>
                                </div>
                            )}
                            {activetab === 'repos' && (
                                <div className="flex flex-col items-center py-10">
                                    <IoLogoGithub size={48} className="mb-4 text-[--text-muted]" />
                                    <h3 className="text-xl font-bold mb-2 text-[--text-color]">Repository Management</h3>
                                    <p className="text-[--text-muted] text-[13px] max-w-md text-center mb-6">
                                        Add custom GitHub repositories to discover community-made apps for NextarOS.
                                        Repositories must contain an apps.json file in the main branch.
                                    </p>
                                    <div className={`p-5 max-w-lg w-full text-left ${clay ? 'rounded-[16px]' : 'bg-surface'}`} style={clay ? glassCard : undefined}>
                                        <h4 className="font-bold text-[13px] mb-3 text-[--text-color]">apps.json Format</h4>
                                        <pre className={`text-xs p-3 overflow-x-auto text-[--text-muted] font-mono ${clay ? 'rounded-[12px]' : 'bg-overlay'}`}
                                            style={clay ? { background: 'var(--bg-glass-active)', boxShadow: 'var(--shadow-inset)' } : undefined}
                                        >{`{
  "apps": [{
    "id": "unique-id",
    "name": "App Name",
    "description": "Description",
    "icon": "🎮",
    "author": "Author",
    "version": "1.0.0",
    "category": "Utilities",
    "component": "MyComponent"
  }]
}`}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
