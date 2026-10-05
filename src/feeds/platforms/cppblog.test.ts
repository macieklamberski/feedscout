import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should return undefined for a site directory', () => {
    expect(parseCppblogUrl('http://www.cppblog.com/AggSite/')).toBeUndefined()
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
  })
})
