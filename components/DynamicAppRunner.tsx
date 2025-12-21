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

interface DynamicAppProps {
    code: string;
    appname: string;
    appicon?: string;
    fileid?: string;
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

export default function DynamicAppRunner({ code, appname, appicon, fileid }: DynamicAppProps) {
    const [error, seterror] = useState<AppError | null>(null);
    const [UserComponent, setUserComponent] = useState<React.ComponentType<any> | null>(null);
    const [babelloaded, setbabelloaded] = useState(false);
    const [isbuilding, setisbuilding] = useState(true);

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
        if (typeof window !== 'undefined' && !window.Babel) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
            script.onload = () => setbabelloaded(true);
            script.onerror = () => {
                seterror({ message: 'Failed to load Babel transpiler' });
                setisbuilding(false);
            };
            document.head.appendChild(script);
        } else if (window.Babel) {
            setbabelloaded(true);
        }
    }, []);

    useEffect(() => {
        if (!babelloaded || !code) {
            if (!code) {
                seterror({ message: 'No code provided' });
                setisbuilding(false);
            }
            return;
        }

        setisbuilding(true);
        seterror(null);

        try {
            const babel = window.Babel;
            if (!babel) {
                throw new Error('Babel not loaded');
            }

            const result = babel.transform(code, {
                presets: ['react'],
                filename: 'app.jsx'
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

                    useFileSystem: () => ctx.fsctx,
                    files: ctx.fsctx.files,
                    createFile: ctx.fsctx.createFile,
                    createFolder: ctx.fsctx.createFolder,
                    updateFileContent: ctx.fsctx.updateFileContent,
                    renameItem: ctx.fsctx.renameItem,
                    deleteItem: ctx.fsctx.deleteItem,
                    moveToTrash: ctx.fsctx.moveToTrash,

                    useSettings: () => ctx.settingsctx,
                    wallpaperurl: ctx.settingsctx.wallpaperurl,
                    setwallpaperurl: ctx.settingsctx.setwallpaperurl,
                    accentcolor: ctx.settingsctx.accentcolor,
                    setaccentcolor: ctx.settingsctx.setaccentcolor,
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

                    useAuth: () => ctx.authctx,
                    user: ctx.authctx.user,
                    isGuest: ctx.authctx.isGuest,

                    useExternalApps: () => ctx.externalctx,
                    apps: ctx.externalctx.apps,
                    installApp: ctx.externalctx.installApp,
                    uninstallApp: ctx.externalctx.uninstallApp,
                    launchApp: ctx.externalctx.launchApp,
                    addRepository: ctx.externalctx.addRepository,

                    motion,
                    AnimatePresence,

                    console: {
                        log: (...args: any[]) => console.log('[UserApp]', ...args),
                        error: (...args: any[]) => console.error('[UserApp]', ...args),
                        warn: (...args: any[]) => console.warn('[UserApp]', ...args),
                        info: (...args: any[]) => console.info('[UserApp]', ...args),
                    },

                    fetch: window.fetch.bind(window),
                    setTimeout: window.setTimeout.bind(window),
                    setInterval: window.setInterval.bind(window),
                    clearTimeout: window.clearTimeout.bind(window),
                    clearInterval: window.clearInterval.bind(window),
                    requestAnimationFrame: window.requestAnimationFrame.bind(window),
                    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
                    localStorage: window.localStorage,
                    sessionStorage: window.sessionStorage,
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
            console.error('App compilation error:', err);
            seterror({
                message: err.message || 'Unknown error',
                stack: err.stack
            });
            setUserComponent(null);
            setisbuilding(false);
        }
    }, [code, babelloaded]);

    if (!babelloaded || isbuilding) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#1c1c1e]">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-500 font-medium">{!babelloaded ? 'Loading transpiler...' : 'Building app...'}</p>
                    <p className="text-xs text-gray-400 mt-1">{appname || 'User App'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-6">
                <div className="max-w-md text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Compilation Error</h2>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4 font-mono break-words">{error.message}</p>
                    {error.stack && (
                        <details className="text-left">
                            <summary className="text-xs text-gray-500 cursor-pointer mb-2">Stack trace</summary>
                            <pre className="text-[10px] bg-red-100 dark:bg-red-900/30 p-3 rounded-lg overflow-auto max-h-32 text-red-700 dark:text-red-300">
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
            <div className="h-full w-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 p-6">
                <div className="text-center">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <h2 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">No Component Found</h2>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Create a function like <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">function App() {'{}'}</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary appname={appname}>
            <div className="h-full w-full overflow-auto bg-white dark:bg-[#1c1c1e] text-black dark:text-white">
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

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('User app runtime error:', error, errorInfo);
    }

    render() {
        if (this.state.haserror) {
            return (
                <div className="h-full w-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-6">
                    <div className="max-w-md text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">💥</span>
                        </div>
                        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Runtime Error</h2>
                        <p className="text-sm text-red-600 dark:text-red-300 font-mono break-words">
                            {this.state.error?.message || 'Unknown error'}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
