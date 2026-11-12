import { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth";
import { PermissionsProvider } from "./context/PermissionsContext";
import { TenantProvider } from "./lib/tenantContext";
import { StyleProvider } from "./components/StyleProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { MediaOSProvider } from "./context/MediaOSContext";
import { NavigationProvider } from "./context/NavigationContext";
import { FeatureControlProvider } from "./context/FeatureControlContext";
import { ReadingPreferencesProvider } from "./context/ReadingPreferencesContext";
import SplashScreen from "./components/ui/SplashScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/layout/AppShell";
import CommandPalette from "./components/ui/CommandPalette";
import { assertNavigationOSHealth } from "./services/navigationOS";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    assertNavigationOSHealth();
    const handleToggle = () => setIsCommandPaletteOpen((prev) => !prev);
    window.addEventListener("toggle-command-palette", handleToggle);
    return () => window.removeEventListener("toggle-command-palette", handleToggle);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PermissionsProvider>
          <TenantProvider>
            <StyleProvider>
              <LanguageProvider>
                <MediaOSProvider>
                  <FeatureControlProvider>
                    <ReadingPreferencesProvider>
                      <SplashScreen />
                      <Router>
                        <NavigationProvider>
                          <AppShell>
                            <CommandPalette
                              isOpen={isCommandPaletteOpen}
                              onClose={() => setIsCommandPaletteOpen(false)}
                            />
                            <AppRoutes />
                            <Toaster position="top-right" richColors closeButton duration={4000} />
                          </AppShell>
                        </NavigationProvider>
                      </Router>
                    </ReadingPreferencesProvider>
                  </FeatureControlProvider>
                </MediaOSProvider>
              </LanguageProvider>
            </StyleProvider>
          </TenantProvider>
        </PermissionsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
