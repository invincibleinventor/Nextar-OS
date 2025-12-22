# NextarOS Architecture

NextarOS is a web-based operating system simulation built with Next.js, implementing proper OS concepts including process management, app isolation, permissions, and a virtual filesystem.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │  Desktop │ │   Dock   │ │ Menu Bar │ │ Notification Ctr ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Window Manager Layer                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  WindowContext: Window creation, focus, minimize, close ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   Process Manager Layer                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ProcessContext: spawn, suspend, resume, kill, crash    ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   Permissions Layer                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  PermissionsContext: check, request, grant, revoke      ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                   App Sandbox Layer                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  AppSandbox: Capability-based API access per app        ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                  Core Services Layer                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐│
│  │ FileSystem │ │    Auth    │ │  Settings  │ │   Theme   ││
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  IndexedDB: files, users, permissions                    ││
│  │  LocalStorage: settings, cache                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Boot Sequence

```
1. Browser loads application
   │
2. ThemeProvider initializes
   │
3. WindowProvider initializes (empty window list)
   │
4. DeviceProvider detects device type, sets osstate='booting'
   │
5. AuthProvider checks for existing users
   │  ├── No users found → Auto-login as Guest
   │  └── Users exist → Wait for login
   │
6. ProcessProvider initializes (empty process list)
   │
7. SettingsProvider loads settings from localStorage
   │
8. NotificationProvider loads notifications
   │
9. PermissionsProvider loads grants from IndexedDB
   │
10. FileSystemProvider initializes filesystem from IndexedDB
    │
11. osstate transitions: 'booting' → 'locked' → 'unlocked'
    │
12. Desktop renders with unified icon grid
```

## Process Lifecycle

```
        ┌─────────┐
        │ spawn() │
        └────┬────┘
             │
             ▼
      ┌────────────┐
      │ LAUNCHING  │
      └─────┬──────┘
            │ (100ms)
            ▼
      ┌────────────┐     suspend()     ┌────────────┐
      │  RUNNING   │◄─────────────────►│ SUSPENDED  │
      └─────┬──────┘     resume()      └────────────┘
            │
   ┌────────┼────────┐
   │        │        │
   ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌─────────┐
│ kill │ │crash │ │ (error) │
└──┬───┘ └──┬───┘ └────┬────┘
   │        │          │
   ▼        ▼          ▼
┌──────┐ ┌─────────┐
│KILLED│ │ CRASHED │
└──────┘ └─────────┘
```

### Process States

| State | Description |
|-------|-------------|
| launching | App is starting, loading resources |
| running | App is active and responsive |
| suspended | App is minimized, not consuming resources |
| killed | App has been closed normally |
| crashed | App encountered an error |

## Permission Model

### Permission Categories

| Category | Permissions | Description |
|----------|-------------|-------------|
| Filesystem | `fs.read`, `fs.write`, `fs.homeOnly`, `fs.system` | File access control |
| System | `system.notifications`, `system.clipboard`, `system.theme`, `system.settings` | System services |
| Windowing | `window.multiInstance`, `window.backgroundExecution`, `window.fullscreen` | Window behavior |
| User | `user.current`, `user.switch` | User information access |

### Permission Flow

```
1. App requests permission
   │
2. PermissionsContext checks existing grants
   │  ├── Already granted → Return true
   │  ├── Already denied → Return false
   │  └── Not decided → Continue
   │
3. Admin user? → Auto-grant all permissions
   │
4. Show PermissionDialog to user
   │
5. User decision
   │  ├── Allow → Store grant, return true
   │  └── Deny → Store denial, return false
   │
6. Grant persisted to IndexedDB (per userId + appId)
```

## Filesystem Model

### Directory Structure

```
/
├─ system/              (read-only, OS owned)
│  ├─ apps/             (built-in app manifests)
│  └─ config/           (OS configuration)
│
├─ users/
│  ├─ admin/
│  │  └─ home/
│  │     ├─ Desktop/
│  │     ├─ Documents/
│  │     ├─ Downloads/
│  │     ├─ iCloud Drive/
│  │     ├─ Trash/
│  │     └─ AppData/
│  │        └─ <appId>/
│  │
│  └─ guest/
│     └─ home/          (ephemeral, not persisted)
│
├─ apps/
│  └─ installed/
│     └─ <appId>/
│        └─ manifest.json
│
└─ tmp/                 (temporary files)
```

### Access Rules

| Path | Read | Write | Admin Only |
|------|------|-------|------------|
| /system/* | ✓ | ✗ | Read: No, Write: Yes |
| /users/<userId>/home/* | ✓ | ✓ | Own user only |
| /users/<userId>/home/AppData/<appId>/* | ✓ | ✓ | Own app only |
| /apps/installed/* | ✓ | ✗ | Write: Yes |
| /tmp/* | ✓ | ✓ | No |

## User Model

### User Roles

| Role | Capabilities |
|------|--------------|
| admin | All permissions auto-granted, can access system files, can switch users |
| user | Standard permissions, home folder only |
| guest | Ephemeral session, no persistence, limited permissions |

### Authentication Flow

```
1. App loads
   │
2. Check IndexedDB for users
   │  ├── No users → Create guest session (ephemeral)
   │  └── Users exist → Show lock screen
   │
3. User enters password
   │
4. Hash password with SHA-256
   │
5. Compare with stored hash
   │  ├── Match → Set user, unlock OS
   │  └── No match → Show error
   │
6. Guest can logout, admin can switch users
```

## Snapshot System

### Snapshot Contents

```json
{
  "version": "1.0.0",
  "timestamp": 1703289600000,
  "users": [...],
  "filesystem": [...],
  "permissions": [...],
  "installedApps": [...],
  "settings": {...}
}
```

### Export/Import Flow

```
Export:
1. Read users from IndexedDB
2. Read filesystem from IndexedDB
3. Read permissions from IndexedDB
4. Read settings from localStorage
5. Package as JSON blob
6. Trigger download

Import:
1. Parse uploaded JSON
2. Validate schema version
3. Clear existing data
4. Restore users to IndexedDB
5. Restore filesystem to IndexedDB
6. Restore permissions to IndexedDB
7. Restore settings to localStorage
8. Reload application
```

## Crash Containment

Each app is wrapped in an `AppErrorBoundary` that:

1. Catches JavaScript errors within the app
2. Reports error to ProcessManager (marks process as crashed)
3. Renders crash UI within the window
4. Provides "Try Again" button to restart app
5. Does NOT affect other running apps or OS stability

## Offline Support

### Service Worker Strategy

- Cache-first for static assets
- Network-first for dynamic content
- Fallback to cached root for navigation requests

### Cached Resources

- All static HTML, CSS, JS bundles
- App icons and images
- Wallpapers
- Fonts

### IndexedDB Storage

- Filesystem persists offline
- User data persists offline
- Permissions persist offline
- App installations persist offline

## Performance Optimizations

1. **Lazy Loading**: All app components use `dynamic()` import
2. **Memoization**: Heavy computations wrapped in `useMemo`/`useCallback`
3. **Virtual Scrolling**: Large file lists use windowed rendering
4. **Static Export**: Pre-rendered HTML for instant load
5. **Service Worker**: Aggressive caching for repeat visits
