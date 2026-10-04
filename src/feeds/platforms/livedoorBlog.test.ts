import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { LivedoorBlogUrl } from './livedoorBlog.js'
import { livedoorBlogHandler, parseLivedoorBlogUrl } from './livedoorBlog.js'

describe('parseLivedoorBlogUrl', () => {
  const blogUrls = [
    'https://example.blog.jp/',
    'https://example.doorblog.jp/',
    'https://example.ldblog.jp/',
    'https://example.livedoor.biz/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl(url)).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/12345678.html')).toEqual(expected)
  })

  it('should return the blog and category for a category page', () => {
    const expected: LivedoorBlogUrl = { kind: 'category', blog: 'example', category: '184845' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/cat_184845.html')).toEqual(
      expected,
    )
  })

  it('should return the category for a category page with capitalized route words', () => {
    const expected: LivedoorBlogUrl = { kind: 'category', blog: 'example', category: '184845' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/Archives/Cat_184845.html')).toEqual(
      expected,
    )
  })

  it('should return the blog when the category id runs into letters', () => {
    const expected: LivedoorBlogUrl = { kind: 'blog', blog: 'example' }

    expect(parseLivedoorBlogUrl('https://example.blog.jp/archives/cat_184845x.html')).toEqual(
      expected,
    )
  })

  it('should return undefined for the apex domain', () => {
    expect(parseLivedoorBlogUrl('https://blog.jp/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseLivedoorBlogUrl('https://www.example.blog.jp/')).toBeUndefined()
  })

  it('should return undefined for a host ending in blog.jp without the dot', () => {
    expect(parseLivedoorBlogUrl('https://example.hatenablog.jp/')).toBeUndefined()
  })

  it('should return undefined for blog.livedoor.jp', () => {
    expect(parseLivedoorBlogUrl('https://blog.livedoor.jp/example/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLivedoorBlogUrl('not-a-url')).toBeUndefined()
  })
})

describe('livedoorBlogHandler', () => {
  describe('match', () => {
    it('should match a Livedoor Blog URL', () => {
      expect(livedoorBlogHandler.match('https://example.livedoor.biz/')).toBe(true)
    })

    it('should not match the apex domain', () => {
      expect(livedoorBlogHandler.match('https://livedoor.biz/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RDF and Atom feeds for blog', () => {
      const value = 'https://example.doorblog.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.doorblog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.doorblog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feeds for an http page', () => {
      const value = 'http://example.ldblog.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ldblog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.ldblog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category and posts feeds for category page', () => {
      const value = 'https://example.blog.jp/archives/cat_184845.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blog.jp/archives/cat_184845.xml',
          hint: { key: 'livedoor-blog:category', label: 'Category', format: 'rdf' },
        },
        {
          uri: 'https://example.blog.jp/index.rdf',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.blog.jp/atom.xml',
          hint: { key: 'livedoor-blog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(livedoorBlogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the apex domain', () => {
      expect(livedoorBlogHandler.resolve('https://blog.jp/')).toEqual([])
    })
  })
})
