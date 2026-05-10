import { describe, expect, it } from 'bun:test'
import { friendicaHandler, isFriendicaHtml } from './friendica.js'

const friendicaHtml =
  '<html><head><meta name="generator" content="Friendica 2026.01"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('friendicaHandler', () => {
  describe('isFriendicaHtml', () => {
    it('should return true for Friendica generator meta tag', () => {
      expect(isFriendicaHtml(friendicaHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isFriendicaHtml('<meta name="generator" content="friendica 2026">')).toBe(true)
      expect(isFriendicaHtml('<meta name="generator" content="FRIENDICA">')).toBe(true)
    })

    it('should return false for non-Friendica generator', () => {
      expect(isFriendicaHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Friendica content', () => {
      expect(friendicaHandler.match('https://libranet.de/profile/admin', friendicaHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(friendicaHandler.match('https://libranet.de/profile/admin')).toBe(false)
    })

    it('should return false for non-Friendica content', () => {
      expect(friendicaHandler.match('https://libranet.de/profile/admin', otherHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(friendicaHandler.match('https://libranet.de/about', friendicaHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(friendicaHandler.match('not-a-url', friendicaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return posts and comments feeds for profile', () => {
      const value = 'https://libranet.de/profile/admin'
      const expected = [
        {
          uri: 'https://libranet.de/feed/admin',
          hint: { key: 'friendica:posts', label: 'Posts' },
        },
        {
          uri: 'https://libranet.de/feed/admin/comments',
          hint: { key: 'friendica:comments', label: 'Comments' },
        },
      ]

      expect(friendicaHandler.resolve(value)).toEqual(expected)
    })

    it('should return both feeds regardless of subpath', () => {
      const value = 'https://libranet.de/profile/admin/photos'
      const expected = [
        {
          uri: 'https://libranet.de/feed/admin',
          hint: { key: 'friendica:posts', label: 'Posts' },
        },
        {
          uri: 'https://libranet.de/feed/admin/comments',
          hint: { key: 'friendica:comments', label: 'Comments' },
        },
      ]

      expect(friendicaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      expect(friendicaHandler.resolve('https://libranet.de/about')).toEqual([])
    })

    it('should return empty array for invalid URL', () => {
      expect(friendicaHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
