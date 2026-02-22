export interface NotificationAction {
    label: string;
    actionId: string;
}

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
    actions?: NotificationAction[];
}

export const initialnotifications: Notification[] = [

    {
        id: 'n4',
        appname: 'NextarOS',
        title: 'Welcome to NextarOS!',
        description: 'Your cloud desktop is ready. Explore your apps and make it yours!',
        time: '2h ago',
        icon: '/pfp.png',
        appid: 'projectdashboard'
    }
];
