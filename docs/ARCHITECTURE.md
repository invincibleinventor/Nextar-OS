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
4. Check rate limiting (5 attempts max, 30s lockout)
   │
5. Hash password with PBKDF2 (100k iterations, 16-byte salt)
   │
6. Constant-time comparison with stored hash
   │  ├── Match → Set user, unlock OS
   │  └── No match → Increment attempts, show error
   │
7. Guest can logout, admin can switch users
```

### Password Security

| Feature | Implementation |
|---------|----------------|
| Algorithm | PBKDF2-HMAC-SHA256 |
| Iterations | 100,000 |
| Salt Length | 16 bytes (random per password) |
| Key Length | 32 bytes |
| Comparison | Constant-time to prevent timing attacks |
| Rate Limiting | 5 attempts, 30 second lockout |

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
6. **Animation Throttling**: 60ms throttle on layout tracking

## Security Architecture

### External App Sandbox

External apps run in a restricted environment:

| API | Restriction |
|-----|-------------|
| FileSystem | Read-only, system files filtered |
| Settings | Read-only (no setwallpaper, setaccentcolor) |
| Auth | Limited user info (username/name only) |
| Storage | Namespaced localStorage (`userapp_{appname}_{key}`) |
| Fetch | HTTP/HTTPS only, other protocols blocked |
| External Apps | No installApp, uninstallApp, launchApp |

### Code Integrity

External apps are verified before execution:

```
1. App installed → SHA-256 hash computed and stored
2. App launched → Hash recomputed from stored code
3. Compare hashes
   ├── Match → Execute app
   └── Mismatch → Block with "Code integrity check failed"
```

### URL Validation (Browser)

Blocked URL protocols:
- `javascript:` (XSS vector)
- `data:` (code injection)
- `vbscript:` (legacy attacks)

### iframe Sandbox

Browser iframes use restricted sandbox:
```
allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox
```

**Notably missing**: `allow-same-origin` (prevents sandbox escapes)

### Service Worker Security

Cache validation before storing:
- Only cache responses with `status === 200`
- Only cache responses with `type === 'basic'`
- Prevents cache poisoning from error pages

### Global Error Handling

- Unhandled promise rejections silently caught
- Per-window error boundaries contain app crashes
- Process manager tracks crash state
