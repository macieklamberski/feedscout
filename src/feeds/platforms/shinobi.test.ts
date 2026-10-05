import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
})
