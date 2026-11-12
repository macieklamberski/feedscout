import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  type BloggoPage,
  type BloggoUrl,
  bloggoHandler,
  getBloggoPage,
  parseBloggoUrl,
} from './bloggo.js'

describe('parseBloggoUrl', () => {
  it('should return the blog for the blog home', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const expected: BloggoUrl = { kind: 'post', slug: 'Min-forsta-resa' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/Min-forsta-resa/')).toEqual(expected)
  })

  it('should return the post for a post page without a trailing slash', () => {
    const expected: BloggoUrl = { kind: 'post', slug: 'Min-forsta-resa' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/Min-forsta-resa')).toEqual(expected)
  })

  it('should return the blog for a category page', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/category/resa/')).toEqual(expected)
  })

  it('should return the blog for a monthly archive page', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/2024/01/')).toEqual(expected)
  })

  it('should return the blog for the about page', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/about/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseBloggoUrl('https://www.bloggo.nu/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBloggoUrl('https://blog.alice.bloggo.nu/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBloggoUrl('https://bloggo.nu/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBloggoUrl('https://example.com/Min-forsta-resa/')).toBeUndefined()
  })
})

describe('getBloggoPage', () => {
  const value = 'https://alice.bloggo.nu/Min-forsta-resa'

  it('should return the post when the page carries a post-id body class', () => {
    const content = '<body class="blog post-id-367853">'
    const expected: BloggoPage = { kind: 'post', slug: 'Min-forsta-resa' }

    expect(getBloggoPage(value, content)).toEqual(expected)
  })

  it('should fall back to the blog when the page carries no post-id body class', () => {
    const expected: BloggoPage = { kind: 'blog' }

    expect(getBloggoPage(value, '<body class="blog">')).toEqual(expected)
  })

  it('should keep the post without content', () => {
    const expected: BloggoPage = { kind: 'post', slug: 'Min-forsta-resa' }

    expect(getBloggoPage(value, undefined)).toEqual(expected)
  })
})

describe('bloggoHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(bloggoHandler.match('https://alice.bloggo.nu/')).toBe(true)
    })

    it('should not match another host', () => {
      expect(bloggoHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Bloggo', () => {
      expect(bloggoHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for the blog home', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve('https://alice.bloggo.nu/')).toEqual(expected)
    })

    it('should return the post comments and posts feeds for a post page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/Min-forsta-resa/feed/',
          hint: { key: 'bloggo:post-comments', label: 'Post comments' },
        },
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve('https://alice.bloggo.nu/Min-forsta-resa/')).toEqual(expected)
    })

    it('should return the post comments and posts feeds for a post page with content', () => {
      const value = 'https://alice.bloggo.nu/Min-forsta-resa/'
      const content = `
        <link
          rel="alternate"
          href="https://alice.bloggo.nu/Min-forsta-resa/feed/"
          type="application/rss+xml"
          title="alice - Kommentarer på Min första resa"
        >
        <body class="blog post-id-367853">
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/Min-forsta-resa/feed/',
          hint: { key: 'bloggo:post-comments', label: 'Post comments' },
        },
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the posts feed for a missing post', () => {
      const value = 'https://alice.bloggo.nu/Min-forsta-resa/'
      const content = `
        <body>
        <div id="mainpanel">
          <h3>404 - Sidan kunde inte hittas.</h3>
          <p><a href="/">Tillbaka till bloggens startsida</a></p>
        </div>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the posts feed for a blog over its traffic limit', () => {
      const value = 'https://alice.bloggo.nu/Min-forsta-resa/'
      const content = `
        <body>
        <div>
          <h3>Ett fel uppstod</h3>
          <p>Trafikgränsen för den här veckan är nådd för bloggen.</p>
        </div>
        </body>
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve(value, content)).toEqual(expected)
    })

    it('should keep the scheme of an http page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve('http://alice.bloggo.nu/')).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a posts feed', () => {
      const value = 'https://gunwah.bloggo.nu/feed/'
      const expected: DiscoverUriHint = { key: 'bloggo:posts', label: 'Posts' }

      expect(bloggoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an http posts feed without a trailing slash', () => {
      const value = 'http://schackelina.bloggo.nu/feed'
      const expected: DiscoverUriHint = { key: 'bloggo:posts', label: 'Posts' }

      expect(bloggoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the post comments hint for a post comments feed', () => {
      const value = 'https://gunwah.bloggo.nu/Vitsippan-ute-i-backarna-star-/feed/'
      const expected: DiscoverUriHint = { key: 'bloggo:post-comments', label: 'Post comments' }

      expect(bloggoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the post comments hint for a post comments feed without a trailing slash', () => {
      const value = 'https://eva49.bloggo.nu/Atta-nyanser-av-gront-/feed'
      const expected: DiscoverUriHint = { key: 'bloggo:post-comments', label: 'Post comments' }

      expect(bloggoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the post comments hint for a percent-encoded post comments feed', () => {
      const value = 'http://martasrike.bloggo.nu/M%C3%B6rkbladiga+fl%C3%A4der/feed/'
      const expected: DiscoverUriHint = { key: 'bloggo:post-comments', label: 'Post comments' }

      expect(bloggoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'https://gunwah.bloggo.nu/Vitsippan-ute-i-backarna-star-/'

      expect(bloggoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.bloggo.nu/feed/'

      expect(bloggoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex domain', () => {
      const value = 'https://bloggo.nu/feed/'

      expect(bloggoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.bloggo.nu/feed/'

      expect(bloggoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/Min-forsta-resa/feed/'

      expect(bloggoHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const posts: DiscoverUriHint = { key: 'bloggo:posts', label: 'Posts' }
    const postComments: DiscoverUriHint = { key: 'bloggo:post-comments', label: 'Post comments' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://gunwah.bloggo.nu/feed/', posts],
      ['https://orad.bloggo.nu/feed', posts],
      ['https://gunwah.bloggo.nu/Vitsippan-ute-i-backarna-star-/feed/', postComments],
      ['https://eva49.bloggo.nu/Atta-nyanser-av-gront-/feed', postComments],
      ['http://martasrike.bloggo.nu/M%C3%B6rkbladiga+fl%C3%A4der/feed/', postComments],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [bloggoHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
