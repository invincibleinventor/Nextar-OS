export interface App {
  id: string;
  appname: string;
  icon: string;
  maximizeable: boolean;
  componentname: string;
  additionaldata: any;
  multiwindow: boolean;
  titlebarblurred: boolean;
  pinned: boolean;
  defaultsize?: { width: number; height: number };
}

export const apps: App[] = [
  {
    id: 'finder',
    appname: 'Finder',
    icon: '/finder.png',
    maximizeable: true,
    componentname: 'apps/Finder',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: true,
    pinned: true,
    defaultsize: { width: 1000, height: 600 }
  },
  {
    id: 'settings',
    appname: 'Settings',
    icon: '/settings.png',
    maximizeable: true,
    componentname: 'apps/Settings',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: true,
    pinned: true,
  },
  {
    id: 'python',
    appname: 'Python IDE',
    icon: '/code.png',
    maximizeable: true,
    componentname: 'apps/Python',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: false,
    pinned: true,
  },
  {
    id: 'mail',
    appname: 'Mail',
    icon: '/mail.png',
    maximizeable: true,
    componentname: 'Mail',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: false,
    pinned: true,
  },
  {
    id: 'calendar',
    appname: 'Calendar',
    icon: '/calendar.png',
    maximizeable: true,
    componentname: 'apps/Calendar',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: false,
    pinned: true,
  },
  {
    id: 'calculator',
    appname: 'Calculator',
    icon: '/calculator.png',
    maximizeable: true,
    componentname: 'Calculator',
    additionaldata: {},
    multiwindow: false,
    titlebarblurred: false,
    pinned: true,
    defaultsize: { width: 300, height: 500 }
  },
  {
    id: 'appstore',
    appname: 'App Store',
    icon: '/appstore.png',
    maximizeable: false,
    componentname: 'AppStore',
    additionaldata: {},
    multiwindow: false,
    titlebarblurred: false,
    pinned: true,
  },
  {
    id: 'safari',
    appname: 'Safari',
    icon: '/safari.png',
    maximizeable: true,
    componentname: 'apps/Safari',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: true,
    pinned: true,
  },
  {
    id: 'terminal',
    appname: 'Terminal',
    icon: '/terminal.webp',
    maximizeable: true,
    componentname: 'apps/Terminal',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: true,
    pinned: true,
  },
  {
    id: 'photos',
    appname: 'Photos',
    icon: '/photos.webp',
    maximizeable: true,
    componentname: 'apps/Photos',
    additionaldata: {},
    multiwindow: true,
    titlebarblurred: true,
    pinned: true,
  },
  {
    id: 'welcome',
    appname: 'Welcome',
    icon: '/info.png',
    maximizeable: false,
    componentname: 'Welcome',
    additionaldata: {},
    multiwindow: false,
    titlebarblurred: false,
    pinned: false,
  }
];
