'use client';
import React, { useState, useMemo } from 'react';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassCard, glassButton, clayClasses } from '../hooks/useClayStyles';
import { LuEye } from 'react-icons/lu';

export default function Calculator({ appId = 'calculator', id }: { appId?: string, id?: string }) {
    const [display, setdisplay] = useState('0');
    const { activewindow } = useWindows();
    const isActiveWindow = activewindow === id;
    const clay = useIsClay();

    const calculatorMenus = useMemo(() => ({
        View: [
            { title: "Basic", actionId: "view-basic", shortcut: "⌘1", icon: <LuEye size={14} /> },
            { title: "Scientific", actionId: "view-scientific", shortcut: "⌘2", icon: <LuEye size={14} /> },
            { title: "Programmer", actionId: "view-programmer", shortcut: "⌘3", icon: <LuEye size={14} /> }
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
            case '÷': result = current !== 0 ? prev / current : NaN; break;
        }

        if (isNaN(result) || !isFinite(result)) {
            setdisplay('Error');
        } else {
            setdisplay(result.toString());
        }
        setoperation(null);
        setwaitingfornewvalue(true);
    };

    const clear = () => {
        setdisplay('0');
        setprevvalue(null);
        setoperation(null);
        setwaitingfornewvalue(false);
    };

    if (clay) {
        const neoBtn = `h-14 w-14 flex items-center justify-center text-2xl font-medium transition-all ${clayClasses.interactivePress} rounded-[12px]`;
        const numNeo = `${neoBtn} text-[--text-color]`;
        const opNeo = `${neoBtn} text-white`;
        const eqNeo = `${neoBtn} text-white`;
        const fnNeo = `${neoBtn} text-[--text-color]`;

        const numBtnStyle: React.CSSProperties = {
            ...glassCard,
        };
        const fnBtnStyle: React.CSSProperties = {
            ...glassButton,
            background: 'var(--bg-glass-hover)',
        };
        const opBtnStyle: React.CSSProperties = {
            background: 'var(--pastel-peach)',
            boxShadow: 'var(--shadow-xs)',
            border: '1px solid var(--glass-border)',
        };
        const eqBtnStyle: React.CSSProperties = {
            background: 'var(--accent-color)',
            boxShadow: 'var(--shadow-xs)',
            border: '1px solid var(--glass-border)',
        };

        return (
            <div className="w-full h-full flex flex-col p-4 select-none bg-[--bg-base]">
                {/* Display -- font-mono is OK for calculator digits */}
                <div className="flex-1 flex items-end justify-end px-2 mb-2">
                    <div className="text-[--text-color] text-6xl font-light tracking-tight truncate font-mono">{display}</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <button onClick={clear} className={fnNeo} style={fnBtnStyle}>
                        {display === '0' ? 'AC' : 'C'}
                    </button>
                    <button onClick={() => { setdisplay((parseFloat(display) * -1).toString()) }} className={fnNeo} style={fnBtnStyle}>
                        +/-
                    </button>
                    <button onClick={() => { setdisplay((parseFloat(display) / 100).toString()) }} className={fnNeo} style={fnBtnStyle}>
                        %
                    </button>
                    <button onClick={() => handleop('÷')} className={opNeo} style={opBtnStyle}>
                        ÷
                    </button>

                    {['7','8','9'].map(n => (
                        <button key={n} onClick={() => handlenum(n)} className={numNeo} style={numBtnStyle}>
                            {n}
                        </button>
                    ))}
                    <button onClick={() => handleop('×')} className={opNeo} style={opBtnStyle}>
                        ×
                    </button>

                    {['4','5','6'].map(n => (
                        <button key={n} onClick={() => handlenum(n)} className={numNeo} style={numBtnStyle}>
                            {n}
                        </button>
                    ))}
                    <button onClick={() => handleop('-')} className={opNeo} style={opBtnStyle}>
                        -
                    </button>

                    {['1','2','3'].map(n => (
                        <button key={n} onClick={() => handlenum(n)} className={numNeo} style={numBtnStyle}>
                            {n}
                        </button>
                    ))}
                    <button onClick={() => handleop('+')} className={opNeo} style={opBtnStyle}>
                        +
                    </button>

                    <button onClick={() => handlenum('0')} className={`${numNeo} col-span-2 w-auto rounded-[12px] pl-6 justify-start`} style={numBtnStyle}>
                        0
                    </button>
                    <button onClick={() => !display.includes('.') && setdisplay(display + '.')} className={numNeo} style={numBtnStyle}>
                        .
                    </button>
                    <button onClick={calculate} className={eqNeo} style={eqBtnStyle}>
                        =
                    </button>
                </div>
            </div>
        );
    }

    const btnstyle = "h-14 w-14  flex items-center justify-center text-2xl font-medium transition active:opacity-70";
    const numbtn = `${btnstyle} bg-overlay text-[--text-color] hover:bg-[--border-color]`;
    const opbtn = `${btnstyle} bg-pastel-peach text-[--bg-base]`;
    const eqbtn = `${btnstyle} bg-pastel-red text-[--bg-base]`;
    const fnbtn = `${btnstyle} bg-[--border-color] text-[--text-color]`;

    return (
        <div className="w-full h-full bg-[--bg-base] flex flex-col p-4 select-none">
            <div className="flex-1 flex items-end justify-end px-2 mb-2">
                <div className="text-[--text-color] text-6xl font-light tracking-tight truncate font-mono">{display}</div>
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

                <button onClick={() => handlenum('0')} className={`${numbtn} col-span-2 w-auto  pl-6 justify-start`}>0</button>
                <button onClick={() => !display.includes('.') && setdisplay(display + '.')} className={numbtn}>.</button>
                <button onClick={calculate} className={eqbtn}>=</button>
            </div>
        </div>
    );
}
