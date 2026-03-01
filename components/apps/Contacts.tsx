'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    IoPersonAddOutline, IoTrashOutline, IoSearchOutline,
    IoCreateOutline, IoDownloadOutline, IoPersonOutline,
} from 'react-icons/io5';
import { useMenuAction } from '../hooks/useMenuAction';
import { useMenuRegistration } from '../AppMenuContext';
import { useWindows } from '../WindowContext';
import { useIsClay } from '../hooks/useIsClay';
import { glassSidebar, glassCard, glassButton, glassInput, clayClasses } from '../hooks/useClayStyles';

interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
    createdAt: number;
}

const STORAGE_KEY = 'nextaros-contacts';

function loadContacts(): Contact[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

function saveContacts(contacts: Contact[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 70%)`;
}

function initials(first: string, last: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

function generateVCard(c: Contact): string {
    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${c.lastName};${c.firstName};;;`,
        `FN:${c.firstName} ${c.lastName}`.trim(),
        c.email ? `EMAIL:${c.email}` : '',
        c.phone ? `TEL:${c.phone}` : '',
        c.company ? `ORG:${c.company}` : '',
        c.notes ? `NOTE:${c.notes}` : '',
        'END:VCARD',
    ].filter(Boolean).join('\r\n');
}

function emptyContact(): Contact {
    return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
        createdAt: Date.now(),
    };
}

export default function Contacts({ appId = 'contacts', id }: { appId?: string; id?: string }) {
    const { activewindow } = useWindows();
    const isActive = activewindow === id;
    const clay = useIsClay();

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Contact | null>(null);
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        setContacts(loadContacts());
    }, []);

    useEffect(() => {
        if (contacts.length > 0) saveContacts(contacts);
        else if (contacts.length === 0 && loadContacts().length > 0) saveContacts([]);
    }, [contacts]);

    const selected = useMemo(() => contacts.find(c => c.id === selectedId) || null, [contacts, selectedId]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const list = q
            ? contacts.filter(c =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.company.toLowerCase().includes(q)
            )
            : contacts;
        return [...list].sort((a, b) => {
            const na = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nb = `${b.firstName} ${b.lastName}`.toLowerCase();
            return na.localeCompare(nb);
        });
    }, [contacts, search]);

    const grouped = useMemo(() => {
        const map: Record<string, Contact[]> = {};
        for (const c of filtered) {
            const letter = (c.firstName || c.lastName || '?')[0].toUpperCase();
            if (!map[letter]) map[letter] = [];
            map[letter].push(c);
        }
        return Object.keys(map).sort().map(letter => ({ letter, contacts: map[letter] }));
    }, [filtered]);

    const startNew = useCallback(() => {
        const c = emptyContact();
        setDraft(c);
        setEditing(true);
        setSelectedId(c.id);
        setConfirmDelete(false);
    }, []);

    const startEdit = useCallback(() => {
        if (!selected) return;
        setDraft({ ...selected });
        setEditing(true);
        setConfirmDelete(false);
    }, [selected]);

    const cancelEdit = useCallback(() => {
        if (draft && !contacts.find(c => c.id === draft.id)) {
            setSelectedId(null);
        }
        setDraft(null);
        setEditing(false);
    }, [draft, contacts]);

    const saveEdit = useCallback(() => {
        if (!draft) return;
        if (!draft.firstName.trim() && !draft.lastName.trim()) { cancelEdit(); return; }
        setContacts(prev => {
            const exists = prev.find(c => c.id === draft.id);
            if (exists) return prev.map(c => c.id === draft.id ? draft : c);
            return [...prev, draft];
        });
        setSelectedId(draft.id);
        setDraft(null);
        setEditing(false);
    }, [draft, cancelEdit]);

    const deleteContact = useCallback(() => {
        if (!selectedId) return;
        setContacts(prev => prev.filter(c => c.id !== selectedId));
        setSelectedId(null);
        setEditing(false);
        setDraft(null);
        setConfirmDelete(false);
    }, [selectedId]);

    const exportVCard = useCallback(() => {
        if (!selected) return;
        const vcf = generateVCard(selected);
        const blob = new Blob([vcf], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selected.firstName}_${selected.lastName}.vcf`.replace(/\s+/g, '_');
        a.click();
        URL.revokeObjectURL(url);
    }, [selected]);

    const contactMenus = useMemo(() => ({
        File: [
            { title: 'New Contact', actionId: 'contacts-new', shortcut: '⌘N' },
            { title: 'Export vCard', actionId: 'contacts-export', shortcut: '⇧⌘E' },
        ],
        Edit: [
            { title: 'Edit Contact', actionId: 'contacts-edit', shortcut: '⌘E' },
            { title: 'Delete Contact', actionId: 'contacts-delete', shortcut: '⌫' },
        ],
    }), []);

    const menuActions = useMemo(() => ({
        'contacts-new': startNew,
        'contacts-export': exportVCard,
        'contacts-edit': startEdit,
        'contacts-delete': () => { if (selected) setConfirmDelete(true); },
    }), [startNew, exportVCard, startEdit, selected]);

    useMenuRegistration(contactMenus, isActive);
    useMenuAction(appId, menuActions, id);

    const fullName = (c: Contact) => `${c.firstName} ${c.lastName}`.trim() || 'No Name';

    const DetailField = ({ label, value }: { label: string; value: string }) => {
        if (!value) return null;
        return (
            <div className={`py-2.5 border-b ${clay ? 'border-[--text-muted]/10' : 'border-[--border-color]'}`}>
                <div className="text-[10px] text-[--text-muted] mb-0.5">{label}</div>
                <div className="text-[13px] text-[--text-color]">{value}</div>
            </div>
        );
    };

    return (
        <div className={`flex h-full w-full ${clay ? 'bg-[--bg-base]' : 'bg-[--bg-base] font-mono'} text-[--text-color] overflow-hidden`}>
            {/* Sidebar */}
            <div className={`${clay ? 'w-[230px]' : 'w-[250px]'} flex flex-col shrink-0 ${clay ? '' : 'border-r border-[--border-color] bg-surface anime-gradient-top'}`}
                style={clay ? glassSidebar : undefined}>
                <div className={`flex items-center gap-1.5 px-2.5 pt-2.5 pb-2`}>
                    <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 ${clay ? 'rounded-full' : 'bg-overlay border border-[--border-color]'}`}
                        style={clay ? glassInput : undefined}>
                        <IoSearchOutline size={13} className="text-[--text-muted] shrink-0" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-[--text-color] outline-none placeholder:text-[--text-muted]"
                        />
                    </div>
                    <button
                        onClick={startNew}
                        className={`p-1.5 text-[--text-muted] hover:text-[--text-color] transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                        title="New Contact"
                    >
                        <IoPersonAddOutline size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-1.5">
                    {grouped.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[--text-muted] px-4 text-center">
                            <IoPersonOutline size={28} className={clay ? 'text-[--text-muted] mb-2' : 'opacity-20 mb-2'} />
                            <span className="text-[11px]">No contacts yet. Click + to add one.</span>
                        </div>
                    ) : (
                        grouped.map(group => (
                            <div key={group.letter}>
                                <div className={`px-3 py-1 text-[10px] font-bold text-[--text-muted] uppercase tracking-wider sticky top-0 ${clay ? 'bg-[--bg-surface]' : 'bg-surface'}`}>
                                    {group.letter}
                                </div>
                                {group.contacts.map(c => {
                                    const isSelected = selectedId === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSelectedId(c.id); setEditing(false); setDraft(null); setConfirmDelete(false); }}
                                            className={`w-full flex items-center gap-3 px-3 text-left transition-all ${clay ? 'py-2.5 rounded-[12px] active:scale-[0.98]' : 'py-2 gap-2.5'} ${
                                                isSelected
                                                    ? (clay ? 'text-white' : 'bg-accent text-[--bg-base]')
                                                    : (clay ? 'hover:bg-[--bg-glass-hover]' : 'hover:bg-overlay')
                                            }`}
                                            style={isSelected && clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                        >
                                            <div
                                                className={`${clay ? 'w-8 h-8' : 'w-7 h-7'} rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                                                style={{ backgroundColor: isSelected && clay ? 'rgba(255,255,255,0.25)' : avatarColor(fullName(c)) }}
                                            >
                                                {initials(c.firstName, c.lastName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`truncate font-medium ${clay ? 'text-[14px]' : 'text-[12px] text-[--text-color]'} ${isSelected && clay ? 'text-white' : isSelected ? '' : 'text-[--text-color]'}`}>{fullName(c)}</div>
                                                {c.company && (
                                                    <div className={`text-[10px] truncate ${isSelected && clay ? 'text-white/70' : 'text-[--text-muted]'}`}>{c.company}</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                <div className={`px-3 py-2 text-[10px] text-[--text-muted] ${clay ? 'border-t border-[--text-muted]/10' : 'border-t border-[--border-color]'}`}>
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 flex flex-col overflow-hidden ${clay ? 'bg-[--bg-base]' : ''}`}>
                {editing && draft ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                                style={{ backgroundColor: avatarColor(`${draft.firstName} ${draft.lastName}`.trim() || 'New') }}
                            >
                                {initials(draft.firstName, draft.lastName)}
                            </div>
                            <span className="text-[10px] text-[--text-muted]">
                                {contacts.find(c => c.id === draft.id) ? 'Edit Contact' : 'New Contact'}
                            </span>
                        </div>

                        <div className="max-w-sm mx-auto space-y-3">
                            {([
                                ['firstName', 'First Name'],
                                ['lastName', 'Last Name'],
                                ['email', 'Email'],
                                ['phone', 'Phone'],
                                ['company', 'Company'],
                            ] as [keyof Contact, string][]).map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-[--text-muted] mb-1">{label}</label>
                                    <input
                                        type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                                        value={draft[key] as string}
                                        onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                                        className={`w-full px-2.5 py-1.5 text-[13px] text-[--text-color] outline-none transition-colors placeholder:text-[--text-muted] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color] focus:border-[--text-muted]'}`}
                                        style={clay ? glassInput : undefined}
                                        placeholder={label}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-[10px] text-[--text-muted] mb-1">Notes</label>
                                <textarea
                                    value={draft.notes}
                                    onChange={e => setDraft({ ...draft, notes: e.target.value })}
                                    rows={3}
                                    className={`w-full px-2.5 py-1.5 text-[13px] text-[--text-color] outline-none transition-colors resize-none placeholder:text-[--text-muted] ${clay ? 'rounded-[12px]' : 'bg-overlay border border-[--border-color] focus:border-[--text-muted]'}`}
                                    style={clay ? glassInput : undefined}
                                    placeholder="Notes"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={saveEdit}
                                    className={`px-5 py-2 text-[13px] font-medium transition-all ${clay ? 'rounded-[12px] active:scale-[0.97] text-white hover:opacity-90' : 'bg-accent text-[--bg-base] hover:opacity-90'}`}
                                    style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={cancelEdit}
                                    className={`px-5 py-2 text-[13px] text-[--text-muted] transition-colors ${clay ? 'rounded-[12px] active:scale-[0.97] hover:bg-[--bg-glass-hover]' : 'border border-[--border-color] hover:bg-overlay'}`}
                                    style={clay ? glassButton : undefined}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : selected ? (
                    <div className="flex-1 overflow-y-auto">
                        <div className={`flex items-center justify-end gap-1 px-4 py-2 shrink-0 ${clay ? 'border-b border-[--text-muted]/10' : 'border-b border-[--border-color]'}`}>
                            <button
                                onClick={startEdit}
                                className={`p-1.5 text-[--text-muted] hover:text-[--text-color] transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                                title="Edit"
                            >
                                <IoCreateOutline size={15} />
                            </button>
                            <button
                                onClick={exportVCard}
                                className={`p-1.5 text-[--text-muted] hover:text-[--text-color] transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                                title="Export vCard"
                            >
                                <IoDownloadOutline size={15} />
                            </button>
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className={`p-1.5 text-[--text-muted] hover:text-pastel-red transition-colors ${clay ? 'rounded-[12px] hover:bg-[--bg-glass-hover] active:scale-[0.97]' : 'hover:bg-overlay'}`}
                                title="Delete"
                            >
                                <IoTrashOutline size={15} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div
                                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                                    style={{ backgroundColor: avatarColor(fullName(selected)) }}
                                >
                                    {initials(selected.firstName, selected.lastName)}
                                </div>
                                <h2 className="text-lg font-semibold text-[--text-color]">{fullName(selected)}</h2>
                                {selected.company && (
                                    <p className="text-[12px] text-[--text-muted]">{selected.company}</p>
                                )}
                            </div>

                            <div className={`max-w-sm mx-auto ${clay ? 'rounded-[16px] p-4' : ''}`}
                                style={clay ? glassCard : undefined}>
                                <DetailField label="Email" value={selected.email} />
                                <DetailField label="Phone" value={selected.phone} />
                                <DetailField label="Company" value={selected.company} />
                                <DetailField label="Notes" value={selected.notes} />
                            </div>
                        </div>

                        {confirmDelete && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
                                <div className={`p-5 max-w-xs w-full mx-4 ${clay ? 'rounded-[28px]' : 'bg-surface border border-[--border-color] shadow-lg'}`}
                                    style={clay ? { background: 'var(--bg-glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))' } : undefined}>
                                    <p className="text-[13px] text-[--text-color] mb-1 font-medium">Delete contact?</p>
                                    <p className="text-[11px] text-[--text-muted] mb-4">
                                        &ldquo;{fullName(selected)}&rdquo; will be permanently removed.
                                    </p>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className={`px-4 py-1.5 text-[13px] text-[--text-muted] transition-colors ${clay ? 'rounded-[12px] active:scale-[0.97] hover:bg-[--bg-glass-hover]' : 'border border-[--border-color] hover:bg-overlay'}`}
                                            style={clay ? glassButton : undefined}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={deleteContact}
                                            className={`px-4 py-1.5 text-[13px] font-medium text-white transition-colors ${clay ? 'rounded-[12px] active:scale-[0.97] bg-[--pastel-red] hover:opacity-90' : 'bg-red-500 hover:bg-red-600'}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted]">
                        <IoPersonOutline size={48} className={clay ? 'text-[--text-muted] mb-4' : 'mb-4 opacity-30'} />
                        <span className="text-[13px] font-medium text-[--text-color] mb-1">
                            {contacts.length === 0 ? 'No Contacts' : 'Select a Contact'}
                        </span>
                        <span className="text-[12px] text-[--text-muted]">
                            {contacts.length === 0
                                ? 'Click + to add your first contact.'
                                : 'Choose a contact from the sidebar to view details.'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
