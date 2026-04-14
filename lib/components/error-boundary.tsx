'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-8 text-center shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--color-error)] font-[family-name:var(--font-heading)]">Something went wrong</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">An unexpected error occurred. Please try again.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
