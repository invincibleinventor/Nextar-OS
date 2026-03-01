'use client';
import React from 'react';
import Image from 'next/image';
import { IconType } from 'react-icons';
import {
    LuFolder, LuSettings, LuCode, LuMail, LuCalendarDays,
    LuFileText, LuStickyNote, LuMusic, LuCalculator,
    LuShoppingBag, LuTerminal, LuImages, LuGlobe,
    LuCloudDownload, LuFile, LuBookOpen, LuChartColumn,
    LuLayoutGrid, LuTrash2, LuCircleHelp, LuInfo,
    LuRocket, LuLaptop, LuLightbulb, LuListChecks,
    LuPlug, LuLayoutTemplate, LuClock, LuCloudRain,
    LuBell, LuClapperboard, LuPaintbrush, LuContact
} from 'react-icons/lu';
import { useIsClay } from '../hooks/useIsClay';
import { useSettings } from '../SettingsContext';

interface TintedAppIconProps {
    appId: string;
    appName: string;
    originalIcon: string;
    size?: number;
    className?: string;
    useFill?: boolean;
}

/* Classic pastel colors (non-clay mode) */
const appIconMap: Record<string, { icon: IconType; bg: string; shade: number }> = {
    'explorer': { icon: LuFolder, bg: 'var(--pastel-blue)', shade: 0 },
    'settings': { icon: LuSettings, bg: 'var(--text-muted)', shade: 2 },
    'code': { icon: LuCode, bg: 'var(--pastel-green)', shade: 1 },
    'mail': { icon: LuMail, bg: 'var(--pastel-blue)', shade: 0 },
    'calendar': { icon: LuCalendarDays, bg: 'var(--pastel-red)', shade: 1 },
    'textedit': { icon: LuFileText, bg: 'var(--pastel-yellow)', shade: 2 },
    'notes': { icon: LuStickyNote, bg: 'var(--pastel-peach)', shade: 0 },
    'music': { icon: LuMusic, bg: 'var(--pastel-pink)', shade: 1 },
    'calculator': { icon: LuCalculator, bg: 'var(--pastel-teal)', shade: 2 },
    'appstore': { icon: LuShoppingBag, bg: 'var(--pastel-blue)', shade: 0 },
    'terminal': { icon: LuTerminal, bg: 'var(--bg-overlay)', shade: 2 },
    'photos': { icon: LuImages, bg: 'var(--pastel-mauve)', shade: 1 },
    'browser': { icon: LuGlobe, bg: 'var(--pastel-blue)', shade: 0 },
    'welcome': { icon: LuCloudDownload, bg: 'var(--pastel-blue)', shade: 1 },
    'fileviewer': { icon: LuFile, bg: 'var(--pastel-lavender)', shade: 2 },
    'apidocs': { icon: LuBookOpen, bg: 'var(--pastel-teal)', shade: 1 },
    'systemmonitor': { icon: LuChartColumn, bg: 'var(--pastel-peach)', shade: 0 },
    'launchpad-item': { icon: LuLayoutGrid, bg: 'var(--pastel-lavender)', shade: 1 },
    'trash-folder': { icon: LuTrash2, bg: 'var(--text-muted)', shade: 2 },
    'aboutnextaros': { icon: LuCircleHelp, bg: 'var(--pastel-pink)', shade: 0 },
    'getinfo': { icon: LuInfo, bg: 'var(--text-muted)', shade: 2 },
    'projectdashboard': { icon: LuRocket, bg: 'var(--pastel-green)', shade: 0 },
    'hackathonworkspace': { icon: LuLaptop, bg: 'var(--pastel-blue)', shade: 1 },
    'ideaboard': { icon: LuLightbulb, bg: 'var(--pastel-yellow)', shade: 0 },
    'shipchecklist': { icon: LuListChecks, bg: 'var(--pastel-teal)', shade: 1 },
    'apiplayground': { icon: LuPlug, bg: 'var(--pastel-teal)', shade: 2 },
    'templatesmanager': { icon: LuLayoutTemplate, bg: 'var(--pastel-peach)', shade: 0 },
    'clock': { icon: LuClock, bg: 'var(--pastel-peach)', shade: 1 },
    'weather': { icon: LuCloudRain, bg: 'var(--pastel-blue)', shade: 0 },
    'reminders': { icon: LuBell, bg: 'var(--pastel-red)', shade: 1 },
    'videoplayer': { icon: LuClapperboard, bg: 'var(--pastel-mauve)', shade: 2 },
    'paint': { icon: LuPaintbrush, bg: 'var(--pastel-green)', shade: 0 },
    'contacts': { icon: LuContact, bg: 'var(--pastel-teal)', shade: 1 },
};

/* Clay mode: accent-tinted monochrome gradients (3 shade levels)
   Light: lighter shades (mixed with white)
   Dark: darker shades (mixed with black) */
const shadeGradientsLight: Record<number, { from: string; to: string }> = {
    0: {
        from: 'color-mix(in srgb, var(--icon-tint) 62%, white)',
        to: 'color-mix(in srgb, var(--icon-tint) 78%, white)',
    },
    1: {
        from: 'color-mix(in srgb, var(--icon-tint) 72%, white)',
        to: 'color-mix(in srgb, var(--icon-tint) 88%, white)',
    },
    2: {
        from: 'color-mix(in srgb, var(--icon-tint) 85%, white)',
        to: 'var(--icon-tint)',
    },
};
const shadeGradientsDark: Record<number, { from: string; to: string }> = {
    0: {
        from: 'color-mix(in srgb, var(--icon-tint) 75%, #2a2a32)',
        to: 'color-mix(in srgb, var(--icon-tint) 88%, #2a2a32)',
    },
    1: {
        from: 'color-mix(in srgb, var(--icon-tint) 82%, #2a2a32)',
        to: 'color-mix(in srgb, var(--icon-tint) 94%, #2a2a32)',
    },
    2: {
        from: 'color-mix(in srgb, var(--icon-tint) 90%, #2a2a32)',
        to: 'var(--icon-tint)',
    },
};

const excludedApps: string[] = ['portfolio'];

export default function TintedAppIcon({ appId, appName, originalIcon, size = 40, className = '', useFill = true }: TintedAppIconProps) {
    const clay = useIsClay();
    const { icontintmode } = useSettings();
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    if (excludedApps.includes(appId)) {
        return useFill ? (
            <Image src={originalIcon} alt={appName} fill sizes="96px" className={`ease-in-out transition-all duration-200 object-cover ${className}`} draggable={false} />
        ) : (
            <Image src={originalIcon} alt={appName} width={size} height={size} className={`ease-in-out transition-all duration-200 object-cover ${className}`} draggable={false} />
        );
    }

    const entry = appIconMap[appId];

    if (!entry) {
        return useFill ? (
            <Image src={originalIcon} alt={appName} fill sizes="96px" className={`ease-in-out transition-all duration-200 object-cover ${className}`} draggable={false} />
        ) : (
            <Image src={originalIcon} alt={appName} width={size} height={size} className={`ease-in-out transition-all duration-200 object-cover ${className}`} draggable={false} />
        );
    }

    const Icon = entry.icon;
    const borderRadius = Math.round(size * 0.22);

    /* Clay: accent-tinted gradient. Classic: individual pastel color.
       Modes: light/dark/twilight/adaptive = monochrome (--icon-tint)
       coloured-light/coloured-dark = per-app individual colors */
    const isColoured = icontintmode === 'coloured-light' || icontintmode === 'coloured-dark';
    const useDarkGradients = icontintmode === 'dark' || icontintmode === 'coloured-dark' || (!['light', 'coloured-light'].includes(icontintmode) && isDark);

    let bg: string;
    let shadow: string | undefined;
    if (!clay) {
        bg = entry.bg;
    } else if (isColoured) {
        // Per-app individual color gradients
        const appColor = entry.bg;
        const mixTarget = useDarkGradients ? '#2a2a32' : 'white';
        const strengths = useDarkGradients
            ? [[75, 88], [82, 94], [90, 100]] as const
            : [[62, 78], [72, 88], [85, 100]] as const;
        const [fromStr, toStr] = strengths[entry.shade] || strengths[0];
        const from = `color-mix(in srgb, ${appColor} ${fromStr}%, ${mixTarget})`;
        const to = toStr === 100 ? appColor : `color-mix(in srgb, ${appColor} ${toStr}%, ${mixTarget})`;
        bg = `linear-gradient(135deg, ${from}, ${to})`;
        shadow = `0 1px 4px color-mix(in srgb, ${appColor} 15%, rgba(0,0,0,0.08))`;
    } else {
        // Monochrome --icon-tint gradients
        const gradients = useDarkGradients ? shadeGradientsDark : shadeGradientsLight;
        const g = gradients[entry.shade] || gradients[0];
        bg = `linear-gradient(135deg, ${g.from}, ${g.to})`;
        shadow = `0 1px 4px color-mix(in srgb, var(--icon-tint) 15%, rgba(0,0,0,0.08))`;
    }

    if (useFill) {
        return (
            <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ borderRadius: clay ? borderRadius : undefined, boxShadow: shadow }}>
                <div className="absolute inset-0" style={{ background: bg }} />
                {clay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="text-white drop-shadow-sm w-[50%] h-[50%]" />
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: size, height: size, borderRadius: clay ? borderRadius : undefined, boxShadow: shadow }} className={`relative flex items-center justify-center overflow-hidden ${clay ? '' : 'shadow-pastel-lg'} ${className}`}>
            <div className="absolute inset-0" style={{ background: bg }} />
            {clay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />}
            <Icon className="text-white drop-shadow-sm w-[50%] h-[50%] relative z-10" />
        </div>
    );
}

export function getAppIcon(appId: string): IconType | null {
    return appIconMap[appId]?.icon || null;
}

export function getAppColor(appId: string): string {
    return appIconMap[appId]?.bg || 'var(--text-muted)';
}

export function isExcludedApp(appId: string): boolean {
    return excludedApps.includes(appId);
}
