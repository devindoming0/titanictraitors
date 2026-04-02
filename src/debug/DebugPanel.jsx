import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { CHARACTERS } from '../lib/characters'
import { fillWithFakePlayers, autoVoteFakes, autoMurder } from './debugActions'

const PHASE_LABELS = {
  lobby: 'Lobby',
  night0: 'Night 0',
  day: 'Day',
  nominations: 'Nominations',
  voting: 'Voting',
  night: 'Night',
  morning: 'Morning',
  ended: 'Ended',
}

export default function DebugPanel() {
  const { game, players, currentPlayer } = useGame()
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)

  const fakePlayers  = players.filter(p => p.isDebug)
  const realPlayers  = players.filter(p => !p.isDebug)
  const alivePlayers = players.filter(p => p.isAlive)
  const fakeTraitors = fakePlayers.filter(p => p.isAlive && p.role === 'traitor')
  const aliveFaithfuls = players.filter(p => p.isAlive && p.role === 'faithful')
  const nominees = game?.nominees || []
  const phase = game?.phase

  async function run(fn) {
    setBusy(true)
    try { await fn() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const panelStyle = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    width: open ? 280 : 44,
    background: '#0d1117',
    border: '1px solid #f97316',
    borderRadius: 10,
    zIndex: 9999,
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#e2e8f0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    transition: 'width 0.2s',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: '#f97316',
    color: '#000',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: '0.1em',
  }

  const btnStyle = {
    display: 'block',
    width: '100%',
    padding: '6px 10px',
    marginTop: 4,
    background: '#1e293b',
    color: '#f97316',
    border: '1px solid #f97316',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    textAlign: 'left',
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 0',
    borderBottom: '1px solid #1e293b',
  }

  return (
    <div style={panelStyle}>
      {/* Header toggle */}
      <div style={headerStyle} onClick={() => setOpen(o => !o)}>
        {open ? (
          <>
            <span>🛠 DEBUG</span>
            <span style={{ fontSize: 14 }}>×</span>
          </>
        ) : (
          <span style={{ fontSize: 16 }}>🛠</span>
        )}
      </div>

      {open && (
        <div style={{ padding: 10, maxHeight: '70dvh', overflowY: 'auto' }}>

          {/* Game status */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>GAME STATE</div>
            <div>Phase: <span style={{ color: '#f97316' }}>{PHASE_LABELS[phase] ?? phase ?? '—'}</span></div>
            <div>Day: <span style={{ color: '#f97316' }}>{game?.day ?? '—'}</span></div>
            <div>Players: {alivePlayers.length} alive / {players.length} total</div>
            <div>Fake: {fakePlayers.length} ({fakeTraitors.length} traitor)</div>
          </div>

          {/* Player roster with roles */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>ALL PLAYERS</div>
            {players.map(p => {
              const char = CHARACTERS[p.character]
              const isMe = p.id === currentPlayer?.id
              return (
                <div key={p.id} style={rowStyle}>
                  <span>{char?.emoji ?? '?'}</span>
                  <span style={{
                    flex: 1,
                    opacity: p.isAlive ? 1 : 0.4,
                    textDecoration: p.isAlive ? 'none' : 'line-through',
                  }}>
                    {p.name}{isMe ? ' ★' : ''}{p.isDebug ? ' 🤖' : ''}
                  </span>
                  <span style={{
                    color: p.role === 'traitor' ? '#fca5a5' : '#6ee7b7',
                    fontSize: 10,
                  }}>
                    {p.role ?? '?'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Phase-specific actions */}
          <div style={{ color: '#94a3b8', marginBottom: 4 }}>ACTIONS</div>

          {/* Lobby: fill with fake players */}
          {(phase === 'lobby' || !phase) && (
            <div>
              <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>
                Fill lobby to total:
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[3, 4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    disabled={busy || players.length >= n}
                    onClick={() => run(() => fillWithFakePlayers(game.id, players, n))}
                    style={{
                      ...btnStyle,
                      width: 'auto',
                      padding: '5px 10px',
                      opacity: players.length >= n ? 0.3 : 1,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voting: auto-vote for fake players */}
          {phase === 'voting' && (
            <div>
              {nominees.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                    Nominees: {nominees.map(id => players.find(p => p.id === id)?.name).join(', ')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                    Votes in: {Object.keys(game?.votes || {}).length} / {alivePlayers.length}
                  </div>
                  <button
                    style={btnStyle}
                    disabled={busy}
                    onClick={() => run(() => autoVoteFakes(game.id, fakePlayers, nominees))}
                  >
                    Auto-Vote All Fakes ({fakePlayers.filter(p => p.isAlive && !game?.votes?.[p.id]).length} pending)
                  </button>
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: 10 }}>
                  Waiting for host to set nominees…
                </div>
              )}
            </div>
          )}

          {/* Night: auto-murder */}
          {phase === 'night' && (
            <div>
              {fakeTraitors.length > 0 ? (
                <>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                    Fake traitor(s): {fakeTraitors.map(t => t.name).join(', ')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                    Submitted: {fakeTraitors.filter(t => game?.murderSubmissions?.[t.id]).length} / {fakeTraitors.length}
                  </div>
                  <button
                    style={btnStyle}
                    disabled={busy}
                    onClick={() => run(() => autoMurder(game.id, fakeTraitors, aliveFaithfuls))}
                  >
                    Auto-Murder (random faithful)
                  </button>
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: 10 }}>
                  No fake traitors alive.
                </div>
              )}
            </div>
          )}

          {/* Murder submissions preview */}
          {phase === 'night' && Object.keys(game?.murderSubmissions || {}).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>MURDER SUBMISSIONS</div>
              {Object.entries(game.murderSubmissions).map(([tid, victimId]) => {
                const traitor = players.find(p => p.id === tid)
                const victim = players.find(p => p.id === victimId)
                return (
                  <div key={tid} style={{ fontSize: 10, color: '#fca5a5' }}>
                    {traitor?.name} → {victim?.name}
                  </div>
                )
              })}
            </div>
          )}

          {/* Votes preview */}
          {phase === 'voting' && Object.keys(game?.votes || {}).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>CURRENT VOTES</div>
              {Object.entries(game.votes).map(([vid, targetId]) => {
                const voter = players.find(p => p.id === vid)
                const target = players.find(p => p.id === targetId)
                return (
                  <div key={vid} style={{ fontSize: 10 }}>
                    {voter?.name} → {target?.name}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
