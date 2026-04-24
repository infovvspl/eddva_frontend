import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

const CHUNK_ERR_RELOAD_KEY = "chunk_err_reloaded";

function isChunkLoadError(err: Error): boolean {
  const msg = err.message ?? "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    (err.name === "ChunkLoadError")
  );
}

/**
 * Catches render-time errors thrown by any page component mounted inside
 * DashboardLayout's <Outlet />.  Prevents the entire shell from blanking out
 * and gives the user a clear "try again" option.
 *
 * Chunk-load errors (stale cache after a new deploy) are handled automatically:
 * the page reloads once so the browser fetches the new index.html and correct
 * asset hashes.  A sessionStorage flag prevents infinite reload loops.
 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    // Auto-reload once for chunk load errors caused by a new deployment.
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_ERR_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_ERR_RELOAD_KEY, "1");
        window.location.reload();
        return { error: null }; // never reaches render before reload
      }
    }
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(_: Props, prev: State) {
    // Clear the reload guard once the user successfully navigates away.
    if (prev.error && !this.state.error) {
      sessionStorage.removeItem(CHUNK_ERR_RELOAD_KEY);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      const isChunk = isChunkLoadError(this.state.error);
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {isChunk
              ? "A new version of the app was deployed. Please reload to get the latest version."
              : "This page ran into an unexpected error. Your data is safe — try refreshing."}
          </p>
          <div className="flex gap-3">
            {!isChunk && (
              <button
                onClick={this.reset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            )}
            <button
              onClick={() => {
                sessionStorage.removeItem(CHUNK_ERR_RELOAD_KEY);
                window.location.reload();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
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
