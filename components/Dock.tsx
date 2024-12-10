'use client';

import { useWindows } from './WindowContext';
import { motion } from 'framer-motion';
import { apps } from './app';
import { useState } from 'react';

const Dock = () => {
  const { windows, addWindow, toggleWindows, setActiveWindow } = useWindows();
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const handleDockClick = (appId: string, appName: string, appTitle?: string) => {
    const appWindows = windows.filter((win: any) => win.appName === appName);

    if (appWindows.length > 0) {
      toggleWindows(appName);
    } else {
      const newWindow = {
        id: `${appName}-${Date.now()}`,
        appName,
        title: appTitle || appName,
        component: () => <div className="p-4">This is {appName}</div>,
        props: {},
        isMinimized: false,
        position: { top: 100, left: 100 },
        size: { width: 400, height: 300 },
        isMaximized: false,
      };
      addWindow(newWindow);
      setActiveWindow(newWindow.id);
    }
  };

  return (
    <motion.div className="fixed bottom-2 mx-auto left-0 right-0 w-max z-50 py-[2px] dark:bg-black dark:bg-opacity-30 bg-white bg-opacity-30 px-[2px] backdrop-blur-lg flex flex-shrink-0 rounded-2xl border-[0.1px] dark:border-gray-700 border-gray-500 shadow-2xl">
      <div className="flex flex-shrink-0 items-center space-x-1 p-1">
        {apps.map((app, index) => {
          const isHovered = hoveredApp === app.appName;
          const leftNeighbor1 = index > 0 ? apps[index - 1].appName : null;
          const leftNeighbor2 = index > 1 ? apps[index + 1]?.appName : null;
          const rightNeighbor1 = index < apps.length - 1 ? apps[index + 1].appName : null;
          const rightNeighbor2 = index < apps.length - 2 ? apps[index + 2]?.appName : null;

          let scale = 1;
          if (isHovered) {
            scale = 1.4;
          } else if ([leftNeighbor1, rightNeighbor1].includes(hoveredApp)) {
            scale = 1.2;
          } else if ([leftNeighbor2, rightNeighbor2].includes(hoveredApp)) {
            scale = 1.1;
          }

             const hasAnyWindowOpened = windows.some((win: any) => win.appName === app.appName);

          return (
            <motion.div
              key={app.appName}
              className={`relative flex flex-col items-center cursor-pointer ${
                index >= 7 ? 'hidden sm:block' : ''
              }`}
              onClick={() => handleDockClick(app.id, app.appName)}
              onMouseEnter={() => setHoveredApp(app.appName)}
              onMouseLeave={() => setHoveredApp(null)}
              whileHover={{ scale }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <img src={app.icon} className="w-12 h-12 rounded-xl transition-all duration-200" />
              {hasAnyWindowOpened && (
                <div className="absolute bottom-0 w-1 h-1 bg-white rounded-md -mb-[2px] transition-all duration-200"></div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Dock;
