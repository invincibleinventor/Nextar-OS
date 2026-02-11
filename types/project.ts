export interface Project {
    id: string;
    name: string;
    templateId: string;
    createdAt: number;
    updatedAt: number;
    members: string[];
    layoutState: WorkspaceLayout;
    description?: string;
    stack?: string[];
    status: 'active' | 'archived' | 'deployed';
}

export interface ProjectFile {
    id: string;
    projectId: string;
    path: string;
    name: string;
    content: string;
    mimeType: string;
    isDirectory: boolean;
    parentPath: string;
    createdAt: number;
    updatedAt: number;
}

export interface Snapshot {
    id: string;
    projectId: string;
    timestamp: number;
    files: ProjectFile[];
    layoutState: WorkspaceLayout;
    metadata: {
        label?: string;
        auto?: boolean;
    };
}

export interface FeaturePack {
    id: string;
    name: string;
    description: string;
    icon: string;
    injectFiles: Record<string, string>;
    injectDependencies: string[];
    injectEnvVars: Record<string, string>;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    stack: string[];
    files: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies?: Record<string, string>;
    featurePacksIncluded: string[];
    initialLayout: WorkspaceLayout;
    startupCommand: string;
    category: 'frontend' | 'fullstack' | 'api' | 'static' | 'mobile';
}

export interface WorkspaceLayout {
    sidebarOpen: boolean;
    sidebarWidth: number;
    terminalOpen: boolean;
    terminalHeight: number;
    previewOpen: boolean;
    previewWidth: number;
    activeFile?: string;
    openFiles: string[];
}

export const DEFAULT_LAYOUT: WorkspaceLayout = {
    sidebarOpen: true,
    sidebarWidth: 240,
    terminalOpen: true,
    terminalHeight: 200,
    previewOpen: true,
    previewWidth: 400,
    openFiles: [],
};
