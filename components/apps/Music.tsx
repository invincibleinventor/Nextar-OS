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
        <div className="h-full w-full flex flex-col bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f1e] text-white font-sf overflow-hidden">
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
                            <div className="p-4 pt-12 flex items-center justify-between">
                                <h1 className="text-2xl font-bold">Library</h1>
                                <button
                                    onClick={() => setshowplaylist(false)}
                                    className="p-2 bg-white/10 rounded-full"
                                >
                                    <IoMusicalNotes size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto px-4 pb-32">
                                {playlist.map((track, idx) => (
                                    <div
                                        key={track.id}
                                        onClick={() => { settrackindex(idx); setshowplaylist(false); }}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${currenttrackindex === idx ? 'bg-white/10' : ''}`}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                                            <IoMusicalNotes className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{track.title}</div>
                                            <div className="text-sm text-white/60 truncate">{track.artist}</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); togglefavorite(track.id); }} className="p-2">
                                            {favorites.includes(track.id) ? <IoHeart className="text-red-500" /> : <IoHeartOutline className="text-white/40" />}
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
                            className="flex-1 flex flex-col p-6 pt-12"
                        >
                            <button onClick={() => setshowplaylist(true)} className="flex items-center gap-2 text-white/60 mb-8">
                                <IoChevronBack size={20} />
                                <span>Library</span>
                            </button>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-2xl mb-8 flex items-center justify-center">
                                    <IoMusicalNotes className="text-white/80" size={80} />
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold">{currenttrack.title}</h2>
                                    <p className="text-white/60">{currenttrack.artist}</p>
                                </div>

                                <div className="w-full mb-4" ref={progressref} onClick={handleseek}>
                                    <div className="h-1 bg-white/20 rounded-full cursor-pointer">
                                        <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-white/60 mt-1">
                                        <span>{formattime(currenttime)}</span>
                                        <span>{formattime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <button onClick={prev} className="p-3"><IoPlaySkipBack size={28} /></button>
                                    <button
                                        onClick={toggle}
                                        className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center"
                                    >
                                        {isplaying ? <IoPause size={32} /> : <IoPlay size={32} className="ml-1" />}
                                    </button>
                                    <button onClick={next} className="p-3"><IoPlaySkipForward size={28} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : (
                <div className="flex h-full">
                    <div className="w-64 border-r border-white/10 flex flex-col bg-black/20 backdrop-blur-xl">
                        <div className="p-4 pt-12">
                            <div className="relative">
                                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    placeholder="Search"
                                    className="w-full bg-white/10 rounded-lg pl-10 pr-3 py-2 text-sm outline-none placeholder-white/40"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto px-2">
                            <div className="text-xs font-semibold text-white/40 px-2 mb-2">LIBRARY</div>
                            {playlist.map((track, idx) => (
                                <div
                                    key={track.id}
                                    onClick={() => settrackindex(idx)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${currenttrackindex === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                >
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                                        <IoMusicalNotes className="text-white" size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{track.title}</div>
                                        <div className="text-xs text-white/50 truncate">{track.artist}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center">
                                <div className="w-48 h-48 mx-auto rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-2xl mb-6 flex items-center justify-center">
                                    <IoMusicalNotes className="text-white/80" size={60} />
                                </div>
                                <h2 className="text-xl font-bold">{currenttrack.title}</h2>
                                <p className="text-white/60">{currenttrack.artist} — {currenttrack.album}</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10">
                            <div className="max-w-xl mx-auto">
                                <div className="mb-4" ref={progressref} onClick={handleseek}>
                                    <div className="h-1 bg-white/20 rounded-full cursor-pointer">
                                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-white/60 mt-1">
                                        <span>{formattime(currenttime)}</span>
                                        <span>{formattime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <button onClick={toggleshuffle} className={`p-2 ${isshuffle ? 'text-pink-500' : 'text-white/60'}`}>
                                        <IoShuffle size={20} />
                                    </button>
                                    <div className="flex items-center gap-6">
                                        <button onClick={prev}><IoPlaySkipBack size={24} /></button>
                                        <button
                                            onClick={toggle}
                                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center"
                                        >
                                            {isplaying ? <IoPause size={24} /> : <IoPlay size={24} className="ml-0.5" />}
                                        </button>
                                        <button onClick={next}><IoPlaySkipForward size={24} /></button>
                                    </div>
                                    <button onClick={togglerepeat} className={`p-2 ${isrepeat ? 'text-pink-500' : 'text-white/60'}`}>
                                        <IoRepeat size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-4 justify-center">
                                    {React.createElement(volumeicon, { size: 18, className: 'text-white/60' })}
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => setvolume(Number(e.target.value))}
                                        className="w-24 accent-pink-500"
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
