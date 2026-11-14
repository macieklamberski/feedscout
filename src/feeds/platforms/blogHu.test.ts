import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BlogHuUrl, blogHuHandler, parseBlogHuUrl } from './blogHu.js'

describe('parseBlogHuUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BlogHuUrl = { kind: 'blog' }

    expect(parseBlogHuUrl('https://bob.blog.hu/')).toEqual(expected)
  })

  it('should return the blog for a post on a blog subdomain', () => {
    const value = 'https://carol.blog.hu/2026/09/30/blog_vs_imdb'
    const expected: BlogHuUrl = { kind: 'blog' }

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
  })
})
