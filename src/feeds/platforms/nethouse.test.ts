import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isNethouseHeaders, nethouseHandler } from './nethouse.js'

describe('isNethouseHeaders', () => {
  it('should return true for the Nethouse generator header', () => {
    const value = new Headers({ 'x-generator': 'nethouse' })

    expect(isNethouseHeaders(value)).toBe(true)
  })

  it('should return false for another generator header', () => {
    const value = new Headers({ 'x-generator': 'Drupal 8 (https://www.drupal.org)' })

    expect(isNethouseHeaders(value)).toBe(false)
  })

  it('should return false for a generator that only contains nethouse', () => {
    const value = new Headers({ 'x-generator': 'bonnethouse-cms' })

    expect(isNethouseHeaders(value)).toBe(false)
  })

  it('should return false without the generator header', () => {
    expect(isNethouseHeaders(new Headers())).toBe(false)
  })
})

describe('nethouseHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://geography.nethouse.ru/'],
      [false, 'https://www.nethouse.ru/'],
      [false, 'https://www.nethouse.me/'],
      [false, 'https://www.geography.nethouse.ru/'],
      [true, 'https://jivoirodnik.nethouse.ru/articles'],
      [true, 'https://errorfreeled.nethouse.me/'],
      [false, 'https://nethouse.ru/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(nethouseHandler.match(url)).toBe(expected)
    })

    it('should return true for a custom domain with the Nethouse generator header', () => {
      const headers = new Headers({ 'x-generator': 'nethouse' })

      expect(nethouseHandler.match('https://example.com/', '', headers)).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return the news and articles feeds for a site', () => {
      const value = 'https://jivoirodnik.nethouse.ru/articles/223023'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://jivoirodnik.nethouse.ru/posts/rss',
          hint: { key: 'nethouse:news', label: 'News' },
        },
        {
          uri: 'https://jivoirodnik.nethouse.ru/articles/rss',
          hint: { key: 'nethouse:articles', label: 'Articles' },
        },
      ]

      expect(nethouseHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feeds of a site opened over http', () => {
      const value = 'http://alice.nethouse.me/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.nethouse.me/posts/rss',
          hint: { key: 'nethouse:news', label: 'News' },
        },
        {
          uri: 'https://alice.nethouse.me/articles/rss',
          hint: { key: 'nethouse:articles', label: 'Articles' },
        },
      ]

      expect(nethouseHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of a custom domain opened over http', () => {
      const value = 'http://example.com/articles'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/posts/rss',
          hint: { key: 'nethouse:news', label: 'News' },
        },
        {
          uri: 'http://example.com/articles/rss',
          hint: { key: 'nethouse:articles', label: 'Articles' },
        },
      ]

      expect(nethouseHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the news hint for the news feed', () => {
      const value = 'https://alice.nethouse.ru/posts/rss'
      const expected: DiscoverUriHint = { key: 'nethouse:news', label: 'News' }

      expect(nethouseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the articles hint for the articles feed', () => {
      const value = 'https://alice.nethouse.ru/articles/rss'
      const expected: DiscoverUriHint = { key: 'nethouse:articles', label: 'Articles' }

      expect(nethouseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news hint for the news feed on nethouse.me', () => {
      const value = 'https://alice.nethouse.me/posts/rss'
      const expected: DiscoverUriHint = { key: 'nethouse:news', label: 'News' }

      expect(nethouseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the articles hint for the articles feed over http', () => {
      const value = 'http://alice.nethouse.ru/articles/rss'
      const expected: DiscoverUriHint = { key: 'nethouse:articles', label: 'Articles' }

      expect(nethouseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page of a site', () => {
      const value = 'https://alice.nethouse.ru/articles/223023'

      expect(nethouseHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the platform site', () => {
      const value = 'https://www.nethouse.ru/posts/rss'

      expect(nethouseHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://shop.alice.nethouse.ru/posts/rss'

      expect(nethouseHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news feed of a custom domain', () => {
      const value = 'https://example.com/posts/rss'

      expect(nethouseHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const newsHint: DiscoverUriHint = { key: 'nethouse:news', label: 'News' }
    const articlesHint: DiscoverUriHint = { key: 'nethouse:articles', label: 'Articles' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.nethouse.ru/posts/rss', newsHint],
      ['http://alice.nethouse.ru/posts/rss/', newsHint],
      ['https://alice.nethouse.me/articles/rss', articlesHint],
      ['http://alice.nethouse.me/articles/rss/', articlesHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [nethouseHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
