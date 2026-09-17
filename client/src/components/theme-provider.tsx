import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function applyThemeClass(theme: Theme) {
  const root = window.document.documentElement
  root.classList.remove("light", "dark")
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

/** One reusable overlay div — opacity-only animation, GPU-composited, zero layout cost. */
function getOverlay(): HTMLDivElement {
  let el = document.getElementById("blinga-theme-overlay") as HTMLDivElement | null
  if (!el) {
    el = document.createElement("div")
    el.id = "blinga-theme-overlay"
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      pointerEvents: "none",
      opacity: "0",
      background: "var(--background)",
      willChange: "opacity",
    })
    document.body.appendChild(el)
  }
  return el
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const overlay = getOverlay()
    let swap: ReturnType<typeof setTimeout>
    let timers: ReturnType<typeof setTimeout>[] = []

    // Freeze the current background colour NOW (before theme swap changes the CSS var)
    const frozenBg = getComputedStyle(document.body).backgroundColor
    overlay.style.background = frozenBg

    // Step 1 — fast cover (invisible because it matches current bg exactly)
    overlay.style.transition = "opacity 0.22s ease-in"
    overlay.style.opacity = "1"

    // Step 2 — swap theme while fully covered
    swap = setTimeout(() => {
      applyThemeClass(theme)
      // Step 3 — slow reveal of the new theme
      overlay.style.transition = "opacity 1.4s cubic-bezier(0.4,0,0.2,1)"
      overlay.style.opacity = "0"
    }, 240)

    timers.push(swap)
    return () => timers.forEach(clearTimeout)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
