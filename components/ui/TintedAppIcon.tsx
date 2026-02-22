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

interface TintedAppIconProps {
    appId: string;
    appName: string;
    originalIcon: string;
    size?: number;
    className?: string;
    useFill?: boolean;
}

const appIconMap: Record<string, { icon: IconType; bg: string }> = {
    'explorer': { icon: LuFolder, bg: 'var(--pastel-blue)' },
    'settings': { icon: LuSettings, bg: 'var(--text-muted)' },
    'code': { icon: LuCode, bg: 'var(--pastel-green)' },
    'mail': { icon: LuMail, bg: 'var(--pastel-blue)' },
    'calendar': { icon: LuCalendarDays, bg: 'var(--pastel-red)' },
    'textedit': { icon: LuFileText, bg: 'var(--pastel-yellow)' },
    'notes': { icon: LuStickyNote, bg: 'var(--pastel-peach)' },
    'music': { icon: LuMusic, bg: 'var(--pastel-pink)' },
    'calculator': { icon: LuCalculator, bg: 'var(--pastel-teal)' },
    'appstore': { icon: LuShoppingBag, bg: 'var(--pastel-blue)' },
    'terminal': { icon: LuTerminal, bg: 'var(--bg-overlay)' },
    'photos': { icon: LuImages, bg: 'var(--pastel-mauve)' },
    'browser': { icon: LuGlobe, bg: 'var(--pastel-blue)' },
    'welcome': { icon: LuCloudDownload, bg: 'var(--pastel-blue)' },
    'fileviewer': { icon: LuFile, bg: 'var(--pastel-lavender)' },
    'apidocs': { icon: LuBookOpen, bg: 'var(--pastel-teal)' },
    'systemmonitor': { icon: LuChartColumn, bg: 'var(--pastel-peach)' },
    'launchpad-item': { icon: LuLayoutGrid, bg: 'var(--pastel-lavender)' },
    'trash-folder': { icon: LuTrash2, bg: 'var(--text-muted)' },
    'aboutnextaros': { icon: LuCircleHelp, bg: 'var(--pastel-pink)' },
    'getinfo': { icon: LuInfo, bg: 'var(--text-muted)' },
    'projectdashboard': { icon: LuRocket, bg: 'var(--pastel-green)' },
    'hackathonworkspace': { icon: LuLaptop, bg: 'var(--pastel-blue)' },
    'ideaboard': { icon: LuLightbulb, bg: 'var(--pastel-yellow)' },
    'shipchecklist': { icon: LuListChecks, bg: 'var(--pastel-teal)' },
    'apiplayground': { icon: LuPlug, bg: 'var(--pastel-teal)' },
    'templatesmanager': { icon: LuLayoutTemplate, bg: 'var(--pastel-peach)' },
    'clock': { icon: LuClock, bg: 'var(--pastel-peach)' },
    'weather': { icon: LuCloudRain, bg: 'var(--pastel-blue)' },
    'reminders': { icon: LuBell, bg: 'var(--pastel-red)' },
    'videoplayer': { icon: LuClapperboard, bg: 'var(--pastel-mauve)' },
    'paint': { icon: LuPaintbrush, bg: 'var(--pastel-green)' },
    'contacts': { icon: LuContact, bg: 'var(--pastel-teal)' },
};

const excludedApps: string[] = ['portfolio'];

export default function TintedAppIcon({ appId, appName, originalIcon, size = 40, className = '', useFill = true }: TintedAppIconProps) {
    if (excludedApps.includes(appId)) {
        if (useFill) {
            return (
                <Image
                    src={originalIcon}
                    alt={appName}
                    fill
                    sizes="96px"
                    className={`ease-in-out transition-all duration-200 object-cover shadow-pastel-lg ${className}`}
                    draggable={false}
                />
            );
        }
        return (
            <Image
                src={originalIcon}
                alt={appName}
                width={size}
                height={size}
                className={`ease-in-out transition-all duration-200 object-cover shadow-pastel-lg ${className}`}
                draggable={false}
            />
        );
    }

    const entry = appIconMap[appId];

    if (!entry) {
        if (useFill) {
            return (
                <Image
                    src={originalIcon}
                    alt={appName}
                    fill
                    sizes="96px"
                    className={`ease-in-out transition-all duration-200 object-cover shadow-pastel-lg ${className}`}
                    draggable={false}
                />
            );
        }
        return (
            <Image
                src={originalIcon}
                alt={appName}
                width={size}
                height={size}
                className={`ease-in-out transition-all duration-200 object-cover shadow-pastel-lg ${className}`}
                draggable={false}
            />
        );
    }

    const Icon = entry.icon;
    const bgColor = entry.bg;

    if (useFill) {
        return (
            <div className={`absolute inset-0 overflow-hidden shadow-pastel-lg ${className}`}>
                <div
                    className="absolute inset-0"
                    style={{ background: bgColor }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="text-white drop-shadow-sm w-[50%] h-[50%]" />
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center overflow-hidden shadow-pastel-lg">
            <div
                className={`absolute ${className}`}
                style={{
                    width: size,
                    height: size,
                    background: bgColor,
                }}
            />
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
