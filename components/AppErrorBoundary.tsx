'use client';

import React, { Component, ReactNode } from 'react';

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

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-100 dark:bg-neutral-900 p-8">
                    <div className="w-20 h-20 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-4xl">💥</span>
                    </div>

                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        Application Crashed
                    </h2>

                    <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4 max-w-xs">
                        The application encountered an unexpected error and had to stop.
                    </p>

                    <div className="w-full max-w-sm p-3 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg mb-6 overflow-auto max-h-32">
                        <code className="text-xs text-red-500 dark:text-red-400 break-all">
                            {this.state.error?.message || 'Unknown error'}
                        </code>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={this.handleRestart}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-6">
                        Process ID: {this.props.windowId}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
