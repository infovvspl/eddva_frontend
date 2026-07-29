import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { PageErrorBoundary } from "./components/shared/PageErrorBoundary.tsx";
import "./index.css";

// Root-level safety net: previously only DashboardLayout's <Outlet /> was
// covered, so any uncaught error in a provider mounted above it (auth,
// notifications, theme, etc.) blanked the entire page with zero feedback —
// exactly what happened when an iOS Safari ReferenceError crashed before
// React ever painted anything. This can't prevent that class of bug, but it
// guarantees the next one shows a recoverable error screen instead of blank.
createRoot(document.getElementById("root")!).render(
  <PageErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <App />
    </ThemeProvider>
  </PageErrorBoundary>,
);

//eddva