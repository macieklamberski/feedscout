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
      const expected = [
        {
          uri: 'https://example.tumblr.com/tagged/updates/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
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
      const expected = [
        {
          uri: 'https://example.tumblr.com/tagged/photography/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
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

    it('should return the https feeds for an http blog page', () => {
      const value = 'http://example.tumblr.com/post/123'
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

    it('should return the https tag feed URL for an http tag page', () => {
      const value = 'http://example.tumblr.com/tagged/updates'
      const expected = [
        {
          uri: 'https://example.tumblr.com/tagged/updates/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a blog feed', () => {
      const value = 'https://example.tumblr.com/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:posts', label: 'Posts' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a blog feed with a trailing slash', () => {
      const value = 'https://example.tumblr.com/rss/'
      const expected: DiscoverUriHint = { key: 'tumblr:posts', label: 'Posts' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a blog feed on a www subdomain', () => {
      const value = 'https://www.example.tumblr.com/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:posts', label: 'Posts' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an http blog feed', () => {
      const value = 'http://example.tumblr.com/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:posts', label: 'Posts' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://example.tumblr.com/tagged/updates/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:tag', label: 'Tag' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a percent-encoded tag feed', () => {
      const value = 'https://example.tumblr.com/tagged/caf%C3%A9/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:tag', label: 'Tag' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the theme posts hint for the format query on the blog root', () => {
      const value = 'https://example.tumblr.com/?format=rss'
      const expected: DiscoverUriHint = { key: 'tumblr:theme-posts', label: 'Theme posts' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed', () => {
      const value = 'https://example.tumblr.com/podcast'
      const expected: DiscoverUriHint = { key: 'tumblr:podcast', label: 'Podcast' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed under rss', () => {
      const value = 'https://example.tumblr.com/podcast/rss'
      const expected: DiscoverUriHint = { key: 'tumblr:podcast', label: 'Podcast' }

      expect(tumblrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the format query on a post page', () => {
      const value = 'https://example.tumblr.com/post/123?format=rss'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://example.tumblr.com/post/123'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://example.tumblr.com/tagged/updates'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on www.tumblr.com', () => {
      const value = 'https://www.tumblr.com/example/rss'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.tumblr.com/rss'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://tumblr.com/rss'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss'

      expect(tumblrHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.tumblr.com/rss', { key: 'tumblr:posts', label: 'Posts' }],
      ['https://example.tumblr.com/rss/', { key: 'tumblr:posts', label: 'Posts' }],
      ['https://www.example.tumblr.com/rss', { key: 'tumblr:posts', label: 'Posts' }],
      ['https://example.tumblr.com/tagged/updates/rss', { key: 'tumblr:tag', label: 'Tag' }],
      ['https://example.tumblr.com/tagged/updates/rss/', { key: 'tumblr:tag', label: 'Tag' }],
      [
        'https://example.tumblr.com/?format=rss',
        { key: 'tumblr:theme-posts', label: 'Theme posts' },
      ],
      [
        'https://www.example.tumblr.com/?format=rss',
        { key: 'tumblr:theme-posts', label: 'Theme posts' },
      ],
      ['https://example.tumblr.com/podcast', { key: 'tumblr:podcast', label: 'Podcast' }],
      ['https://example.tumblr.com/podcast/rss', { key: 'tumblr:podcast', label: 'Podcast' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [tumblrHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
