'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Menu(props: any) {
    const ref = useRef<HTMLDivElement>(null);

    const { visible, ontoggle } = props;
    useEffect(() => {
        const handleclickoutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                ontoggle(null);
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleclickoutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleclickoutside);
        };
    }, [visible, ontoggle]);

    return (
        <div
            className="relative"
            onMouseEnter={() => props.onhover(props.id)}
        >
            <motion.div
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.ontoggle(props.id);
                }}
                className={`${props.bold ? 'font-bold' : 'font-medium'
                    } font-sf px-3 rounded-md cursor-pointer duration-100 transition-all ease-in dark:hover:bg-white dark:hover:bg-opacity-20 hover:bg-white hover:bg-opacity-20 text-[14px] dark:text-white text-black ${props.visible
                        ? 'bg-white dark:bg-white dark:bg-opacity-20 bg-opacity-20'
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
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(5px)", transformOrigin: "top left" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transformOrigin: "top left" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)", transformOrigin: "top left" }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ zIndex: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}

                    className="absolute left-0 sm:left-auto mt-4 min-w-56 w-max bg-white/20 dark:bg-neutral-900/20 rounded-xl flex flex-col space-y-[1px] p-[6px]  border-[0.01px] border-neutral-600 dark:border-neutral-700 z-[10]"
                >

                    {props.data.map((item: any, idx: number) =>
                        item.separator ? (
                            <div key={`sep-${idx}`} className="py-2 px-4">
                                <div className="dark:bg-neutral-500 dark:bg-opacity-50 bg-neutral-700 " />
                            </div>
                        ) : (
                            <div
                                key={item.title}
                                className={`py-[4px] px-4 text-[15px] font-medium dark:text-white text-black rounded-lg ${item.disabled
                                    ? 'text-neutral-700 dark:text-neutral-500 cursor-not-allowed'
                                    : 'dark:hover:bg-blue-600 hover:bg-blue-500 hover:text-white cursor-pointer'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.disabled && props.onaction) {
                                        props.onaction(item.title);
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
