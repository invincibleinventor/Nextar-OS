'use client';
import React, { createContext, useState, useContext } from 'react';

const WindowContext = createContext<any>(null);

export const usewindows = () => useContext(WindowContext);

export const WindowProvider = ({ children }: any) => {
  const [windows, setwindows] = useState<any[]>([]);
  const [activewindow, setactivewindow] = useState<string | null>(null);

  const addwindow = (newwindow: any) => {
    setactivewindow(newwindow.id);
    setwindows((prevwindows) => {
      const filtered = prevwindows.filter(w => w.id !== newwindow.id);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const minimizedprev = filtered.map(w => ({ ...w, isMinimized: true }));
        return [...minimizedprev, newwindow];
      }
      return [...filtered, newwindow];
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
          setactivewindow(updatedwindows[newidx].id);
        }
      }
      return updatedwindows;
    });
  };

  const focusortogglewindow = (appname: string) => {
    setwindows((prevwindows) => {
      const appwindows = prevwindows.filter((win) => win.appname === appname);
      if (appwindows.length === 0) return prevwindows;
      const topmost = appwindows.find((win) => win.id === activewindow);

      if (topmost) {
        return prevwindows.map((win) =>
          win.appname === appname ? { ...win, isMinimized: !win.isMinimized } : win
        );
      } else {
        const lastWindow = appwindows[appwindows.length - 1];
        setactivewindow(lastWindow.id);

        return prevwindows.map((win) =>
          win.appname === appname ? { ...win, isMinimized: false } : win
        );
      }
    });
  };
  const updatewindow = (id: string, updatedprops: any) => {
    setwindows(
      windows.map((window) =>
        window.id === id ? { ...window, ...updatedprops } : window
      )
    );
    if (updatedprops.isMinimized === false) {
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
