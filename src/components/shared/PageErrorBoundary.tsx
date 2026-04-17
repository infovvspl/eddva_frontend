import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render-time errors thrown by any page component mounted inside
 * DashboardLayout's <Outlet />.  Prevents the entire shell from blanking out
 * and gives the user a clear "try again" option.
 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev; swap for a real error-reporting service in prod.
    console.error("[PageErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            This page ran into an unexpected error. Your data is safe — try refreshing.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Reload Page
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 max-w-xl overflow-auto">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
