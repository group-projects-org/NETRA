import {createContext,useContext,useEffect,useState,} from "react";
const ThemeContext = createContext(null);
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
export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}
