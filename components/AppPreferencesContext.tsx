'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AppPreferences {
    [key: string]: any;
}

interface PreferencesState {
    [appId: string]: AppPreferences;
}

interface AppPreferencesContextType {
    getPreference: (appId: string, key: string, defaultValue?: any) => any;
    setPreference: (appId: string, key: string, value: any) => void;
    getAllPreferences: (appId: string) => AppPreferences;
    resetPreferences: (appId: string) => void;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | null>(null);

const STORAGE_KEY = 'app-preferences';

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
    const { user, isGuest } = useAuth();
    const [preferences, setPreferences] = useState<PreferencesState>({});

    useEffect(() => {
        if (isGuest) {
            setPreferences({});
            return;
        }

        const stored = localStorage.getItem(`${STORAGE_KEY}-${user?.username || 'default'}`);
        if (stored) {
            try {
                setPreferences(JSON.parse(stored));
            } catch {
                setPreferences({});
            }
        }
    }, [user, isGuest]);

    const persist = useCallback((newPrefs: PreferencesState) => {
        if (isGuest) return;
        localStorage.setItem(`${STORAGE_KEY}-${user?.username || 'default'}`, JSON.stringify(newPrefs));
    }, [user, isGuest]);

    const getPreference = useCallback((appId: string, key: string, defaultValue?: any) => {
        return preferences[appId]?.[key] ?? defaultValue;
    }, [preferences]);

    const setPreference = useCallback((appId: string, key: string, value: any) => {
        setPreferences(prev => {
            const newPrefs = {
                ...prev,
                [appId]: {
                    ...prev[appId],
                    [key]: value
                }
            };
            persist(newPrefs);
            return newPrefs;
        });
    }, [persist]);

    const getAllPreferences = useCallback((appId: string) => {
        return preferences[appId] || {};
    }, [preferences]);

    const resetPreferences = useCallback((appId: string) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            delete newPrefs[appId];
            persist(newPrefs);
            return newPrefs;
        });
    }, [persist]);

    return (
        <AppPreferencesContext.Provider value={{ getPreference, setPreference, getAllPreferences, resetPreferences }}>
            {children}
        </AppPreferencesContext.Provider>
    );
}

export function useAppPreferences() {
    const context = useContext(AppPreferencesContext);
    if (!context) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
    return context;
}
