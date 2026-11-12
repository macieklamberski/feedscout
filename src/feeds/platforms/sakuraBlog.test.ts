import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseSakuraBlogUrl, type SakuraBlogUrl, sakuraBlogHandler } from './sakuraBlog.js'

describe('parseSakuraBlogUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: SakuraBlogUrl = { kind: 'blog', hostname: 'alice.sblo.jp' }

    expect(parseSakuraBlogUrl('http://alice.sblo.jp/')).toEqual(expected)
  })

  it('should return the blog for an article page', () => {
    const expected: SakuraBlogUrl = { kind: 'blog', hostname: 'alice.sblo.jp' }

    expect(parseSakuraBlogUrl('http://alice.sblo.jp/article/123456.html')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSakuraBlogUrl('http://sblo.jp/')).toBeUndefined()
  })

  it('should return undefined for a Seesaa blog', () => {
    expect(parseSakuraBlogUrl('https://alice.seesaa.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSakuraBlogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('sakuraBlogHandler', () => {
  describe('match', () => {
    it('should return true for a blog subdomain', () => {
      expect(sakuraBlogHandler.match('http://alice.sblo.jp/')).toBe(true)
    })

    it('should return false for the www host', () => {
      expect(sakuraBlogHandler.match('http://www.sblo.jp/')).toBe(false)
    })

    it('should return false for a nested subdomain', () => {
      expect(sakuraBlogHandler.match('http://blog.alice.sblo.jp/')).toBe(false)
    })

    it('should return false for another host', () => {
      expect(sakuraBlogHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Sakura blog', () => {
      expect(sakuraBlogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS 2.0 and RDF feeds over http for an https blog URL', () => {
      const value = 'https://alice.sblo.jp/article/123456.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.sblo.jp/index20.rdf',
          hint: { key: 'sakura-blog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.sblo.jp/index.rdf',
          hint: { key: 'sakura-blog:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(sakuraBlogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS 2.0 feed', () => {
      const value = 'http://alice.sblo.jp/index20.rdf'
      const expected = 'sakura-blog:posts'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RDF feed', () => {
      const value = 'http://alice.sblo.jp/index.rdf'
      const expected = 'sakura-blog:posts'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed on the www host of a blog', () => {
      const value = 'http://www.alice.sblo.jp/index20.rdf'
      const expected = 'sakura-blog:posts'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for an article page', () => {
      const value = 'http://alice.sblo.jp/article/123456.html'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'http://blog.alice.sblo.jp/index20.rdf'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex domain', () => {
      const value = 'http://sblo.jp/index20.rdf'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'http://www.sblo.jp/index.rdf'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'http://example.com/index20.rdf'

      expect(sakuraBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'sakura-blog:posts', label: 'Posts' }
    const ownFeeds = [
      'http://alice.sblo.jp/index20.rdf',
      'http://alice.sblo.jp/index.rdf',
      'http://www.alice.sblo.jp/index20.rdf',
      'http://www.alice.sblo.jp/index.rdf',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [sakuraBlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
