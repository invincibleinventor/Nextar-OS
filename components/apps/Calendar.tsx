'use client';
import React, { useState } from 'react';
import { IoChevronBack, IoChevronForward, IoAddCircleOutline } from "react-icons/io5";
import { useDevice } from '../DeviceContext';

const monthnames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
    const { ismobile } = useDevice();
    const today = new Date();
    const [currentmonth, setcurrentmonth] = useState(today.getMonth());
    const [currentyear, setcurrentyear] = useState(today.getFullYear());

    const getdaysinmonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getfirstdayofmonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const prevmonth = () => {
        if (currentmonth === 0) {
            setcurrentmonth(11);
            setcurrentyear(currentyear - 1);
        } else {
            setcurrentmonth(currentmonth - 1);
        }
    };

    const nextmonth = () => {
        if (currentmonth === 11) {
            setcurrentmonth(0);
            setcurrentyear(currentyear + 1);
        } else {
            setcurrentmonth(currentmonth + 1);
        }
    };

    const daysinmonth = getdaysinmonth(currentmonth, currentyear);
    const firstday = getfirstdayofmonth(currentmonth, currentyear);
    const days = [];

    for (let i = 0; i < firstday; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysinmonth; i++) {
        days.push(i);
    }

    const istoday = (day: number | null) => {
        if (!day) return false;
        return day === today.getDate() && currentmonth === today.getMonth() && currentyear === today.getFullYear();
    };

    if (ismobile) {
        return (
            <div className="h-full w-full bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col font-sf text-black dark:text-white">
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-[34px] font-bold">{monthnames[currentmonth]}</h1>
                        <span className="text-[17px] text-gray-500">{currentyear}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={prevmonth} className="p-2 rounded-full bg-white dark:bg-[#2c2c2e]">
                            <IoChevronBack size={20} className="text-[#007AFF]" />
                        </button>
                        <button
                            onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                            className="px-4 py-2 rounded-xl bg-[#007AFF] text-white text-[15px] font-semibold"
                        >
                            Today
                        </button>
                        <button onClick={nextmonth} className="p-2 rounded-full bg-white dark:bg-[#2c2c2e]">
                            <IoChevronForward size={20} className="text-[#007AFF]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekdays.map(day => (
                                <div key={day} className="text-center text-[12px] font-semibold text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={`aspect-square flex items-center justify-center rounded-full text-[15px] font-medium ${day === null ? '' :
                                            istoday(day) ? 'bg-[#007AFF] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-white dark:bg-[#1e1e1e] flex font-sf text-black dark:text-white">
            <div className="w-[240px] border-r border-black/5 dark:border-white/5 bg-neutral-100/80 dark:bg-[#2d2d2d]/80 backdrop-blur-2xl flex flex-col pt-[54px]">
                <div className="px-4 mb-6">
                    <div className="w-full aspect-square bg-white dark:bg-[#363636] rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex flex-col items-center justify-center mb-4">
                        <div className="text-[14px] font-semibold text-[#FF3B30] uppercase mb-1">{today.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-[48px] font-light leading-none tracking-tighter">{today.getDate()}</div>
                    </div>
                </div>

                <div className="space-y-1 px-2 flex-1">
                    <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-[13px] font-medium flex justify-between items-center cursor-pointer">
                        <span>All Calendars</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex items-center gap-2 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
                        <span>Personal</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[13px] text-black/70 dark:text-white/70 flex items-center gap-2 cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
                        <span>Work</span>
                    </div>
                </div>

                <div className="p-4 border-t border-black/5 dark:border-white/5">
                    <button className="flex items-center gap-2 text-[#007AFF] text-[13px] font-medium">
                        <IoAddCircleOutline size={18} />
                        Add Calendar
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="h-[52px] shrink-0 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={prevmonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                            <IoChevronBack size={18} />
                        </button>
                        <button onClick={nextmonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                            <IoChevronForward size={18} />
                        </button>
                        <span className="font-bold text-[18px]">{monthnames[currentmonth]} {currentyear}</span>
                    </div>
                    <button
                        onClick={() => { setcurrentmonth(today.getMonth()); setcurrentyear(today.getFullYear()); }}
                        className="px-3 py-1 text-[13px] font-medium bg-black/5 dark:bg-white/10 rounded-lg hover:bg-black/10 dark:hover:bg-white/15"
                    >
                        Today
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-7 border-l border-t border-black/10 dark:border-white/10">
                        {weekdays.map(day => (
                            <div key={day} className="text-center py-2 text-[12px] font-semibold text-gray-500 border-r border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#252525]">
                                {day}
                            </div>
                        ))}
                        {days.map((day, i) => (
                            <div
                                key={i}
                                className={`min-h-[80px] p-2 border-r border-b border-black/10 dark:border-white/10 ${day === null ? 'bg-gray-50 dark:bg-[#252525]' : 'hover:bg-gray-50 dark:hover:bg-[#252525] cursor-pointer'
                                    }`}
                            >
                                {day && (
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-medium ${istoday(day) ? 'bg-[#007AFF] text-white' : ''
                                        }`}>
                                        {day}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
