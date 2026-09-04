import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "landlord" | "company" | "visitor" | null;

const STORAGE_KEY = "habico_app_mode";

type Ctx = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  clearMode: () => void;
};

const AppModeContext = createContext<Ctx>({
  mode: null,
  setMode: () => {},
  clearMode: () => {},
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AppMode | null;
    if (stored === "landlord" || stored === "company" || stored === "visitor") {
      setModeState(stored);
    }
    setReady(true);
  }, []);

  function setMode(m: AppMode) {
    setModeState(m);
    if (m) {
      localStorage.setItem(STORAGE_KEY, m);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function clearMode() {
    setModeState(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <AppModeContext.Provider value={{ mode, setMode, clearMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
