import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getPrlogPage,
  type PrlogPage,
  type PrlogUrl,
  parsePrlogUrl,
  prlogHandler,
} from './prlog.js'

describe('parsePrlogUrl', () => {
  it('should return the pressroom for a pressroom page', () => {
    const value = 'https://pressroom.prlog.org/Example_Co/'
    const expected: PrlogUrl = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(parsePrlogUrl(value)).toEqual(expected)
  })

  it('should return the pressroom for a page under it', () => {
    const value = 'https://pressroom.prlog.org/Example_Co/latest.xml'
    const expected: PrlogUrl = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(parsePrlogUrl(value)).toEqual(expected)
  })

  it('should return undefined for the pressroom directory', () => {
    expect(parsePrlogUrl('https://pressroom.prlog.org/')).toBeUndefined()
  })

  it('should return undefined for the main site', () => {
    expect(parsePrlogUrl('https://www.prlog.org/news/tag/equity/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePrlogUrl('https://example.com/Example_Co/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePrlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('getPrlogPage', () => {
  const value = 'https://pressroom.prlog.org/example_co/'

  it('should spell the pressroom id as the page alternate spells it', () => {
    const content =
      '<link rel="alternate" href="https://pressroom.prlog.org/Example_Co/latest.xml" type="application/rss+xml" />'
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'Example_Co' }

    expect(getPrlogPage(value, content)).toEqual(expected)
  })

  it('should keep the URL spelling when the alternate names another pressroom', () => {
    const content =
      '<link rel="alternate" href="https://pressroom.prlog.org/Other_Co/latest.xml" type="application/rss+xml" />'
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'example_co' }

    expect(getPrlogPage(value, content)).toEqual(expected)
  })

  it('should keep the URL spelling without content', () => {
    const expected: PrlogPage = { kind: 'pressroom', pressroomId: 'example_co' }

    expect(getPrlogPage(value, undefined)).toEqual(expected)
  })

  it('should return undefined for a URL outside a pressroom', () => {
    expect(getPrlogPage('https://pressroom.prlog.org/', undefined)).toBeUndefined()
  })
})

describe('prlogHandler', () => {
  describe('match', () => {
    it('should match a pressroom page', () => {
      expect(prlogHandler.match('https://pressroom.prlog.org/Example_Co/')).toBe(true)
    })

    it('should not match the pressroom directory', () => {
      expect(prlogHandler.match('https://pressroom.prlog.org/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the press releases feed for a pressroom', () => {
      const value = 'https://pressroom.prlog.org/Example_Co/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://pressroom.prlog.org/Example_Co/latest.xml',
          hint: { key: 'prlog:press-releases', label: 'Press releases' },
        },
      ]

      expect(prlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for an http pressroom page', () => {
      const value = 'http://pressroom.prlog.org/Example_Co/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://pressroom.prlog.org/Example_Co/latest.xml',
          hint: { key: 'prlog:press-releases', label: 'Press releases' },
        },
      ]

      expect(prlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside a pressroom', () => {
      expect(prlogHandler.resolve('https://pressroom.prlog.org/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the press releases hint for a pressroom feed', () => {
      const value = 'https://pressroom.prlog.org/Example_Co/latest.xml'
      const expected: DiscoverUriHint = { key: 'prlog:press-releases', label: 'Press releases' }

      expect(prlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the press releases hint for an http pressroom feed', () => {
      const value = 'http://pressroom.prlog.org/Example_Co/latest.xml'
      const expected: DiscoverUriHint = { key: 'prlog:press-releases', label: 'Press releases' }

      expect(prlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the press releases hint for a pressroom feed with a tracking query', () => {
      const value = 'https://pressroom.prlog.org/Example_Co/latest.xml?utm_source=example'
      const expected: DiscoverUriHint = { key: 'prlog:press-releases', label: 'Press releases' }

      expect(prlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a pressroom page', () => {
      const value = 'https://pressroom.prlog.org/Example_Co/'

      expect(prlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the pressroom directory', () => {
      const value = 'https://pressroom.prlog.org/latest.xml'

      expect(prlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the main site', () => {
      const value = 'https://www.prlog.org/news/rss.xml'

      expect(prlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/Example_Co/latest.xml'

      expect(prlogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'prlog:press-releases', label: 'Press releases' }
    const ownFeeds: Array<string> = [
      'https://pressroom.prlog.org/Example_Co/latest.xml',
      'http://pressroom.prlog.org/Example_Co/latest.xml',
      'https://pressroom.prlog.org/Example_Co/latest.xml?utm_source=example',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [prlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
