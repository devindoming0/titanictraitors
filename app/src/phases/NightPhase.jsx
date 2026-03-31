import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { submitMurder, finalizeMorning } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function NightPhase() {
  const { game, players, currentPlayer, isHost } = useGame()
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const isTraitor  = currentPlayer?.role === 'traitor'
  const isAlive    = currentPlayer?.isAlive
  const submissions = game?.murderSubmissions || {}
  const mySubmission = currentPlayer ? submissions[currentPlayer.id] : null

  // Faithfuls can only target from alive faithfuls
  const targetablePlayers = players.filter(p => p.isAlive && p.role === 'faithful')
  const aliveTraitors = players.filter(p => p.isAlive && p.role === 'traitor')

  // Check if all traitors have submitted the same target
  const traitorIds = aliveTraitors.map(t => t.id)
  const allSubmitted = traitorIds.every(id => submissions[id])
  const submittedValues = traitorIds.map(id => submissions[id]).filter(Boolean)
  const allAgree = allSubmitted && submittedValues.every(v => v === submittedValues[0])

  async function handleSubmit() {
    if (!selected || !currentPlayer) return
    setLoading(true)
    try {
      await submitMurder(game.id, currentPlayer.id, selected)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleMorning() {
    setLoading(true)
    try {
      await finalizeMorning(game.id, players, game)
    } finally {
      setLoading(false)
    }
  }

  // Banishment announcement (shown to all after vote)
  const banished = game?.lastBanished
  const banishedChar = banished ? CHARACTERS[banished.character] : null

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Night</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>After Dinner</h2>
      </div>

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

      {/* Traitor view */}
      {isTraitor && isAlive && (
        <div>
          <div className="murder-banner" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '1.8rem' }}>🗡</p>
            <p className="phase-label" style={{ marginTop: 10, color: 'var(--traitor-fg)' }}>
              Choose Your Victim
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 8 }}>
              Submit within one hour of dinner ending.
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
                </div>
              )}

              <p className="info-msg" style={{ marginTop: 12 }}>
                {allAgree ? '✓ All traitors agree. Waiting for the host.' : 'Waiting for your partner…'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Faithful view */}
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
          <p className="info-msg" style={{ marginTop: 8 }}>
            The murder will be announced in the morning.
          </p>
        </div>
      )}

      {/* Host controls */}
      {isHost && (
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleMorning} disabled={loading}>
            {loading ? 'Processing…' : '🌅 Reveal the Morning →'}
          </button>
          <p className="info-msg" style={{ marginTop: 8 }}>
            Use this after all traitors have submitted their target.
          </p>
        </div>
      )}
    </div>
  )
}
