import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { getMails, MailItem, personal, apps, openSystemItem } from './data';
import { IoMailOutline, IoLogoGithub, IoPaperPlaneOutline, IoChevronBack, IoSearch, IoArchiveOutline, IoTrashOutline, IoPencilOutline, IoFlagOutline, IoSchoolOutline, IoPersonCircleOutline, IoConstructOutline, IoFolderOpenOutline } from "react-icons/io5";
import { useDevice } from './DeviceContext';
import { useWindows } from './WindowContext';
import { motion, AnimatePresence } from 'framer-motion';

const IoAccordionOutline = () => <IoPencilOutline />;

export default function Mail(props: any) {
    const { addwindow, windows, updatewindow, setactivewindow } = useWindows();
    const [selectedFolder, setSelectedFolder] = useState(props.initialFolder || 'inbox');
    const [selectedMailId, setSelectedMailId] = useState<string | null>(props.initialMailId || null);
    const { ismobile } = useDevice();
    const [sidebarOpen, setSidebarOpen] = useState(!ismobile);
    const [mobileview, setmobileview] = useState<'mailboxes' | 'list' | 'detail'>('list');

    const openInFinder = React.useCallback((path: string) => {
        openSystemItem(`project-${path}`, { addwindow, windows, updatewindow, setactivewindow, ismobile });
    }, [addwindow, windows, updatewindow, setactivewindow, ismobile]);

    const ALL_MAILS: MailItem[] = useMemo(() => getMails(openInFinder), [openInFinder]);

    const filteredMails = selectedFolder === 'inbox'
        ? ALL_MAILS
        : ALL_MAILS.filter(m => m.folder === selectedFolder);

    const activeMail = ALL_MAILS.find(m => m.id === selectedMailId);

    const groupedMails = selectedFolder === 'inbox'
        ? filteredMails.reduce((acc, mail) => {
            const cat = mail.category || 'Other';
            if (!acc[cat]) acc[acc[cat] ? 'cat' : cat] = [];
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(mail);
            return acc;
        }, {} as Record<string, MailItem[]>)
        : { 'All': filteredMails };

    const mailboxItems = [
        { id: 'inbox', label: 'Inbox', icon: IoMailOutline, count: ALL_MAILS.length },
        { id: 'about', label: 'About Bala', icon: IoSearch, count: 1 },
        { id: 'projects', label: 'Projects', icon: IoFlagOutline, count: personal.projects.length },
        { id: 'education', label: 'Education', icon: IoSchoolOutline, count: 1 },
        { id: 'skills', label: 'Skills', icon: IoConstructOutline, count: 1 },
        { id: 'contact', label: 'Contact', icon: IoPersonCircleOutline, count: 1 },
    ];

    const handleSelectFolder = (id: string) => {
        setSelectedFolder(id);
        setSelectedMailId(null);
        if (ismobile) setmobileview('list');
    };

    const handleSelectMail = (id: string) => {
        setSelectedMailId(id);
        if (ismobile) setmobileview('detail');
    };

    if (ismobile) {
        return (
            <div className="flex flex-col h-full w-full bg-white dark:bg-[#1c1c1e] font-sf text-black dark:text-white overflow-hidden">
                <AnimatePresence mode="wait">
                    {mobileview === 'mailboxes' && (
                        <motion.div
                            key="mailboxes"
                            initial={{ x: '-105%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-105%' }}
                            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                            className="absolute inset-0 z-30 bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="h-14 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10">
                                <span className="font-bold text-[28px]">Mailboxes</span>
                                <button
                                    onClick={() => setmobileview('list')}
                                    className="text-[#007AFF] font-medium text-[17px]"
                                >
                                    Done
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pt-4">
                                <div className="px-4 mb-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Favorites</div>
                                <div className="space-y-0.5 px-2">
                                    {mailboxItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectFolder(item.id)}
                                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer
                                                ${selectedFolder === item.id
                                                    ? 'bg-[#007AFF] text-white'
                                                    : 'active:bg-black/5 dark:active:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon size={22} className={selectedFolder === item.id ? 'text-white' : 'text-[#007AFF]'} />
                                                <span className="text-[17px] font-medium">{item.label}</span>
                                            </div>
                                            <span className={`text-[15px] ${selectedFolder === item.id ? 'text-white/80' : 'text-gray-400'}`}>{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mobileview === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className="h-14 border-b border-black/5 dark:border-white/10 flex items-center px-4 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl">
                                <button
                                    onClick={() => setmobileview('mailboxes')}
                                    className="text-[#007AFF] flex items-center gap-0.5"
                                >
                                    <IoChevronBack size={22} />
                                    <span className="text-[17px]">Mailboxes</span>
                                </button>
                                <span className="font-semibold text-[17px] absolute left-1/2 -translate-x-1/2 capitalize">
                                    {selectedFolder}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {Object.entries(groupedMails).map(([category, mails]) => (
                                    <div key={category}>
                                        {selectedFolder === 'inbox' && (
                                            <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 text-[13px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 z-10">
                                                {category}
                                            </div>
                                        )}
                                        {mails.map(mail => (
                                            <div
                                                key={mail.id}
                                                onClick={() => handleSelectMail(mail.id)}
                                                className={`px-4 py-4 border-b border-gray-100 dark:border-white/5 cursor-pointer flex gap-3.5 active:bg-gray-50 dark:active:bg-white/5
                                                    ${selectedMailId === mail.id ? 'bg-[#007AFF]/5' : ''}`}
                                            >
                                                <div className="shrink-0 pt-0.5">
                                                    {mail.iconType === 'image' && mail.iconSrc ? (
                                                        <Image src={mail.iconSrc} width={44} height={44} alt="icon" className="w-11 h-11 shrink-0 rounded-full object-cover shadow-sm bg-white dark:bg-zinc-800" />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300">
                                                            {mail.icon && React.createElement(mail.icon)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="font-semibold text-[17px] truncate text-black dark:text-white">{mail.sender}</span>
                                                        <span className="text-[13px] shrink-0 ml-2 text-gray-400">{mail.date}</span>
                                                    </div>
                                                    <div className="text-[15px] font-medium mb-1 truncate text-black dark:text-white">{mail.subject}</div>
                                                    <div className="text-[15px] text-gray-500 dark:text-gray-400 line-clamp-2">{mail.preview}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {mobileview === 'detail' && activeMail && (
                        <motion.div
                            key="detail"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                            className="absolute inset-0 z-20 bg-white dark:bg-[#1c1c1e] flex flex-col"
                        >
                            <div className="h-14 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between shrink-0 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl">
                                <button
                                    onClick={() => setmobileview('list')}
                                    className="text-[#007AFF] flex items-center gap-0.5"
                                >
                                    <IoChevronBack size={22} />
                                    <span className="text-[17px] capitalize">{selectedFolder}</span>
                                </button>
                                <div className="flex gap-5 text-[#007AFF]">
                                    <IoArchiveOutline size={22} />
                                    <IoTrashOutline size={22} />
                                    <IoPaperPlaneOutline size={22} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                    <h1 className="text-[22px] font-bold text-black dark:text-white mb-4">{activeMail.subject}</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                            {activeMail.sender[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[17px] font-semibold text-black dark:text-white truncate">{activeMail.sender}</div>
                                            <div className="text-[13px] text-gray-400 truncate">{activeMail.senderEmail}</div>
                                        </div>
                                        <div className="text-[13px] text-gray-400 shrink-0">{activeMail.date}</div>
                                    </div>
                                </div>

                                <div className="p-4 prose dark:prose-invert max-w-none text-[16px] leading-relaxed">
                                    {activeMail.content}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white relative overflow-hidden">
            <div className={`flex h-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-full md:w-[300px] lg:w-[250px]' : 'w-0 overflow-hidden'}`}>
                <div className={`w-full bg-[#f5f5f7]/80 dark:bg-[#2d2d2d]/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col pt-10 h-full`}>
                    <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Favorites</div>
                    <div className="px-2 space-y-0.5">
                        {mailboxItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleSelectFolder(item.id)}
                                className={`flex items-center justify-between px-3 py-2 lg:py-1.5 rounded-lg cursor-pointer text-[13px] ${selectedFolder === item.id ? 'bg-[#007AFF] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </div>
                                <span className={`text-sm lg:text-xs ${selectedFolder === item.id ? 'text-white/80' : 'text-gray-500'}`}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`w-[350px] border-r border-gray-200 dark:border-white/10 flex flex-col h-full ${!sidebarOpen ? 'w-[350px]' : ''}`}>
                <div className="h-10 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between shrink-0 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur">
                    <div className="flex flex-row justify-between content-center w-full pr-2 items-center">
                        <span className="font-semibold block -mr-2 text-sm capitalize">{selectedFolder}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {Object.entries(groupedMails).map(([category, mails]) => (
                        <div key={category}>
                            {selectedFolder === 'inbox' && (
                                <div className="px-4 py-1.5 bg-gray-50 dark:bg-white/5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm border-y border-gray-100 dark:border-white/5 z-10">
                                    {category}
                                </div>
                            )}
                            {mails.map(mail => (
                                <div
                                    key={mail.id}
                                    onClick={() => setSelectedMailId(mail.id)}
                                    className={`p-4 border-b border-gray-100 dark:border-white/5 cursor-pointer flex gap-3 ${selectedMailId === mail.id ? 'bg-[#007AFF] text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <div className="shrink-0 pt-1">
                                        {mail.iconType === 'image' && mail.iconSrc ? (
                                            <Image src={mail.iconSrc} width={32} height={32} alt="icon" className="w-8 h-8 shrink-0 rounded-full object-cover shadow-sm bg-white dark:bg-zinc-800" />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${selectedMailId === mail.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                                                {mail.icon && React.createElement(mail.icon)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={`font-semibold text-[13px] truncate ${selectedMailId === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.sender}</span>
                                            <span className={`text-[11px] shrink-0 ml-2 ${selectedMailId === mail.id ? 'text-white/80' : 'text-gray-400'}`}>{mail.date}</span>
                                        </div>
                                        <div className={`text-[13px] font-medium mb-0.5 truncate ${selectedMailId === mail.id ? 'text-white' : 'text-black dark:text-white'}`}>{mail.subject}</div>
                                        <div className={`text-[12px] line-clamp-2 ${selectedMailId === mail.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{mail.preview}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-[#1e1e1e] flex flex-col h-full">
                {activeMail ? (
                    <>
                        <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between shrink-0 dark:bg-black/10 bg-white/50 backdrop-blur">
                            <div className="flex gap-4 items-center">
                                <div className="flex gap-4 text-gray-500">
                                    <IoArchiveOutline size={18} />
                                    <IoTrashOutline size={18} />
                                </div>
                            </div>
                            <div className="text-gray-400"><IoPaperPlaneOutline size={18} /></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-xl font-bold text-black dark:text-white mb-4">{activeMail.subject}</h1>
                                    <div className="flex items-center  gap-2">
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {activeMail.sender[0]}
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-semibold text-black dark:text-white">{activeMail.sender} <span className="text-gray-400 font-normal">&lt;{activeMail.senderEmail}&gt;</span></div>
                                            <div className="text-[11px] text-gray-400">{activeMail.date}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prose shrink-0 dark:prose-invert max-w-none text-[14px]">
                                {activeMail.content}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600">
                        <IoMailOutline size={64} className="mb-4 opacity-50" />
                        <span className="text-sm">No Message Selected</span>
                    </div>
                )}
            </div>
        </div>
    );
}
