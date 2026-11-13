import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type DasaugeUrl, dasaugeHandler, parseDasaugeUrl } from './dasauge.js'

describe('parseDasaugeUrl', () => {
  it('should return the username for a profile page', () => {
    const expected: DasaugeUrl = { kind: 'profile', username: 'abstrusa' }

    expect(parseDasaugeUrl('https://dasauge.de/-abstrusa/')).toEqual(expected)
  })

  it('should return the username for a portfolio page under a profile', () => {
    const value = 'https://dasauge.de/-abstrusa/wilde-m%C3%B6hre-festival-logo-design/'
    const expected: DasaugeUrl = { kind: 'profile', username: 'abstrusa' }

    expect(parseDasaugeUrl(value)).toEqual(expected)
  })

  it('should return the username for a profile on another dasauge host', () => {
    const expected: DasaugeUrl = { kind: 'profile', username: 'abstrusa' }

    expect(parseDasaugeUrl('https://dasauge.co.uk/-abstrusa/')).toEqual(expected)
  })

  it('should keep the percent-encoding of the username', () => {
    const expected: DasaugeUrl = { kind: 'profile', username: 'alisia-sch%C3%A4fer' }

    expect(parseDasaugeUrl('https://dasauge.de/-alisia-sch%C3%A4fer/')).toEqual(expected)
  })

  it('should return undefined for a directory listing', () => {
    expect(parseDasaugeUrl('https://dasauge.de/profile/')).toBeUndefined()
  })

  it('should return undefined for a bare dash segment', () => {
    expect(parseDasaugeUrl('https://dasauge.de/-/')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseDasaugeUrl('https://dasauge.de/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDasaugeUrl('https://example.com/-abstrusa/')).toBeUndefined()
  })
})

describe('dasaugeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://dasauge.de/-abstrusa/'],
      [true, 'https://dasauge.ch/-abstrusa/'],
      [true, 'https://dasauge.com/-abstrusa/'],
      [true, 'https://dasauge.es/-abstrusa/'],
      [true, 'https://dasauge.at/-abstrusa/'],
      [true, 'https://dasauge.co.uk/-abstrusa/'],
      [false, 'https://dasauge.de/jobs/'],
      [false, 'https://dasauge.fr/-abstrusa/'],
      [false, 'https://www.dasauge.de/-abstrusa/'],
      [false, 'https://shop.dasauge.de/-abstrusa/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(dasaugeHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside dasauge', () => {
      expect(dasaugeHandler.resolve('https://example.com/-abstrusa/')).toEqual([])
    })

    it('should return the profile feed on the page host', () => {
      const value = 'https://dasauge.at/-elmar-theurer/industriefotografie/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dasauge.at/-elmar-theurer/?rss',
          hint: { key: 'dasauge:profile', label: 'Profile' },
        },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the profile feed over https for an http page', () => {
      const value = 'http://dasauge.de/-alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dasauge.de/-alice/?rss',
          hint: { key: 'dasauge:profile', label: 'Profile' },
        },
      ]

      expect(dasaugeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the profile hint for a profile feed', () => {
      const value = 'https://dasauge.de/-alice/?rss'
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed with an empty rss value', () => {
      const value = 'https://dasauge.de/-alice/?rss='
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed without a trailing slash', () => {
      const value = 'https://dasauge.de/-alice?rss'
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the profile hint for a profile feed on another dasauge host', () => {
      const value = 'https://dasauge.co.uk/-alice/?rss='
      const expected: DiscoverUriHint = { key: 'dasauge:profile', label: 'Profile' }

      expect(dasaugeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://dasauge.de/-alice/'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an rss query with a value', () => {
      const value = 'https://dasauge.de/-alice/?rss=1'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a directory listing feed', () => {
      const value = 'https://dasauge.de/profile/fotografen/?rss='

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/-alice/?rss'

      expect(dasaugeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://dasauge.de/-alice/?rss', { key: 'dasauge:profile', label: 'Profile' }],
      ['https://dasauge.de/-alice/?rss=', { key: 'dasauge:profile', label: 'Profile' }],
      ['https://dasauge.co.uk/-alice?rss', { key: 'dasauge:profile', label: 'Profile' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [dasaugeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
