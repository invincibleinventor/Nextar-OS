// app.ts

  export const apps = [
    {
      id: 'launchpad',
      appName: 'LaunchPad',
      
      icon: 'launchpad.png', // Replace with actual icon path
      maximizeable: false,
      componentName: 'AppStore',
      additionalData: {},
      multiwindow: false,
      titlebarblurred: false,
      pinned: true,
    },
    {
      id: 'finder',
      appName: 'Finder',
      icon: '/finder.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'Finder',
      additionalData: {},
      multiwindow: true,
      titlebarblurred: true,
      pinned: true,
    },
    {
      id: 'settings',
      appName: 'Settings',
      icon: '/settings.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'Settings',
      additionalData: {},
      multiwindow: true,
      titlebarblurred: true,
      pinned: true,
    },
    {
      id: 'xcode',
      appName: 'XCode',
      icon: '/code.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'XCode',
      additionalData: {},
      multiwindow: true,
      titlebarblurred: true,
      pinned: true,
    },
    {
      id: 'mail',
      appName: 'Mail',
      icon: '/mail.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'Mail',
      additionalData: {},
      multiwindow: true,
      titlebarblurred: true,
      pinned: true,
    },
    {
      id: 'calendar',
      appName: 'Calendar',
      icon: 'calendar.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'Calendar',
      additionalData: {},
      multiwindow: true,
      titlebarblurred: false,
      pinned: true,
    },
    {
      id: 'calculator',
      appName: 'Calculator',
      icon: 'calculator.png', // Replace with actual icon path
      maximizeable: true,
      componentName: 'Calculator',
      additionalData: {},
      multiwindow: false,
      titlebarblurred: false,
      pinned: true,
    },
    {
      id: 'appstore',
      appName: 'App Store',
      
      icon: 'appstore.png', // Replace with actual icon path
      maximizeable: false,
      componentName: 'AppStore',
      additionalData: {},
      multiwindow: false,
      titlebarblurred: false,
      pinned: true,
    },
    // Add more app data as needed
  ];