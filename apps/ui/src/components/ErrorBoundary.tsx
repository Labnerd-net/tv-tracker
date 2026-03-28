import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg)',
            gap: '24px',
            padding: '32px',
          }}
        >
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '2rem',
              color: 'var(--cream-muted)',
              fontWeight: 300,
            }}
          >
            Something went wrong
          </div>
          <div
            style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              color: 'var(--cream-muted)',
              textTransform: 'uppercase',
            }}
          >
            An unexpected error occurred
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              all: 'unset',
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: '1px solid var(--border-strong)',
              color: 'var(--cream-dim)',
              padding: '8px 20px',
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
