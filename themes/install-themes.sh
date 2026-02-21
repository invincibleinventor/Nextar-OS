#!/bin/bash
# NextarOS Theme Installer
# Installs GTK3/4 and Qt5/6 themes to the correct system locations.
# Called automatically on session login from main.js.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
THEME_SRC="$SCRIPT_DIR/NextarOS"

# --- GTK3 Theme ---
GTK3_DIR="$HOME/.themes/NextarOS/gtk-3.0"
mkdir -p "$GTK3_DIR"
cp "$THEME_SRC/gtk-3.0/gtk.css" "$GTK3_DIR/gtk.css"
cp "$THEME_SRC/index.theme" "$HOME/.themes/NextarOS/index.theme"

# --- GTK4 Theme (uses ~/.config/gtk-4.0/) ---
GTK4_DIR="$HOME/.config/gtk-4.0"
mkdir -p "$GTK4_DIR"
cp "$THEME_SRC/gtk-4.0/gtk.css" "$GTK4_DIR/gtk.css"

# --- Qt5 Color Scheme ---
QT5_DIR="$HOME/.local/share/color-schemes"
mkdir -p "$QT5_DIR"
cp "$THEME_SRC/qt5/NextarOS.conf" "$QT5_DIR/NextarOS.colors"

# --- Qt6 Color Scheme ---
# Qt6 uses the same path
cp "$THEME_SRC/qt6/NextarOS.conf" "$QT5_DIR/NextarOS.colors"

# --- Apply GTK theme via gsettings ---
if command -v gsettings &>/dev/null; then
    gsettings set org.gnome.desktop.interface gtk-theme 'NextarOS' 2>/dev/null || true
    gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark' 2>/dev/null || true
    gsettings set org.gnome.desktop.interface font-name 'Inter 10' 2>/dev/null || true
    gsettings set org.gnome.desktop.interface monospace-font-name 'JetBrains Mono 10' 2>/dev/null || true
fi

# --- Apply Qt theme ---
# Set Qt5 to use the color scheme via qt5ct
QT5CT_DIR="$HOME/.config/qt5ct"
mkdir -p "$QT5CT_DIR"
if [ ! -f "$QT5CT_DIR/qt5ct.conf" ] || ! grep -q "NextarOS" "$QT5CT_DIR/qt5ct.conf" 2>/dev/null; then
    cat > "$QT5CT_DIR/qt5ct.conf" << 'QTCONF'
[Appearance]
color_scheme_path=/home/$USER/.local/share/color-schemes/NextarOS.colors
style=Fusion

[Fonts]
fixed="JetBrains Mono,10,-1,5,50,0,0,0,0,0"
general="Inter,10,-1,5,50,0,0,0,0,0"
QTCONF
    # Fix the path with actual home dir
    sed -i "s|\$USER|$(whoami)|g" "$QT5CT_DIR/qt5ct.conf"
fi

# Export env vars for Qt theming
echo "export QT_QPA_PLATFORMTHEME=qt5ct" >> "$HOME/.profile" 2>/dev/null || true

echo "[NextarOS] Themes installed successfully"
