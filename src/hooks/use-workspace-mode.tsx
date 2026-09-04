import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type WorkspaceMode = "rentals" | "construction";

const STORAGE_KEY = "habico_workspace_mode";

type Ctx = {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  toggle: () => void;
};

const WorkspaceModeContext = createContext<Ctx>({
  mode: "rentals",
  setMode: () => {},
  toggle: () => {},
});

function getInitialMode(): WorkspaceMode {
  if (typeof window === "undefined") return "rentals";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "rentals" || stored === "construction") return stored;
  return "rentals";
}

export function WorkspaceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WorkspaceMode>(getInitialMode);

  const setMode = useCallback((m: WorkspaceMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "rentals" ? "construction" : "rentals";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <WorkspaceModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode() {
  return useContext(WorkspaceModeContext);
}
