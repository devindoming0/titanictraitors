import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const FAKE_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank']

export function fakePlayerId(i) {
  return `debug_${i}`
}

// Add fake players to fill the lobby up to targetCount total players
export async function fillWithFakePlayers(gameId, currentPlayers, targetCount) {
  const realCount = currentPlayers.length
  const needed = targetCount - realCount
  if (needed <= 0) return

  const usedNames = new Set(currentPlayers.map(p => p.name))
  const availableNames = FAKE_NAMES.filter(n => !usedNames.has(n))

  for (let i = 0; i < needed; i++) {
    const id = fakePlayerId(Date.now() + i)
    await setDoc(doc(db, 'games', gameId, 'players', id), {
      name: availableNames[i] ?? `Bot ${i + 1}`,
      character: null,
      role: null,
      isAlive: true,
      abilityUsed: false,
      behaviorCard: null,
      isDebug: true,
      joinedAt: serverTimestamp(),
    })
  }
}

// Fake alive players vote for a random nominee
export async function autoVoteFakes(gameId, fakePlayers, nominees) {
  if (!nominees?.length) return
  const aliveFakes = fakePlayers.filter(p => p.isAlive && p.isDebug)
  for (const player of aliveFakes) {
    const target = nominees[Math.floor(Math.random() * nominees.length)]
    await updateDoc(doc(db, 'games', gameId), {
      [`votes.${player.id}`]: target,
    })
  }
}

// Fake traitors each submit a murder target (specific ID or random faithful)
export async function autoMurder(gameId, fakeTraitors, aliveFaithfuls, targetId) {
  if (!aliveFaithfuls?.length) return
  const resolvedId = targetId || aliveFaithfuls[Math.floor(Math.random() * aliveFaithfuls.length)].id
  for (const traitor of fakeTraitors) {
    await updateDoc(doc(db, 'games', gameId), {
      [`murderSubmissions.${traitor.id}`]: resolvedId,
    })
  }
}
