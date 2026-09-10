import { describe, expect, it } from 'bun:test'
import { jandanHandler } from './jandan.js'

describe('jandanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://jandan.net'],
      [true, 'https://jandan.net/p/123777'],
      [true, 'https://i.jandan.net'],
      [false, 'https://jandan.net.example.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(jandanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(jandanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const postsFeeds = [
      {
        uri: 'https://jandan.net/?feed=rss2',
        hint: { key: 'jandan:posts-rss', label: 'Posts (RSS)' },
      },
      {
        uri: 'https://jandan.net/?feed=atom',
        hint: { key: 'jandan:posts-atom', label: 'Posts (Atom)' },
      },
    ]

    it('should return posts feeds for the homepage', () => {
      expect(jandanHandler.resolve('https://jandan.net')).toEqual(postsFeeds)
    })

    it('should return posts feeds for the mobile host', () => {
      expect(jandanHandler.resolve('https://i.jandan.net/')).toEqual(postsFeeds)
    })

    it('should return the comments feed for a post page', () => {
      const value = 'https://jandan.net/p/123777'
      const expected = [
        {
          uri: 'https://jandan.net/p/123777/feed',
          hint: { key: 'jandan:comments', label: 'Comments' },
        },
      ]

      expect(jandanHandler.resolve(value)).toEqual(expected)
    })
  })
})
