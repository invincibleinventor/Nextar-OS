# HackathOS

**The Zero-Setup Hackathon Operating System** — a fully client-side, offline-first project workspace for hackathon teams, running a real Linux VM in your browser.

Built on **Next.js 15**, **React 19**, **CheerpX** (x86-to-WebAssembly Linux VM), and **Catppuccin Macchiato** theme.

> Fork of [NextarOS](https://github.com/invincibleinventor/nextar-os) (`main` branch), extended with a full Linux development environment.

---

## What is HackathOS?

HackathOS gives every hackathon participant a complete development environment with zero setup:

- **Full Linux Terminal** — Real Debian Linux via CheerpX (apt, pip, gcc, python, vim — everything works)
- **Monaco Code Editor** — VS Code-quality editor with syntax highlighting and IntelliSense
- **Project Templates** — One-click scaffolding for React, Flask, Express, and more
- **Window Manager** — macOS-style desktop with drag, resize, snap, dock
- **Offline-First** — Works completely offline after first load
- **No Backend** — Everything runs in the browser via WebAssembly

---

## Architecture

### CheerpX Linux VM

HackathOS runs a full Debian Linux distribution in the browser via CheerpX:

```
┌─────────────────────────────────────────────────────────┐
│                    HackathOS UI Layer                     │
│  ┌────────────┐ ┌───────────┐ ┌────────────────────────┐│
│  │   Desktop   │ │   Dock    │ │ Hackathon Workspace    ││
│  │  (Windows)  │ │  (Apps)   │ │ (Editor+Terminal+Tree) ││
│  └────────────┘ └───────────┘ └────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                   Terminal Layer                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  xterm.js ←→ CheerpX Console (singleton, broadcast) ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                  CheerpX VM Layer                         │
│  ┌────────────┐ ┌────────────┐ ┌───────────────────────┐│
│  │ x86→WASM   │ │  Debian    │ │   Tailscale Network   ││
│  │   JIT      │ │ Filesystem │ │   (optional, free)    ││
│  └────────────┘ └────────────┘ └───────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                   Storage Layer                           │
│  ┌────────────────────┐ ┌──────────────────────────────┐│
│  │   IndexedDB cache   │ │  Cloud disk (WebSocket)      ││
│  │   (overlay writes)  │ │  debian_large.ext2           ││
│  └────────────────────┘ └──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| CheerpX Provider | `components/CheerpXContext.tsx` | VM lifecycle, singleton console, FS operations |
| XTerm Shell | `components/ui/XTermShell.tsx` | xterm.js terminal connected to CheerpX |
| Hackathon Workspace | `components/apps/HackathonWorkspace.tsx` | IDE: editor + file tree + terminal |
| Project Context | `components/ProjectContext.tsx` | Project management, templates, snapshots |

### Console Management

CheerpX supports only ONE console. HackathOS handles this with:

- **Singleton pattern** — `setCustomConsole` called exactly once during boot
- **Broadcast output** — All open Terminal windows receive the same shell output
- **Shared shell** — One bash session, multiple Terminal window views
- **Capture queue** — Background FS operations serialized to avoid interleaving

### File System Bridge

- **Editor → Linux sync** — Files saved in Monaco are written to `/home/user/projects/` on the ext2 filesystem via shell commands
- **Full Linux FS** — `/`, `/home/user`, `/dev`, `/proc`, `/sys` all accessible in terminal
- **DataDevice at `/projects`** — Flat key-value store for simple file sharing

### Networking (Optional)

- Tailscale free tier (no payment, just email signup) for internet access from within the VM
- `curl`, `apt update`, `pip install` work after one-time Tailscale authentication
- Login URL appears in terminal when network is needed

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Static Export) |
| Core | React 19 |
| Styling | Tailwind CSS + Catppuccin Macchiato |
| Linux VM | CheerpX (`@leaningtech/cheerpx`) |
| Terminal | xterm.js (`@xterm/xterm`) |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Storage | IndexedDB + LocalStorage |
| Networking | Tailscale (optional, free) |
| Icons | React Icons |

---

## Quick Start

```bash
git clone https://github.com/invincibleinventor/nextar-os.git
cd nextar-os
git checkout product
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note**: CheerpX requires Cross-Origin Isolation (COOP/COEP headers). The dev server provides these automatically via `next.config.ts`. First load may need a page refresh for the service worker to initialize SharedArrayBuffer support.

---

## Pre-installing Packages

The Debian disk image comes with many tools pre-installed (gcc, python, vim, etc.). To install additional packages:

1. **Enable networking** — Tailscale login URL appears in terminal on first boot
2. **Install via apt** — `sudo apt install nodejs npm` (or any package)
3. **Packages persist** — Installed packages are cached in IndexedDB and survive page reloads

To pre-install packages for all users, you would need a custom CheerpX disk image.

---

## Features

### Hackathon Workspace
- Monaco editor with 20+ language support
- File tree with create/rename/delete
- Integrated terminal panel
- Project templates (React, Flask, Express, etc.)
- Auto-save with Linux filesystem sync
- Snapshot/version system

### Desktop Environment
- macOS-style window management (drag, resize, snap)
- Dock with hover magnification
- Menu bar with app-specific menus
- Notification center
- Spotlight-style search
- Customizable wallpapers and themes

### Built-in Apps
- **Terminal** — Full Linux shell via CheerpX
- **Hackathon Workspace** — IDE with editor + terminal
- **Browser** — Sandboxed web browser
- **Explorer** — File manager
- **Settings** — System preferences
- And 15+ more system apps

---

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) — System design and OS internals
- [SDK Documentation](./docs/SDK.md) — Build apps for the platform

---

## License

MIT License

---

**Built by [Bala TBR](https://github.com/invincibleinventor)**
