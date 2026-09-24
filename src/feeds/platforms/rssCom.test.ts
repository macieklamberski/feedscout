import { describe, expect, it } from 'bun:test'
import { rssComHandler } from './rssCom.js'

describe('rssComHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://rss.com/podcasts/podcasting101'],
      [true, 'https://www.rss.com/podcasts/some-show'],
      [true, 'https://rss.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(rssComHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(rssComHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://rss.com/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://rss.com/podcasts/podcasting101/episodes/some-episode'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://rss.com/'

      expect(rssComHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-podcast paths', () => {
      const value = 'https://rss.com/about'

      expect(rssComHandler.resolve(value)).toEqual([])
    })

    it('should return feed URL for /es/podcasts/{slug}', () => {
      const value = 'https://rss.com/es/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for /it/podcasts/{slug}', () => {
      const value = 'https://rss.com/it/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
