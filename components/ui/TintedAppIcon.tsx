'use client';
import React from 'react';
import Image from 'next/image';
import { IconType } from 'react-icons';
import {
    IoFolderOutline, IoSettingsOutline, IoCodeSlashOutline,
    IoMailOutline, IoCalendarOutline, IoDocumentTextOutline,
    IoMusicalNotesOutline, IoCalculatorOutline, IoAppsOutline,
    IoTerminalOutline, IoImagesOutline, IoInformationCircleOutline,
    IoGlobeOutline, IoReaderOutline, IoStatsChartOutline,
    IoStorefrontOutline, IoBookOutline, IoHomeOutline, IoTrashOutline,
    IoGridOutline, IoDownloadOutline
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
    'explorer': { icon: IoFolderOutline, bg: '#8aadf4' },
    'settings': { icon: IoSettingsOutline, bg: '#6e738d' },
    'python': { icon: IoCodeSlashOutline, bg: '#a6da95' },
    'mail': { icon: IoMailOutline, bg: '#8aadf4' },
    'calendar': { icon: IoCalendarOutline, bg: '#ed8796' },
    'textedit': { icon: IoDocumentTextOutline, bg: '#eed49f' },
    'notes': { icon: IoReaderOutline, bg: '#f5a97f' },
    'music': { icon: IoMusicalNotesOutline, bg: '#f5bde6' },
    'calculator': { icon: IoCalculatorOutline, bg: '#8bd5ca' },
    'appstore': { icon: IoStorefrontOutline, bg: '#8aadf4' },
    'terminal': { icon: IoTerminalOutline, bg: '#24263a' },
    'photos': { icon: IoImagesOutline, bg: '#c6a0f6' },
    'browser': { icon: IoGlobeOutline, bg: '#8aadf4' },
    'welcome': { icon: IoDownloadOutline, bg: '#8aadf4' },
    'fileviewer': { icon: IoDocumentTextOutline, bg: '#b7bdf8' },
    'apidocs': { icon: IoBookOutline, bg: '#8bd5ca' },
    'systemmonitor': { icon: IoStatsChartOutline, bg: '#f5a97f' },
    'baladev': { icon: IoCodeSlashOutline, bg: '#c6a0f6' },
    'launchpad-item': { icon: IoGridOutline, bg: '#b7bdf8' },
    'trash-folder': { icon: IoTrashOutline, bg: '#6e738d' },
    'aboutbala': { icon: IoInformationCircleOutline, bg: '#8aadf4' },
    'aboutnextaros': { icon: IoHomeOutline, bg: '#f5bde6' },
    'getinfo': { icon: IoInformationCircleOutline, bg: '#6e738d' },
};

const excludedApps: string[] = ['aboutbala'];

export default function TintedAppIcon({ appId, appName, originalIcon, size = 40, className = '', useFill = true }: TintedAppIconProps) {
    if (excludedApps.includes(appId)) {
        if (useFill) {
            return (
                <Image
                    src={originalIcon}
                    alt={appName}
                    fill
                    sizes="96px"
                    className={`ease-in-out transition-all duration-200 object-cover shadow-md ${className}`}
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
                className={`ease-in-out transition-all duration-200 object-cover shadow-md ${className}`}
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
                    className={`ease-in-out transition-all duration-200 object-cover shadow-md ${className}`}
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
                className={`ease-in-out transition-all duration-200 object-cover shadow-md ${className}`}
                draggable={false}
            />
        );
    }

    const Icon = entry.icon;
    const bgColor = entry.bg;

    if (useFill) {
        return (
            <div className={`absolute inset-0 overflow-hidden shadow-md ${className}`}>
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
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center overflow-hidden shadow-md">
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
    return appIconMap[appId]?.bg || '#6e738d';
}

export function isExcludedApp(appId: string): boolean {
    return excludedApps.includes(appId);
}
