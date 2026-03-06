'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type IconTintMode = 'light' | 'dark' | 'twilight' | 'adaptive' | 'coloured-light' | 'coloured-dark';
export type AccentMode = 'light' | 'dark' | 'twilight' | 'adaptive';
export type IconPack = 'phosphor' | 'papirus';

interface SettingsContextType {
    reducemotion: boolean;
    setreducemotion: (value: boolean) => void;
    reducetransparency: boolean;
    setreducetransparency: (value: boolean) => void;
    soundeffects: boolean;
    setsoundeffects: (value: boolean) => void;
    wallpaperurl: string;
    setwallpaperurl: (value: string) => void;
    accentcolor: string;
    setaccentcolor: (value: string) => void;
    islightbackground: boolean;
    inverselabelcolor: boolean;
    setinverselabelcolor: (value: boolean) => void;
    icontintmode: IconTintMode;
    seticontintmode: (value: IconTintMode) => void;
    iconpack: IconPack;
    seticonpack: (value: IconPack) => void;
    accentmode: AccentMode;
    setaccentmode: (value: AccentMode) => void;
    wallpaperdominantcolor: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [reducemotion, setreducemotion] = useState(false);
    const [reducetransparency, setreducetransparency] = useState(false);
    const [soundeffects, setsoundeffects] = useState(false);
    const [wallpaperurl, setwallpaperurl] = useState('/wallpaper-1.jpg');
    const [accentcolor, setaccentcolor] = useState('#e78284');
    const [islightbackground, setislightbackground] = useState(false);
    const [inverselabelcolor, setinverselabelcolor] = useState(false);
    const [icontintmode, seticontintmode] = useState<IconTintMode>('coloured-dark');
    const [iconpack, seticonpack] = useState<IconPack>('phosphor');
    const [accentmode, setaccentmode] = useState<AccentMode>('adaptive');
    const [wallpaperdominantcolor, setwallpaperdominantcolor] = useState('#e78284');

    const { isGuest } = useAuth();

    const analyzebrightness = useCallback((url: string) => {
        if (typeof window === 'undefined') return;

        const trycanvasanalysis = (imgel: HTMLImageElement): boolean => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return false;

                // Higher resolution for better color accuracy
                const samplesize = 128;
                canvas.width = samplesize;
                canvas.height = samplesize;
                ctx.drawImage(imgel, 0, 0, samplesize, samplesize);

                const imagedata = ctx.getImageData(0, 0, samplesize, samplesize);
                const data = imagedata.data;

                let totalluminance = 0;
                const pixelcount = data.length / 4;
                const cx = samplesize / 2, cy = samplesize / 2;
                const maxDist = Math.sqrt(cx * cx + cy * cy);

                // RGB to HSL helper
                const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
                    const rn = r / 255, gn = g / 255, bn = b / 255;
                    const cmax = Math.max(rn, gn, bn), cmin = Math.min(rn, gn, bn);
                    const d = cmax - cmin;
                    const l = (cmax + cmin) / 2;
                    if (d === 0) return [0, 0, l];
                    const s = d / (1 - Math.abs(2 * l - 1));
                    let h = 0;
                    if (cmax === rn) h = ((gn - bn) / d) % 6;
                    else if (cmax === gn) h = (bn - rn) / d + 2;
                    else h = (rn - gn) / d + 4;
                    h = ((h * 60) + 360) % 360;
                    return [h, s, l];
                };

                // HSL to hex helper
                const hslToHex = (h: number, s: number, l: number): string => {
                    const c = (1 - Math.abs(2 * l - 1)) * s;
                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                    const m = l - c / 2;
                    let r1 = 0, g1 = 0, b1 = 0;
                    if (h < 60) { r1 = c; g1 = x; }
                    else if (h < 120) { r1 = x; g1 = c; }
                    else if (h < 180) { g1 = c; b1 = x; }
                    else if (h < 240) { g1 = x; b1 = c; }
                    else if (h < 300) { r1 = x; b1 = c; }
                    else { r1 = c; b1 = x; }
                    const fr = Math.round((r1 + m) * 255);
                    const fg = Math.round((g1 + m) * 255);
                    const fb = Math.round((b1 + m) * 255);
                    return `#${fr.toString(16).padStart(2, '0')}${fg.toString(16).padStart(2, '0')}${fb.toString(16).padStart(2, '0')}`;
                };

                // Collect weighted color pixels with perceptual filtering
                // Dark pixels need much higher saturation to be considered "colorful"
                type WPixel = { r: number; g: number; b: number; w: number };
                const colorPixels: WPixel[] = [];
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    totalluminance += 0.299 * r + 0.587 * g + 0.114 * b;

                    const [, s, l] = rgbToHsl(r, g, b);
                    // Skip extremes
                    if (l < 0.05 || l > 0.95) continue;
                    // Adaptive saturation threshold: dark pixels need much more saturation
                    const minSat = l < 0.2 ? 0.4 : l < 0.35 ? 0.25 : 0.12;
                    if (s < minSat) continue;

                    // Center-weighted
                    const px = (i / 4) % samplesize;
                    const py = Math.floor((i / 4) / samplesize);
                    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
                    const centerWeight = 1 + 0.3 * (1 - dist / maxDist);
                    // Vibrancy: massively favor high-saturation mid-lightness pixels
                    const vibrancyWeight = s * s * (l > 0.15 && l < 0.85 ? 2.0 : 0.5);

                    colorPixels.push({ r, g, b, w: centerWeight * vibrancyWeight });
                }

                const avgbrightness = totalluminance / pixelcount;
                const islight = avgbrightness > 128;
                setislightbackground(islight);

                // Weighted median-cut quantization into 16 buckets
                type Box = { pixels: WPixel[]; totalWeight: number };
                const makeBox = (pixels: WPixel[]): Box => ({
                    pixels,
                    totalWeight: pixels.reduce((s, p) => s + p.w, 0)
                });
                const medianCut = (box: Box): [Box, Box] => {
                    const px = box.pixels;
                    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
                    for (const p of px) {
                        if (p.r < rMin) rMin = p.r; if (p.r > rMax) rMax = p.r;
                        if (p.g < gMin) gMin = p.g; if (p.g > gMax) gMax = p.g;
                        if (p.b < bMin) bMin = p.b; if (p.b > bMax) bMax = p.b;
                    }
                    const rR = rMax - rMin, gR = gMax - gMin, bR = bMax - bMin;
                    const ch = rR >= gR && rR >= bR ? 'r' : gR >= bR ? 'g' : 'b';
                    px.sort((a, b) => a[ch] - b[ch]);
                    // Split at weight midpoint for better balance
                    const halfWeight = box.totalWeight / 2;
                    let cumWeight = 0;
                    let splitIdx = Math.floor(px.length / 2);
                    for (let i = 0; i < px.length; i++) {
                        cumWeight += px[i].w;
                        if (cumWeight >= halfWeight) { splitIdx = Math.max(1, i); break; }
                    }
                    return [makeBox(px.slice(0, splitIdx)), makeBox(px.slice(splitIdx))];
                };

                let boxes: Box[] = colorPixels.length > 0 ? [makeBox(colorPixels)] : [];
                // 4 iterations → up to 16 buckets
                for (let iter = 0; iter < 4 && boxes.length < 16; iter++) {
                    const next: Box[] = [];
                    for (const box of boxes) {
                        if (box.pixels.length >= 2) {
                            const [a, b] = medianCut(box);
                            next.push(a, b);
                        } else {
                            next.push(box);
                        }
                    }
                    boxes = next;
                }

                // Score each bucket: strongly favor vibrancy over sheer volume
                let bestHex = '#8caaee';
                let bestScore = -1;
                for (const box of boxes) {
                    if (box.pixels.length === 0) continue;
                    let wr = 0, wg = 0, wb = 0, tw = 0;
                    for (const p of box.pixels) {
                        wr += p.r * p.w; wg += p.g * p.w; wb += p.b * p.w;
                        tw += p.w;
                    }
                    const ar = wr / tw, ag = wg / tw, ab = wb / tw;
                    const [h, s, l] = rgbToHsl(ar, ag, ab);

                    // Score: saturation^3 * sqrt(weight) * lightness bonus
                    // Cube saturation to massively favor vibrant clusters
                    // Square root weight so a small vivid cluster beats a huge dull one
                    const lBonus = l > 0.2 && l < 0.8 ? 1.0 : 0.3;
                    const score = Math.sqrt(tw) * (s * s * s) * lBonus;

                    if (score > bestScore) {
                        bestScore = score;
                        // Normalize output to mid-range lightness and good saturation
                        const outS = Math.max(0.45, Math.min(0.75, s));
                        const outL = Math.max(0.38, Math.min(0.52, l < 0.3 ? 0.42 : l > 0.7 ? 0.48 : l));
                        bestHex = hslToHex(h, outS, outL);
                    }
                }
                setwallpaperdominantcolor(bestHex);

                try {
                    const map = JSON.parse(localStorage.getItem('bgBrightnessMap') || '{}');
                    map[url] = islight;
                    localStorage.setItem('bgBrightnessMap', JSON.stringify(map));
                    localStorage.setItem('wallpaperDominantColor', bestHex);
                } catch {}
                return true;
            } catch {
                return false;
            }
        };

        const usecached = () => {
            try {
                const map = JSON.parse(localStorage.getItem('bgBrightnessMap') || '{}');
                if (map[url] !== undefined) {
                    setislightbackground(map[url]);
                }
                const cachedColor = localStorage.getItem('wallpaperDominantColor');
                if (cachedColor) setwallpaperdominantcolor(cachedColor);
            } catch {
                setislightbackground(false);
            }
        };

        const issameorigin = url.startsWith('/') || url.startsWith(window.location.origin);

        if (issameorigin) {
            const img = new Image();
            img.onload = () => {
                if (!trycanvasanalysis(img)) {
                    usecached();
                }
            };
            img.onerror = () => usecached();
            img.src = url;
        } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if (!trycanvasanalysis(img)) {
                    usecached();
                }
            };
            img.onerror = () => {
                const img2 = new Image();
                img2.onload = () => {
                    if (!trycanvasanalysis(img2)) {
                        usecached();
                    }
                };
                img2.onerror = () => usecached();
                img2.src = url;
            };
            img.src = url;
        }
    }, []);

    useEffect(() => {
        analyzebrightness(wallpaperurl);
    }, [wallpaperurl, analyzebrightness]);

    useEffect(() => {
        setwallpaperurl('/wallpaper-1.jpg');

        if (isGuest) return;

        const storedMotion = localStorage.getItem('reduceMotion');
        const storedTransparency = localStorage.getItem('reduceTransparency');
        const storedSounds = localStorage.getItem('soundEffects');
        const storedWallpaper = localStorage.getItem('wallpaperUrl');
        const storedAccent = localStorage.getItem('accentColor');
        const storedInverse = localStorage.getItem('inverseLabelColor');

        if (storedMotion) setreducemotion(JSON.parse(storedMotion));
        if (storedTransparency) setreducetransparency(JSON.parse(storedTransparency));
        if (storedSounds) setsoundeffects(JSON.parse(storedSounds));
        if (storedWallpaper) setwallpaperurl(storedWallpaper);
        if (storedAccent) setaccentcolor(storedAccent);
        if (storedInverse) setinverselabelcolor(JSON.parse(storedInverse));
        const storedTintMode = localStorage.getItem('iconTintMode');
        if (storedTintMode) seticontintmode(storedTintMode as IconTintMode);
        const storedIconPack = localStorage.getItem('iconPack');
        if (storedIconPack) seticonpack(storedIconPack as IconPack);
        const storedAccentMode = localStorage.getItem('accentMode');
        if (storedAccentMode) setaccentmode(storedAccentMode as AccentMode);
        const storedDomColor = localStorage.getItem('wallpaperDominantColor');
        if (storedDomColor) setwallpaperdominantcolor(storedDomColor);
    }, [isGuest]);

    const updatereducemotion = (value: boolean) => {
        setreducemotion(value);
        if (!isGuest) localStorage.setItem('reduceMotion', JSON.stringify(value));
    };

    const updatereducetransparency = (value: boolean) => {
        setreducetransparency(value);
        if (!isGuest) localStorage.setItem('reduceTransparency', JSON.stringify(value));
    };

    const updatesoundeffects = (value: boolean) => {
        setsoundeffects(value);
        if (!isGuest) localStorage.setItem('soundEffects', JSON.stringify(value));
    };

    const updatewallpaperurl = (value: string) => {
        setwallpaperurl(value);
        if (!isGuest) localStorage.setItem('wallpaperUrl', value);
    };

    const updateaccentcolor = (value: string) => {
        setaccentcolor(value);
        if (!isGuest) localStorage.setItem('accentColor', value);
    };

    const updateinverselabelcolor = (value: boolean) => {
        setinverselabelcolor(value);
        if (!isGuest) localStorage.setItem('inverseLabelColor', JSON.stringify(value));
    };

    const updateicontintmode = (value: IconTintMode) => {
        seticontintmode(value);
        if (!isGuest) localStorage.setItem('iconTintMode', value);
    };

    const updateiconpack = (value: IconPack) => {
        seticonpack(value);
        if (!isGuest) localStorage.setItem('iconPack', value);
    };

    const updateaccentmode = (value: AccentMode) => {
        setaccentmode(value);
        if (!isGuest) localStorage.setItem('accentMode', value);
    };

    // Compute effective accent source based on accent mode
    useEffect(() => {
        const hexToRgb = (hex: string) => {
            const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [231, 130, 132];
        };
        const rgbToHex = (r: number, g: number, b: number) =>
            `#${[r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;
        const mix = (hex: string, target: string, amount: number) => {
            const [r1, g1, b1] = hexToRgb(hex);
            const [r2, g2, b2] = hexToRgb(target);
            return rgbToHex(r1 + (r2 - r1) * amount, g1 + (g2 - g1) * amount, b1 + (b2 - b1) * amount);
        };

        const isClay = typeof document !== 'undefined' && document.documentElement.classList.contains('clay');
        let effective = accentcolor;
        switch (accentmode) {
            case 'light': effective = mix(accentcolor, '#ffffff', 0.3); break;
            case 'dark': effective = mix(accentcolor, '#000000', 0.3); break;
            case 'adaptive': effective = isClay ? wallpaperdominantcolor : accentcolor; break;
            case 'twilight': default: effective = accentcolor; break;
        }
        document.documentElement.style.setProperty('--accent-source', effective);
    }, [accentcolor, accentmode, wallpaperdominantcolor]);

    // Set --icon-tint based on icon tint mode
    useEffect(() => {
        if (icontintmode === 'adaptive' && document.documentElement.classList.contains('clay')) {
            document.documentElement.style.setProperty('--icon-tint', wallpaperdominantcolor);
        } else {
            document.documentElement.style.removeProperty('--icon-tint');
        }
    }, [icontintmode, wallpaperdominantcolor]);

    return (
        <SettingsContext.Provider value={{
            reducemotion,
            setreducemotion: updatereducemotion,
            reducetransparency,
            setreducetransparency: updatereducetransparency,
            soundeffects,
            setsoundeffects: updatesoundeffects,
            wallpaperurl,
            setwallpaperurl: updatewallpaperurl,
            accentcolor,
            setaccentcolor: updateaccentcolor,
            islightbackground,
            inverselabelcolor,
            setinverselabelcolor: updateinverselabelcolor,
            icontintmode,
            seticontintmode: updateicontintmode,
            iconpack,
            seticonpack: updateiconpack,
            accentmode,
            setaccentmode: updateaccentmode,
            wallpaperdominantcolor
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
