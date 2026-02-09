'use client';
import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useDevice } from './DeviceContext';

interface TourGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const tourStyles = `
.driver-popover {
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0px !important;
    box-shadow: 4px 4px 0px var(--border-color) !important;
    color: var(--text-color) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif !important;
}

.driver-popover-title {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: var(--text-color) !important;
    margin-bottom: 6px !important;
}

.driver-popover-description {
    font-size: 13px !important;
    color: var(--text-muted) !important;
    line-height: 1.5 !important;
    white-space: pre-line !important;
}

.driver-popover-progress-text {
    font-size: 11px !important;
    color: var(--text-muted) !important;
}

.driver-popover-navigation-btns {
    gap: 8px !important;
}

.driver-popover-prev-btn,
.driver-popover-next-btn {
    background: var(--bg-overlay) !important;
    color: var(--text-color) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0px !important;
    padding: 8px 16px !important;
    font-size: 13px !important;
    font-weight: 400 !important;
    transition: all 0.15s ease !important;
}

.driver-popover-prev-btn:hover,
.driver-popover-next-btn:hover {
    background: var(--bg-overlay) !important;
}

.driver-popover-next-btn {
    background: var(--accent-color) !important;
    color: var(--bg-base) !important;
    border: 1px solid var(--accent-color) !important;
}

.driver-popover-next-btn:hover {
    opacity: 0.8 !important;
}

.driver-popover-close-btn {
    color: var(--text-muted) !important;
    width: 24px !important;
    height: 24px !important;
}

.driver-popover-close-btn:hover {
    color: var(--text-color) !important;
}

.driver-popover-arrow {
    border-color: var(--bg-surface) !important;
}

.driver-popover-arrow-side-bottom {
    border-top-color: var(--bg-surface) !important;
}

.driver-popover-arrow-side-top {
    border-bottom-color: var(--bg-surface) !important;
}

.driver-popover-arrow-side-left {
    border-right-color: var(--bg-surface) !important;
}

.driver-popover-arrow-side-right {
    border-left-color: var(--bg-surface) !important;
}
`;

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
    const { ismobile } = useDevice();

    useEffect(() => {
        const styleId = 'tour-nextaros-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = tourStyles;
            document.head.appendChild(style);
        }
    }, []);

    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac');
    const modKey = isMac ? '⌘' : 'Ctrl';

    const startTour = useCallback(() => {
        const driverInstance = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: 'var(--bg-base)',
            stagePadding: 8,
            stageRadius: 0,
            popoverClass: 'nextaros-tour-popover',
            onDestroyStarted: () => {
                driverInstance.destroy();
                onClose();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('tour-ended'));
                }
            },
            steps: ismobile ? [
                {
                    popover: {
                        title: 'Welcome to NextarOS',
                        description: 'A full mobile OS experience in your browser.\nLet\'s walk through the key features!',
                        side: 'bottom' as const,
                        align: 'center' as const
                    }
                },
                {
                    element: '[data-tour="ios-statusbar"]',
                    popover: {
                        title: 'Status Bar',
                        description: 'Shows time, signal, and battery.\n\nTry it: Swipe down from the TOP-RIGHT corner to open Control Center.',
                        side: 'bottom' as const
                    }
                },
                {
                    element: '[data-tour="ios-apps"]',
                    popover: {
                        title: 'Home Screen Apps',
                        description: 'Tap any app icon to launch it.\nLong-press an icon to enter edit mode (rearrange & delete).',
                        side: 'top' as const
                    }
                },
                {
                    element: '[data-tour="ios-dock"]',
                    popover: {
                        title: 'Dock',
                        description: 'Quick-access apps pinned at the bottom.\nThese stay visible on every home screen page.',
                        side: 'top' as const
                    }
                },
                {
                    popover: {
                        title: 'Swipe Gestures',
                        description: 'Swipe DOWN from top-right → Control Center\nSwipe DOWN from top-left → Notifications\nSwipe UP from bottom → Home / Recent Apps\nSwipe LEFT/RIGHT → Switch pages & App Library',
                        side: 'bottom' as const
                    }
                },
                {
                    popover: {
                        title: 'Draggable Panels',
                        description: 'Notification and Control panels can be dragged up and down.\nSwipe them away to dismiss!',
                        side: 'bottom' as const
                    }
                },
                {
                    popover: {
                        title: 'You\'re All Set!',
                        description: 'Explore the apps, customize settings, and enjoy NextarOS.\nHave fun!',
                        side: 'bottom' as const
                    }
                }
            ] : [
                {
                    popover: {
                        title: '👋 Welcome to NextarOS!',
                        description: 'A web-based desktop experience. Let us give you a quick tour!',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '[data-tour="menubar"]',
                    popover: {
                        title: '📋 Menu Bar',
                        description: 'The menu bar shows app menus and system status.\nClick items to explore options.',
                        side: 'bottom'
                    }
                },
                {
                    element: '[data-tour="dynamic-main-menu"]',
                    popover: {
                        title: ' Main Menu',
                        description: 'Access System Settings, sleep, restart, and logout from here.',
                        side: 'bottom'
                    }
                },
                {
                    element: '[data-tour="desktop"]',
                    popover: {
                        title: '🖥️ Desktop',
                        description: 'Double-click icons to open apps.\nRight-click for context menu.\nDrag to organize.',
                        side: 'top'
                    }
                },
                {
                    element: '[data-tour="dock"]',
                    popover: {
                        title: '🚀 Dock',
                        description: 'Your favorite apps live here.\nClick to open, right-click for options.\nHover for magnification effect.',
                        side: 'top'
                    }
                },
                {
                    popover: {
                        title: '⌨️ Keyboard Shortcuts',
                        description: `${modKey}+K: Next Search\n${modKey}+\`: Switch Apps\n${modKey}+W: Close Window\n${modKey}+Shift+T: This Tour`,
                        side: 'bottom'
                    }
                },
                {
                    popover: {
                        title: '👥 Multi-User',
                        description: 'Multiple users supported!\nEach user has their own files and settings.\nCreate accounts in Settings.',
                        side: 'bottom'
                    }
                },
                {
                    popover: {
                        title: '🎉 Enjoy NextarOS!',
                        description: 'Explore Explorer, Browser, Settings, Music, and more.\nBuilt with Next.js, React, and IndexedDB.',
                        side: 'bottom'
                    }
                }
            ]
        });

        driverInstance.drive();
    }, [ismobile, onClose, modKey]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(startTour, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, startTour]);

    return null;
}
