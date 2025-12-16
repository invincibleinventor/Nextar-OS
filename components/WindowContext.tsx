'use client';
import React, { createContext, useState, useContext } from 'react';

const WindowContext = createContext<any>(null);

export const useWindows = () => useContext(WindowContext);

export const WindowProvider = ({ children }: any) => {
  const [windows, setwindows] = useState<any[]>([]);
  const [activewindow, setactivewindow] = useState<string | null>(null);

  const addwindow = (newwindow: any) => {
    setactivewindow(newwindow.id);
    setwindows((prevwindows) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      const filtered = prevwindows.filter(w => w.id !== newwindow.id);

      if (isMobile) {
        const minimizedprev = filtered.map(w => ({ ...w, isminimized: true }));
        return [...minimizedprev, { ...newwindow, lastInteraction: Date.now() }];
      }
      return [...filtered, { ...newwindow, lastInteraction: Date.now() }];
    });
  };

  const removewindow = (id: string) => {
    setwindows((prevwindows) => {
      const idx = prevwindows.findIndex((w) => w.id === id);
      const updatedwindows = prevwindows.filter((window) => window.id !== id);

      if (updatedwindows.length === 0) {
        setactivewindow(null);
      } else {
        if (activewindow === id) {

          const newidx = Math.max(0, idx - 1);
          if (updatedwindows[newidx]) {
            setactivewindow(updatedwindows[newidx].id);

          } else {
            setactivewindow(null);
          }
        }
      }
      return updatedwindows;
    });
  };

  const focusortogglewindow = (appname: string) => {
    setwindows((prevwindows) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const appwindows = prevwindows.filter((win) => win.appname === appname);

      if (appwindows.length === 0) return prevwindows;

      const topmost = appwindows.find((win) => win.id === activewindow);

      if (topmost) {
        return prevwindows.map((win) =>
          win.appname === appname ? { ...win, isminimized: !win.isminimized, lastInteraction: Date.now() } : win
        );
      } else {
        const lastWindow = appwindows[appwindows.length - 1];
        setactivewindow(lastWindow.id);

        return prevwindows.map((win) => {
          if (win.appname === appname) {
            return { ...win, isminimized: false, lastInteraction: Date.now() };
          }
          if (isMobile) {
            return { ...win, isminimized: true };
          }
          return win;
        });
      }
    });
  };

  const updatewindow = (id: string, updatedprops: any) => {
    setwindows((prevWindows) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      return prevWindows.map((window) => {
        if (window.id === id) {
          return { ...window, ...updatedprops, lastInteraction: Date.now() };
        }


        if (isMobile && updatedprops.isminimized === false) {
          return { ...window, isminimized: true };
        }

        return window;
      });
    });

    if (updatedprops.isminimized === false) {
      setactivewindow(id);
    }
  };

  return (
    <WindowContext.Provider
      value={{
        windows,
        addwindow,
        removewindow,
        updatewindow,
        activewindow,
        setactivewindow,
        setwindows,
        focusortogglewindow,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
};
