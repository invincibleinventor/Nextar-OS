import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { getMails, MailItem, personal, apps } from './data';
import { IoMailOutline, IoLogoGithub, IoPaperPlaneOutline, IoChevronBack, IoSearch, IoArchiveOutline, IoTrashOutline, IoPencilOutline, IoFlagOutline, IoSchoolOutline, IoPersonCircleOutline, IoConstructOutline, IoFolderOpenOutline } from "react-icons/io5";
import { useDevice } from './DeviceContext';
import { useWindows } from './WindowContext';

const IoAccordionOutline = () => <IoPencilOutline />;

export default function Mail() {
    const { addwindow } = useWindows();
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const { ismobile } = useDevice();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const openInFinder = (path: string) => {
        const finderapp = apps.find(a => a.id === 'finder');
        if (finderapp) {
            addwindow({
                id: `finder-project-${Date.now()}`,
                appname: 'Finder',
                title: 'Finder',
                component: finderapp.componentname,
                icon: finderapp.icon,
                isminimized: false,
                ismaximized: false,
                position: { top: 150, left: 150 },
                size: { width: 900, height: 600 },
                props: { initialpath: ['Projects', path] }
            });
        }
    };

    const ALL_MAILS: MailItem[] = useMemo(() => getMails(openInFinder), []);

    const filteredMails = selectedFolder === 'inbox'
        ? ALL_MAILS
        : ALL_MAILS.filter(m => m.folder === selectedFolder);

    const activeMail = ALL_MAILS.find(m => m.id === selectedMailId);

    const groupedMails = selectedFolder === 'inbox'
        ? filteredMails.reduce((acc, mail) => {
            const cat = mail.category || 'Other';
            if (!acc[cat]) acc[acc[cat] ? 'cat' : cat] = []; // fallback? no wait
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(mail);
            return acc;
        }, {} as Record<string, MailItem[]>)
        : { 'All': filteredMails };

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1e1e1e] font-sf text-black dark:text-white relative overflow-hidden">
            <div className={`flex h-full transition-all duration-300 ease-in-out ${ismobile
                    ? (sidebarOpen && !selectedMailId ? 'w-full' : 'w-0 overflow-hidden')
                    : (sidebarOpen ? 'w-full md:w-[300px] lg:w-[250px]' : 'w-0 overflow-hidden')
                }`}>

                <div className={`
                    ${ismobile ? 'w-full' : 'w-full'} 
                    bg-[#f5f5f7] dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-white/10 flex flex-col pt-10 h-full
                    ${ismobile && !sidebarOpen ? 'hidden' : 'block'}
                `}>
                    <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Favorites</div>
                    <div className="px-2 space-y-0.5">
                        {[
                            { id: 'inbox', label: 'Inbox', icon: IoMailOutline, count: ALL_MAILS.length },
                            { id: 'projects', label: 'Projects', icon: IoFlagOutline, count: personal.projects.length },
                            { id: 'about', label: 'About', icon: IoSearch, count: 1 },
                            { id: 'education', label: 'Education', icon: IoSchoolOutline, count: 1 },
                            { id: 'skills', label: 'Skills', icon: IoConstructOutline, count: 1 },
                            { id: 'contact', label: 'Contact', icon: IoPersonCircleOutline, count: 1 },
                        ].map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setSelectedFolder(item.id);
                                    setSelectedMailId(null);
                                    if (ismobile) setSidebarOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-[13px] ${selectedFolder === item.id ? 'bg-[#007AFF] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </div>
                                <span className={`text-xs ${selectedFolder === item.id ? 'text-white/80' : 'text-gray-500'}`}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`
                ${ismobile ? 'w-full absolute inset-0 z-10 bg-white dark:bg-[#1e1e1e]' : 'w-[350px] border-r border-gray-200 dark:border-white/10'}
                flex flex-col h-full
                ${ismobile && (sidebarOpen || selectedMailId) ? 'hidden' : 'flex'}
                ${!ismobile && !sidebarOpen ? 'w-[350px]' : ''}
            `}>
                <div className="h-10 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between shrink-0 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur">
                    <div className="flex flex-row justify-between content-center w-full pr-2 items-center">
                        {ismobile && (
                            <button onClick={() => setSidebarOpen(true)} className="text-[#007AFF] -ml-2 mr-auto p-2 flex items-center gap-1">
                                <IoChevronBack size={20} /> <span className="text-[15px]">Mailboxes</span>
                            </button>
                        )}
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

            <div className={`
                flex-1 bg-white dark:bg-[#1e1e1e] flex flex-col h-full
                ${ismobile ? (selectedMailId ? 'absolute inset-0 z-20 w-full block' : 'hidden') : 'block'}
            `}>
                {activeMail ? (
                    <>
                        <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between shrink-0 bg-white/50 backdrop-blur">
                            <div className="flex gap-4 items-center">
                                {ismobile && (
                                    <button onClick={() => setSelectedMailId(null)} className="text-[#007AFF] flex items-center gap-1 text-[13px]">
                                        <IoChevronBack size={18} /> {selectedFolder === 'inbox' ? 'Inbox' : selectedFolder}
                                    </button>
                                )}
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
                                    <h1 className="text-xl font-bold text-black dark:text-white mb-1">{activeMail.subject}</h1>
                                    <div className="flex items-center gap-2">
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
