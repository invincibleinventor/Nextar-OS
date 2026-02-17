'use client';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoShuffle, IoRepeat, IoVolumeHigh, IoVolumeMedium, IoVolumeLow, IoVolumeMute, IoSearch, IoMusicalNotes, IoHeart, IoHeartOutline, IoChevronBack } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useAppPreferences } from '../AppPreferencesContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMusic } from '../MusicContext';

const formattime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VISUALIZER_BAR_COUNT = 20;

const visualizerKeyframes = `
@keyframes visualizer-bar-bounce {
    0%, 100% { transform: scaleY(var(--bar-min)); }
    50% { transform: scaleY(var(--bar-max)); }
}
`;

const barConfigs = Array.from({ length: VISUALIZER_BAR_COUNT }, (_, i) => ({
    minScale: 0.15 + Math.random() * 0.2,
    maxScale: 0.5 + Math.random() * 0.5,
    delay: -(Math.random() * 1.8).toFixed(2),
    duration: (0.6 + Math.random() * 0.8).toFixed(2),
}));

function Visualizer({ isplaying, size }: { isplaying: boolean; size: number }) {
    const barWidth = 3;
    const totalWidth = VISUALIZER_BAR_COUNT * (barWidth + 3);
    const offsetLeft = (size - totalWidth) / 2;

    return (
        <>
            <style>{visualizerKeyframes}</style>
            <div
                className="absolute inset-0 flex items-end justify-center pointer-events-none"
                style={{ padding: '0 4px' }}
            >
                {barConfigs.map((cfg, i) => (
                    <div
                        key={i}
                        className="bg-pastel-pink"
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: `${offsetLeft + i * (barWidth + 3)}px`,
                            width: `${barWidth}px`,
                            height: '100%',
                            opacity: 0.18,
                            transformOrigin: 'bottom',
                            ['--bar-min' as string]: cfg.minScale,
                            ['--bar-max' as string]: cfg.maxScale,
                            animation: isplaying
                                ? `visualizer-bar-bounce ${cfg.duration}s ease-in-out ${cfg.delay}s infinite`
                                : 'none',
                            transform: isplaying ? undefined : `scaleY(${cfg.minScale})`,
                            transition: isplaying ? 'none' : 'transform 0.4s ease-out',
                        }}
                    />
                ))}
            </div>
        </>
    );
}

export default function Music({ windowId }: { windowId?: string }) {
    const { ismobile } = useDevice();
    const { activewindow } = useWindows();
    const { getPreference, setPreference } = useAppPreferences();

    const {
        playlist,
        currenttrackindex,
        currenttrack,
        isplaying,
        currenttime,
        duration,
        volume,
        isshuffle,
        isrepeat,
        play,
        pause,
        toggle,
        next,
        prev,
        seek,
        settrackindex,
        setvolume,
        toggleshuffle,
        togglerepeat
    } = useMusic();

    const [showplaylist, setshowplaylist] = useState(!ismobile);
    const [favorites, setfavorites] = useState<string[]>(() => {
        const saved = getPreference('music', 'favorites');
        return saved ? JSON.parse(saved) : [];
    });

    const progressref = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setPreference('music', 'favorites', JSON.stringify(favorites));
    }, [favorites, setPreference]);

    const handleseek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressref.current) return;
        const rect = progressref.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(Math.floor(percent * duration));
    };

    const togglefavorite = (id: string) => {
        setfavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const menuActions = useMemo(() => ({
        'play': play,
        'pause': pause,
        'next': next,
        'previous': prev,
        'shuffle': toggleshuffle,
        'repeat': togglerepeat
    }), [play, pause, next, prev, toggleshuffle, togglerepeat]);

    useMenuAction('music', menuActions, windowId);

    useEffect(() => {
        if (!windowId || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (!showplaylist) { e.preventDefault(); setshowplaylist(true); }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, ismobile, activewindow, showplaylist]);

    const volumeicon = volume === 0 ? IoVolumeMute : volume < 33 ? IoVolumeLow : volume < 66 ? IoVolumeMedium : IoVolumeHigh;
    const progress = duration > 0 ? (currenttime / duration) * 100 : 0;

    return (
        <div className="h-full w-full flex flex-col bg-[--bg-base] text-[--text-color] font-mono overflow-hidden">
            {ismobile ? (
                <AnimatePresence mode="wait">
                    {showplaylist ? (
                        <motion.div
                            key="playlist"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between">
                                <h1 className="text-2xl font-bold">Library</h1>
                                <button
                                    onClick={() => setshowplaylist(false)}
                                    className="p-2 bg-overlay"
                                >
                                    <IoMusicalNotes size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto px-4 pb-32">
                                {playlist.map((track, idx) => (
                                    <div
                                        key={track.id}
                                        onClick={() => { settrackindex(idx); setshowplaylist(false); }}
                                        className={`flex items-center gap-3 p-3 ${currenttrackindex === idx ? 'bg-overlay' : 'hover:bg-overlay'}`}
                                    >
                                        <div className="w-12 h-12 bg-overlay flex items-center justify-center shrink-0">
                                            <IoMusicalNotes className="text-pastel-pink" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${currenttrackindex === idx ? 'text-accent' : ''}`}>{track.title}</div>
                                            <div className="text-[13px] text-[--text-muted] truncate">{track.artist}</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); togglefavorite(track.id); }} className="p-2">
                                            {favorites.includes(track.id) ? <IoHeart className="text-pastel-red" /> : <IoHeartOutline className="text-[--text-muted]" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="player"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="flex-1 flex flex-col p-6"
                        >
                            <button onClick={() => setshowplaylist(true)} className="flex items-center gap-2 text-[--text-muted] mb-8">
                                <IoChevronBack size={20} />
                                <span>Library</span>
                            </button>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative w-64 h-64 mb-8">
                                    <Visualizer isplaying={isplaying} size={256} />
                                    <div className="absolute inset-0 bg-overlay shadow-pastel-pink flex items-center justify-center anime-glow-lg">
                                        <IoMusicalNotes className="text-pastel-pink" size={80} />
                                    </div>
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold">{currenttrack.title}</h2>
                                    <p className="text-[--text-muted]">{currenttrack.artist}</p>
                                    <p className="text-[11px] text-[--text-muted] mt-1">{currenttrackindex + 1} of {playlist.length}</p>
                                </div>

                                <div className="w-full mb-4" ref={progressref} onClick={handleseek}>
                                    <div className="h-1 bg-[--border-color] cursor-pointer">
                                        <div className="h-full bg-pastel-pink" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-[--text-muted] mt-1">
                                        <span>{formattime(currenttime)}</span>
                                        <span>{formattime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <button onClick={prev} className="p-3 text-[--text-color] hover:text-pastel-pink transition-colors"><IoPlaySkipBack size={28} /></button>
                                    <button
                                        onClick={toggle}
                                        className="w-16 h-16 bg-surface text-[--text-color] hover:text-pastel-pink flex items-center justify-center transition-colors"
                                    >
                                        {isplaying ? <IoPause size={32} /> : <IoPlay size={32} className="ml-1" />}
                                    </button>
                                    <button onClick={next} className="p-3 text-[--text-color] hover:text-pastel-pink transition-colors"><IoPlaySkipForward size={28} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : (
                <div className="flex h-full">
                    <div className="w-64 border-r border-[--border-color] flex flex-col bg-surface anime-gradient-top">
                        <div className="p-4">
                            <div className="relative">
                                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]" />
                                <input
                                    placeholder="Search"
                                    className="w-full bg-overlay pl-10 pr-3 py-2 text-[13px] outline-none placeholder:text-[--text-muted] text-[--text-color] border border-[--border-color] focus:border-accent transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto px-2">
                            <div className="text-xs font-semibold text-[--text-muted] px-2 mb-2">LIBRARY</div>
                            {playlist.map((track, idx) => (
                                <div
                                    key={track.id}
                                    onClick={() => settrackindex(idx)}
                                    className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${currenttrackindex === idx ? 'bg-overlay' : 'hover:bg-overlay'}`}
                                >
                                    <div className="w-10 h-10 bg-overlay flex items-center justify-center shrink-0">
                                        <IoMusicalNotes className="text-pastel-pink" size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[13px] font-medium truncate ${currenttrackindex === idx ? 'text-accent' : ''}`}>{track.title}</div>
                                        <div className="text-xs text-[--text-muted] truncate">{track.artist}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="relative w-48 h-48 mx-auto mb-6">
                                    <Visualizer isplaying={isplaying} size={192} />
                                    <div className="absolute inset-0 bg-overlay shadow-pastel-pink flex items-center justify-center anime-glow-lg">
                                        <IoMusicalNotes className="text-pastel-pink" size={60} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold">{currenttrack.title}</h2>
                                <p className="text-[--text-muted]">{currenttrack.artist} — {currenttrack.album}</p>
                                <p className="text-[11px] text-[--text-muted] mt-1">{currenttrackindex + 1} of {playlist.length}</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[--border-color] bg-surface">
                            <div className="max-w-xl mx-auto">
                                <div className="mb-4" ref={progressref} onClick={handleseek}>
                                    <div className="h-1 bg-[--border-color] cursor-pointer">
                                        <div className="h-full bg-pastel-pink transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-[--text-muted] mt-1">
                                        <span>{formattime(currenttime)}</span>
                                        <span>{formattime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <button onClick={toggleshuffle} className={`p-2 transition-colors ${isshuffle ? 'text-pastel-pink' : 'text-[--text-muted]'}`}>
                                        <IoShuffle size={20} />
                                    </button>
                                    <div className="flex items-center gap-6">
                                        <button onClick={prev} className="text-[--text-color] hover:text-pastel-pink transition-colors"><IoPlaySkipBack size={24} /></button>
                                        <button
                                            onClick={toggle}
                                            className="w-12 h-12 bg-overlay text-[--text-color] hover:text-pastel-pink flex items-center justify-center transition-colors anime-hover"
                                        >
                                            {isplaying ? <IoPause size={24} /> : <IoPlay size={24} className="ml-0.5" />}
                                        </button>
                                        <button onClick={next} className="text-[--text-color] hover:text-pastel-pink transition-colors"><IoPlaySkipForward size={24} /></button>
                                    </div>
                                    <button onClick={togglerepeat} className={`p-2 transition-colors ${isrepeat ? 'text-pastel-pink' : 'text-[--text-muted]'}`}>
                                        <IoRepeat size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-4 justify-center">
                                    {React.createElement(volumeicon, { size: 18, className: 'text-[--text-muted]' })}
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => setvolume(Number(e.target.value))}
                                        className="w-24 accent-pastel-blue"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
