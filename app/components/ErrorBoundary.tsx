import { Component, type ReactNode } from 'react';
import { FatalErrorScreen } from './FatalErrorScreen';
import { reportFatalError, type FatalErrorInfo } from '../lib/crashReporter';

interface State {
  error: FatalErrorInfo | null;
}

/** Catches render-time crashes anywhere under the root and shows the error. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(e: unknown): State {
    const err = e as { message?: unknown; stack?: unknown };
    const info: FatalErrorInfo = {
      message: err?.message ? String(err.message) : String(e),
      stack: err?.stack ? String(err.stack) : undefined,
    };
    reportFatalError(info.message, info.stack);
    return { error: info };
  }

  render() {
    if (this.state.error) {
      return <FatalErrorScreen error={this.state.error} />;
    }
    return this.props.children;
  }
}
