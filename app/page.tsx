/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React from 'react';
import { useWindows } from '@/components/WindowContext';
import Window from '@/components/Window';

const SampleApp = () => <div className="p-4">Hello, I am a sample app!<input className='w-full bg-white px-6 py-2 text-xs mx-6 '></input></div>;

const Page = () => {
  const { windows, addWindow } = useWindows();

  const handleAddWindow = () => {
    const newWindow = {
      id: Date.now(),
      appName: 'Finder',
      title: 'New File - Finder',
      icon: '/finder.png',
      component: SampleApp,
      props: {},
    };
    addWindow(newWindow);
  };

  return (
    <div>
      <button onClick={handleAddWindow} className="p-2 hidden  bg-blue-500 text-white">
        Add Window
      </button>
      {windows.map((window: any,index:any) => (
        <Window key={index} {...window} />
      ))}
    </div>
  );
};

export default Page;
