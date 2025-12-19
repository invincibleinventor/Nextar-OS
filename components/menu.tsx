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
            document.addEventListener('click', handleclick);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleclick);
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
                className={`${props.bold ? 'font-bold' : 'font-medium'} font-sf px-3 rounded-md cursor-pointer duration-100 transition-all ease-in dark:hover:bg-white dark:hover:bg-opacity-20 hover:bg-white hover:bg-opacity-20 text-[14px] dark:text-white text-black ${props.visible ? 'bg-white dark:bg-white dark:bg-opacity-20 bg-opacity-20' : ''}`}
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
                    className="absolute left-0 mt-1 min-w-[220px] bg-white/70 dark:bg-[#1e1e1e]/70 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-[5px] flex flex-col font-sf"
                >
                    {props.data.map((item: any, idx: number) =>
                        item.separator ? (
                            <div key={`sep-${idx}`} className="h-[1px] bg-black/10 dark:bg-white/10 my-1 mx-2" />
                        ) : (
                            <div
                                key={item.title || idx}
                                className={`px-3 py-1 rounded-[5px] text-[13px] font-medium transition-colors ${item.disabled
                                    ? 'opacity-50 cursor-not-allowed text-gray-400'
                                    : 'text-black dark:text-white hover:bg-[#007AFF] hover:text-white cursor-pointer active:bg-blue-600'
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
