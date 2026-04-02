import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { CHARACTERS } from '../lib/characters'
import { fillWithFakePlayers, autoVoteFakes, autoMurder } from './debugActions'
import { resolveMurder } from '../lib/gameActions'

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

const PHASE_COLORS = {
  lobby: '#60a5fa',
  night0: '#a78bfa',
  day: '#fbbf24',
  nominations: '#fb923c',
  voting: '#f87171',
  night: '#818cf8',
  morning: '#34d399',
  ended: '#94a3b8',
}

export default function DebugPanel() {
  const { game, players, currentPlayer } = useGame()
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)
  const [lastAction, setLastAction] = useState(null)

  const fakePlayers   = players.filter(p => p.isDebug)
  const realPlayers   = players.filter(p => !p.isDebug)
  const alivePlayers  = players.filter(p => p.isAlive)
  const fakeTraitors  = fakePlayers.filter(p => p.isAlive && p.role === 'traitor')
  const aliveFaithfuls = players.filter(p => p.isAlive && p.role === 'faithful')
  const nominees      = game?.nominees || []
  const phase         = game?.phase
  const phaseColor    = PHASE_COLORS[phase] ?? '#94a3b8'

  async function run(fn, label) {
    setBusy(true)
    setLastAction(null)
    try {
      await fn()
      setLastAction({ ok: true, msg: label + ' done' })
    } catch (e) {
      setLastAction({ ok: false, msg: e.message })
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 16, right: 16,
          width: 44, height: 44,
          background: '#0d1117',
          border: '2px solid #f97316',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 20,
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
        }}
        title="Open debug panel"
      >
        🛠
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16,
      width: 300,
      background: '#0d1117',
      border: '1px solid #1e293b',
      borderRadius: 12,
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: 12,
      color: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.2)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🛠</span>
          <span style={{ color: '#f97316', fontWeight: 700, letterSpacing: '0.08em', fontSize: 11 }}>
            DEBUG
          </span>
          <span style={{
            background: phaseColor + '22',
            color: phaseColor,
            border: `1px solid ${phaseColor}44`,
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 10,
            fontWeight: 600,
          }}>
            {PHASE_LABELS[phase] ?? phase ?? 'No game'}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer',
            fontSize: 16, lineHeight: 1,
            padding: '2px 4px', borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: '75dvh', overflowY: 'auto' }}>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid #1e293b',
        }}>
          {[
            { label: 'ALIVE', value: alivePlayers.length, color: '#34d399' },
            { label: 'TOTAL', value: players.length, color: '#60a5fa' },
            { label: 'BOTS', value: fakePlayers.length, color: '#f97316' },
            { label: 'DAY', value: game?.day ?? '—', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 4px',
              borderRight: '1px solid #1e293b',
            }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
              <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Player roster */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{
            color: '#475569', fontSize: 9, letterSpacing: '0.1em',
            fontWeight: 700, marginBottom: 8,
          }}>
            PLAYERS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {players.map(p => {
              const char = CHARACTERS[p.character]
              const isMe = p.id === currentPlayer?.id
              const isTraitor = p.role === 'traitor'
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: isMe ? '#1e293b' : 'transparent',
                  opacity: p.isAlive ? 1 : 0.35,
                }}>
                  <span style={{ fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                    {p.isAlive ? (char?.emoji ?? '?') : '💀'}
                  </span>
                  <span style={{
                    flex: 1,
                    textDecoration: p.isAlive ? 'none' : 'line-through',
                    color: isMe ? '#f97316' : '#cbd5e1',
                    fontSize: 11,
                  }}>
                    {p.name}
                    {isMe && <span style={{ color: '#f97316', marginLeft: 4 }}>★</span>}
                    {p.isDebug && <span style={{ color: '#475569', marginLeft: 4 }}>bot</span>}
                  </span>
                  <span style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: isTraitor ? '#7f1d1d' : '#064e3b',
                    color: isTraitor ? '#fca5a5' : '#6ee7b7',
                    fontWeight: 600,
                  }}>
                    {p.role ?? '?'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ height: 1, background: '#1e293b' }} />

        {/* Actions */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{
            color: '#475569', fontSize: 9, letterSpacing: '0.1em',
            fontWeight: 700, marginBottom: 8,
          }}>
            ACTIONS
          </div>

          {/* Lobby: fill buttons */}
          {(phase === 'lobby' || !phase) && (
            <div>
              <div style={{ color: '#64748b', fontSize: 10, marginBottom: 6 }}>
                Fill lobby to total:
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[3, 4, 5, 6, 7, 8].map(n => {
                  const disabled = busy || players.length >= n
                  return (
                    <button
                      key={n}
                      disabled={disabled}
                      onClick={() => run(() => fillWithFakePlayers(game.id, players, n), `Fill to ${n}`)}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        background: disabled ? '#1e293b' : '#7c3aed',
                        color: disabled ? '#475569' : '#e9d5ff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 11,
                        fontWeight: 700,
                        transition: 'background 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Voting phase */}
          {phase === 'voting' && (
            <div>
              {nominees.length > 0 ? (
                <>
                  <div style={{
                    background: '#1e293b', borderRadius: 6, padding: '6px 10px',
                    marginBottom: 8, fontSize: 10,
                  }}>
                    <div style={{ color: '#94a3b8', marginBottom: 2 }}>Nominees</div>
                    <div style={{ color: '#f97316' }}>
                      {nominees.map(id => players.find(p => p.id === id)?.name).join(', ')}
                    </div>
                    <div style={{ color: '#475569', marginTop: 4 }}>
                      {Object.keys(game?.votes || {}).length} / {alivePlayers.length} votes in
                    </div>
                  </div>
                  <ActionButton
                    disabled={busy}
                    color="#ef4444"
                    onClick={() => run(() => autoVoteFakes(game.id, fakePlayers, nominees), 'Auto-vote')}
                  >
                    Auto-Vote Bots
                    <Badge>{fakePlayers.filter(p => p.isAlive && !game?.votes?.[p.id]).length} pending</Badge>
                  </ActionButton>
                </>
              ) : (
                <EmptyState>Waiting for host to set nominees…</EmptyState>
              )}

              {/* Votes preview */}
              {Object.keys(game?.votes || {}).length > 0 && (
                <VotesTable entries={Object.entries(game.votes)} players={players} />
              )}
            </div>
          )}

          {/* Night phase */}
          {phase === 'night' && (
            <NightActions
              busy={busy}
              run={run}
              game={game}
              players={players}
              fakeTraitors={fakeTraitors}
              aliveFaithfuls={aliveFaithfuls}
            />
          )}

          {/* Idle phases */}
          {phase && !['lobby', 'voting', 'night'].includes(phase) && (
            <EmptyState>No actions available in {PHASE_LABELS[phase]} phase.</EmptyState>
          )}
        </div>

        {/* Toast */}
        {lastAction && (
          <div style={{
            margin: '0 14px 12px',
            padding: '6px 10px',
            borderRadius: 6,
            background: lastAction.ok ? '#064e3b' : '#7f1d1d',
            color: lastAction.ok ? '#6ee7b7' : '#fca5a5',
            fontSize: 10,
          }}>
            {lastAction.ok ? '✓' : '✗'} {lastAction.msg}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ children, onClick, disabled, color = '#f97316' }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        width: '100%',
        padding: '8px 10px',
        background: disabled ? '#1e293b' : color + '22',
        color: disabled ? '#475569' : color,
        border: `1px solid ${disabled ? '#1e293b' : color + '55'}`,
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 600,
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Badge({ children, bg = '#1e293b', color = '#94a3b8' }) {
  return (
    <span style={{
      marginLeft: 'auto',
      background: bg,
      color,
      padding: '1px 6px',
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 500,
    }}>
      {children}
    </span>
  )
}

function EmptyState({ children }) {
  return (
    <div style={{ color: '#475569', fontSize: 10, padding: '6px 0', fontStyle: 'italic' }}>
      {children}
    </div>
  )
}

function NightActions({ busy, run, game, players, fakeTraitors, aliveFaithfuls }) {
  const [murderTarget, setMurderTarget] = useState(null)
  const submissions = game?.murderSubmissions || {}

  return (
    <div>
      {fakeTraitors.length > 0 ? (
        <>
          <div style={{
            background: '#1e293b', borderRadius: 6, padding: '6px 10px',
            marginBottom: 8, fontSize: 10,
          }}>
            <div style={{ color: '#94a3b8', marginBottom: 2 }}>Fake traitors</div>
            <div style={{ color: '#fca5a5' }}>{fakeTraitors.map(t => t.name).join(', ')}</div>
            <div style={{ color: '#475569', marginTop: 4 }}>
              {fakeTraitors.filter(t => submissions[t.id]).length} / {fakeTraitors.length} submitted
            </div>
          </div>

          {/* Target picker */}
          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>
            Pick murder target:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            {aliveFaithfuls.map(p => {
              const char = CHARACTERS[p.character]
              const isSelected = murderTarget === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setMurderTarget(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: isSelected ? '#7f1d1d' : '#1e293b',
                    border: isSelected ? '1px solid #fca5a5' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  <span>{char?.emoji ?? '?'}</span>
                  <span style={{ flex: 1, color: isSelected ? '#fca5a5' : '#cbd5e1' }}>{p.name}</span>
                  {isSelected && <span style={{ color: '#fca5a5' }}>target</span>}
                </div>
              )
            })}
          </div>
          <ActionButton
            disabled={busy || !murderTarget}
            color="#7c3aed"
            onClick={() => run(() => autoMurder(game.id, fakeTraitors, aliveFaithfuls, murderTarget), 'Murder submitted')}
          >
            Submit Murder
            <Badge bg="#581c87" color="#e9d5ff">
              {murderTarget ? aliveFaithfuls.find(p => p.id === murderTarget)?.name : 'pick target'}
            </Badge>
          </ActionButton>
        </>
      ) : (
        <EmptyState>No fake traitors alive.</EmptyState>
      )}

      {Object.keys(submissions).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>
            SUBMISSIONS
          </div>
          {Object.entries(submissions).map(([tid, victimId]) => {
            const traitor = players.find(p => p.id === tid)
            const victim  = players.find(p => p.id === victimId)
            return (
              <div key={tid} style={{
                fontSize: 10, color: '#fca5a5',
                padding: '3px 0',
                borderBottom: '1px solid #1e293b',
              }}>
                {traitor?.name} <span style={{ color: '#475569' }}>→</span> {victim?.name}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VotesTable({ entries, players }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: '#475569', fontSize: 9, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>
        CURRENT VOTES
      </div>
      {entries.map(([vid, targetId]) => {
        const voter  = players.find(p => p.id === vid)
        const target = players.find(p => p.id === targetId)
        return (
          <div key={vid} style={{
            fontSize: 10, padding: '3px 0',
            borderBottom: '1px solid #1e293b',
            display: 'flex', gap: 6,
          }}>
            <span style={{ color: '#cbd5e1', flex: 1 }}>{voter?.name}</span>
            <span style={{ color: '#475569' }}>→</span>
            <span style={{ color: '#fbbf24', flex: 1, textAlign: 'right' }}>{target?.name}</span>
          </div>
        )
      })}
    </div>
  )
}
