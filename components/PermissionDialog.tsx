'use client';

import React from 'react';
import { usePermissions } from './PermissionsContext';
import { apps } from './data';
import { Permission } from '../types/permissions';
import TintedAppIcon from './ui/TintedAppIcon';

const getPermissionDetails = (permission: Permission): { title: string; description: string; icon: string } => {
    const details: Record<string, { title: string; description: string; icon: string }> = {
        'fs.read': {
            title: 'Read Files',
            description: 'Access and read files from your filesystem',
            icon: '📖'
        },
        'fs.write': {
            title: 'Write Files',
            description: 'Create and modify files on your filesystem',
            icon: '✏️'
        },
        'fs.homeOnly': {
            title: 'Home Folder Access',
            description: 'Access files only within your home folder',
            icon: '🏠'
        },
        'fs.system': {
            title: 'System Files',
            description: 'Access system-level files (requires admin)',
            icon: '⚙️'
        },
        'system.notifications': {
            title: 'Notifications',
            description: 'Send you notifications and alerts',
            icon: '🔔'
        },
        'system.clipboard': {
            title: 'Clipboard',
            description: 'Read and write to your clipboard',
            icon: '📋'
        },
        'system.theme': {
            title: 'Theme Settings',
            description: 'Access and modify theme preferences',
            icon: '🎨'
        },
        'system.settings': {
            title: 'System Settings',
            description: 'Access and modify system settings',
            icon: '🔧'
        },
        'window.multiInstance': {
            title: 'Multiple Windows',
            description: 'Open multiple instances of this app',
            icon: '🪟'
        },
        'window.backgroundExecution': {
            title: 'Background Execution',
            description: 'Continue running when minimized',
            icon: '⏳'
        },
        'window.fullscreen': {
            title: 'Fullscreen',
            description: 'Enter fullscreen mode',
            icon: '🖥️'
        },
        'user.current': {
            title: 'User Info',
            description: 'Access your user profile information',
            icon: '👤'
        },
        'user.switch': {
            title: 'Switch Users',
            description: 'Switch between user accounts',
            icon: '👥'
        }
    };

    return details[permission] || { title: permission, description: 'Unknown permission', icon: '❓' };
};

export const PermissionDialog: React.FC = () => {
    const { pendingRequest, grantPending, denyPending } = usePermissions();

    if (!pendingRequest) return null;

    const app = apps.find(a => a.id === pendingRequest.appId);
    const permdetails = getPermissionDetails(pendingRequest.permission);

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-xl shadow-2xl w-[340px] overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center mb-4 shadow-lg">
                        {app ? (
                            <TintedAppIcon
                                appId={app.id}
                                appName={app.appname}
                                originalIcon={app.icon}
                                size={64}
                                useFill={false}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-3xl">{permdetails.icon}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        &quot;{app?.appname || pendingRequest.appId}&quot; Would Like to {permdetails.title}
                    </h2>

                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                        {permdetails.description}
                    </p>

                    <div className="mt-3 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg w-full">
                        <div className="flex items-center gap-2 justify-center">
                            <span className="text-xl">{permdetails.icon}</span>
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {pendingRequest.permission}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-700 flex">
                    <button
                        onClick={denyPending}
                        className="flex-1 py-3 text-blue-500 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Don&apos;t Allow
                    </button>
                    <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
                    <button
                        onClick={grantPending}
                        className="flex-1 py-3 text-blue-500 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Allow
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionDialog;
