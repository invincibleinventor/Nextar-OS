'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { FaPlay, FaStop, FaTerminal, FaFolder, FaPython } from 'react-icons/fa';
import { VscDebugStart, VscDebugStop, VscFiles, VscSearch, VscSourceControl, VscWarning } from "react-icons/vsc";
import { IoIosArrowForward, IoIosArrowDown, IoLogoPython as IoPython } from "react-icons/io";

import { useDevice } from '../DeviceContext';
import { useAuth } from '../AuthContext';
import { useMenuAction } from '../hooks/useMenuAction';

export default function Python({ isFocused = true, appId = 'python', id }: { isFocused?: boolean, appId?: string, id?: string }) {
    const [code, setcode] = useState('print("Made with love by BalaTBR!")\n\n# Keep Building!\n\nfor i in range(5):\n    print(f"Count: {i}")');
    const { ismobile } = useDevice();
    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const homeDir = username === 'guest' ? 'Guest' : (username.charAt(0).toUpperCase() + username.slice(1));
    const [currentPath, setCurrentPath] = useState<string[]>(['Macintosh HD', 'Users', homeDir, 'Projects']);
    const [output, setoutput] = useState('');
    const [isrunning, setisrunning] = useState(false);
    const [showsidebar, setshowsidebar] = useState(false);

    const runcode = useCallback(async () => {
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
    }, [code]);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const execCmd = useCallback((command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (textareaRef.current) textareaRef.current.focus();
    }, []);

    const menuActions = useMemo(() => ({
        'new-file': () => setcode(''),
        'open': () => { },
        'save': () => { },
        'undo': () => execCmd('undo'),
        'redo': () => execCmd('redo'),
        'copy': () => execCmd('copy'),
        'paste': () => {
            navigator.clipboard.readText().then(text => {
                const el = textareaRef.current;
                if (el) {
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const newCode = code.substring(0, start) + text + code.substring(end);
                    setcode(newCode);
                    setTimeout(() => {
                        el.selectionStart = el.selectionEnd = start + text.length;
                    }, 0);
                }
            });
        },
        'cut': () => execCmd('cut'),
        'select-all': () => textareaRef.current?.select(),
        'run-code': () => runcode(),
    }), [code, runcode, execCmd]);

    useMenuAction(appId, menuActions, id);

    return (
        <div className="flex flex-col h-full w-full bg-[#1e1e1e]/90 backdrop-blur-xl text-white font-mono text-sm">
            <div className="h-10 bg-[#252526]/80 flex items-center px-4 border-b border-[#333] shrink-0 justify-between select-none backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <IoPython size={18} className="text-[#3776AB]" />
                    <span className="text-xs text-gray-400">main.py - Python IDE</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={runcode}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 transition-colors ${isrunning ? 'text-gray-500 cursor-not-allowed' : 'text-[#4CAF50]'}`}
                        disabled={isrunning}
                    >
                        <FaPlay size={12} />
                        Run
                    </button>
                    <button
                        onClick={() => setshowsidebar(!showsidebar)}
                        className={`p-1.5 rounded hover:bg-white/10 ${showsidebar ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}
                    >
                        <VscFiles size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {showsidebar && (
                    <div className={`${ismobile ? 'absolute inset-y-0 left-0 z-10 w-[200px] shadow-2xl' : 'relative w-[220px]'} bg-[#252526]/90 backdrop-blur-md border-r border-black/20 flex flex-col shrink-0`}>
                        <div className="p-2 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project Navigation</div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#37373d] text-gray-200 text-xs">
                            <IoIosArrowDown size={12} />
                            <FaFolder size={12} className="text-blue-400" />
                            <span className="font-semibold">MyPythonProject</span>
                        </div>
                        <div className="pl-6 py-1 flex items-center gap-2 bg-[#094771] text-white text-xs cursor-pointer">
                            <IoPython size={12} className="text-yellow-400" />
                            <span>main.py</span>
                        </div>
                        <div className="pl-6 py-1 flex items-center gap-2 text-gray-400 hover:bg-[#2a2d2e] text-xs cursor-pointer">
                            <div className="w-3 h-3 border border-gray-600 rounded flex items-center justify-center text-[8px]">M</div>
                            <span>README.md</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]/50">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={code}
                            onChange={(e) => setcode(e.target.value)}
                            className="w-full h-full bg-transparent text-[#d4d4d4] p-6 resize-none focus:outline-none font-mono text-[13px] leading-6 tab-4"
                            spellCheck={false}
                        />
                    </div>

                    <div className="h-1/3 border-t border-black/30 bg-[#1e1e1e]/80 backdrop-blur flex flex-col">
                        <div className="flex items-center justify-between px-4 py-1 bg-[#252526]/50 border-b border-black/30">
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
