import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { submitVote, finalizeBanishment } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!endsAt) return
    const end = endsAt.toMillis ? endsAt.toMillis() : new Date(endsAt).getTime()

    function tick() {
      setRemaining(Math.max(0, end - Date.now()))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return remaining
}

function formatCountdown(ms) {
  if (ms === null) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VotingPhase() {
  const { game, players, currentPlayer, isHost } = useGame()
  const [loading, setLoading] = useState(false)
  const autoFinalizedRef = useRef(false)

  const nominees     = (game?.nominees || []).map(id => players.find(p => p.id === id)).filter(Boolean)
  const votes        = game?.votes || {}
  const alivePlayers = players.filter(p => p.isAlive)
  const myVote       = currentPlayer ? votes[currentPlayer.id] : null
  const isAlive      = currentPlayer?.isAlive

  const totalVotes  = Object.keys(votes).length
  const totalVoters = alivePlayers.length

  const remaining = useCountdown(game?.voteEndsAt)
  const expired   = remaining === 0
  const isUrgent  = remaining !== null && remaining < 60 * 1000 // under 1 min

  // Host auto-finalizes when timer expires
  useEffect(() => {
    if (isHost && expired && !autoFinalizedRef.current && !loading) {
      autoFinalizedRef.current = true
      handleFinalize()
    }
  }, [isHost, expired])

  function tallyFor(id) {
    return Object.values(votes).filter(v => v === id).length
  }

  async function handleVote(targetId) {
    if (!isAlive) return
    // Allow changing vote — tap same to keep, tap different to switch
    if (myVote === targetId) return
    await submitVote(game.id, currentPlayer.id, targetId)
  }

  async function handleFinalize() {
    setLoading(true)
    try {
      await finalizeBanishment(game.id, players, votes, game.nominees)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Evening Dinner</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>The Vote</h2>
      </div>

      {/* Synced countdown timer */}
      {game?.voteEndsAt && (
        <div className="card" style={{
          textAlign: 'center',
          marginBottom: 16,
          borderColor: isUrgent ? 'var(--traitor-fg)' : 'var(--border)',
        }}>
          <p style={{
            fontSize: '0.75rem', letterSpacing: '0.2em',
            color: isUrgent ? 'var(--traitor-fg)' : 'var(--text-dim)',
            textTransform: 'uppercase',
          }}>
            {expired ? 'Time is up' : 'Vote closes in'}
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
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="section-title" style={{ marginBottom: 0 }}>Vote to Banish</p>
        <span style={{ fontFamily: 'Cinzel', fontSize: '0.85rem', color: 'var(--gold)' }}>
          {totalVotes} / {totalVoters} voted
        </span>
      </div>

      <div className="player-list" style={{ marginBottom: 20 }}>
        {nominees.map(p => {
          const char = CHARACTERS[p.character]
          const count = tallyFor(p.id)
          const isMyVote = myVote === p.id
          const pct = totalVoters > 0 ? (count / totalVoters) * 100 : 0
          const canVote = isAlive && !expired

          return (
            <div
              key={p.id}
              className={`player-row ${isMyVote ? 'selected' : ''}`}
              onClick={() => canVote && handleVote(p.id)}
              style={{ cursor: canVote ? 'pointer' : 'default', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="player-avatar">{char?.emoji}</div>
                <div className="player-info">
                  <div className="player-name">{p.name}</div>
                  <div className="player-char">{char?.name}</div>
                </div>
                {isMyVote && (
                  <span style={{ fontFamily: 'Cinzel', fontSize: '0.7rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>
                    YOUR VOTE
                  </span>
                )}
                <span style={{ fontFamily: 'Cinzel', fontSize: '1.1rem', color: 'var(--gold)', minWidth: 24, textAlign: 'right' }}>
                  {count}
                </span>
              </div>
              {/* Vote bar */}
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: isMyVote ? 'var(--gold)' : 'var(--text-dim)',
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {!isAlive && (
        <p className="info-msg">You have been eliminated and cannot vote.</p>
      )}

      {isAlive && !myVote && !expired && (
        <p className="info-msg">Tap a passenger above to cast your vote.</p>
      )}

      {isAlive && myVote && !expired && (
        <p className="info-msg">Vote cast. Tap a different passenger to change your vote.</p>
      )}

      {isAlive && expired && (
        <p className="info-msg">Voting has closed. Tallying results…</p>
      )}

      {/* Who has / hasn't voted */}
      <div className="card" style={{ marginTop: 12 }}>
        <p className="section-title">Waiting on</p>
        {alivePlayers.filter(p => !votes[p.id]).map(p => (
          <span key={p.id} style={{ display: 'inline-block', marginRight: 8, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            {p.name}
          </span>
        ))}
        {alivePlayers.every(p => votes[p.id]) && (
          <p style={{ color: 'var(--faithful-fg)', fontSize: '0.9rem' }}>All votes are in!</p>
        )}
      </div>

      {isHost && (
        <div className="bottom-actions">
          <button
            className="btn btn-danger"
            onClick={handleFinalize}
            disabled={loading || totalVotes === 0}
          >
            {loading ? 'Processing…' : '⚖ Finalize Vote & Banish'}
          </button>
          <p className="info-msg" style={{ marginTop: 8 }}>
            {expired
              ? 'Timer expired — finalizing automatically.'
              : 'You can finalize early or wait for the timer. Majority wins.'}
          </p>
        </div>
      )}
    </div>
  )
}
