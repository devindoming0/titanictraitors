const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

const MURDER_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkWinConditions(players) {
  const alive = players.filter(p => p.isAlive)
  const traitors  = alive.filter(p => p.role === 'traitor')
  const faithfuls = alive.filter(p => p.role === 'faithful')
  if (traitors.length === 0) return 'faithfuls'
  if (traitors.length >= faithfuls.length) return 'traitors'
  return null
}

async function getPlayers(gameId) {
  const snap = await db.collection('games').doc(gameId).collection('players').get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Trigger: night phase started ─────────────────────────────────────────────
// When the host finalises the banishment vote and phase flips to 'night',
// stamp a nightEndsAt deadline 1 hour out. The client uses this for the
// countdown timer. The scheduled function below enforces it server-side.

exports.onNightStart = onDocumentUpdated('games/{gameId}', async (event) => {
  const before = event.data.before.data()
  const after  = event.data.after.data()

  const justEnteredNight = before.phase !== 'night' && after.phase === 'night'
  if (!justEnteredNight) return null

  const nightEndsAt = admin.firestore.Timestamp.fromMillis(Date.now() + MURDER_WINDOW_MS)

  await event.data.after.ref.update({ nightEndsAt })
  console.log(`[${event.params.gameId}] Night started. Murder window closes at ${nightEndsAt.toDate().toISOString()}`)
  return null
})

// ─── Scheduled: process expired nights every 5 minutes ────────────────────────
// Finds every active game whose murder window has elapsed, resolves the
// murder target, updates player state, and sets the phase to 'morning'.
// All connected clients receive the Firestore update instantly via onSnapshot.

exports.processMurders = onSchedule('every 5 minutes', async () => {
  const now = admin.firestore.Timestamp.now()

  const expiredSnap = await db.collection('games')
    .where('status', '==', 'active')
    .where('phase', '==', 'night')
    .where('nightEndsAt', '<=', now)
    .get()

  if (expiredSnap.empty) {
    console.log('No expired nights to process.')
    return
  }

  console.log(`Processing ${expiredSnap.size} expired night(s).`)

  for (const gameDoc of expiredSnap.docs) {
    await processMurderForGame(gameDoc)
  }
})

async function processMurderForGame(gameDoc) {
  const game    = gameDoc.data()
  const gameId  = gameDoc.id
  const players = await getPlayers(gameId)

  const aliveTraitors  = players.filter(p => p.isAlive && p.role === 'traitor')
  const aliveFaithfuls = players.filter(p => p.isAlive && p.role === 'faithful')
  const submissions    = game.murderSubmissions || {}

  // Resolve murder target:
  // - 1 traitor:  use their submission
  // - 2 traitors: prefer unanimous pick, fall back to first submission
  let murderedId = null

  if (aliveTraitors.length === 1) {
    murderedId = submissions[aliveTraitors[0].id] || null
  } else if (aliveTraitors.length >= 2) {
    const votes = aliveTraitors.map(t => submissions[t.id]).filter(Boolean)
    const agreed = votes.find(id => votes.filter(x => x === id).length === aliveTraitors.length)
    murderedId = agreed || votes[0] || null
  }

  // If the traitor submitted nobody (missed the window), no murder this round
  const murdered = murderedId ? players.find(p => p.id === murderedId) : null

  // Compute new state after murder
  const updatedPlayers = players.map(p =>
    p.id === murderedId ? { ...p, isAlive: false } : p
  )
  const winner = checkWinConditions(updatedPlayers)

  const batch = db.batch()

  if (murderedId) {
    batch.update(
      db.collection('games').doc(gameId).collection('players').doc(murderedId),
      { isAlive: false }
    )
  }

  const gameUpdate = {
    lastMurdered: murdered
      ? { playerId: murderedId, character: murdered.character, name: murdered.name }
      : null,
    murderSubmissions: {},
    nightEndsAt: null,
    day: (game.day || 1) + 1,
    phase: winner ? 'ended' : 'morning',
    ...(winner ? { status: 'ended', winner } : {}),
  }

  batch.update(db.collection('games').doc(gameId), gameUpdate)
  await batch.commit()

  if (winner) {
    console.log(`[${gameId}] Game over — ${winner} win.`)
  } else if (murdered) {
    console.log(`[${gameId}] ${murdered.name} was murdered. Day ${game.day + 1} begins.`)
  } else {
    console.log(`[${gameId}] No murder submitted. Day ${game.day + 1} begins.`)
  }
}
