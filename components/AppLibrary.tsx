'use client';
import React from 'react';
import Image from 'next/image';
import { apps, openSystemItem, appdata } from './data';
import { useWindows } from './WindowContext';
import { useDevice } from './DeviceContext';

import { IoSearch } from 'react-icons/io5';

const AppLibrary = () => {
    const { addwindow, windows, setactivewindow, updatewindow } = useWindows();
    const { ismobile } = useDevice();

    const allcategories = Array.from(new Set(apps.filter(a => a.category).map(a => a.category!)));

    const getcategoryapps = (category: string) => {
        return apps.filter(app => app.category === category);
    };

    const openapp = (app: appdata) => {
        openSystemItem(app.id, { addwindow, windows, setactivewindow, updatewindow, ismobile });
    };

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden pt-14 px-5 pb-32 scrollbar-hide select-none [&::-webkit-scrollbar]:hidden"
            style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="relative w-full text-center mb-6">
                <div className="relative w-full mx-auto bg-neutral-200/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-xl h-10 flex items-center px-3">
                    <IoSearch className="text-neutral-800 dark:text-neutral-300" size={20} />
                    <span className="ml-2 text-neutral-800 dark:text-neutral-300 text-lg">App Library</span>
                </div>
            </div>

            <div className="grid grid-cols-2 3xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 w-full mx-auto pb-10">
                {allcategories.map((category) => {
                    const categoryapps = getcategoryapps(category);
                    if (categoryapps.length === 0) return null;

                    return (
                        <div key={category} className="flex flex-col gap-2 relative">
                            <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-xl rounded-3xl p-4 w-auto aspect-square shrink-0 h-auto" style={{ aspectRatio: '1/1' }}>
                                <div className="grid grid-cols-2 grid-rows-2 gap-3 w-auto h-auto">
                                    {categoryapps.slice(0, 4).map((app) => (
                                        <div
                                            key={app.id}
                                            onClick={() => openapp(app)}
                                            className="relative w-full h-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                                        >
                                            <Image
                                                src={app.icon}
                                                alt={app.appname}
                                                className="object-cover rounded-xl"
                                                width={100}
                                                height={100}
                                                draggable={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <span className="text-center mt-1 text-neutral-200 text-[13px] font-semibold leading-none px-1 truncate">
                                {category}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AppLibrary;
