import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseShinobiUrl, type ShinobiUrl, shinobiHandler } from './shinobi.js'

describe('parseShinobiUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: ShinobiUrl = { kind: 'blog', blog: 'example' }

    expect(parseShinobiUrl('https://example.blog.shinobi.jp/')).toEqual(expected)
  })

  it('should return the blog for a subdomain of another Ninja Blog domain', () => {
    const expected: ShinobiUrl = { kind: 'blog', blog: 'example' }

    expect(parseShinobiUrl('https://example.ni-3.net/')).toEqual(expected)
  })

  it('should return undefined for the www subdomain', () => {
    expect(parseShinobiUrl('https://www.blog.shinobi.jp/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseShinobiUrl('https://www.example.blog.shinobi.jp/')).toBeUndefined()
  })

  it('should return undefined for the blog portal', () => {
    expect(parseShinobiUrl('https://blog.shinobi.jp/')).toBeUndefined()
  })

  it('should return undefined for another Ninja Tools service', () => {
    expect(parseShinobiUrl('https://antenna.shinobi.jp/')).toBeUndefined()
  })

  it('should return undefined for the bare domain of a Ninja Blog domain', () => {
    expect(parseShinobiUrl('https://ni-3.net/')).toBeUndefined()
  })

  it('should return undefined for a domain that is not a Ninja Blog domain', () => {
    expect(parseShinobiUrl('https://example.ninja.co.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseShinobiUrl('https://example.com/')).toBeUndefined()
  })
})

describe('shinobiHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.blog.shinobi.jp'],
      [true, 'https://another.blog.shinobi.jp/Entry/1/'],
      [true, 'https://example.3rin.net/'],
      [true, 'https://another.ria10.com/Entry/1/'],
      [false, 'https://3rin.net/'],
      [false, 'https://example.ninja.co.jp/'],
      [false, 'https://blog.shinobi.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(shinobiHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Shinobi Blog', () => {
      expect(shinobiHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS and Atom feeds for blog', () => {
      const value = 'https://example.blog.shinobi.jp/Entry/1/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blog.shinobi.jp/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blog.shinobi.jp/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS and Atom feeds for a blog on another Ninja Blog domain', () => {
      const value = 'https://example.ni-3.net/Entry/1/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ni-3.net/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.ni-3.net/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of the request', () => {
      const value = 'http://example.blog.shinobi.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.blog.shinobi.jp/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://example.blog.shinobi.jp/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for the RSS feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the Atom feed', () => {
      const value = 'https://example.blog.shinobi.jp/ATOM/'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the Atom feed as its self link spells it', () => {
      const value = 'http://example.blog.shinobi.jp/atom'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 2.0 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/200'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 0.91 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/091'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 1.0 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/100'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/RSS'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 2.0 feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/200/RSS'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 1.0 feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/100/RSS'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS 0.91 feed as index.rdf', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/091/index.rdf'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the RSS feed at the OPML path', () => {
      const value = 'https://example.blog.shinobi.jp/OPML'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed on another Ninja Blog domain', () => {
      const value = 'http://example.ni-3.net/RSS/'
      const expected = 'shinobi:posts'

      expect(shinobiHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for an entry page', () => {
      const value = 'https://example.blog.shinobi.jp/Entry/1/'

      expect(shinobiHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the blog portal', () => {
      const value = 'https://blog.shinobi.jp/RSS/'

      expect(shinobiHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the bare domain of a Ninja Blog domain', () => {
      const value = 'https://ni-3.net/RSS/'

      expect(shinobiHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.example.ni-3.net/RSS/'

      expect(shinobiHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/RSS/'

      expect(shinobiHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds = [
      'https://example.blog.shinobi.jp/RSS/',
      'https://example.blog.shinobi.jp/RSS',
      'http://example.blog.shinobi.jp/ATOM/',
      'http://example.blog.shinobi.jp/atom',
      'https://example.blog.shinobi.jp/RSS/200',
      'https://example.blog.shinobi.jp/RSS/091/',
      'https://example.blog.shinobi.jp/RSS/100',
      'https://example.blog.shinobi.jp/RSS/RSS',
      'https://example.blog.shinobi.jp/RSS/200/RSS',
      'https://example.blog.shinobi.jp/RSS/100/RSS',
      'https://example.blog.shinobi.jp/RSS/091/index.rdf',
      'https://example.blog.shinobi.jp/OPML',
      'http://example.ni-3.net/rss',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [shinobiHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'shinobi:posts', label: 'Posts' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
