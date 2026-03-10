#!/bin/bash
# NextarOS Tauri post-install script for .deb/.rpm packages

set -e

INSTALL_DIR="/usr/bin"
APP_NAME="nextaros"
DESKTOP_DIR="/usr/share/applications"
XSESSIONS_DIR="/usr/share/xsessions"
WAYLAND_SESSIONS_DIR="/usr/share/wayland-sessions"
THEMES_DIR="/usr/share/nextaros/themes"

# ── Install X11 session file ──────────────────────────────────────────────
mkdir -p "$XSESSIONS_DIR"
cat > "$XSESSIONS_DIR/nextaros.desktop" <<EOF
[Desktop Entry]
Name=NextarOS
Comment=NextarOS Desktop Environment
Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS XDG_SESSION_TYPE=x11 QT_QPA_PLATFORMTHEME=qt5ct QT_AUTO_SCREEN_SCALE_FACTOR=1 $INSTALL_DIR/$APP_NAME --session
TryExec=$INSTALL_DIR/$APP_NAME
Type=Application
DesktopNames=NextarOS
X-Ubuntu-Gettext-Domain=nextaros
EOF

# ── Install Wayland session file ──────────────────────────────────────────
mkdir -p "$WAYLAND_SESSIONS_DIR"
cat > "$WAYLAND_SESSIONS_DIR/nextaros.desktop" <<EOF
[Desktop Entry]
Name=NextarOS (Wayland)
Comment=NextarOS Desktop Environment on Wayland
Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS XDG_SESSION_TYPE=wayland QT_QPA_PLATFORMTHEME=qt5ct QT_AUTO_SCREEN_SCALE_FACTOR=1 GDK_BACKEND=wayland $INSTALL_DIR/$APP_NAME --session
TryExec=$INSTALL_DIR/$APP_NAME
Type=Application
DesktopNames=NextarOS
EOF

# ── Install application desktop file ──────────────────────────────────────
mkdir -p "$DESKTOP_DIR"
cat > "$DESKTOP_DIR/nextaros.desktop" <<EOF
[Desktop Entry]
Name=NextarOS
Comment=NextarOS Desktop Environment
GenericName=Desktop Environment
Exec=$INSTALL_DIR/$APP_NAME
TryExec=$INSTALL_DIR/$APP_NAME
Icon=nextaros
Type=Application
Categories=System;
Keywords=desktop;environment;os;
MimeType=x-scheme-handler/nextaros;
StartupWMClass=nextaros
Terminal=false
EOF

# ── Install GTK/Qt themes ────────────────────────────────────────────────
if [ -d "$THEMES_DIR" ]; then
    if [ -f "$THEMES_DIR/install-themes.sh" ]; then
        chmod +x "$THEMES_DIR/install-themes.sh"
        echo "NextarOS themes available at $THEMES_DIR"
    fi
fi

# ── Update desktop database ──────────────────────────────────────────────
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

# ── Set correct permissions ──────────────────────────────────────────────
chmod 755 "$INSTALL_DIR/$APP_NAME" 2>/dev/null || true

echo "NextarOS installed successfully."
echo "  - Select 'NextarOS' from your display manager login screen"
echo "  - Or run: $APP_NAME"
