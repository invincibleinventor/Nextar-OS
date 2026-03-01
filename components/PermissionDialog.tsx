'use client';

import React from 'react';
import { usePermissions } from './PermissionsContext';
import { apps } from './data';
import { Permission } from '../types/permissions';
import TintedAppIcon from './ui/TintedAppIcon';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel, glassButton } from './hooks/useClayStyles';

const getPermissionDetails = (permission: Permission): { title: string; description: string; icon: string } => {
    const details: Record<string, { title: string; description: string; icon: string }> = {
        'fs.read': { title: 'Read Files', description: 'Access and read files from your filesystem', icon: '📖' },
        'fs.write': { title: 'Write Files', description: 'Create and modify files on your filesystem', icon: '✏️' },
        'fs.homeOnly': { title: 'Home Folder Access', description: 'Access files only within your home folder', icon: '🏠' },
        'fs.system': { title: 'System Files', description: 'Access system-level files (requires admin)', icon: '⚙️' },
        'system.notifications': { title: 'Notifications', description: 'Send you notifications and alerts', icon: '🔔' },
        'system.clipboard': { title: 'Clipboard', description: 'Read and write to your clipboard', icon: '📋' },
        'system.theme': { title: 'Theme Settings', description: 'Access and modify theme preferences', icon: '🎨' },
        'system.settings': { title: 'System Settings', description: 'Access and modify system settings', icon: '🔧' },
        'window.multiInstance': { title: 'Multiple Windows', description: 'Open multiple instances of this app', icon: '🪟' },
        'window.backgroundExecution': { title: 'Background Execution', description: 'Continue running when minimized', icon: '⏳' },
        'window.fullscreen': { title: 'Fullscreen', description: 'Enter fullscreen mode', icon: '🖥️' },
        'user.current': { title: 'User Info', description: 'Access your user profile information', icon: '👤' },
        'user.switch': { title: 'Switch Users', description: 'Switch between user accounts', icon: '👥' }
    };
    return details[permission] || { title: permission, description: 'Unknown permission', icon: '❓' };
};

export const PermissionDialog: React.FC = () => {
    const { pendingRequest, grantPending, denyPending } = usePermissions();
    const clay = useIsClay();

    if (!pendingRequest) return null;

    const app = apps.find(a => a.id === pendingRequest.appId);
    const permdetails = getPermissionDetails(pendingRequest.permission);

    return (
        <div
            className={`fixed inset-0 z-[950] flex items-center justify-center ${clay ? 'bg-black/20 backdrop-blur-sm' : ''}`}
            style={!clay ? { background: 'color-mix(in srgb, var(--bg-base) 80%, transparent)' } : undefined}
        >
            <div className={`w-[340px] overflow-hidden ${clay
                ? 'rounded-[28px]'
                : 'bg-surface border border-[--border-color] shadow-pastel-lg anime-glow'
            }`}
                style={clay ? {
                    ...glassPanel,
                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                    boxShadow: 'var(--shadow-xl)',
                } : undefined}
            >
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
                            <div className={`w-full h-full flex items-center justify-center ${clay ? 'rounded-[16px]' : ''}`} style={{ background: 'var(--accent-color)' }}>
                                <span className="text-3xl">{permdetails.icon}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-semibold text-[--text-color] mb-2">
                        &quot;{app?.appname || pendingRequest.appId}&quot; Would Like to {permdetails.title}
                    </h2>

                    <p className="text-[13px] text-[--text-muted] mb-1">
                        {permdetails.description}
                    </p>

                    <div className={`mt-3 px-3 py-2 w-full ${clay ? 'rounded-[12px]' : 'bg-overlay'}`}
                        style={clay ? {
                            boxShadow: 'var(--shadow-inset)',
                            background: 'var(--bg-overlay)',
                        } : undefined}
                    >
                        <div className="flex items-center gap-2 justify-center">
                            <span className="text-xl">{permdetails.icon}</span>
                            <span className="text-[13px] font-medium text-[--text-muted]">
                                {pendingRequest.permission}
                            </span>
                        </div>
                    </div>
                </div>

                {clay ? (
                    <div className="px-6 pb-5 flex items-center justify-center gap-3">
                        <button
                            onClick={denyPending}
                            className="px-5 py-2.5 text-[13px] font-medium transition-all text-[--text-color] rounded-[12px] active:scale-[0.97]"
                            style={glassButton}
                        >
                            Don&apos;t Allow
                        </button>
                        <button
                            onClick={grantPending}
                            className="px-5 py-2.5 text-[13px] text-white font-semibold rounded-[12px] active:scale-[0.97] transition-all"
                            style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}
                        >
                            Allow
                        </button>
                    </div>
                ) : (
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
                            className="flex-1 py-3 font-semibold transition-colors text-white"
                            style={{ background: 'var(--accent-color)' }}
                        >
                            Allow
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionDialog;
