import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { TumblrUrl } from './tumblr.js'
import { parseTumblrUrl, tumblrHandler } from './tumblr.js'

describe('parseTumblrUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://staff.tumblr.com')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'engineering' }

    expect(parseTumblrUrl('https://engineering.tumblr.com/post/123')).toEqual(expected)
  })

  it('should return the blog for a tagged page', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://staff.tumblr.com/tagged/updates')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com blog path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://www.tumblr.com/staff')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com post path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://www.tumblr.com/staff/123/example-post')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://www.tumblr.com/blog/view/staff')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path with a capitalized view segment', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://www.tumblr.com/blog/View/staff')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path with a capitalized blog segment', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://www.tumblr.com/Blog/view/staff')).toEqual(expected)
  })

  it('should return the blog for a tumblr.com apex blog path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'staff' }

    expect(parseTumblrUrl('https://tumblr.com/staff')).toEqual(expected)
  })

  it('should return undefined for a www.tumblr.com site route', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/explore')).toBeUndefined()
  })

  it('should return undefined for a capitalized www.tumblr.com site route', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/Explore')).toBeUndefined()
  })

  it('should return undefined for a www.tumblr.com tag route', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/tagged/photography')).toBeUndefined()
  })

  it('should return undefined for a www.tumblr.com/blog path without a blog', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/blog/view')).toBeUndefined()
  })

  it('should return undefined for www.tumblr.com', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseTumblrUrl('https://blog.example.tumblr.com')).toBeUndefined()
  })

  it('should return undefined for the tumblr.com apex', () => {
    expect(parseTumblrUrl('https://tumblr.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTumblrUrl('https://example.com')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseTumblrUrl('not-a-url')).toBeUndefined()
  })
})

describe('tumblrHandler', () => {
  describe('resolve', () => {
    it('should return the tag feed for a capitalized tagged segment', () => {
      const value = 'https://staff.tumblr.com/Tagged/updates'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://staff.tumblr.com/tagged/updates/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for blog', () => {
      const value = 'https://example.tumblr.com'
      const expected = [
        { uri: 'https://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return tagged feed URL for tag page', () => {
      const value = 'https://example.tumblr.com/tagged/photography'
      const expected = [
        {
          uri: 'https://example.tumblr.com/tagged/photography/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return blog subdomain feed URL for www.tumblr.com blog path', () => {
      const value = 'https://www.tumblr.com/example/123/example-post'
      const expected = [
        { uri: 'https://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL that names no blog', () => {
      expect(tumblrHandler.resolve('https://www.tumblr.com/explore')).toEqual([])
    })
  })
})
