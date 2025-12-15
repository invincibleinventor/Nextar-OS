import Image from 'next/image';


import { apps } from '../app';
import { usewindows } from '../WindowContext';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { IoSearch } from 'react-icons/io5';

const appsperpage = 35;

export default function Launchpad({ onclose }: { onclose: () => void }) {
    const { addwindow, removewindow, windows, setactivewindow } = usewindows();
    const [searchterm, setsearchterm] = useState('');
    const [page, setpage] = useState(0);

    const handleappclick = (app: any) => {
        if (app.id === 'launchpad') return;



        setTimeout(() => {
            const appwins = windows.filter((win: any) => win.appname === app.appname);
            if (appwins.length === 0 || app.multiwindow) {
                const newwin: any = {
                    id: `${app.appname}-${Date.now()}`,
                    appname: app.appname,
                    additionaldata: app.additionaldata || {},
                    title: app.appname,
                    component: app.componentname,
                    props: {},
                    isminimized: false,
                    ismaximized: false,
                    position: { top: 100, left: 150 },
                };

                if (app.defaultsize) {
                    newwin.size = app.defaultsize;
                } else if (app.additionaldata?.startlarge) {
                    newwin.size = { width: 900, height: 600 };
                }

                addwindow(newwin);
                setactivewindow(newwin.id);
            } else {
                setactivewindow(appwins[0].id);
            }
            onclose();
        }, 100);
    };

    const filteredapps = apps.filter(a =>
        a.id !== 'launchpad' &&
        a.appname.toLowerCase().includes(searchterm.toLowerCase())
    );

    const totalpages = Math.ceil(filteredapps.length / appsperpage) || 1;
    const currentapps = filteredapps.slice(page * appsperpage, (page + 1) * appsperpage);

    const paginate = (newdirection: number) => {
        if (page + newdirection >= 0 && page + newdirection < totalpages) {
            setpage(page + newdirection);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] flex flex-col items-center pt-20 pb-12
                bg-black/40 backdrop-blur-3xl overflow-hidden"
            onClick={() => {
                onclose();
            }}
            onPan={(e, info) => {
                if (info.offset.x < -50) paginate(1);
                if (info.offset.x > 50) paginate(-1);
            }}
        >
            <div
                className="w-full max-w-md px-8 mb-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
                    <input
                        autoFocus
                        placeholder="Search"
                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-2 
                            text-white placeholder-white/50 text-[15px] text-center
                            outline-none focus:bg-white/15 focus:border-white/20 transition-all"
                        value={searchterm}
                        onChange={e => { setsearchterm(e.target.value); setpage(0); }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            <div
                className="flex-1 w-full max-w-[1100px] px-8 sm:px-16 flex items-center justify-center"
                onClick={(e) => {
                }}
            >
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={page}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-6 gap-y-10 w-full"
                    >
                        {currentapps.map(app => (
                            <motion.div
                                key={app.id}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex flex-col items-center gap-3 cursor-pointer"
                                onClick={() => handleappclick(app)}
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 relative">
                                    <Image
                                        src={app.icon}
                                        alt={app.appname}
                                        fill
                                        sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px"
                                        className="object-contain drop-shadow-2xl"
                                        draggable={false}
                                    />
                                </div>
                                <span className="text-white text-[13px] font-medium text-center leading-tight drop-shadow-md truncate max-w-[90px]">
                                    {app.appname}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {totalpages > 1 && (
                <div className="flex gap-2 pt-8">
                    {Array.from({ length: totalpages }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === page ? 'bg-white' : 'bg-white/30'}`}
                            onClick={(e) => { e.stopPropagation(); setpage(i); }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
