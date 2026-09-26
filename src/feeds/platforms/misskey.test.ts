import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isMisskeyHtml, misskeyHandler } from './misskey.js'

const misskeyHtml = '<html><head><meta name="application-name" content="Misskey"></head></html>'
const otherHtml = '<html><head><meta name="application-name" content="Mastodon"></head></html>'

describe('misskeyHandler', () => {
  describe('isMisskeyHtml', () => {
    it('should return true for Misskey application-name meta tag', () => {
      expect(isMisskeyHtml(misskeyHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isMisskeyHtml('<meta name="application-name" content="misskey">')).toBe(true)
      expect(isMisskeyHtml('<meta name="application-name" content="MISSKEY">')).toBe(true)
    })

    it('should return true for Sharkey application-name meta tag', () => {
      expect(isMisskeyHtml('<meta name="application-name" content="Sharkey">')).toBe(true)
    })

    it('should return true for the misskey_meta script without application-name', () => {
      expect(isMisskeyHtml('<script type="application/json" id="misskey_meta">{}</script>')).toBe(
        true,
      )
    })

    it('should return true for a single-quoted misskey_meta id', () => {
      expect(isMisskeyHtml("<script id='misskey_meta'>{}</script>")).toBe(true)
    })

    it('should return false for non-Misskey application-name', () => {
      expect(isMisskeyHtml(otherHtml)).toBe(false)
    })

    it('should return false for empty content', () => {
      expect(isMisskeyHtml('')).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Misskey content', () => {
      expect(misskeyHandler.match('https://example.com/@ai', misskeyHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(misskeyHandler.match('https://example.com/@ai')).toBe(false)
    })

    it('should return false for non-Misskey content', () => {
      expect(misskeyHandler.match('https://example.com/@ai', otherHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(misskeyHandler.match('https://example.com/explore', misskeyHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(misskeyHandler.match('not-a-url', misskeyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom, rss, and json feeds for profile', () => {
      const value = 'https://example.com/@ai'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/@ai.atom',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/@ai.rss',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/@ai.json',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(misskeyHandler.resolve(value)).toEqual(expected)
    })

    it('should return all three formats regardless of subpath', () => {
      const value = 'https://example.com/@ai/notes'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/@ai.atom',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/@ai.rss',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.com/@ai.json',
          hint: { key: 'misskey:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(misskeyHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      expect(misskeyHandler.resolve('https://example.com/explore')).toEqual([])
    })
  })
})
