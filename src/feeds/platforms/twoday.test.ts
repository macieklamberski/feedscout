import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseTwodayUrl, type TwodayUrl, twodayHandler } from './twoday.js'

describe('parseTwodayUrl', () => {
  const values: Array<[string, TwodayUrl]> = [
    ['https://alice.twoday.net/', { kind: 'blog', blog: 'alice' }],
    ['https://alice.twoday.net/stories/1022710479/', { kind: 'blog', blog: 'alice' }],
    ['https://alice.twoday.net/topics/', { kind: 'blog', blog: 'alice' }],
    [
      'https://alice.twoday.net/topics/Wo+der+Hase+hinlief/',
      { kind: 'topic', blog: 'alice', topic: 'Wo+der+Hase+hinlief' },
    ],
    [
      'https://alice.twoday.net/TOPICS/Fuer+eilige+Leser/',
      { kind: 'topic', blog: 'alice', topic: 'Fuer+eilige+Leser' },
    ],
    [
      'https://alice.twoday.net/topics/kreative+einsatzm%C3%B6glichkeiten',
      { kind: 'topic', blog: 'alice', topic: 'kreative+einsatzm%C3%B6glichkeiten' },
    ],
    [
      'https://alice.twoday.net/topics/.Der+Rest/?start=10',
      { kind: 'topic', blog: 'alice', topic: '.Der+Rest' },
    ],
  ]

  it.each(values)('should parse %s', (url, expected) => {
    expect(parseTwodayUrl(url)).toEqual(expected)
  })

  const unmatched: Array<string> = [
    'https://twoday.net/',
    'https://www.twoday.net/',
    'https://www.alice.twoday.net/',
    'https://example.com/topics/Wo+der+Hase+hinlief/',
    'not-a-url',
  ]

  it.each(unmatched)('should return undefined for %s', (url) => {
    expect(parseTwodayUrl(url)).toBeUndefined()
  })
})

describe('twodayHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(twodayHandler.match('https://alice.twoday.net/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(twodayHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(twodayHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for a blog page', () => {
      const value = 'https://alice.twoday.net/stories/1022710479/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.twoday.net/index.rdf',
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(twodayHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic feed and the posts feed for a topic page', () => {
      const value = 'https://alice.twoday.net/TOPICS/Wo+der+Hase+hinlief/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.twoday.net/topics/Wo+der+Hase+hinlief/index.rdf',
          hint: { key: 'twoday:topic', label: 'Topic' },
        },
        {
          uri: 'https://alice.twoday.net/index.rdf',
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(twodayHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http blog page', () => {
      const value = 'http://alice.twoday.net/stories/1022710479/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.twoday.net/index.rdf',
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(twodayHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http topic page', () => {
      const value = 'http://alice.twoday.net/topics/Wo+der+Hase+hinlief/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.twoday.net/topics/Wo+der+Hase+hinlief/index.rdf',
          hint: { key: 'twoday:topic', label: 'Topic' },
        },
        {
          uri: 'https://alice.twoday.net/index.rdf',
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(twodayHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for the index.rdf feed', () => {
      const value = 'https://alice.twoday.net/index.rdf'
      const expected = 'twoday:posts'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the rss feed', () => {
      const value = 'https://alice.twoday.net/rss'
      const expected = 'twoday:posts'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the summary feed', () => {
      const value = 'https://alice.twoday.net/summary.rdf'
      const expected = 'twoday:posts'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the topic key for a topic feed', () => {
      const value = 'https://alice.twoday.net/topics/Wo+der+Hase+hinlief/index.rdf'
      const expected = 'twoday:topic'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the topic key for a topic feed with an uppercase route', () => {
      const value = 'https://alice.twoday.net/TOPICS/Fuer+eilige+Leser/index.rdf'
      const expected = 'twoday:topic'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the topic key for a topic feed with a percent-encoded name', () => {
      const value = 'https://alice.twoday.net/topics/kreative+einsatzm%C3%B6glichkeiten/index.rdf'
      const expected = 'twoday:topic'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http feed', () => {
      const value = 'http://alice.twoday.net/index.rdf'
      const expected = 'twoday:posts'

      expect(twodayHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.twoday.net/stories/1022710479/'

      expect(twodayHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the comments feed', () => {
      const value = 'https://alice.twoday.net/comments.rdf'

      expect(twodayHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://twoday.net/index.rdf'

      expect(twodayHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.twoday.net/index.rdf'

      expect(twodayHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/index.rdf'

      expect(twodayHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const postsFeeds: Array<string> = [
      'https://alice.twoday.net/index.rdf',
      'http://alice.twoday.net/index.rdf',
      'https://alice.twoday.net/rss',
      'https://alice.twoday.net/summary.rdf',
    ]
    const topicFeeds: Array<string> = [
      'https://alice.twoday.net/topics/Wo+der+Hase+hinlief/index.rdf',
      'https://alice.twoday.net/TOPICS/Fuer+eilige+Leser/index.rdf',
    ]

    it.each(postsFeeds)('should return %s as itself with the posts hint', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [twodayHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })

    it.each(topicFeeds)('should return %s as itself with the topic hint', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [twodayHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'twoday:topic', label: 'Topic' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
