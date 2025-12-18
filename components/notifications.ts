export interface Notification {
    id: string;
    appname: string;
    title: string;
    description: string;
    time: string;
    icon: string;
    appid: string;
    viewed?: boolean;
    type?: string;
}

export const initialnotifications: Notification[] = [
    {
        id: 'n1',
        appname: 'Mail',
        title: 'New Project Proposal',
        description: 'Hey, check out the new design requirements...',
        time: '2m ago',
        icon: '/mail.png',
        appid: 'mail'
    },
    {
        id: 'n2',
        appname: 'Calendar',
        title: 'Team Meeting',
        description: 'Daily standup in 10 minutes',
        time: '12m ago',
        icon: '/calendar.png',
        appid: 'calendar'
    },
    {
        id: 'n3',
        appname: 'Messages',
        title: 'Sarah',
        description: 'Please push the repository by 1 am night today',
        time: '1h ago',
        icon: '/messages.png',
        appid: 'messages'
    },
    {
        id: 'n4',
        appname: 'Settings',
        title: 'System Update',
        description: 'MacOS-Next is ready to install',
        time: '2h ago',
        icon: '/settings.png',
        appid: 'settings'
    }
];
