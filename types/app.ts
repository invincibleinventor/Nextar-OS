import React from 'react';

export interface AppCapabilities {
    multiwindow: boolean;
    maximizable: boolean;
    resizable: boolean;
    titlebarblurred: boolean;
}

export interface AppMenuAction {
    title?: string;
    disabled?: boolean;
    separator?: boolean;
    actionId?: string;
}

export interface AppMenus {
    [menuName: string]: AppMenuAction[];
}

export interface PreferenceSchema {
    key: string;
    type: 'boolean' | 'string' | 'number' | 'select';
    default: any;
    label: string;
    options?: string[];
}

export interface AppConfig {
    id: string;
    name: string;
    icon: string;
    component: string;
    category: 'Productivity' | 'Utilities' | 'Development' | 'Media' | 'System';
    capabilities: AppCapabilities;
    defaultSize: { width: number; height: number };
    minSize?: { width: number; height: number };
    titlemenu?: AppMenuAction[];
    menus?: AppMenus;
    fileTypes?: string[];
    preferences?: PreferenceSchema[];
    pinned?: boolean;
}

export interface AppInstance {
    id: string;
    appId: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMaximized: boolean;
    isMinimized: boolean;
    zIndex: number;
    props?: Record<string, any>;
}
