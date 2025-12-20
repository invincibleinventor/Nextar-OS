'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '../DeviceContext';

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
    const { ismobile } = useDevice();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
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
                    className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div
                    key="context-sheet"
                    ref={menuRef}
                    className={`fixed bottom-0 left-0 right-0 z-[99999] bg-white/90 dark:bg-[#2c2c2e]/95 backdrop-blur-xl rounded-t-[20px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-2 pb-8 font-sf ${className}`}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
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
                                        w-full text-left px-4 py-3 rounded-xl text-[17px] font-medium transition-colors
                                        ${item.disabled
                                            ? 'opacity-40 text-gray-400'
                                            : item.danger
                                                ? 'text-red-500 active:bg-red-500/10'
                                                : 'text-black dark:text-white active:bg-black/5 dark:active:bg-white/10'
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
                        className="w-full mt-2 py-3.5 rounded-xl bg-white dark:bg-[#3a3a3c] text-[17px] font-semibold text-accent active:bg-gray-100 dark:active:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                </motion.div>
            </AnimatePresence>,
            document.body
        );
    }

    const style = {
        top: position.top,
        left: position.left,
    };

    return createPortal(
        <div
            ref={menuRef}
            className={`fixed z-[99999] min-w-[200px] bg-white/70 dark:bg-[#1e1e1e]/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-[5px] flex flex-col animate-in fade-in zoom-in-95 duration-100 font-sf ${className}`}
            style={style}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={`sep-${index}`} className="h-[1px] bg-black/10 dark:bg-white/10 my-1 mx-2" />;
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
                            w-full text-left px-3 py-1 rounded-[5px] text-[13px] font-medium transition-colors
                            ${item.disabled
                                ? 'opacity-50 cursor-not-allowed text-gray-400'
                                : item.danger
                                    ? 'text-black dark:text-white hover:bg-red-500 hover:text-white'
                                    : 'text-black dark:text-white hover:bg-accent hover:text-white'
                            }
                        `}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>,
        document.body
    );
};

export default ContextMenu;
