import { describe, expect, it } from 'vitest'
import * as inkPackage from '../src/index'

describe('@agentskit/ink', () => {
  it('exports a terminal useChat hook and terminal components', () => {
    expect(inkPackage).toHaveProperty('useChat')
    expect(inkPackage).toHaveProperty('ChatContainer')
    expect(inkPackage).toHaveProperty('InputBar')
  })
})
