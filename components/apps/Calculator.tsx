'use client';
import React, { useState, useMemo } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';

export default function Calculator({ appId = 'calculator', id }: { appId?: string, id?: string }) {
    const [display, setdisplay] = useState('0');
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;

    const calculatorMenus = useMemo(() => ({
        View: [
            { title: "Basic", actionId: "view-basic", shortcut: "⌘1" },
            { title: "Scientific", actionId: "view-scientific", shortcut: "⌘2" },
            { title: "Programmer", actionId: "view-programmer", shortcut: "⌘3" }
        ]
    }), []);

    const menuActions = useMemo(() => ({
        'view-basic': () => { },
        'view-scientific': () => { },
        'view-programmer': () => { },
    }), []);

    useMenuRegistration(calculatorMenus, isActiveWindow);
    useMenuAction(appId, menuActions, id);
    const [prevvalue, setprevvalue] = useState<string | null>(null);
    const [operation, setoperation] = useState<string | null>(null);
    const [waitingfornewvalue, setwaitingfornewvalue] = useState(false);

    const handlenum = (num: string) => {
        if (waitingfornewvalue) {
            setdisplay(num);
            setwaitingfornewvalue(false);
        } else {
            setdisplay(display === '0' ? num : display + num);
        }
    };

    const handleop = (op: string) => {
        setoperation(op);
        setprevvalue(display);
        setwaitingfornewvalue(true);
    };

    const calculate = () => {
        if (!prevvalue || !operation) return;
        const current = parseFloat(display);
        const prev = parseFloat(prevvalue);
        let result = 0;

        switch (operation) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '×': result = prev * current; break;
            case '÷': result = prev / current; break;
        }

        setdisplay(result.toString());
        setoperation(null);
        setwaitingfornewvalue(true);
    };

    const clear = () => {
        setdisplay('0');
        setprevvalue(null);
        setoperation(null);
        setwaitingfornewvalue(false);
    };

    const btnstyle = "h-14 w-14 rounded-full flex items-center justify-center text-2xl font-medium transition active:opacity-70";
    const numbtn = `${btnstyle} bg-[#333333] text-white`;
    const opbtn = `${btnstyle} bg-[#ff9f0a] text-white`;
    const fnbtn = `${btnstyle} bg-[#a5a5a5] text-black`;

    return (
        <div className="w-full h-full bg-black flex flex-col p-4 select-none">
            <div className="flex-1 flex items-end justify-end px-2 mb-2">
                <div className="text-white text-6xl font-light tracking-tight truncate">{display}</div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                <button onClick={clear} className={fnbtn}>{display === '0' ? 'AC' : 'C'}</button>
                <button onClick={() => { setdisplay((parseFloat(display) * -1).toString()) }} className={fnbtn}>+/-</button>
                <button onClick={() => { setdisplay((parseFloat(display) / 100).toString()) }} className={fnbtn}>%</button>
                <button onClick={() => handleop('÷')} className={opbtn}>÷</button>

                <button onClick={() => handlenum('7')} className={numbtn}>7</button>
                <button onClick={() => handlenum('8')} className={numbtn}>8</button>
                <button onClick={() => handlenum('9')} className={numbtn}>9</button>
                <button onClick={() => handleop('×')} className={opbtn}>×</button>

                <button onClick={() => handlenum('4')} className={numbtn}>4</button>
                <button onClick={() => handlenum('5')} className={numbtn}>5</button>
                <button onClick={() => handlenum('6')} className={numbtn}>6</button>
                <button onClick={() => handleop('-')} className={opbtn}>-</button>

                <button onClick={() => handlenum('1')} className={numbtn}>1</button>
                <button onClick={() => handlenum('2')} className={numbtn}>2</button>
                <button onClick={() => handlenum('3')} className={numbtn}>3</button>
                <button onClick={() => handleop('+')} className={opbtn}>+</button>

                <button onClick={() => handlenum('0')} className={`${numbtn} col-span-2 w-auto rounded-full pl-6 justify-start`}>0</button>
                <button onClick={() => !display.includes('.') && setdisplay(display + '.')} className={numbtn}>.</button>
                <button onClick={calculate} className={opbtn}>=</button>
            </div>
        </div>
    );
}
