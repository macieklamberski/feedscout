import { describe, expect, it } from 'bun:test'
import { lobstersHandler } from './lobsters.js'

describe('lobstersHandler', () => {
  describe('match', () => {
    it('should match user URLs', () => {
      expect(lobstersHandler.match('https://lobste.rs/~jcs')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/t/programming')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected = [{ uri: 'https://lobste.rs/avatars/jcs-100.png' }]

      expect(lobstersHandler.resolve('https://lobste.rs/~jcs')).toEqual(expected)
    })

    it('should return empty array for non-user path', () => {
      expect(lobstersHandler.resolve('https://lobste.rs/t/programming')).toEqual([])
    })
  })
})
