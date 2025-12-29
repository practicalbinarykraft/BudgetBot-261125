import * as React from "react"

const MOBILE_BREAKPOINT = 640

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)

    // Проверяем только ОДИН раз при монтировании
    setIsMobile(prev => {
      const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      return currentIsMobile
    })

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
