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
    IoGridOutline
} from 'react-icons/io5';

interface TintedAppIconProps {
    appId: string;
    appName: string;
    originalIcon: string;
    size?: number;
    className?: string;
    useFill?: boolean;
}

const appIconMap: Record<string, IconType> = {
    'explorer': IoFolderOutline,
    'settings': IoSettingsOutline,
    'python': IoCodeSlashOutline,
    'mail': IoMailOutline,
    'calendar': IoCalendarOutline,
    'textedit': IoDocumentTextOutline,
    'notes': IoReaderOutline,
    'music': IoMusicalNotesOutline,
    'calculator': IoCalculatorOutline,
    'appstore': IoStorefrontOutline,
    'terminal': IoTerminalOutline,
    'photos': IoImagesOutline,
    'browser': IoGlobeOutline,
    'welcome': IoHomeOutline,
    'fileviewer': IoDocumentTextOutline,
    'apidocs': IoBookOutline,
    'systemmonitor': IoStatsChartOutline,
    'baladev': IoCodeSlashOutline,
    'launchpad-item': IoGridOutline,
    'trash-folder': IoTrashOutline,
    'aboutbala': IoInformationCircleOutline,
    'getinfo': IoInformationCircleOutline,
};

const excludedApps: string[] = [];

export default function TintedAppIcon({ appId, appName, originalIcon, size = 40, className = '', useFill = true }: TintedAppIconProps) {
    if (excludedApps.includes(appId)) {
        if (useFill) {
            return (
                <Image
                    src={originalIcon}
                    alt={appName}
                    fill
                    sizes="96px"
                    className={`rounded-full ease-in-out transition-all duration-200 object-cover ${className}`}
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
                className={`rounded-full ease-in-out transition-all duration-200 object-cover ${className}`}
                draggable={false}
            />
        );
    }

    const Icon = appIconMap[appId];

    if (!Icon) {
        if (useFill) {
            return (
                <Image
                    src={originalIcon}
                    alt={appName}
                    fill
                    sizes="96px"
                    className={`rounded-xl ease-in-out transition-all duration-200 object-cover ${className}`}
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
                className={`rounded-xl ease-in-out transition-all duration-200 object-cover ${className}`}
                draggable={false}
            />
        );
    }

    if (useFill) {
        return (
            <div className={`absolute inset-0 rounded-full overflow-hidden ${className}`}>
                <div
                    className="absolute dark:brightness-50 filter dark:darkiconbg lighticonbg inset-0 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="text-white drop-shadow-lg w-[50%] h-[50%]" />
                </div>
            </div>
        );
    }

    return (
        <div style={{
                width: size,
                height: size, }} className='relative flex items-center justify-center  overflow=hidden'>
        <div
            className={`rounded-full  absolute dark:brightness-50  filter dark:darkiconbg lighticonbg  ${className}`}
            style={{
                width: size,
                height: size,
                background: ''
            }}
        >
        </div>
            <Icon className="text-white drop-shadow-lg w-[50%] h-[50%]" />

        </div>
    );
}

export function getAppIcon(appId: string): IconType | null {
    return appIconMap[appId] || null;
}

export function isExcludedApp(appId: string): boolean {
    return excludedApps.includes(appId);
}
