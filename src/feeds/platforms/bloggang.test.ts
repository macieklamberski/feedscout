import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BloggangUrl, bloggangHandler, parseBloggangUrl } from './bloggang.js'

describe('parseBloggangUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: BloggangUrl = { kind: 'blog', username: 'gonga' }

    expect(parseBloggangUrl('https://gonga.bloggang.com/')).toEqual(expected)
  })

  it('should return the blog for a subdomain with an underscore', () => {
    const expected: BloggangUrl = { kind: 'blog', username: 'granmy_home' }

    expect(parseBloggangUrl('https://granmy_home.bloggang.com/')).toEqual(expected)
  })

  it('should return the blog for the blog page on www', () => {
    const value = 'https://www.bloggang.com/mainblog.php?id=gonga'
    const expected: BloggangUrl = { kind: 'blog', username: 'gonga' }

    expect(parseBloggangUrl(value)).toEqual(expected)
  })

  it('should return the blog for the blog page on the bare domain', () => {
    const value = 'https://bloggang.com/mainblog.php?id=gonga'
    const expected: BloggangUrl = { kind: 'blog', username: 'gonga' }

    expect(parseBloggangUrl(value)).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const value = 'https://www.bloggang.com/viewblog.php?id=gonga&date=25-11-2007&group=1&gblog=3'
    const expected: BloggangUrl = { kind: 'post', username: 'gonga' }

    expect(parseBloggangUrl(value)).toEqual(expected)
  })

  it('should return the diary for a diary page', () => {
    const value = 'https://www.bloggang.com/viewdiary.php?id=gonga&group=1'
    const expected: BloggangUrl = { kind: 'diary', username: 'gonga' }

    expect(parseBloggangUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www home page', () => {
    expect(parseBloggangUrl('https://www.bloggang.com/')).toBeUndefined()
  })

  it('should return undefined for the mobile portal', () => {
    expect(parseBloggangUrl('https://m.bloggang.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseBloggangUrl('https://a.gonga.bloggang.com/')).toBeUndefined()
  })

  it('should return undefined for another script with an id', () => {
    expect(parseBloggangUrl('https://www.bloggang.com/follow.php?id=gonga')).toBeUndefined()
  })

  it('should return undefined for a blog script under another path', () => {
    const value = 'https://www.bloggang.com/admin/mainblog.php?id=gonga'

    expect(parseBloggangUrl(value)).toBeUndefined()
  })

  it('should return undefined for a blog page without an id', () => {
    expect(parseBloggangUrl('https://www.bloggang.com/mainblog.php')).toBeUndefined()
  })

  it('should return undefined for an id that is not a hostname label', () => {
    const value = 'https://www.bloggang.com/mainblog.php?id=gonga.example.com/x'

    expect(parseBloggangUrl(value)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBloggangUrl('https://example.com/mainblog.php?id=gonga')).toBeUndefined()
  })
})

describe('bloggangHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://akarapat.bloggang.com/'],
      [true, 'https://www.bloggang.com/mainblog.php?id=akarapat'],
      [false, 'https://www.bloggang.com/'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(bloggangHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Bloggang', () => {
      expect(bloggangHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for a blog subdomain', () => {
      const value = 'https://gonga.bloggang.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gonga.bloggang.com/rss',
          hint: { key: 'bloggang:posts', label: 'Posts' },
        },
      ]

      expect(bloggangHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts feed for a post page on www', () => {
      const value = 'https://www.bloggang.com/viewblog.php?id=gonga&date=25-11-2007&group=1&gblog=3'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gonga.bloggang.com/rss',
          hint: { key: 'bloggang:posts', label: 'Posts' },
        },
      ]

      expect(bloggangHandler.resolve(value)).toEqual(expected)
    })
  })
})
