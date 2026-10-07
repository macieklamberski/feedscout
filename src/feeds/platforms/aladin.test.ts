import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type AladinUrl, aladinHandler, parseAladinUrl } from './aladin.js'

describe('parseAladinUrl', () => {
  it('should return the blog for a blog home', () => {
    const expected: AladinUrl = { kind: 'blog', username: 'alice' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/alice')).toEqual(expected)
  })

  it('should return the blog for a numeric user', () => {
    const expected: AladinUrl = { kind: 'blog', username: '712345678' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/712345678/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: AladinUrl = { kind: 'blog', username: 'alice' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/alice/12345678')).toEqual(expected)
  })

  it('should return the blog for the subscribe page', () => {
    const expected: AladinUrl = { kind: 'blog', username: 'alice' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/alice/subscript')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const expected: AladinUrl = { kind: 'category', username: 'alice', categoryId: '12345678' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/alice/category/12345678')).toEqual(expected)
  })

  it('should return the category for a category page with a list type', () => {
    const expected: AladinUrl = { kind: 'category', username: 'alice', categoryId: '12345678' }
    const value = 'https://blog.aladin.co.kr/alice/category/12345678?communitytype=MyPaper'

    expect(parseAladinUrl(value)).toEqual(expected)
  })

  it('should return the category for a capitalized category segment', () => {
    const expected: AladinUrl = { kind: 'category', username: 'alice', categoryId: '12345678' }
    const value = 'https://blog.aladin.co.kr/alice/Category/12345678?CommunityType=AllView&page=2'

    expect(parseAladinUrl(value)).toEqual(expected)
  })

  it('should return the blog for a category path without an id', () => {
    const expected: AladinUrl = { kind: 'blog', username: 'alice' }

    expect(parseAladinUrl('https://blog.aladin.co.kr/alice/category/abc')).toEqual(expected)
  })

  const siteWidePaths = [
    'https://blog.aladin.co.kr/',
    'https://blog.aladin.co.kr/bookple/js/book.js',
    'https://blog.aladin.co.kr/bp/alice',
    'https://blog.aladin.co.kr/js/common.js',
    'https://blog.aladin.co.kr/MyBlog/manage/main',
    'https://blog.aladin.co.kr/myblog/newPaper/MyPaper',
    'https://blog.aladin.co.kr/ScriptResource.axd?d=abc',
    'https://blog.aladin.co.kr/town/contents/review',
    'https://blog.aladin.co.kr/trackback/alice/12345678',
    'https://blog.aladin.co.kr/ucl_editor/css/paperview.css',
    'https://blog.aladin.co.kr/WebResource.axd?d=abc',
  ]

  it.each(siteWidePaths)('should return undefined for site-wide path %s', (value) => {
    expect(parseAladinUrl(value)).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseAladinUrl('https://www.blog.aladin.co.kr/alice')).toBeUndefined()
  })

  it('should return undefined for the bookstore host', () => {
    expect(parseAladinUrl('https://www.aladin.co.kr/alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAladinUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('aladinHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(aladinHandler.match('https://blog.aladin.co.kr/alice')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(aladinHandler.match('https://blog.aladin.co.kr/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(aladinHandler.resolve('https://example.com/alice')).toEqual([])
    })

    it('should return the blog feed for a blog page', () => {
      const value = 'https://blog.aladin.co.kr/alice/12345678'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.aladin.co.kr/alice/rss',
          hint: { key: 'aladin:posts', label: 'Posts' },
        },
      ]

      expect(aladinHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category feed before the blog feed for a category page', () => {
      const value = 'https://blog.aladin.co.kr/alice/category/12345678?communitytype=MyList'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.aladin.co.kr/alice/category/12345678/rss',
          hint: { key: 'aladin:category', label: 'Category' },
        },
        {
          uri: 'https://blog.aladin.co.kr/alice/rss',
          hint: { key: 'aladin:posts', label: 'Posts' },
        },
      ]

      expect(aladinHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the user as the page alternate link does', () => {
      const value = 'https://blog.aladin.co.kr/ALICE/category/12345678'
      const content =
        '<link rel="alternate" type="application/rss+xml" href="https://blog.aladin.co.kr/alice/rss">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.aladin.co.kr/alice/category/12345678/rss',
          hint: { key: 'aladin:category', label: 'Category' },
        },
        {
          uri: 'https://blog.aladin.co.kr/alice/rss',
          hint: { key: 'aladin:posts', label: 'Posts' },
        },
      ]

      expect(aladinHandler.resolve(value, content)).toEqual(expected)
    })

    it('should keep the url spelling when the page links no blog feed', () => {
      const value = 'https://blog.aladin.co.kr/ALICE'
      const content = '<link rel="alternate" href="https://blog.aladin.co.kr/bob/rss">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.aladin.co.kr/ALICE/rss',
          hint: { key: 'aladin:posts', label: 'Posts' },
        },
      ]

      expect(aladinHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
