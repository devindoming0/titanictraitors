import { useGame } from '../context/GameContext'
import { CHARACTERS } from '../lib/characters'

export default function GameOverScreen({ onPlayAgain }) {
  const { game, players } = useGame()

  const faithfulsWin = game?.winner === 'faithfuls'
  const traitors = players.filter(p => p.role === 'traitor')
  const faithfuls = players.filter(p => p.role === 'faithful')

  return (
    <div className="screen fade-in">
      <div style={{ textAlign: 'center', padding: '40px 0 24px' }}>
        <p style={{ fontSize: '3.5rem' }}>{faithfulsWin ? '⚓' : '🗡'}</p>
        <h1 className="title-main" style={{ marginTop: 12, color: faithfulsWin ? 'var(--faithful-fg)' : 'var(--traitor-fg)' }}>
          {faithfulsWin ? 'Faithfuls Win' : 'Traitors Win'}
        </h1>
        <p className="title-sub" style={{ marginTop: 8 }}>
          {faithfulsWin
            ? 'The treachery has been exposed. The ship is safe.'
            : 'The darkness swallowed the faithful. The sea keeps its secrets.'}
        </p>
      </div>

      <p className="section-title" style={{ marginTop: 8 }}>
        The Traitor{traitors.length > 1 ? 's' : ''}
      </p>
      <div className="player-list">
        {traitors.map(p => {
          const char = CHARACTERS[p.character]
          return (
            <div key={p.id} className="player-row" style={{ borderColor: 'var(--traitor-fg)' }}>
              <div className="player-avatar">{char?.emoji}</div>
              <div className="player-info">
                <div className="player-name">{p.name}</div>
                <div className="player-char">{char?.name}</div>
              </div>
              <span className="badge badge-traitor">Traitor</span>
            </div>
          )
        })}
      </div>

      <p className="section-title" style={{ marginTop: 20 }}>The Faithful</p>
      <div className="player-list">
        {faithfuls.map(p => {
          const char = CHARACTERS[p.character]
          return (
            <div key={p.id} className={`player-row ${!p.isAlive ? 'dead' : ''}`}>
              <div className="player-avatar">{char?.emoji}</div>
              <div className="player-info">
                <div className="player-name">{p.name}</div>
                <div className="player-char">{char?.name}</div>
              </div>
              <span className={`badge ${p.isAlive ? 'badge-faithful' : 'badge-dead'}`}>
                {p.isAlive ? 'Survived' : 'Eliminated'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="bottom-actions">
        <p className="ornament">✦ ─── ✦ ─── ✦</p>
        <p className="info-msg" style={{ fontStyle: 'italic', marginBottom: 16 }}>
          "I'll never let go."
        </p>
        <button className="btn btn-secondary" onClick={onPlayAgain}>
          New Voyage
        </button>
      </div>
    </div>
  )
}
