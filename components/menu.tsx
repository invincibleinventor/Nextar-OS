'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useIsClay } from './hooks/useIsClay';
import { glassPanel } from './hooks/useClayStyles';

export default function Menu(props: any) {
    const menuref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const clay = useIsClay();
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    const { visible, ontoggle } = props;

    // Position the portal dropdown relative to the trigger
    useEffect(() => {
        if (!visible || !clay || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }, [visible, clay]);

    useEffect(() => {
        if (!visible) return;

        const handleclick = (e: MouseEvent) => {
            const target = e.target as Node;
            // Check both the menu trigger area and the portal dropdown
            const insideMenu = menuref.current?.contains(target);
            const insideDropdown = dropdownRef.current?.contains(target);
            if (!insideMenu && !insideDropdown) {
                ontoggle(null);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleclick);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleclick);
        };
    }, [visible, ontoggle]);

    const dropdownContent = (
        <motion.div
            ref={dropdownRef}
            id="menudropdown"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={clay
                ? { type: 'spring', stiffness: 500, damping: 28, mass: 0.8 }
                : { duration: 0.1 }
            }
            style={clay
                ? {
                    zIndex: 99999,
                    ...glassPanel,
                    backdropFilter: 'blur(var(--glass-blur-heavy))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                    ...(dropdownPos ? { position: 'fixed' as const, top: dropdownPos.top, left: dropdownPos.left } : {}),
                }
                : { zIndex: 99999 }
            }
            className={`${clay ? 'fixed' : 'absolute left-0 mt-3'} min-w-[230px] p-[7px] flex flex-col ${clay
                ? 'rounded-[12px] font-sans'
                : 'bg-overlay border border-[--border-color] font-mono anime-glow-sm'
            }`}
        >
            {props.data.map((item: any, idx: number) =>
                item.separator ? (
                    <div
                        key={`sep-${idx}`}
                        className={`h-[1px] my-[5px] mx-3 ${clay
                            ? 'border-t border-[--glass-border] bg-transparent'
                            : 'bg-[--border-color]'
                        }`}
                    />
                ) : (
                    <div
                        key={item.title || idx}
                        style={clay && !item.disabled ? { transition: 'box-shadow 0.15s, background 0.15s, transform 0.15s' } : undefined}
                        className={`px-3.5 py-[7px] text-[13px] font-medium transition-all duration-150 ${clay
                            ? 'rounded-[8px] font-sans'
                            : ''
                        } ${item.disabled
                            ? 'opacity-50 cursor-not-allowed text-[--text-muted]'
                            : clay
                                ? 'text-[--text-color] hover:bg-[--bg-glass-hover] cursor-pointer active:scale-[0.97]'
                                : 'text-[--text-color] hover:bg-accent hover:text-[--bg-base] cursor-pointer active:opacity-80'
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!item.disabled) {
                                if (props.onaction) {
                                    props.onaction(item);
                                }
                                props.ontoggle(null);
                            }
                        }}
                    >
                        {item.title}
                    </div>
                )
            )}
        </motion.div>
    );

    return (
        <div ref={menuref} className="relative" onMouseEnter={() => props.onhover?.(props.id)}>
            <motion.div
                ref={triggerRef}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.ontoggle(props.visible ? null : props.id);
                }}
                className={`${props.bold ? 'font-bold' : 'font-medium'} cursor-pointer duration-100 transition-all ease-in text-[--text-color] ${clay
                    ? 'rounded-[10px] px-3 py-1 text-[13px] font-sans'
                    : `font-mono text-[14px] px-3 ${props.visible ? 'bg-pastel-lavender/15' : 'hover:bg-pastel-lavender/15'}`
                }`}
                style={clay ? (props.visible
                    ? { background: 'var(--bg-glass-active)', borderRadius: '10px' }
                    : undefined
                ) : undefined}
                whileHover={clay ? (props.visible ? {} : { scale: 1.04 }) : { scale: 1 }}
                whileTap={clay ? { scale: 0.95 } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {props.title}
            </motion.div>

            {props.visible && (
                clay && typeof document !== 'undefined'
                    ? createPortal(dropdownContent, document.body)
                    : dropdownContent
            )}
        </div>
    );
}
