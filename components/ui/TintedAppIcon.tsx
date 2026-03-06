'use client';
import React from 'react';
import Image from 'next/image';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
    FolderIcon, GearSixIcon, CodeIcon, EnvelopeSimpleIcon, CalendarIcon,
    ArticleIcon, NotePencilIcon, MusicNotesIcon, CalculatorIcon,
    StorefrontIcon, TerminalWindowIcon, ImagesIcon, GlobeSimpleIcon,
    CloudArrowDownIcon, FileIcon, BookOpenTextIcon, ChartBarIcon,
    SquaresFourIcon, TrashIcon, QuestionIcon, InfoIcon,
    RocketLaunchIcon, LaptopIcon, LightbulbFilamentIcon, ListChecksIcon,
    PlugsConnectedIcon, LayoutIcon, ClockIcon, CloudRainIcon,
    BellRingingIcon, FilmSlateIcon, PaintBrushIcon, UserCircleIcon,
    MonitorPlayIcon
} from '@phosphor-icons/react';
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

/* App icon map — Phosphor Icons with fill weight for professional launcher look */
const appIconMap: Record<string, { icon: PhosphorIcon; bg: string; shade: number }> = {
    'explorer': { icon: FolderIcon, bg: 'var(--pastel-blue)', shade: 0 },
    'settings': { icon: GearSixIcon, bg: 'var(--text-muted)', shade: 2 },
    'code': { icon: CodeIcon, bg: 'var(--pastel-green)', shade: 1 },
    'mail': { icon: EnvelopeSimpleIcon, bg: 'var(--pastel-blue)', shade: 0 },
    'calendar': { icon: CalendarIcon, bg: 'var(--pastel-red)', shade: 1 },
    'textedit': { icon: ArticleIcon, bg: 'var(--pastel-yellow)', shade: 2 },
    'notes': { icon: NotePencilIcon, bg: 'var(--pastel-peach)', shade: 0 },
    'music': { icon: MusicNotesIcon, bg: 'var(--pastel-pink)', shade: 1 },
    'calculator': { icon: CalculatorIcon, bg: 'var(--pastel-teal)', shade: 2 },
    'appstore': { icon: StorefrontIcon, bg: 'var(--pastel-blue)', shade: 0 },
    'terminal': { icon: TerminalWindowIcon, bg: 'var(--bg-overlay)', shade: 2 },
    'photos': { icon: ImagesIcon, bg: 'var(--pastel-mauve)', shade: 1 },
    'browser': { icon: GlobeSimpleIcon, bg: 'var(--pastel-blue)', shade: 0 },
    'welcome': { icon: CloudArrowDownIcon, bg: 'var(--pastel-blue)', shade: 1 },
    'fileviewer': { icon: FileIcon, bg: 'var(--pastel-lavender)', shade: 2 },
    'apidocs': { icon: BookOpenTextIcon, bg: 'var(--pastel-teal)', shade: 1 },
    'systemmonitor': { icon: ChartBarIcon, bg: 'var(--pastel-peach)', shade: 0 },
    'launchpad-item': { icon: SquaresFourIcon, bg: 'var(--pastel-lavender)', shade: 1 },
    'trash-folder': { icon: TrashIcon, bg: 'var(--text-muted)', shade: 2 },
    'aboutnextaros': { icon: QuestionIcon, bg: 'var(--pastel-pink)', shade: 0 },
    'getinfo': { icon: InfoIcon, bg: 'var(--text-muted)', shade: 2 },
    'projectdashboard': { icon: RocketLaunchIcon, bg: 'var(--pastel-green)', shade: 0 },
    'hackathonworkspace': { icon: LaptopIcon, bg: 'var(--pastel-blue)', shade: 1 },
    'ideaboard': { icon: LightbulbFilamentIcon, bg: 'var(--pastel-yellow)', shade: 0 },
    'shipchecklist': { icon: ListChecksIcon, bg: 'var(--pastel-teal)', shade: 1 },
    'apiplayground': { icon: PlugsConnectedIcon, bg: 'var(--pastel-teal)', shade: 2 },
    'templatesmanager': { icon: LayoutIcon, bg: 'var(--pastel-peach)', shade: 0 },
    'clock': { icon: ClockIcon, bg: 'var(--pastel-peach)', shade: 1 },
    'weather': { icon: CloudRainIcon, bg: 'var(--pastel-blue)', shade: 0 },
    'reminders': { icon: BellRingingIcon, bg: 'var(--pastel-red)', shade: 1 },
    'videoplayer': { icon: MonitorPlayIcon, bg: 'var(--pastel-mauve)', shade: 2 },
    'paint': { icon: PaintBrushIcon, bg: 'var(--pastel-green)', shade: 0 },
    'contacts': { icon: UserCircleIcon, bg: 'var(--pastel-teal)', shade: 1 },
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

/* Clay-friendly saturated colors for coloured icon mode (not washed-out pastels) */
const clayColorMap: Record<string, string> = {
    'var(--pastel-blue)': '#4A90D9',
    'var(--pastel-green)': '#3DA66B',
    'var(--pastel-red)': '#D9534F',
    'var(--pastel-yellow)': '#D4A843',
    'var(--pastel-peach)': '#D97B4A',
    'var(--pastel-pink)': '#C964A0',
    'var(--pastel-teal)': '#3AA89E',
    'var(--pastel-mauve)': '#9B6ABF',
    'var(--pastel-lavender)': '#7B82CC',
    'var(--text-muted)': '#6E6E80',
    'var(--bg-overlay)': '#3A3A42',
};

const excludedApps: string[] = ['portfolio'];

/* iOS-style squircle (superellipse) mask — continuous curvature corners */
const SQUIRCLE_SVG = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="black" d="M0 32C0 18 0 9 5 5C9 0 18 0 32 0H68C82 0 91 0 95 5C100 9 100 18 100 32V68C100 82 100 91 95 95C91 100 82 100 68 100H32C18 100 9 100 5 95C0 91 0 82 0 68Z"/></svg>'
);
const SQUIRCLE_MASK = `url("data:image/svg+xml,${SQUIRCLE_SVG}")`;
export const squircleClip: React.CSSProperties = {
    WebkitMaskImage: SQUIRCLE_MASK,
    maskImage: SQUIRCLE_MASK,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    borderRadius: '24%', /* fallback */
};

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
        const appColor = clayColorMap[entry.bg] || entry.bg;
        const mixTarget = useDarkGradients ? '#1a1a22' : '#f0f0f4';
        const strengths = useDarkGradients
            ? [[80, 92], [86, 96], [92, 100]] as const
            : [[70, 85], [78, 92], [88, 100]] as const;
        const [fromStr, toStr] = strengths[entry.shade] || strengths[0];
        const from = `color-mix(in srgb, ${appColor} ${fromStr}%, ${mixTarget})`;
        const to = toStr === 100 ? appColor : `color-mix(in srgb, ${appColor} ${toStr}%, ${mixTarget})`;
        bg = `linear-gradient(135deg, ${from}, ${to})`;
        shadow = `0 2px 6px color-mix(in srgb, ${appColor} 25%, rgba(0,0,0,0.12))`;
    } else {
        const gradients = useDarkGradients ? shadeGradientsDark : shadeGradientsLight;
        const g = gradients[entry.shade] || gradients[0];
        bg = `linear-gradient(135deg, ${g.from}, ${g.to})`;
        shadow = `0 1px 4px color-mix(in srgb, var(--icon-tint) 15%, rgba(0,0,0,0.08))`;
    }

    const iconStyle: React.CSSProperties = { filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.15))' };

    if (useFill) {
        return (
            <div className={`absolute inset-0 overflow-hidden ${className}`} style={clay ? { ...squircleClip } : undefined}>
                <div className="absolute inset-0" style={{ background: bg }} />
                {clay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />}
                <div className="absolute inset-0 flex items-center justify-center" style={iconStyle}>
                    <Icon weight="fill" className="text-white" style={{ width: '50%', height: '50%' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: size, height: size, filter: clay && shadow ? `drop-shadow(${shadow})` : undefined }} className={`relative ${clay ? '' : 'shadow-pastel-lg'} ${className}`}>
            <div className="absolute inset-0 overflow-hidden" style={clay ? { ...squircleClip } : undefined}>
                <div className="absolute inset-0" style={{ background: bg }} />
                {clay && <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)' }} />}
                <div className="absolute inset-0 flex items-center justify-center" style={iconStyle}>
                    <Icon weight="fill" className="text-white relative z-10" style={{ width: '50%', height: '50%' }} />
                </div>
            </div>
        </div>
    );
}

export function getAppIcon(appId: string): PhosphorIcon | null {
    return appIconMap[appId]?.icon || null;
}

export function getAppColor(appId: string): string {
    return appIconMap[appId]?.bg || 'var(--text-muted)';
}

export function isExcludedApp(appId: string): boolean {
    return excludedApps.includes(appId);
}
