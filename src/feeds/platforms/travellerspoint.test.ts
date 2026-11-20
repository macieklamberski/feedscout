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

    it('should keep the http scheme of an http page', () => {
      const value = 'http://alicetravels.travellerspoint.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alicetravels.travellerspoint.com/atom.xml',
          hint: { key: 'travellerspoint:posts', label: 'Posts' },
        },
      ]

      expect(travellerspointHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for the rss.xml blog feed', () => {
      const value = 'https://alicetravels.travellerspoint.com/rss.xml'
      const expected: DiscoverUriHint = { key: 'travellerspoint:posts', label: 'Posts' }

      expect(travellerspointHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return the rss.xml blog feed as itself', async () => {
      const value = 'https://alicetravels.travellerspoint.com/rss.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [travellerspointHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'travellerspoint:posts', label: 'Posts' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
