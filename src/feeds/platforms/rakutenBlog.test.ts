import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should keep the case of the username', () => {
    const expected: RakutenBlogUrl = { kind: 'blog', username: 'Example' }

    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/Example/')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parseRakutenBlogUrl('https://api.plaza.rakuten.ne.jp/example/rss/')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseRakutenBlogUrl('https://plaza.rakuten.co.jp/robots.txt')).toBeUndefined()
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

  describe('getFeedHint', () => {
    it('should return the posts hint for a posts feed', () => {
      const value = 'https://api.plaza.rakuten.ne.jp/alicestaff/rss/'
      const expected: DiscoverUriHint = { key: 'rakuten-blog:posts', label: 'Posts' }

      expect(rakutenBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a posts feed at the blog root on the feed host', () => {
      const value = 'https://api.plaza.rakuten.ne.jp/carolpink/'
      const expected: DiscoverUriHint = { key: 'rakuten-blog:posts', label: 'Posts' }

      expect(rakutenBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://plaza.rakuten.co.jp/alicestaff/diary/'

      expect(rakutenBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another path on the feed host', () => {
      const value = 'https://api.plaza.rakuten.ne.jp/alicestaff/diary/'

      expect(rakutenBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/alicestaff/rss/'

      expect(rakutenBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://api.plaza.rakuten.ne.jp/alicestaff/rss/',
        { key: 'rakuten-blog:posts', label: 'Posts' },
      ],
      [
        'https://api.plaza.rakuten.ne.jp/bobhikes/rss/',
        { key: 'rakuten-blog:posts', label: 'Posts' },
      ],
      ['https://api.plaza.rakuten.ne.jp/carolpink/', { key: 'rakuten-blog:posts', label: 'Posts' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [rakutenBlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
