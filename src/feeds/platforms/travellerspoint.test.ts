import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  const siteHostUrls: Array<string> = [
    'https://www.travellerspoint.com/blog.cfm',
    'https://photos.travellerspoint.com/',
    'https://guide.travellerspoint.com/Famous_Landmarks/',
    'https://blog.travellerspoint.com/',
    'https://img.travellerspoint.com/',
    'https://secure.travellerspoint.com/',
    'https://m.travellerspoint.com/',
    'https://assets.travellerspoint.com/',
  ]

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
})
