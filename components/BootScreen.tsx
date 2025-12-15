import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usedevice } from './DeviceContext';
import { FaApple } from 'react-icons/fa';

export default function BootScreen() {
    const { osstate, setosstate } = usedevice();
    const [progress, setprogress] = useState(0);

    useEffect(() => {
        if (osstate === 'booting') {
            const interval = setInterval(() => {
                setprogress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            if (osstate === 'booting') setosstate('locked');
                        }, 500);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [osstate, setosstate]);

    return (
        <AnimatePresence>
            {osstate === 'booting' && (
                <motion.div
                    key="bootscreen"
                    className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-center cursor-none"
                    exit={{ opacity: 0, transition: { duration: 1 } }}
                    initial={{ opacity: 1 }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-16"
                    >
                        <FaApple className="text-white w-24 h-24" />
                    </motion.div>

                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch((e) => console.log(e))}
                        className="absolute bottom-10 p-2 text-white/30 hover:text-white transition-colors text-xs uppercase tracking-widest z-[10001]"
                    >
                        Go Full Screen
                    </button>

                    <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
