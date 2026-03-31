import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { setNominees } from '../lib/gameActions'
import { CHARACTERS } from '../lib/characters'

export default function NominationPhase() {
  const { game, players, currentPlayer, isHost } = useGame()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const alivePlayers = players.filter(p => p.isAlive)

  function toggleSelect(id) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    )
  }

  async function handleStartVote() {
    if (selected.length < 2) { alert('Select at least 2 nominees.'); return }
    setLoading(true)
    try {
      await setNominees(game.id, selected)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Day {game?.day} · Evening Dinner</p>
        <h2 className="phase-label" style={{ marginTop: 6 }}>Nominations</h2>
      </div>

      <div className="phase-banner" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '1.5rem' }}>🍽</p>
        <p style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          The passengers gather for dinner. Accusations fly. Who will be banished tonight?
        </p>
      </div>

      {isHost ? (
        <>
          <p className="section-title">
            Select Nominees (up to 3) — {selected.length} selected
          </p>
          <p className="info-msg" style={{ marginBottom: 12 }}>
            Facilitate discussion, then select the final 2–3 nominees for the vote.
          </p>
          <div className="player-list">
            {alivePlayers.map(p => {
              const char = CHARACTERS[p.character]
              const isSelected = selected.includes(p.id)
              return (
                <div
                  key={p.id}
                  className={`player-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelect(p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="player-avatar">{char?.emoji}</div>
                  <div className="player-info">
                    <div className="player-name">{p.name}</div>
                    <div className="player-char">{char?.name}</div>
                  </div>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontSize: '0.75rem', flexShrink: 0,
                  }}>
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="bottom-actions">
            <button
              className="btn btn-primary"
              onClick={handleStartVote}
              disabled={selected.length < 2 || loading}
            >
              {loading ? 'Starting…' : `Start Vote — ${selected.length} Nominee${selected.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      ) : (
        <div>
          <p className="section-title">Tonight's Contenders</p>
          <p className="info-msg">
            Discuss your accusations. The host is selecting nominees…
          </p>
          <div className="player-list" style={{ marginTop: 16 }}>
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
        </div>
      )}
    </div>
  )
}
