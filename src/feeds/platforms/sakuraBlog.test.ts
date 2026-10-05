import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
})
