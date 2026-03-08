'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '../DeviceContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassShell, glassButton } from '../hooks/useClayStyles';

interface ContextMenuProps {
    x: number;
    y: number;
    items: {
        label?: string;
        action?: () => void;
        disabled?: boolean;
        separator?: boolean;
        danger?: boolean;
    }[];
    onClose: () => void;
    className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, className = '' }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [closeable, setCloseable] = useState(false);
    const { ismobile } = useDevice();
    const clay = useIsClay();

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setCloseable(true), 300);
        return () => { setMounted(false); clearTimeout(timer); };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (!ismobile) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, ismobile]);

    const [position, setPosition] = React.useState({ top: y, left: x });

    React.useLayoutEffect(() => {
        if (menuRef.current && !ismobile) {
            const rect = menuRef.current.getBoundingClientRect();
            let newTop = y;
            let newLeft = x;

            if (y + rect.height > window.innerHeight) {
                newTop = y - rect.height;
            }
            if (x + rect.width > window.innerWidth) {
                newLeft = x - rect.width;
            }

            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;

            setPosition({ top: newTop, left: newLeft });
        }
    }, [x, y, ismobile]);

    if (!mounted) return null;

    if (ismobile) {
        return createPortal(
            <AnimatePresence>
                <motion.div
                    key="context-backdrop"
                    className="fixed inset-0 z-[599] bg-[--bg-base]/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => closeable && onClose()}
                />
                <motion.div
                    key="context-sheet"
                    ref={menuRef}
                    className={`fixed bottom-0 left-0 right-0 z-[600] p-2 pb-8 ${clay ? 'rounded-t-[20px]' : 'bg-surface border-t-2 border-[--border-color] font-mono'} ${className}`}
                    style={clay ? glassShell : undefined}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-10 h-1 bg-[--border-color] mx-auto mb-3" />
                    <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                        {items.map((item, index) => {
                            if (item.separator) {
                                return <div key={`sep-${index}`} className="h-[8px] bg-transparent" />;
                            }

                            return (
                                <button
                                    key={`menu-item-${index}`}
                                    onClick={() => {
                                        if (!item.disabled && item.action) {
                                            item.action();
                                            onClose();
                                        }
                                    }}
                                    disabled={item.disabled}
                                    className={`
                                        w-full text-left px-4 py-3 text-[17px] font-medium transition-colors
                                        ${clay ? 'rounded-[11px] active:scale-[0.97]' : ''}
                                        ${item.disabled
                                            ? 'opacity-40 text-[--text-muted]'
                                            : item.danger
                                                ? 'text-pastel-red active:bg-[--bg-glass-hover]'
                                                : clay
                                                    ? 'text-[--text-color] active:bg-[--bg-glass-hover]'
                                                    : 'text-[--text-color] active:bg-overlay'
                                        }
                                    `}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-full mt-2 py-3.5 text-[17px] font-semibold text-accent transition-colors active:scale-[0.97] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color] active:bg-[--border-color]'}`}
                        style={clay ? glassButton : undefined}
                    >
                        Cancel
                    </button>
                </motion.div>
            </AnimatePresence>,
            document.body
        );
    }

    const neoStyle = clay ? {
        top: position.top,
        left: position.left,
        background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 20%, transparent))',
        backdropFilter: 'blur(var(--glass-blur-heavy))',
        WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
    } : {
        top: position.top,
        left: position.left,
    };

    return createPortal(
        <div
            ref={menuRef}
            className={`fixed z-[600] min-w-[200px] flex flex-col animate-in fade-in zoom-in-95 duration-100 ${clay
                ? 'rounded-[10px] p-[4px] font-sans'
                : 'bg-overlay border border-[--border-color] font-mono anime-glow-sm p-[5px]'
            } ${className}`}
            style={neoStyle}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={`sep-${index}`} className={`h-[1px] mx-2 ${clay ? 'my-[3px] bg-[--glass-border]' : 'my-1 bg-[--border-color]'}`} />;
                }

                return (
                    <button
                        key={`menu-item-${index}`}
                        onClick={() => {
                            if (!item.disabled && item.action) {
                                item.action();
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                        className={`
                            w-full text-left font-medium transition-all duration-100 flex items-center gap-2.5
                            ${clay ? 'rounded-[6px] px-2.5 py-[5px] text-[12.5px]' : 'px-3 py-1.5 text-[13px]'}
                            ${item.disabled
                                ? 'opacity-40 cursor-not-allowed text-[--text-color]'
                                : item.danger
                                    ? clay
                                        ? 'text-pastel-red hover:bg-pastel-red hover:text-white active:scale-[0.97]'
                                        : 'text-[--text-color] hover:bg-pastel-red hover:text-[--bg-base]'
                                    : clay
                                        ? 'text-[--text-color] hover:bg-white/10 active:bg-white/15 active:scale-[0.97]'
                                        : 'text-[--text-color] hover:bg-accent hover:text-[--bg-base]'
                            }
                        `}
                    >
                        {item.icon && <span className="w-4 h-4 flex items-center justify-center opacity-80 text-[15px]">{item.icon}</span>}
                        {item.label}
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

export default ContextMenu;
