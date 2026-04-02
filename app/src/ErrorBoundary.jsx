import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', background: '#080c18', color: '#e8e0d0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 24, textAlign: 'center',
          fontFamily: 'Georgia, serif',
        }}>
          <p style={{ fontSize: '2rem' }}>⚠</p>
          <h2 style={{ color: '#c9a84c', marginTop: 12, fontSize: '1.2rem' }}>
            Something went wrong
          </h2>
          <pre style={{
            marginTop: 16, padding: 16, background: '#111827',
            borderRadius: 8, fontSize: '0.75rem', color: '#fca5a5',
            maxWidth: 480, overflowX: 'auto', textAlign: 'left',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24, padding: '12px 24px', background: '#c9a84c',
              color: '#080c18', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '1rem',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
