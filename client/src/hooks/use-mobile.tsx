import * as React from "react"

const MOBILE_BREAKPOINT = 640

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    return mql.matches
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newValue = 'matches' in e ? e.matches : e.matches
      console.log('📱 useIsMobile onChange:', JSON.stringify({ matches: newValue, isMobile: newValue }))
      setIsMobile(newValue)
    }
    
    // Проверяем сразу при монтировании
    const currentMatches = mql.matches
    console.log('📱 useIsMobile MOUNT:', JSON.stringify({ matches: currentMatches, isMobile: currentMatches }))
    setIsMobile(currentMatches)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  console.log('📱 useIsMobile RENDER:', JSON.stringify({ isMobile }))
  return isMobile
}
