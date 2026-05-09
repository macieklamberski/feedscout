import { describe, expect, it } from 'bun:test'
import { discourseHandler, isDiscourseHtml } from './discourse.js'

const discourseHtml =
  '<html><head><meta name="generator" content="Discourse 2026.4.0"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('discourseHandler', () => {
  describe('isDiscourseHtml', () => {
    it('should return true for Discourse generator meta tag', () => {
      expect(isDiscourseHtml(discourseHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isDiscourseHtml('<meta name="generator" content="discourse">')).toBe(true)
      expect(isDiscourseHtml('<meta name="generator" content="DISCOURSE">')).toBe(true)
    })

    it('should return false for non-Discourse generator', () => {
      expect(isDiscourseHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for any URL with Discourse content', () => {
      expect(discourseHandler.match('https://users.rust-lang.org/', discourseHtml)).toBe(true)
      expect(
        discourseHandler.match('https://users.rust-lang.org/u/steveklabnik', discourseHtml),
      ).toBe(true)
    })

    it('should return false without content', () => {
      expect(discourseHandler.match('https://users.rust-lang.org/')).toBe(false)
    })

    it('should return false for non-Discourse content', () => {
      expect(discourseHandler.match('https://users.rust-lang.org/', otherHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(discourseHandler.match('not-a-url', discourseHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return user activity feed for /u/{user} path', () => {
      const value = 'https://users.rust-lang.org/u/steveklabnik'
      const expected = [
        {
          uri: 'https://users.rust-lang.org/u/steveklabnik/activity.rss',
          hint: { key: 'discourse:activity', label: 'Activity' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for /c/{slug} path', () => {
      const value = 'https://users.rust-lang.org/c/help'
      const expected = [
        {
          uri: 'https://users.rust-lang.org/c/help.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return topic feed for /t/{slug}/{id} path', () => {
      const value = 'https://users.rust-lang.org/t/welcome-to-the-rust-users-forum/2'
      const expected = [
        {
          uri: 'https://users.rust-lang.org/t/welcome-to-the-rust-users-forum/2.rss',
          hint: { key: 'discourse:topic', label: 'Topic' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest feed for root path', () => {
      const value = 'https://users.rust-lang.org/'
      const expected = [
        {
          uri: 'https://users.rust-lang.org/latest.rss',
          hint: { key: 'discourse:latest', label: 'Latest' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest feed for unknown paths', () => {
      const value = 'https://users.rust-lang.org/about'
      const expected = [
        {
          uri: 'https://users.rust-lang.org/latest.rss',
          hint: { key: 'discourse:latest', label: 'Latest' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })
  })
})
