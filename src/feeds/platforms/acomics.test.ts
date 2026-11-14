import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type AcomicsUrl, acomicsHandler, parseAcomicsUrl } from './acomics.js'

const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://acomics.ru/~TheSweetBerries/rss', { key: 'acomics:issues', label: 'Issues' }], // Comic
  ['https://acomics.ru/-Lilim/rss', { key: 'acomics:subscriptions', label: 'Subscriptions' }], // User
  ['http://www.acomics.ru/~Example/rss', { key: 'acomics:issues', label: 'Issues' }], // Comic, www
]

describe('parseAcomicsUrl', () => {
  it('should return the comic for a comic page', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'TheSweetBerries' }

    expect(parseAcomicsUrl('https://acomics.ru/~TheSweetBerries')).toEqual(expected)
  })

  it('should return the comic for an issue page', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'erma' }

    expect(parseAcomicsUrl('https://acomics.ru/~erma/819')).toEqual(expected)
  })

  it('should return the user for a profile page', () => {
    const expected: AcomicsUrl = { kind: 'user', username: 'Lilim' }

    expect(parseAcomicsUrl('https://acomics.ru/-Lilim')).toEqual(expected)
  })

  it('should return the user for a subscriptions page', () => {
    const expected: AcomicsUrl = { kind: 'user', username: 'Lilim' }

    expect(parseAcomicsUrl('https://acomics.ru/-Lilim/list2')).toEqual(expected)
  })

  it('should return the comic on the www host', () => {
    const expected: AcomicsUrl = { kind: 'comic', comic: 'TheSweetBerries' }

    expect(parseAcomicsUrl('https://www.acomics.ru/~TheSweetBerries')).toEqual(expected)
  })

  it('should return undefined for a bare prefix', () => {
    expect(parseAcomicsUrl('https://acomics.ru/~')).toBeUndefined()
  })

  it('should return undefined for a site page', () => {
    expect(parseAcomicsUrl('https://acomics.ru/comics')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseAcomicsUrl('https://acomics.ru/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAcomicsUrl('https://example.com/~TheSweetBerries')).toBeUndefined()
  })
})

describe('acomicsHandler', () => {
  describe('match', () => {
    it('should return true for a comic page', () => {
      expect(acomicsHandler.match('https://acomics.ru/~TheSweetBerries')).toBe(true)
    })

    it('should return false for the home page', () => {
      expect(acomicsHandler.match('https://acomics.ru/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Acomics', () => {
      expect(acomicsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the issues feed for a comic', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acomics.ru/~TheSweetBerries/rss',
          hint: { key: 'acomics:issues', label: 'Issues' },
        },
      ]

      expect(acomicsHandler.resolve('https://www.acomics.ru/~TheSweetBerries/1')).toEqual(expected)
    })

    it('should return the subscriptions feed for a user', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://acomics.ru/-Lilim/rss',
          hint: { key: 'acomics:subscriptions', label: 'Subscriptions' },
        },
      ]

      expect(acomicsHandler.resolve('https://acomics.ru/-Lilim')).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the issues key for a comic feed', () => {
      const value = 'https://acomics.ru/~TheSweetBerries/rss'
      const expected: DiscoverUriHint = { key: 'acomics:issues', label: 'Issues' }

      expect(acomicsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the subscriptions key for a user feed', () => {
      const value = 'https://acomics.ru/-Lilim/rss'
      const expected: DiscoverUriHint = { key: 'acomics:subscriptions', label: 'Subscriptions' }

      expect(acomicsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues key for a comic feed on the www host', () => {
      const value = 'http://www.acomics.ru/~Example/rss'
      const expected: DiscoverUriHint = { key: 'acomics:issues', label: 'Issues' }

      expect(acomicsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a comic page', () => {
      const value = 'https://acomics.ru/~TheSweetBerries'

      expect(acomicsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an issue page', () => {
      const value = 'https://acomics.ru/~TheSweetBerries/1'

      expect(acomicsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path without a prefix', () => {
      const value = 'https://acomics.ru/comics/rss'

      expect(acomicsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/~TheSweetBerries/rss'

      expect(acomicsHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [acomicsHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
