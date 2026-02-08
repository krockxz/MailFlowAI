import { useEffect } from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: "light" | "dark" | "system"
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ai-mail-theme",
}: ThemeProviderProps) {
  useEffect(() => {
    // Get stored theme or use default
    const storedTheme = localStorage.getItem(storageKey)
    const theme = storedTheme || defaultTheme

    // Apply theme
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [defaultTheme, storageKey])

  return <>{children}</>
}

export function setTheme(theme: "light" | "dark" | "system", storageKey = "ai-mail-theme") {
  const root = window.document.documentElement
  root.classList.remove("light", "dark")

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    root.classList.add(systemTheme)
    localStorage.setItem(storageKey, "system")
  } else {
    root.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }
}

export function getTheme(storageKey = "ai-mail-theme"): "light" | "dark" | "system" {
  const stored = localStorage.getItem(storageKey)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }
  return "system"
}
