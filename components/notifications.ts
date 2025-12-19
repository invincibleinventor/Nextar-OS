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
        title: 'Welcome to My Portfolio!',
        description: 'Hi! This is Bala! Welcome to my convergent MacOS themed portfolio! Please feel free to explore it!',
        time: '2h ago',
        icon: '/welcome.png',
        appid: 'welcome'
    }
];
