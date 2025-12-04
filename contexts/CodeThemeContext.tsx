"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CodeTheme =
  | "dracula"
  | "oneDark"
  | "vscDarkPlus"
  | "atomDark"
  | "nightOwl"
  | "githubDark";

interface CodeThemeContextType {
  theme: CodeTheme;
  setTheme: (theme: CodeTheme) => void;
}

const CodeThemeContext = createContext<CodeThemeContextType | undefined>(
  undefined
);

export const useCodeTheme = () => {
  const context = useContext(CodeThemeContext);
  if (!context) {
    throw new Error("useCodeTheme must be used within CodeThemeProvider");
  }
  return context;
};

export const CodeThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setThemeState] = useState<CodeTheme>("dracula");

  // 从 localStorage 读取主题
  useEffect(() => {
    const savedTheme = localStorage.getItem("codeTheme") as CodeTheme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // 保存主题到 localStorage
  const setTheme = (newTheme: CodeTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("codeTheme", newTheme);
  };

  return (
    <CodeThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </CodeThemeContext.Provider>
  );
};
