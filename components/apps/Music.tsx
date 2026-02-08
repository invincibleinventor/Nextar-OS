'use client';
import React, { useState, useRef, useMemo } from 'react';
import { IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack, IoShuffle, IoRepeat, IoVolumeHigh, IoVolumeMedium, IoVolumeLow, IoVolumeMute, IoSearch, IoMusicalNotes, IoHeart, IoHeartOutline, IoChevronBack } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '../DeviceContext';
import { useAppPreferences } from '../AppPreferencesContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMusic } from '../MusicContext';

const formattime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Music({ windowId }: { windowId?: string }) {
    const { ismobile } = useDevice();
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
                                            <div className="text-sm text-[--text-muted] truncate">{track.artist}</div>
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
                                <div className="w-64 h-64 bg-overlay shadow-pastel-pink mb-8 flex items-center justify-center anime-glow-lg">
                                    <IoMusicalNotes className="text-pastel-pink" size={80} />
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold">{currenttrack.title}</h2>
                                    <p className="text-[--text-muted]">{currenttrack.artist}</p>
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
                                    className="w-full bg-overlay pl-10 pr-3 py-2 text-sm outline-none placeholder:text-[--text-muted] text-[--text-color] border border-[--border-color] focus:border-accent transition-colors"
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
                                        <div className={`text-sm font-medium truncate ${currenttrackindex === idx ? 'text-accent' : ''}`}>{track.title}</div>
                                        <div className="text-xs text-[--text-muted] truncate">{track.artist}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-48 h-48 mx-auto bg-overlay shadow-pastel-pink mb-6 flex items-center justify-center anime-glow-lg">
                                    <IoMusicalNotes className="text-pastel-pink" size={60} />
                                </div>
                                <h2 className="text-xl font-bold">{currenttrack.title}</h2>
                                <p className="text-[--text-muted]">{currenttrack.artist} — {currenttrack.album}</p>
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
