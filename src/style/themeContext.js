import { createContext } from "react";

// { theme, setTheme } from useTheme in App, for screens that show the theme control.
export const ThemeContext = createContext({ theme: "system", setTheme: () => {} });
