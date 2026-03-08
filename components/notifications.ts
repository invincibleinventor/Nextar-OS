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
        title: 'Welcome to My Portfolio!',
        description: 'NextarOS is a beautifully designed portfolio website that also doubles as a full fledged operating system simulation on the web. Enjoy exploring!',
        time: '2h ago',
        icon: '/pfp.png',
        appid: 'portfolio'
    }
];
