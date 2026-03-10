'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { isnative, electronapi } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel } from './hooks/useClayStyles';

// ── Types ────────────────────────────────────────────────────────────────────

interface TrayItem {
    id: string;
    title: string;
    icon_name: string;
    tooltip: string;
    status: string;
    category: string;
}

interface TrayMenuItem {
    id?: number;
    label: string;
    enabled?: boolean;
    separator?: boolean;
    children?: TrayMenuItem[];
}

interface SystemTrayContextValue {
    items: TrayItem[];
    loading: boolean;
}

// ── Context ──────────────────────────────────────────────────────────────────

const SystemTrayContext = createContext<SystemTrayContextValue>({ items: [], loading: true });

export function useSystemTray() {
    return useContext(SystemTrayContext);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function SystemTrayProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<TrayItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isnative || !electronapi?.tray) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const fetchItems = async () => {
            try {
                const result = await electronapi.tray.getitems();
                if (mounted && Array.isArray(result)) {
                    setItems(result);
                }
            } catch { /* tray not available */ }
            if (mounted) setLoading(false);
        };

        fetchItems();

        // Poll every 10 seconds as a fallback
        const interval = setInterval(fetchItems, 10000);

        // Subscribe to register/unregister events
        electronapi.tray.onregistered((item: TrayItem) => {
            if (!mounted) return;
            setItems(prev => {
                const exists = prev.some(i => i.id === item.id);
                return exists ? prev.map(i => i.id === item.id ? item : i) : [...prev, item];
            });
        });

        electronapi.tray.onunregistered((id: string) => {
            if (!mounted) return;
            setItems(prev => prev.filter(i => i.id !== id));
        });

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <SystemTrayContext.Provider value={{ items, loading }}>
            {children}
        </SystemTrayContext.Provider>
    );
}

// ── Tray Icon Button ─────────────────────────────────────────────────────────

function TrayIcon({ item, clay }: { item: TrayItem; clay: boolean }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menu, setMenu] = useState<TrayMenuItem[] | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleLeftClick = useCallback(async (e: React.MouseEvent) => {
        if (!electronapi?.tray) return;
        try {
            const rect = buttonRef.current?.getBoundingClientRect();
            await electronapi.tray.activate(item.id, rect?.x ?? e.clientX, rect?.bottom ?? e.clientY);
        } catch { /* ignore */ }
    }, [item.id]);

    const handleRightClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!electronapi?.tray) return;
        try {
            const result = await electronapi.tray.getmenu(item.id, '/');
            if (Array.isArray(result)) {
                setMenu(result);
                setMenuPosition({ x: e.clientX, y: e.clientY });
                setMenuOpen(true);
            }
        } catch { /* no menu */ }
    }, [item.id]);

    const handleMenuItemClick = useCallback(async (menuItem: TrayMenuItem) => {
        if (!menuItem.enabled && menuItem.enabled !== undefined) return;
        if (menuItem.separator) return;
        setMenuOpen(false);
        // Activate via the tray menu path
        if (electronapi?.tray && menuItem.id !== undefined) {
            try {
                await electronapi.tray.activate(item.id, 0, 0);
            } catch { /* ignore */ }
        }
    }, [item.id]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = () => setMenuOpen(false);
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [menuOpen]);

    // Resolve icon: use first letter as fallback
    const iconLabel = item.title?.charAt(0)?.toUpperCase() || '?';

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleLeftClick}
                onContextMenu={handleRightClick}
                title={item.tooltip || item.title}
                className={`relative flex items-center justify-center w-6 h-6 rounded-md transition-colors text-[11px] font-semibold select-none ${
                    clay
                        ? 'text-[--text-muted] hover:bg-[--bg-glass-hover] hover:text-[--text-color]'
                        : 'text-[--text-color] hover:bg-pastel-lavender/10'
                }`}
            >
                {iconLabel}
            </button>

            {/* Right-click context menu */}
            {menuOpen && menu && menu.length > 0 && (
                <>
                    <div className="fixed inset-0 z-[599]" onClick={() => setMenuOpen(false)} />
                    <div
                        className={`fixed z-[600] min-w-[180px] py-1 ${
                            clay
                                ? 'rounded-[12px] text-[--text-color]'
                                : 'rounded-md border border-[--border-color] bg-[--bg-surface] text-[--text-color] shadow-lg'
                        }`}
                        style={{
                            top: menuPosition.y,
                            left: menuPosition.x,
                            ...(clay ? {
                                ...glassPanel,
                                backdropFilter: 'blur(var(--glass-blur-heavy))',
                                WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                            } : {}),
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {menu.map((menuItem, idx) => {
                            if (menuItem.separator) {
                                return (
                                    <div
                                        key={`sep-${idx}`}
                                        className={`my-1 h-px ${clay ? 'bg-[--glass-border]' : 'bg-[--border-color]'}`}
                                    />
                                );
                            }
                            const disabled = menuItem.enabled === false;
                            return (
                                <button
                                    key={menuItem.id ?? idx}
                                    onClick={() => handleMenuItemClick(menuItem)}
                                    disabled={disabled}
                                    className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                                        disabled
                                            ? 'opacity-40 cursor-default'
                                            : clay
                                                ? 'hover:bg-[--bg-glass-hover] cursor-pointer'
                                                : 'hover:bg-pastel-lavender/10 cursor-pointer'
                                    }`}
                                >
                                    {menuItem.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}

// ── Embeddable Icons Strip ───────────────────────────────────────────────────

export function SystemTrayIcons() {
    const { items } = useSystemTray();
    const clay = useIsClay();

    if (!isnative || items.length === 0) return null;

    return (
        <div className="flex items-center space-x-0.5">
            {items.map(item => (
                <TrayIcon key={item.id} item={item} clay={clay} />
            ))}
        </div>
    );
}
