import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsMobileOrTablet() {
  const [is, setIs] = React.useState<boolean>(false)

  React.useEffect(() => {
    const check = () => setIs(window.innerWidth < 1024)
    const mql = window.matchMedia("(max-width: 1023px)")
    mql.addEventListener("change", check)
    check()
    return () => mql.removeEventListener("change", check)
  }, [])

  return is
}
