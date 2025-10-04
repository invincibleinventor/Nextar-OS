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
      const updatedWindows = prevWindows.filter((window) => window.id !== id);
      // If no windows left, clear activeWindow
      if (updatedWindows.length === 0) {
        setActiveWindow(null);
      } else {
        // Set activeWindow to the last opened (topmost) window
        setActiveWindow(updatedWindows[updatedWindows.length - 1].id);
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
