'use client';
import React, { useState, useCallback } from 'react';
import { VscSend, VscAdd, VscTrash, VscSave, VscHistory } from 'react-icons/vsc';
import { IoCodeOutline } from 'react-icons/io5';

interface Header { key: string; value: string; enabled: boolean }
interface SavedRequest { id: string; name: string; method: string; url: string; headers: Header[]; body: string }
interface ResponseData { status: number; statusText: string; headers: Record<string, string>; body: string; time: number; size: number }

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
const METHOD_COLORS: Record<string, string> = {
    GET: 'text-pastel-green', POST: 'text-pastel-yellow', PUT: 'text-pastel-blue',
    PATCH: 'text-pastel-peach', DELETE: 'text-pastel-red', HEAD: 'text-pastel-mauve',
    OPTIONS: 'text-pastel-teal',
};

export default function ApiPlayground() {
    const [method, setMethod] = useState<string>('GET');
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState<Header[]>([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    const [body, setBody] = useState('');
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response'>('headers');
    const [saved, setSaved] = useState<SavedRequest[]>(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem('api-playground-saved') || '[]'); } catch { return []; }
    });
    const [history, setHistory] = useState<SavedRequest[]>([]);

    const send = useCallback(async () => {
        if (!url) return;
        setLoading(true);
        const start = performance.now();
        try {
            const h: Record<string, string> = {};
            headers.filter(x => x.enabled && x.key).forEach(x => { h[x.key] = x.value; });
            const opts: RequestInit = { method, headers: h };
            if (!['GET', 'HEAD'].includes(method) && body) opts.body = body;
            const res = await fetch(url, opts);
            const text = await res.text();
            const resHeaders: Record<string, string> = {};
            res.headers.forEach((v, k) => { resHeaders[k] = v; });
            setResponse({
                status: res.status, statusText: res.statusText,
                headers: resHeaders, body: text,
                time: Math.round(performance.now() - start),
                size: new Blob([text]).size,
            });
            setActiveTab('response');
            setHistory(prev => [{ id: Date.now().toString(), name: `${method} ${url}`, method, url, headers, body }, ...prev.slice(0, 49)]);
        } catch (err: any) {
            setResponse({ status: 0, statusText: 'Error', headers: {}, body: err.message || String(err), time: Math.round(performance.now() - start), size: 0 });
            setActiveTab('response');
        }
        setLoading(false);
    }, [url, method, headers, body]);

    const saveRequest = () => {
        const req: SavedRequest = { id: Date.now().toString(), name: `${method} ${url}`, method, url, headers, body };
        const next = [req, ...saved];
        setSaved(next);
        localStorage.setItem('api-playground-saved', JSON.stringify(next));
    };

    const loadRequest = (req: SavedRequest) => {
        setMethod(req.method); setUrl(req.url); setHeaders(req.headers); setBody(req.body);
    };

    const addHeader = () => setHeaders(prev => [...prev, { key: '', value: '', enabled: true }]);
    const removeHeader = (i: number) => setHeaders(prev => prev.filter((_, idx) => idx !== i));
    const updateHeader = (i: number, field: keyof Header, val: string | boolean) => {
        setHeaders(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
    };

    const statusColor = response ? (response.status >= 200 && response.status < 300 ? 'text-pastel-green' : response.status >= 400 ? 'text-pastel-red' : 'text-pastel-yellow') : '';

    return (
        <div className="flex h-full bg-[--bg-base] text-[--text-color]">
            {/* Sidebar */}
            <div className="w-56 border-r border-[--border-color] bg-[--bg-surface] flex flex-col">
                <div className="p-2 text-xs font-medium text-[--text-muted] uppercase tracking-wider">Saved</div>
                <div className="flex-1 overflow-y-auto">
                    {saved.map(req => (
                        <button key={req.id} onClick={() => loadRequest(req)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[--bg-overlay] truncate transition-colors">
                            <span className={`font-mono font-bold mr-1 ${METHOD_COLORS[req.method] || ''}`}>{req.method}</span>
                            <span className="text-[--text-muted]">{req.url.replace(/^https?:\/\//, '')}</span>
                        </button>
                    ))}
                    {saved.length === 0 && <p className="px-3 py-2 text-xs text-[--text-muted]">No saved requests</p>}
                </div>
                <div className="p-2 text-xs font-medium text-[--text-muted] uppercase tracking-wider flex items-center gap-1">
                    <VscHistory className="w-3 h-3" /> History
                </div>
                <div className="flex-1 overflow-y-auto max-h-40">
                    {history.slice(0, 20).map(req => (
                        <button key={req.id} onClick={() => loadRequest(req)}
                            className="w-full text-left px-3 py-1 text-xs hover:bg-[--bg-overlay] truncate transition-colors text-[--text-muted]">
                            <span className={`font-mono font-bold mr-1 ${METHOD_COLORS[req.method] || ''}`}>{req.method}</span>
                            {req.url.replace(/^https?:\/\//, '').slice(0, 30)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* URL bar */}
                <div className="flex items-center gap-2 p-3 border-b border-[--border-color] bg-[--bg-surface]">
                    <select value={method} onChange={e => setMethod(e.target.value)}
                        className={`bg-[--bg-overlay] border border-[--border-color] rounded px-2 py-1.5 text-xs font-mono font-bold ${METHOD_COLORS[method] || ''}`}>
                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint"
                        onKeyDown={e => e.key === 'Enter' && send()}
                        className="flex-1 bg-[--bg-overlay] border border-[--border-color] rounded px-3 py-1.5 text-sm font-mono placeholder:text-[--text-muted] focus:outline-none focus:border-pastel-blue" />
                    <button onClick={send} disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pastel-blue text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                        <VscSend className="w-3 h-3" /> {loading ? 'Sending...' : 'Send'}
                    </button>
                    <button onClick={saveRequest} className="p-1.5 hover:bg-[--bg-overlay] rounded" title="Save">
                        <VscSave className="w-4 h-4 text-[--text-muted]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[--border-color] bg-[--bg-surface]">
                    {(['headers', 'body', 'response'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-medium capitalize ${activeTab === tab ? 'border-b-2 border-pastel-blue text-pastel-blue' : 'text-[--text-muted] hover:text-[--text-color]'}`}>
                            {tab} {tab === 'response' && response ? `(${response.status})` : ''}
                        </button>
                    ))}
                    {response && (
                        <div className="ml-auto flex items-center gap-3 pr-3 text-xs text-[--text-muted]">
                            <span className={statusColor}>{response.status} {response.statusText}</span>
                            <span>{response.time}ms</span>
                            <span>{response.size > 1024 ? `${(response.size / 1024).toFixed(1)}KB` : `${response.size}B`}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-3">
                    {activeTab === 'headers' && (
                        <div className="space-y-2">
                            {headers.map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input type="checkbox" checked={h.enabled} onChange={e => updateHeader(i, 'enabled', e.target.checked)}
                                        className="accent-pastel-blue" />
                                    <input value={h.key} onChange={e => updateHeader(i, 'key', e.target.value)} placeholder="Key"
                                        className="flex-1 bg-[--bg-overlay] border border-[--border-color] rounded px-2 py-1 text-xs font-mono" />
                                    <input value={h.value} onChange={e => updateHeader(i, 'value', e.target.value)} placeholder="Value"
                                        className="flex-1 bg-[--bg-overlay] border border-[--border-color] rounded px-2 py-1 text-xs font-mono" />
                                    <button onClick={() => removeHeader(i)} className="p-1 hover:bg-[--bg-overlay] rounded text-[--text-muted]">
                                        <VscTrash className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addHeader} className="flex items-center gap-1 text-xs text-pastel-blue hover:underline">
                                <VscAdd className="w-3 h-3" /> Add Header
                            </button>
                        </div>
                    )}

                    {activeTab === 'body' && (
                        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder='{"key": "value"}'
                            className="w-full h-full bg-[--bg-overlay] border border-[--border-color] rounded p-3 text-xs font-mono resize-none focus:outline-none" />
                    )}

                    {activeTab === 'response' && response && (
                        <div className="space-y-3">
                            <div className="text-xs text-[--text-muted]">
                                Response Headers:
                                <div className="mt-1 bg-[--bg-overlay] rounded p-2 font-mono space-y-0.5">
                                    {Object.entries(response.headers).map(([k, v]) => (
                                        <div key={k}><span className="text-pastel-blue">{k}</span>: {v}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-xs text-[--text-muted]">
                                Body:
                                <pre className="mt-1 bg-[--bg-overlay] rounded p-3 font-mono text-[--text-color] overflow-auto max-h-[60vh] whitespace-pre-wrap">
                                    {(() => { try { return JSON.stringify(JSON.parse(response.body), null, 2); } catch { return response.body; } })()}
                                </pre>
                            </div>
                        </div>
                    )}

                    {activeTab === 'response' && !response && (
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted]">
                            <IoCodeOutline className="w-12 h-12 mb-2 opacity-30" />
                            <p className="text-sm">Send a request to see the response</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
