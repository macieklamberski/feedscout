import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type IsProgrammerUrl, isProgrammerHandler, parseIsProgrammerUrl } from './isProgrammer.js'

describe('parseIsProgrammerUrl', () => {
  it('should return the blog for a blog home page', () => {
    const expected: IsProgrammerUrl = { kind: 'blog', blog: 'alice' }

    expect(parseIsProgrammerUrl('http://alice.is-programmer.com/')).toEqual(expected)
  })

  it('should return the blog for a page other than a post', () => {
    const expected: IsProgrammerUrl = { kind: 'blog', blog: 'alice' }

    expect(parseIsProgrammerUrl('http://alice.is-programmer.com/categories/1234/posts')).toEqual(
      expected,
    )
  })

  it('should lowercase the blog from a mixed-case host', () => {
    const expected: IsProgrammerUrl = { kind: 'blog', blog: 'alice' }

    expect(parseIsProgrammerUrl('http://Alice.is-programmer.com/')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const expected: IsProgrammerUrl = { kind: 'post', blog: 'alice', postId: '12345' }

    expect(parseIsProgrammerUrl('http://alice.is-programmer.com/posts/12345.html')).toEqual(
      expected,
    )
  })

  it('should return the post for a post url without the html suffix', () => {
    const expected: IsProgrammerUrl = { kind: 'post', blog: 'alice', postId: '12345' }

    expect(parseIsProgrammerUrl('http://alice.is-programmer.com/posts/12345')).toEqual(expected)
  })

  it('should return the blog for a posts path without an id', () => {
    const expected: IsProgrammerUrl = { kind: 'blog', blog: 'alice' }

    expect(parseIsProgrammerUrl('http://alice.is-programmer.com/posts/latest')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseIsProgrammerUrl('http://www.is-programmer.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseIsProgrammerUrl('http://is-programmer.com/')).toBeUndefined()
  })

  it('should return undefined for a host below a blog subdomain', () => {
    expect(parseIsProgrammerUrl('http://www.alice.is-programmer.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseIsProgrammerUrl('http://alice.example.com/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseIsProgrammerUrl('not-a-url')).toBeUndefined()
  })
})

describe('isProgrammerHandler', () => {
  describe('match', () => {
    it('should return true for a blog page', () => {
      expect(isProgrammerHandler.match('http://alice.is-programmer.com/')).toBe(true)
    })

    it('should return false for the www host', () => {
      expect(isProgrammerHandler.match('http://www.is-programmer.com/')).toBe(false)
    })

    it('should return true for a blog page with its own favicon', () => {
      const content =
        '<link rel="shortcut icon" type="image/x-icon" href="http://alice.is-programmer.com/user_files/Alice/config/favicon.ico" />'

      expect(isProgrammerHandler.match('http://alice.is-programmer.com/', content)).toBe(true)
    })

    it('should return false for the sign-up page an unregistered name answers', () => {
      const content =
        '<link rel="shortcut icon" type="image/x-icon" href="http://alice.is-programmer.com/user_files/index/config/favicon.ico" />'

      expect(isProgrammerHandler.match('http://alice.is-programmer.com/', content)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return an empty array for a URL outside is-Programmer', () => {
      expect(isProgrammerHandler.resolve('http://example.com/')).toEqual([])
    })

    it('should return the blog feeds for a blog page', () => {
      const value = 'http://alice.is-programmer.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.is-programmer.com/posts.rss',
          hint: { key: 'is-programmer:posts', label: 'Posts' },
        },
        {
          uri: 'http://alice.is-programmer.com/comments.rss',
          hint: { key: 'is-programmer:comments', label: 'Comments' },
        },
        {
          uri: 'http://alice.is-programmer.com/messages.rss',
          hint: { key: 'is-programmer:messages', label: 'Messages' },
        },
        {
          uri: 'http://alice.is-programmer.com/site.rss',
          hint: { key: 'is-programmer:site', label: 'Site' },
        },
      ]

      expect(isProgrammerHandler.resolve(value)).toEqual(expected)
    })

    it('should return http feeds for an https page', () => {
      const value = 'https://alice.is-programmer.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.is-programmer.com/posts.rss',
          hint: { key: 'is-programmer:posts', label: 'Posts' },
        },
        {
          uri: 'http://alice.is-programmer.com/comments.rss',
          hint: { key: 'is-programmer:comments', label: 'Comments' },
        },
        {
          uri: 'http://alice.is-programmer.com/messages.rss',
          hint: { key: 'is-programmer:messages', label: 'Messages' },
        },
        {
          uri: 'http://alice.is-programmer.com/site.rss',
          hint: { key: 'is-programmer:site', label: 'Site' },
        },
      ]

      expect(isProgrammerHandler.resolve(value)).toEqual(expected)
    })

    it('should return the post comments feed and the blog feeds for a post page', () => {
      const value = 'http://alice.is-programmer.com/posts/12345.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.is-programmer.com/posts/12345.rss',
          hint: { key: 'is-programmer:post-comments', label: 'Post comments' },
        },
        {
          uri: 'http://alice.is-programmer.com/posts.rss',
          hint: { key: 'is-programmer:posts', label: 'Posts' },
        },
        {
          uri: 'http://alice.is-programmer.com/comments.rss',
          hint: { key: 'is-programmer:comments', label: 'Comments' },
        },
        {
          uri: 'http://alice.is-programmer.com/messages.rss',
          hint: { key: 'is-programmer:messages', label: 'Messages' },
        },
        {
          uri: 'http://alice.is-programmer.com/site.rss',
          hint: { key: 'is-programmer:site', label: 'Site' },
        },
      ]

      expect(isProgrammerHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the post comments key for a post comments feed', () => {
      const value = 'http://joe.is-programmer.com/posts/17753.rss'
      const expected = 'is-programmer:post-comments'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a posts feed', () => {
      const value = 'http://baudelaire.is-programmer.com/posts.rss'
      const expected = 'is-programmer:posts'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the comments key for a comments feed', () => {
      const value = 'http://baudelaire.is-programmer.com/comments.rss'
      const expected = 'is-programmer:comments'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the messages key for a messages feed', () => {
      const value = 'http://baudelaire.is-programmer.com/messages.rss'
      const expected = 'is-programmer:messages'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the site key for a site feed', () => {
      const value = 'http://baudelaire.is-programmer.com/site.rss'
      const expected = 'is-programmer:site'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the post comments key for a feed from a mixed-case host', () => {
      const value = 'http://Joe.is-programmer.com/posts/17753.rss'
      const expected = 'is-programmer:post-comments'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'http://joe.is-programmer.com/posts/17753.html'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog home page', () => {
      const value = 'http://joe.is-programmer.com/'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex domain', () => {
      const value = 'http://is-programmer.com/posts.rss'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a host below a blog subdomain', () => {
      const value = 'http://blog.joe.is-programmer.com/posts.rss'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'http://joe.example.com/posts.rss'

      expect(isProgrammerHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://joe.is-programmer.com/posts/17753.rss',
        { key: 'is-programmer:post-comments', label: 'Post comments' },
      ],
      [
        'http://shaobinli.is-programmer.com/posts/409.rss',
        { key: 'is-programmer:post-comments', label: 'Post comments' },
      ],
      [
        'http://baudelaire.is-programmer.com/posts.rss',
        { key: 'is-programmer:posts', label: 'Posts' },
      ],
      [
        'http://baudelaire.is-programmer.com/comments.rss',
        { key: 'is-programmer:comments', label: 'Comments' },
      ],
      [
        'http://baudelaire.is-programmer.com/messages.rss',
        { key: 'is-programmer:messages', label: 'Messages' },
      ],
      [
        'http://baudelaire.is-programmer.com/site.rss',
        { key: 'is-programmer:site', label: 'Site' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [isProgrammerHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
