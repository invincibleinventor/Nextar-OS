'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { IoArrowBack, IoArrowForward, IoShareOutline, IoBookOutline, IoCopyOutline, IoLockClosedOutline, IoRefreshOutline, IoReaderOutline, IoChevronBack, IoChevronForward, IoReloadOutline, IoLockClosed, IoAddOutline, IoStarOutline, IoSearchOutline } from 'react-icons/io5';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useMenuRegistration } from '../AppMenuContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMemo, useCallback } from 'react';

interface browserprops {
    initialurl?: string;
    appId?: string;
    id?: string;
}

export default function Browser({ initialurl = 'https://baladev.vercel.app', appId = 'browser', id }: browserprops) {
    const [url, seturl] = useState(initialurl);
    const [inputvalue, setinputvalue] = useState(initialurl);
    const { ismobile } = useDevice();
    const [isloading, setisloading] = useState(false);
    const [history, setHistory] = useState<string[]>([initialurl]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;



    const navigateTo = useCallback((newUrl: string) => {
        let target = newUrl;
        if (!target.startsWith('http')) {
            target = 'https://' + target;
        }
        setisloading(true);
        seturl(target);
        setinputvalue(target);

        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(target);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);

        setTimeout(() => setisloading(false), 1000);
    }, [history, currentIndex]);

    const handlenavigate = (e: React.FormEvent) => {
        e.preventDefault();
        navigateTo(inputvalue);
    };

    const goBack = useCallback(() => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            seturl(history[newIndex]);
            setinputvalue(history[newIndex]);
        }
    }, [currentIndex, history]);

    const [showsidebar, setShowSidebar] = useState(true);
    const inputref = React.useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = inputref.current?.value || inputvalue;
        if (query) navigateTo(query);
    };

    const goForward = useCallback(() => {
        if (currentIndex < history.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            seturl(history[newIndex]);
            setinputvalue(history[newIndex]);
        }
    }, [currentIndex, history]);

    const menuActions = useMemo(() => ({
        'new-window': () => { },
        'new-tab': () => { },
        'open-location': () => document.querySelector<HTMLInputElement>('input[placeholder="Search or enter website name"]')?.focus(),
        'reload': () => {
            setisloading(true);
            const current = url;
            seturl('');
            setTimeout(() => {
                seturl(current);
                setisloading(false);
            }, 100);
        },
        'zoom-in': () => setZoom(z => Math.min(z + 0.1, 3)),
        'zoom-out': () => setZoom(z => Math.max(z - 0.1, 0.5)),
        'zoom-reset': () => setZoom(1),
        'go-back': () => goBack(),
        'go-forward': () => goForward(),
        'go-home': () => navigateTo('https://baladev.vercel.app'),
    }), [url, goBack, goForward, navigateTo]);

    const browserMenus = useMemo(() => ({
        File: [
            { title: "New Window", actionId: "new-window", shortcut: "⌘N" },
            { title: "New Tab", actionId: "new-tab", shortcut: "⌘T" },
            { title: "Open Location...", actionId: "open-location", shortcut: "⌘L" },
            { separator: true },
            { title: "Close Window", actionId: "close-window", shortcut: "⌘W" },
        ],
        Edit: [
            { title: "Undo", actionId: "undo", shortcut: "⌘Z" },
            { title: "Redo", actionId: "redo", shortcut: "⇧⌘Z" },
            { separator: true },
            { title: "Cut", actionId: "cut", shortcut: "⌘X" },
            { title: "Copy", actionId: "copy", shortcut: "⌘C" },
            { title: "Paste", actionId: "paste", shortcut: "⌘V" },
            { title: "Select All", actionId: "select-all", shortcut: "⌘A" },
        ],
        View: [
            { title: "Zoom In", actionId: "zoom-in", shortcut: "⌘+" },
            { title: "Zoom Out", actionId: "zoom-out", shortcut: "⌘-" },
            { title: "Actual Size", actionId: "zoom-reset", shortcut: "⌘0" },
            { separator: true },
            { title: "Reload Page", actionId: "reload", shortcut: "⌘R" },
        ],
        History: [
            { title: "Back", actionId: "go-back", shortcut: "⌘[" },
            { title: "Forward", actionId: "go-forward", shortcut: "⌘]" },
            { title: "Home", actionId: "go-home", shortcut: "⇧⌘H" }
        ]
    }), []);

    useMenuRegistration(browserMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);

    const getdomain = (urlstr: string) => {
        try {
            return new URL(urlstr).hostname.replace('www.', '');
        } catch {
            return urlstr;
        }
    };

    if (ismobile) {
        return (
            <div className="flex flex-col bg-white dark:bg-[#1e1e1e] h-full w-full text-black dark:text-white font-sf">
                <div className="flex-1 w-full h-full relative">
                    {url ? (
                        url.includes('github.com') ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-[#1e1e1e]">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
                                    <IoLockClosedOutline size={32} className="text-gray-400" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">GitHub Security</h2>
                                <p className="text-gray-500 max-w-sm mb-6 text-sm">
                                    Browsing GitHub recursively is restricted.
                                </p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-accent text-white rounded-xl font-semibold text-[15px]"
                                >
                                    Open in New Tab
                                </a>
                            </div>
                        ) : (
                            <iframe
                                src={url}
                                className="w-full h-full border-none origin-top-left"
                                style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}
                                title="Browser Browser"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                onLoad={() => setisloading(false)}
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <h1 className="text-2xl font-bold text-black/20 dark:text-white/20 mb-8">Favorites</h1>
                            <div className="grid grid-cols-4 gap-6">
                                {['Apple', 'iCloud', 'GitHub', 'LinkedIn'].map(site => (
                                    <div key={site} className="flex flex-col items-center gap-2 cursor-pointer">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-[#2d2d2d] rounded-2xl flex items-center justify-center">
                                            <span className="text-xl font-bold text-gray-400">{site[0]}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{site}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isloading && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent animate-pulse" />
                    )}
                </div>

                <div className="border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl">
                    <form onSubmit={handlenavigate} className="mx-3 my-2">
                        <div className="flex items-center bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl px-3 h-[44px] gap-2">
                            <IoLockClosedOutline className="text-gray-400 text-sm" />
                            <input
                                type="text"
                                value={inputvalue}
                                onChange={(e) => setinputvalue(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-[15px] text-center text-black dark:text-white placeholder-gray-400"
                                placeholder="Search or enter website"
                            />
                            {inputvalue !== url && (
                                <button type="submit" className="text-accent font-medium text-sm">Go</button>
                            )}
                        </div>
                    </form>

                    <div className="flex items-center justify-around py-2 pb-4">
                        <button className="p-3 text-accent">
                            <IoArrowBack size={22} />
                        </button>
                        <button className="p-3 text-accent">
                            <IoArrowForward size={22} />
                        </button>
                        <button className="p-3 text-accent">
                            <IoShareOutline size={22} />
                        </button>
                        <button className="p-3 text-accent">
                            <IoBookOutline size={22} />
                        </button>
                        <button className="p-3 text-accent">
                            <IoCopyOutline size={22} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white rounded-xl overflow-hidden shadow-2xl relative">
            <div className={`${ismobile ? '' : 'ps-20'} h-12 bg-white/40 dark:bg-[#343434]/40 backdrop-blur-lg border-b border-gray-200 dark:border-black/10 flex items-center px-4 gap-4 shrink-0 z-20 draggable-area `}>
                <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                    <button onClick={goBack} className="hover:text-black dark:hover:text-white transition"><IoChevronBack size={18} /></button>
                    <button onClick={goForward} className="hover:text-black dark:hover:text-white transition"><IoChevronForward size={18} /></button>
                </div>
                <button
                    onClick={() => {
                        setisloading(true);
                        const current = url;
                        seturl('');
                        setTimeout(() => {
                            seturl(current);
                            setisloading(false);
                        }, 100);
                    }}
                    className="hover:text-black dark:hover:text-white transition text-gray-500 dark:text-gray-400 p-1"
                >
                    <IoReloadOutline size={16} />
                </button>

                <div className="flex-1 max-w-2xl mx-auto h-8 bg-gray-200/50 dark:bg-black/20 rounded-lg flex items-center px-3 gap-2 relative group focus-within:bg-white dark:focus-within:bg-[#424242] transition-colors shadow-sm">
                    <IoLockClosed size={12} className="text-gray-400" />
                    <form onSubmit={handleSearch} className="flex-1 h-full">
                        <input
                            ref={inputref}
                            className="bg-transparent w-full h-full text-xs outline-none text-center group-focus-within:text-left focus:text-left placeholder-gray-400"
                            placeholder="Search or enter website name"
                            defaultValue={url || ''}
                            onFocus={(e) => e.target.select()}
                        />
                    </form>
                    {isloading && <div className="absolute right-3 w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                </div>

                <div className="flex gap-4 text-gray-500 dark:text-gray-400 ml-auto">
                    <button className="hover:text-black dark:hover:text-white transition"><IoShareOutline size={18} /></button>
                    <button onClick={() => setShowSidebar(!showsidebar)} className="hover:text-black dark:hover:text-white transition"><IoAddOutline size={18} /></button>
                    <button className="hover:text-black dark:hover:text-white transition"><IoCopyOutline size={18} /></button>
                </div>
            </div>

            <div className="flex-1 relative flex">

                <div className="flex-1 bg-white dark:bg-[#1e1e1e] relative">
                    {url ? (
                        isloading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#1e1e1e]">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <span className="text-gray-400 text-sm">Loading...</span>
                            </div>
                        ) : (
                            <iframe
                                src={url}
                                className="w-full h-full border-none"
                                title="Browser Browser"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                onLoad={() => setisloading(false)}
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Image src="/icons/browser.png" width={96} height={96} className="w-24 h-24 mb-8 opacity-20 filter grayscale" alt="Browser" />
                            <h1 className="text-2xl font-bold text-black/20 dark:text-white/20 mb-8">Favorites</h1>
                            <div className="grid grid-cols-4 gap-8">
                                {['Apple', 'iCloud', 'GitHub', 'LinkedIn'].map(site => (
                                    <div key={site} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleSearch({ preventDefault: () => { }, currentTarget: { querySelector: () => ({ value: `https://${site.toLowerCase()}.com` }) } } as any)}>
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-[#2d2d2d] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                                            <span className="text-xl font-bold text-gray-400">{site[0]}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{site}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
