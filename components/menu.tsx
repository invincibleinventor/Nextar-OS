'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Menu(props: any) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                props.onToggle(null);
            }
        };

        if (props.visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [props.visible]);

    return (
        <div
            className="relative"
            onMouseEnter={() => props.onHover(props.id)}
        >
            <motion.div
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.onToggle(props.id);
                }}
                className={`${
                    props.bold ? 'font-bold' : 'font-normal'
                } font-sf px-2 rounded-md cursor-pointer duration-100 transition-all ease-in dark:hover:bg-white dark:hover:bg-opacity-20 hover:bg-white hover:bg-opacity-20 text-[13px] dark:text-white text-black ${
                    props.visible
                        ? 'bg-white dark:bg-black dark:bg-opacity-20 bg-opacity-20'
                        : ''
                }`}
                whileHover={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
            >
                {props.title}
            </motion.div>

            {props.visible && (
                <motion.div
                ref={ref}
                id="menudropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                style={{ zIndex: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}

                className="absolute left-0 sm:left-auto mt-2 min-w-56 w-max bg-white/20 dark:bg-black/20 rounded-lg flex flex-col space-y-[1px] p-[6px] shadow-lg z-[10]"
            >
            
                    {props.data.map((item: any, idx: number) =>
                        item.separator ? (
                            <div key={`sep-${idx}`} className="py-1 px-1">
                                <div className="dark:bg-neutral-500 dark:bg-opacity-50 bg-neutral-700 h-[0.1px]" />
                            </div>
                        ) : (
                            <div
                                key={item.title}
                                className={`py-[2px] px-2 text-sm dark:text-white text-black rounded-md ${
                                    item.disabled
                                        ? 'text-neutral-700 dark:text-neutral-400 cursor-not-allowed'
                                        : 'dark:hover:bg-blue-600 hover:bg-blue-500 hover:text-white cursor-pointer'
                                }`}
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
