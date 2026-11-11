import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { NaverBlogUrl } from './naverBlog.js'
import { naverBlogHandler, parseNaverBlogUrl } from './naverBlog.js'

describe('parseNaverBlogUrl', () => {
  it('should return the blog for a desktop blog URL', () => {
    const expected: NaverBlogUrl = { kind: 'blog', blogId: 'prologue' }

    expect(parseNaverBlogUrl('https://blog.naver.com/prologue')).toEqual(expected)
  })

  it('should return the blog for a mobile blog URL', () => {
    const expected: NaverBlogUrl = { kind: 'blog', blogId: 'prologue' }

    expect(parseNaverBlogUrl('https://m.blog.naver.com/prologue')).toEqual(expected)
  })

  it('should return the post for a post URL', () => {
    const value = 'https://m.blog.naver.com/prologue/223000000000'
    const expected: NaverBlogUrl = { kind: 'post', blogId: 'prologue' }

    expect(parseNaverBlogUrl(value)).toEqual(expected)
  })

  it('should return the post named in the blogId query of a PostView page', () => {
    const value = 'https://blog.naver.com/PostView.naver?blogId=prologue&logNo=223000000000'
    const expected: NaverBlogUrl = { kind: 'post', blogId: 'prologue' }

    expect(parseNaverBlogUrl(value)).toEqual(expected)
  })

  it('should return the post named in the blogId query on the mobile host', () => {
    const value = 'https://m.blog.naver.com/PostView.naver?blogId=prologue&logNo=223000000000'
    const expected: NaverBlogUrl = { kind: 'post', blogId: 'prologue' }

    expect(parseNaverBlogUrl(value)).toEqual(expected)
  })

  it('should return undefined for paths with dots', () => {
    expect(parseNaverBlogUrl('https://blog.naver.com/BlogList.naver')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseNaverBlogUrl('https://blog.naver.com/')).toBeUndefined()
    expect(parseNaverBlogUrl('https://blog.naver.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNaverBlogUrl('https://naver.com/prologue')).toBeUndefined()
    expect(parseNaverBlogUrl('https://example.com/prologue')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNaverBlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('naverBlogHandler', () => {
  describe('match', () => {
    it('should match a Naver Blog URL', () => {
      expect(naverBlogHandler.match('https://blog.naver.com/prologue')).toBe(true)
    })

    it('should not match another host', () => {
      expect(naverBlogHandler.match('https://naver.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://blog.naver.com/prologue'
      const expected = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed URL for a post', () => {
      const value = 'https://blog.naver.com/prologue/223000000000'
      const expected = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the root', () => {
      expect(naverBlogHandler.resolve('https://blog.naver.com/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the blog key for a blog feed', () => {
      const value = 'https://rss.blog.naver.com/ansrnsdhqk74.xml'
      const expected = 'naver-blog:blog'

      expect(naverBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed with a hyphen in the id', () => {
      const value = 'https://rss.blog.naver.com/chart-worm.xml'
      const expected = 'naver-blog:blog'

      expect(naverBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed over http', () => {
      const value = 'http://rss.blog.naver.com/prologue.xml'
      const expected = 'naver-blog:blog'

      expect(naverBlogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.naver.com/prologue'

      expect(naverBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an xml path on the blog host', () => {
      const value = 'https://blog.naver.com/prologue.xml'

      expect(naverBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the root of the feed host', () => {
      const value = 'https://rss.blog.naver.com/'

      expect(naverBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a nested path on the feed host', () => {
      const value = 'https://rss.blog.naver.com/prologue/223000000000.xml'

      expect(naverBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/prologue.xml'

      expect(naverBlogHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://rss.blog.naver.com/ansrnsdhqk74.xml', { key: 'naver-blog:blog', label: 'Blog' }],
      ['https://rss.blog.naver.com/chart-worm.xml', { key: 'naver-blog:blog', label: 'Blog' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [naverBlogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
