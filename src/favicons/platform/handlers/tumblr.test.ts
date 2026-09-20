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
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/staff/avatar/512' },
      ]

      expect(tumblrHandler.resolve('https://staff.tumblr.com')).toEqual(expected)
    })

    it('should resolve blog avatar from subdomain URL with path', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/engineering/avatar/512' },
      ]

      expect(tumblrHandler.resolve('https://engineering.tumblr.com/post/123')).toEqual(expected)
    })

    it('should resolve blog avatar from subdomain URL with tagged path', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://api.tumblr.com/v2/blog/staff/avatar/512' },
      ]

      expect(tumblrHandler.resolve('https://staff.tumblr.com/tagged/updates')).toEqual(expected)
    })

    it('should return empty array for www subdomain', () => {
      expect(tumblrHandler.resolve('https://www.tumblr.com/')).toEqual([])
    })

    it.todo('should return empty array for bare tumblr.com URL', () => {
      // resolve('https://tumblr.com') currently returns the avatar URL for a blog named "tumblr"
      // because the hostname label is treated as the blog name and only match guards the bare
      // domain; the desired contract is undecided.
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
