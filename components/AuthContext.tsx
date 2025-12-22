'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getUser, createUser, getUsers } from '../utils/db';
import { verifyPassword } from '../utils/crypto';
import { personal } from './data';
import { useDevice } from './DeviceContext';

interface AuthContextType {
    user: User | null;
    login: (password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    isAdmin: boolean;
    isGuest: boolean;
    guestLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setosstate } = useDevice();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const users = await getUsers();

                if (users.length === 0) {
                    const guestUser: User = {
                        username: 'guest',
                        passwordHash: '',
                        name: 'Guest User',
                        bio: 'Ephemeral Session',
                        role: 'user',
                        avatar: '/me.png'
                    };
                    setUser(guestUser);
                    setosstate('unlocked');
                }
            } catch {
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [setosstate]);

    const login = async (password: string): Promise<boolean> => {
        try {
            const users = await getUsers();
            if (users.length === 0) return false;

            for (const u of users) {
                const isMatch = await verifyPassword(password, u.passwordHash);
                if (isMatch) {
                    setUser(u);
                    setosstate('unlocked');
                    return true;
                }
            }
        } catch {
        }
        return false;
    };

    const guestLogin = () => {
        const guestUser: User = {
            username: 'guest',
            passwordHash: '',
            name: 'Guest User',
            bio: 'Ephemeral Session',
            role: 'user',
            avatar: '/me.png'
        };
        setUser(guestUser);
        setosstate('unlocked');
    }

    const logout = () => {
        setUser(null);
        setosstate('locked');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isLoading,
            isAdmin: user?.role === 'admin',
            isGuest: user?.username === 'guest',
            guestLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
