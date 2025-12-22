# NextarOS Developer SDK

Complete API reference for building NextarOS applications.

---

## Table of Contents

1. [Window APIs](#window-apis) - 12 APIs
2. [FileSystem APIs](#filesystem-apis) - 15 APIs
3. [Notification APIs](#notification-apis) - 8 APIs
4. [Settings APIs](#settings-apis) - 6 APIs
5. [Auth APIs](#auth-apis) - 5 APIs
6. [Theme APIs](#theme-apis) - 4 APIs
7. [Device APIs](#device-apis) - 5 APIs
8. [Sound APIs](#sound-apis) - 3 APIs
9. [External Apps APIs](#external-apps-apis) - 12 APIs
10. [Utility Functions](#utility-functions) - 10 APIs

**Total: 80+ APIs**

---

## Window APIs

### `useWindows()`

Access window management functions.

```typescript
import { useWindows } from '@/components/WindowContext';

const { 
  windows,
  activewindow,
  addwindow,
  removewindow,
  updatewindow,
  setactivewindow,
  setwindows,
  minimizewindow,
  maximizewindow,
  restorewindow,
  bringtofront,
  closeallwindows
} = useWindows();
```

#### `addwindow(window: WindowType)`
Opens a new application window.

```typescript
addwindow({
  id: 'my-app-123',
  appname: 'My App',
  component: 'apps/MyApp',
  props: { initialData: 'hello' },
  isminimized: false,
  ismaximized: false,
  x: 100,
  y: 100,
  width: 800,
  height: 600
});
```

#### `removewindow(id: string)`
Closes a window by ID.

```typescript
removewindow('my-app-123');
```

#### `updatewindow(id: string, updates: Partial<WindowType>)`
Updates window properties.

```typescript
updatewindow('my-app-123', { 
  width: 1000, 
  height: 700,
  ismaximized: true 
});
```

#### `setactivewindow(id: string | null)`
Sets the active (focused) window.

```typescript
setactivewindow('my-app-123');
```

#### `minimizewindow(id: string)`
Minimizes a window.

```typescript
minimizewindow('my-app-123');
```

#### `maximizewindow(id: string)`
Maximizes a window.

```typescript
maximizewindow('my-app-123');
```

#### `restorewindow(id: string)`
Restores a minimized/maximized window.

```typescript
restorewindow('my-app-123');
```

#### `bringtofront(id: string)`
Brings a window to the front.

```typescript
bringtofront('my-app-123');
```

#### `closeallwindows()`
Closes all open windows.

```typescript
closeallwindows();
```

#### `windows: WindowType[]`
Array of all open windows.

#### `activewindow: string | null`
ID of the currently active window.

---

## FileSystem APIs

### `useFileSystem()`

Access file system operations.

```typescript
import { useFileSystem } from '@/components/FileSystemContext';

const {
  files,
  isLoading,
  createFolder,
  createFile,
  uploadFile,
  renameItem,
  deleteItem,
  moveToTrash,
  restoreFromTrash,
  emptyTrash,
  moveItem,
  copyItems,
  pasteItems,
  updateFileContent,
  getFileById,
  getFilesByParent
} = useFileSystem();
```

#### `createFolder(name: string, parentId: string)`
Creates a new folder.

```typescript
await createFolder('New Folder', 'user-documents');
```

#### `createFile(name: string, parentId: string, content?: string)`
Creates a new file.

```typescript
await createFile('notes.txt', 'user-documents', 'Hello World');
```

#### `uploadFile(file: File, parentId: string)`
Uploads a file (max 5MB).

```typescript
const fileInput = document.querySelector('input[type="file"]');
await uploadFile(fileInput.files[0], 'user-documents');
```

#### `renameItem(id: string, newName: string)`
Renames a file or folder.

```typescript
await renameItem('file-123', 'renamed.txt');
```

#### `deleteItem(id: string)`
Permanently deletes an item.

```typescript
await deleteItem('file-123');
```

#### `moveToTrash(id: string)`
Moves item to trash.

```typescript
await moveToTrash('file-123');
```

#### `restoreFromTrash(id: string)`
Restores item from trash.

```typescript
await restoreFromTrash('file-123');
```

#### `emptyTrash()`
Permanently deletes all trash items.

```typescript
await emptyTrash();
```

#### `moveItem(id: string, newParentId: string)`
Moves item to a different folder.

```typescript
await moveItem('file-123', 'folder-456');
```

#### `copyItems(ids: string[])`
Copies items to clipboard.

```typescript
copyItems(['file-123', 'file-456']);
```

#### `pasteItems(parentId: string)`
Pastes copied items.

```typescript
await pasteItems('folder-789');
```

#### `updateFileContent(id: string, content: string)`
Updates file content.

```typescript
await updateFileContent('file-123', 'Updated content');
```

#### `getFileById(id: string)`
Gets a file by ID.

```typescript
const file = getFileById('file-123');
```

#### `getFilesByParent(parentId: string)`
Gets all children of a folder.

```typescript
const children = getFilesByParent('folder-123');
```

#### `files: filesystemitem[]`
Array of all files and folders.

---

## Notification APIs

### `useNotifications()`

Access notification and toast functions.

```typescript
import { useNotifications } from '@/components/NotificationContext';

const {
  notifications,
  toast,
  addToast,
  addnotification,
  clearnotification,
  clearallnotifications,
  hidetoast,
  markasviewed
} = useNotifications();
```

#### `addToast(message: string, type?: 'info' | 'success' | 'error' | 'warning')`
Shows a toast notification with sound.

```typescript
addToast('File saved successfully', 'success');
addToast('Something went wrong', 'error');
addToast('Check your settings', 'warning');
addToast('New update available', 'info');
```

#### `addnotification(notification: Notification)`
Adds a notification to history.

```typescript
addnotification({
  id: 'notif-123',
  title: 'New Message',
  description: 'You have a new message',
  time: 'Now',
  type: 'message',
  appname: 'Messages',
  icon: '/icons/messages.png',
  appid: 'messages'
});
```

#### `clearnotification(id: string)`
Clears a single notification.

```typescript
clearnotification('notif-123');
```

#### `clearallnotifications()`
Clears all notifications.

```typescript
clearallnotifications();
```

#### `hidetoast()`
Hides the current toast.

```typescript
hidetoast();
```

#### `markasviewed(id: string)`
Marks a notification as viewed.

```typescript
markasviewed('notif-123');
```

---

## Settings APIs

### `useSettings()`

Access user settings.

```typescript
import { useSettings } from '@/components/SettingsContext';

const {
  reducemotion,
  setreducemotion,
  reducetransparency,
  setreducetransparency,
  soundeffects,
  setsoundeffects,
  wallpaperurl,
  setwallpaperurl,
  accentcolor,
  setaccentcolor
} = useSettings();
```

#### `reducemotion: boolean`
Whether reduce motion is enabled.

#### `setreducemotion(value: boolean)`
Sets reduce motion preference.

```typescript
setreducemotion(true);
```

#### `reducetransparency: boolean`
Whether reduce transparency is enabled.

#### `soundeffects: boolean`
Whether sound effects are enabled.

#### `setsoundeffects(value: boolean)`
Enables/disables sound effects.

```typescript
setsoundeffects(true);
```

#### `wallpaperurl: string`
Current wallpaper URL.

#### `setwallpaperurl(url: string)`
Sets the wallpaper.

```typescript
setwallpaperurl('/wallpaper-2.jpg');
```

#### `accentcolor: string`
Current accent color (hex).

#### `setaccentcolor(color: string)`
Sets the accent color.

```typescript
setaccentcolor('#FF5500');
```

---

## Auth APIs

### `useAuth()`

Access authentication state.

```typescript
import { useAuth } from '@/components/AuthContext';

const {
  user,
  isLoading,
  isGuest,
  login,
  logout
} = useAuth();
```

#### `user: User | null`
Current user object.

```typescript
const { username, role, avatar } = user;
```

#### `isGuest: boolean`
Whether user is in guest mode.

#### `login(username: string, password: string)`
Logs in a user.

```typescript
await login('admin', 'password');
```

#### `logout()`
Logs out the current user.

```typescript
logout();
```

---

## Theme APIs

### `useTheme()`

Access theme information.

```typescript
import { useTheme } from '@/components/ThemeContext';

const {
  theme,
  setTheme,
  resolvedTheme,
  systemTheme
} = useTheme();
```

#### `theme: 'light' | 'dark' | 'system'`
Current theme setting.

#### `setTheme(theme: 'light' | 'dark' | 'system')`
Sets the theme.

```typescript
setTheme('dark');
```

#### `resolvedTheme: 'light' | 'dark'`
Actual applied theme (resolved from system if needed).

#### `systemTheme: 'light' | 'dark'`
System preference.

---

## Device APIs

### `useDevice()`

Access device information.

```typescript
import { useDevice } from '@/components/DeviceContext';

const {
  ismobile,
  isdesktop,
  osstate,
  setosstate,
  orientation
} = useDevice();
```

#### `ismobile: boolean`
Whether device is mobile.

#### `isdesktop: boolean`
Whether device is desktop.

#### `osstate: 'boot' | 'lockscreen' | 'home' | 'desktop'`
Current OS state.

#### `setosstate(state: string)`
Sets OS state.

```typescript
setosstate('lockscreen');
```

#### `orientation: 'portrait' | 'landscape'`
Device orientation.

---

## Sound APIs

### `playSound()`

Play system sounds.

```typescript
import { playSound } from '@/components/SoundEffects';

playSound('click');
playSound('notification');
playSound('error');
playSound('success');
playSound('trash');
playSound('woosh');
```

#### Available Sounds

| Name | Use Case |
|------|----------|
| `click` | Button clicks |
| `notification` | General notifications |
| `error` | Error messages |
| `success` | Success actions |
| `trash` | Delete actions |
| `woosh` | Transitions |

---

## External Apps APIs

### `useExternalApps()`

Access external apps management.

```typescript
import { useExternalApps } from '@/components/ExternalAppsContext';

const {
  apps,
  installedApps,
  repositories,
  repoStatuses,
  categories,
  isLoading,
  error,
  installApp,
  uninstallApp,
  addRepository,
  removeRepository,
  refreshApps,
  searchApps,
  getAppsByCategory,
  getAppById,
  launchApp,
  checkForUpdates,
  validateRepository
} = useExternalApps();
```

#### `installApp(appId: string)`
Installs an external app.

```typescript
await installApp('my-app-123');
```

#### `uninstallApp(appId: string)`
Uninstalls an external app.

```typescript
await uninstallApp('my-app-123');
```

#### `addRepository(repoUrl: string)`
Adds a GitHub repository.

```typescript
const success = await addRepository('username/repo');
```

#### `removeRepository(repoUrl: string)`
Removes a repository.

```typescript
removeRepository('username/repo');
```

#### `searchApps(query: string)`
Searches apps by name/description/tags.

```typescript
const results = searchApps('productivity');
```

#### `getAppsByCategory(category: string)`
Gets apps filtered by category.

```typescript
const utilityApps = getAppsByCategory('Utilities');
```

#### `launchApp(appId: string)`
Launches an installed app.

```typescript
launchApp('my-app-123');
```

#### `validateRepository(repoUrl: string)`
Validates a repository before adding.

```typescript
const { valid, error, appCount } = await validateRepository('user/repo');
```

---

## Utility Functions

### `openSystemItem()`

Opens an app or file.

```typescript
import { openSystemItem } from '@/components/data';

openSystemItem('explorer', windowContext);
openSystemItem('settings', windowContext, { initialPage: 'wallpaper' });
```

### App Registration

Apps are registered in `data.tsx`:

```typescript
export const apps = [
  {
    id: 'myapp',
    name: 'My App',
    icon: '/icons/myapp.png',
    component: 'apps/MyApp',
    multiwindow: false,
    pinned: true,
    category: 'Utilities'
  }
];
```

---

## apps.json Schema

For external apps, create an `apps.json` in your GitHub repo:

```json
{
  "apps": [
    {
      "id": "my-unique-id",
      "name": "My App",
      "description": "A great app for NextarOS",
      "icon": "🎮",
      "iconUrl": "https://example.com/icon.png",
      "author": "Your Name",
      "version": "1.0.0",
      "category": "Utilities",
      "component": "MyAppComponent",
      "homepage": "https://yoursite.com",
      "license": "MIT",
      "tags": ["productivity", "tools"],
      "screenshots": ["https://example.com/ss1.png"],
      "updatedAt": "2024-12-21"
    }
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `component` | string | Component name |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | App description |
| `icon` | string | Emoji icon |
| `iconUrl` | string | Remote icon URL |
| `author` | string | Developer name |
| `version` | string | Semantic version |
| `category` | string | Category name |
| `homepage` | string | Website URL |
| `license` | string | License type |
| `tags` | string[] | Searchable tags |
| `screenshots` | string[] | Screenshot URLs |
| `updatedAt` | string | Last update date |

---

## Categories

Recommended app categories:

- Utilities
- Productivity
- Entertainment
- Developer Tools
- Social
- Education
- Finance
- Health
- Travel
- Weather
- Games
- Graphics
- Music

---

## Component Props

External apps receive these props:

```typescript
interface ExternalAppProps {
  appData: {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    category: string;
  };
  id?: string;
  appId?: string;
}
```

---

## Best Practices

### 1. Use Hooks Correctly
Always call hooks at the top level of your component.

### 2. Handle Loading States
Check `isLoading` before rendering data.

### 3. Error Handling
Use try/catch and show user-friendly errors via `addToast`.

### 4. Respect User Settings
Check `reducemotion` before adding animations.
Check `soundeffects` before playing sounds.

### 5. Dark Mode Support
Use CSS variables and Tailwind's dark mode.

### 6. Mobile Support
Use `ismobile` to adapt UI for mobile devices.

---

## Example App

```typescript
import React from 'react';
import { useNotifications } from '@/components/NotificationContext';
import { useSettings } from '@/components/SettingsContext';

export default function MyApp({ appData }) {
  const { addToast } = useNotifications();
  const { accentcolor } = useSettings();

  const handleClick = () => {
    addToast('Button clicked!', 'success');
  };

  return (
    <div className="p-4">
      <h1 style={{ color: accentcolor }}>{appData.name}</h1>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-accent text-white rounded-lg"
      >
        Click Me
      </button>
    </div>
  );
}
```

---

## Support

- **GitHub**: github.com/invincibleinventor/nextar-apps
- **Issues**: Submit bugs or feature requests
- **Pull Requests**: Contribute apps or documentation
