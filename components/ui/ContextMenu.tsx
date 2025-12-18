import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const [position, setPosition] = React.useState({ top: y, left: x });

    React.useLayoutEffect(() => {
        if (menuRef.current) {
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
    }, [x, y]);

    const style = {
        top: position.top,
        left: position.left,
    };

    if (!mounted) return null;

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
                    return <div key={index} className="h-[1px] bg-black/10 dark:bg-white/10 my-1 mx-2" />;
                }

                return (
                    <button
                        key={index}
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
                                    : 'text-black dark:text-white hover:bg-[#007AFF] hover:text-white'
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
