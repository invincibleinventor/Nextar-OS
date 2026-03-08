'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useIsClay } from './hooks/useIsClay';

export default function Menu(props: any) {
    const menuref = useRef<HTMLDivElement>(null);
    const triggerref = useRef<HTMLDivElement>(null);
    const dropdownref = useRef<HTMLDivElement>(null);
    const clay = useIsClay();
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

    const { visible, ontoggle } = props;

    // Calculate dropdown position from trigger element
    useEffect(() => {
        if (!visible || !triggerref.current) {
            setDropdownPos(null);
            return;
        }
        const rect = triggerref.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 14, left: rect.left });
    }, [visible]);

    // Close on outside click — check both trigger and portal dropdown
    useEffect(() => {
        if (!visible) return;

        const handleclick = (e: MouseEvent) => {
            const target = e.target as Node;
            const inTrigger = menuref.current && menuref.current.contains(target);
            const inDropdown = dropdownref.current && dropdownref.current.contains(target);
            if (!inTrigger && !inDropdown) {
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

    const dropdownContent = visible && dropdownPos && createPortal(
        <div
            ref={dropdownref}
            id="menudropdown"
            className={`fixed min-w-[200px] flex flex-col ${clay
                ? 'rounded-[10px] p-[4px] font-sans'
                : 'bg-overlay border border-[--border-color] font-mono anime-glow-sm p-[5px]'
            }`}
            style={clay ? {
                zIndex: 99999,
                top: dropdownPos.top,
                left: dropdownPos.left,
                background: 'color-mix(in srgb, var(--accent-source) 4%, color-mix(in srgb, var(--bg-glass) 20%, transparent))',
                backdropFilter: 'blur(var(--glass-blur-heavy))',
                WebkitBackdropFilter: 'blur(var(--glass-blur-heavy))',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
            } : {
                zIndex: 99999,
                top: dropdownPos.top,
                left: dropdownPos.left,
            }}
        >
            {props.data.map((item: any, idx: number) =>
                item.separator ? (
                    <div
                        key={`sep-${idx}`}
                        className={`h-[1px] mx-2 ${clay
                            ? 'my-[3px] bg-[--glass-border]'
                            : 'my-[3px] bg-[--border-color]'
                        }`}
                    />
                ) : (
                    <div
                        key={item.title || idx}
                        className={`flex items-center gap-2.5 font-medium transition-all duration-100 ${clay
                            ? 'px-2.5 py-[5px] text-[12.5px] rounded-[6px] font-sans'
                            : 'px-3 py-[5px] text-[13px]'
                        } ${item.disabled
                            ? 'opacity-40 cursor-not-allowed text-[--text-color]'
                            : clay
                                ? 'text-[--text-color] hover:bg-white/10 cursor-pointer active:scale-[0.97]'
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
                        {item.icon && <span className="w-4 h-4 flex items-center justify-center opacity-80 text-[15px]">{item.icon}</span>}
                        {item.title}
                    </div>
                )
            )}
        </div>,
        document.body
    );

    return (
        <div ref={menuref} className="relative" onMouseEnter={() => props.onhover?.(props.id)}>
            <motion.div
                ref={triggerref}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.ontoggle(props.visible ? null : props.id);
                }}
                className={`${props.bold ? 'font-extrabold' : 'font-semibold'} cursor-pointer duration-100 transition-all ease-in text-[--text-color] ${clay
                    ? 'rounded-[10px] px-3 py-1 text-[13px] font-sans'
                    : `font-mono text-[14px] px-3 ${props.visible ? 'bg-pastel-lavender/15' : 'hover:bg-pastel-lavender/15'}`
                }`}
                style={clay ? (props.visible
                    ? { background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }
                    : undefined
                ) : undefined}
                whileHover={clay ? (props.visible ? {} : { scale: 1.04 }) : { scale: 1 }}
                whileTap={clay ? { scale: 0.95 } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {props.title}
            </motion.div>

            {dropdownContent}
        </div>
    );
}
