import { useGame } from '../context/GameContext'
import { advancePhase, setNominees } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function DayPhase() {
  const { game, players, currentPlayer, isHost } = useGame()

  const alivePlayers = players.filter(p => p.isAlive)
  const deadPlayers  = players.filter(p => !p.isAlive)
  const aliveTraitorCount = alivePlayers.filter(p => p.role === 'traitor').length
  const aliveFaithfulCount = alivePlayers.filter(p => p.role === 'faithful').length

  function handleBeginDinner() {
    // Skip nominations — all alive players are nominees
    const nomineeIds = alivePlayers.map(p => p.id)
    const voteTimer = game?.settings?.voteTimerMinutes ?? 7
    setNominees(game.id, nomineeIds, voteTimer)
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Daytime</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>The Voyage Continues</h2>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '2rem', color: 'var(--gold)' }}>
            {alivePlayers.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.1em' }}>
            ALIVE
          </div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '2rem', color: 'var(--traitor-fg)' }}>
            {game?.settings?.showTraitorCount ? aliveTraitorCount : '?'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.1em' }}>
            TRAITORS
          </div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cinzel', fontSize: '2rem', color: 'var(--gold)' }}>
            {game?.day}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.1em' }}>
            OF 6
          </div>
        </div>
      </div>

      <p className="section-title">Passengers — {alivePlayers.length} Alive</p>
      <div className="player-list">
        {alivePlayers.map(p => {
          const char = CHARACTERS[p.character]
          const isMe = p.id === currentPlayer?.id
          return (
            <div key={p.id} className="player-row" style={isMe ? { borderColor: 'var(--gold)' } : {}}>
              <div className="player-avatar">{char?.emoji}</div>
              <div className="player-info">
                <div className="player-name">{p.name} {isMe ? '(You)' : ''}</div>
                <div className="player-char">{char?.name}</div>
              </div>
            </div>
          )
        })}
      </div>

      {deadPlayers.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 20 }}>Eliminated</p>
          <div className="player-list">
            {deadPlayers.map(p => {
              const char = CHARACTERS[p.character]
              return (
                <div key={p.id} className="player-row dead">
                  <div className="player-avatar">{char?.emoji}</div>
                  <div className="player-info">
                    <div className="player-name">{p.name}</div>
                    <div className="player-char">{char?.name}</div>
                  </div>
                  <span className="badge badge-dead">Gone</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>
          Mingle. Observe. Discuss suspicions. The Traitor walks among you.
          {game?.settings?.suspiciousBehavior && ' Watch for suspicious behaviors.'}
        </p>
      </div>

      {isHost && (
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleBeginDinner}>
            🍽 Begin Evening Dinner →
          </button>
        </div>
      )}
    </div>
  )
}
