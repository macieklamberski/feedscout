import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { TumblrUrl } from './tumblr.js'
import { parseTumblrUrl, tumblrHandler } from './tumblr.js'

describe('parseTumblrUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://example.tumblr.com')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'alice' }

    expect(parseTumblrUrl('https://alice.tumblr.com/post/123')).toEqual(expected)
  })

  it('should return the tag for a tagged page', () => {
    const expected: TumblrUrl = { kind: 'tag', blog: 'example', tag: 'updates' }

    expect(parseTumblrUrl('https://example.tumblr.com/tagged/updates')).toEqual(expected)
  })

  it('should return the tag for a www.tumblr.com tagged path', () => {
    const expected: TumblrUrl = { kind: 'tag', blog: 'example', tag: 'updates' }

    expect(parseTumblrUrl('https://www.tumblr.com/example/tagged/updates')).toEqual(expected)
  })

  it('should return the tag for a www.tumblr.com tagged path with a capitalized segment', () => {
    const expected: TumblrUrl = { kind: 'tag', blog: 'example', tag: 'updates' }

    expect(parseTumblrUrl('https://www.tumblr.com/example/Tagged/updates')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com tagged path without a tag', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/example/tagged')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com blog path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/example')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com post path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/example/123/example-post')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/blog/view/example')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path with a capitalized view segment', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/blog/View/example')).toEqual(expected)
  })

  it('should return the blog for a www.tumblr.com/blog/view path with a capitalized blog segment', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://www.tumblr.com/Blog/view/example')).toEqual(expected)
  })

  it('should return the blog for a tumblr.com apex blog path', () => {
    const expected: TumblrUrl = { kind: 'blog', blog: 'example' }

    expect(parseTumblrUrl('https://tumblr.com/example')).toEqual(expected)
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

  it('should return undefined for a dotted first segment', () => {
    expect(parseTumblrUrl('https://www.tumblr.com/robots.txt')).toBeUndefined()
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
    it('should return an empty array for a path blog that is not one host label', () => {
      const value = 'https://www.tumblr.com/alice@example.org'

      expect(tumblrHandler.resolve(value)).toEqual([])
    })

    it('should return the tag feed for a capitalized tagged segment', () => {
      const value = 'https://example.tumblr.com/Tagged/updates'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.tumblr.com/tagged/updates/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.tumblr.com/rss',
          hint: { key: 'tumblr:posts', label: 'Posts' },
        },
        {
          uri: 'https://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'https://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts, theme posts and podcast feeds for blog', () => {
      const value = 'https://example.tumblr.com'
      const expected = [
        { uri: 'https://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
        {
          uri: 'https://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'https://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return tagged feed URL for tag page', () => {
      const value = 'https://example.tumblr.com/tagged/photography'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.tumblr.com/tagged/photography/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.tumblr.com/rss',
          hint: { key: 'tumblr:posts', label: 'Posts' },
        },
        {
          uri: 'https://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'https://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog subdomain feeds for www.tumblr.com blog path', () => {
      const value = 'https://www.tumblr.com/example/123/example-post'
      const expected = [
        { uri: 'https://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
        {
          uri: 'https://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'https://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of an http blog page', () => {
      const value = 'http://example.tumblr.com/post/123'
      const expected = [
        { uri: 'http://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
        {
          uri: 'http://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'http://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of an http tag page', () => {
      const value = 'http://example.tumblr.com/tagged/updates'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.tumblr.com/tagged/updates/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
        {
          uri: 'http://example.tumblr.com/rss',
          hint: { key: 'tumblr:posts', label: 'Posts' },
        },
        {
          uri: 'http://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
        {
          uri: 'http://example.tumblr.com/podcast',
          hint: { key: 'tumblr:podcast', label: 'Podcast' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a podcast feed under rss', () => {
      const value = 'https://example.tumblr.com/podcast/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:podcast', label: 'Podcast' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a theme posts feed as itself', async () => {
      const value = 'https://example.tumblr.com/?format=rss'
      const options = {
        ...defaultPlatformOptions,
        handlers: [tumblrHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.tumblr.com/?format=rss',
          hint: { key: 'tumblr:theme-posts', label: 'Theme posts' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
