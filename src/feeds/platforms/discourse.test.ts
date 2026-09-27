import { describe, expect, it } from 'bun:test'
import { discourseHandler, isDiscourseHeaders, isDiscourseHtml } from './discourse.js'

const discourseHtml =
  '<html><head><meta name="generator" content="Discourse 2026.4.0"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'
const discourseHeaders = new Headers({ 'x-discourse-route': 'list/latest' })

describe('discourseHandler', () => {
  describe('isDiscourseHtml', () => {
    it('should return true for Discourse generator meta tag', () => {
      expect(isDiscourseHtml(discourseHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isDiscourseHtml('<meta name="generator" content="discourse">')).toBe(true)
      expect(isDiscourseHtml('<meta name="generator" content="DISCOURSE">')).toBe(true)
    })

    it('should return true for the data-discourse-setup meta tag without generator', () => {
      expect(isDiscourseHtml('<meta id="data-discourse-setup" data-base-url="/">')).toBe(true)
    })

    it('should return true for a single-quoted data-discourse-setup id', () => {
      expect(isDiscourseHtml("<meta id='data-discourse-setup'>")).toBe(true)
    })

    it('should return false for non-Discourse generator', () => {
      expect(isDiscourseHtml(otherHtml)).toBe(false)
    })

    it('should return false for empty content', () => {
      expect(isDiscourseHtml('')).toBe(false)
    })
  })

  describe('isDiscourseHeaders', () => {
    it('should return true when x-discourse-route header is present', () => {
      expect(isDiscourseHeaders(discourseHeaders)).toBe(true)
    })

    it('should return false when header is absent', () => {
      expect(isDiscourseHeaders(new Headers())).toBe(false)
      expect(isDiscourseHeaders(new Headers({ server: 'nginx' }))).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for any URL with Discourse content', () => {
      expect(discourseHandler.match('https://forum.example.com/', discourseHtml)).toBe(true)
      expect(
        discourseHandler.match('https://forum.example.com/u/steveklabnik', discourseHtml),
      ).toBe(true)
    })

    it('should return true for any URL with Discourse headers', () => {
      expect(discourseHandler.match('https://forum.example.com/', '', discourseHeaders)).toBe(true)
    })

    it('should return false without content or headers', () => {
      expect(discourseHandler.match('https://forum.example.com/')).toBe(false)
    })

    it('should return false for non-Discourse content', () => {
      expect(discourseHandler.match('https://forum.example.com/', otherHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(discourseHandler.match('not-a-url', discourseHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the activity feed for a capitalized u segment', () => {
      const value = 'https://forum.example.com/U/steveklabnik'
      const expected = [
        {
          uri: 'https://forum.example.com/u/steveklabnik/activity.rss',
          hint: { key: 'discourse:activity', label: 'Activity' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return user activity feed for /u/{user} path', () => {
      const value = 'https://forum.example.com/u/steveklabnik'
      const expected = [
        {
          uri: 'https://forum.example.com/u/steveklabnik/activity.rss',
          hint: { key: 'discourse:activity', label: 'Activity' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for /c/{slug} path', () => {
      const value = 'https://forum.example.com/c/help'
      const expected = [
        {
          uri: 'https://forum.example.com/c/help.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for nested /c/{slug}/{slug}/{id} path', () => {
      const value = 'https://forum.example.org/c/contribute/feature/2'
      const expected = [
        {
          uri: 'https://forum.example.org/c/contribute/feature/2.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for a category list filter path', () => {
      const value = 'https://forum.example.org/c/support/6/l/latest'
      const expected = [
        {
          uri: 'https://forum.example.org/c/support/6.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for a capitalized category list filter path', () => {
      const value = 'https://forum.example.org/c/support/6/L/Latest'
      const expected = [
        {
          uri: 'https://forum.example.org/c/support/6.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for a category without subcategories path', () => {
      const value = 'https://forum.example.org/c/support/6/none'
      const expected = [
        {
          uri: 'https://forum.example.org/c/support/6.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for a category with all subcategories path', () => {
      const value = 'https://forum.example.org/c/support/6/all'
      const expected = [
        {
          uri: 'https://forum.example.org/c/support/6.rss',
          hint: { key: 'discourse:category', label: 'Category' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return topic feed for /t/{slug}/{id} path', () => {
      const value = 'https://forum.example.com/t/welcome-to-the-rust-users-forum/2'
      const expected = [
        {
          uri: 'https://forum.example.com/t/welcome-to-the-rust-users-forum/2.rss',
          hint: { key: 'discourse:topic', label: 'Topic' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return topic feed for /t/{slug}/{id} path with a capitalized t segment', () => {
      const value = 'https://forum.example.com/T/welcome-to-the-rust-users-forum/2'
      const expected = [
        {
          uri: 'https://forum.example.com/t/welcome-to-the-rust-users-forum/2.rss',
          hint: { key: 'discourse:topic', label: 'Topic' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest topics + latest posts feeds for root path', () => {
      const value = 'https://forum.example.com/'
      const expected = [
        {
          uri: 'https://forum.example.com/latest.rss',
          hint: { key: 'discourse:latest', label: 'Latest' },
        },
        {
          uri: 'https://forum.example.com/posts.rss',
          hint: { key: 'discourse:posts', label: 'Latest posts' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return latest + posts feeds for unknown paths', () => {
      const value = 'https://forum.example.com/about'
      const expected = [
        {
          uri: 'https://forum.example.com/latest.rss',
          hint: { key: 'discourse:latest', label: 'Latest' },
        },
        {
          uri: 'https://forum.example.com/posts.rss',
          hint: { key: 'discourse:posts', label: 'Latest posts' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return top feed for /top path', () => {
      const value = 'https://forum.example.com/top'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return top feed for /top path with a capitalized top segment', () => {
      const value = 'https://forum.example.com/Top'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    const topPeriodValues: Array<[string, string]> = [
      ['https://forum.example.com/top/daily', 'https://forum.example.com/top.rss?period=daily'],
      ['https://forum.example.com/top/weekly', 'https://forum.example.com/top.rss?period=weekly'],
      ['https://forum.example.com/top/monthly', 'https://forum.example.com/top.rss?period=monthly'],
      [
        'https://forum.example.com/top/quarterly',
        'https://forum.example.com/top.rss?period=quarterly',
      ],
      ['https://forum.example.com/top/yearly', 'https://forum.example.com/top.rss?period=yearly'],
      ['https://forum.example.com/top/all', 'https://forum.example.com/top.rss?period=all'],
    ]

    it.each(topPeriodValues)('should pass through period for %s', (value, uri) => {
      const expected = [{ uri, hint: { key: 'discourse:top', label: 'Top' } }]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through period via ?period= query param', () => {
      const value = 'https://forum.example.com/top?period=weekly'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss?period=weekly',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should prefer path period over ?period= query param', () => {
      const value = 'https://forum.example.com/top/daily?period=weekly'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss?period=daily',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should return lowercase period for a capitalized path period', () => {
      const value = 'https://forum.example.com/top/Daily'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss?period=daily',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should fall back to ?period= query param for an unknown path period', () => {
      const value = 'https://forum.example.com/top/invalid?period=weekly'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss?period=weekly',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })

    it('should drop unknown period values silently', () => {
      const value = 'https://forum.example.com/top/invalid'
      const expected = [
        {
          uri: 'https://forum.example.com/top.rss',
          hint: { key: 'discourse:top', label: 'Top' },
        },
      ]

      expect(discourseHandler.resolve(value)).toEqual(expected)
    })
  })
})
