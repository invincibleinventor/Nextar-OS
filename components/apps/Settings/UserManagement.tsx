import React, { useState, useEffect, useCallback } from 'react';
import { User, createUser, updateUser, deleteUser, getUsers } from '../../../utils/db';
import { useAuth } from '../../AuthContext';
import { IoPerson, IoTrash, IoAdd, IoChevronForward, IoArrowBack, IoCheckmark, IoWarning } from 'react-icons/io5';
import Image from 'next/image';
import { useDevice } from '../../DeviceContext';
import { hashPassword } from '../../../utils/crypto';

const Group = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div className="mb-6">
        {title && <div className="text-[11px] uppercase font-semibold text-gray-400 pl-3 mb-2">{title}</div>}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
            {children}
        </div>
    </div>
);

const Row = ({ children, onClick, last, className = '' }: { children: React.ReactNode, onClick?: () => void, last?: boolean, className?: string }) => (
    <div
        onClick={onClick}
        className={`px-4 py-3 flex items-center justify-between bg-white dark:bg-[#1c1c1e] ${!last ? 'border-b border-gray-100 dark:border-white/5' : ''} ${onClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-white/5' : ''} ${className}`}
    >
        {children}
    </div>
);

export default function UserManagement() {
    const { user: currentUser, logout, isGuest } = useAuth();
    const { ismobile } = useDevice();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');

    const [formData, setFormData] = useState({
        username: '',
        name: '',
        password: '',
        confirmPassword: '',
        role: 'user' as 'admin' | 'user',
        bio: ''
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const refreshUsers = useCallback(async (selectedUsername?: string) => {
        try {
            const u = await getUsers();
            setUsers(u);
            if (selectedUsername) {
                const refreshed = u.find(user => user.username === selectedUsername);
                if (refreshed) setSelectedUser(refreshed);
            }
        } catch {
        }
    }, []);

    useEffect(() => {
        refreshUsers();
    }, [refreshUsers]);


    const resetForm = () => {
        setFormData({ username: '', name: '', password: '', confirmPassword: '', role: 'user', bio: '' });
        setError('');
        setSuccessMsg('');
    };

    const handleSelectUser = (u: User) => {
        setSelectedUser(u);
        setIsCreating(false);
        setFormData({
            username: u.username,
            name: u.name,
            password: '',
            confirmPassword: '',
            role: u.role,
            bio: u.bio || ''
        });
        setView('detail');
        setError('');
        setSuccessMsg('');
    };

    const handleStartCreate = () => {
        setSelectedUser(null);
        setIsCreating(true);
        resetForm();
        setView('detail');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        try {
            if (isCreating) {
                if (!formData.password) throw "Password is required for new users";
                if (formData.password !== formData.confirmPassword) throw "Passwords do not match";

                const hashedPassword = await hashPassword(formData.password);

                await createUser({
                    username: formData.username,
                    name: formData.name,
                    passwordHash: hashedPassword,
                    role: formData.role,
                    bio: formData.bio,
                    avatar: '/pfp.png'
                });
                setSuccessMsg('User created successfully');
                setIsCreating(false);
                setFormData(prev => ({ ...prev, password: '' }));
                await refreshUsers();

                const u = await getUsers();
                const created = u.find(user => user.username === formData.username);
                if (created) handleSelectUser(created);

            } else if (selectedUser) {
                const updates: any = {
                    name: formData.name,
                    role: formData.role,
                    bio: formData.bio
                };

                if (formData.password) {
                    updates.passwordHash = await hashPassword(formData.password);
                }

                await updateUser(selectedUser.username, updates);
                setSuccessMsg('Changes saved');
                await refreshUsers(selectedUser.username);
            }
        } catch (err: any) {
            setError(typeof err === 'string' ? err : 'Operation failed');
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        if (!confirm(`Are you sure you want to delete user @${selectedUser.username}? This cannot be undone.`)) return;
        try {
            await deleteUser(selectedUser.username);
            setSelectedUser(null);
            setIsCreating(false);
            setView('list');
            await refreshUsers();
        } catch (e) {
            alert('Failed to delete user');
        }
    };

    if (isGuest) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#f5f5f7] dark:bg-[#1e1e1e]">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                    <IoPerson size={32} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Guest User</h2>
                <p className="text-gray-500 max-w-sm">
                    Users & Groups settings are not available in Guest mode. Please log in as an administrator to manage users.
                </p>
            </div>
        );
    }

    const renderList = () => (
        <div className="flex flex-col h-full bg-[#f5f5f7] dark:bg-[#1c1c1e] p-4 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-sm">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-gray-200 dark:border-white/10 shadow-inner">
                    <Image src={currentUser?.avatar || "/pfp.png"} alt="Profile" width={64} height={64} className="object-cover" />
                </div>
                <div className="flex-1">
                    <div className="font-bold text-lg">{currentUser?.name}</div>
                    <div className="text-sm text-gray-500">@{currentUser?.username}</div>
                    <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${currentUser?.role === 'admin'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                        }`}>
                        {currentUser?.role === 'admin' ? 'Administrator' : 'Standard User'}
                    </div>
                </div>
                <button
                    onClick={() => currentUser && handleSelectUser(currentUser)}
                    className="px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                    Edit
                </button>
            </div>

            {users.filter(u => u.username !== currentUser?.username).length > 0 && (
                <Group title="Other Users">
                    {users.filter(u => u.username !== currentUser?.username).map((u, i, arr) => (
                        <Row key={u.username} onClick={() => handleSelectUser(u)} last={i === arr.length - 1}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/5">
                                    <Image src={u.avatar || "/pfp.png"} alt="Profile" width={40} height={40} className="object-cover" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.role === 'admin' ? 'Admin' : 'Standard'}</div>
                                </div>
                            </div>
                            <IoChevronForward className="text-gray-400" />
                        </Row>
                    ))}
                </Group>
            )}

            {currentUser?.role === 'admin' && (
                <button
                    onClick={handleStartCreate}
                    className="flex items-center gap-2 px-4 py-3 mt-4 bg-white dark:bg-[#2c2c2e] text-blue-500 rounded-xl transition-colors w-full shadow-sm"
                >
                    <IoAdd size={20} />
                    <span className="text-sm font-medium">Add Account...</span>
                </button>
            )}
        </div>
    );

    const renderDetail = () => {
        if (!selectedUser && !isCreating) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 bg-white dark:bg-[#1e1e1e]">
                    <IoPerson size={48} className="mb-2 opacity-20" />
                </div>
            );
        }

        const isEditingSelf = selectedUser?.username === currentUser?.username;
        const isAdmin = currentUser?.role === 'admin';
        const canEdit = isAdmin || isEditingSelf;

        return (
            <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {ismobile && (
                        <button onClick={() => setView('list')} className="mb-4 flex items-center text-blue-500">
                            <IoArrowBack className="mr-1" /> Users
                        </button>
                    )}

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f5f5f7] dark:border-[#2c2c2e] shadow-xl mb-4 relative group">
                            <Image src={isCreating ? '/pfp.png' : selectedUser?.avatar || '/pfp.png'} alt="Start" width={96} height={96} className="object-cover" />
                            {canEdit && !isCreating && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-white text-xs font-bold">EDIT</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold">{isCreating ? 'New User' : selectedUser?.name}</h2>
                        {!isCreating && <div className="text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs mt-1">@{selectedUser?.username}</div>}
                    </div>

                    <form onSubmit={handleSave} className="max-w-md mx-auto">
                        <Group>
                            <div className="p-4 space-y-4">
                                {isCreating && (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md px-3 py-1.5 text-sm"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe" required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Account Name</label>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md px-3 py-1.5 text-sm"
                                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                                placeholder="john" required pattern="[a-z0-9_]+"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Used for home folder name. Lowercase.</p>
                                        </div>
                                    </>
                                )}
                                {!isCreating && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Name</label>
                                        <input
                                            disabled={!canEdit}
                                            className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm focus:border-blue-500 outline-none"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </Group>

                        <Group>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{isCreating ? 'Password' : 'Change Password'}</label>
                                    <input
                                        type="password"
                                        disabled={!canEdit}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md px-3 py-1.5 text-sm"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={!isCreating ? "New password" : "Required"}
                                        required={isCreating}
                                    />
                                </div>
                                {isCreating && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-md px-3 py-1.5 text-sm"
                                            value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            placeholder="Confirm password"
                                            required
                                        />
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm">Allow user to administer this computer</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.role === 'admin'}
                                            onChange={e => setFormData({ ...formData, role: e.target.checked ? 'admin' : 'user' })}
                                            disabled={selectedUser?.username === currentUser?.username}
                                            className="toggle"
                                        />
                                    </div>
                                )}
                                {selectedUser?.username === currentUser?.username && isAdmin && !isCreating && (
                                    <div className="text-xs text-gray-400 mt-1">You cannot remove admin privileges from yourself</div>
                                )}
                            </div>
                        </Group>

                        {(error || successMsg) && (
                            <div className={`text-center text-xs font-medium mb-4 ${error ? 'text-red-500' : 'text-green-500'}`}>
                                {error || successMsg}
                            </div>
                        )}

                        {canEdit && (
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors shadow-sm mb-6">
                                {isCreating ? 'Create User' : 'Save Changes'}
                            </button>
                        )}

                        {isAdmin && !isEditingSelf && !isCreating && (
                            <button type="button" onClick={handleDelete} className="w-full text-red-500 text-sm hover:underline">
                                Delete User...
                            </button>
                        )}
                    </form>
                </div>
            </div>
        )
    };

    if (ismobile) {
        return view === 'list' ? renderList() : renderDetail();
    }

    return (
        <div className="flex h-full">
            <div className="w-[300px] border-r border-black/5 dark:border-white/5 h-full overflow-y-auto">
                {renderList()}
            </div>
            <div className="flex-1 h-full overflow-hidden">
                {selectedUser || isCreating ? renderDetail() : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 items-center content-center mt-16">

                        <div className="w-16 h-16 mt-auto bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <IoPerson size={32} className="opacity-20" />
                        </div>
                        <p className="text-sm mb-auto">Select a user to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}

