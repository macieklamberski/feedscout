import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { parseRakutenBlogUrl, type RakutenBlogUrl, rakutenBlogHandler } from './rakutenBlog.js'

describe('parseRakutenBlogUrl', () => {
  it('should return the username for a blog home page', () => {
    const expected: RakutenBlogUrl = { kind: 'blog', username: 'example' }

    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/example/')).toEqual(expected)
  })

  it('should return the username for a diary entry page', () => {
    const value = 'https://plaza.rakuten.co.jp/example/diary/201107010000/'
    const expected: RakutenBlogUrl = { kind: 'blog', username: 'example' }

    expect(parseRakutenBlogUrl(value)).toEqual(expected)
  })

  it('should lowercase the username', () => {
    const expected: RakutenBlogUrl = { kind: 'blog', username: 'example' }

    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/Example/')).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/_css/example.css')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/acc/g100/')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/dac/g1200')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/evt/selection/')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/img/logo/example.gif')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/inc/')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/rnd/example/')).toBeUndefined()
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/thm/155802/')).toBeUndefined()
  })

  it('should return undefined for the home page', () => {
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parseRakutenBlogUrl('https://api.plaza.rakuten.ne.jp/example/rss/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseRakutenBlogUrl('https://example.com/example/')).toBeUndefined()
  })
})

describe('rakutenBlogHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(rakutenBlogHandler.match('https://plaza.rakuten.co.jp/another/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(rakutenBlogHandler.match('https://example.com/another/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed on the api host for blog', () => {
      const value = 'https://plaza.rakuten.co.jp/another/diary/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://api.plaza.rakuten.ne.jp/another/rss/',
          hint: { key: 'rakuten-blog:posts', label: 'Posts' },
        },
      ]

      expect(rakutenBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Rakuten Blog', () => {
      expect(rakutenBlogHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
