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
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
        },
        {
          uri: 'https://rss.blog.naver.com/prologue.xml?rss=1.0',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
        },
        {
          uri: 'https://rss.blog.naver.com/prologue.xml?atom=0.3',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed URL for a post', () => {
      const value = 'https://blog.naver.com/prologue/223000000000'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://rss.blog.naver.com/prologue.xml',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
        },
        {
          uri: 'https://rss.blog.naver.com/prologue.xml?rss=1.0',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
        },
        {
          uri: 'https://rss.blog.naver.com/prologue.xml?atom=0.3',
          hint: { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
        },
      ]

      expect(naverBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the root', () => {
      expect(naverBlogHandler.resolve('https://blog.naver.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://rss.blog.naver.com/ansrnsdhqk74.xml'
      const expected: DiscoverUriHint = { key: 'naver-blog:blog', label: 'Blog', format: 'rss' }

      expect(naverBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed with a hyphen in the id', () => {
      const value = 'https://rss.blog.naver.com/chart-worm.xml'
      const expected: DiscoverUriHint = { key: 'naver-blog:blog', label: 'Blog', format: 'rss' }

      expect(naverBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed over http', () => {
      const value = 'http://rss.blog.naver.com/prologue.xml'
      const expected: DiscoverUriHint = { key: 'naver-blog:blog', label: 'Blog', format: 'rss' }

      expect(naverBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it.each<[string, DiscoverUriHint]>([
      [
        'https://rss.blog.naver.com/alice',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
      ],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?blogId=alice',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
      ],
      [
        'https://rss.blog.naver.com/alice.xml?rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/alice.xml?atom=0.3',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
      [
        'http://rss.blog.naver.com/alice?rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?blogId=alice&rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/alice?atom=0.3',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?atom=0.3&blogId=alice',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
    ])('should return the blog hint for %s', (value, expected) => {
      expect(naverBlogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a file on the feed host', () => {
      const value = 'https://rss.blog.naver.com/robots.txt'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.naver.com/prologue'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an xml path on the blog host', () => {
      const value = 'https://blog.naver.com/prologue.xml'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the root of the feed host', () => {
      const value = 'https://rss.blog.naver.com/'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a nested path on the feed host', () => {
      const value = 'https://rss.blog.naver.com/prologue/223000000000.xml'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/prologue.xml'

      expect(naverBlogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://rss.blog.naver.com/ansrnsdhqk74.xml',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
      ],
      [
        'https://rss.blog.naver.com/chart-worm.xml',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
      ],
      ['http://rss.blog.naver.com/alice', { key: 'naver-blog:blog', label: 'Blog', format: 'rss' }],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?blogId=alice',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rss' },
      ],
      [
        'https://rss.blog.naver.com/alice.xml?rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/alice.xml?atom=0.3',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
      [
        'http://rss.blog.naver.com/alice?rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?blogId=alice&rss=1.0',
        { key: 'naver-blog:blog', label: 'Blog', format: 'rdf' },
      ],
      [
        'https://rss.blog.naver.com/alice?atom=0.3',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
      [
        'https://rss.blog.naver.com/rss/blogRss.nhn?atom=0.3&blogId=alice',
        { key: 'naver-blog:blog', label: 'Blog', format: 'atom' },
      ],
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
