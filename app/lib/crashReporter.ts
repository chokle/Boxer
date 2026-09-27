// Turns silent startup crashes into a readable on-screen error.
// Only active in production builds (__DEV__ keeps the redbox).

declare const __DEV__: boolean;

export interface FatalErrorInfo {
  message: string;
  stack?: string;
}

type Listener = (e: FatalErrorInfo) => void;

let current: FatalErrorInfo | null = null;
const listeners = new Set<Listener>();

export function getFatalError(): FatalErrorInfo | null {
  return current;
}

export function reportFatalError(message: string, stack?: string) {
  current = { message, stack };
  listeners.forEach((l) => {
    try {
      l(current as FatalErrorInfo);
    } catch {
      // Never let the reporter itself crash the app.
    }
  });
}

export function onFatalError(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function installGlobalHandler() {
  if (__DEV__) return;
  try {
    const g = global as any;
    if (g.ErrorUtils?.setGlobalHandler) {
      g.ErrorUtils.setGlobalHandler((error: any) => {
        const message = error?.message ? String(error.message) : String(error);
        reportFatalError(message, error?.stack ? String(error.stack) : undefined);
        // Intentionally not rethrowing: the UI shows the error instead of dying.
      });
    }
    // Best-effort: surface unhandled promise rejections too.
    const prevHandler = g.onunhandledrejection;
    g.onunhandledrejection = (event: any) => {
      const reason = event?.reason;
      const message = reason?.message ? String(reason.message) : String(reason);
      reportFatalError(
        'Unhandled promise rejection: ' + message,
        reason?.stack ? String(reason.stack) : undefined,
      );
      if (typeof prevHandler === 'function') {
        try {
          prevHandler(event);
        } catch {
          // ignore
        }
      }
    };
  } catch {
    // If the reporter can't install, stay out of the way.
  }
}
