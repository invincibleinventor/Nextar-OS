
import { useEffect } from 'react';
import { useWindows } from '../WindowContext';

export const useMenuAction = (appId: string, actions: Record<string, () => void>, windowId?: string) => {
    const { activewindow } = useWindows();

    useEffect(() => {
        const handleAction = (e: CustomEvent) => {
            const { appId: targetAppId, actionId } = e.detail;

            if (targetAppId !== appId) return;

            if (windowId && activewindow !== windowId) {
                return;
            }

            if (actions[actionId]) {
                actions[actionId]();
            }
        };

        window.addEventListener('menu-action' as any, handleAction);
        return () => window.removeEventListener('menu-action' as any, handleAction);
    }, [appId, actions, windowId, activewindow]);
};
