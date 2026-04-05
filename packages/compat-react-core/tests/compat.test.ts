import { describe, expect, it } from 'vitest'
import * as compat from '../src/index'
import * as adapters from '../src/adapters'

describe('@agentskit-react/core compatibility package', () => {
  it('re-exports the React surface', () => {
    expect(compat).toHaveProperty('useChat')
    expect(compat).toHaveProperty('ChatContainer')
  })

  it('re-exports adapters under the legacy subpath', () => {
    expect(adapters).toHaveProperty('openai')
    expect(adapters).toHaveProperty('anthropic')
  })
})
