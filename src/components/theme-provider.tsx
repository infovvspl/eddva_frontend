import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { useLocation } from "react-router-dom";

/**
 * Dark mode is only supported in the super admin portals; every other page
 * hard-codes light colours. Outside them the theme is forced to light.
 */
const DARK_ALLOWED = /^\/(school\/)?super-admin(\/|$)/;

const ScopeContext = React.createContext<(allowDark: boolean) => void>(() => {});

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Start from the real URL so a reload on a super admin page doesn't flash light first.
  const [allowDark, setAllowDark] = React.useState(() =>
    typeof window !== "undefined" && DARK_ALLOWED.test(window.location.pathname),
  );

  return (
    <ScopeContext.Provider value={setAllowDark}>
      <NextThemesProvider {...props} forcedTheme={allowDark ? undefined : "light"}>
        {children}
      </NextThemesProvider>
    </ScopeContext.Provider>
  );
}

/** Mount once inside the router: tells the ThemeProvider whether the current route may use dark mode. */
export function ThemeScope() {
  const { pathname } = useLocation();
  const setAllowDark = React.useContext(ScopeContext);

  React.useEffect(() => {
    setAllowDark(DARK_ALLOWED.test(pathname));
  }, [pathname, setAllowDark]);

  return null;
}
