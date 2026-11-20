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

    it('should return the classic feeds over http and rss.xml on the page scheme', () => {
      const value = 'https://alice.sblo.jp/article/123456.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: ['http://alice.sblo.jp/index20.rdf', 'https://alice.sblo.jp/rss.xml'],
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

  describe('getFeedHint', () => {
    it('should return the posts hint for the rss.xml feed of a newer blog', () => {
      const value = 'https://alice.sblo.jp/rss.xml'
      const expected: DiscoverUriHint = { key: 'sakura-blog:posts', label: 'Posts', format: 'rss' }

      expect(sakuraBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an RDF feed on the www host of a blog as itself', async () => {
      const value = 'http://www.alice.sblo.jp/index.rdf'
      const options = {
        ...defaultPlatformOptions,
        handlers: [sakuraBlogHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.alice.sblo.jp/index.rdf',
          hint: { key: 'sakura-blog:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
