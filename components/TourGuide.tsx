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
/* Overlay */
.driver-overlay {
    background: rgba(0,0,0,0.55) !important;
    backdrop-filter: blur(2px) !important;
    -webkit-backdrop-filter: blur(2px) !important;
}

/* Highlighted element border glow */
.driver-active-element {
    outline: 2px solid var(--accent-color) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent-color) 20%, transparent) !important;
}

/* Popover container */
.driver-popover {
    background: color-mix(in srgb, var(--bg-surface) 85%, transparent) !important;
    backdrop-filter: blur(20px) saturate(1.4) !important;
    -webkit-backdrop-filter: blur(20px) saturate(1.4) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0px !important;
    color: var(--text-color) !important;
    font-family: "SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
    box-shadow:
        0 8px 32px rgba(0,0,0,0.2),
        0 2px 8px rgba(0,0,0,0.1),
        0 0 0 1px color-mix(in srgb, var(--accent-color) 8%, transparent),
        inset 0 1px 0 color-mix(in srgb, white 5%, transparent) !important;
    padding: 20px !important;
    max-width: 340px !important;
    animation: tourPopoverIn 150ms ease-out !important;
}

@keyframes tourPopoverIn {
    from { opacity: 0; transform: scale(0.95) translateY(4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Title */
.driver-popover-title {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: var(--text-color) !important;
    margin-bottom: 8px !important;
    letter-spacing: -0.01em !important;
}

/* Description */
.driver-popover-description {
    font-size: 13px !important;
    color: var(--text-muted) !important;
    line-height: 1.6 !important;
    white-space: pre-line !important;
}

/* Hide default progress text (we inject custom progress) */
.driver-popover-progress-text {
    display: none !important;
}

/* Custom segmented progress bar */
.tour-progress-bar {
    display: flex;
    gap: 4px;
    margin-top: 14px;
    margin-bottom: 4px;
}

.tour-progress-segment {
    width: 100%;
    height: 3px;
    background: color-mix(in srgb, var(--text-muted) 20%, transparent);
    transition: background 0.2s ease, box-shadow 0.2s ease;
}

.tour-progress-segment.completed {
    background: var(--accent-color);
}

.tour-progress-segment.active {
    background: var(--accent-color);
    box-shadow: 0 0 6px color-mix(in srgb, var(--accent-color) 50%, transparent);
    animation: tourSegmentPulse 1.5s ease-in-out infinite;
}

@keyframes tourSegmentPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.tour-step-counter {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
}

/* Button container */
.driver-popover-navigation-btns {
    gap: 8px !important;
    margin-top: 16px !important;
}

/* Previous button */
.driver-popover-prev-btn {
    background: transparent !important;
    color: var(--text-color) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 0px !important;
    padding: 8px 16px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.02em !important;
    transition: all 0.15s ease !important;
    text-transform: uppercase !important;
}

.driver-popover-prev-btn:hover {
    background: color-mix(in srgb, var(--text-color) 8%, transparent) !important;
    border-color: var(--text-muted) !important;
}

/* Next button */
.driver-popover-next-btn {
    background: var(--accent-color) !important;
    color: var(--bg-base) !important;
    border: 1px solid var(--accent-color) !important;
    border-radius: 0px !important;
    padding: 8px 20px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
    transition: all 0.15s ease !important;
    text-transform: uppercase !important;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-color) 30%, transparent) !important;
}

.driver-popover-next-btn:hover {
    filter: brightness(1.1) !important;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-color) 40%, transparent) !important;
}

/* Close button */
.driver-popover-close-btn {
    color: var(--text-muted) !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: color 0.15s ease !important;
}

.driver-popover-close-btn:hover {
    color: var(--text-color) !important;
}

/* Arrow styling */
.driver-popover-arrow {
    border-color: transparent !important;
}

.driver-popover-arrow-side-bottom .driver-popover-arrow {
    border-top-color: color-mix(in srgb, var(--bg-surface) 85%, transparent) !important;
}

.driver-popover-arrow-side-top .driver-popover-arrow {
    border-bottom-color: color-mix(in srgb, var(--bg-surface) 85%, transparent) !important;
}

.driver-popover-arrow-side-left .driver-popover-arrow {
    border-right-color: color-mix(in srgb, var(--bg-surface) 85%, transparent) !important;
}

.driver-popover-arrow-side-right .driver-popover-arrow {
    border-left-color: color-mix(in srgb, var(--bg-surface) 85%, transparent) !important;
}

/* Footer area */
.driver-popover-footer {
    margin-top: 0 !important;
    padding-top: 0 !important;
}
`;

function injectProgress(popoverEl: Element, stepIndex: number, totalSteps: number) {
    const existing = popoverEl.querySelector('.tour-progress-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'tour-progress-container';

    const bar = document.createElement('div');
    bar.className = 'tour-progress-bar';

    for (let i = 0; i < totalSteps; i++) {
        const seg = document.createElement('div');
        seg.className = 'tour-progress-segment';
        if (i < stepIndex) seg.classList.add('completed');
        else if (i === stepIndex) seg.classList.add('active');
        bar.appendChild(seg);
    }

    const counter = document.createElement('div');
    counter.className = 'tour-step-counter';
    counter.textContent = `${stepIndex + 1} of ${totalSteps}`;

    container.appendChild(bar);
    container.appendChild(counter);

    const desc = popoverEl.querySelector('.driver-popover-description');
    if (desc) desc.after(container);
}

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
    const modKey = isMac ? '\u2318' : 'Ctrl';

    const startTour = useCallback(() => {
        const mobileSteps = [
            {
                popover: {
                    title: 'Welcome to NextarOS',
                    description: 'A full mobile OS experience in your browser.\nLet\'s walk through the key features.',
                    side: 'bottom' as const,
                    align: 'center' as const
                }
            },
            {
                element: '[data-tour="ios-statusbar"]',
                popover: {
                    title: 'Status Bar',
                    description: 'Shows time, signal, and battery.\n\nSwipe down from the top-right corner to open Control Center.',
                    side: 'bottom' as const
                }
            },
            {
                element: '[data-tour="ios-apps"]',
                popover: {
                    title: 'Home Screen Apps',
                    description: 'Tap any app icon to launch it.\nLong-press an icon to enter edit mode for rearranging.',
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
                    description: 'Down from top-right \u2192 Control Center\nDown from top-left \u2192 Notifications\nUp from bottom \u2192 Home / Recent Apps\nLeft/Right \u2192 Pages & App Library',
                    side: 'bottom' as const
                }
            },
            {
                popover: {
                    title: 'Draggable Panels',
                    description: 'Notification and Control panels can be dragged up and down.\nSwipe them away to dismiss.',
                    side: 'bottom' as const
                }
            },
            {
                popover: {
                    title: 'You\'re All Set',
                    description: 'Explore the apps, customize settings, and enjoy NextarOS.',
                    side: 'bottom' as const
                }
            }
        ];

        const desktopSteps = [
            {
                popover: {
                    title: 'Welcome to NextarOS',
                    description: 'A web-based desktop experience.\nLet us give you a quick tour of the interface.',
                    side: 'bottom' as const,
                    align: 'center' as const
                }
            },
            {
                element: '[data-tour="menubar"]',
                popover: {
                    title: 'Menu Bar',
                    description: 'The menu bar shows app menus and system status.\nClick items to explore options.',
                    side: 'bottom' as const
                }
            },
            {
                element: '[data-tour="dynamic-main-menu"]',
                popover: {
                    title: 'Main Menu',
                    description: 'Access System Settings, sleep, restart, and logout from here.',
                    side: 'bottom' as const
                }
            },
            {
                element: '[data-tour="desktop"]',
                popover: {
                    title: 'Desktop',
                    description: 'Double-click icons to open apps.\nRight-click for context menu.\nDrag to organize.',
                    side: 'top' as const
                }
            },
            {
                element: '[data-tour="dock"]',
                popover: {
                    title: 'Dock',
                    description: 'Your favorite apps live here.\nClick to open, right-click for options.\nHover for magnification effect.',
                    side: 'top' as const
                }
            },
            {
                popover: {
                    title: 'Keyboard Shortcuts',
                    description: `${modKey}+K \u2014 Next Search\n${modKey}+\` \u2014 Switch Apps\n${modKey}+W \u2014 Close Window\n${modKey}+Shift+T \u2014 This Tour`,
                    side: 'bottom' as const
                }
            },
            {
                popover: {
                    title: 'Multi-User Support',
                    description: 'Multiple users supported with separate files and settings.\nCreate accounts in Settings.',
                    side: 'bottom' as const
                }
            },
            {
                popover: {
                    title: 'Enjoy NextarOS',
                    description: 'Explore Explorer, Browser, Settings, Music, and more.\nBuilt with Next.js, React, and IndexedDB.',
                    side: 'bottom' as const
                }
            }
        ];

        const steps = ismobile ? mobileSteps : desktopSteps;

        const driverInstance = driver({
            showProgress: false,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0,0,0,0.55)',
            stagePadding: 10,
            stageRadius: 0,
            popoverClass: 'nextaros-tour-popover',
            onPopoverRender: (popover) => {
                const idx = driverInstance.getActiveIndex() ?? 0;
                injectProgress(popover.wrapper, idx, steps.length);
            },
            onDestroyStarted: () => {
                driverInstance.destroy();
                onClose();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('tour-ended'));
                }
            },
            steps
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
