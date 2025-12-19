
import { useEffect } from 'react';
import { useWindows } from '../WindowContext';

/*
 * @param appId
 * @param actions
 * @param windowId
*/
export const useMenuAction = (appId: string, actions: Record<string, () => void>, windowId?: string) => {
    const { activewindow } = useWindows();

    useEffect(() => {
        const handleAction = (e: CustomEvent) => {
            const { appId: targetAppId, actionId } = e.detail;
            console.log('[Debug] useMenuAction received:', e.detail, 'Current WindowId:', windowId, 'Active:', activewindow);

            if (targetAppId !== appId) return;

            if (windowId && activewindow !== windowId) {
                console.log('[Debug] Ignoring due to inactive window');
                return;
            }

            if (actions[actionId]) {
                console.log('[Debug] Executing handler for:', actionId);
                actions[actionId]();
            } else {
                console.log('[Debug] No handler found for:', actionId);
            }
        };

        window.addEventListener('menu-action' as any, handleAction);
        return () => window.removeEventListener('menu-action' as any, handleAction);
    }, [appId, actions, windowId, activewindow]);
};
