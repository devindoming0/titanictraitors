import { useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { startGame } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function LobbyScreen({ onNavigate, onReset }) {
  const { game, players, currentPlayer, isHost, loading } = useGame()

  // Auto-advance when host starts the game
  useEffect(() => {
    if (game?.status === 'active') {
      onNavigate('reveal')
    }
  }, [game?.status])

  if (loading || !game) {
    return (
      <div className="screen screen-center">
        <p className="info-msg">Loading…</p>
      </div>
    )
  }

  async function handleStart() {
    try {
      await startGame(game.id, game.settings)
    } catch (e) {
      alert(e.message)
    }
  }

  const canStart = players.length >= 3

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">The Voyage Begins</p>
        <h2 style={{ color: 'var(--gold)', fontFamily: 'Cinzel', fontSize: '1.3rem', marginTop: 6 }}>
          Game Lobby
        </h2>
      </div>

      <p className="section-title">Game Code</p>
      <div className="game-code">{game.code}</div>
      <p className="info-msg">Share this code with your fellow passengers</p>

      <div style={{ marginTop: 28 }}>
        <p className="section-title">{players.length} / 8 Passengers Aboard</p>
        <div className="player-list">
          {players.map(p => (
            <div key={p.id} className="player-row">
              <div className="player-avatar">🧍</div>
              <div className="player-info">
                <div className="player-name">{p.name}</div>
                <div className="player-char">{p.id === currentPlayer?.id ? 'You' : 'Passenger'}</div>
              </div>
              {p.id === game.hostId && <span className="badge badge-host">Host</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="section-title">Active Rules</p>
        <div className="card">
          {[
            ['Suspicious Behavior', game.settings?.suspiciousBehavior],
            ['Character Abilities', game.settings?.characterAbilities],
            ['Ghost Whisper', game.settings?.ghostWhisper],
            ['Locked Room', game.settings?.lockedRoom],
          ].map(([label, on]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
              <span>{label}</span>
              <span style={{ color: on ? 'var(--faithful-fg)' : 'var(--text-dim)' }}>
                {on ? '✓ On' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-actions">
        {isHost ? (
          <>
            {!canStart && (
              <p className="info-msg" style={{ marginBottom: 12 }}>
                Need at least 3 passengers to set sail.
              </p>
            )}
            <button className="btn btn-primary" onClick={handleStart} disabled={!canStart}>
              ⚓ Set Sail — Start Game
            </button>
          </>
        ) : (
          <p className="info-msg">Waiting for the host to start the voyage…</p>
        )}
        <button className="btn btn-ghost" onClick={onReset}>
          Leave Ship
        </button>
      </div>
    </div>
  )
}
