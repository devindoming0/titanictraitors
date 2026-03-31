import { createContext, useContext, useEffect, useState } from 'react'
import { onSnapshot, doc, collection } from 'firebase/firestore'
import { db } from '../firebase'

const GameContext = createContext(null)

export function GameProvider({ children, session }) {
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.gameId) {
      setLoading(false)
      return
    }
    const { gameId } = session

    const unsubGame = onSnapshot(doc(db, 'games', gameId), snap => {
      setGame(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })

    const unsubPlayers = onSnapshot(collection(db, 'games', gameId, 'players'), snap => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubGame(); unsubPlayers() }
  }, [session?.gameId])

  const currentPlayer = players.find(p => p.id === session?.playerId) ?? null
  const isHost = !!game && game.hostId === session?.playerId

  return (
    <GameContext.Provider value={{ game, players, currentPlayer, isHost, loading }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => useContext(GameContext)
