import React from 'react';

const AppStore = () => {
    return (
        <div className="flex flex-col h-full w-full bg-neutral-100 dark:bg-neutral-900 overflow-y-auto">
            <div className="p-6 pb-2">
                <h1 className="text-3xl font-bold dark:text-white mb-1">Today</h1>
                <p className="text-neutral-500 font-medium date-text">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <div className="w-10 h-10 rounded-full bg-neutral-200 absolute top-6 right-6 overflow-hidden">
                </div>
            </div>

            <div className="p-4 space-y-6">
                <div className="w-full h-96 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden relative cursor-pointer group">
                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Featured App" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-blue-400 font-bold text-xs uppercase mb-1 block">Featured</span>
                        <h2 className="text-white text-2xl font-bold">Painting with CSS</h2>
                        <p className="text-white/80">Unleash your creativity.</p>
                    </div>
                </div>

                <div className="w-full h-96 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden relative cursor-pointer group">
                    <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Game of the Day" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-blue-400 font-bold text-xs uppercase mb-1 block">Game of the Day</span>
                        <h2 className="text-white text-2xl font-bold">Retro Arcade</h2>
                        <p className="text-white/80">Pixel art perfection.</p>
                    </div>
                </div>
            </div>
            <div className="p-4 text-center text-neutral-400 text-sm">
                Demo Mode
            </div>
        </div>
    );
};

export default AppStore;
