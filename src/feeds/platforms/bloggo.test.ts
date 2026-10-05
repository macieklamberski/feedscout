import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BloggoUrl, bloggoHandler, parseBloggoUrl } from './bloggo.js'

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

  it('should return the blog for the blog feed url', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/feed/')).toEqual(expected)
  })

  it('should return the blog for the about page', () => {
    const expected: BloggoUrl = { kind: 'blog' }

    expect(parseBloggoUrl('https://alice.bloggo.nu/about/')).toEqual(expected)
  })

  const serviceSubdomains: Array<string> = ['admin', 'img', 'reg', 'static', 'www']

  it.each(serviceSubdomains)('should return undefined for the %s service host', (subdomain) => {
    expect(parseBloggoUrl(`https://${subdomain}.bloggo.nu/`)).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseBloggoUrl('https://bloggo.nu/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBloggoUrl('https://example.com/Min-forsta-resa/')).toBeUndefined()
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

    it('should spell the feeds with https for an http page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bloggo.nu/feed/',
          hint: { key: 'bloggo:posts', label: 'Posts' },
        },
      ]

      expect(bloggoHandler.resolve('http://alice.bloggo.nu/')).toEqual(expected)
    })
  })
})
