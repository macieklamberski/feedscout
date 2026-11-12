import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type BlogHuUrl, blogHuHandler, parseBlogHuUrl } from './blogHu.js'

describe('parseBlogHuUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogHuUrl = { kind: 'blog', blog: 'kertbuvolo' }

    expect(parseBlogHuUrl('https://kertbuvolo.blog.hu/')).toEqual(expected)
  })

  it('should return the blog for a post on a blog subdomain', () => {
    const value = 'https://egyatucatbol.blog.hu/2026/09/30/blog_vs_imdb'
    const expected: BlogHuUrl = { kind: 'blog', blog: 'egyatucatbol' }

    expect(parseBlogHuUrl(value)).toEqual(expected)
  })

  it('should return the user for a user profile', () => {
    const expected: BlogHuUrl = { kind: 'user', userId: '821883' }

    expect(parseBlogHuUrl('https://blog.hu/user/821883')).toEqual(expected)
  })

  it('should return the user for a user profile on www', () => {
    const expected: BlogHuUrl = { kind: 'user', userId: '821883' }

    expect(parseBlogHuUrl('https://www.blog.hu/User/821883/')).toEqual(expected)
  })

  it('should return undefined for a non-numeric user path', () => {
    expect(parseBlogHuUrl('https://blog.hu/user/alice')).toBeUndefined()
  })

  it('should return undefined for the apex home page', () => {
    expect(parseBlogHuUrl('https://blog.hu/')).toBeUndefined()
  })

  it('should return undefined for the www home page', () => {
    expect(parseBlogHuUrl('https://www.blog.hu/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBlogHuUrl('https://a.kertbuvolo.blog.hu/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlogHuUrl('https://example.com/user/821883')).toBeUndefined()
  })

  it('should return undefined for invalid URL', () => {
    expect(parseBlogHuUrl('not-a-url')).toBeUndefined()
  })
})

describe('blogHuHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(blogHuHandler.match('https://kertbuvolo.blog.hu/')).toBe(true)
    })

    it('should return false for the apex home page', () => {
      expect(blogHuHandler.match('https://blog.hu/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside blog.hu', () => {
      expect(blogHuHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return posts and comments feeds for a blog', () => {
      const value = 'https://kertbuvolo.blog.hu/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://kertbuvolo.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://kertbuvolo.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://kertbuvolo.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'https://kertbuvolo.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a user profile', () => {
      const value = 'https://blog.hu/user/821883'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.hu/user/821883/rss',
          hint: { key: 'blog-hu:user', label: 'User activity' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http blog page', () => {
      const value = 'http://kertbuvolo.blog.hu/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://kertbuvolo.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://kertbuvolo.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://kertbuvolo.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://kertbuvolo.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the apex user feed for a user profile on www over http', () => {
      const value = 'http://www.blog.hu/user/821883'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.hu/user/821883/rss',
          hint: { key: 'blog-hu:user', label: 'User activity' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    const feedKeys: Array<[string, string]> = [
      ['https://isolde.blog.hu/rss2', 'blog-hu:posts'],
      ['https://bit.blog.hu/rss', 'blog-hu:posts'],
      ['https://juventuz.blog.hu/atom', 'blog-hu:posts'],
      ['https://candc.blog.hu/comments/rss2', 'blog-hu:comments'],
      ['https://sajtologia.blog.hu/comments/rss', 'blog-hu:comments'],
      ['https://usznikek.blog.hu/comments/comments/rss', 'blog-hu:comments'],
      ['https://lambda.blog.hu/comments/comments/rss2', 'blog-hu:comments'],
      ['https://konyves.blog.hu/comments/comments/rss2/', 'blog-hu:comments'],
      ['https://isolde.blog.hu/comments/atom', 'blog-hu:comments'],
      ['http://kertbuvolo.blog.hu/rss2', 'blog-hu:posts'],
      ['https://blog.hu/user/1264714/rss', 'blog-hu:user'],
      ['https://www.blog.hu/user/1264714/rss', 'blog-hu:user'],
    ]

    it.each(feedKeys)('should return the key for %s', (value, expected) => {
      expect(blogHuHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user feed carrying a token', () => {
      const value = 'https://blog.hu/user/1264505/rss?token=0123456789abcdef'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://egyatucatbol.blog.hu/2026/09/30/blog_vs_imdb'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a user profile', () => {
      const value = 'https://blog.hu/user/821883'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://blog.hu/rss2'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://a.kertbuvolo.blog.hu/rss2'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/rss2'

      expect(blogHuHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://isolde.blog.hu/rss2', { key: 'blog-hu:posts', label: 'Posts' }],
      ['https://bit.blog.hu/rss', { key: 'blog-hu:posts', label: 'Posts' }],
      ['https://juventuz.blog.hu/atom', { key: 'blog-hu:posts', label: 'Posts' }],
      ['https://candc.blog.hu/comments/rss2', { key: 'blog-hu:comments', label: 'Comments' }],
      ['https://sajtologia.blog.hu/comments/rss', { key: 'blog-hu:comments', label: 'Comments' }],
      [
        'https://usznikek.blog.hu/comments/comments/rss',
        { key: 'blog-hu:comments', label: 'Comments' },
      ],
      [
        'https://lambda.blog.hu/comments/comments/rss2',
        { key: 'blog-hu:comments', label: 'Comments' },
      ],
      ['https://isolde.blog.hu/comments/atom', { key: 'blog-hu:comments', label: 'Comments' }],
      ['https://blog.hu/user/1264714/rss', { key: 'blog-hu:user', label: 'User activity' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [blogHuHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
