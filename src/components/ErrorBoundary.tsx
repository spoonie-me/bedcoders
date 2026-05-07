import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-2xl)',
          textAlign: 'center',
        }}>
          <h1 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem' }}>
            Something went wrong
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-xl)',
            maxWidth: 480,
            lineHeight: 1.6,
          }}>
            An unexpected error occurred. This has been logged. Please try again.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 32px',
              background: 'var(--signal)',
              color: 'var(--bg-void)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9375rem',
            }}
          >
            Back to home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
