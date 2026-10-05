import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
    'https://static.twoday.net/alice/images/icon.jpg',
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
          uri: ['https://alice.twoday.net/index.rdf', 'https://alice.twoday.net/rss'],
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
          uri: ['https://alice.twoday.net/index.rdf', 'https://alice.twoday.net/rss'],
          hint: { key: 'twoday:posts', label: 'Posts' },
        },
      ]

      expect(twodayHandler.resolve(value)).toEqual(expected)
    })
  })
})
