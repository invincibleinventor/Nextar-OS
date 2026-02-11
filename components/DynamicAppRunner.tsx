'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, useLayoutEffect, useImperativeHandle, useDebugValue, useDeferredValue, useTransition, useId, useSyncExternalStore, useInsertionEffect, Fragment, createContext, forwardRef, memo, lazy, Suspense, createElement, cloneElement, createRef, isValidElement, Children } from 'react';
import { useWindows } from './WindowContext';
import { useNotifications } from './NotificationContext';
import { useFileSystem } from './FileSystemContext';
import { useSettings } from './SettingsContext';
import { useTheme } from './ThemeContext';
import { useDevice } from './DeviceContext';
import { useAuth } from './AuthContext';
import { useExternalApps } from './ExternalAppsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyHash } from '../utils/crypto';

interface DynamicAppProps {
    code: string;
    appname: string;
    appicon?: string;
    fileid?: string;
    codeHash?: string;
}

interface AppError {
    message: string;
    stack?: string;
}

declare global {
    interface Window {
        Babel?: {
            transform: (code: string, options: any) => { code: string };
        };
    }
}

export default function DynamicAppRunner({ code, appname, appicon, fileid, codeHash }: DynamicAppProps) {
    const [error, seterror] = useState<AppError | null>(null);
    const [UserComponent, setUserComponent] = useState<React.ComponentType<any> | null>(null);
    const [babelloaded, setbabelloaded] = useState(false);
    const [isbuilding, setisbuilding] = useState(true);
    const [hashVerified, setHashVerified] = useState<boolean | null>(null);

    const windowsctx = useWindows();
    const notifctx = useNotifications();
    const fsctx = useFileSystem();
    const settingsctx = useSettings();
    const themectx = useTheme();
    const devicectx = useDevice();
    const authctx = useAuth();
    const externalctx = useExternalApps();

    const contextsRef = useRef({ windowsctx, notifctx, fsctx, settingsctx, themectx, devicectx, authctx, externalctx });
    useEffect(() => {
        contextsRef.current = { windowsctx, notifctx, fsctx, settingsctx, themectx, devicectx, authctx, externalctx };
    }, [windowsctx, notifctx, fsctx, settingsctx, themectx, devicectx, authctx, externalctx]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.Babel) {
            setbabelloaded(true);
            return;
        }
        // Check if script is already being loaded by another instance
        const existing = document.querySelector('script[data-babel-standalone]');
        if (existing) {
            const check = setInterval(() => {
                if (window.Babel) { clearInterval(check); setbabelloaded(true); }
            }, 100);
            return () => clearInterval(check);
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
        script.setAttribute('data-babel-standalone', 'true');
        script.onload = () => {
            // Poll until window.Babel is actually available
            const check = setInterval(() => {
                if (window.Babel) { clearInterval(check); setbabelloaded(true); }
            }, 50);
            setTimeout(() => { clearInterval(check); if (!window.Babel) { seterror({ message: 'Babel failed to initialize' }); setisbuilding(false); } }, 5000);
        };
        script.onerror = () => {
            seterror({ message: 'Failed to load Babel transpiler. Check your network connection.' });
            setisbuilding(false);
        };
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (!babelloaded || !code) {
            if (!code) {
                seterror({ message: 'No code provided' });
                setisbuilding(false);
            }
            return;
        }

        const runBuild = async () => {
            setisbuilding(true);
            seterror(null);

            if (codeHash) {
                const isValid = await verifyHash(code, codeHash);
                setHashVerified(isValid);
                if (!isValid) {
                    seterror({ message: 'Code integrity check failed. The app may have been tampered with.' });
                    setisbuilding(false);
                    return;
                }
            } else {
                setHashVerified(null);
            }

            try {
                const babel = window.Babel;
                if (!babel) {
                    throw new Error('Babel not loaded');
                }

                const hasTs = code.includes(': string') || code.includes(': number') || code.includes(': boolean') || code.includes('<string>') || code.includes('<number>') || code.includes('interface ') || code.includes(': React.');
                const presets = hasTs ? ['react', 'typescript'] : ['react'];
                const result = babel.transform(code, {
                    presets,
                    filename: hasTs ? 'app.tsx' : 'app.jsx'
                });

                const transpiledcode = result.code;

                const getScope = () => {
                    const ctx = contextsRef.current;
                    return {
                        React,
                        useState,
                        useEffect,
                        useMemo,
                        useCallback,
                        useRef,
                        useReducer,
                        useContext,
                        useLayoutEffect,
                        useImperativeHandle,
                        useDebugValue,
                        useDeferredValue,
                        useTransition,
                        useId,
                        useSyncExternalStore,
                        useInsertionEffect,
                        Fragment,
                        createContext,
                        forwardRef,
                        memo,
                        lazy,
                        Suspense,
                        createElement,
                        cloneElement,
                        createRef,
                        isValidElement,
                        Children,

                        useWindows: () => ctx.windowsctx,
                        addwindow: ctx.windowsctx.addwindow,
                        removewindow: ctx.windowsctx.removewindow,
                        updatewindow: ctx.windowsctx.updatewindow,
                        setactivewindow: ctx.windowsctx.setactivewindow,
                        windows: ctx.windowsctx.windows,
                        activewindow: ctx.windowsctx.activewindow,

                        useNotifications: () => ctx.notifctx,
                        addToast: ctx.notifctx.addToast,
                        addnotification: ctx.notifctx.addnotification,
                        clearnotification: ctx.notifctx.clearnotification,
                        notifications: ctx.notifctx.notifications,

                        useFileSystem: () => ({
                            files: ctx.fsctx.files.filter((f: any) => !f.isSystem),
                            getFile: (id: string) => ctx.fsctx.files.find((f: any) => f.id === id),
                        }),
                        files: ctx.fsctx.files.filter((f: any) => !f.isSystem),

                        useSettings: () => ({
                            wallpaperurl: ctx.settingsctx.wallpaperurl,
                            accentcolor: ctx.settingsctx.accentcolor,
                            reducemotion: ctx.settingsctx.reducemotion,
                            soundeffects: ctx.settingsctx.soundeffects,
                        }),
                        wallpaperurl: ctx.settingsctx.wallpaperurl,
                        accentcolor: ctx.settingsctx.accentcolor,
                        reducemotion: ctx.settingsctx.reducemotion,
                        soundeffects: ctx.settingsctx.soundeffects,

                        useTheme: () => ctx.themectx,
                        theme: ctx.themectx.theme,
                        toggletheme: ctx.themectx.toggletheme,
                        setTheme: ctx.themectx.toggletheme,

                        useDevice: () => ctx.devicectx,
                        ismobile: ctx.devicectx.ismobile,
                        isdesktop: !ctx.devicectx.ismobile,
                        osstate: ctx.devicectx.osstate,

                        useAuth: () => ({
                            user: ctx.authctx.user ? { username: ctx.authctx.user.username, name: ctx.authctx.user.name } : null,
                            isGuest: ctx.authctx.isGuest,
                        }),
                        user: ctx.authctx.user ? { username: ctx.authctx.user.username, name: ctx.authctx.user.name } : null,
                        isGuest: ctx.authctx.isGuest,

                        useExternalApps: () => ({
                            apps: ctx.externalctx.apps,
                        }),
                        apps: ctx.externalctx.apps,

                        motion,
                        AnimatePresence,

                        console: {
                            log: (...args: any[]) => console.log('[UserApp]', ...args),
                            error: (...args: any[]) => console.error('[UserApp]', ...args),
                            warn: (...args: any[]) => console.warn('[UserApp]', ...args),
                            info: (...args: any[]) => console.info('[UserApp]', ...args),
                        },

                        fetch: (url: string, options?: RequestInit) => {
                            const parsed = new URL(url, window.location.origin);
                            if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
                                throw new Error('Only HTTP/HTTPS requests allowed');
                            }
                            return window.fetch(url, options);
                        },
                        setTimeout: window.setTimeout.bind(window),
                        setInterval: window.setInterval.bind(window),
                        clearTimeout: window.clearTimeout.bind(window),
                        clearInterval: window.clearInterval.bind(window),
                        requestAnimationFrame: window.requestAnimationFrame.bind(window),
                        cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
                        localStorage: {
                            getItem: (key: string) => window.localStorage.getItem(`userapp_${appname}_${key}`),
                            setItem: (key: string, value: string) => window.localStorage.setItem(`userapp_${appname}_${key}`, value),
                            removeItem: (key: string) => window.localStorage.removeItem(`userapp_${appname}_${key}`),
                            clear: () => {
                                const prefix = `userapp_${appname}_`;
                                Object.keys(window.localStorage)
                                    .filter(k => k.startsWith(prefix))
                                    .forEach(k => window.localStorage.removeItem(k));
                            }
                        },
                        Date,
                        Math,
                        JSON,
                        Array,
                        Object,
                        String,
                        Number,
                        Boolean,
                        Promise,
                        Map,
                        Set,
                        WeakMap,
                        WeakSet,
                        Symbol,
                        RegExp,
                        Error,
                        parseInt,
                        parseFloat,
                        isNaN,
                        isFinite,
                        encodeURI,
                        decodeURI,
                        encodeURIComponent,
                        decodeURIComponent,
                        atob,
                        btoa,
                    };
                };

                const funcmatches = code.matchAll(/function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g);
                const arrowmatches = code.matchAll(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)\s*=>/g);

                const allfuncs: string[] = [];
                for (const match of funcmatches) {
                    allfuncs.push(match[1]);
                }
                for (const match of arrowmatches) {
                    allfuncs.push(match[1]);
                }

                if (allfuncs.length === 0) {
                    throw new Error('No component found. Create a function starting with uppercase like: function MyApp() {...}');
                }

                const lastfunc = allfuncs[allfuncs.length - 1];

                const ComponentFactory = () => {
                    const scope = getScope();
                    const scopekeys = Object.keys(scope);
                    const scopevalues = Object.values(scope);

                    const wrappedcode = `
                    ${transpiledcode}
                    return ${lastfunc};
                `;

                    const factory = new Function(...scopekeys, wrappedcode);
                    return factory(...scopevalues);
                };

                const BuiltComponent = ComponentFactory();

                if (!BuiltComponent || typeof BuiltComponent !== 'function') {
                    throw new Error('No valid component found.');
                }

                setUserComponent(() => BuiltComponent);
                seterror(null);
                setisbuilding(false);

            } catch (err: any) {
                seterror({
                    message: err.message || 'Unknown error',
                    stack: err.stack
                });
                setUserComponent(null);
                setisbuilding(false);
            }
        };

        runBuild();
    }, [code, babelloaded, codeHash]);

    if (!babelloaded || isbuilding) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[--bg-base]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-accent border-t-transparent  animate-spin mx-auto mb-4" />
                    <p className="text-sm text-[--text-muted] font-medium">{!babelloaded ? 'Loading transpiler...' : 'Building app...'}</p>
                    <p className="text-xs text-[--text-muted] mt-1">{appname || 'User App'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[--bg-base] p-6">
                <div className="max-w-md text-center">
                    <div className="w-14 h-14 bg-overlay flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-lg font-bold text-pastel-red mb-2">Compilation Error</h2>
                    <p className="text-sm text-pastel-red mb-4 font-mono break-words">{error.message}</p>
                    {error.stack && (
                        <details className="text-left">
                            <summary className="text-xs text-[--text-muted] cursor-pointer mb-2">Stack trace</summary>
                            <pre className="text-[10px] bg-overlay p-3 overflow-auto max-h-32 text-pastel-red">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }

    if (!UserComponent) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[--bg-base] p-6">
                <div className="text-center">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <h2 className="font-bold text-pastel-yellow mb-2">No Component Found</h2>
                    <p className="text-sm text-[--text-muted]">
                        Create a function like <code className="bg-overlay px-1">function App() {'{}'}</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary appname={appname}>
            <div className="h-full w-full overflow-auto bg-[--bg-base] text-[--text-color]">
                <UserComponent appData={{ name: appname, icon: appicon || '🚀', fileid }} />
            </div>
        </ErrorBoundary>
    );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; appname: string }, { haserror: boolean; error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = { haserror: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { haserror: true, error };
    }

    componentDidCatch() {
    }

    render() {
        if (this.state.haserror) {
            return (
                <div className="h-full w-full flex items-center justify-center bg-[--bg-base] p-6">
                    <div className="max-w-md text-center">
                        <div className="w-14 h-14 bg-overlay flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">💥</span>
                        </div>
                        <h2 className="text-lg font-bold text-pastel-red mb-2">Runtime Error</h2>
                        <p className="text-sm text-pastel-red font-mono break-words">
                            {this.state.error?.message || 'Unknown error'}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
