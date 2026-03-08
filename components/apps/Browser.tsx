'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoArrowBack, IoArrowForward, IoShareOutline, IoBookOutline, IoCopyOutline, IoLockClosedOutline, IoRefreshOutline, IoReaderOutline, IoChevronBack, IoChevronForward, IoReloadOutline, IoLockClosed, IoAddOutline, IoStarOutline, IoSearchOutline } from 'react-icons/io5';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useMenuRegistration } from '../AppMenuContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMemo, useCallback } from 'react';
import { useIsClay } from '../hooks/useIsClay';
import { LuChevronLeft, LuChevronRight, LuRefreshCw, LuHome, LuScissors, LuCopy, LuClipboardPaste, LuMousePointerClick, LuZoomIn, LuZoomOut, LuMaximize, LuPlus, LuX } from 'react-icons/lu';
import { glassButton, glassInput, glassCard, clayClasses } from '../hooks/useClayStyles';

interface browserprops {
    initialurl?: string;
    appId?: string;
    id?: string;
}

export default function Browser({ initialurl = 'https://duckduckgo.com', appId = 'browser', id }: browserprops) {
    const [url, seturl] = useState(initialurl);
    const [inputvalue, setinputvalue] = useState(initialurl);
    const { ismobile } = useDevice();
    const [isloading, setisloading] = useState(false);
    const [history, setHistory] = useState<string[]>([initialurl]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;
    const clay = useIsClay();



    const isUnsafeUrl = (urlStr: string): boolean => {
        const lower = urlStr.trim().toLowerCase();
        return lower.startsWith('javascript:') ||
            lower.startsWith('data:') ||
            lower.startsWith('vbscript:');
    };

    const navigateTo = useCallback((newUrl: string) => {
        let target = newUrl.trim();

        if (isUnsafeUrl(target)) {
            return;
        }

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

    useEffect(() => {
        if (!id) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== id) return;
            if (currentIndex > 0) { e.preventDefault(); goBack(); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [id, activewindow, currentIndex, goBack]);

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
        'go-home': () => navigateTo('https://duckduckgo.com'),
    }), [url, goBack, goForward, navigateTo]);

    const browserMenus = useMemo(() => ({
        File: [
            { title: "New Window", actionId: "new-window", shortcut: "⌘N" },
            { title: "New Tab", actionId: "new-tab", shortcut: "⌘T", icon: <LuPlus size={14} /> },
            { title: "Open Location...", actionId: "open-location", shortcut: "⌘L" },
            { separator: true },
            { title: "Close Window", actionId: "close-window", shortcut: "⌘W", icon: <LuX size={14} /> },
        ],
        Edit: [
            { title: "Undo", actionId: "undo", shortcut: "⌘Z" },
            { title: "Redo", actionId: "redo", shortcut: "⇧⌘Z" },
            { separator: true },
            { title: "Cut", actionId: "cut", shortcut: "⌘X", icon: <LuScissors size={14} /> },
            { title: "Copy", actionId: "copy", shortcut: "⌘C", icon: <LuCopy size={14} /> },
            { title: "Paste", actionId: "paste", shortcut: "⌘V", icon: <LuClipboardPaste size={14} /> },
            { title: "Select All", actionId: "select-all", shortcut: "⌘A", icon: <LuMousePointerClick size={14} /> },
        ],
        View: [
            { title: "Zoom In", actionId: "zoom-in", shortcut: "⌘+", icon: <LuZoomIn size={14} /> },
            { title: "Zoom Out", actionId: "zoom-out", shortcut: "⌘-", icon: <LuZoomOut size={14} /> },
            { title: "Actual Size", actionId: "zoom-reset", shortcut: "⌘0", icon: <LuMaximize size={14} /> },
            { separator: true },
            { title: "Reload Page", actionId: "reload", shortcut: "⌘R", icon: <LuRefreshCw size={14} /> },
        ],
        History: [
            { title: "Back", actionId: "go-back", shortcut: "⌘[", icon: <LuChevronLeft size={14} /> },
            { title: "Forward", actionId: "go-forward", shortcut: "⌘]", icon: <LuChevronRight size={14} /> },
            { title: "Home", actionId: "go-home", shortcut: "⇧⌘H", icon: <LuHome size={14} /> }
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
            <div className={`flex flex-col h-full w-full text-[--text-color] ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'}`}>
                <div className="flex-1 w-full h-full relative">
                    {url ? (
                        url.includes('github.com') ? (
                            <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${clay ? 'bg-[--bg-base]' : 'bg-surface'}`}>
                                <div className={`w-16 h-16 flex items-center justify-center mb-4 ${clay ? 'rounded-[16px]' : 'bg-overlay'}`}
                                    style={clay ? glassCard : undefined}
                                >
                                    <IoLockClosedOutline size={32} className="text-[--text-muted]" />
                                </div>
                                <h2 className="text-xl font-bold mb-2 text-[--text-color]">GitHub Security</h2>
                                <p className="text-[--text-muted] max-w-sm mb-6 text-[13px]">
                                    Browsing GitHub recursively is restricted.
                                </p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-6 py-3 text-white font-semibold text-[15px] ${clay ? `rounded-[12px] ${clayClasses.interactivePress}` : ''}`}
                                    style={{ background: 'var(--accent-color)' }}
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
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted] p-8">
                            <h1 className="text-2xl font-bold text-[--text-muted] mb-8">Favorites</h1>
                            <div className="grid grid-cols-4 gap-6">
                                {['Google', 'GitHub', 'LinkedIn', 'YouTube'].map(site => (
                                    <div key={site} className="flex flex-col items-center gap-2 cursor-pointer">
                                        <div
                                            className={`w-14 h-14 flex items-center justify-center ${clay ? 'rounded-[14px]' : 'bg-overlay'}`}
                                            style={clay ? glassCard : undefined}
                                        >
                                            <span className={`text-xl font-bold ${clay ? 'text-[--text-color]' : 'text-[--text-muted]'}`}>{site[0]}</span>
                                        </div>
                                        <span className="text-xs text-[--text-muted]">{site}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isloading && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 animate-pulse"
                            style={{ background: 'var(--accent-color)' }}
                        />
                    )}
                </div>

                <div className={`${clay ? 'border-t border-[--glass-border] bg-transparent' : 'border-t border-[--border-color] bg-surface'}`}>
                    <form onSubmit={handlenavigate} className="mx-3 my-2">
                        <div
                            className={`flex items-center px-3 h-[44px] gap-2 ${clay ? 'rounded-full' : 'bg-overlay border border-[--border-color]'}`}
                            style={clay ? glassInput : undefined}
                        >
                            <IoLockClosedOutline className="text-pastel-green text-[13px]" />
                            <input
                                type="text"
                                value={inputvalue}
                                onChange={(e) => setinputvalue(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-[15px] text-center text-[--text-color] placeholder-[--text-muted]"
                                placeholder="Search or enter website"
                            />
                            {inputvalue !== url && (
                                <button type="submit" className="font-medium text-[13px] text-[--text-color]"
                                    style={{ color: 'var(--accent-color)' }}
                                >Go</button>
                            )}
                        </div>
                    </form>

                    <div className="flex items-center justify-around py-2 pb-4">
                        {[
                            { icon: <IoArrowBack size={22} />, action: goBack },
                            { icon: <IoArrowForward size={22} />, action: goForward },
                            { icon: <IoShareOutline size={22} />, action: () => {} },
                            { icon: <IoBookOutline size={22} />, action: () => {} },
                            { icon: <IoCopyOutline size={22} />, action: () => {} },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                className={`p-3 ${clay ? `rounded-[12px] hover:bg-[--bg-glass-hover] ${clayClasses.interactivePress}` : ''}`}
                                style={{ color: 'var(--accent-color)' }}
                                onClick={btn.action}
                            >
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const neoNavBtn = clay
        ? `w-[30px] h-[30px] rounded-[10px] flex items-center justify-center transition-all ${clayClasses.interactivePress} hover:scale-105 text-[--text-muted] hover:text-[--text-color]`
        : 'hover:text-[--text-color] transition text-[--text-muted]';
    const neoNavStyle: React.CSSProperties | undefined = clay
        ? glassButton
        : undefined;

    return (
        <div className={`flex flex-col h-full w-full text-[--text-color] overflow-hidden relative ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono shadow-pastel'}`}>
            {/* Toolbar */}
            <div
                className={`flex items-center shrink-0 z-20 draggable-area ${clay
                    ? 'h-[52px] px-5 gap-3 border-b border-[--glass-border]'
                    : 'h-12 bg-surface border-b border-[--border-color] px-4 gap-4'
                }`}
            >
                <div className={`flex ${clay ? 'gap-2' : 'gap-4'}`}>
                    <button onClick={goBack} className={neoNavBtn} style={neoNavStyle}><IoChevronBack size={16} /></button>
                    <button onClick={goForward} className={neoNavBtn} style={neoNavStyle}><IoChevronForward size={16} /></button>
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
                    className={neoNavBtn}
                    style={neoNavStyle}
                >
                    <IoReloadOutline size={14} />
                </button>

                {/* URL bar */}
                <div
                    className={`flex-1 max-w-2xl mx-auto flex items-center gap-2 relative group transition-colors ${clay
                        ? `h-[34px] px-3.5 rounded-full`
                        : 'h-8 bg-overlay border border-[--border-color] px-3 anime-focus focus-within:bg-surface'
                    }`}
                    style={clay ? glassInput : undefined}
                >
                    <IoLockClosed size={12} className="text-pastel-green" />
                    <form onSubmit={handleSearch} className="flex-1 h-full">
                        <input
                            ref={inputref}
                            className={`bg-transparent w-full h-full outline-none text-center text-[--text-color] group-focus-within:text-left focus:text-left placeholder-[--text-muted] ${clay ? 'text-[13px]' : 'text-xs'}`}
                            placeholder="Search or enter website name"
                            defaultValue={url || ''}
                            onFocus={(e) => e.target.select()}
                        />
                    </form>
                    {isloading && <div className={`absolute right-3 w-3 h-3 border-2 border-t-transparent rounded-full animate-spin`} style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }} />}
                </div>

                <div className={`flex ml-auto ${clay ? 'gap-2' : 'gap-4'}`}>
                    <button className={neoNavBtn} style={neoNavStyle}><IoShareOutline size={16} /></button>
                    <button onClick={() => setShowSidebar(!showsidebar)} className={neoNavBtn} style={neoNavStyle}><IoAddOutline size={16} /></button>
                    <button className={neoNavBtn} style={neoNavStyle}><IoCopyOutline size={16} /></button>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 relative flex">
                <div className={`flex-1 relative ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                    {url ? (
                        isloading ? (
                            <div className={`absolute inset-0 flex flex-col items-center justify-center ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base]'}`}>
                                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4"
                                    style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
                                />
                                <span className="text-[--text-muted] text-[13px]">Loading...</span>
                            </div>
                        ) : (
                            <iframe
                                src={url}
                                className="w-full h-full border-none"
                                title="Browser Browser"
                                sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                                onLoad={() => setisloading(false)}
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                            <Image src="/icons/browser.png" width={96} height={96} className={`w-24 h-24 mb-8 opacity-20 filter grayscale ${clay ? 'rounded-[20px]' : ''}`} alt="Browser" />
                            <h1 className={`text-2xl font-bold text-[--text-muted] mb-8 ${clay ? 'tracking-wide' : ''}`}>Favorites</h1>
                            <div className="grid grid-cols-4 gap-8">
                                {['Google', 'GitHub', 'LinkedIn', 'YouTube'].map(site => (
                                    <div key={site} className={`flex flex-col items-center gap-3 group cursor-pointer ${clay ? clayClasses.interactivePress : ''}`} onClick={() => handleSearch({ preventDefault: () => { }, currentTarget: { querySelector: () => ({ value: `https://${site.toLowerCase()}.com` }) } } as any)}>
                                        <div
                                            className={`w-14 h-14 flex items-center justify-center group-hover:scale-105 transition-transform ${clay ? 'rounded-[14px]' : 'bg-overlay'}`}
                                            style={clay ? glassCard : undefined}
                                        >
                                            <span className={`text-xl font-bold ${clay ? 'text-[--text-color]' : 'text-[--text-muted]'}`}>{site[0]}</span>
                                        </div>
                                        <span className={`text-xs text-[--text-muted] ${clay ? 'font-medium' : ''}`}>{site}</span>
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
