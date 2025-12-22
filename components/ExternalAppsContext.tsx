'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useWindows } from './WindowContext';
import { useNotifications } from './NotificationContext';
import { useFileSystem } from './FileSystemContext';
import { playSound } from './SoundEffects';
import { hashCode } from '../utils/crypto';

export interface ExternalApp {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconUrl?: string;
    author: string;
    version: string;
    category: string;
    component: string;
    repo: string;
    installed: boolean;
    downloads?: number;
    screenshots?: string[];
    homepage?: string;
    license?: string;
    tags?: string[];
    updatedAt?: string;
    minVersion?: string;
    code?: string;
    codeHash?: string;
}

interface RepoStatus {
    repo: string;
    status: 'success' | 'error' | 'loading';
    error?: string;
    appCount: number;
}

interface ExternalAppsContextType {
    apps: ExternalApp[];
    installedApps: ExternalApp[];
    repositories: string[];
    repoStatuses: RepoStatus[];
    isLoading: boolean;
    error: string | null;
    categories: string[];
    installApp: (appId: string) => Promise<void>;
    uninstallApp: (appId: string) => Promise<void>;
    addRepository: (repoUrl: string) => Promise<boolean>;
    removeRepository: (repoUrl: string) => void;
    refreshApps: () => Promise<void>;
    getAppById: (id: string) => ExternalApp | undefined;
    searchApps: (query: string) => ExternalApp[];
    getAppsByCategory: (category: string) => ExternalApp[];
    launchApp: (appId: string) => void;
    checkForUpdates: () => Promise<ExternalApp[]>;
    validateRepository: (repoUrl: string) => Promise<{ valid: boolean; error?: string; appCount?: number }>;
}

const ExternalAppsContext = createContext<ExternalAppsContextType | undefined>(undefined);

const DEFAULT_REPO = 'invincibleinventor/nextar-apps';
const CACHE_KEY = 'nextaros-apps-cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

export function ExternalAppsProvider({ children }: { children: React.ReactNode }) {
    const [apps, setApps] = useState<ExternalApp[]>([]);
    const [installedApps, setInstalledApps] = useState<ExternalApp[]>([]);
    const [repositories, setRepositories] = useState<string[]>([DEFAULT_REPO]);
    const [repoStatuses, setRepoStatuses] = useState<RepoStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const { isGuest } = useAuth();
    const { addwindow } = useWindows();
    const { addToast } = useNotifications();
    const { files, createFile, deleteItem } = useFileSystem();

    const categories = useMemo(() => {
        const cats = new Set(apps.map(app => app.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [apps]);

    useEffect(() => {
        if (isGuest) return;

        const storedRepos = localStorage.getItem('nextaros-repos');
        const storedInstalled = localStorage.getItem('nextaros-installed-apps');

        if (storedRepos) {
            try {
                const parsedRepos = JSON.parse(storedRepos);
                if (!parsedRepos.includes(DEFAULT_REPO)) {
                    parsedRepos.unshift(DEFAULT_REPO);
                }
                setRepositories(parsedRepos);
            } catch { }
        }

        if (storedInstalled) {
            try {
                setInstalledApps(JSON.parse(storedInstalled));
            } catch { }
        }
        setIsInitialized(true);
    }, [isGuest]);

    const fetchAppsFromRepo = useCallback(async (repo: string): Promise<{ apps: ExternalApp[]; error?: string }> => {
        try {
            const cacheKey = `${CACHE_KEY}-${repo}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return { apps: data.map((app: ExternalApp) => ({ ...app, repo, installed: false })) };
                }
            }

            const response = await fetch(`https://raw.githubusercontent.com/${repo}/main/apps.json`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { apps: [], error: 'apps.json not found' };
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.apps || !Array.isArray(data.apps)) {
                return { apps: [], error: 'Invalid apps.json format' };
            }

            const validApps = data.apps.filter((app: any) =>
                app.id && app.name && app.component
            );

            localStorage.setItem(cacheKey, JSON.stringify({
                data: validApps,
                timestamp: Date.now()
            }));

            return {
                apps: validApps.map((app: ExternalApp) => ({
                    ...app,
                    repo,
                    installed: false,
                    category: app.category || 'Uncategorized',
                    version: app.version || '1.0.0',
                    author: app.author || 'Unknown',
                    description: app.description || '',
                    icon: app.icon || '📦'
                }))
            };
        } catch (err: any) {
            return { apps: [], error: err.message || 'Failed to fetch' };
        }
    }, []);

    const validateRepository = useCallback(async (repoUrl: string): Promise<{ valid: boolean; error?: string; appCount?: number }> => {
        const cleanUrl = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');

        if (!/^[\w-]+\/[\w-]+$/.test(cleanUrl)) {
            return { valid: false, error: 'Invalid format. Use: username/repository' };
        }

        const result = await fetchAppsFromRepo(cleanUrl);

        if (result.error) {
            return { valid: false, error: result.error };
        }

        if (result.apps.length === 0) {
            return { valid: false, error: 'No valid apps found' };
        }

        return { valid: true, appCount: result.apps.length };
    }, [fetchAppsFromRepo]);

    const refreshApps = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const statuses: RepoStatus[] = [];
        const allApps: ExternalApp[] = [];

        for (const repo of repositories) {
            statuses.push({ repo, status: 'loading', appCount: 0 });
        }
        setRepoStatuses([...statuses]);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];
            const result = await fetchAppsFromRepo(repo);

            statuses[i] = {
                repo,
                status: result.error ? 'error' : 'success',
                error: result.error,
                appCount: result.apps.length
            };
            setRepoStatuses([...statuses]);

            allApps.push(...result.apps);
        }

        const appsWithInstallStatus = allApps.map(app => ({
            ...app,
            installed: installedApps.some(installed => installed.id === app.id)
        }));

        setApps(appsWithInstallStatus);
        setIsLoading(false);
    }, [repositories, installedApps, fetchAppsFromRepo]);

    useEffect(() => {
        if (isInitialized) {
            refreshApps();
        }
    }, [isInitialized]);

    const installApp = useCallback(async (appId: string) => {
        const app = apps.find(a => a.id === appId);
        if (!app) return;

        addToast(`Installing ${app.name}...`, 'info');

        try {
            const codeResponse = await fetch(
                `https://raw.githubusercontent.com/${app.repo}/main/${app.component}.jsx`,
                { cache: 'no-store' }
            );

            let code: string;
            if (!codeResponse.ok) {
                const tsxResponse = await fetch(
                    `https://raw.githubusercontent.com/${app.repo}/main/${app.component}.tsx`,
                    { cache: 'no-store' }
                );
                if (!tsxResponse.ok) {
                    throw new Error('Could not fetch app code');
                }
                code = await tsxResponse.text();
            } else {
                code = await codeResponse.text();
            }

            const codeH = await hashCode(code);
            const installedApp = { ...app, installed: true, code, codeHash: codeH };
            const newInstalledApps = [...installedApps, installedApp];
            setInstalledApps(newInstalledApps);
            setApps(prev => prev.map(a => a.id === appId ? { ...a, installed: true } : a));

            await createFile(`${app.id}.app`, 'root-apps', JSON.stringify({
                id: app.id,
                name: app.name,
                icon: app.iconUrl || app.icon,
                category: app.category,
                version: app.version,
                author: app.author,
                code: code,
                codeHash: codeH,
                isInstalledApp: true
            }), app.iconUrl || app.icon || '/python.png');

            playSound('success');
            addToast(`${app.name} installed successfully`, 'success');
            if (!isGuest) {
                localStorage.setItem('nextaros-installed-apps', JSON.stringify(newInstalledApps));
            }
        } catch (err: any) {
            addToast(`Failed to install ${app.name}: ${err.message}`, 'error');
        }
    }, [apps, installedApps, isGuest, addToast, createFile]);

    const uninstallApp = useCallback(async (appId: string) => {
        const app = installedApps.find(a => a.id === appId);
        if (!app) return;

        const newInstalledApps = installedApps.filter(a => a.id !== appId);
        setInstalledApps(newInstalledApps);

        setApps(prev => prev.map(a =>
            a.id === appId ? { ...a, installed: false } : a
        ));

        const appFile = files.find(f => f.name === `${appId}.app` && f.parent === 'root-apps');
        if (appFile) {
            await deleteItem(appFile.id);
        }

        playSound('trash');
        addToast(`${app.name} uninstalled`, 'info');

        if (!isGuest) {
            localStorage.setItem('nextaros-installed-apps', JSON.stringify(newInstalledApps));
        }
    }, [installedApps, isGuest, addToast, files, deleteItem]);

    const addRepository = useCallback(async (repoUrl: string): Promise<boolean> => {
        const cleanUrl = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');

        if (repositories.includes(cleanUrl)) {
            addToast('Repository already added', 'error');
            return false;
        }

        const validation = await validateRepository(cleanUrl);
        if (!validation.valid) {
            addToast(`Invalid repository: ${validation.error}`, 'error');
            return false;
        }

        const newRepos = [...repositories, cleanUrl];
        setRepositories(newRepos);

        if (!isGuest) {
            localStorage.setItem('nextaros-repos', JSON.stringify(newRepos));
        }

        addToast(`Added repository with ${validation.appCount} app(s)`, 'success');
        refreshApps();
        return true;
    }, [repositories, isGuest, validateRepository, addToast, refreshApps]);

    const removeRepository = useCallback((repoUrl: string) => {
        if (repoUrl === DEFAULT_REPO) {
            addToast('Cannot remove default repository', 'error');
            return;
        }

        const newRepos = repositories.filter(r => r !== repoUrl);
        setRepositories(newRepos);

        if (!isGuest) {
            localStorage.setItem('nextaros-repos', JSON.stringify(newRepos));
        }

        setApps(prev => prev.filter(app => app.repo !== repoUrl));
        addToast('Repository removed', 'info');
    }, [repositories, isGuest, addToast]);

    const getAppById = useCallback((id: string): ExternalApp | undefined => {
        return apps.find(app => app.id === id);
    }, [apps]);

    const searchApps = useCallback((query: string): ExternalApp[] => {
        if (!query.trim()) return apps;

        const q = query.toLowerCase();
        return apps.filter(app =>
            app.name.toLowerCase().includes(q) ||
            app.description.toLowerCase().includes(q) ||
            app.author.toLowerCase().includes(q) ||
            app.category.toLowerCase().includes(q) ||
            (app.tags || []).some(tag => tag.toLowerCase().includes(q))
        );
    }, [apps]);

    const getAppsByCategory = useCallback((category: string): ExternalApp[] => {
        if (category === 'All') return apps;
        return apps.filter(app => app.category === category);
    }, [apps]);

    const launchApp = useCallback((appId: string) => {
        const app = installedApps.find(a => a.id === appId);
        if (!app) {
            addToast('App not installed', 'error');
            return;
        }

        if (!app.code) {
            addToast('App code not found. Try reinstalling.', 'error');
            return;
        }

        addwindow({
            id: `external-${app.id}-${Date.now()}`,
            appname: app.name,
            title: app.name,
            component: 'DynamicAppRunner',
            icon: app.iconUrl || app.icon || '/python.png',
            props: {
                code: app.code,
                appname: app.name,
                appicon: app.icon || '📦',
                fileid: app.id,
                codeHash: app.codeHash
            },
            isminimized: false,
            ismaximized: false,
        });
    }, [installedApps, addwindow, addToast]);

    const checkForUpdates = useCallback(async (): Promise<ExternalApp[]> => {
        const updates: ExternalApp[] = [];

        for (const installed of installedApps) {
            const latest = apps.find(a => a.id === installed.id);
            if (latest && latest.version !== installed.version) {
                updates.push(latest);
            }
        }

        if (updates.length > 0) {
            addToast(`${updates.length} app update(s) available`, 'info');
        }

        return updates;
    }, [installedApps, apps, addToast]);

    return (
        <ExternalAppsContext.Provider value={{
            apps,
            installedApps,
            repositories,
            repoStatuses,
            isLoading,
            error,
            categories,
            installApp,
            uninstallApp,
            addRepository,
            removeRepository,
            refreshApps,
            getAppById,
            searchApps,
            getAppsByCategory,
            launchApp,
            checkForUpdates,
            validateRepository
        }}>
            {children}
        </ExternalAppsContext.Provider>
    );
}

export function useExternalApps() {
    const context = useContext(ExternalAppsContext);
    if (!context) {
        throw new Error('useExternalApps must be used within ExternalAppsProvider');
    }
    return context;
}
