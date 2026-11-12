import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { WebtoonsUrl } from './webtoons.js'
import { parseWebtoonsUrl, webtoonsHandler } from './webtoons.js'

describe('parseWebtoonsUrl', () => {
  it('should return the series for a series page', () => {
    const value = 'https://www.webtoons.com/en/fantasy/example-series/list?title_no=95'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'en',
      genre: 'fantasy',
      name: 'example-series',
      titleNo: '95',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return the series for an episode page', () => {
    const value =
      'https://www.webtoons.com/en/fantasy/example-series/episode-1/viewer?title_no=95&episode_no=1'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'en',
      genre: 'fantasy',
      name: 'example-series',
      titleNo: '95',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return the series for a Canvas series page', () => {
    const value = 'https://www.webtoons.com/es/canvas/example-series/list?title_no=803012'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'es',
      genre: 'canvas',
      name: 'example-series',
      titleNo: '803012',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return the series for a series page with a trailing slash', () => {
    const value = 'https://www.webtoons.com/en/fantasy/example-series/list/?title_no=95'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'en',
      genre: 'fantasy',
      name: 'example-series',
      titleNo: '95',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return the lowercase language for a capitalized language segment', () => {
    const value = 'https://www.webtoons.com/ZH-HANT/action/example-series/list?title_no=11058'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'zh-hant',
      genre: 'action',
      name: 'example-series',
      titleNo: '11058',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return the series for the mobile host', () => {
    const value = 'https://m.webtoons.com/en/fantasy/example-series/list?title_no=95'
    const expected: WebtoonsUrl = {
      kind: 'series',
      language: 'en',
      genre: 'fantasy',
      name: 'example-series',
      titleNo: '95',
    }

    expect(parseWebtoonsUrl(value)).toEqual(expected)
  })

  it('should return undefined for an unknown language', () => {
    const value = 'https://www.webtoons.com/xx/fantasy/example-series/list?title_no=95'

    expect(parseWebtoonsUrl(value)).toBeUndefined()
  })

  it('should return undefined without a title number', () => {
    const value = 'https://www.webtoons.com/en/fantasy/example-series/list'

    expect(parseWebtoonsUrl(value)).toBeUndefined()
  })

  it('should return undefined for a non-numeric title number', () => {
    const value = 'https://www.webtoons.com/en/fantasy/example-series/list?title_no=abc'

    expect(parseWebtoonsUrl(value)).toBeUndefined()
  })

  it('should return undefined for a genre page', () => {
    expect(parseWebtoonsUrl('https://www.webtoons.com/en/genres/fantasy')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseWebtoonsUrl('https://www.webtoons.com/en/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    const value = 'https://example.com/en/fantasy/example-series/list?title_no=95'

    expect(parseWebtoonsUrl(value)).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseWebtoonsUrl('not-a-url')).toBeUndefined()
  })
})

describe('webtoonsHandler', () => {
  describe('match', () => {
    it('should match a series page', () => {
      const value = 'https://www.webtoons.com/en/fantasy/example-series/list?title_no=95'

      expect(webtoonsHandler.match(value)).toBe(true)
    })

    it('should not match the homepage', () => {
      expect(webtoonsHandler.match('https://www.webtoons.com/en/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the series feed for a series page', () => {
      const value = 'https://www.webtoons.com/en/fantasy/example-series/list?title_no=95'
      const expected = [
        {
          uri: 'https://www.webtoons.com/en/fantasy/example-series/rss?title_no=95',
          hint: { key: 'webtoons:series', label: 'Series' },
        },
      ]

      expect(webtoonsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the challenge feed for a Canvas series page', () => {
      const value = 'https://www.webtoons.com/en/canvas/example-series/list?title_no=803012'
      const expected = [
        {
          uri: 'https://www.webtoons.com/en/challenge/example-series/rss?title_no=803012',
          hint: { key: 'webtoons:series', label: 'Series' },
        },
      ]

      expect(webtoonsHandler.resolve(value)).toEqual(expected)
    })

    it('should return nothing for a URL outside a series', () => {
      expect(webtoonsHandler.resolve('https://www.webtoons.com/en/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the series key for a Canvas series feed', () => {
      const value = 'https://www.webtoons.com/en/challenge/chibird/rss?title_no=97265'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the series key for an original series feed', () => {
      const value = 'https://www.webtoons.com/en/drama/lookism/rss?title_no=1049'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the series key for a feed with a percent-encoded name', () => {
      const value =
        'https://www.webtoons.com/zh-hant/challenge/%E8%97%8D%E6%9C%88%E4%B8%8B%E7%9A%84%E5%AE%B6/rss?title_no=681146'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the series key for a feed without www', () => {
      const value = 'https://webtoons.com/en/challenge/everyday-magic/rss?title_no=741756'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the series key for a feed on the sg host', () => {
      const value = 'https://sg.webtoons.com/en/challenge/the-legend-of-genji/rss?title_no=194154'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the series key for a feed on the us host', () => {
      const value = 'https://us.webtoons.com/en/romance/sixth-sense-kiss/rss?title_no=2921'
      const expected = 'webtoons:series'

      expect(webtoonsHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a series page', () => {
      const value = 'https://www.webtoons.com/en/challenge/chibird/list?title_no=97265'

      expect(webtoonsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path without a title number', () => {
      const value = 'https://www.webtoons.com/en/challenge/chibird/rss'

      expect(webtoonsHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/en/challenge/chibird/rss?title_no=97265'

      expect(webtoonsHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'webtoons:series', label: 'Series' }
    const ownFeeds = [
      'https://www.webtoons.com/en/challenge/chibird/rss?title_no=97265',
      'https://www.webtoons.com/en/challenge/everyday-magic/rss?title_no=741756',
      'https://www.webtoons.com/en/drama/lookism/rss?title_no=1049',
      'https://www.webtoons.com/id/fantasy/deadly-7-inside-me/rss?title_no=722',
      'https://sg.webtoons.com/en/challenge/the-legend-of-genji/rss?title_no=194154',
      'https://us.webtoons.com/en/romance/sixth-sense-kiss/rss?title_no=2921',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [webtoonsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
