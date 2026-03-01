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
    { id: '1', title: 'Midnight Dreams', artist: 'Lunar Echo', album: 'Nocturnal Vibes', duration: 234, cover: '', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Electric Sunset', artist: 'Synthwave Riders', album: 'Neon Nights', duration: 198, cover: '', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: '3', title: 'Ocean Waves', artist: 'Calm Waters', album: 'Relaxation', duration: 312, cover: '', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: '4', title: 'Mountain High', artist: 'Nature Sounds', album: 'Earth Elements', duration: 267, cover: '', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: '5', title: 'City Lights', artist: 'Urban Jazz', album: 'Metropolitan', duration: 285, cover: '', audiourl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
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
    const pendingplayref = useRef(false);
    const handlenextref = useRef<() => void>(() => {});

    const currenttrack = playlist[currenttrackindex];

    // Lazily get or create the Audio element — ensures it's created from user gesture context on mobile
    const getaudio = useCallback(() => {
        if (!audioref.current && typeof window !== 'undefined') {
            audioref.current = new Audio();
            audioref.current.volume = volume / 100;
        }
        return audioref.current;
    }, []);

    // Keep handlenext ref up to date to avoid stale closures in event listeners
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

    handlenextref.current = handlenext;

    // Load track when index changes
    useEffect(() => {
        const audio = audioref.current;
        if (!audio) return;

        audio.src = currenttrack.audiourl || '';
        audio.load();
        setcurrenttime(0);
        setduration(0);

        const handleloadedmetadata = () => {
            setduration(audio.duration || currenttrack.duration);
        };

        const handletimeupdate = () => {
            setcurrenttime(audio.currentTime);
        };

        const handleended = () => {
            handlenextref.current();
        };

        const handleerror = () => {
            setisplaying(false);
        };

        audio.addEventListener('loadedmetadata', handleloadedmetadata);
        audio.addEventListener('timeupdate', handletimeupdate);
        audio.addEventListener('ended', handleended);
        audio.addEventListener('error', handleerror);

        // Auto-play if pending (triggered by settrackindex)
        if (pendingplayref.current) {
            pendingplayref.current = false;
            audio.play().then(() => {
                setisplaying(true);
            }).catch(() => {
                setisplaying(false);
            });
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleloadedmetadata);
            audio.removeEventListener('timeupdate', handletimeupdate);
            audio.removeEventListener('ended', handleended);
            audio.removeEventListener('error', handleerror);
        };
    }, [currenttrackindex]);

    const play = useCallback(() => {
        const audio = getaudio();
        if (audio) {
            // If no src is set yet, load the current track
            if (!audio.src || audio.src === window.location.href) {
                audio.src = playlist[currenttrackindex]?.audiourl || '';
                audio.load();
            }
            audio.play().then(() => {
                setisplaying(true);
            }).catch(() => {
                setisplaying(false);
            });
        }
    }, [getaudio, playlist, currenttrackindex]);

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

    const handleprev = useCallback(() => {
        const audio = audioref.current;
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currenttrackindex > 0) {
            pendingplayref.current = isplaying;
            setcurrenttrackindex(prev => prev - 1);
        }
    }, [currenttrackindex, isplaying]);

    const seek = useCallback((time: number) => {
        const audio = audioref.current;
        if (audio) {
            audio.currentTime = time;
            setcurrenttime(time);
        }
    }, []);

    const settrackindex = useCallback((index: number) => {
        getaudio(); // Ensure audio element exists (created from user gesture)
        pendingplayref.current = true;
        setcurrenttrackindex(index);
    }, [getaudio]);

    const setvolume = useCallback((vol: number) => {
        setvolumestate(vol);
        const audio = audioref.current;
        if (audio) {
            audio.volume = vol / 100;
        }
    }, []);

    const toggleshuffle = useCallback(() => setisshuffle(p => !p), []);
    const togglerepeat = useCallback(() => setisrepeat(p => !p), []);

    // Also handle next with pending play
    const nextwithplay = useCallback(() => {
        if (isplaying) pendingplayref.current = true;
        handlenext();
    }, [isplaying, handlenext]);

    const prevwithplay = useCallback(() => {
        const audio = audioref.current;
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (currenttrackindex > 0) {
            if (isplaying) pendingplayref.current = true;
            setcurrenttrackindex(prev => prev - 1);
        }
    }, [currenttrackindex, isplaying]);

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
            next: nextwithplay,
            prev: prevwithplay,
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
