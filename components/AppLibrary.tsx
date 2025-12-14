'use client';
import React from 'react';
import { apps } from './app';
import { usewindows } from './WindowContext';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = usewindows();
    const categories = ['Social', 'Utilities', 'Creativity', 'Entertainment'];

    const handleapplaunch = (app: any) => {
        const existingwin = windows.find((win: any) => win.appName === app.appName);
        if (existingwin) {
            updatewindow(existingwin.id, { isMinimized: false });
            setactivewindow(existingwin.id);
            return;
        }

        const newwin = {
            id: `${app.appName}-${Date.now()}`,
            appName: app.appName,
            additionalData: {},
            title: app.appName,
            component: app.componentName,
            props: {},
            isMinimized: false,
            isMaximized: true,
            position: { top: 0, left: 0 },
            size: { width: window.innerWidth, height: window.innerHeight },
        };
        addwindow(newwin);
        setactivewindow(newwin.id);
    };

    const startpos = React.useRef({ x: 0, y: 0 });
    const isdragging = React.useRef(false);

    const handlepointerdown = (e: React.PointerEvent) => {
        startpos.current = { x: e.clientX, y: e.clientY };
        isdragging.current = false;
    };

    const handlepointerup = (e: React.PointerEvent, app: any) => {
        const dx = Math.abs(e.clientX - startpos.current.x);
        const dy = Math.abs(e.clientY - startpos.current.y);


        if (dx < 10 && dy < 10) {
            handleapplaunch(app);
        }
    };

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-14 px-5 pb-24 scrollbar-hide select-none"
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        >
            <div className="w-full h-10 bg-neutral-200/30 dark:bg-neutral-800/30 backdrop-blur-md rounded-[10px] flex items-center px-3 mb-8 mx-auto shadow-sm">
                <svg className="w-4 h-4 text-neutral-700 dark:text-neutral-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-neutral-700 dark:text-neutral-300 text-[17px]">App Library</span>
            </div>

            <div className="grid grid-cols-2 2xs:grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-4">
                {categories.map((cat, i) => (
                    <div key={i} className="flex flex-col">
                        <div className="w-full aspect-square bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md rounded-[22px] p-4 flex flex-col justify-between shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                                {apps.slice(i * 4, i * 4 + 4).map((app, idx) => (
                                    <div
                                        key={idx}
                                        className="cursor-pointer flex items-center justify-center"
                                        onPointerDown={handlepointerdown}
                                        onPointerUp={(e) => handlepointerup(e, app)}
                                    >
                                        <img
                                            src={app.icon}
                                            className="w-full h-full object-cover rounded-[10px] pointer-events-none"
                                            alt={app.appName}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <span className="text-[13px] font-medium text-neutral-300 dark:text-neutral-300 mt-2 px-1 text-center">{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppLibrary;
