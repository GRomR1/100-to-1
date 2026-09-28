import { useEffect, useState } from 'react'
import { Stage } from './stage/Stage'
import { Menu } from './screens/Menu'
import { Intro } from './screens/Intro'
import { BigGame } from './screens/BigGame'
import { Field } from './screens/Field'
import { attachKeymap } from './input/keymap'
import { startAudioTriggers } from './audio/triggers'
import { audio } from './audio/manager'
import { gameDataError, useGame } from './store'

function Gate({ onRelease }: { onRelease: () => void }) {
  useEffect(() => {
    const release = () => {
      window.removeEventListener('keydown', release, { capture: true })
      audio.unlock()
      audio.play('showIntro')
      onRelease()
    }
    window.addEventListener('keydown', release, { capture: true })
    return () => window.removeEventListener('keydown', release, { capture: true })
  }, [onRelease])
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-scrim/85">
      <div className="text-center">
        <div className="text-[48px] text-gold">100 К ОДНОМУ</div>
        <div className="mt-4 text-[28px] text-white">НАЖМИТЕ ЛЮБУЮ КЛАВИШУ</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink p-16">
      <pre className="max-w-full text-center text-[32px] leading-snug text-x-red">
        {message}
      </pre>
    </div>
  )
}

export function App() {
  const phase = useGame((s) => s.phase)
  const [gated, setGated] = useState(true)

  useEffect(() => {
    if (gated || gameDataError) return
    const detach = attachKeymap()
    startAudioTriggers()
    return detach
  }, [gated])

  if (gameDataError)
    return (
      <Stage>
        <ErrorScreen message={gameDataError} />
      </Stage>
    )

  return (
    <Stage>
      {(phase === 'Menu' || phase === 'Final' || phase === 'Closed') && <Menu />}
      {phase === 'Intro' && <Intro />}
      {phase === 'BigPlay' && <BigGame />}
      {(phase === 'TeamPlay' ||
        phase === 'Chance' ||
        phase === 'VicePlay' ||
        phase === 'ScoreUpdate') && <Field />}
      {gated && <Gate onRelease={() => setGated(false)} />}
    </Stage>
  )
}
