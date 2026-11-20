import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type BlogHuUrl, blogHuHandler, parseBlogHuUrl } from './blogHu.js'

describe('parseBlogHuUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogHuUrl = { kind: 'blog', blog: 'bob' }

    expect(parseBlogHuUrl('https://bob.blog.hu/')).toEqual(expected)
  })

  it('should return the blog for a post on a blog subdomain', () => {
    const value = 'https://carol.blog.hu/2026/09/30/blog_vs_imdb'
    const expected: BlogHuUrl = {
      kind: 'blog',
      blog: 'carol',
      post: { year: '2026', month: '09', day: '30', slug: 'blog_vs_imdb' },
    }

    expect(parseBlogHuUrl(value)).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const value = 'https://example.blog.hu/tags/example%20tag'
    const expected: BlogHuUrl = { kind: 'blog', blog: 'example', tag: 'example tag' }

    expect(parseBlogHuUrl(value)).toEqual(expected)
  })

  it('should return the user for a user profile', () => {
    const expected: BlogHuUrl = { kind: 'user', userId: '654321' }

    expect(parseBlogHuUrl('https://blog.hu/user/654321')).toEqual(expected)
  })

  it('should return the user for a user profile on www', () => {
    const expected: BlogHuUrl = { kind: 'user', userId: '654321' }

    expect(parseBlogHuUrl('https://www.blog.hu/User/654321/')).toEqual(expected)
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
    expect(parseBlogHuUrl('https://a.bob.blog.hu/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBlogHuUrl('https://example.com/user/654321')).toBeUndefined()
  })

  it('should return undefined for invalid URL', () => {
    expect(parseBlogHuUrl('not-a-url')).toBeUndefined()
  })
})

describe('blogHuHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(blogHuHandler.match('https://bob.blog.hu/')).toBe(true)
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
      const value = 'https://bob.blog.hu/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'https://bob.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the post comments feeds first for a post page', () => {
      const value = 'https://example.blog.hu/2013/06/30/example_post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blog.hu/2013/06/30/example_post/rss2',
          hint: { key: 'blog-hu:post-comments', label: 'Post comments', format: 'rss' },
        },
        {
          uri: 'https://example.blog.hu/2013/06/30/example_post/atom',
          hint: { key: 'blog-hu:post-comments', label: 'Post comments', format: 'atom' },
        },
        {
          uri: 'https://example.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'https://example.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feeds first for a tag page', () => {
      const value = 'http://example.blog.hu/tags/example%20tag'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.blog.hu/rss/tags/example%20tag',
          hint: { key: 'blog-hu:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'http://example.blog.hu/atom/tags/example%20tag',
          hint: { key: 'blog-hu:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'http://example.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://example.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://example.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://example.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a user profile', () => {
      const value = 'https://blog.hu/user/654321'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.hu/user/654321/rss',
          hint: { key: 'blog-hu:user', label: 'User activity' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http blog page', () => {
      const value = 'http://bob.blog.hu/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://bob.blog.hu/rss2',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://bob.blog.hu/atom',
          hint: { key: 'blog-hu:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://bob.blog.hu/comments/rss2',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://bob.blog.hu/comments/atom',
          hint: { key: 'blog-hu:comments', label: 'Comments', format: 'atom' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the apex user feed for a user profile on www over http', () => {
      const value = 'http://www.blog.hu/user/654321'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.hu/user/654321/rss',
          hint: { key: 'blog-hu:user', label: 'User activity' },
        },
      ]

      expect(blogHuHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for the posts feed at /xml/rss2', () => {
      const value = 'https://example.blog.hu/xml/rss2'
      const expected: DiscoverUriHint = { key: 'blog-hu:posts', label: 'Posts', format: 'rss' }

      expect(blogHuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the post comments hint for a feed under a dated post', () => {
      const value = 'https://example.blog.hu/2013/06/30/example_post/atom'
      const expected: DiscoverUriHint = {
        key: 'blog-hu:post-comments',
        label: 'Post comments',
        format: 'atom',
      }

      expect(blogHuHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed under four segments that are not a dated post', () => {
      const value = 'https://example.blog.hu/comments/comments/comments/comments/rss2'

      expect(blogHuHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a user feed with a token as itself', async () => {
      const value = 'https://blog.hu/user/12345/rss?token=0123456789abcdef'
      const options = {
        ...defaultPlatformOptions,
        handlers: [blogHuHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.hu/user/12345/rss?token=0123456789abcdef',
          hint: { key: 'blog-hu:user', label: 'User activity' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
