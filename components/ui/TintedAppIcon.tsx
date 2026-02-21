'use client';
import React from 'react';
import Image from 'next/image';
import { IconType } from 'react-icons';
import {
    IoFolderOutline, IoSettingsOutline, IoCodeSlashOutline,
    IoMailOutline, IoCalendarOutline, IoDocumentTextOutline,
    IoMusicalNotesOutline, IoCalculatorOutline,
    IoTerminalOutline, IoImagesOutline, IoInformationCircleOutline,
    IoGlobeOutline, IoReaderOutline, IoStatsChartOutline,
    IoStorefrontOutline, IoBookOutline, IoHomeOutline, IoTrashOutline,
    IoGridOutline, IoDownloadOutline, IoRocketOutline,
    IoBulbOutline, IoCheckboxOutline, IoLayersOutline,
    IoTimeOutline, IoCloudOutline, IoAlarmOutline, IoVideocamOutline,
    IoBrushOutline, IoPeopleOutline, IoHelpCircleOutline
} from 'react-icons/io5';

interface TintedAppIconProps {
    appId: string;
    appName: string;
    originalIcon: string;
    size?: number;
    className?: string;
    useFill?: boolean;
}

const appIconMap: Record<string, { icon: IconType; bg: string }> = {
    'explorer': { icon: IoFolderOutline, bg: 'var(--pastel-blue)' },
    'settings': { icon: IoSettingsOutline, bg: 'var(--text-muted)' },
    'code': { icon: IoCodeSlashOutline, bg: 'var(--pastel-green)' },
    'mail': { icon: IoMailOutline, bg: 'var(--pastel-blue)' },
    'calendar': { icon: IoCalendarOutline, bg: 'var(--pastel-red)' },
    'textedit': { icon: IoDocumentTextOutline, bg: 'var(--pastel-yellow)' },
    'notes': { icon: IoReaderOutline, bg: 'var(--pastel-peach)' },
    'music': { icon: IoMusicalNotesOutline, bg: 'var(--pastel-pink)' },
    'calculator': { icon: IoCalculatorOutline, bg: 'var(--pastel-teal)' },
    'appstore': { icon: IoStorefrontOutline, bg: 'var(--pastel-blue)' },
    'terminal': { icon: IoTerminalOutline, bg: 'var(--bg-overlay)' },
    'photos': { icon: IoImagesOutline, bg: 'var(--pastel-mauve)' },
    'browser': { icon: IoGlobeOutline, bg: 'var(--pastel-blue)' },
    'welcome': { icon: IoDownloadOutline, bg: 'var(--pastel-blue)' },
    'fileviewer': { icon: IoDocumentTextOutline, bg: 'var(--pastel-lavender)' },
    'apidocs': { icon: IoBookOutline, bg: 'var(--pastel-teal)' },
    'systemmonitor': { icon: IoStatsChartOutline, bg: 'var(--pastel-peach)' },
    'launchpad-item': { icon: IoGridOutline, bg: 'var(--pastel-lavender)' },
    'trash-folder': { icon: IoTrashOutline, bg: 'var(--text-muted)' },
    'aboutnextaros': { icon: IoHelpCircleOutline, bg: 'var(--pastel-pink)' },
    'getinfo': { icon: IoInformationCircleOutline, bg: 'var(--text-muted)' },
    'projectdashboard': { icon: IoRocketOutline, bg: 'var(--pastel-green)' },
    'hackathonworkspace': { icon: IoLayersOutline, bg: 'var(--pastel-blue)' },
    'ideaboard': { icon: IoBulbOutline, bg: 'var(--pastel-yellow)' },
    'shipchecklist': { icon: IoCheckboxOutline, bg: 'var(--pastel-teal)' },
    'apiplayground': { icon: IoCodeSlashOutline, bg: 'var(--pastel-teal)' },
    'templatesmanager': { icon: IoLayersOutline, bg: 'var(--pastel-peach)' },
    'clock': { icon: IoTimeOutline, bg: 'var(--pastel-peach)' },
    'weather': { icon: IoCloudOutline, bg: 'var(--pastel-blue)' },
    'reminders': { icon: IoAlarmOutline, bg: 'var(--pastel-red)' },
    'videoplayer': { icon: IoVideocamOutline, bg: 'var(--pastel-mauve)' },
    'paint': { icon: IoBrushOutline, bg: 'var(--pastel-green)' },
    'contacts': { icon: IoPeopleOutline, bg: 'var(--pastel-teal)' },
    'python': { icon: IoTerminalOutline, bg: 'var(--pastel-yellow)' },
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
                    className={`ease-in-out transition-all duration-200 object-cover shadow-pastel ${className}`}
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
                className={`ease-in-out transition-all duration-200 object-cover shadow-pastel ${className}`}
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
                    className={`ease-in-out transition-all duration-200 object-cover shadow-pastel ${className}`}
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
                className={`ease-in-out transition-all duration-200 object-cover shadow-pastel ${className}`}
                draggable={false}
            />
        );
    }

    const Icon = entry.icon;
    const bgColor = entry.bg;

    if (useFill) {
        return (
            <div className={`absolute inset-0 overflow-hidden shadow-pastel ${className}`}>
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
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center overflow-hidden shadow-pastel">
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
