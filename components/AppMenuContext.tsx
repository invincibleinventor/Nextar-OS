'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface MenuItem {
    title?: string;
    disabled?: boolean;
    separator?: boolean;
    actionId?: string;
    shortcut?: string;
}

export interface MenuConfig {
    [menuName: string]: MenuItem[];
}

interface AppMenuContextType {
    activeAppMenus: MenuConfig;
    setMenus: (menus: MenuConfig) => void;
    clearMenus: () => void;
    triggerAction: (actionId: string) => void;
    registerActionHandler: (actionId: string, handler: () => void) => void;
    unregisterActionHandler: (actionId: string) => void;
}

const AppMenuContext = createContext<AppMenuContextType | null>(null);

const globalmenus: MenuConfig = {
    Window: [
        { title: "Minimize", actionId: "window-minimize", shortcut: "⌘M" },
        { title: "Zoom", actionId: "window-zoom" },
        { separator: true },
        { title: "Bring All to Front", actionId: "window-bring-all" }
    ],
    Help: [
        { title: "Search", actionId: "help-search", disabled: true },
        { separator: true },
        { title: "About Nextar", actionId: "help-about" }
    ]
};

export function AppMenuProvider({ children }: { children: React.ReactNode }) {
    const [activeAppMenus, setActiveAppMenus] = useState<MenuConfig>({});
    const [actionHandlers, setActionHandlers] = useState<Record<string, () => void>>({});

    const setMenus = useCallback((menus: MenuConfig) => {
        setActiveAppMenus({ ...menus, ...globalmenus });
    }, []);

    const clearMenus = useCallback(() => {
        setActiveAppMenus({ ...globalmenus });
    }, []);

    const triggerAction = useCallback((actionId: string) => {
        const handler = actionHandlers[actionId];
        if (handler) handler();
    }, [actionHandlers]);

    const registerActionHandler = useCallback((actionId: string, handler: () => void) => {
        setActionHandlers(prev => ({ ...prev, [actionId]: handler }));
    }, []);

    const unregisterActionHandler = useCallback((actionId: string) => {
        setActionHandlers(prev => {
            const newHandlers = { ...prev };
            delete newHandlers[actionId];
            return newHandlers;
        });
    }, []);

    return (
        <AppMenuContext.Provider value={{
            activeAppMenus,
            setMenus,
            clearMenus,
            triggerAction,
            registerActionHandler,
            unregisterActionHandler
        }}>
            {children}
        </AppMenuContext.Provider>
    );
}

export function useAppMenus() {
    const context = useContext(AppMenuContext);
    if (!context) throw new Error('useAppMenus must be used within AppMenuProvider');
    return context;
}

export function useMenuRegistration(menus: MenuConfig, isActive: boolean = true) {
    const { setMenus, clearMenus } = useAppMenus();

    useEffect(() => {
        if (isActive) {
            setMenus(menus);
        }
        return () => {
            if (isActive) clearMenus();
        };
    }, [isActive, menus, setMenus, clearMenus]);
}

export function useMenuAction(actionId: string, handler: () => void, deps: any[] = []) {
    const { registerActionHandler, unregisterActionHandler } = useAppMenus();

    useEffect(() => {
        registerActionHandler(actionId, handler);
        return () => unregisterActionHandler(actionId);
    }, [actionId, ...deps]);
}
