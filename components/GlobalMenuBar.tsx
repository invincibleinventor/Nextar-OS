'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isnative, electronapi } from '@/utils/platform';
import { useIsClay } from './hooks/useIsClay';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NativeMenuItem {
    id: number;
    label: string;
    type: 'normal' | 'separator' | 'checkbox' | 'radio';
    enabled: boolean;
    visible: boolean;
    icon_name?: string;
    shortcut?: string;
    toggle_type?: 'check' | 'radio';
    toggle_state?: boolean;
    submenu?: NativeMenuItem[];
}

export interface NativeMenuTree {
    items: NativeMenuItem[];
}

// ── Context ──────────────────────────────────────────────────────────────────

interface GlobalMenuContextType {
    /** Menu tree for the currently focused external window, or null */
    nativeMenu: NativeMenuTree | null;
    /** The window ID whose menu is currently shown */
    focusedWindowId: number | null;
    /** Set focused external window ID (called by the window manager) */
    setFocusedWindow: (windowId: number | null) => void;
    /** Activate a menu item on the native side */
    activateItem: (menuId: number) => void;
    /** Whether a native menu is available for the focused window */
    hasNativeMenu: boolean;
}

const GlobalMenuContext = createContext<GlobalMenuContextType>({
    nativeMenu: null,
    focusedWindowId: null,
    setFocusedWindow: () => {},
    activateItem: () => {},
    hasNativeMenu: false,
});

export function useGlobalMenu() {
    return useContext(GlobalMenuContext);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function GlobalMenuProvider({ children }: { children: React.ReactNode }) {
    const [registeredWindows, setRegisteredWindows] = useState<Set<number>>(new Set());
    const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null);
    const [nativeMenu, setNativeMenu] = useState<NativeMenuTree | null>(null);

    // Listen for native menu registration / unregistration
    useEffect(() => {
        if (!isnative || !electronapi?.globalmenu) return;

        electronapi.globalmenu.onregistered((data: any) => {
            const windowId = data?.windowId ?? data;
            if (typeof windowId === 'number') {
                setRegisteredWindows(prev => new Set(prev).add(windowId));
            }
        });

        electronapi.globalmenu.onunregistered((windowId: number) => {
            setRegisteredWindows(prev => {
                const next = new Set(prev);
                next.delete(windowId);
                return next;
            });
            // If the unregistered window was focused, clear the menu
            setFocusedWindowId(prev => (prev === windowId ? null : prev));
            setNativeMenu(prev => prev); // force re-eval below
        });
    }, []);

    // Fetch menu tree whenever focused window changes
    useEffect(() => {
        if (!isnative || !electronapi?.globalmenu || focusedWindowId == null) {
            setNativeMenu(null);
            return;
        }

        let cancelled = false;

        electronapi.globalmenu.getforwindow(focusedWindowId).then((tree: NativeMenuTree | null) => {
            if (!cancelled) {
                setNativeMenu(tree && tree.items?.length ? tree : null);
            }
        }).catch(() => {
            if (!cancelled) setNativeMenu(null);
        });

        return () => { cancelled = true; };
    }, [focusedWindowId, registeredWindows]);

    const activateItem = useCallback((menuId: number) => {
        if (!isnative || !electronapi?.globalmenu || focusedWindowId == null) return;
        // service and menuPath default to the window context
        electronapi.globalmenu.activateitem(String(focusedWindowId), '/', menuId);
    }, [focusedWindowId]);

    const hasNativeMenu = nativeMenu !== null && nativeMenu.items.length > 0;

    return (
        <GlobalMenuContext.Provider value={{
            nativeMenu,
            focusedWindowId,
            setFocusedWindow: setFocusedWindowId,
            activateItem,
            hasNativeMenu,
        }}>
            {children}
        </GlobalMenuContext.Provider>
    );
}

// ── GlobalMenuBar Component ──────────────────────────────────────────────────

export function GlobalMenuBar() {
    const { nativeMenu, activateItem, hasNativeMenu } = useGlobalMenu();
    const clay = useIsClay();
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [hoverEnabled, setHoverEnabled] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    // Close menus on outside click
    useEffect(() => {
        if (activeMenuId == null) return;

        const handle = (e: MouseEvent) => {
            const target = e.target as Node;
            // Check if click is inside any portal dropdown or the bar itself
            const dropdowns = document.querySelectorAll('[data-global-menu-dropdown]');
            let insideDropdown = false;
            dropdowns.forEach(el => {
                if (el.contains(target)) insideDropdown = true;
            });
            if (barRef.current?.contains(target) || insideDropdown) return;
            setActiveMenuId(null);
            setHoverEnabled(false);
        };

        const timer = setTimeout(() => document.addEventListener('mousedown', handle), 10);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handle);
        };
    }, [activeMenuId]);

    // Close on Escape
    useEffect(() => {
        if (activeMenuId == null) return;
        const handle = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveMenuId(null);
                setHoverEnabled(false);
            }
        };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [activeMenuId]);

    if (!hasNativeMenu || !nativeMenu) return null;

    // Only render top-level items that have submenus (these become the menu bar labels)
    const topItems = nativeMenu.items.filter(item => item.visible && item.submenu?.length);

    if (topItems.length === 0) return null;

    const handleToggle = (id: number) => {
        if (activeMenuId === id) {
            setActiveMenuId(null);
            setHoverEnabled(false);
        } else {
            setActiveMenuId(id);
            setHoverEnabled(true);
        }
    };

    const handleHover = (id: number) => {
        if (hoverEnabled) setActiveMenuId(id);
    };

    const handleAction = (item: NativeMenuItem) => {
        if (!item.enabled) return;
        activateItem(item.id);
        setActiveMenuId(null);
        setHoverEnabled(false);
    };

    return (
        <div ref={barRef} className="flex items-center">
            {topItems.map(item => (
                <TopLevelItem
                    key={item.id}
                    item={item}
                    isActive={activeMenuId === item.id}
                    clay={clay}
                    onToggle={() => handleToggle(item.id)}
                    onHover={() => handleHover(item.id)}
                    onAction={handleAction}
                />
            ))}
        </div>
    );
}

// ── Top-level menu trigger + dropdown ────────────────────────────────────────

function TopLevelItem({
    item,
    isActive,
    clay,
    onToggle,
    onHover,
    onAction,
}: {
    item: NativeMenuItem;
    isActive: boolean;
    clay: boolean;
    onToggle: () => void;
    onHover: () => void;
    onAction: (item: NativeMenuItem) => void;
}) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!isActive || !triggerRef.current) {
            setDropdownPos(null);
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + (clay ? 14 : 2), left: rect.left });
    }, [isActive, clay]);

    const dropdown = isActive && dropdownPos && item.submenu && createPortal(
        <MenuDropdown
            items={item.submenu}
            position={dropdownPos}
            clay={clay}
            onAction={onAction}
        />,
        document.body,
    );

    return (
        <div className="relative" onMouseEnter={onHover}>
            <div
                ref={triggerRef}
                onMouseDown={e => e.preventDefault()}
                onClick={e => { e.stopPropagation(); onToggle(); }}
                className={`cursor-pointer font-semibold select-none transition-all duration-100 ${clay
                    ? `rounded-[10px] px-3 py-1 text-[13px] font-sans text-[--text-color] ${isActive ? '' : 'hover:bg-white/10'}`
                    : `font-mono text-[14px] px-3 text-[--text-color] ${isActive ? 'bg-pastel-lavender/15' : 'hover:bg-pastel-lavender/15'}`
                }`}
                style={clay && isActive ? { background: 'rgba(255,255,255,0.15)', borderRadius: '10px' } : undefined}
            >
                {item.label}
            </div>
            {dropdown}
        </div>
    );
}

// ── Dropdown panel ───────────────────────────────────────────────────────────

function MenuDropdown({
    items,
    position,
    clay,
    onAction,
    depth = 0,
}: {
    items: NativeMenuItem[];
    position: { top: number; left: number };
    clay: boolean;
    onAction: (item: NativeMenuItem) => void;
    depth?: number;
}) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Adjust position if dropdown goes off-screen
    const [adjustedPos, setAdjustedPos] = useState(position);
    useEffect(() => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        let { top, left } = position;
        if (rect.right > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - rect.width - 8);
            if (depth > 0) left = position.left - rect.width - 4;
        }
        if (rect.bottom > window.innerHeight - 8) {
            top = Math.max(8, window.innerHeight - rect.height - 8);
        }
        if (top !== position.top || left !== position.left) {
            setAdjustedPos({ top, left });
        }
    }, [position, depth]);

    const visibleItems = items.filter(item => item.visible);

    return (
        <div
            ref={dropdownRef}
            data-global-menu-dropdown
            className={`fixed min-w-[200px] max-w-[340px] flex flex-col ${clay
                ? 'rounded-[10px] p-[4px] font-sans'
                : 'bg-overlay border border-[--border-color] font-mono anime-glow-sm p-[5px]'
            }`}
            style={clay ? {
                zIndex: 99999,
                top: adjustedPos.top,
                left: adjustedPos.left,
                background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 20%, transparent))',
                backdropFilter: 'blur(var(--glass-blur-heavy))',
                WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
            } : {
                zIndex: 99999,
                top: adjustedPos.top,
                left: adjustedPos.left,
            }}
        >
            {visibleItems.map((item, idx) => (
                <DropdownItem
                    key={item.id ?? `sep-${idx}`}
                    item={item}
                    clay={clay}
                    onAction={onAction}
                    depth={depth}
                />
            ))}
        </div>
    );
}

// ── Individual dropdown item ─────────────────────────────────────────────────

function DropdownItem({
    item,
    clay,
    onAction,
    depth,
}: {
    item: NativeMenuItem;
    clay: boolean;
    onAction: (item: NativeMenuItem) => void;
    depth: number;
}) {
    const itemRef = useRef<HTMLDivElement>(null);
    const [submenuPos, setSubmenuPos] = useState<{ top: number; left: number } | null>(null);
    const [showSubmenu, setShowSubmenu] = useState(false);
    const hoverTimer = useRef<NodeJS.Timeout | null>(null);

    // Separator
    if (item.type === 'separator') {
        return (
            <div className={`h-[1px] mx-2 ${clay
                ? 'my-[3px] bg-[--glass-border]'
                : 'my-[3px] bg-[--border-color]'
            }`} />
        );
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;

    const handleMouseEnter = () => {
        if (!hasSubmenu) return;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => {
            if (itemRef.current) {
                const rect = itemRef.current.getBoundingClientRect();
                setSubmenuPos({ top: rect.top, left: rect.right + 2 });
                setShowSubmenu(true);
            }
        }, 120);
    };

    const handleMouseLeave = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setShowSubmenu(false), 200);
    };

    // Toggle indicator
    let toggleIndicator: React.ReactNode = null;
    if (item.toggle_type === 'check') {
        toggleIndicator = (
            <span className="w-4 text-center text-[13px] shrink-0">
                {item.toggle_state ? '\u2713' : ''}
            </span>
        );
    } else if (item.toggle_type === 'radio') {
        toggleIndicator = (
            <span className="w-4 text-center text-[10px] shrink-0">
                {item.toggle_state ? '\u25CF' : ''}
            </span>
        );
    }

    const submenuPortal = showSubmenu && hasSubmenu && submenuPos && createPortal(
        <MenuDropdown
            items={item.submenu!}
            position={submenuPos}
            clay={clay}
            onAction={onAction}
            depth={depth + 1}
        />,
        document.body,
    );

    return (
        <div
            ref={itemRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className={`flex items-center gap-2 font-medium transition-all duration-100 ${clay
                    ? 'px-2.5 py-[5px] text-[12.5px] rounded-[6px] font-sans'
                    : 'px-3 py-[5px] text-[13px]'
                } ${!item.enabled
                    ? 'opacity-40 cursor-not-allowed text-[--text-color]'
                    : clay
                        ? 'text-[--text-color] hover:bg-white/10 cursor-pointer active:scale-[0.97]'
                        : 'text-[--text-color] hover:bg-accent hover:text-[--bg-base] cursor-pointer active:opacity-80'
                }`}
                onMouseDown={e => e.preventDefault()}
                onClick={e => {
                    e.stopPropagation();
                    if (hasSubmenu) return; // submenus open on hover
                    if (item.enabled) onAction(item);
                }}
            >
                {toggleIndicator}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && (
                    <span className={`ml-4 text-[11px] shrink-0 ${clay
                        ? 'text-[--text-muted]'
                        : 'text-[--text-color] opacity-50'
                    }`}>
                        {item.shortcut}
                    </span>
                )}
                {hasSubmenu && (
                    <span className={`ml-2 text-[10px] shrink-0 ${clay
                        ? 'text-[--text-muted]'
                        : 'text-[--text-color] opacity-50'
                    }`}>
                        {'\u25B8'}
                    </span>
                )}
            </div>
            {submenuPortal}
        </div>
    );
}

export default GlobalMenuBar;
