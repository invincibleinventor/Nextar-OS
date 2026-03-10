#!/bin/bash
# NextarOS session startup script
# Called by display manager when NextarOS session is selected

# ── XDG Environment ──────────────────────────────────────────────────────
export XDG_CURRENT_DESKTOP="NextarOS"
export XDG_SESSION_DESKTOP="nextaros"
export DESKTOP_SESSION="nextaros"
export XDG_SESSION_TYPE="${XDG_SESSION_TYPE:-x11}"
export NEXTAROS_SESSION=1

# ── Qt Theming ───────────────────────────────────────────────────────────
export QT_QPA_PLATFORMTHEME="qt5ct"
export QT_AUTO_SCREEN_SCALE_FACTOR=1
export QT_ENABLE_HIGHDPI_SCALING=1

# ── GTK Theming ──────────────────────────────────────────────────────────
# Ensure our theme is applied
if [ -f "/usr/share/nextaros/themes/install-themes.sh" ]; then
    bash /usr/share/nextaros/themes/install-themes.sh &
fi

# ── D-Bus Session ────────────────────────────────────────────────────────
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    eval "$(dbus-launch --sh-syntax)"
    export DBUS_SESSION_BUS_ADDRESS
fi

# ── Input Method ─────────────────────────────────────────────────────────
if command -v ibus-daemon > /dev/null 2>&1; then
    export GTK_IM_MODULE="ibus"
    export QT_IM_MODULE="ibus"
    export XMODIFIERS="@im=ibus"
    ibus-daemon -drx &
elif command -v fcitx5 > /dev/null 2>&1; then
    export GTK_IM_MODULE="fcitx"
    export QT_IM_MODULE="fcitx"
    export XMODIFIERS="@im=fcitx"
    fcitx5 -d &
fi

# ── Accessibility ────────────────────────────────────────────────────────
if command -v at-spi-bus-launcher > /dev/null 2>&1; then
    /usr/libexec/at-spi-bus-launcher --launch-immediately &
fi

# ── XDG Autostart ────────────────────────────────────────────────────────
# NextarOS handles autostart apps internally via D-Bus/Tauri
# But launch critical system services here

# PolicyKit agent (gnome-polkit or kde equivalent)
if command -v /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 > /dev/null 2>&1; then
    /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &
elif command -v /usr/lib/policykit-1-gnome/polkit-gnome-authentication-agent-1 > /dev/null 2>&1; then
    /usr/lib/policykit-1-gnome/polkit-gnome-authentication-agent-1 &
fi

# GNOME Keyring daemon
if command -v gnome-keyring-daemon > /dev/null 2>&1; then
    eval "$(gnome-keyring-daemon --start --components=pkcs11,secrets,ssh)"
    export SSH_AUTH_SOCK GNOME_KEYRING_CONTROL
fi

# XSettings daemon for GTK theming
if command -v xsettingsd > /dev/null 2>&1; then
    xsettingsd &
fi

# ── Compositor (X11 only) ────────────────────────────────────────────────
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    # Use picom as compositor for transparency/blur
    if command -v picom > /dev/null 2>&1; then
        picom --backend glx --vsync --no-fading-openclose &
    fi
fi

# ── Launch NextarOS ──────────────────────────────────────────────────────
exec /usr/bin/nextaros --session
