import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://robb.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://robb.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://robb.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://robb.weblog.lol/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://robb.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://robb.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://robb.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })
  })
})
