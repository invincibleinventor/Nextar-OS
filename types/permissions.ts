export type FilesystemPermission = 'fs.read' | 'fs.write' | 'fs.homeOnly' | 'fs.system'
export type SystemPermission = 'system.notifications' | 'system.clipboard' | 'system.theme' | 'system.settings'
export type WindowPermission = 'window.multiInstance' | 'window.backgroundExecution' | 'window.fullscreen'
export type UserPermission = 'user.current' | 'user.switch'

export type Permission = FilesystemPermission | SystemPermission | WindowPermission | UserPermission

export interface AppPermissions {
    fs?: FilesystemPermission[]
    system?: SystemPermission[]
    window?: WindowPermission[]
    user?: UserPermission[]
}

export interface AppManifest {
    id: string
    name: string
    version: string
    permissions: AppPermissions
    minOsVersion?: string
    author?: string
    description?: string
    category?: string
    homepage?: string
    license?: string
}

export interface PermissionGrant {
    appId: string
    userId: string
    permission: Permission
    granted: boolean
    grantedAt: number
}

export type ProcessState = 'launching' | 'running' | 'suspended' | 'killed' | 'crashed'

export interface Process {
    pid: number
    appId: string
    userId: string
    state: ProcessState
    startTime: number
    lastActiveTime: number
    windowId: string
    crashError?: string
}
