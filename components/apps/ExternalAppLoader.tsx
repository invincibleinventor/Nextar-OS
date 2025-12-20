'use client';
import React, { useState } from 'react';
import { IoRefreshOutline, IoAlertCircleOutline } from 'react-icons/io5';

interface ExternalAppLoaderProps {
    externalUrl: string;
    appname: string;
    icon: string;
}

export default function ExternalAppLoader({ externalUrl, appname, icon }: ExternalAppLoaderProps) {
    const [loading, setloading] = useState(true);
    const [error, seterror] = useState(false);

    const handleload = () => {
        setloading(false);
    };

    const handleerror = () => {
        setloading(false);
        seterror(true);
    };

    const reload = () => {
        setloading(true);
        seterror(false);
        const iframe = document.querySelector(`iframe[data-app="${appname}"]`) as HTMLIFrameElement;
        if (iframe) iframe.src = externalUrl;
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-white dark:bg-[#1e1e1e] font-sf">
                <IoAlertCircleOutline size={48} className="text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load App</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-xs">
                    Could not load {appname} from external source.
                </p>
                <button
                    onClick={reload}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <IoRefreshOutline size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#1e1e1e] z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center animate-pulse">
                            <img src={icon} alt={appname} className="w-8 h-8" />
                        </div>
                        <span className="text-sm text-gray-500">Loading {appname}...</span>
                    </div>
                </div>
            )}
            <iframe
                data-app={appname}
                src={externalUrl}
                className="w-full h-full border-none"
                onLoad={handleload}
                onError={handleerror}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    );
}
