#!/bin/bash
# Install NextarOS as an SDDM/GDM session option
# Usage: sudo bash scripts/install-session.sh

set -e

# Find the NextarOS binary
BINARY=""
if [ -f "src-tauri/target/release/nextaros" ]; then
    BINARY="$(realpath src-tauri/target/release/nextaros)"
elif [ -f "src-tauri/target/debug/nextaros" ]; then
    BINARY="$(realpath src-tauri/target/debug/nextaros)"
else
    echo "Error: NextarOS binary not found. Build first with: cargo tauri build"
    echo "  Or for debug: cargo tauri dev (then Ctrl+C)"
    exit 1
fi

echo "Using binary: $BINARY"

# Create X11 session file
mkdir -p /usr/share/xsessions
cat > /usr/share/xsessions/nextaros.desktop << EOF
[Desktop Entry]
Name=NextarOS
Comment=NextarOS Desktop Environment
Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS QT_QPA_PLATFORMTHEME=qt5ct $BINARY --session
TryExec=$BINARY
Type=Application
DesktopNames=NextarOS
X-Ubuntu-Gettext-Domain=nextaros
EOF
echo "Installed: /usr/share/xsessions/nextaros.desktop"

# Create Wayland session file
mkdir -p /usr/share/wayland-sessions
cat > /usr/share/wayland-sessions/nextaros.desktop << EOF
[Desktop Entry]
Name=NextarOS (Wayland)
Comment=NextarOS Desktop Environment on Wayland
Exec=env NEXTAROS_SESSION=1 DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros XDG_CURRENT_DESKTOP=NextarOS XDG_SESSION_TYPE=wayland QT_QPA_PLATFORMTHEME=qt5ct $BINARY --session --ozone-platform-hint=auto
TryExec=$BINARY
Type=Application
DesktopNames=NextarOS
EOF
echo "Installed: /usr/share/wayland-sessions/nextaros.desktop"

echo ""
echo "Done! NextarOS will now appear as a session option in SDDM/GDM."
echo "Log out and select 'NextarOS' from the session picker."
