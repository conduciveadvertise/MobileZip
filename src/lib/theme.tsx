import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Appearance = "light" | "dark" | "system";

type Ctx = { appearance: Appearance; setAppearance: (a: Appearance) => void; isDark: boolean };

const ThemeContext = createContext<Ctx>({
  appearance: "system",
  setAppearance: () => {},
  isDark: false,
});

const KEY = "phonezip.appearance";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Appearance | null;
    if (stored) setAppearanceState(stored);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = appearance === "dark" || (appearance === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [appearance]);

  const setAppearance = (a: Appearance) => {
    setAppearanceState(a);
    window.localStorage.setItem(KEY, a);
  };

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
