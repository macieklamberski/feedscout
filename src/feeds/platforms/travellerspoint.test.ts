import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  parseTravellerspointUrl,
  type TravellerspointUrl,
  travellerspointHandler,
} from './travellerspoint.js'

describe('parseTravellerspointUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: TravellerspointUrl = { kind: 'blog', blog: 'alicetravels' }

    expect(parseTravellerspointUrl('https://alicetravels.travellerspoint.com/')).toEqual(expected)
  })

  it('should return the blog for an entry page', () => {
    const expected: TravellerspointUrl = { kind: 'blog', blog: 'alicetravels' }

    expect(parseTravellerspointUrl('https://alicetravels.travellerspoint.com/426/')).toEqual(
      expected,
    )
  })

  it('should return the blog for a country page', () => {
    const expected: TravellerspointUrl = { kind: 'blog', blog: 'alicetravels' }

    expect(parseTravellerspointUrl('https://alicetravels.travellerspoint.com/co/4/')).toEqual(
      expected,
    )
  })

  const siteHostUrls: Array<string> = ['https://www.travellerspoint.com/blog.cfm']

  it.each(siteHostUrls)('should return undefined for the site host %s', (url) => {
    expect(parseTravellerspointUrl(url)).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseTravellerspointUrl('https://www.example.travellerspoint.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseTravellerspointUrl('https://travellerspoint.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTravellerspointUrl('https://alicetravels.example.com/')).toBeUndefined()
  })
})

describe('travellerspointHandler', () => {
  describe('match', () => {
    it('should match a blog subdomain', () => {
      expect(travellerspointHandler.match('https://alicetravels.travellerspoint.com/')).toBe(true)
    })

    it('should not match the site host', () => {
      expect(travellerspointHandler.match('https://www.travellerspoint.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Travellerspoint', () => {
      expect(travellerspointHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the Atom feed for a blog', () => {
      const value = 'https://alicetravels.travellerspoint.com/426/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alicetravels.travellerspoint.com/atom.xml',
          hint: { key: 'travellerspoint:posts', label: 'Posts' },
        },
      ]

      expect(travellerspointHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for an http page', () => {
      const value = 'http://alicetravels.travellerspoint.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alicetravels.travellerspoint.com/atom.xml',
          hint: { key: 'travellerspoint:posts', label: 'Posts' },
        },
      ]

      expect(travellerspointHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for a blog feed', () => {
      const value = 'https://alicetravels.travellerspoint.com/atom.xml'
      const expected = 'travellerspoint:posts'

      expect(travellerspointHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a blog feed over http', () => {
      const value = 'http://alicetravels.travellerspoint.com/atom.xml'
      const expected = 'travellerspoint:posts'

      expect(travellerspointHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the rss.xml blog feed', () => {
      const value = 'https://alicetravels.travellerspoint.com/rss.xml'
      const expected = 'travellerspoint:posts'

      expect(travellerspointHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alicetravels.travellerspoint.com/426/'

      expect(travellerspointHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the site host', () => {
      const value = 'https://www.travellerspoint.com/atom.xml'

      expect(travellerspointHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the apex domain', () => {
      const value = 'https://travellerspoint.com/atom.xml'

      expect(travellerspointHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://alicetravels.example.com/atom.xml'

      expect(travellerspointHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const postsHint: DiscoverUriHint = { key: 'travellerspoint:posts', label: 'Posts' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alicetravels.travellerspoint.com/atom.xml', postsHint],
      ['http://alicetravels.travellerspoint.com/atom.xml', postsHint],
      ['https://alicetravels.travellerspoint.com/rss.xml', postsHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [travellerspointHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
