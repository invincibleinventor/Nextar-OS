# NextarOS — Your Personal Cloud OS

**Deploy on your server. Access from anywhere. Your cloud, your OS.**

NextarOS is a complete desktop operating system that runs entirely in your browser. Deploy it on a VPS, NAS, Raspberry Pi, or any server and access your personal desktop from any device. It also works standalone — just open it in a browser, no server required.

Not just for developers. For everyone.

---

## What is NextarOS?

NextarOS brings a full desktop experience to the web. It has a window manager, a dock, a file system, notifications, themes, and 30+ built-in applications — from a code editor and terminal to a music player and paint app. Everything runs client-side with no backend dependency. Your data stays in your browser (IndexedDB) or on your own server.

It is built for people who want a portable workspace they control. Use it as a cloud desktop for remote access, a development environment, a self-hosted productivity suite, or just a fun project to hack on.

---

## Features

### Desktop Environment

- Window management with drag, resize, snap, minimize, maximize
- Dock with hover magnification and pinned apps
- Menu bar with app-specific menus and system controls
- Notification center with grouped alerts
- Spotlight-style search across apps and files
- Customizable wallpapers (built-in + custom URL), themes, and accent colors
- Lock screen and boot sequence
- Launchpad for quick app access
- **Two UI modes**: Neo-Glass (neumorphic glassmorphism) and Classic (anime/Catppuccin)
- iOS-style squircle app icons with 3D depth shadows
- Accent-tinted sidebar icons across all file managers
- Convergent design — full desktop on large screens, iOS-style UI on mobile
- Control Center and Notification Center with mobile-optimized layouts

### Productivity

- **Notes** — Rich text note-taking with folders and search
- **TextEdit** — Document editor for plain text, Markdown, and JSON
- **Reminders** — Task lists with priorities and due dates
- **Mail** — Email client interface with folders and categories
- **Calendar** — Month/week/day views with event management
- **Contacts** — Address book with search and groups
- **Clock** — World clock, alarms, stopwatch, and timer
- **Calculator** — Standard calculator
- **Browser** — Sandboxed web browser with tab support
- **Idea Board** — Freeform brainstorming canvas

### Creative

- **Photos** — Image viewer with filters, adjustments, and gallery
- **Music** — Audio player with visualizer and playlist management
- **Video Player** — Media player for MP4, WebM, and OGG
- **Paint** — Canvas drawing tool with brushes, shapes, and layers

### Developer Tools

- **Terminal** — Full terminal powered by WebContainers (Node.js runtime in-browser)
- **Code Editor** — Monaco-based editor (VS Code engine) with syntax highlighting and IntelliSense
- **Projects** — Project dashboard with create, open, and manage workflows
- **Templates** — One-click scaffolding for React, Next.js, Express, Flask, and more
- **API Playground** — HTTP client for testing REST APIs
- **API Docs** — Built-in API documentation viewer
- **Python** — Python REPL powered by Pyodide (CPython compiled to WebAssembly)
- **Ship Checklist** — Pre-launch checklist for shipping projects

### System

- **Explorer** — File manager with sidebar, grid/list views, breadcrumb navigation, and trash
- **Settings** — System preferences for appearance, wallpaper, accent colors, icon tinting, and more
- **System Monitor** — CPU, memory, and process monitoring
- **App Store** — Discover and install apps from GitHub repositories
- **Weather** — Weather forecasts and conditions
- **Help** — System information and about screen
- **Installer** — First-run setup and onboarding

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Terminal | WebContainers (`@webcontainer/api`) + xterm.js |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Python | Pyodide (WebAssembly) |
| Animations | GSAP + Framer Motion |
| Storage | IndexedDB + LocalStorage |
| Git | isomorphic-git (in-browser) |
| Desktop App | Electron (optional) |
| Icons | React Icons |

---

## Quick Start

```bash
git clone https://github.com/invincibleinventor/nextar-os.git
cd nextar-os
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To build for production:

```bash
npm run build
npm start
```

---

## Self-Hosting

### Docker

```bash
docker run -p 3000:3000 nextaros/nextaros
```

### Manual (any Linux server, VPS, or NAS)

```bash
git clone https://github.com/invincibleinventor/nextar-os.git
cd nextar-os
npm install
npm run build
npm start
```

NextarOS will be available on port 3000. Put it behind a reverse proxy (Nginx, Caddy, Traefik) for HTTPS and custom domain support.

### Desktop App

NextarOS ships as a native desktop app via Electron. It auto-detects system RAM and adjusts V8 heap limits, GPU acceleration, and background throttling for optimal performance on any hardware — including devices with less than 4GB of RAM.

```bash
npm run electron:build:mac    # macOS (.dmg)
npm run electron:build:win    # Windows (.exe)
npm run electron:build:linux  # Linux (.AppImage, .deb)
```

When running as a desktop app, NextarOS automatically integrates with native system APIs:

- Real filesystem access (read, write, browse host files)
- WiFi, Bluetooth, volume, and brightness control
- Battery status and power management (sleep, shutdown, restart, lock)
- Native app discovery and launching
- System process monitoring and management
- Clipboard integration (text and images)
- Native notifications
- Auto-updates via GitHub Releases

### Shell Mode

NextarOS can run as a **full desktop replacement shell** — a unified interface that sits on top of any OS:

```bash
# Run in shell mode (fullscreen, acts as the desktop)
npm run electron:dev:shell

# Or set the environment variable
NEXTAROS_SHELL=1 electron .

# Disable GPU for very low-spec devices
NEXTAROS_DISABLE_GPU=1 electron . --shell
```

In shell mode, NextarOS takes over the entire screen and becomes your desktop environment. Combined with Linux auto-login and session configuration, it can replace traditional desktop environments like GNOME or KDE.

---

## Optional Backend

NextarOS works fully standalone in the browser with zero backend. However, a companion server can unlock additional capabilities:

- Host filesystem access (read/write files on the server)
- Native shell and process execution
- Docker container management
- Real system monitoring (CPU, RAM, disk)
- Multi-user authentication

Documentation for the companion server is coming soon.

---

## Architecture

```
+----------------------------------------------------------+
|                     NextarOS Frontend                     |
|                                                          |
|  +------------------+  +-----------------------------+   |
|  |  Desktop Shell   |  |       Application Layer     |   |
|  |  - Window Mgr    |  |  - 30+ built-in apps        |   |
|  |  - Dock          |  |  - Dynamic app loading       |   |
|  |  - Menu Bar      |  |  - External app support      |   |
|  |  - Notifications |  |  - Permission system         |   |
|  +------------------+  +-----------------------------+   |
|                                                          |
|  +------------------+  +-----------------------------+   |
|  |  Virtual FS      |  |       Runtime Layer         |   |
|  |  - IndexedDB     |  |  - WebContainers (Node.js)  |   |
|  |  - File CRUD     |  |  - Pyodide (Python)         |   |
|  |  - Trash/Undo    |  |  - Monaco (Code Editor)     |   |
|  |  - Projects DB   |  |  - isomorphic-git           |   |
|  +------------------+  +-----------------------------+   |
|                                                          |
|  +---------------------------------------------------+  |
|  |              Context Providers (React)              |  |
|  |  Theme | Settings | Notifications | Permissions    |  |
|  |  Runtime | Project | AppMenu | ExternalApps        |  |
|  +---------------------------------------------------+  |
+----------------------------------------------------------+
|                Next.js 15 + React 19 + TypeScript        |
+----------------------------------------------------------+
```

---

## License

MIT

---

**Built by [Bala TBR](https://github.com/invincibleinventor)**
