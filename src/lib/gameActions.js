import {
  doc, collection, addDoc, setDoc, updateDoc, getDocs,
  query, where, writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getCharactersForCount, BEHAVIORS, traitorCount, shuffle } from './characters'

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

function checkWinConditions(players) {
  const alive = players.filter(p => p.isAlive)
  const traitors = alive.filter(p => p.role === 'traitor')
  const faithfuls = alive.filter(p => p.role === 'faithful')
  if (traitors.length === 0) return 'faithfuls'
  if (traitors.length >= faithfuls.length) return 'traitors'
  return null
}

// ─── Game Lifecycle ────────────────────────────────────────────────────────────

export async function createGame(hostUid, hostName, settings) {
  const code = generateCode()
  const gameRef = doc(collection(db, 'games'))

  await setDoc(gameRef, {
    code,
    hostId: hostUid,
    status: 'lobby',
    phase: 'lobby',
    day: 0,
    winner: null,
    lastMurdered: null,
    lastBanished: null,
    nominees: [],
    votes: {},
    murderSubmissions: {},
    settings,
    createdAt: serverTimestamp(),
  })

  // Add host as first player
  await setDoc(doc(db, 'games', gameRef.id, 'players', hostUid), {
    name: hostName,
    character: null,
    role: null,
    isAlive: true,
    abilityUsed: false,
    behaviorCard: null,
    joinedAt: serverTimestamp(),
  })

  return { gameId: gameRef.id, code }
}

export async function joinGame(code, playerUid, playerName) {
  const snap = await getDocs(
    query(collection(db, 'games'), where('code', '==', code.toUpperCase()), where('status', '==', 'lobby'))
  )
  if (snap.empty) throw new Error('Game not found or already started.')

  const gameDoc = snap.docs[0]
  const playersSnap = await getDocs(collection(db, 'games', gameDoc.id, 'players'))
  if (playersSnap.size >= 8) throw new Error('Game is full (max 8 players).')

  // Check if player is already in game (reconnect)
  const existing = playersSnap.docs.find(d => d.id === playerUid)
  if (!existing) {
    await setDoc(doc(db, 'games', gameDoc.id, 'players', playerUid), {
      name: playerName,
      character: null,
      role: null,
      isAlive: true,
      abilityUsed: false,
      behaviorCard: null,
      joinedAt: serverTimestamp(),
    })
  }

  return { gameId: gameDoc.id }
}

export async function startGame(gameId, settings) {
  const playersSnap = await getDocs(collection(db, 'games', gameId, 'players'))
  const players = playersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const count = players.length
  if (count < 3) throw new Error('Need at least 3 players to start.')

  const charKeys = shuffle(getCharactersForCount(count))
  const tCount = traitorCount(count)
  const roles = shuffle([...Array(tCount).fill('traitor'), ...Array(count - tCount).fill('faithful')])
  const shuffledBehaviors = shuffle([...BEHAVIORS])
  const shuffledPlayers = shuffle(players)

  const batch = writeBatch(db)
  let behaviorIdx = 0

  shuffledPlayers.forEach((player, i) => {
    const role = roles[i]
    batch.update(doc(db, 'games', gameId, 'players', player.id), {
      character: charKeys[i],
      role,
      isAlive: true,
      abilityUsed: false,
      behaviorCard: (settings?.suspiciousBehavior && role === 'traitor')
        ? shuffledBehaviors[behaviorIdx++]
        : null,
    })
  })

  batch.update(doc(db, 'games', gameId), {
    status: 'active',
    phase: 'night0',
    day: 1,
  })

  await batch.commit()
}

// ─── Phase Transitions (host only) ────────────────────────────────────────────

export async function advancePhase(gameId, newPhase, extra = {}) {
  await updateDoc(doc(db, 'games', gameId), { phase: newPhase, ...extra })
}

export async function setNominees(gameId, nomineeIds) {
  await updateDoc(doc(db, 'games', gameId), {
    nominees: nomineeIds,
    votes: {},
    phase: 'voting',
  })
}

// ─── Voting ───────────────────────────────────────────────────────────────────

export async function submitVote(gameId, voterId, targetId) {
  await updateDoc(doc(db, 'games', gameId), {
    [`votes.${voterId}`]: targetId,
  })
}

export async function finalizeBanishment(gameId, allPlayers, votes, nominees) {
  // Tally votes
  const tally = Object.fromEntries(nominees.map(id => [id, 0]))
  Object.values(votes).forEach(id => { if (id in tally) tally[id]++ })
  const banishedId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]
  const banished = allPlayers.find(p => p.id === banishedId)

  const updatedPlayers = allPlayers.map(p =>
    p.id === banishedId ? { ...p, isAlive: false } : p
  )
  const winner = checkWinConditions(updatedPlayers)

  const batch = writeBatch(db)
  batch.update(doc(db, 'games', gameId, 'players', banishedId), { isAlive: false })
  batch.update(doc(db, 'games', gameId), {
    lastBanished: { playerId: banishedId, character: banished.character, name: banished.name, role: banished.role },
    votes: {},
    nominees: [],
    murderSubmissions: {},
    phase: winner ? 'ended' : 'night',
    ...(winner ? { status: 'ended', winner } : {}),
  })
  await batch.commit()
}

// ─── Murder ───────────────────────────────────────────────────────────────────
// Murder resolution is handled server-side by the Cloud Function (functions/index.js).
// The client only submits the traitor's choice. The function processes it after
// the 1-hour window and pushes the result to all clients via Firestore.

export async function submitMurder(gameId, traitorId, targetId) {
  await updateDoc(doc(db, 'games', gameId), {
    [`murderSubmissions.${traitorId}`]: targetId,
  })
}

// Client-side murder resolution — used by host to advance from night phase
// without waiting for Cloud Functions. Same logic as functions/index.js.
// Client-side murder resolution — host advances from night without Cloud Functions.
// Same logic as functions/index.js processMurderForGame.
export async function resolveMurder(gameId, allPlayers, game) {
  const aliveTraitors = allPlayers.filter(p => p.isAlive && p.role === 'traitor')
  const submissions = game.murderSubmissions || {}

  let murderedId = null
  if (aliveTraitors.length === 1) {
    murderedId = submissions[aliveTraitors[0].id] || null
  } else if (aliveTraitors.length >= 2) {
    const votes = aliveTraitors.map(t => submissions[t.id]).filter(Boolean)
    const agreed = votes.find(id => votes.filter(x => x === id).length === aliveTraitors.length)
    murderedId = agreed || votes[0] || null
  }

  const murdered = murderedId ? allPlayers.find(p => p.id === murderedId) : null
  const updatedPlayers = allPlayers.map(p =>
    p.id === murderedId ? { ...p, isAlive: false } : p
  )
  const winner = checkWinConditions(updatedPlayers)

  const batch = writeBatch(db)

  if (murderedId) {
    batch.update(doc(db, 'games', gameId, 'players', murderedId), { isAlive: false })
  }

  batch.update(doc(db, 'games', gameId), {
    lastMurdered: murdered
      ? { playerId: murderedId, character: murdered.character, name: murdered.name }
      : null,
    murderSubmissions: {},
    nightEndsAt: null,
    day: (game.day || 1) + 1,
    phase: winner ? 'ended' : 'morning',
    ...(winner ? { status: 'ended', winner } : {}),
  })

  await batch.commit()
}
