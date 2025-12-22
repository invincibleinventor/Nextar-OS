# NextarOS

**Production URL:** [https://baladev.in](https://baladev.in)

A fully-featured **Web Operating System** built with **Next.js 15** and **React 19**. NextarOS delivers a complete desktop and mobile experience in your browser, featuring window management, a virtual file system, external apps ecosystem, and adaptive interfaces.

> **UI Inspiration**: The interface design is inspired by Apple's macOS and iOS, reimagined for the web with custom implementations.
**AI Credit**: This README was writen and formatted with the help of GPT-5.2!
![NextarOS Desktop](./public/appimages/macos-next.png)

---

## ✨ Key Features

### 🖥️ Desktop Experience
- **Window Management** - Drag, resize, minimize, maximize, stack windows
- **Menu Bar** - Dynamic app-specific menus
- **Dock** - Interactive with magnification animations
- **Control Center** - Quick settings, brightness, volume
- **Notification Center** - System alerts with slide-in panel
- **Next Search** - Universal app and file search

### 📱 Mobile Experience
Auto-adapts on smaller screens:
- Touch-optimized iOS-style interface
- Swipeable home pages
- Full-screen apps with gesture navigation
- Lock screen and notification banners

### 📁 Virtual File System
JSON-based hierarchical file system:
- Create, rename, delete files and folders
- Upload files (up to 5MB, stored in IndexedDB)
- Trash and restore functionality
- MIME type handling for different file types
- Persistent storage across sessions

### 🚀 External Apps Ecosystem
Install and run third-party apps:
- Add custom GitHub repositories
- Browse and install apps from App Store
- 80+ documented APIs for developers
- SDK documentation included

---

## 🎯 Built-in Applications

| App | Description |
|-----|-------------|
| **Explorer** | File manager with list, icon, and gallery views |
| **Browser** | Web browser with tabs and navigation |
| **Code Editor** | Monaco-powered IDE with Python/JS execution |
| **Terminal** | ZSH simulation with command support |
| **Mail** | Email client with deep linking |
| **Photos** | Image gallery with viewer |
| **Notes** | Note-taking with rich text |
| **Music** | Audio player |
| **Settings** | Theme, wallpaper, accessibility |
| **Calculator** | Standard calculator |
| **Calendar** | Date and event management |
| **App Store** | Browse and install external apps |
| **API Docs** | Searchable API reference for developers |

---

## 🛠️ For Developers

### External Apps SDK
Build apps that run inside NextarOS:

```jsx
export default function MyApp({ appData }) {
  const { addToast } = useNotifications();
  
  return (
    <button onClick={() => addToast('Hello!', 'success')}>
      Click Me
    </button>
  );
}
```

**Available APIs:**
- Window management (open, close, resize)
- File system (read, write, create)
- Notifications (toasts, alerts)
- Theme and settings access
- Device detection
- Sound effects

See [docs/SDK.md](./docs/SDK.md) for complete documentation.

### Create Your App Repository
1. Fork [nextar-apps](https://github.com/invincibleinventor/nextar-apps)
2. Add your apps to `apps.json`
3. Submit PR or add as custom repository

---

## 🔧 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Core**: [React 19](https://react.dev/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Storage**: IndexedDB (via custom abstraction)
- **Auth**: Client Side Auth Context

---

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/invincibleinventor/macos.git
cd macos

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to experience NextarOS.

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

**Built by [Bala TBR](https://github.com/invincibleinventor)**
