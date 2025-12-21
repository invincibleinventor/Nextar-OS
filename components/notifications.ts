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
        id: 'n4',
        appname: 'Welcome',
        title: 'Welcome to NextarOS!',
        description: 'Hi! This is Bala! Welcome to NextarOS - my convergent web OS simulation! Please feel free to explore it!',
        time: '2h ago',
        icon: '/pfp.png',
        appid: 'welcome'
    }
];
