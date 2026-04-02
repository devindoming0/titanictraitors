import { useGame } from '../context/GameContext'
import { advancePhase } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function MorningPhase() {
  const { game, isHost } = useGame()
  const murdered = game?.lastMurdered

  const char = murdered ? CHARACTERS[murdered.character] : null

  function handleBeginDay() {
    advancePhase(game.id, 'day')
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Morning</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>A Body Is Found</h2>
      </div>

      {murdered && char ? (
        <div className="murder-banner">
          <div className="murder-emoji">{char.emoji}</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Found dead in their cabin
          </p>
          <h2 style={{ fontFamily: 'Cinzel', color: 'var(--text)', marginTop: 10, fontSize: '1.3rem' }}>
            {murdered.name}
          </h2>
          <p style={{ color: 'var(--gold)', fontSize: '0.9rem', marginTop: 4 }}>
            {char.name}
          </p>
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 12, fontSize: '0.9rem' }}>
            {char.quote}
          </p>
        </div>
      ) : (
        <div className="phase-banner">
          <p style={{ fontSize: '2rem' }}>🌅</p>
          <p className="phase-label" style={{ marginTop: 12 }}>All Passengers Accounted For</p>
          <p className="info-msg" style={{ marginTop: 8 }}>No one was harmed last night.</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Gather the survivors. Discuss what this means. Who benefits from this murder?
          Who reacts oddly to the news?
        </p>
      </div>

      {game?.lastBanished && (
        <div className="card" style={{ marginTop: 10 }}>
          <p className="section-title">Last Night's Banishment</p>
          <p style={{ fontSize: '0.95rem', marginTop: 6 }}>
            <strong>{game.lastBanished.name}</strong> ({CHARACTERS[game.lastBanished.character]?.name}) was banished
            — they were a <strong style={{ color: game.lastBanished.role === 'traitor' ? 'var(--traitor-fg)' : 'var(--faithful-fg)' }}>
              {game.lastBanished.role}
            </strong>.
          </p>
        </div>
      )}

      {isHost && (
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleBeginDay}>
            Begin Day {game?.day} →
          </button>
        </div>
      )}
    </div>
  )
}
