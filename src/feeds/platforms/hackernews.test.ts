import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HackernewsUrl, hackernewsHandler, parseHackernewsUrl } from './hackernews.js'

describe('parseHackernewsUrl', () => {
  it('should return the show page', () => {
    const expected: HackernewsUrl = { kind: 'show' }

    expect(parseHackernewsUrl('https://news.ycombinator.com/show')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: HackernewsUrl = { kind: 'home' }

    expect(parseHackernewsUrl('https://news.ycombinator.com/item?id=1')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHackernewsUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hackernewsHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://news.ycombinator.com'],
      [true, 'https://news.ycombinator.com/news'],
      [true, 'https://news.ycombinator.com/item?id=12345'],
      [false, 'https://ycombinator.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hackernewsHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hackernewsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hacker News', () => {
      expect(hackernewsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return front page feed for root', () => {
      const value = 'https://news.ycombinator.com'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/rss',
          hint: { key: 'hackernews:front', label: 'Front page' },
        },
        {
          uri: 'https://news.ycombinator.com/bigrss',
          hint: { key: 'hackernews:front-full', label: 'Full front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return front page feed for any non-show path', () => {
      const value = 'https://news.ycombinator.com/item?id=12345'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/rss',
          hint: { key: 'hackernews:front', label: 'Front page' },
        },
        {
          uri: 'https://news.ycombinator.com/bigrss',
          hint: { key: 'hackernews:front-full', label: 'Full front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    const showValues: Array<string> = [
      'https://news.ycombinator.com/show',
      'https://news.ycombinator.com/show/',
      'https://news.ycombinator.com/shownew',
      'https://news.ycombinator.com/shownew/',
    ]

    it.each(showValues)('should return Show HN feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: { key: 'hackernews:show', label: 'Show HN' },
        },
        {
          uri: 'https://news.ycombinator.com/bigrss',
          hint: { key: 'hackernews:front-full', label: 'Full front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return Show HN feed for /show with a capitalized show segment', () => {
      const value = 'https://news.ycombinator.com/Show'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: { key: 'hackernews:show', label: 'Show HN' },
        },
        {
          uri: 'https://news.ycombinator.com/bigrss',
          hint: { key: 'hackernews:front-full', label: 'Full front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the front key for the front page feed', () => {
      const value = 'https://news.ycombinator.com/rss'
      const expected: DiscoverUriHint = { key: 'hackernews:front', label: 'Front page' }

      expect(hackernewsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show key for the Show HN feed', () => {
      const value = 'https://news.ycombinator.com/showrss'
      const expected: DiscoverUriHint = { key: 'hackernews:show', label: 'Show HN' }

      expect(hackernewsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the Show HN page', () => {
      const value = 'https://news.ycombinator.com/show'

      expect(hackernewsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the full front key for the full front page feed', () => {
      const value = 'https://news.ycombinator.com/bigrss'
      const expected: DiscoverUriHint = { key: 'hackernews:front-full', label: 'Full front page' }

      expect(hackernewsHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const front: DiscoverUriHint = {
      key: 'hackernews:front',
      label: 'Front page',
    }
    const show: DiscoverUriHint = {
      key: 'hackernews:show',
      label: 'Show HN',
    }
    const frontFull: DiscoverUriHint = {
      key: 'hackernews:front-full',
      label: 'Full front page',
    }
    const values: Array<[string, DiscoverUriHint]> = [
      ['https://news.ycombinator.com/rss', front],
      ['http://news.ycombinator.com/rss', front],
      ['https://news.ycombinator.com/showrss', show],
      ['http://news.ycombinator.com/showrss', show],
      ['https://news.ycombinator.com/bigrss', frontFull],
      ['http://news.ycombinator.com/bigrss/', frontFull],
    ]

    it.each(values)('should return %s as given with its key', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [hackernewsHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
