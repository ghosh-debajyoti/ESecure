import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'rgba(255, 59, 48, 0.1)',
          border: '1px solid rgba(255, 59, 48, 0.3)',
          borderRadius: '8px',
          padding: '32px',
          color: 'var(--white)',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h3 style={{ color: 'var(--danger)', margin: '0 0 12px 0' }}>Visualization Error</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            {this.props.fallbackMessage || 'An unexpected error occurred while rendering this component.'}
          </p>
          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '4px', textAlign: 'left', fontSize: '11px', overflowX: 'auto', color: 'var(--danger)' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '16px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
