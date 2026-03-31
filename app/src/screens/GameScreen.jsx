import { useEffect } from 'react'
import { useGame } from '../context/GameContext'

import Night0Phase    from '../phases/Night0Phase'
import MorningPhase   from '../phases/MorningPhase'
import DayPhase       from '../phases/DayPhase'
import NominationPhase from '../phases/NominationPhase'
import VotingPhase    from '../phases/VotingPhase'
import NightPhase     from '../phases/NightPhase'

export default function GameScreen({ onGameOver, onNavigateReveal }) {
  const { game, loading } = useGame()

  useEffect(() => {
    if (game?.status === 'ended' || game?.winner) {
      onGameOver()
    }
  }, [game?.status, game?.winner])

  if (loading || !game) {
    return (
      <div className="screen screen-center">
        <p className="info-msg">Loading…</p>
      </div>
    )
  }

  const phase = game.phase

  return (
    <>
      {phase === 'night0'      && <Night0Phase />}
      {phase === 'morning'     && <MorningPhase />}
      {phase === 'day'         && <DayPhase />}
      {phase === 'nominations' && <NominationPhase />}
      {phase === 'voting'      && <VotingPhase />}
      {phase === 'night'       && <NightPhase />}
    </>
  )
}
