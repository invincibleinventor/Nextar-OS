'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    IoMailOutline, IoChevronBack, IoArchiveOutline, IoTrashOutline,
    IoPencilOutline, IoMailOpenOutline, IoSendOutline, IoRefreshOutline,
    IoAttachOutline, IoCloseOutline, IoReturnUpBackOutline,
    IoStarOutline, IoStar, IoEllipsisHorizontalOutline,
} from 'react-icons/io5';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { useDevice } from '../DeviceContext';
import { useWindows } from '../WindowContext';
import { useProjects } from '../ProjectContext';
import { useNotifications } from '../NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsClay } from '../hooks/useIsClay';
import { glassSidebar, glassCard, glassButton, glassInput, clayClasses } from '../hooks/useClayStyles';

interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    isRead: boolean;
    isStarred: boolean;
    labelIds: string[];
}

interface ComposeData {
    to: string;
    subject: string;
    body: string;
    attachProjectFiles: boolean;
}

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function parseHeader(headers: any[], name: string): string {
    return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64Url(data: string): string {
    try {
        const padded = data.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(escape(atob(padded)));
    } catch {
        return '';
    }
}

function extractBody(payload: any): string {
    if (payload.body?.data) {
        return decodeBase64Url(payload.body.data);
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return decodeBase64Url(part.body.data);
            }
        }
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body?.data) {
                return decodeBase64Url(part.body.data);
            }
            if (part.parts) {
                const nested = extractBody(part);
                if (nested) return nested;
            }
        }
    }
    return '';
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 86400000) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 604800000) {
            return d.toLocaleDateString([], { weekday: 'short' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function extractSenderName(from: string): string {
    const match = from.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].replace(/"/g, '') : from.split('@')[0];
}

export default function Mail({ windowId, ...props }: any) {
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const { ismobile } = useDevice();
    const clay = useIsClay();
    const { activewindow } = useWindows();
    const { currentFiles } = useProjects();
    const { addToast } = useNotifications();
    const [mobileview, setmobileview] = useState<'mailboxes' | 'list' | 'detail' | 'compose'>('list');

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [messages, setMessages] = useState<GmailMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
    const [composing, setComposing] = useState(false);
    const [compose, setCompose] = useState<ComposeData>({ to: '', subject: '', body: '', attachProjectFiles: false });
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const refreshTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { retrieveAndDecrypt } = await import('../../utils/secureStorage');
                const token = await retrieveAndDecrypt('google-access-token');
                if (token) setAccessToken(token);
            } catch {
            }
        })();
    }, []);

    const gmailFetch = useCallback(async (endpoint: string, options?: RequestInit) => {
        if (!accessToken) return null;
        const res = await fetch(`${GMAIL_API}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) {
            if (res.status === 401) {
                setAccessToken(null);
                addToast('Session expired — sign in again', 'error');
                return null;
            }
            throw new Error(`Gmail API error: ${res.status}`);
        }
        return res.json();
    }, [accessToken, addToast]);

    const fetchMessages = useCallback(async (labelId: string) => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const labelMap: Record<string, string> = {
                inbox: 'INBOX',
                sent: 'SENT',
                drafts: 'DRAFT',
                trash: 'TRASH',
                starred: 'STARRED',
            };
            const label = labelMap[labelId] || 'INBOX';
            const data = await gmailFetch(`/messages?labelIds=${label}&maxResults=30`);
            if (!data?.messages) {
                setMessages([]);
                setUnreadCount(0);
                setLoading(false);
                return;
            }

            const details = await Promise.all(
                data.messages.slice(0, 30).map((m: any) =>
                    gmailFetch(`/messages/${m.id}?format=full`)
                )
            );

            const parsed: GmailMessage[] = details.filter(Boolean).map((msg: any) => ({
                id: msg.id,
                threadId: msg.threadId,
                snippet: msg.snippet,
                from: parseHeader(msg.payload.headers, 'From'),
                to: parseHeader(msg.payload.headers, 'To'),
                subject: parseHeader(msg.payload.headers, 'Subject') || '(no subject)',
                date: parseHeader(msg.payload.headers, 'Date'),
                body: extractBody(msg.payload),
                isRead: !msg.labelIds?.includes('UNREAD'),
                isStarred: msg.labelIds?.includes('STARRED'),
                labelIds: msg.labelIds || [],
            }));

            setMessages(parsed);
            if (labelId === 'inbox') {
                setUnreadCount(parsed.filter(m => !m.isRead).length);
            }
        } catch (err: any) {
            addToast('Failed to fetch mail: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, gmailFetch, addToast]);

    useEffect(() => {
        if (accessToken) {
            fetchMessages(selectedFolder);
        }
    }, [accessToken, selectedFolder]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!accessToken) return;
        refreshTimer.current = setInterval(() => {
            fetchMessages(selectedFolder);
        }, 60000);
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current);
        };
    }, [accessToken, selectedFolder]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGoogleLogin = useCallback(() => {
        const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
        if (!GOOGLE_CLIENT_ID) {
            addToast('Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file.', 'error', [
                { label: 'Learn More', actionId: 'open-help' },
            ]);
            return;
        }
        const redirectUri = `${window.location.origin}/auth/callback`;
        const scopes = [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' ');

        const state = crypto.randomUUID();
        sessionStorage.setItem('oauth-state', state);

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('prompt', 'consent');

        const w = 500, h = 600;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        const popup = window.open(authUrl.toString(), 'Google Login', `width=${w},height=${h},top=${top},left=${left}`);

        const interval = setInterval(async () => {
            try {
                if (!popup || popup.closed) { clearInterval(interval); return; }
                const url = popup.location.href;
                if (url.includes('access_token')) {
                    clearInterval(interval);
                    const hash = new URL(url).hash.substring(1);
                    const params = new URLSearchParams(hash);
                    const token = params.get('access_token');
                    popup.close();

                    if (token) {
                        setAccessToken(token);
                        const { encryptAndStore } = await import('../../utils/secureStorage');
                        await encryptAndStore('google-access-token', token);
                        addToast('Signed in to Gmail', 'success');
                    }
                }
            } catch {
            }
        }, 500);
    }, [addToast]);

    const markAsRead = useCallback(async (messageId: string) => {
        await gmailFetch(`/messages/${messageId}/modify`, {
            method: 'POST',
            body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, [gmailFetch]);

    const toggleStar = useCallback(async (messageId: string) => {
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;
        const body = msg.isStarred
            ? { removeLabelIds: ['STARRED'] }
            : { addLabelIds: ['STARRED'] };
        await gmailFetch(`/messages/${messageId}/modify`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m));
    }, [messages, gmailFetch]);

    const archiveMessage = useCallback(async (messageId: string) => {
        await gmailFetch(`/messages/${messageId}/modify`, {
            method: 'POST',
            body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
        });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setSelectedMessage(null);
        addToast('Archived', 'success');
    }, [gmailFetch, addToast]);

    const trashMessage = useCallback(async (messageId: string) => {
        await gmailFetch(`/messages/${messageId}/trash`, { method: 'POST' });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setSelectedMessage(null);
        addToast('Moved to trash', 'success');
    }, [gmailFetch, addToast]);

    const handleSend = useCallback(async () => {
        if (!accessToken || !compose.to.trim()) return;
        setSending(true);
        try {
            let mimeMessage: string;

            if (compose.attachProjectFiles && currentFiles.length > 0) {
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                for (const f of currentFiles.filter(f => !f.isDirectory)) {
                    zip.file(f.path, f.content);
                }
                const blob = await zip.generateAsync({ type: 'arraybuffer' });
                const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
                const boundary = `boundary_${Date.now()}`;
                mimeMessage = [
                    `To: ${compose.to}`,
                    `Subject: ${compose.subject}`,
                    `MIME-Version: 1.0`,
                    `Content-Type: multipart/mixed; boundary="${boundary}"`,
                    '',
                    `--${boundary}`,
                    'Content-Type: text/plain; charset="UTF-8"',
                    '',
                    compose.body,
                    '',
                    `--${boundary}`,
                    'Content-Type: application/zip; name="project.zip"',
                    'Content-Transfer-Encoding: base64',
                    'Content-Disposition: attachment; filename="project.zip"',
                    '',
                    base64,
                    `--${boundary}--`,
                ].join('\r\n');
            } else {
                mimeMessage = [
                    `To: ${compose.to}`,
                    `Subject: ${compose.subject}`,
                    `MIME-Version: 1.0`,
                    'Content-Type: text/plain; charset="UTF-8"',
                    '',
                    compose.body,
                ].join('\r\n');
            }

            const raw = btoa(unescape(encodeURIComponent(mimeMessage)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const res = await fetch(`${GMAIL_API}/messages/send`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ raw }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Send failed');
            }

            addToast('Message sent', 'success');
            setComposing(false);
            setCompose({ to: '', subject: '', body: '', attachProjectFiles: false });
            if (ismobile) setmobileview('list');
        } catch (err: any) {
            addToast('Send failed: ' + err.message, 'error');
        } finally {
            setSending(false);
        }
    }, [accessToken, compose, currentFiles, addToast, ismobile]);

    const openMessage = useCallback((msg: GmailMessage) => {
        setSelectedMessage(msg);
        if (!msg.isRead) markAsRead(msg.id);
        if (ismobile) setmobileview('detail');
    }, [ismobile, markAsRead]);

    const startCompose = useCallback((replyTo?: GmailMessage) => {
        if (replyTo) {
            setCompose({
                to: replyTo.from,
                subject: replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`,
                body: `\n\n--- Original Message ---\n${replyTo.body.slice(0, 500)}`,
                attachProjectFiles: false,
            });
        } else {
            setCompose({ to: '', subject: '', body: '', attachProjectFiles: false });
        }
        setComposing(true);
        if (ismobile) setmobileview('compose');
    }, [ismobile]);

    useEffect(() => {
        if (!windowId || !ismobile) return;
        const handleAppBack = (e: Event) => {
            if (activewindow !== windowId) return;
            if (mobileview === 'detail' || mobileview === 'compose') {
                e.preventDefault();
                setmobileview('list');
                setSelectedMessage(null);
                setComposing(false);
            } else if (mobileview === 'list') {
                e.preventDefault();
                setmobileview('mailboxes');
            }
        };
        window.addEventListener('app-back', handleAppBack);
        return () => window.removeEventListener('app-back', handleAppBack);
    }, [windowId, ismobile, activewindow, mobileview]);

    const mailboxItems = [
        { id: 'inbox', label: 'Inbox', icon: IoMailOutline, count: unreadCount },
        { id: 'starred', label: 'Starred', icon: IoStarOutline, count: 0 },
        { id: 'sent', label: 'Sent', icon: IoSendOutline, count: 0 },
        { id: 'drafts', label: 'Drafts', icon: IoPencilOutline, count: 0 },
        { id: 'trash', label: 'Trash', icon: IoTrashOutline, count: 0 },
    ];

    const SignInPrompt = () => (
        <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted] gap-3 p-8">
            <IoMailOpenOutline size={48} className={clay ? 'text-[--text-muted] mb-2' : 'opacity-30'} />
            <p className={`${clay ? 'text-[13px]' : 'text-xs'} text-[--text-muted]`}>Sign in with Google to access Gmail</p>
            <button
                onClick={handleGoogleLogin}
                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 transition-all ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`}
                style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}
            >
                <FaGoogle size={12} /> Sign in with Google
            </button>
        </div>
    );

    const MessageList = () => (
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="flex items-center justify-center py-12 text-[--text-muted]">
                    <FaSpinner className="animate-spin" size={16} />
                </div>
            ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted] py-12">
                    <IoMailOpenOutline size={48} className={clay ? 'text-[--text-muted] mb-4' : 'opacity-30 mb-2'} />
                    <span className={`${clay ? 'text-[13px]' : 'text-xs'} text-[--text-muted]`}>No messages</span>
                </div>
            ) : (
                <div className={clay ? 'px-1 py-1' : ''}>
                    {messages.map(msg => {
                        const isSelected = selectedMessage?.id === msg.id;
                        return (
                            <div
                                key={msg.id}
                                onClick={() => openMessage(msg)}
                                className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-all ${
                                    clay
                                        ? `rounded-[12px] mx-1 my-0.5 active:scale-[0.98] ${isSelected ? 'text-white' : 'hover:bg-[--bg-glass-hover] text-[--text-color]'}`
                                        : `border-b border-[--border-color] hover:bg-overlay ${isSelected ? 'bg-overlay' : ''}`
                                }`}
                                style={clay && isSelected ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleStar(msg.id); }}
                                    className="mt-0.5 shrink-0"
                                >
                                    {msg.isStarred
                                        ? <IoStar size={13} className="text-pastel-yellow" />
                                        : <IoStarOutline size={13} className={`${clay && isSelected ? 'text-white/50 hover:text-white' : 'text-[--text-muted] opacity-40 hover:opacity-100'}`} />
                                    }
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[12px] truncate ${
                                            clay && isSelected ? 'font-semibold' :
                                            msg.isRead ? 'text-[--text-muted]' : 'text-[--text-color] font-semibold'
                                        }`}>
                                            {extractSenderName(msg.from)}
                                        </span>
                                        <span className={`text-[10px] shrink-0 ${clay && isSelected ? 'text-white/70' : 'text-[--text-muted]'}`}>{formatDate(msg.date)}</span>
                                    </div>
                                    <div className={`text-[11px] truncate ${
                                        clay && isSelected ? 'text-white/90 font-medium' :
                                        msg.isRead ? 'text-[--text-muted]' : 'text-[--text-color] font-medium'
                                    }`}>
                                        {msg.subject}
                                    </div>
                                    <div className={`text-[10px] truncate mt-0.5 ${clay && isSelected ? 'text-white/60' : 'text-[--text-muted]'}`}>{msg.snippet}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const MessageDetail = () => {
        if (!selectedMessage) return null;
        return (
            <div className={`flex-1 flex flex-col overflow-hidden ${clay ? 'bg-[--bg-base]' : ''}`}>
                <div className={`flex items-center gap-1 px-3 py-2 border-b shrink-0 ${clay ? 'border-[--glass-border] bg-transparent' : 'border-[--border-color] bg-surface'}`}>
                    {!ismobile && (
                        <button onClick={() => setSelectedMessage(null)} className={`p-1.5 text-[--text-muted] transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}>
                            <IoChevronBack size={14} />
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => archiveMessage(selectedMessage.id)} className={`p-1.5 text-[--text-muted] transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`} title="Archive">
                        <IoArchiveOutline size={14} />
                    </button>
                    <button onClick={() => trashMessage(selectedMessage.id)} className={`p-1.5 text-pastel-red transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`} title="Delete">
                        <IoTrashOutline size={14} />
                    </button>
                    <button onClick={() => startCompose(selectedMessage)} className={`p-1.5 text-[--text-muted] transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`} title="Reply">
                        <IoReturnUpBackOutline size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <h2 className="text-lg font-semibold text-[--text-color] mb-3">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold text-white ${clay ? 'rounded-[8px]' : ''}`}
                            style={clay ? { background: 'var(--accent-gradient)' } : { background: 'var(--bg-overlay)' }}>
                            {extractSenderName(selectedMessage.from).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-[12px] font-medium text-[--text-color]">{extractSenderName(selectedMessage.from)}</div>
                            <div className="text-[10px] text-[--text-muted]">
                                to {selectedMessage.to ? extractSenderName(selectedMessage.to) : 'me'} · {formatDate(selectedMessage.date)}
                            </div>
                        </div>
                    </div>
                    <div className="text-[12px] text-[--text-color] leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.body}
                    </div>
                </div>
            </div>
        );
    };

    const ComposePanel = () => (
        <div className={`${ismobile ? 'flex-1 flex flex-col' : `absolute bottom-0 right-4 w-96 z-50 flex flex-col ${clay ? 'rounded-t-[16px]' : 'bg-surface border border-[--border-color] shadow-pastel-lg'}`}`}
            style={ismobile ? {} : clay ? { height: 400, ...glassCard, borderRadius: '16px 16px 0 0', boxShadow: 'var(--shadow-lg)' } : { height: 400 }}>
            <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${clay ? 'border-[--glass-border] bg-transparent' : 'bg-overlay border-[--border-color]'}`}>
                <span className="text-[12px] font-medium text-[--text-color]">New Message</span>
                <button onClick={() => { setComposing(false); if (ismobile) setmobileview('list'); }} className={`p-1 transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover]' : 'hover:bg-[--border-color]'}`}>
                    <IoCloseOutline size={14} className="text-[--text-muted]" />
                </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`px-3 py-1.5 border-b ${clay ? 'border-[--text-muted]/10' : 'border-[--border-color]'}`}>
                    <input
                        type="email"
                        value={compose.to}
                        onChange={e => setCompose(p => ({ ...p, to: e.target.value }))}
                        placeholder="To"
                        className="w-full bg-transparent text-[12px] text-[--text-color] outline-none placeholder:text-[--text-muted]"
                    />
                </div>
                <div className={`px-3 py-1.5 border-b ${clay ? 'border-[--text-muted]/10' : 'border-[--border-color]'}`}>
                    <input
                        type="text"
                        value={compose.subject}
                        onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                        placeholder="Subject"
                        className="w-full bg-transparent text-[12px] text-[--text-color] outline-none placeholder:text-[--text-muted]"
                    />
                </div>
                <textarea
                    value={compose.body}
                    onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                    placeholder="Compose your message..."
                    className="flex-1 px-3 py-2 bg-transparent text-[12px] text-[--text-color] outline-none resize-none placeholder:text-[--text-muted]"
                />
                <div className={`flex items-center justify-between px-3 py-2 border-t shrink-0 ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSend}
                            disabled={sending || !compose.to.trim()}
                            className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-[11px] font-medium hover:opacity-90 disabled:opacity-50 transition-all ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`}
                            style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}
                        >
                            {sending ? <FaSpinner className="animate-spin" size={10} /> : <IoSendOutline size={12} />}
                            Send
                        </button>
                        <button
                            onClick={() => setCompose(p => ({ ...p, attachProjectFiles: !p.attachProjectFiles }))}
                            className={`flex items-center gap-1 px-2 py-1.5 text-[10px] transition-all ${clay ? 'rounded-[12px]' : ''} ${
                                compose.attachProjectFiles
                                    ? 'text-white'
                                    : `text-[--text-muted] ${clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay'}`
                            }`}
                            style={compose.attachProjectFiles
                                ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }
                                : clay ? glassButton : { border: '1px solid var(--border-color)' }
                            }
                            title="Attach project files as zip"
                        >
                            <IoAttachOutline size={12} />
                            Project files
                        </button>
                    </div>
                    <button onClick={() => { setComposing(false); if (ismobile) setmobileview('list'); }} className={`text-[10px] text-[--text-muted] hover:text-pastel-red transition-colors ${clay ? 'rounded-[8px] px-2 py-1 hover:bg-[--bg-glass-hover]' : ''}`}>
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );

    if (ismobile) {
        return (
            <div className={`flex flex-col h-full w-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} text-[--text-color] overflow-hidden`}>
                {!accessToken ? (
                    <SignInPrompt />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {mobileview === 'mailboxes' && (
                            <motion.div key="mailboxes" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex-1 flex flex-col">
                                <div className={`h-14 flex items-center px-4 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                    <span className="text-[20px] font-bold text-[--text-color]">Mailboxes</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {mailboxItems.map(item => (
                                        <button key={item.id} onClick={() => { setSelectedFolder(item.id); setmobileview('list'); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 border-b ${clay ? 'border-[--glass-border] active:bg-[--bg-glass-hover]' : 'border-[--border-color] active:bg-overlay'}`}>
                                            <item.icon size={18} className="text-accent" />
                                            <span className="flex-1 text-left text-[14px] text-[--text-color]">{item.label}</span>
                                            {item.count > 0 && (
                                                <span className={`text-[12px] text-white px-1.5 min-w-[18px] text-center ${clay ? 'rounded-full' : ''}`}
                                                    style={{ background: 'var(--accent-gradient)' }}>{item.count}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className={`p-3 border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                    <button onClick={() => startCompose()}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-white text-[14px] font-medium ${clay ? 'rounded-[12px] active:scale-[0.97]' : ''}`}
                                        style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}>
                                        <IoPencilOutline size={16} /> Compose
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {mobileview === 'list' && (
                            <motion.div key="list" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex-1 flex flex-col">
                                <div className={`h-14 flex items-center px-4 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                    <button onClick={() => setmobileview('mailboxes')} className="text-accent flex items-center gap-1 mr-4">
                                        <IoChevronBack size={20} />
                                    </button>
                                    <span className="font-semibold capitalize flex-1 text-[--text-color]">{selectedFolder}</span>
                                    <button onClick={() => fetchMessages(selectedFolder)} className="p-1 text-[--text-muted]">
                                        <IoRefreshOutline size={18} />
                                    </button>
                                </div>
                                <MessageList />
                            </motion.div>
                        )}
                        {mobileview === 'detail' && (
                            <motion.div key="detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex-1 flex flex-col">
                                <div className={`h-14 flex items-center px-4 border-b ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                                    <button onClick={() => { setmobileview('list'); setSelectedMessage(null); }} className="text-accent flex items-center gap-1 mr-4">
                                        <IoChevronBack size={20} />
                                    </button>
                                    <span className="font-semibold truncate flex-1 text-[--text-color]">{selectedMessage?.subject}</span>
                                </div>
                                <MessageDetail />
                            </motion.div>
                        )}
                        {mobileview === 'compose' && (
                            <motion.div key="compose" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="flex-1 flex flex-col">
                                <ComposePanel />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        );
    }

    return (
        <div className={`flex h-full w-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} text-[--text-color] overflow-hidden relative`}>
            <div className={`${clay ? 'w-[230px]' : 'w-48'} flex flex-col shrink-0 ${clay ? '' : 'border-r border-[--border-color] bg-surface anime-gradient-top'}`}
                style={clay ? glassSidebar : undefined}>
                <div className="px-3 pt-3 pb-2">
                    <span className="text-[11px] font-bold text-[--text-muted] uppercase tracking-wide">Mailboxes</span>
                </div>
                <div className={`px-2 flex-1 ${clay ? 'space-y-1' : 'space-y-0.5'}`}>
                    {mailboxItems.map(item => {
                        const active = selectedFolder === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setSelectedFolder(item.id); setSelectedMessage(null); }}
                                className={`w-full flex items-center text-left transition-all ${
                                    clay
                                        ? `gap-3 px-3 py-2.5 rounded-[12px] active:scale-[0.98] ${active ? 'text-white' : 'text-[--text-color] hover:bg-[--bg-glass-hover]'}`
                                        : `gap-2 px-2 py-1.5 ${active ? 'bg-accent text-[--bg-base]' : 'hover:bg-overlay text-[--text-color]'}`
                                }`}
                                style={clay && active ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                            >
                                <div className={`flex items-center justify-center shrink-0 ${clay ? 'w-6 h-6 rounded-[7px]' : ''}`}
                                    style={clay ? { backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'var(--pastel-blue)' } : undefined}>
                                    <item.icon size={clay ? 14 : 14} className={clay ? 'text-white' : ''} />
                                </div>
                                <span className={`flex-1 font-medium ${clay ? 'text-[14px]' : 'text-[12px]'}`}>{item.label}</span>
                                {item.count > 0 && (
                                    <span className={`text-[10px] px-1.5 min-w-[18px] text-center font-medium ${
                                        active
                                            ? 'text-white/70'
                                            : clay ? 'text-white rounded-full' : 'text-[--bg-base]'
                                    }`}
                                        style={!active ? { background: 'var(--accent-gradient)' } : undefined}
                                    >{item.count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className={`p-2 border-t ${clay ? 'border-[--glass-border]' : 'border-[--border-color]'}`}>
                    <button
                        onClick={() => startCompose()}
                        className={`flex items-center justify-center gap-1.5 py-2 text-white text-[13px] font-medium hover:opacity-90 transition-all ${clay ? 'w-full rounded-[12px] active:scale-[0.97]' : 'w-full'}`}
                        style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' }}
                    >
                        <IoPencilOutline size={14} /> Compose
                    </button>
                </div>
            </div>

            {!accessToken ? (
                <SignInPrompt />
            ) : (
                <>
                    <div className={`w-72 flex flex-col shrink-0 ${clay ? '' : 'border-r border-[--border-color]'}`}
                        style={clay ? { borderRight: '1px solid var(--glass-border)' } : undefined}>
                        <div className={`h-10 flex items-center justify-between px-3 border-b shrink-0 ${clay ? 'border-[--glass-border] bg-transparent' : 'border-[--border-color] bg-surface'}`}>
                            <span className={`font-semibold capitalize ${clay ? 'text-[13px] text-[--text-color]' : 'text-[12px]'}`}>{selectedFolder}</span>
                            <button onClick={() => fetchMessages(selectedFolder)} className={`p-1.5 text-[--text-muted] transition-colors ${clay ? 'rounded-[8px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}>
                                {loading ? <FaSpinner className="animate-spin" size={11} /> : <IoRefreshOutline size={13} />}
                            </button>
                        </div>
                        <MessageList />
                    </div>

                    <div className={`flex-1 flex flex-col min-w-0 ${clay ? 'bg-[--bg-base]' : ''}`}>
                        {selectedMessage ? (
                            <MessageDetail />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted]">
                                <IoMailOpenOutline size={48} className={clay ? 'text-[--text-muted] mb-4' : 'opacity-20 mb-2'} />
                                <span className={`${clay ? 'text-[13px]' : 'text-xs'} text-[--text-muted]`}>Select a message to read</span>
                            </div>
                        )}
                    </div>

                    {composing && !ismobile && <ComposePanel />}
                </>
            )}
        </div>
    );
}
