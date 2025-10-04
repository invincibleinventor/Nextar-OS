'use client';
import React, { createContext, useState, useContext } from 'react';

const WindowContext = createContext<any>(null);

export const useWindows = () => useContext(WindowContext);

export const WindowProvider = ({ children }: any) => {
  const [windows, setWindows] = useState<any[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const addWindow = (newWindow: any) => {
    setWindows((prevWindows) => {
      return [...prevWindows, newWindow];
    });
  };
  const removeWindow = (id: string) => {
    setWindows((prevWindows) => {
      const idx = prevWindows.findIndex((w) => w.id === id);
      const updatedWindows = prevWindows.filter((window) => window.id !== id);
      if (updatedWindows.length === 0) {
        setActiveWindow(null);
      } else {
        // If the closed window was active, set active to the previous window in stacking order
        if (activeWindow === id) {
          // Try to focus the window just below the closed one
          const newIdx = Math.max(0, idx - 1);
          setActiveWindow(updatedWindows[newIdx].id);
        }
      }
      return updatedWindows;
    });
  };
  
  
  // If the app's window is not active, bring it to front. If already active, toggle minimize.
  const focusOrToggleWindow = (appName: string) => {
    setWindows((prevWindows) => {
      const appWindows = prevWindows.filter((win) => win.appName === appName);
      if (appWindows.length === 0) return prevWindows;
      const topmost = appWindows.find((win) => win.id === activeWindow);
      if (topmost) {
        // If already active, minimize
        return prevWindows.map((win) =>
          win.appName === appName ? { ...win, isMinimized: !win.isMinimized } : win
        );
      } else {
        // Bring the first found window to front (setActiveWindow)
        setActiveWindow(appWindows[0].id);
        return prevWindows.map((win) =>
          win.id === appWindows[0].id ? { ...win, isMinimized: false } : win
        );
      }
    });
  };
  const updateWindow = (id: string, updatedProps: any) => {
    setWindows(
      windows.map((window) =>
        window.id === id ? { ...window, ...updatedProps } : window
      )
    );
    if (updatedProps.isMinimized === false) {
      setActiveWindow(id);
    }
  };

  return (
    <WindowContext.Provider
      value={{
        windows,
        addWindow,
        removeWindow,
        updateWindow,
        activeWindow,
        setActiveWindow,
        focusOrToggleWindow,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
};
