import { useGame } from '../context/GameContext'
import { advancePhase } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function Night0Phase() {
  const { game, players, currentPlayer, isHost } = useGame()
  const isTraitor = currentPlayer?.role === 'traitor'
  const partnerTraitors = players.filter(p => p.role === 'traitor' && p.id !== currentPlayer?.id)

  function handleBeginDay() {
    advancePhase(game.id, 'day')
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Night — Before the Voyage</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>Night Zero</h2>
      </div>

      {isTraitor ? (
        <div>
          <div className="murder-banner" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '2.5rem' }}>🗡</p>
            <h2 style={{ fontFamily: 'Cinzel', color: 'var(--traitor-fg)', marginTop: 12, fontSize: '1.2rem' }}>
              You are the Traitor
            </h2>
            <p style={{ color: 'var(--text-dim)', marginTop: 8, fontSize: '0.95rem' }}>
              You have opened your eyes in the dark and seen who shares your secret.
            </p>
          </div>

          {partnerTraitors.length > 0 ? (
            <>
              <p className="section-title">Your Fellow Traitor{partnerTraitors.length > 1 ? 's' : ''}</p>
              <div className="player-list">
                {partnerTraitors.map(p => {
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
            </>
          ) : (
            <div className="card">
              <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                You are the only Traitor. Act alone.
              </p>
            </div>
          )}

          <p className="info-msg" style={{ marginTop: 16 }}>
            Memorise your allies. Close your eyes. The night has ended.
          </p>
        </div>
      ) : (
        <div>
          <div className="phase-banner">
            <p style={{ fontSize: '2.5rem' }}>🌊</p>
            <p className="phase-label" style={{ marginTop: 16 }}>The Ship Grows Quiet</p>
            <p className="info-msg" style={{ marginTop: 12 }}>
              Somewhere in the dark, the Traitor{players.filter(p => p.role === 'traitor').length > 1 ? 's are' : ' is'} learning who they are.
            </p>
            <p className="info-msg" style={{ marginTop: 8 }}>
              Trust no one. The voyage begins in the morning.
            </p>
          </div>
        </div>
      )}

      {isHost && (
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleBeginDay}>
            Begin Day 1 →
          </button>
        </div>
      )}
    </div>
  )
}
