'use client';

const soundUrls: Record<string, string> = {
    click: 'https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3',
    notification: 'https://cdn.freesound.org/previews/662/662411_11523868-lq.mp3',
    error: 'https://cdn.freesound.org/previews/560/560446_12517458-lq.mp3',
    success: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3',
    trash: 'https://cdn.freesound.org/previews/328/328843_5501005-lq.mp3',
    woosh: 'https://cdn.freesound.org/previews/344/344310_627227-lq.mp3',
};

const audioCache: Record<string, HTMLAudioElement> = {};

export type SoundName = 'click' | 'notification' | 'error' | 'success' | 'trash' | 'woosh';

function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const stored = localStorage.getItem('soundEffects');
        return stored ? JSON.parse(stored) : false;
    } catch {
        return false;
    }
}

export function playSound(soundName: SoundName, volume: number = 0.5) {
    if (!isSoundEnabled()) return;

    const url = soundUrls[soundName];
    if (!url) return;

    try {
        if (!audioCache[soundName]) {
            audioCache[soundName] = new Audio(url);
        }

        const audio = audioCache[soundName];
        audio.volume = Math.min(1, Math.max(0, volume));
        audio.currentTime = 0;
        audio.play().catch(() => { });
    } catch { }
}

export function preloadSounds() {
    if (typeof window === 'undefined') return;
    Object.entries(soundUrls).forEach(([name, url]) => {
        if (!audioCache[name]) {
            audioCache[name] = new Audio(url);
            audioCache[name].preload = 'auto';
        }
    });
}
