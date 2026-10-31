import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContextValue";
export function ThemeProvider({ children }) {
const [theme, setTheme] = useState("light");
const toggleTheme = () => {
  setTheme((current) =>
    current === "light" ? "dark" : "light"
  );
};
useEffect(() => {
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark"
  );
}, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
