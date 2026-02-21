#!/bin/bash
# Post-install script for NextarOS .deb package

# Fix chrome-sandbox SUID permissions so Electron can launch without --no-sandbox
SANDBOX="/opt/NextarOS/chrome-sandbox"
if [ -f "$SANDBOX" ]; then
    chown root:root "$SANDBOX"
    chmod 4755 "$SANDBOX"
fi

# Install X11 session .desktop file for display managers (GDM, LightDM, SDDM).
# Only X11 sessions are supported — Wayland sessions require the session binary
# to BE the compositor. GDM can still run X11 sessions on Wayland systems.
XSESSION_DIR="/usr/share/xsessions"
if [ -d "$XSESSION_DIR" ] || mkdir -p "$XSESSION_DIR" 2>/dev/null; then
    cat > "$XSESSION_DIR/nextaros.desktop" << 'EOF'
[Desktop Entry]
Name=NextarOS
Comment=NextarOS Desktop Environment
Exec=env DESKTOP_SESSION=nextaros XDG_SESSION_DESKTOP=nextaros /opt/NextarOS/nextaros --no-sandbox --session
TryExec=/opt/NextarOS/nextaros
Type=Application
DesktopNames=NextarOS
X-LightDM-DesktopName=NextarOS
EOF
fi

# Make theme installer executable
THEME_SCRIPT="/opt/NextarOS/resources/themes/install-themes.sh"
if [ -f "$THEME_SCRIPT" ]; then
    chmod +x "$THEME_SCRIPT"
fi

# Update desktop database
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi

exit 0
