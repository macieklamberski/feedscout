import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { lobstersHandler } from './lobsters.js'

describe('lobstersHandler', () => {
  describe('match', () => {
    it('should match user URLs', () => {
      expect(lobstersHandler.match('https://lobste.rs/~jcs')).toBe(true)
      expect(lobstersHandler.match('https://lobste.rs/~pushcx')).toBe(true)
    })

    it('should not match homepage', () => {
      expect(lobstersHandler.match('https://lobste.rs')).toBe(false)
      expect(lobstersHandler.match('https://lobste.rs/')).toBe(false)
    })

    it('should not match tag pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/t/programming')).toBe(false)
    })

    it('should not match domain pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/domains/github.com')).toBe(false)
    })

    it('should not match top pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/top')).toBe(false)
    })

    it('should not match newest pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/newest')).toBe(false)
    })

    it('should not match non-lobsters URLs', () => {
      expect(lobstersHandler.match('https://example.com/~user')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(lobstersHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const value = lobstersHandler.resolve('https://lobste.rs/~jcs')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://lobste.rs/avatars/jcs-100.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve user avatar from user URL with trailing slash', () => {
      const value = lobstersHandler.resolve('https://lobste.rs/~pushcx/')
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://lobste.rs/avatars/pushcx-100.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array for non-user path', () => {
      expect(lobstersHandler.resolve('https://lobste.rs/t/programming')).toEqual([])
    })
  })
})
