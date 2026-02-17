#!/bin/bash
# Post-install script for NextarOS .deb package

# Fix chrome-sandbox SUID permissions so Electron can launch without --no-sandbox
SANDBOX="/opt/NextarOS/chrome-sandbox"
if [ -f "$SANDBOX" ]; then
    chown root:root "$SANDBOX"
    chmod 4755 "$SANDBOX"
fi

# Install xsession .desktop file so display managers (GDM, LightDM, SDDM) can offer NextarOS
XSESSION_DIR="/usr/share/xsessions"
if [ -d "$XSESSION_DIR" ] || mkdir -p "$XSESSION_DIR" 2>/dev/null; then
    cat > "$XSESSION_DIR/nextaros.desktop" << 'EOF'
[Desktop Entry]
Name=NextarOS
Comment=NextarOS Desktop Environment
Exec=/opt/NextarOS/nextaros --no-sandbox --session
TryExec=/opt/NextarOS/nextaros
Type=Application
DesktopNames=NextarOS
X-LightDM-DesktopName=NextarOS
EOF
fi

# Update desktop database
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi

exit 0
