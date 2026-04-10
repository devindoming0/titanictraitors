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

const TEST_PLAN = [
  {
    group: 'Lobby & Setup',
    items: [
      { id: 'create-game', label: 'Create a new game as host' },
      { id: 'join-code', label: 'Join game with code on a second device/tab' },
      { id: 'fill-bots', label: 'Fill lobby with bots (debug panel)' },
      { id: 'settings-persist', label: 'Verify settings (vote timer, suspicious behavior) saved correctly' },
      { id: 'start-game', label: 'Start game — roles and characters assigned' },
      { id: 'reconnect', label: 'Refresh browser mid-game — session restored' },
    ],
  },
  {
    group: 'Night 0 (Traitor Reveal)',
    items: [
      { id: 'n0-traitor-sees', label: 'Traitor(s) see each other' },
      { id: 'n0-faithful-waiting', label: 'Faithfuls see waiting screen, no role leak' },
      { id: 'n0-advance', label: 'Host advances to Day 1' },
    ],
  },
  {
    group: 'Day Phase',
    items: [
      { id: 'day-alive-count', label: 'Alive/traitor/day counters are correct' },
      { id: 'day-dead-shown', label: 'Eliminated players shown separately' },
      { id: 'day-begin-dinner', label: 'Host clicks "Begin Evening Dinner" — skips to voting' },
    ],
  },
  {
    group: 'Voting Phase',
    items: [
      { id: 'vote-timer-sync', label: 'Vote timer is synced across devices' },
      { id: 'vote-cast', label: 'Tap nominee to cast vote' },
      { id: 'vote-change', label: 'Tap different nominee — vote switches' },
      { id: 'vote-bar', label: 'Vote tally bar updates in real time' },
      { id: 'vote-waiting', label: '"Waiting on" list updates as players vote' },
      { id: 'vote-bot-auto', label: 'Auto-Vote Bots works (debug panel)' },
      { id: 'vote-finalize-early', label: 'Host can finalize early before timer' },
      { id: 'vote-timer-expire', label: 'Timer expires — auto-finalizes banishment' },
      { id: 'vote-dead-cant', label: 'Dead players cannot vote' },
      { id: 'banish-traitor', label: 'Banish a traitor — role revealed correctly' },
      { id: 'banish-faithful', label: 'Banish a faithful — role revealed correctly' },
    ],
  },
  {
    group: 'Night Phase (Murder)',
    items: [
      { id: 'night-traitor-ui', label: 'Traitor sees target selection UI' },
      { id: 'night-faithful-waiting', label: 'Faithfuls see waiting/dark screen' },
      { id: 'night-submit', label: 'Traitor submits murder target' },
      { id: 'night-debug-pick', label: 'Debug panel: pick specific murder target for bots' },
      { id: 'night-host-resolve', label: 'Host clicks "Resolve Murder" — advances to morning' },
      { id: 'night-no-submit', label: 'No traitor submits — no one dies' },
    ],
  },
  {
    group: 'Morning Phase',
    items: [
      { id: 'morning-murder-banner', label: 'Murdered player shown with character + emoji' },
      { id: 'morning-no-murder', label: '"All Passengers Accounted For" when no murder' },
      { id: 'morning-banish-recap', label: 'Previous banishment result shown with role' },
      { id: 'morning-advance', label: 'Host clicks "Begin Day N" — cycles to day' },
    ],
  },
  {
    group: 'Full Game Cycle',
    items: [
      { id: 'cycle-day-vote-night', label: 'Day → Voting → Night → Morning → Day loop works' },
      { id: 'cycle-day-increments', label: 'Day counter increments each cycle' },
      { id: 'cycle-multi-rounds', label: 'Play through 2+ full rounds without errors' },
    ],
  },
  {
    group: 'Win Conditions',
    items: [
      { id: 'win-faithful-banish', label: 'Faithfuls win: all traitors banished' },
      { id: 'win-faithful-murder', label: 'Faithfuls win: all traitors murdered (edge case)' },
      { id: 'win-traitor', label: 'Traitors win: traitors >= faithfuls' },
      { id: 'win-screen', label: 'Game over screen shows winner + all roles revealed' },
      { id: 'win-play-again', label: '"Play Again" resets to home screen' },
    ],
  },
  {
    group: 'Edge Cases',
    items: [
      { id: 'edge-3-player', label: '3-player game (1 traitor) works correctly' },
      { id: 'edge-7-player', label: '7-8 player game (2 traitors) works correctly' },
      { id: 'edge-2-traitor-agree', label: '2 traitors agree on same target — that player dies' },
      { id: 'edge-2-traitor-disagree', label: '2 traitors disagree — first submission used' },
      { id: 'edge-vote-tie', label: 'Vote tie — first nominee in sorted order banished' },
      { id: 'edge-suspicious-behavior', label: 'Suspicious behavior card assigned to traitor(s)' },
    ],
  },
]

function loadChecked() {
  try { return JSON.parse(localStorage.getItem('tt_test_checked') || '{}') } catch { return {} }
}

export default function DebugPanel() {
  const { game, players, currentPlayer } = useGame()
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState('actions') // 'actions' | 'tests'
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

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
        {[['actions', 'Actions'], ['tests', 'Test Plan']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '7px 0',
              background: 'transparent', border: 'none',
              color: tab === key ? '#f97316' : '#475569',
              borderBottom: tab === key ? '2px solid #f97316' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '75dvh', overflowY: 'auto' }}>

        {/* Test Plan tab */}
        {tab === 'tests' && <TestPlanTab />}

        {/* Actions tab */}
        {tab === 'actions' && <>

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

        </>}

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

function TestPlanTab() {
  const [checked, setChecked] = useState(loadChecked)
  const [collapsed, setCollapsed] = useState({})

  function toggle(id) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    localStorage.setItem('tt_test_checked', JSON.stringify(next))
  }

  function resetAll() {
    setChecked({})
    localStorage.removeItem('tt_test_checked')
  }

  const totalItems = TEST_PLAN.reduce((n, g) => n + g.items.length, 0)
  const doneItems = Object.values(checked).filter(Boolean).length

  return (
    <div style={{ padding: '10px 14px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
            PROGRESS
          </span>
          <span style={{ color: doneItems === totalItems ? '#34d399' : '#f97316', fontSize: 10, fontWeight: 600 }}>
            {doneItems}/{totalItems}
          </span>
        </div>
        <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${(doneItems / totalItems) * 100}%`,
            height: '100%',
            background: doneItems === totalItems ? '#34d399' : '#f97316',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Groups */}
      {TEST_PLAN.map(group => {
        const groupDone = group.items.filter(i => checked[i.id]).length
        const isCollapsed = collapsed[group.group]
        const allDone = groupDone === group.items.length

        return (
          <div key={group.group} style={{ marginBottom: 6 }}>
            <div
              onClick={() => setCollapsed(c => ({ ...c, [group.group]: !c[group.group] }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 0',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <span style={{ color: '#475569', fontSize: 9, width: 10 }}>
                {isCollapsed ? '▸' : '▾'}
              </span>
              <span style={{
                flex: 1,
                color: allDone ? '#34d399' : '#cbd5e1',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}>
                {group.group}
              </span>
              <span style={{
                fontSize: 9,
                color: allDone ? '#34d399' : '#475569',
                fontWeight: 600,
              }}>
                {groupDone}/{group.items.length}
              </span>
            </div>

            {!isCollapsed && (
              <div style={{ paddingLeft: 16 }}>
                {group.items.map(item => {
                  const done = !!checked[item.id]
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                        padding: '3px 0',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{
                        width: 14, height: 14, minWidth: 14,
                        borderRadius: 3,
                        border: done ? '1px solid #34d399' : '1px solid #334155',
                        background: done ? '#34d39922' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: '#34d399',
                        marginTop: 1,
                      }}>
                        {done ? '✓' : ''}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: done ? '#475569' : '#cbd5e1',
                        textDecoration: done ? 'line-through' : 'none',
                        lineHeight: 1.4,
                      }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Reset */}
      <button
        onClick={resetAll}
        style={{
          marginTop: 8,
          padding: '5px 10px',
          background: '#1e293b',
          color: '#64748b',
          border: '1px solid #334155',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 9,
          width: '100%',
        }}
      >
        Reset All Checks
      </button>
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
