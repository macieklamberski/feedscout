import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { webtoonsHandler } from './webtoons.js'

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

  describe('getFeedHint', () => {
    it('should return the series hint for a feed on the sg host', () => {
      const value = 'https://sg.webtoons.com/en/challenge/example-series/rss?title_no=194154'
      const expected: DiscoverUriHint = { key: 'webtoons:series', label: 'Series' }

      expect(webtoonsHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a series feed as itself', async () => {
      const value = 'https://www.webtoons.com/en/challenge/example-series/rss?title_no=97265'
      const options = {
        ...defaultPlatformOptions,
        handlers: [webtoonsHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.webtoons.com/en/challenge/example-series/rss?title_no=97265',
          hint: { key: 'webtoons:series', label: 'Series' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
