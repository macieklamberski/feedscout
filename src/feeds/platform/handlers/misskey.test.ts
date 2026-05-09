import { describe, expect, it } from 'bun:test'
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

    it('should return false for non-Misskey application-name', () => {
      expect(isMisskeyHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Misskey content', () => {
      expect(misskeyHandler.match('https://misskey.io/@ai', misskeyHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(misskeyHandler.match('https://misskey.io/@ai')).toBe(false)
    })

    it('should return false for non-Misskey content', () => {
      expect(misskeyHandler.match('https://misskey.io/@ai', otherHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(misskeyHandler.match('https://misskey.io/explore', misskeyHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(misskeyHandler.match('not-a-url', misskeyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for profile', () => {
      const value = 'https://misskey.io/@ai'
      const expected = [
        {
          uri: 'https://misskey.io/@ai.atom',
          hint: { key: 'misskey:posts', label: 'Posts' },
        },
      ]

      expect(misskeyHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed regardless of subpath', () => {
      const value = 'https://misskey.io/@ai/notes'
      const expected = [
        {
          uri: 'https://misskey.io/@ai.atom',
          hint: { key: 'misskey:posts', label: 'Posts' },
        },
      ]

      expect(misskeyHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      expect(misskeyHandler.resolve('https://misskey.io/explore')).toEqual([])
    })
  })
})
