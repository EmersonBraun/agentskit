import React, { useState, type ReactNode } from 'react'

interface ExampleWrapperProps {
  children: ReactNode
  title: string
  description?: string
  source?: string
}

export function ExampleWrapper({ children, title, description, source }: ExampleWrapperProps) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div style={{
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '2rem',
    }}>
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        background: 'var(--ifm-color-emphasis-100)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <strong>{title}</strong>
          {description && (
            <span style={{ marginLeft: '0.75rem', color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem' }}>
              {description}
            </span>
          )}
        </div>
        {source && (
          <button
            onClick={() => setShowSource(!showSource)}
            style={{
              background: 'none',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '6px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--ifm-color-emphasis-700)',
            }}
          >
            {showSource ? 'Hide Code' : 'Show Code'}
          </button>
        )}
      </div>
      <div style={{ padding: '1.5rem' }}>
        {children}
      </div>
      {showSource && source && (
        <div style={{
          borderTop: '1px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-color-emphasis-100)',
        }}>
          <pre style={{ margin: 0, padding: '1rem 1.5rem', fontSize: '0.85rem', overflow: 'auto' }}>
            <code>{source}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
