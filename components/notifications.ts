export interface Notification {
    id: string;
    appName: string;
    title: string;
    description: string;
    time: string;
    icon: string;
    appId: string;
    viewed?: boolean;
}

export const initialnotifications: Notification[] = [
    {
        id: 'n1',
        appName: 'Mail',
        title: 'New Project Proposal',
        description: 'Hey, check out the new design requirements...',
        time: '2m ago',
        icon: '/mail.png',
        appId: 'mail'
    },
    {
        id: 'n2',
        appName: 'Calendar',
        title: 'Team Meeting',
        description: 'Daily standup in 10 minutes',
        time: '12m ago',
        icon: '/calendar.png',
        appId: 'calendar'
    },
    {
        id: 'n3',
        appName: 'Messages',
        title: 'Sarah',
        description: 'Please push the repository by 1 am night today',
        time: '1h ago',
        icon: '/messages.png',
        appId: 'messages'
    },
    {
        id: 'n4',
        appName: 'Settings',
        title: 'System Update',
        description: 'macOS Sonoma is ready to install',
        time: '2h ago',
        icon: '/settings.png',
        appId: 'settings'
    }
];
