export const CHARACTERS = {
  jack: {
    name: 'Jack Dawson',
    title: 'The Charming Drifter',
    quote: '"I figure life\'s a gift and I don\'t intend on wasting it."',
    emoji: '🎨',
    ability: 'Sketch Artist',
    abilityDesc: 'Once per game, secretly observe one player. Tell the host in private — they\'ll tell you if that player is Traitor or Faithful.',
  },
  rose: {
    name: 'Rose DeWitt Bukater',
    title: 'The Rebel Heir',
    quote: '"I saw my whole life as if I\'d already lived it."',
    emoji: '💎',
    ability: 'Heart of the Ocean',
    abilityDesc: 'Once per game, veto a banishment vote before the result is announced. The vote reruns without your nominee.',
  },
  molly: {
    name: 'Molly Brown',
    title: 'The Unsinkable One',
    quote: '"I\'m not going to let a little cold water stop me."',
    emoji: '⚓',
    ability: 'The Lifeboat',
    abilityDesc: 'Once per game, protect one player from murder tonight. Tell the host privately before the night phase ends.',
  },
  andrews: {
    name: 'Thomas Andrews',
    title: 'The Architect',
    quote: '"I know what she can\'t do."',
    emoji: '📐',
    ability: 'Blueprints',
    abilityDesc: 'Once per game, the host privately reveals the role of one randomly selected living player.',
  },
  cal: {
    name: 'Cal Hockley',
    title: 'The Steel Heir',
    quote: '"I make my own luck."',
    emoji: '💰',
    ability: 'Bribe',
    abilityDesc: 'Once per game, secretly offer another player: their vote for your protection from nomination. You don\'t have to honor it.',
  },
  ruth: {
    name: 'Ruth DeWitt Bukater',
    title: 'The Iron Matriarch',
    quote: '"This is not a discussion."',
    emoji: '🪞',
    ability: 'Social Register',
    abilityDesc: 'Once per game, force one player into the nomination pool before nominations open.',
  },
  smith: {
    name: 'Captain Edward Smith',
    title: 'The Commander',
    quote: '"I\'ve been captain of this vessel for thirty years."',
    emoji: '🎖️',
    ability: "Ship's Order",
    abilityDesc: 'Once per game, call for a re-vote immediately after a result. Second result is final. Cannot use on Day 6 or unanimous votes.',
  },
  celine: {
    name: 'Celine Dion',
    title: 'The Songstress',
    quote: '"Near, far, wherever you are..."',
    emoji: '🎵',
    ability: 'My Heart Will Go On',
    abilityDesc: 'Once per game, ask a murdered player one yes/no question aloud. They must answer honestly — even if they were the Traitor.',
  },
}

// Character order for player count (Jack, Rose, Celine always included)
const CHAR_BY_COUNT = {
  3: ['jack', 'rose', 'celine'],
  4: ['jack', 'rose', 'molly', 'celine'],
  5: ['jack', 'rose', 'molly', 'andrews', 'celine'],
  6: ['jack', 'rose', 'molly', 'andrews', 'cal', 'celine'],
  7: ['jack', 'rose', 'molly', 'andrews', 'cal', 'ruth', 'celine'],
  8: ['jack', 'rose', 'molly', 'andrews', 'cal', 'ruth', 'smith', 'celine'],
}

export function getCharactersForCount(count) {
  return CHAR_BY_COUNT[Math.min(Math.max(count, 3), 8)] || CHAR_BY_COUNT[8]
}

export const BEHAVIORS = [
  'Always check your phone before responding to a question.',
  'Take a sip of your drink right after someone else does.',
  'Cross your arms whenever you are listening to someone speak.',
  'Tap the table or a surface lightly before you start talking.',
  'Always be the last person to sit down.',
  'Scratch or touch the side of your neck when asked a direct question.',
  'Clear your throat before changing the subject.',
  'Glance toward the nearest exit whenever someone new joins the conversation.',
  'Rest your chin on your hand when someone else is making a point.',
  'Always agree with the first opinion stated, then quietly walk it back later.',
  'Offer to refill someone else\'s drink at least once per gathering.',
  'Stretch or adjust your posture right after someone accuses anyone.',
]

export function traitorCount(playerCount) {
  return playerCount >= 7 ? 2 : 1
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
