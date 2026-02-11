'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IoCheckmarkCircle, IoEllipseOutline, IoRocketOutline,
    IoWarningOutline, IoShieldCheckmarkOutline, IoPhonePortraitOutline,
    IoSpeedometerOutline, IoDocumentTextOutline, IoGitBranchOutline,
    IoKeyOutline, IoImageOutline, IoGlobeOutline,
} from 'react-icons/io5';
import { useProjects } from '../ProjectContext';
import { useNotifications } from '../NotificationContext';
import { useWindows } from '../WindowContext';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    category: 'code' | 'deploy' | 'quality' | 'security';
    icon: React.ReactNode;
    autoCheck?: (files: string[], fileContents: Map<string, string>) => boolean;
}

const STORAGE_PREFIX = 'hackathon-checklist-';

const checklistItems: ChecklistItem[] = [
    {
        id: 'readme', label: 'README.md exists', description: 'Your project has a README file',
        category: 'code', icon: <IoDocumentTextOutline size={14} />,
        autoCheck: (files) => files.some(f => f.toLowerCase() === 'readme.md'),
    },
    {
        id: 'env-example', label: '.env.example created', description: 'Environment variable template for others',
        category: 'deploy', icon: <IoKeyOutline size={14} />,
        autoCheck: (files) => files.some(f => f === '.env.example' || f === '.env.local'),
    },
    {
        id: 'package-json', label: 'package.json present', description: 'Project has a valid package.json',
        category: 'code', icon: <IoDocumentTextOutline size={14} />,
        autoCheck: (files) => files.some(f => f === 'package.json'),
    },
    {
        id: 'no-console', label: 'Remove debug logs', description: 'Clean up console.log statements before demo',
        category: 'quality', icon: <IoWarningOutline size={14} />,
    },
    {
        id: 'responsive', label: 'Responsive design checked', description: 'Tested on mobile viewport sizes',
        category: 'quality', icon: <IoPhonePortraitOutline size={14} />,
    },
    {
        id: 'error-handling', label: 'Error handling in place', description: 'API calls have try/catch and user-friendly errors',
        category: 'code', icon: <IoShieldCheckmarkOutline size={14} />,
    },
    {
        id: 'env-vars', label: 'Environment variables set', description: 'All required env vars configured for deploy',
        category: 'deploy', icon: <IoKeyOutline size={14} />,
    },
    {
        id: 'build-passes', label: 'Build succeeds', description: 'npm run build completes without errors',
        category: 'deploy', icon: <IoRocketOutline size={14} />,
    },
    {
        id: 'favicon', label: 'Favicon set', description: 'Custom favicon/icon for the project',
        category: 'quality', icon: <IoImageOutline size={14} />,
    },
    {
        id: 'meta-tags', label: 'Meta tags configured', description: 'Title, description, and OG tags set',
        category: 'quality', icon: <IoGlobeOutline size={14} />,
    },
    {
        id: 'git-clean', label: 'Git status clean', description: 'All changes committed and pushed',
        category: 'deploy', icon: <IoGitBranchOutline size={14} />,
    },
    {
        id: 'perf-check', label: 'Performance acceptable', description: 'Page loads under 3 seconds',
        category: 'quality', icon: <IoSpeedometerOutline size={14} />,
    },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
    'code': { label: 'Code', color: '#3b82f6' },
    'deploy': { label: 'Deploy', color: '#22c55e' },
    'quality': { label: 'Quality', color: '#f59e0b' },
    'security': { label: 'Security', color: '#ef4444' },
};

export default function ShipChecklist({ windowId, appId = 'shipchecklist', id }: { windowId?: string; appId?: string; id?: string }) {
    const { currentProject, currentFiles } = useProjects();
    const { addToast } = useNotifications();
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === (id || windowId);
    const storageKey = currentProject ? `${STORAGE_PREFIX}${currentProject.id}` : null;

    const [checked, setChecked] = useState<Set<string>>(new Set());

    // Load from localStorage
    useEffect(() => {
        if (!storageKey) return;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setChecked(new Set(JSON.parse(stored)));
        } catch { /* ignore */ }
    }, [storageKey]);

    // Save to localStorage
    useEffect(() => {
        if (!storageKey) return;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(checked)));
    }, [checked, storageKey]);

    // Auto-check items based on project files
    useEffect(() => {
        if (!currentProject || !currentFiles.length) return;
        const filePaths = currentFiles.filter(f => !f.isDirectory).map(f => f.path);
        const fileContents = new Map(currentFiles.filter(f => !f.isDirectory).map(f => [f.path, f.content]));

        const autoChecked = new Set(checked);
        checklistItems.forEach(item => {
            if (item.autoCheck && item.autoCheck(filePaths, fileContents)) {
                autoChecked.add(item.id);
            }
        });

        if (autoChecked.size !== checked.size) {
            setChecked(autoChecked);
        }
    }, [currentFiles, currentProject]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleCheck = useCallback((itemId: string) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    }, []);

    const checklistMenus = useMemo(() => ({
        Edit: [
            { title: "Check All", actionId: "check-all" },
            { title: "Uncheck All", actionId: "uncheck-all" },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'check-all': () => {
            setChecked(new Set(checklistItems.map(i => i.id)));
            addToast('All items checked', 'success');
        },
        'uncheck-all': () => {
            setChecked(new Set());
            addToast('All items unchecked', 'info');
        },
    }), [addToast]);

    useMenuRegistration(checklistMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id || windowId);

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-full bg-[--bg-base] text-[--text-color] font-mono">
                <div className="text-center space-y-2">
                    <IoRocketOutline size={32} className="mx-auto text-[--text-muted] opacity-50" />
                    <div className="text-sm text-[--text-muted]">Open a project to use the Ship Checklist</div>
                </div>
            </div>
        );
    }

    const total = checklistItems.length;
    const done = checked.size;
    const progress = total > 0 ? (done / total) * 100 : 0;
    const isReady = progress === 100;

    const groupedItems = checklistItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    return (
        <div className="flex flex-col h-full bg-[--bg-base] text-[--text-color] overflow-hidden font-mono">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-[--border-color] shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-semibold flex items-center gap-2">
                            <IoRocketOutline size={16} className="text-pastel-green" />
                            Ship Checklist — {currentProject.name}
                        </h2>
                        <p className="text-[11px] text-[--text-muted] mt-0.5">Pre-deploy validation</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-bold ${isReady ? 'text-pastel-green' : 'text-pastel-peach'}`}>
                            {Math.round(progress)}%
                        </div>
                        <div className="text-[10px] text-[--text-muted]">{done}/{total} complete</div>
                    </div>
                </div>
                <div className="w-full h-2 bg-overlay overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isReady ? 'bg-pastel-green' : progress > 50 ? 'bg-pastel-peach' : 'bg-accent'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {isReady && (
                    <div className="mt-2 p-2 bg-pastel-green/10 border border-pastel-green/20 text-center">
                        <span className="text-xs text-pastel-green font-medium">Ready to ship! All checks passed.</span>
                    </div>
                )}
            </div>

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {Object.entries(groupedItems).map(([category, items]) => {
                    const catInfo = categoryLabels[category] || { label: category, color: '#888' };
                    const catDone = items.filter(i => checked.has(i.id)).length;
                    return (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2" style={{ backgroundColor: catInfo.color }} />
                                <span className="text-xs font-medium text-[--text-muted]">{catInfo.label}</span>
                                <span className="text-[10px] text-[--text-muted] opacity-60">{catDone}/{items.length}</span>
                            </div>
                            <div className="space-y-1">
                                {items.map(item => {
                                    const isChecked = checked.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleCheck(item.id)}
                                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${isChecked ? 'bg-overlay' : 'hover:bg-overlay'}`}
                                        >
                                            {isChecked ? (
                                                <IoCheckmarkCircle size={18} className="text-pastel-green shrink-0" />
                                            ) : (
                                                <IoEllipseOutline size={18} className="text-[--text-muted] opacity-50 shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <div className={`text-xs font-medium ${isChecked ? 'text-[--text-muted] line-through' : 'text-[--text-color]'}`}>{item.label}</div>
                                                <div className="text-[10px] text-[--text-muted] opacity-60">{item.description}</div>
                                            </div>
                                            <div className="text-[--text-muted] opacity-40">{item.icon}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
