import { describe, expect, it } from 'bun:test'
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

    it.todo('should resolve blog name from www.tumblr.com/{blog} URLs', () => {
      // www.tumblr.com/{blog} is not matched, so resolve never reads the blog name from its
      // path; likely needs a source fix.
    })
  })
})
