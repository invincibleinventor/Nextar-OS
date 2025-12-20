'use client';
import React, { useState } from 'react';
import { IoMailOutline, IoChevronBack, IoArchiveOutline, IoTrashOutline, IoPencilOutline, IoMailOpenOutline } from "react-icons/io5";
import { useDevice } from '../DeviceContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Mail(props: any) {
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const { ismobile } = useDevice();
    const [mobileview, setmobileview] = useState<'mailboxes' | 'list'>('list');

    const mailboxItems = [
        { id: 'inbox', label: 'Inbox', icon: IoMailOutline, count: 0 },
        { id: 'drafts', label: 'Drafts', icon: IoPencilOutline, count: 0 },
        { id: 'sent', label: 'Sent', icon: IoMailOutline, count: 0 },
        { id: 'archive', label: 'Archive', icon: IoArchiveOutline, count: 0 },
        { id: 'trash', label: 'Trash', icon: IoTrashOutline, count: 0 },
    ];

    const EmptyState = () => (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <IoMailOpenOutline size={64} className="mb-4 opacity-50" />
            <span className="text-lg font-medium">No Mail</span>
            <span className="text-sm mt-1">Your inbox is empty</span>
        </div>
    );

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-white dark:bg-[#1c1c1e] font-sf overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {mobileview === 'mailboxes' && (
                        <motion.div
                            key="mailboxes"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-14 flex items-center px-4 border-b border-black/5 dark:border-white/10">
                                <span className="text-[26px] font-bold">Mailboxes</span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {mailboxItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedFolder(item.id); setmobileview('list'); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 active:bg-black/5 dark:active:bg-white/5"
                                    >
                                        <item.icon size={20} className="text-accent" />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <span className="text-sm text-gray-400">{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {mobileview === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-14 flex items-center px-4 border-b border-black/5 dark:border-white/10">
                                <button
                                    onClick={() => setmobileview('mailboxes')}
                                    className="text-accent flex items-center gap-1 mr-4"
                                >
                                    <IoChevronBack size={20} />
                                    <span>Mailboxes</span>
                                </button>
                                <span className="font-semibold capitalize">{selectedFolder}</span>
                            </div>
                            <EmptyState />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[#f5f5f7] dark:bg-[#1e1e1e] font-sf text-black dark:text-white overflow-hidden">
            <div className="w-[200px] flex flex-col pt-10 border-r border-black/5 dark:border-white/10 bg-[#e5e5ea]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl shrink-0">
                <div className="px-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mailboxes</div>
                <div className="px-2 space-y-0.5">
                    {mailboxItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedFolder(item.id)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${selectedFolder === item.id ? 'bg-accent text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <item.icon size={16} />
                            <span className="flex-1 text-[13px] font-medium">{item.label}</span>
                            {item.count > 0 && (
                                <span className={`text-[11px] ${selectedFolder === item.id ? 'text-white/70' : 'text-gray-400'}`}>{item.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-12 flex items-center px-4 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 pl-20">
                    <span className="font-semibold capitalize">{selectedFolder}</span>
                </div>
                <EmptyState />
            </div>
        </div>
    );
}
