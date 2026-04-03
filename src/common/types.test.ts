import { describe, expect, it } from 'bun:test'
import { discoverMethodOrder } from './types.js'

describe('discoverMethodOrder', () => {
  it('should equal expected order', () => {
    expect(discoverMethodOrder).toEqual(['platform', 'feed', 'html', 'headers', 'guess'])
  })
})
