import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { parseSeesaaUrl, type SeesaaUrl, seesaaHandler } from './seesaa.js'

describe('parseSeesaaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: SeesaaUrl = { kind: 'blog' }

    expect(parseSeesaaUrl('https://example.seesaa.net/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSeesaaUrl('https://seesaa.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSeesaaUrl('https://example.com/')).toBeUndefined()
  })
})

describe('seesaaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.seesaa.net'],
      [true, 'https://blog.example.seesaa.net'],
      [false, 'https://seesaa.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(seesaaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(seesaaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Seesaa', () => {
      expect(seesaaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS 2.0 and RDF feeds for blog', () => {
      const value = 'https://alice.seesaa.net'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: 'https://alice.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.seesaa.net/article/123.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: 'https://alice.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })
  })
})
