
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoWarning, IoInformationCircle, IoClose } from 'react-icons/io5';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <IoCheckmarkCircle className="text-pastel-green text-xl" />,
        error: <IoWarning className="text-pastel-red text-xl" />,
        info: <IoInformationCircle className="text-pastel-blue text-xl" />
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm bg-surface border border-[--border-color] border-l-4 border-l-accent p-4 pr-10 relative overflow-hidden anime-glow-sm"
        >
            <div className="shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium text-[--text-color]">
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
                className="absolute top-2 right-2 p-1 hover:bg-overlay transition-colors text-[--text-muted]"
            >
                <IoClose size={14} />
            </button>
        </motion.div>
    );
};
