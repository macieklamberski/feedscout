import { describe, expect, it } from 'bun:test'
import { help, options } from './cli.js'

describe('help', () => {
  it('should list every option', () => {
    for (const key of Object.keys(options ?? {})) {
      expect(help).toContain(`--${key}`)
    }
  })
})
