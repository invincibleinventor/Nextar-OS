'use client';
import React, { useState } from 'react';
import { FaPlay, FaTrash, FaTerminal } from 'react-icons/fa';
import { useDevice } from '../DeviceContext';

export default function Python() {
    const [code, setcode] = useState('print("Made with love by BalaTBR!")\n\n# Write your Python code here');
    const [output, setoutput] = useState('');
    const [isrunning, setisrunning] = useState(false);
const ismobile = useDevice()
    const runcode = async () => {
        setisrunning(true);
        setoutput('Running...');
        try {
            const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: 'python',
                    version: '3.10.0',
                    files: [{ content: code }]
                })
            });
            const data = await response.json();
            if (data.run) {
                setoutput(data.run.output || (data.run.stderr ? `Error: ${data.run.stderr}` : 'No Output'));
            } else {
                setoutput('Error: Failed to execute');
            }
        } catch (error) {
            setoutput('Error: Network request failed');
        } finally {
            setisrunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white font-mono">

            <div className={`${ismobile ? 'pl-[84px]': ''} h-12 bg-[#333333] flex items-center px-4 justify-between border-b border-black/20`}>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FaTerminal className="text-green-500" />
                    <span>main.py</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setcode('')}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition"
                        title="Clear Code"
                    >
                        <FaTrash size={12} />
                    </button>
                    <button
                        onClick={runcode}
                        disabled={isrunning}
                        className={`flex items-center gap-2 px-3 py-1 rounded bg-green-600 hover:bg-green-500 transition text-xs font-bold ${isrunning ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <FaPlay size={10} />
                        {isrunning ? 'RUNNING...' : 'RUN'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className="flex-1 relative border-r border-black/20">
                    <textarea
                        value={code}
                        onChange={(e) => setcode(e.target.value)}
                        className="w-full h-full bg-[#1e1e1e] text-gray-200 p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        spellCheck={false}
                    />
                </div>


                <div className="h-1/3 md:h-full md:w-1/3 bg-[#181818] flex flex-col border-t md:border-t-0 md:border-l border-black/20">
                    <div className="px-3 py-1 bg-[#252526] text-xs text-gray-500 uppercase font-semibold tracking-wider">
                        Terminal Output
                    </div>
                    <pre className="flex-1 p-3 text-sm font-mono text-gray-300 overflow-auto whitespace-pre-wrap">
                        {output}
                    </pre>
                </div>
            </div>
        </div>
    );
}
