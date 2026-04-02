import { useState } from 'react'
import { createGame, joinGame } from '../lib/gameActions'

const DEFAULT_SETTINGS = {
  suspiciousBehavior: true,
  characterAbilities: false,
  ghostWhisper: false,
  lockedRoom: false,
  voteTimerMinutes: 7,
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-text">
        <strong>{label}</strong>
        <span>{desc}</span>
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

export default function HomeScreen({ authUid, onNavigate }) {
  const [view, setView] = useState('home') // 'home' | 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setSetting(key, val) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name.'); return }
    setLoading(true); setError('')
    try {
      const { gameId } = await createGame(authUid, name.trim(), settings)
      onNavigate('lobby', { gameId, playerId: authUid })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!name.trim()) { setError('Enter your name.'); return }
    if (!code.trim()) { setError('Enter a game code.'); return }
    setLoading(true); setError('')
    try {
      const { gameId } = await joinGame(code.trim(), authUid, name.trim())
      onNavigate('lobby', { gameId, playerId: authUid })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (view === 'home') {
    return (
      <div className="screen screen-center fade-in">
        <p className="ornament">✦ ─── ✦ ─── ✦</p>
        <h1 className="title-main" style={{ marginTop: 12 }}>Titanic<br />Traitors</h1>
        <p className="title-sub">A cruise ship deduction game</p>
        <p className="ornament" style={{ marginTop: 8 }}>✦ ─── ✦ ─── ✦</p>

        <div style={{ width: '100%', marginTop: 48 }}>
          <button className="btn btn-primary pulse" onClick={() => setView('create')}>
            Host a Game
          </button>
          <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => setView('join')}>
            Join a Game
          </button>
        </div>

        <p className="info-msg" style={{ marginTop: 32 }}>
          For 3–8 players · Designed for a 6-day cruise
        </p>
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <p className="title-day">New Voyage</p>
          <h2 style={{ color: 'var(--gold)', fontFamily: 'Cinzel', fontSize: '1.4rem', marginTop: 6 }}>
            Host a Game
          </h2>
        </div>

        <div className="field">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="e.g. Jack Dawson"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>

        <p className="section-title" style={{ marginTop: 8 }}>Optional Rules</p>
        <Toggle
          label="Suspicious Behavior"
          desc="Traitors must perform a quirky behavior each day."
          checked={settings.suspiciousBehavior}
          onChange={v => setSetting('suspiciousBehavior', v)}
        />
        <Toggle
          label="Character Abilities"
          desc="Each character has a one-use special power."
          checked={settings.characterAbilities}
          onChange={v => setSetting('characterAbilities', v)}
        />
        <Toggle
          label="Ghost Whisper"
          desc="Murdered players can send one hint before midnight."
          checked={settings.ghostWhisper}
          onChange={v => setSetting('ghostWhisper', v)}
        />
        <Toggle
          label="Locked Room"
          desc="Once per game, a player can be immune from murder tonight."
          checked={settings.lockedRoom}
          onChange={v => setSetting('lockedRoom', v)}
        />

        <p className="section-title" style={{ marginTop: 16 }}>Timers</p>
        <div className="toggle-row">
          <div className="toggle-text">
            <strong>Vote Timer</strong>
            <span>How long players have to cast their banishment vote.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={settings.voteTimerMinutes}
              onChange={e => setSetting('voteTimerMinutes', Number(e.target.value))}
              style={{
                background: 'var(--bg-card)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '6px 10px', fontFamily: 'Cinzel', fontSize: '0.9rem',
              }}
            >
              {[3, 5, 7, 10, 15].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create Game'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setView('home'); setError('') }}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  if (view === 'join') {
    return (
      <div className="screen fade-in">
        <div className="screen-header">
          <p className="title-day">Board the Ship</p>
          <h2 style={{ color: 'var(--gold)', fontFamily: 'Cinzel', fontSize: '1.4rem', marginTop: 6 }}>
            Join a Game
          </h2>
        </div>

        <div className="field">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="e.g. Rose DeWitt"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Game Code</label>
          <input
            type="text"
            placeholder="e.g. X7KQ"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center' }}
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining…' : 'Join Game'}
          </button>
          <button className="btn btn-ghost" onClick={() => { setView('home'); setError('') }}>
            ← Back
          </button>
        </div>
      </div>
    )
  }
}
