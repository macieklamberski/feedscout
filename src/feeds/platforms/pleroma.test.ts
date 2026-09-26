import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isPleromaHtml, pleromaHandler } from './pleroma.js'

const pleromaHtml =
  '<html><head><link rel="preload" href="/api/pleroma/frontend_configurations" as="fetch"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('pleromaHandler', () => {
  describe('isPleromaHtml', () => {
    it('should return true for content referencing /api/pleroma/', () => {
      expect(isPleromaHtml(pleromaHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isPleromaHtml('<a href="/API/Pleroma/admin">x</a>')).toBe(true)
    })

    it('should return false for non-Pleroma content', () => {
      expect(isPleromaHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Pleroma content', () => {
      expect(pleromaHandler.match('https://example.com/users/lain', pleromaHtml)).toBe(true)
    })

    it('should return true for profile URL with Pleroma content with a capitalized users segment', () => {
      expect(pleromaHandler.match('https://example.com/Users/lain', pleromaHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(pleromaHandler.match('https://example.com/users/lain')).toBe(false)
    })

    it('should return false for non-Pleroma content', () => {
      expect(pleromaHandler.match('https://example.com/users/lain', otherHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(pleromaHandler.match('https://example.com/about', pleromaHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(pleromaHandler.match('not-a-url', pleromaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for profile', () => {
      const value = 'https://example.com/users/lain'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/users/lain/feed.atom',
          hint: { key: 'pleroma:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/users/lain/feed.rss',
          hint: { key: 'pleroma:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pleromaHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed regardless of subpath', () => {
      const value = 'https://example.com/users/lain/statuses'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/users/lain/feed.atom',
          hint: { key: 'pleroma:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/users/lain/feed.rss',
          hint: { key: 'pleroma:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pleromaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      expect(pleromaHandler.resolve('https://example.com/about')).toEqual([])
    })
  })
})
