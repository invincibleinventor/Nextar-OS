import React from 'react';
import { sidebaritems } from '../data';
import { useDevice } from '../DeviceContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassSidebar } from '../hooks/useClayStyles';

interface SidebarProps {
    currentPath?: string[];
    onNavigate: (path: string[]) => void;
    className?: string;
    show?: boolean;
    children?: React.ReactNode;
    isOverlay?: boolean;
    items?: { title?: string; items: { name: string; icon: any; path: string[]; color?: string }[] }[];
    header?: React.ReactNode;
}

export default function Sidebar({ currentPath, onNavigate, className = '', show = true, children, isOverlay = false, items = sidebaritems, header }: SidebarProps) {
    const { ismobile } = useDevice();
    const clay = useIsClay();

    const isPathActive = (itemPath: string[]) => {
        if (!currentPath) return false;
        return JSON.stringify(currentPath) === JSON.stringify(itemPath);
    };

    return (
        <div className={`
            ${show
                ? isOverlay
                    ? `absolute inset-y-0 left-0 z-30 ${clay ? 'w-[250px]' : 'w-[220px]'} shadow-pastel`
                    : `relative ${clay ? 'w-[230px]' : 'w-[200px]'}`
                : '-translate-x-full w-0 border-none'
            }
            ${className}
            transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
            flex flex-col pt-3 h-full transform
            ${clay ? '' : 'bg-surface border-r border-[--border-color] anime-gradient-top'}
        `}
            style={clay ? glassSidebar : undefined}
        >
            {header && <div className={`px-3 pt-1 pb-2 ${show ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>{header}</div>}
            <div className={`flex-1 overflow-y-auto px-2 ${show ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                {items.map((group, idx) => (
                    <div key={idx} className="mb-4">
                        {group.title && (
                            <div className="px-3 mb-1 text-[11px] font-bold text-[--text-muted] uppercase tracking-wide">
                                {group.title}
                            </div>
                        )}
                        <div className={clay ? 'space-y-1' : 'space-y-0.5'}>
                            {group.items.map((item, i) => {
                                const active = isPathActive(item.path);
                                return (
                                    <div
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate(item.path);
                                        }}
                                        className={`
                                            group flex items-center cursor-pointer transition-all
                                            ${clay ? 'gap-3 px-3 py-2.5 rounded-[12px]' : 'gap-3 px-3 py-1.5'}
                                            ${active
                                                ? clay ? 'text-white' : 'bg-accent text-[--bg-base]'
                                                : clay
                                                    ? 'text-[--text-color] hover:bg-[--bg-glass-hover] active:scale-[0.98]'
                                                    : 'text-[--text-color] hover:bg-overlay'
                                            }
                                        `}
                                        style={active && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                    >
                                        <div className={`${clay ? 'w-6 h-6 rounded-[7px]' : 'w-5 h-5'} flex items-center justify-center shrink-0`} style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : (clay ? 'var(--accent-color)' : (item.color || 'var(--pastel-blue)')) }}>
                                            <item.icon size={clay ? 14 : 12} className="text-white" />
                                        </div>
                                        <span className={`${clay ? 'text-[14px]' : 'text-[13px]'} font-medium leading-none`}>{item.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {children}
            </div>
        </div>
    );
}
