'use client';
import React, { useState, useMemo } from 'react';
import { IoSearch, IoRocketOutline, IoGlobeOutline, IoOpenOutline, IoLogoGithub, IoCodeSlashOutline, IoServerOutline, IoPhonePortraitOutline, IoLayersOutline, IoChevronBack, IoDownloadOutline, IoTrashOutline, IoAddCircleOutline, IoRefresh, IoCheckmarkCircle, IoWarning, IoPlayCircle } from "react-icons/io5";
import Image from 'next/image';
import { personal, openSystemItem } from '../data';
import { useWindows } from '../WindowContext';
import { useDevice } from '../DeviceContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useExternalApps, ExternalApp } from '../ExternalAppsContext';

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
            <div className="relative flex flex-col h-full w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] font-sf text-black dark:text-white overflow-hidden">
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
                                <h1 className="text-[28px] font-bold">App Store</h1>
                                <button onClick={refreshApps} className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                                    <IoRefresh size={18} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            <div className="px-4 flex gap-2 mb-2">
                                {(['apps', 'repos'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setactivetab(tab)}
                                        className={`flex-1 py-2 rounded-xl text-[14px] font-semibold capitalize transition-colors ${activetab === tab ? 'bg-accent text-white' : 'bg-white dark:bg-[#2c2c2e]'}`}
                                    >
                                        {tab === 'apps' ? `Apps (${externalApps.length})` : `Repos (${repositories.length})`}
                                    </button>
                                ))}
                            </div>

                            {activetab === 'apps' && (
                                <>
                                    <div className="px-4 py-2">
                                        <div className="relative">
                                            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                className="w-full bg-white dark:bg-[#2c2c2e] rounded-xl pl-10 pr-4 py-3 text-[15px] outline-none"
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
                                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap ${appcategory === cat ? 'bg-accent text-white' : 'bg-white dark:bg-[#2c2c2e]'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {isLoading ? (
                                            <div className="text-center py-10 text-gray-500">
                                                <IoRefresh size={24} className="animate-spin mx-auto mb-2" />
                                                Loading...
                                            </div>
                                        ) : filteredExternalApps.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500 text-sm">
                                                {appsearch ? `No apps found for "${appsearch}"` : 'No apps available'}
                                            </div>
                                        ) : (
                                            <>
                                                {filteredExternalApps.map(app => (
                                                    <div
                                                        key={app.id}
                                                        className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 active:scale-[0.98] transition-transform shadow-sm"
                                                        onClick={() => setselectedexternalapp(app)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                                                {app.icon || '📦'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <h3 className="text-[16px] font-semibold truncate">{app.name}</h3>
                                                                    {app.installed && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">✓</span>}
                                                                </div>
                                                                <p className="text-[13px] text-gray-500 line-clamp-1">{app.description}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-gray-400">{app.author}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); if (app.installed) { launchApp(app.id); } else { installApp(app.id); } }}
                                                                className={`px-4 py-2 rounded-full text-[12px] font-bold shrink-0 ${app.installed ? 'bg-gray-100 dark:bg-white/10 text-accent' : 'bg-accent text-white'}`}
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
                                            <div key={repo} className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4">
                                                <div className="flex items-center gap-3">
                                                    {status?.status === 'success' && <IoCheckmarkCircle size={20} className="text-green-500" />}
                                                    {status?.status === 'error' && <IoWarning size={20} className="text-red-500" />}
                                                    {(!status || status?.status === 'loading') && <IoLogoGithub size={20} className="text-gray-400" />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[14px] font-medium truncate">{repo}</div>
                                                        {status?.status === 'success' && <div className="text-[12px] text-gray-500">{status.appCount} apps</div>}
                                                        {status?.status === 'error' && <div className="text-[12px] text-red-400">{status.error}</div>}
                                                    </div>
                                                    {repo !== 'invincibleinventor/nextar-apps' && (
                                                        <button onClick={() => removeRepository(repo)} className="p-2">
                                                            <IoTrashOutline size={18} className="text-red-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4">
                                        <input
                                            type="text"
                                            value={newrepo}
                                            onChange={e => setnewrepo(e.target.value)}
                                            placeholder="username/repository"
                                            className="w-full bg-gray-100 dark:bg-white/10 rounded-xl px-4 py-3 text-[14px] outline-none mb-3"
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
                                            className="w-full py-3 bg-accent text-white rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
                            className="absolute inset-0 z-30 bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="h-14 flex items-center px-2 border-b border-black/5 dark:border-white/5 shrink-0">
                                <button onClick={() => setselectedexternalapp(null)} className="flex items-center text-accent px-2">
                                    <IoChevronBack size={26} />
                                    <span className="text-[17px]">Apps</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-[22px] bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-5xl mb-4">
                                        {selectedexternalapp.icon || '📦'}
                                    </div>
                                    <h1 className="text-[22px] font-bold text-center mb-1">{selectedexternalapp.name}</h1>
                                    <p className="text-gray-500 text-[14px] mb-1">by {selectedexternalapp.author}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent">{selectedexternalapp.category}</span>
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">v{selectedexternalapp.version}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mb-6">
                                    {currentApp?.installed ? (
                                        <>
                                            <button onClick={() => launchApp(selectedexternalapp.id)} className="flex-1 py-3 bg-accent text-white rounded-2xl font-semibold flex items-center justify-center gap-2">
                                                <IoPlayCircle size={20} /> Open
                                            </button>
                                            <button onClick={() => uninstallApp(selectedexternalapp.id)} className="px-5 py-3 bg-red-500/10 text-red-500 rounded-2xl font-medium">
                                                <IoTrashOutline size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => installApp(selectedexternalapp.id)} className="flex-1 py-3 bg-accent text-white rounded-2xl font-semibold flex items-center justify-center gap-2">
                                            <IoDownloadOutline size={20} /> Install
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 mb-4">
                                    <h3 className="font-bold mb-2 text-[15px]">About</h3>
                                    <p className="text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed">{selectedexternalapp.description}</p>
                                </div>

                                {selectedexternalapp.tags && selectedexternalapp.tags.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-bold mb-2 text-[15px]">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedexternalapp.tags.map(tag => (
                                                <span key={tag} className="text-[12px] px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-[12px] text-gray-400 text-center">
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
        <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden">
            <div className="w-[220px] shrink-0 flex-col pt-[50px] pb-4 px-2 border-r border-black/5 dark:border-white/5 bg-[#fbfbfd]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl hidden md:flex">
                <div className="px-4 mb-4">
                    <div className="relative">
                        <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none placeholder-gray-500"
                            placeholder="Search"
                        />
                    </div>
                </div>

                <div className="px-2 mb-4 flex gap-1">
                    {(['apps', 'repos'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setactivetab(tab as any)}
                            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md capitalize transition-colors ${activetab === tab ? 'bg-accent text-white' : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-0.5 flex-1 overflow-y-auto px-2">
                    {activetab === 'apps' && (
                        <>
                            <div className="px-2 mb-3">
                                <div className="relative">
                                    <IoSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <input
                                        type="text"
                                        value={appsearch}
                                        onChange={e => setappsearch(e.target.value)}
                                        placeholder="Search apps..."
                                        className="w-full bg-black/5 dark:bg-white/10 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none"
                                    />
                                </div>
                            </div>
                            <div className="text-[10px] font-semibold text-gray-400 uppercase px-3 mb-1">Categories</div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setappcategory(cat)}
                                    className={`w-full text-left px-3 py-1.5 text-[12px] rounded-lg transition-colors ${appcategory === cat ? 'bg-accent/10 text-accent font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                            {externalApps.filter(a => a.installed).length > 0 && (
                                <>
                                    <div className="text-[10px] font-semibold text-green-500 uppercase px-3 mb-1 mt-4">Installed</div>
                                    {externalApps.filter(a => a.installed).map(app => (
                                        <div key={app.id} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[12px] mb-1">
                                            <span className="truncate flex-1">{app.name}</span>
                                            <button onClick={() => launchApp(app.id)} className="p-1 hover:bg-green-500/20 rounded" title="Open">
                                                <IoPlayCircle size={14} />
                                            </button>
                                            <button onClick={() => uninstallApp(app.id)} className="p-1 hover:bg-red-500/20 rounded" title="Uninstall">
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
                            <div className="text-[11px] font-semibold text-gray-500 uppercase px-3 mb-2">Repositories</div>
                            {repositories.map(repo => {
                                const status = repoStatuses.find(s => s.repo === repo);
                                return (
                                    <div key={repo} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[11px] group">
                                        {status?.status === 'success' && <IoCheckmarkCircle size={14} className="text-green-500 shrink-0" />}
                                        {status?.status === 'error' && <IoWarning size={14} className="text-red-500 shrink-0" />}
                                        {status?.status === 'loading' && <IoRefresh size={14} className="animate-spin text-gray-400 shrink-0" />}
                                        {!status && <IoLogoGithub size={14} className="shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate">{repo}</div>
                                            {status?.status === 'success' && <div className="text-[10px] text-gray-400">{status.appCount} apps</div>}
                                            {status?.status === 'error' && <div className="text-[10px] text-red-400">{status.error}</div>}
                                        </div>
                                        {repo !== 'invincibleinventor/nextar-apps' && (
                                            <button onClick={() => removeRepository(repo)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-opacity shrink-0">
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
                                    className="w-full bg-black/5 dark:bg-white/10 rounded-lg px-3 py-2 text-xs outline-none mb-2"
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
                                    className="w-full py-2 bg-accent text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    {isaddingwrepo ? <IoRefresh size={14} className="animate-spin" /> : <IoAddCircleOutline size={14} />}
                                    {isaddingwrepo ? 'Validating...' : 'Add Repository'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-4 py-4 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] text-gray-500 text-center">
                        {activetab === 'apps' ? `${externalApps.length} Apps` : `${repositories.length} Repos`}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-[#1e1e1e] relative">
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
                                            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 h-[200px] flex items-end cursor-pointer group" onClick={() => setselectedexternalapp(filteredExternalApps[0])}>
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                                <div className="relative flex items-end justify-between w-full">
                                                    <div>
                                                        <div className="text-white/70 text-xs uppercase font-semibold mb-1">Featured App</div>
                                                        <h2 className="text-white text-3xl font-bold mb-1">{filteredExternalApps[0].name}</h2>
                                                        <p className="text-white/80 text-sm line-clamp-1">{filteredExternalApps[0].description}</p>
                                                    </div>
                                                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">
                                                        {filteredExternalApps[0].icon || '📦'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-bold">{appcategory !== 'All' ? appcategory : appsearch ? `Results for "${appsearch}"` : 'Discover'}</h3>
                                            <button onClick={refreshApps} className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-accent/20 transition-colors">
                                                <IoRefresh size={16} className={isLoading ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                        <span className="text-gray-500 text-sm">{filteredExternalApps.length} apps</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="text-center text-gray-500 py-10">
                                            <IoRefresh size={32} className="animate-spin mx-auto mb-3" />
                                            Loading apps from repositories...
                                        </div>
                                    ) : filteredExternalApps.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10">
                                            {appsearch ? `No apps found for "${appsearch}"` : 'No external apps found. Add a repository or check your connection.'}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredExternalApps.slice(appcategory === 'All' && !appsearch ? 1 : 0).map((app) => (
                                                <div key={app.id} className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all border border-neutral-100 dark:border-white/5 cursor-pointer group hover:-translate-y-1" onClick={() => setselectedexternalapp(app)}>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-2xl shadow-sm">
                                                            {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="w-12 h-12 rounded-[12px] object-cover" /> : (app.icon || '📦')}
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (app.installed) { launchApp(app.id); } else { installApp(app.id); } }}
                                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${app.installed ? 'bg-gray-100 dark:bg-white/10 text-accent hover:bg-accent hover:text-white' : 'bg-accent text-white hover:opacity-90'}`}
                                                        >
                                                            {app.installed ? 'OPEN' : 'GET'}
                                                        </button>
                                                    </div>
                                                    <h4 className="text-[16px] font-semibold mb-1 group-hover:text-accent transition-colors">{app.name}</h4>
                                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">{app.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] text-gray-400">{app.author}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{app.category}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {activetab === 'apps' && selectedexternalapp && (
                                <div className="max-w-2xl mx-auto">
                                    <button onClick={() => setselectedexternalapp(null)} className="flex items-center gap-1 text-accent mb-6 hover:underline">
                                        <IoChevronBack size={18} /> Back to Apps
                                    </button>
                                    <div className="flex items-start gap-5 mb-6">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-4xl shrink-0">
                                            {selectedexternalapp.iconUrl ? <img src={selectedexternalapp.iconUrl} alt={selectedexternalapp.name} className="w-16 h-16 rounded-xl object-cover" /> : (selectedexternalapp.icon || '📦')}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold mb-1">{selectedexternalapp.name}</h2>
                                            <p className="text-gray-500 text-sm mb-2">by {selectedexternalapp.author}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{selectedexternalapp.category}</span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">v{selectedexternalapp.version}</span>
                                                {selectedexternalapp.license && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">{selectedexternalapp.license}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mb-8">
                                        {currentApp?.installed ? (
                                            <>
                                                <button onClick={() => launchApp(selectedexternalapp.id)} className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                                    <IoPlayCircle size={18} /> Open
                                                </button>
                                                <button onClick={() => uninstallApp(selectedexternalapp.id)} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                                                    <IoTrashOutline size={16} /> Uninstall
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => installApp(selectedexternalapp.id)} className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                                <IoDownloadOutline size={18} /> Install
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-6">
                                        <h3 className="font-bold mb-3">About</h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{selectedexternalapp.description}</p>
                                    </div>
                                    {selectedexternalapp.tags && selectedexternalapp.tags.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold mb-3">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedexternalapp.tags.map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedexternalapp.homepage && (
                                        <a href={selectedexternalapp.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent text-sm hover:underline mb-4">
                                            <IoGlobeOutline size={16} /> Visit Homepage
                                        </a>
                                    )}
                                    <div className="text-xs text-gray-400">
                                        From repository: {selectedexternalapp.repo}
                                    </div>
                                </div>
                            )}
                            {activetab === 'repos' && (
                                <div className="text-center py-10">
                                    <IoLogoGithub size={48} className="mx-auto mb-4 text-gray-400" />
                                    <h3 className="text-xl font-bold mb-2">Repository Management</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                        Add custom GitHub repositories to discover community-made apps for NextarOS.
                                        Repositories must contain an apps.json file in the main branch.
                                    </p>
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 max-w-lg mx-auto text-left">
                                        <h4 className="font-bold text-sm mb-3">apps.json Format</h4>
                                        <pre className="text-xs bg-black/5 dark:bg-black/30 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-300">{`{
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
