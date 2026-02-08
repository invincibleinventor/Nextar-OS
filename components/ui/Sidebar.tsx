import React from 'react';
import { sidebaritems } from '../data';
import { useDevice } from '../DeviceContext';

interface SidebarProps {
    currentPath?: string[];
    onNavigate: (path: string[]) => void;
    className?: string;
    show?: boolean;
    children?: React.ReactNode;
    isOverlay?: boolean;
    items?: { title?: string; items: { name: string; icon: any; path: string[] }[] }[];
}

export default function Sidebar({ currentPath, onNavigate, className = '', show = true, children, isOverlay = false, items = sidebaritems }: SidebarProps) {
    const { ismobile } = useDevice();

    const isPathActive = (itemPath: string[]) => {
        if (!currentPath) return false;

        return JSON.stringify(currentPath) === JSON.stringify(itemPath);
    };

    return (
        <div className={`
            ${show
                ? isOverlay
                    ? 'absolute inset-y-0 left-0 z-30 w-[220px] shadow-pastel'
                    : 'relative w-[200px]'
                : '-translate-x-full w-0 border-none'
            }
            ${className}
            transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
            flex flex-col pt-3 h-full transform bg-surface border-r border-[--border-color] anime-gradient-top
        `}>
            <div className={`flex-1 overflow-y-auto px-2 ${show ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                {items.map((group, idx) => (
                    <div key={idx} className="mb-4">
                        {group.title && (
                            <div className="px-3 mb-1 text-[11px] font-bold text-[--text-muted] uppercase tracking-wide">
                                {group.title}
                            </div>
                        )}
                        <div className="space-y-0.5">
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
                                            group flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors
                                            ${active
                                                ? 'bg-accent text-[--bg-base]'
                                                : 'text-[--text-color] hover:bg-overlay'
                                            }
                                        `}
                                    >
                                        <item.icon className={`text-lg ${active ? 'text-[--bg-base]' : 'text-pastel-blue'}`} />
                                        <span className="text-[13px] font-medium leading-none pb-0.5">{item.name}</span>
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
