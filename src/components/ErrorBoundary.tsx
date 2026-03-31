import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-tunehub-bg p-4 text-white">
          <div className="max-w-md w-full glass p-8 rounded-3xl flex flex-col items-center gap-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-white/60 text-sm mb-4">
                The application encountered an unexpected error. We've logged the details.
              </p>
              {this.state.error && (
                <div className="bg-black/20 p-3 rounded-lg text-left mb-6 overflow-hidden">
                  <p className="text-[10px] font-mono text-red-400 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white text-black rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
