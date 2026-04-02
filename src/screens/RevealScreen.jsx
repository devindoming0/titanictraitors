import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { CHARACTERS } from '../lib/characters'

export default function RevealScreen({ onDone }) {
  const { game, players, currentPlayer } = useGame()
  const [flipped, setFlipped] = useState(false)

  if (!currentPlayer?.character) {
    return (
      <div className="screen screen-center">
        <p className="info-msg">Receiving your assignment…</p>
      </div>
    )
  }

  const char = CHARACTERS[currentPlayer.character]
  const isTraitor = currentPlayer.role === 'traitor'
  const partnerTraitors = players.filter(
    p => p.role === 'traitor' && p.id !== currentPlayer.id
  )

  return (
    <div className="screen fade-in">
      <div className="screen-header">
        <p className="title-day">Eyes Only</p>
        <h2 style={{ color: 'var(--gold)', fontFamily: 'Cinzel', fontSize: '1.3rem', marginTop: 6 }}>
          Your Assignment
        </h2>
      </div>

      <p className="info-msg" style={{ color: 'var(--traitor-fg)', fontWeight: 600 }}>
        ⚠ Keep your screen private. Do not show others.
      </p>

      <div style={{ marginTop: 20 }}>
        <div
          className={`flip-card ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(true)}
        >
          <div className="flip-card-inner">
            {/* Front — tap to reveal */}
            <div className="flip-card-front">
              <p style={{ fontSize: '3rem' }}>🃏</p>
              <p className="phase-label" style={{ marginTop: 16 }}>Tap to Reveal</p>
              <p className="info-msg" style={{ marginTop: 8 }}>
                Make sure no one is looking at your screen.
              </p>
            </div>

            {/* Back — role */}
            <div className={`flip-card-back ${isTraitor ? 'traitor-card' : 'faithful-card'}`}>
              <div style={{ fontSize: '2.8rem' }}>{char.emoji}</div>
              <h2 style={{
                fontFamily: 'Cinzel', fontSize: '1.2rem', marginTop: 12,
                color: isTraitor ? 'var(--traitor-fg)' : 'var(--faithful-fg)'
              }}>
                {isTraitor ? '🗡 TRAITOR' : '⚓ FAITHFUL'}
              </h2>
              <h3 style={{ fontFamily: 'Cinzel', color: 'var(--gold)', marginTop: 8, fontSize: '1rem' }}>
                {char.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                {char.title}
              </p>
              <p style={{
                fontSize: '0.9rem', fontStyle: 'italic', marginTop: 12, color: 'var(--text)',
                lineHeight: 1.4
              }}>
                {char.quote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="fade-in" style={{ marginTop: 20 }}>
          {isTraitor && partnerTraitors.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--traitor-fg)', marginBottom: 12 }}>
              <p className="section-title">Your Fellow Traitor{partnerTraitors.length > 1 ? 's' : ''}</p>
              {partnerTraitors.map(p => {
                const pc = CHARACTERS[p.character]
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <span style={{ fontSize: '1.4rem' }}>{pc.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{pc.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {isTraitor && currentPlayer.behaviorCard && (
            <div className="card" style={{ borderColor: 'var(--traitor-fg)', marginBottom: 12 }}>
              <p className="section-title">Your Suspicious Behavior</p>
              <p style={{ marginTop: 6, lineHeight: 1.5 }}>
                🎭 {currentPlayer.behaviorCard}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 8 }}>
                You must do this visibly at least once each day you're still in the game.
              </p>
            </div>
          )}

          {game?.settings?.characterAbilities && (
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="section-title">Your Ability — {char.ability}</p>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, marginTop: 6 }}>{char.abilityDesc}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>
                One use per game. Tell the host when you want to activate it.
              </p>
            </div>
          )}

          <div className="bottom-actions">
            <button className="btn btn-primary" onClick={onDone}>
              I've Memorised My Role →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
