import { useState } from 'react'

const SLIDES = [
  {
    title: 'Welcome Aboard',
    icon: '🚢',
    body: 'Titanic Traitors is a social deduction game for 3\u20138 players, designed for a 6-day cruise. One or two of you are secret traitors. The rest are faithful passengers.',
  },
  {
    title: 'The Traitors',
    icon: '🗡',
    body: 'Traitors know each other from the start. Their goal: eliminate faithful passengers one by one without being caught. With 7\u20138 players, there are two traitors.',
  },
  {
    title: 'Daytime',
    icon: '☀️',
    body: 'During the day, everyone mingles and discusses suspicions. Watch for odd behaviors, shifting stories, or nervous glances. Trust no one completely.',
  },
  {
    title: 'Evening Dinner',
    icon: '🍽',
    body: 'Each evening, all passengers vote to banish one person from the ship. You have a limited time to cast your vote \u2014 and you can change it until the timer runs out.',
  },
  {
    title: 'The Banishment',
    icon: '⚖',
    body: 'The passenger with the most votes is banished and their true role is revealed. If all traitors are banished, the faithful passengers win!',
  },
  {
    title: 'Nightfall',
    icon: '🌊',
    body: 'After dinner, the traitor secretly chooses a faithful passenger to murder. One hour later, the victim is announced. If two traitors disagree on a target, the first submission is used.',
  },
  {
    title: 'Winning the Game',
    icon: '🏆',
    body: 'Faithful passengers win by banishing all traitors. Traitors win when they equal or outnumber the faithful \u2014 at that point, they control the vote and cannot be stopped.',
  },
  {
    title: 'Ready to Sail',
    icon: '✦',
    body: 'Create a game and share the 4-letter code with your group. Everyone joins on their own device. The host controls when each phase begins. Good luck, and watch your back.',
  },
]

export default function Tutorial({ onClose }) {
  const [page, setPage] = useState(0)
  const slide = SLIDES[page]
  const isLast = page === SLIDES.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8, 12, 24, 0.92)',
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Slide content */}
        <div className="fade-in" key={page} style={{
          textAlign: 'center',
          width: '100%',
        }}>
          <p style={{ fontSize: '3rem', marginBottom: 8 }}>
            {slide.icon}
          </p>
          <h2 style={{
            fontFamily: 'Cinzel, serif',
            color: 'var(--gold)',
            fontSize: '1.4rem',
            marginBottom: 16,
            letterSpacing: '0.05em',
          }}>
            {slide.title}
          </h2>
          <p style={{
            color: 'var(--text)',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            maxWidth: 340,
            margin: '0 auto',
          }}>
            {slide.body}
          </p>
        </div>

        {/* Dots */}
        <div style={{
          display: 'flex', gap: 8,
          marginTop: 32, marginBottom: 32,
        }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === page ? 'var(--gold)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.2s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex', gap: 12,
          width: '100%', maxWidth: 340,
        }}>
          {page > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setPage(p => p - 1)}
              style={{ flex: 1 }}
            >
              Back
            </button>
          )}
          {!isLast ? (
            <button
              className="btn btn-primary"
              onClick={() => setPage(p => p + 1)}
              style={{ flex: 1 }}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-primary pulse"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Set Sail
            </button>
          )}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onClose}
            style={{
              marginTop: 16,
              background: 'none', border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: 'Crimson Text, serif',
            }}
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  )
}
