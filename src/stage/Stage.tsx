import { useEffect, useState, type ReactNode } from 'react'

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 720))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <div
        className="relative shrink-0 overflow-hidden bg-ink"
        style={{ width: 1280, height: 720, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
