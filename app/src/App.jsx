import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from './firebase'
import { GameProvider } from './context/GameContext'

import HomeScreen    from './screens/HomeScreen'
import LobbyScreen   from './screens/LobbyScreen'
import RevealScreen  from './screens/RevealScreen'
import GameScreen    from './screens/GameScreen'
import GameOverScreen from './screens/GameOverScreen'

function loadSession() {
  try { return JSON.parse(localStorage.getItem('tt_session') || 'null') } catch { return null }
}

function saveSession(session) {
  localStorage.setItem('tt_session', JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem('tt_session')
}

export default function App() {
  const [authUid, setAuthUid] = useState(null)
  const [session, setSession] = useState(loadSession)
  const [screen, setScreen] = useState(session?.gameId ? 'lobby' : 'home')

  // Anonymous auth — persists across refreshes in Firebase SDK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setAuthUid(user.uid)
        // If session exists but UID changed (new device), clear it
        if (session && session.playerId !== user.uid) {
          setSession(null)
          clearSession()
          setScreen('home')
        }
      } else {
        signInAnonymously(auth)
      }
    })
    return unsub
  }, [])

  function navigate(newScreen, newSession) {
    if (newSession) {
      const s = { ...session, ...newSession }
      setSession(s)
      saveSession(s)
    }
    setScreen(newScreen)
  }

  function handleRevealDone() {
    const s = { ...session, revealed: true }
    setSession(s)
    saveSession(s)
    setScreen('game')
  }

  function handleReset() {
    clearSession()
    setSession(null)
    setScreen('home')
  }

  if (!authUid) {
    return (
      <div className="screen screen-center">
        <p className="ornament">✦ ─── ✦ ─── ✦</p>
        <h1 className="title-main" style={{ marginTop: 16 }}>Titanic Traitors</h1>
        <p className="info-msg" style={{ marginTop: 24 }}>Boarding the vessel…</p>
      </div>
    )
  }

  return (
    <GameProvider session={session}>
      {screen === 'home' &&
        <HomeScreen authUid={authUid} onNavigate={navigate} />}
      {screen === 'lobby' &&
        <LobbyScreen onNavigate={navigate} onReset={handleReset} />}
      {screen === 'reveal' &&
        <RevealScreen onDone={handleRevealDone} />}
      {screen === 'game' &&
        <GameScreen onGameOver={() => setScreen('gameover')} onNavigateReveal={() => setScreen('reveal')} />}
      {screen === 'gameover' &&
        <GameOverScreen onPlayAgain={handleReset} />}
    </GameProvider>
  )
}
