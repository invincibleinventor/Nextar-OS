'use client';

import React, { Component, ReactNode } from 'react';
import { glassCard } from './hooks/useClayStyles';

interface Props {
    children: ReactNode
    appId: string
    windowId: string
    onCrash: (error: string) => void
}

interface State {
    hasError: boolean
    error: Error | null
}

class AppErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        this.props.onCrash(error.message || 'Unknown error');
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null });
    };

    private get isClay(): boolean {
        if (typeof document === 'undefined') return false;
        return document.documentElement.classList.contains('clay');
    }

    render() {
        if (this.state.hasError) {
            const clay = this.isClay;
            return (
                <div className={`flex flex-col items-center justify-center h-full p-8 ${clay ? 'bg-[--bg-base]' : 'bg-surface'}`}>
                    <div
                        className={`w-20 h-20 mb-6 flex items-center justify-center ${clay ? 'rounded-[16px]' : ''}`}
                        style={clay ? {
                            background: 'var(--bg-glass-hover)',
                            boxShadow: 'var(--shadow-sm)',
                        } : undefined}
                    >
                        <span className="text-4xl">💥</span>
                    </div>

                    <h2 className="text-xl font-semibold text-[--text-color] mb-2">
                        Application Crashed
                    </h2>

                    <p className="text-[13px] text-[--text-muted] text-center mb-4 max-w-xs">
                        The application encountered an unexpected error and had to stop.
                    </p>

                    <div
                        className={`w-full max-w-sm p-3 mb-6 overflow-auto max-h-32 ${clay ? 'rounded-[12px]' : 'bg-overlay'}`}
                        style={clay ? glassCard : undefined}
                    >
                        <code className="text-xs text-pastel-red break-all">
                            {this.state.error?.message || 'Unknown error'}
                        </code>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRestart}
                            className={`px-5 py-2 text-[13px] font-medium text-white transition-all ${clay
                                ? 'rounded-[12px] hover:opacity-90 active:scale-[0.97]'
                                : 'bg-accent text-[--bg-base] hover:opacity-80'
                            }`}
                            style={clay ? { background: 'var(--accent-gradient)', boxShadow: 'var(--accent-shadow)' } : undefined}
                        >
                            Try Again
                        </button>
                    </div>

                    <p className="text-xs text-[--text-muted] mt-6">
                        Process ID: {this.props.windowId}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
