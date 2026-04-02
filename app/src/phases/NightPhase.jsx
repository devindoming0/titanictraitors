import { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { submitMurder } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

function useCountdown(nightEndsAt) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!nightEndsAt) return

    function tick() {
      const msLeft = nightEndsAt.toMillis() - Date.now()
      setRemaining(Math.max(0, msLeft))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nightEndsAt])

  return remaining
}

function formatCountdown(ms) {
  if (ms === null) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function NightPhase() {
  const { game, players, currentPlayer } = useGame()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const isTraitor  = currentPlayer?.role === 'traitor'
  const isAlive    = currentPlayer?.isAlive
  const submissions = game?.murderSubmissions || {}
  const mySubmission = currentPlayer ? submissions[currentPlayer.id] : null

  const targetablePlayers = players.filter(p => p.isAlive && p.role === 'faithful')
  const aliveTraitors = players.filter(p => p.isAlive && p.role === 'traitor')

  const allSubmitted = aliveTraitors.every(t => submissions[t.id])
  const submittedValues = aliveTraitors.map(t => submissions[t.id]).filter(Boolean)
  const allAgree = allSubmitted && submittedValues.length > 0 &&
    submittedValues.every(v => v === submittedValues[0])

  const remaining = useCountdown(game?.nightEndsAt)
  const isUrgent  = remaining !== null && remaining < 10 * 60 * 1000 // under 10 min
  const expired   = remaining === 0

  const banished     = game?.lastBanished
  const banishedChar = banished ? CHARACTERS[banished.character] : null

  async function handleSubmit() {
    if (!selected || !currentPlayer) return
    setLoading(true)
    try {
      await submitMurder(game.id, currentPlayer.id, selected)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Night</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>After Dinner</h2>
      </div>

      {/* Countdown timer */}
      {game?.nightEndsAt && (
        <div className="card" style={{
          textAlign: 'center',
          marginBottom: 20,
          borderColor: isUrgent ? 'var(--traitor-fg)' : 'var(--border)',
        }}>
          <p style={{
            fontSize: '0.75rem', letterSpacing: '0.2em',
            color: isUrgent ? 'var(--traitor-fg)' : 'var(--text-dim)',
            textTransform: 'uppercase',
          }}>
            {expired ? 'Murder window closed' : 'Murder window closes in'}
          </p>
          <p style={{
            fontFamily: 'Cinzel',
            fontSize: '2.2rem',
            color: isUrgent ? 'var(--traitor-fg)' : 'var(--gold)',
            marginTop: 4,
            letterSpacing: '0.1em',
          }}>
            {expired ? '00:00' : formatCountdown(remaining)}
          </p>
          {expired && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>
              The morning announcement will arrive shortly…
            </p>
          )}
        </div>
      )}

      {/* Banishment result */}
      {banished && banishedChar && (
        <div className="card" style={{
          marginBottom: 20,
          borderColor: banished.role === 'traitor' ? 'var(--faithful-fg)' : 'var(--traitor-fg)',
        }}>
          <p className="section-title">Banished Tonight</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: '1.8rem' }}>{banishedChar.emoji}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{banished.name} — {banishedChar.name}</div>
              <div style={{ fontSize: '0.9rem', marginTop: 2 }}>
                They were a{' '}
                <strong style={{ color: banished.role === 'traitor' ? 'var(--traitor-fg)' : 'var(--faithful-fg)' }}>
                  {banished.role}
                </strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traitor murder UI */}
      {isTraitor && isAlive && !expired && (
        <div>
          <div className="murder-banner" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '1.8rem' }}>🗡</p>
            <p className="phase-label" style={{ marginTop: 10, color: 'var(--traitor-fg)' }}>
              Choose Your Victim
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 8 }}>
              Submit before the timer runs out. If you don't submit, no one dies tonight.
            </p>
          </div>

          {!mySubmission ? (
            <>
              <p className="section-title">Select a Target</p>
              <div className="player-list">
                {targetablePlayers.map(p => {
                  const char = CHARACTERS[p.character]
                  const isSelected = selected === p.id
                  return (
                    <div
                      key={p.id}
                      className={`player-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelected(p.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="player-avatar">{char?.emoji}</div>
                      <div className="player-info">
                        <div className="player-name">{p.name}</div>
                        <div className="player-char">{char?.name}</div>
                      </div>
                      {isSelected && <span style={{ color: 'var(--traitor-fg)', fontSize: '1.2rem' }}>🗡</span>}
                    </div>
                  )
                })}
              </div>
              <div className="bottom-actions">
                <button
                  className="btn btn-danger"
                  onClick={handleSubmit}
                  disabled={!selected || loading}
                >
                  {loading ? 'Submitting…' : '🗡 Submit Target'}
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="card" style={{ borderColor: 'var(--traitor-fg)', textAlign: 'center' }}>
                <p style={{ color: 'var(--traitor-fg)', fontFamily: 'Cinzel', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                  TARGET SUBMITTED
                </p>
                <p style={{ marginTop: 8, fontSize: '1rem' }}>
                  {players.find(p => p.id === mySubmission)?.name}
                </p>
              </div>

              {aliveTraitors.length > 1 && (
                <div className="card" style={{ marginTop: 12 }}>
                  <p className="section-title">Partner Status</p>
                  {aliveTraitors.filter(t => t.id !== currentPlayer.id).map(t => {
                    const theirTarget = submissions[t.id]
                    const theirTargetPlayer = theirTarget ? players.find(p => p.id === theirTarget) : null
                    return (
                      <div key={t.id} style={{ marginTop: 6, fontSize: '0.9rem' }}>
                        <strong>{t.name}</strong>:{' '}
                        {theirTargetPlayer
                          ? <span style={{ color: theirTargetPlayer.id === mySubmission ? 'var(--faithful-fg)' : 'var(--traitor-fg)' }}>
                              chose {theirTargetPlayer.name}
                              {theirTargetPlayer.id === mySubmission ? ' ✓ Agreed' : ' — differs from yours'}
                            </span>
                          : <span style={{ color: 'var(--text-dim)' }}>hasn't submitted yet…</span>
                        }
                      </div>
                    )
                  })}
                  {allAgree && (
                    <p style={{ color: 'var(--faithful-fg)', marginTop: 10, fontSize: '0.9rem' }}>
                      ✓ Both traitors agree. The deed is done.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Faithful waiting screen */}
      {(!isTraitor || !isAlive) && (
        <div>
          <div className="phase-banner">
            <p style={{ fontSize: '2.5rem' }}>🌊</p>
            <p className="phase-label" style={{ marginTop: 16 }}>The Night Is Dark</p>
            <p className="info-msg" style={{ marginTop: 10 }}>
              Retire to your cabin. Sleep if you can.
              Someone may not see the morning.
            </p>
          </div>
          <p className="info-msg">
            {expired
              ? 'The night has passed. The morning announcement is on its way…'
              : 'The murder announcement will appear here automatically when morning arrives.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
