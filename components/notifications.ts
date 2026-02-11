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
        appname: 'HackathOS',
        title: 'Welcome to HackathOS!',
        description: 'Your hackathon operating workspace is ready. Create a project, track tasks, and ship!',
        time: '2h ago',
        icon: '/code.png',
        appid: 'projectdashboard'
    }
];
