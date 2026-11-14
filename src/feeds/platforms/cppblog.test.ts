import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CppblogUrl, cppblogHandler, parseCppblogUrl } from './cppblog.js'

describe('parseCppblogUrl', () => {
  it('should return the blog for a blog home', () => {
    const expected: CppblogUrl = { kind: 'blog', username: 'alice' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: CppblogUrl = { kind: 'blog', username: 'alice' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/archive/2013/06/13/34178.html')).toEqual(
      expected,
    )
  })

  it('should return the blog on the apex host', () => {
    const expected: CppblogUrl = { kind: 'blog', username: 'alice' }

    expect(parseCppblogUrl('http://cppblog.com/alice/')).toEqual(expected)
  })

  it('should keep the case of the username', () => {
    const expected: CppblogUrl = { kind: 'blog', username: 'AliceCode' }

    expect(parseCppblogUrl('http://www.cppblog.com/AliceCode/')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const expected: CppblogUrl = { kind: 'category', username: 'alice', categoryId: '5356' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/category/5356.html')).toEqual(expected)
  })

  it('should return the category for a capitalized route word', () => {
    const expected: CppblogUrl = { kind: 'category', username: 'alice', categoryId: '5356' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/Category/5356.html')).toEqual(expected)
  })

  it('should return the favorite for a favorite page', () => {
    const expected: CppblogUrl = { kind: 'favorite', username: 'alice', favoriteId: '1914' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/favorite/1914.html')).toEqual(expected)
  })

  it('should return the blog for a month archive', () => {
    const expected: CppblogUrl = { kind: 'blog', username: 'alice' }

    expect(parseCppblogUrl('http://www.cppblog.com/alice/archive/2013/06.html')).toEqual(expected)
  })

  it('should return undefined for a site file', () => {
    expect(parseCppblogUrl('http://www.cppblog.com/login.aspx?ReturnURL=')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseCppblogUrl('http://www.cppblog.com/')).toBeUndefined()
  })

  it('should return undefined for another subdomain', () => {
    expect(parseCppblogUrl('http://m.cppblog.com/alice/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCppblogUrl('https://example.com/alice/')).toBeUndefined()
  })
})

describe('cppblogHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(cppblogHandler.match('http://www.cppblog.com/alice/')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(cppblogHandler.match('http://www.cppblog.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(cppblogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts and comments feeds for a blog', () => {
      const value = 'http://www.cppblog.com/alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return http feeds on the www host for an https apex page', () => {
      const value = 'https://cppblog.com/alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the user as the page links its feed', () => {
      const value = 'http://www.cppblog.com/alicecode/category/5356.html'
      const content =
        '<link id="RSSLink" rel="alternate" href="http://www.cppblog.com/AliceCode/rss.aspx" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/AliceCode/category/5356.html/rss',
          hint: { key: 'cppblog:category', label: 'Category' },
        },
        {
          uri: 'http://www.cppblog.com/AliceCode/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/AliceCode/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value, content)).toEqual(expected)
    })

    it('should follow the feed link when the URL is an alias of another blog', () => {
      const value = 'http://www.cppblog.com/aliasname/'
      const content =
        '<link id="RSSLink" rel="alternate" href="http://www.cppblog.com/alice/rss.aspx" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the category feed first for a category page', () => {
      const value = 'http://www.cppblog.com/alice/category/5356.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice/category/5356.html/rss',
          hint: { key: 'cppblog:category', label: 'Category' },
        },
        {
          uri: 'http://www.cppblog.com/alice/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the favorites feed first for a favorite page', () => {
      const value = 'http://www.cppblog.com/alice/favorite/1914.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice/favorite/1914.html/rss',
          hint: { key: 'cppblog:favorites', label: 'Favorites' },
        },
        {
          uri: 'http://www.cppblog.com/alice/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value)).toEqual(expected)
    })

    it('should escape a number sign in the user the feed link names', () => {
      const value = 'http://www.cppblog.com/alice'
      const content =
        '<link id="RSSLink" rel="alternate" href="http://www.cppblog.com/alice#b/rss.aspx" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.cppblog.com/alice%23b/rss.aspx',
          hint: { key: 'cppblog:posts', label: 'Posts' },
        },
        {
          uri: 'http://www.cppblog.com/alice%23b/CommentsRSS.aspx',
          hint: { key: 'cppblog:comments', label: 'Comments' },
        },
      ]

      expect(cppblogHandler.resolve(value, content)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts key for a posts feed', () => {
      const value = 'http://www.cppblog.com/alice/rss.aspx'
      const expected: DiscoverUriHint = { key: 'cppblog:posts', label: 'Posts' }

      expect(cppblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts key for a capitalized posts feed on the https apex', () => {
      const value = 'https://cppblog.com/alice/Rss.aspx'
      const expected: DiscoverUriHint = { key: 'cppblog:posts', label: 'Posts' }

      expect(cppblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the comments key for a comments feed', () => {
      const value = 'https://www.cppblog.com/alice/CommentsRSS.aspx'
      const expected: DiscoverUriHint = { key: 'cppblog:comments', label: 'Comments' }

      expect(cppblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category key for a category feed', () => {
      const value = 'http://cppblog.com/alice/category/5356.html/rss'
      const expected: DiscoverUriHint = { key: 'cppblog:category', label: 'Category' }

      expect(cppblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites key for a favorite feed', () => {
      const value = 'https://www.cppblog.com/alice/favorite/1914.html/rss'
      const expected: DiscoverUriHint = { key: 'cppblog:favorites', label: 'Favorites' }

      expect(cppblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a category page', () => {
      const value = 'http://www.cppblog.com/alice/category/5356.html'

      expect(cppblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the site feed', () => {
      const value = 'http://www.cppblog.com/rss.aspx'

      expect(cppblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another subdomain', () => {
      const value = 'http://m.cppblog.com/alice/rss.aspx'

      expect(cppblogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const posts: DiscoverUriHint = { key: 'cppblog:posts', label: 'Posts' }
    const comments: DiscoverUriHint = { key: 'cppblog:comments', label: 'Comments' }
    const category: DiscoverUriHint = { key: 'cppblog:category', label: 'Category' }
    const favorites: DiscoverUriHint = { key: 'cppblog:favorites', label: 'Favorites' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['http://www.cppblog.com/alice/rss.aspx', posts],
      ['https://cppblog.com/alice/Rss.aspx', posts],
      ['https://www.cppblog.com/alice/CommentsRSS.aspx', comments],
      ['http://cppblog.com/alice/category/5356.html/rss', category],
      ['https://www.cppblog.com/alice/favorite/1914.html/rss', favorites],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [cppblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
