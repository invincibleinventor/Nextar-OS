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
    background: rgba(30, 30, 30, 0.85) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset !important;
    color: white !important;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif !important;
}

.driver-popover-title {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: white !important;
    margin-bottom: 6px !important;
}

.driver-popover-description {
    font-size: 13px !important;
    color: rgba(255, 255, 255, 0.8) !important;
    line-height: 1.5 !important;
    white-space: pre-line !important;
}

.driver-popover-progress-text {
    font-size: 11px !important;
    color: rgba(255, 255, 255, 0.5) !important;
}

.driver-popover-navigation-btns {
    gap: 8px !important;
}

.driver-popover-prev-btn,
.driver-popover-next-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-size: 13px !important;
    font-weight: 400 !important;
    transition: all 0.15s ease !important;
}

.driver-popover-prev-btn:hover,
.driver-popover-next-btn:hover {
    background: rgba(255, 255, 255, 0.2) !important;
}

.driver-popover-next-btn {
    background: #007AFF !important;
}

.driver-popover-next-btn:hover {
    background: #0056b3 !important;
}

.driver-popover-close-btn {
    color: rgba(255, 255, 255, 0.6) !important;
    width: 24px !important;
    height: 24px !important;
}

.driver-popover-close-btn:hover {
    color: white !important;
}

.driver-popover-arrow {
    border-color: rgba(30, 30, 30, 0.85) !important;
}

.driver-popover-arrow-side-bottom {
    border-top-color: rgba(30, 30, 30, 0.85) !important;
}

.driver-popover-arrow-side-top {
    border-bottom-color: rgba(30, 30, 30, 0.85) !important;
}

.driver-popover-arrow-side-left {
    border-right-color: rgba(30, 30, 30, 0.85) !important;
}

.driver-popover-arrow-side-right {
    border-left-color: rgba(30, 30, 30, 0.85) !important;
}
`;

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
    const { ismobile } = useDevice();

    useEffect(() => {
        const styleId = 'tour-macos-styles';
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
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            stagePadding: 8,
            stageRadius: 12,
            popoverClass: 'macos-tour-popover',
            onDestroyStarted: () => {
                driverInstance.destroy();
                onClose();
            },
            steps: ismobile ? [
                {
                    popover: {
                        title: '👋 Welcome to iOS Mode!',
                        description: 'Experience a web-based iOS interface. Let us show you around!',
                        side: 'bottom',
                        align: 'center'
                    }
                },
                {
                    element: '[data-tour="ios-statusbar"]',
                    popover: {
                        title: '📱 Status Bar',
                        description: 'Time, network, and battery status.\n\n↓ Swipe down from top-right for Control Center',
                        side: 'bottom'
                    }
                },
                {
                    element: '[data-tour="ios-apps"]',
                    popover: {
                        title: '📲 Home Screen',
                        description: 'Tap apps to open them.\nLong-press for options and edit mode.',
                        side: 'top'
                    }
                },
                {
                    element: '[data-tour="ios-dock"]',
                    popover: {
                        title: '🚀 Dock',
                        description: 'Your favorite apps. Always accessible from any page.',
                        side: 'top'
                    }
                },
                {
                    popover: {
                        title: '✋ Gestures',
                        description: '↓ Swipe from top-right: Control Center\n↓ Swipe from top-left: Notifications\n↑ Swipe from bottom: Home/Recent Apps\n← → Swipe horizontally: Switch pages',
                        side: 'bottom'
                    }
                },
                {
                    popover: {
                        title: '🎉 Enjoy!',
                        description: 'Explore apps, swipe between pages, and experience iOS on the web!',
                        side: 'bottom'
                    }
                }
            ] : [
                {
                    popover: {
                        title: '👋 Welcome to macOS-Next!',
                        description: 'A web-based macOS experience. Let us give you a quick tour!',
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
                    element: '[data-tour="apple-menu"]',
                    popover: {
                        title: ' Apple Menu',
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
                        description: `${modKey}+K: Spotlight Search\n${modKey}+\`: Switch Apps\n${modKey}+W: Close Window\n${modKey}+Shift+T: This Tour`,
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
                        title: '🎉 Enjoy macOS-Next!',
                        description: 'Explore Finder, Safari, Settings, Music, and more.\nBuilt with Next.js, React, and IndexedDB.',
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
