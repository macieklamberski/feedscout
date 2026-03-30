import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { tumblrHandler } from './tumblr.js'

describe('tumblrHandler', () => {
  describe('match', () => {
    it('should match tumblr.com subdomain URLs', () => {
      expect(tumblrHandler.match('https://staff.tumblr.com')).toBe(true)
    })

    it('should match tumblr.com subdomain URLs with path', () => {
      expect(tumblrHandler.match('https://engineering.tumblr.com/post/123')).toBe(true)
    })

    it('should not match tumblr.com root', () => {
      expect(tumblrHandler.match('https://tumblr.com')).toBe(false)
    })

    it('should not match non-tumblr URLs', () => {
      expect(tumblrHandler.match('https://example.com')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(tumblrHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve blog avatar from subdomain URL', () => {
      const value = tumblrHandler.resolve('https://staff.tumblr.com')
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/staff/avatar/512' },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve blog avatar from subdomain URL with path', () => {
      const value = tumblrHandler.resolve('https://engineering.tumblr.com/post/123')
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/engineering/avatar/512' },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve blog avatar from subdomain URL with tagged path', () => {
      const value = tumblrHandler.resolve('https://staff.tumblr.com/tagged/updates')
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/staff/avatar/512' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array for www subdomain', () => {
      const value = tumblrHandler.resolve('https://www.tumblr.com/')

      expect(value).toEqual([])
    })
  })
})
