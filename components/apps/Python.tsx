'use client';
import React, { useState } from 'react';
import { FaPlay, FaStop, FaTerminal, FaFolder, FaPython } from 'react-icons/fa';
import { VscDebugStart, VscDebugStop, VscFiles, VscSearch, VscSourceControl, VscWarning } from "react-icons/vsc";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { useDevice } from '../DeviceContext';

export default function Python({ isFocused = true }: { isFocused?: boolean }) {
    const [code, setcode] = useState('print("Made with love by BalaTBR!")\n\n# Keep Building!\n\nfor i in range(5):\n    print(f"Count: {i}")');
    const [output, setoutput] = useState('');
    const [isrunning, setisrunning] = useState(false);
    const { ismobile } = useDevice();
    const [showsidebar, setshowsidebar] = useState(false);

    const runcode = async () => {
        setisrunning(true);
        setoutput('Building and Running...\n');
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
                setoutput(prev => prev + (data.run.output || (data.run.stderr ? `Error: ${data.run.stderr}` : 'Program exited with code 0')));
            } else {
                setoutput(prev => prev + 'Error: Failed to execute');
            }
        } catch (error) {
            setoutput(prev => prev + 'Error: Network request failed');
        } finally {
            setisrunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full  text-[#d4d4d4] font-sf overflow-hidden">
            <div className={`h-[50px] bg-[#2d2d2d] border-b border-black/50 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 ${ismobile ? 'ps-4' : 'ps-24'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#3a3a3a] rounded-[4px] p-0.5 border border-white/5">
                        <button
                            onClick={runcode}
                            disabled={isrunning}
                            className={`p-1 px-3 hover:bg-white/10 rounded-[3px] transition active:bg-black/20 ${isrunning ? 'opacity-50' : 'text-gray-300'}`}
                        >
                            <FaPlay size={10} className="" />
                        </button>
                        <div className="w-px h-3 bg-white/10" />
                        <button
                            onClick={() => setisrunning(false)}
                            className="p-1 px-3 hover:bg-white/10 rounded-[3px] transition active:bg-black/20 text-gray-400"
                        >
                            <FaStop size={10} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex justify-center mx-4">
                    <div className="flex items-center gap-2 bg-[#1e1e1e] px-8 py-1 rounded-[4px] border border-white/5 min-w-[200px] justify-center shadow-inner">
                        {isrunning ? (
                            <>
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-xs text-gray-300 font-medium">Running main.py</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
                                <span className="text-xs text-gray-500 font-medium tracking-wide">Ready</span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setshowsidebar(!showsidebar)}
                    className={`p-1.5 rounded hover:bg-white/10 ${showsidebar ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}
                >
                    <VscFiles size={16} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {showsidebar && (
                    <div className={`${ismobile ? 'absolute inset-y-0 left-0 z-10 w-[200px] shadow-2xl' : 'relative w-[220px]'} bg-[#252526] border-r border-black/20 flex flex-col shrink-0`}>
                        <div className="p-2 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project Navigation</div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#37373d] text-gray-200 text-xs">
                            <IoIosArrowDown size={12} />
                            <FaFolder size={12} className="text-blue-400" />
                            <span className="font-semibold">MyPythonProject</span>
                        </div>
                        <div className="pl-6 py-1 flex items-center gap-2 bg-[#094771] text-white text-xs cursor-pointer">
                            <FaPython size={12} className="text-yellow-400" />
                            <span>main.py</span>
                        </div>
                        <div className="pl-6 py-1 flex items-center gap-2 text-gray-400 hover:bg-[#2a2d2e] text-xs cursor-pointer">
                            <div className="w-3 h-3 border border-gray-600 rounded flex items-center justify-center text-[8px]">M</div>
                            <span>README.md</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="flex-1 relative">
                        <textarea
                            value={code}
                            onChange={(e) => setcode(e.target.value)}
                            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-6 resize-none focus:outline-none font-mono text-[13px] leading-6 tab-4"
                            spellCheck={false}
                        />
                    </div>

                    <div className="h-1/3 border-t border-black/30 bg-[#1e1e1e] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-1 bg-[#252526] border-b border-black/30">
                            <div className="flex items-center gap-4">
                                <button className="text-[11px] text-gray-300 font-medium border-b-2 border-blue-500 pb-1">Output</button>
                                <button className="text-[11px] text-gray-500 font-medium hover:text-gray-300 pb-1">Problems</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setoutput('')} className="text-xs text-gray-500 hover:text-white" title="Clear Console">
                                    <FaTerminal />
                                </button>
                            </div>
                        </div>
                        <pre className="flex-1 p-4 text-xs font-mono text-gray-300 overflow-auto whitespace-pre-wrap leading-5">
                            {output || <span className="text-gray-600 italic">Program output will appear here...</span>}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
