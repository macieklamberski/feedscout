import { describe, expect, it } from 'bun:test'
import { weblogLolHandler } from './weblogLol.js'

describe('weblogLolHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://robb.weblog.lol'],
      [true, 'https://blog.example.weblog.lol'],
      [false, 'https://weblog.lol'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(weblogLolHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(weblogLolHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS, Atom, and JSON feeds for blog', () => {
      const value = 'https://robb.weblog.lol'
      const expected = [
        {
          uri: 'https://robb.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://robb.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://robb.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts-json', label: 'Posts (JSON)' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://robb.weblog.lol/some-article-slug'
      const expected = [
        {
          uri: 'https://robb.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://robb.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://robb.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts-json', label: 'Posts (JSON)' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
