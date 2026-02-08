'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Menu(props: any) {
    const menuref = useRef<HTMLDivElement>(null);

    const { visible, ontoggle } = props;

    useEffect(() => {
        if (!visible) return;

        const handleclick = (e: MouseEvent) => {
            if (menuref.current && !menuref.current.contains(e.target as Node)) {
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

    return (
        <div ref={menuref} className="relative" onMouseEnter={() => props.onhover?.(props.id)}>
            <motion.div
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.ontoggle(props.visible ? null : props.id);
                }}
                className={`${props.bold ? 'font-bold' : 'font-medium'} font-mono px-3 cursor-pointer duration-100 transition-all ease-in hover:bg-pastel-lavender/15 text-[14px] text-[--text-color] ${props.visible ? 'bg-pastel-lavender/15' : ''}`}
                whileHover={{ scale: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            >
                {props.title}
            </motion.div>

            {props.visible && (
                <motion.div
                    id="menudropdown"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    style={{ zIndex: 99999 }}
                    className="absolute left-0 mt-3 min-w-[220px] bg-overlay border border-[--border-color] p-[5px] flex flex-col font-mono anime-glow-sm"
                >
                    {props.data.map((item: any, idx: number) =>
                        item.separator ? (
                            <div key={`sep-${idx}`} className="h-[1px] bg-[--border-color] my-1 mx-2" />
                        ) : (
                            <div
                                key={item.title || idx}
                                className={`px-3 py-1 text-[13px] font-medium transition-colors ${item.disabled
                                    ? 'opacity-50 cursor-not-allowed text-[--text-muted]'
                                    : 'text-[--text-color] hover:bg-accent hover:text-[--bg-base] cursor-pointer active:bg-accent/80'
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
            )}
        </div>
    );
}
