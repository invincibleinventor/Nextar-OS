'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import { useFileSystem } from '../FileSystemContext';
import { useAuth } from '../AuthContext';
import { IoVideocamOutline, IoCloudUploadOutline, IoPlayOutline, IoTrashOutline } from 'react-icons/io5';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard } from '../hooks/useClayStyles';

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const VIDEO_MIMETYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export default function VideoPlayer({ appId = 'videoplayer', id, fileUrl }: { appId?: string; id?: string; fileUrl?: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hideTimer = useRef<NodeJS.Timeout | null>(null);

    const { activewindow, updatewindow, windows } = useWindows();
    const { files, uploadFile, deleteItem } = useFileSystem();
    const { user } = useAuth();
    const isActiveWindow = activewindow === id;

    const clay = useIsClay();
    const [src, setSrc] = useState<string | null>(fileUrl || null);
    const [currentVideoName, setCurrentVideoName] = useState<string>('');
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showSpeed, setShowSpeed] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const vid = videoRef.current;

    const videosFolderId = useMemo(() => {
        if (!user) return '';
        const username = user.username;
        const isGuest = username === 'guest';
        const uid = isGuest ? 'user-guest' : `user-${username}`;
        const videosFolder = files.find(f => f.name === 'Videos' && f.parent === uid);
        return videosFolder?.id || (isGuest ? 'guest-videos' : `${uid}-videos`);
    }, [user, files]);

    const vfsVideos = useMemo(() => {
        if (!videosFolderId) return [];
        return files.filter(f =>
            f.parent === videosFolderId &&
            VIDEO_MIMETYPES.includes(f.mimetype) &&
            !f.isTrash
        ).map(f => ({
            id: f.id,
            name: f.name,
            src: f.content || f.link || '',
            size: f.size,
            date: f.date,
        }));
    }, [files, videosFolderId]);

    const togglePlay = useCallback(() => {
        if (!vid) return;
        if (vid.paused) { vid.play(); setPlaying(true); } else { vid.pause(); setPlaying(false); }
    }, [vid]);

    const seek = useCallback((delta: number) => { if (vid) vid.currentTime = Math.min(duration, Math.max(0, vid.currentTime + delta)); }, [vid, duration]);
    const changeVolume = useCallback((delta: number) => { if (vid) { const v = Math.min(1, Math.max(0, volume + delta)); setVolume(v); vid.volume = v; } }, [vid, volume]);
    const toggleMute = useCallback(() => { if (vid) { vid.muted = !muted; setMuted(!muted); } }, [vid, muted]);

    const toggleFullscreen = useCallback(() => {
        if (!id || !updatewindow) return;
        const win = windows?.find((w: any) => w.id === id);
        if (win) updatewindow(id, { ismaximized: !win.ismaximized });
    }, [id, updatewindow, windows]);

    const togglePiP = useCallback(async () => {
        if (!vid) return;
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else await vid.requestPictureInPicture();
        } catch { }
    }, [vid]);

    const goToLibrary = useCallback(() => {
        setSrc(null);
        setCurrentVideoName('');
        setPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, []);

    const videoMenus = useMemo(() => ({
        Playback: [
            { title: 'Play/Pause', actionId: 'vp-toggle', shortcut: 'Space' },
            { separator: true },
            { title: 'Skip Forward 5s', actionId: 'vp-fwd', shortcut: '\u2192' },
            { title: 'Skip Back 5s', actionId: 'vp-back', shortcut: '\u2190' },
            { separator: true },
            { title: 'Mute', actionId: 'vp-mute', shortcut: 'M' },
            { title: 'Picture in Picture', actionId: 'vp-pip' },
        ],
        File: [
            { title: 'Open Video...', actionId: 'vp-open', shortcut: '\u2318O' },
            { title: 'Back to Library', actionId: 'vp-library' },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'vp-toggle': togglePlay,
        'vp-fwd': () => seek(5),
        'vp-back': () => seek(-5),
        'vp-mute': toggleMute,
        'vp-pip': togglePiP,
        'vp-open': () => fileInputRef.current?.click(),
        'vp-library': goToLibrary,
    }), [togglePlay, seek, toggleMute, togglePiP, goToLibrary]);

    useMenuRegistration(videoMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);

    useEffect(() => {
        if (!isActiveWindow) return;
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            switch (e.key) {
                case ' ': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': seek(5); break;
                case 'ArrowLeft': seek(-5); break;
                case 'ArrowUp': e.preventDefault(); changeVolume(0.1); break;
                case 'ArrowDown': e.preventDefault(); changeVolume(-0.1); break;
                case 'm': case 'M': toggleMute(); break;
                case 'f': case 'F': toggleFullscreen(); break;
                case 'Escape': if (src) goToLibrary(); break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isActiveWindow, togglePlay, seek, changeVolume, toggleMute, toggleFullscreen, goToLibrary, src]);

    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }, [playing]);

    useEffect(() => {
        if (!vid) return;
        const onTime = () => { if (!dragging) setCurrentTime(vid.currentTime); };
        const onMeta = () => setDuration(vid.duration);
        const onEnd = () => setPlaying(false);
        vid.addEventListener('timeupdate', onTime);
        vid.addEventListener('loadedmetadata', onMeta);
        vid.addEventListener('ended', onEnd);
        return () => { vid.removeEventListener('timeupdate', onTime); vid.removeEventListener('loadedmetadata', onMeta); vid.removeEventListener('ended', onEnd); };
    }, [vid, dragging]);

    useEffect(() => { if (fileUrl) setSrc(fileUrl); }, [fileUrl]);

    const handleUploadToVFS = useCallback(async (file: File) => {
        if (!file.type.startsWith('video/') || !videosFolderId) return;
        await uploadFile(file, videosFolderId);
    }, [uploadFile, videosFolderId]);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('video/')) return;
        handleUploadToVFS(file);
        const url = URL.createObjectURL(file);
        setSrc(url);
        setCurrentVideoName(file.name);
        setPlaying(false);
        setCurrentTime(0);
    }, [handleUploadToVFS]);

    const playFromVFS = useCallback((video: typeof vfsVideos[0]) => {
        setSrc(video.src);
        setCurrentVideoName(video.name);
        setPlaying(false);
        setCurrentTime(0);
    }, []);

    const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
    const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

    const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!vid || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        vid.currentTime = pct * duration;
        setCurrentTime(pct * duration);
    };

    const fmt = (s: number) => {
        if (!s || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    if (!src) {
        return (
            <div
                ref={containerRef}
                className={`flex flex-col h-full w-full text-[--text-color] overflow-hidden select-none ${clay ? 'bg-[--bg-base] font-sans' : 'bg-[--bg-base] font-mono'}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
            >
                <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={onFileInput} />

                <div
                    className={`h-[40px] flex items-center justify-between px-4 shrink-0 ${clay ? 'border-b border-[--glass-border]' : 'border-b border-[--border-color] bg-surface'}`}
                >
                    <span className="text-[13px] font-semibold">Video Library</span>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium text-white hover:opacity-90 transition-opacity ${clay ? 'rounded-[10px] active:scale-[0.97]' : ''}`}
                        style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : { background: 'var(--accent-color)' }}
                    >
                        <IoCloudUploadOutline size={14} />
                        Upload
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-[640px] mx-auto">
                        {vfsVideos.length > 0 && (
                            <>
                                <div className="text-[11px] uppercase font-semibold text-[--text-muted] pl-3 mb-2 tracking-wide">Your Videos</div>
                                <div
                                    className={`overflow-hidden mb-6 ${clay ? 'rounded-[16px]' : 'bg-overlay border border-[--border-color]'}`}
                                    style={clay ? glassCard : undefined}
                                >
                                    {vfsVideos.map((video, i) => (
                                        <div
                                            key={video.id}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-surface'} ${i < vfsVideos.length - 1 ? (clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]') : ''}`}
                                            onClick={() => playFromVFS(video)}
                                        >
                                            <div className={`w-5 h-5 flex items-center justify-center text-white shrink-0 ${clay ? 'rounded-[6px]' : ''}`} style={clay ? { background: 'var(--accent-gradient)' } : { backgroundColor: '#c6a0f6' }}>
                                                <IoPlayOutline size={12} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[13px] font-medium truncate block">{video.name}</span>
                                            </div>
                                            <span className="text-[12px] text-[--text-muted]">{video.size}</span>
                                            <span className="text-[12px] text-[--text-muted]">{video.date}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteItem(video.id); }}
                                                className={`p-1 text-[--text-muted] hover:text-pastel-red transition-colors opacity-0 group-hover:opacity-100 ${clay ? 'rounded-[6px]' : ''}`}
                                            >
                                                <IoTrashOutline size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className={`flex flex-col items-center justify-center py-16 border-2 border-dashed transition-colors ${clay ? 'rounded-[16px]' : ''} ${dragOver ? (clay ? 'border-[--glass-border]' : 'border-accent') : (clay ? 'border-[--glass-border]' : 'border-[--border-color]')}`} style={dragOver && clay ? { background: 'var(--bg-glass-hover)' } : undefined}>
                            <IoVideocamOutline size={48} className="text-[--text-muted] opacity-30 mb-4" />
                            <p className="text-[13px] font-medium text-[--text-muted]">
                                {vfsVideos.length === 0 ? 'No videos yet' : 'Add more videos'}
                            </p>
                            <p className="text-[11px] text-[--text-muted] opacity-60 mt-1">Drag & drop or click Upload</p>
                            <p className="text-[10px] text-[--text-muted] opacity-40 mt-1">MP4, WebM, OGG (max 5MB)</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            style={{ background: '#000' }}
            onMouseMove={resetHideTimer}
            onMouseLeave={() => playing && setShowControls(false)}
            onClick={togglePlay}
        >
            <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={onFileInput} />
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
            />

            <div
                className="absolute inset-x-0 bottom-0 transition-opacity duration-300"
                style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-t from-black/80 to-transparent pt-12 pb-3 px-4">
                    <div
                        className={`group relative h-1.5 cursor-pointer mb-3 hover:h-2.5 transition-all ${clay ? 'rounded-full' : ''}`}
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                        onClick={seekTo}
                        onMouseDown={() => setDragging(true)}
                        onMouseUp={() => setDragging(false)}
                    >
                        <div className={`h-full bg-pastel-blue transition-all ${clay ? 'rounded-full' : ''}`} style={{ width: `${progress}%` }} />
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity ${clay ? 'rounded-full' : ''}`}
                            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button className={`text-white/70 hover:text-white transition-colors text-xs ${clay ? 'font-sans rounded-[8px] px-2 py-0.5 hover:bg-white/10' : 'font-mono'}`} onClick={(e) => { e.stopPropagation(); goToLibrary(); }}>
                            Library
                        </button>

                        <div className="w-px h-4 bg-white/20" />

                        <button className="text-white hover:text-pastel-blue transition-colors" onClick={togglePlay}>
                            {playing ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
                            )}
                        </button>

                        <span className={`text-xs text-white/70 tabular-nums min-w-[80px] ${clay ? 'font-sans' : 'font-mono'}`}>
                            {fmt(currentTime)} / {fmt(duration)}
                        </span>

                        {currentVideoName && (
                            <span className={`text-xs text-white/50 truncate max-w-[200px] ${clay ? 'font-sans' : 'font-mono'}`}>{currentVideoName}</span>
                        )}

                        <div className="flex-1" />

                        <button className="text-white hover:text-pastel-peach transition-colors" onClick={toggleMute}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" opacity="0.6" />
                                {!muted && volume > 0 && <path d="M15.5 8.5a5 5 0 010 7" />}
                                {!muted && volume > 0.5 && <path d="M18 5a9 9 0 010 14" />}
                                {(muted || volume === 0) && <line x1="18" y1="9" x2="22" y2="15" strokeLinecap="round" />}
                                {(muted || volume === 0) && <line x1="22" y1="9" x2="18" y2="15" strokeLinecap="round" />}
                            </svg>
                        </button>
                        <input
                            type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                            onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); if (vid) { vid.volume = v; vid.muted = v === 0; } }}
                            className="w-16 h-1 accent-accent cursor-pointer"
                        />

                        <div className="relative">
                            <button className={`text-xs text-white/70 hover:text-pastel-green transition-colors px-1.5 py-0.5 ${clay ? 'font-sans rounded-[8px] hover:bg-white/10' : 'font-mono'}`} onClick={() => setShowSpeed(!showSpeed)}>
                                {speed}x
                            </button>
                            {showSpeed && (
                                <div className={`absolute bottom-8 right-0 py-1 min-w-[60px] text-center ${clay ? 'rounded-[12px] overflow-hidden' : ''}`} style={{ background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {SPEEDS.map(s => (
                                        <button key={s} className={`block w-full px-3 py-1 text-xs transition-colors ${clay ? 'font-sans rounded-[8px]' : 'font-mono'} ${s === speed ? 'text-pastel-green' : 'text-white/70 hover:text-white'}`}
                                            onClick={() => { setSpeed(s); if (vid) vid.playbackRate = s; setShowSpeed(false); }}
                                        >{s}x</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="text-white/70 hover:text-pastel-teal transition-colors" onClick={togglePiP} title="Picture in Picture">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="3" width="20" height="18" rx="2" />
                                <rect x="11" y="11" width="10" height="9" rx="1" fill="currentColor" opacity="0.3" />
                            </svg>
                        </button>

                        <button className="text-white/70 hover:text-pastel-peach transition-colors" onClick={toggleFullscreen} title="Fullscreen">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" />
                                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {!playing && showControls && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-16 h-16 flex items-center justify-center ${clay ? 'rounded-[16px]' : ''}`} style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="8,5 19,12 8,19" /></svg>
                    </div>
                </div>
            )}
        </div>
    );
}
