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
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-[--bg-base]/80">
            <div className="bg-surface border border-[--border-color] shadow-pastel-lg w-[340px] overflow-hidden anime-glow">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 overflow-hidden flex items-center justify-center mb-4">
                        {app ? (
                            <TintedAppIcon
                                appId={app.id}
                                appName={app.appname}
                                originalIcon={app.icon}
                                size={64}
                                useFill={false}
                            />
                        ) : (
                            <div className="w-full h-full bg-accent flex items-center justify-center">
                                <span className="text-3xl">{permdetails.icon}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-semibold text-[--text-color] mb-2">
                        &quot;{app?.appname || pendingRequest.appId}&quot; Would Like to {permdetails.title}
                    </h2>

                    <p className="text-sm text-[--text-muted] mb-1">
                        {permdetails.description}
                    </p>

                    <div className="mt-3 px-3 py-2 bg-overlay w-full">
                        <div className="flex items-center gap-2 justify-center">
                            <span className="text-xl">{permdetails.icon}</span>
                            <span className="text-sm font-medium text-[--text-muted]">
                                {pendingRequest.permission}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[--border-color] flex">
                    <button
                        onClick={denyPending}
                        className="flex-1 py-3 bg-overlay border border-[--border-color] font-medium hover:bg-overlay transition-colors text-[--text-color]"
                    >
                        Don&apos;t Allow
                    </button>
                    <div className="w-px bg-[--border-color]" />
                    <button
                        onClick={grantPending}
                        className="flex-1 py-3 bg-accent text-[--bg-base] font-semibold hover:bg-accent/80 transition-colors"
                    >
                        Allow
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionDialog;
