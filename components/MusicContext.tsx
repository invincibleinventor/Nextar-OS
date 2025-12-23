'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface Track {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    cover: string;
    audiourl?: string;
}

const sampleplaylist: Track[] = [
    { id: '1', title: 'Midnight Dreams', artist: 'Lunar Echo', album: 'Nocturnal Vibes', duration: 234, cover: '/album1.jpg', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Electric Sunset', artist: 'Synthwave Riders', album: 'Neon Nights', duration: 198, cover: '/album2.jpg', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Ocean Waves', artist: 'Calm Waters', album: 'Relaxation', duration: 312, cover: '/album3.jpg', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: '4', title: 'Mountain High', artist: 'Nature Sounds', album: 'Earth Elements', duration: 267, cover: '/album4.jpg', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: '5', title: 'City Lights', artist: 'Urban Jazz', album: 'Metropolitan', duration: 285, cover: '/album5.jpg', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

interface MusicContextType {
    playlist: Track[];
    currenttrackindex: number;
    currenttrack: Track;
    isplaying: boolean;
    currenttime: number;
    duration: number;
    volume: number;
    isshuffle: boolean;
    isrepeat: boolean;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    next: () => void;
    prev: () => void;
    seek: (time: number) => void;
    settrackindex: (index: number) => void;
    setvolume: (vol: number) => void;
    toggleshuffle: () => void;
    togglerepeat: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlist] = useState<Track[]>(sampleplaylist);
    const [currenttrackindex, setcurrenttrackindex] = useState(0);
    const [isplaying, setisplaying] = useState(false);
    const [currenttime, setcurrenttime] = useState(0);
    const [duration, setduration] = useState(0);
    const [volume, setvolumestate] = useState(80);
    const [isshuffle, setisshuffle] = useState(false);
    const [isrepeat, setisrepeat] = useState(false);

    const audioref = useRef<HTMLAudioElement | null>(null);

    const currenttrack = playlist[currenttrackindex];

    useEffect(() => {
        if (typeof window !== 'undefined' && !audioref.current) {
            audioref.current = new Audio();
            audioref.current.volume = volume / 100;
        }
    }, []);

    useEffect(() => {
        const audio = audioref.current;
        if (!audio) return;

        audio.src = currenttrack.audiourl || '';
        audio.load();
        setcurrenttime(0);

        const handleloadedmetadata = () => {
            setduration(audio.duration || currenttrack.duration);
        };

        const handletimeupdate = () => {
            setcurrenttime(audio.currentTime);
        };

        const handleended = () => {
            handlenext();
        };

        audio.addEventListener('loadedmetadata', handleloadedmetadata);
        audio.addEventListener('timeupdate', handletimeupdate);
        audio.addEventListener('ended', handleended);

        if (isplaying) {
            audio.play().catch(() => { });
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleloadedmetadata);
            audio.removeEventListener('timeupdate', handletimeupdate);
            audio.removeEventListener('ended', handleended);
        };
    }, [currenttrackindex]);

    const play = useCallback(() => {
        const audio = audioref.current;
        if (audio) {
            audio.play().catch(() => { });
            setisplaying(true);
        }
    }, []);

    const pause = useCallback(() => {
        const audio = audioref.current;
        if (audio) {
            audio.pause();
            setisplaying(false);
        }
    }, []);

    const toggle = useCallback(() => {
        if (isplaying) {
            pause();
        } else {
            play();
        }
    }, [isplaying, play, pause]);

    const handlenext = useCallback(() => {
        if (isshuffle) {
            setcurrenttrackindex(Math.floor(Math.random() * playlist.length));
        } else if (currenttrackindex < playlist.length - 1) {
            setcurrenttrackindex(prev => prev + 1);
        } else if (isrepeat) {
            setcurrenttrackindex(0);
        } else {
            setisplaying(false);
        }
    }, [isshuffle, isrepeat, currenttrackindex, playlist.length]);

    const handleprev = useCallback(() => {
        const audio = audioref.current;
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currenttrackindex > 0) {
            setcurrenttrackindex(prev => prev - 1);
        }
    }, [currenttrackindex]);

    const seek = useCallback((time: number) => {
        const audio = audioref.current;
        if (audio) {
            audio.currentTime = time;
            setcurrenttime(time);
        }
    }, []);

    const settrackindex = useCallback((index: number) => {
        setcurrenttrackindex(index);
        setisplaying(true);
    }, []);

    const setvolume = useCallback((vol: number) => {
        setvolumestate(vol);
        const audio = audioref.current;
        if (audio) {
            audio.volume = vol / 100;
        }
    }, []);

    const toggleshuffle = useCallback(() => setisshuffle(p => !p), []);
    const togglerepeat = useCallback(() => setisrepeat(p => !p), []);

    return (
        <MusicContext.Provider value={{
            playlist,
            currenttrackindex,
            currenttrack,
            isplaying,
            currenttime,
            duration: duration || currenttrack.duration,
            volume,
            isshuffle,
            isrepeat,
            play,
            pause,
            toggle,
            next: handlenext,
            prev: handleprev,
            seek,
            settrackindex,
            setvolume,
            toggleshuffle,
            togglerepeat
        }}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (context === undefined) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
};
